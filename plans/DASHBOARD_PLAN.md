# Dashboard Implementation Plan

> **Implemented:** The version 1 client-side dashboard described here is complete. The scaling
> threshold and server-side aggregation section remain future guidance rather than active work.

## Overview

Add a dashboard to Log All The Things that summarizes Medicine, Food, and Custom activity without
removing the current create, edit, and delete workflows. The first version will calculate dashboard
metrics from the existing `GET /api/logs` response so it can ship without a database migration or a
new API contract.

The dashboard is intended for quick personal review: what was logged, when activity occurred, and
which medicine or event types were most common.

---

## Goals

- Make recent activity understandable without reading every log card.
- Show totals and trends for a selectable time range.
- Keep logging a new event fast from desktop and mobile.
- Keep Edit and Delete available from the dashboard's recent-log view.
- Recalculate every metric immediately after a log is created, updated, or deleted.
- Provide useful empty, loading, and error states.
- Preserve the existing API and SQLite schema for the first version.
- Work in the browser, WPF launcher, and Capacitor Android app.

## Non-Goals

- User accounts or multiple profiles.
- Medical advice, dosage recommendations, or adherence scoring.
- Notifications, schedules, or reminders.
- Inventory management.
- Comparing data across users.
- Server-side aggregation in the first version.
- Exporting reports in the first version.

---

## Product Decisions

### Navigation

Add two top-level views:

- **Dashboard**: summaries, charts, filters, and recent activity.
- **Add log**: the existing Medicine, Food, and Custom entry form.

Default to **Dashboard** when logs exist. Default to **Add log** for a new empty database so the
first useful action remains obvious. After a successful create, remain on the current view and
update dashboard data in memory.

On desktop, use a compact tab or segmented control below the application header. On mobile, keep
both options visible and full-width enough for touch use. Do not create a marketing-style landing
page or card-based navigation screen.

### Time range

Provide one segmented time-range control:

- 7 days
- 30 days (default)
- 90 days
- All time

Use the user's local timezone for day boundaries and display. Store and transmit timestamps in UTC,
as the application does now.

### Dashboard sections

1. **Summary metrics**
   - Total logs in range.
   - Medicine quantity in range.
   - Active days in range.
   - Most logged type.
2. **Activity trend**
   - Daily count of all logs.
   - Stacked or grouped by Medicine, Food, and Custom when space allows.
3. **Type breakdown**
   - Count and percentage for Medicine, Food, and Custom.
4. **Medicine summary**
   - Total quantity by supported medicine.
   - Number of medicine log events.
   - Hidden when the selected range has no Medicine entries.
5. **Recent activity**
   - Filterable list of logs in the selected range.
   - Type filter: All, Medicine, Food, Custom.
   - Reuse existing edit and confirmed-delete behavior.

Avoid nested cards. Summary metrics may use four compact repeated metric tiles; charts and recent
activity should be unframed page sections separated by spacing or rules.

---

## Metric Definitions

All calculations operate on logs whose local timestamp falls inside the selected range.

| Metric | Definition |
| --- | --- |
| Total logs | Number of filtered log entries |
| Medicine quantity | Sum of `medicineQuantity`; historical null values count as `0` |
| Active days | Number of distinct local calendar dates containing at least one log |
| Most logged type | Type with the highest event count; ties display `Tied` |
| Daily activity | Event count grouped by local calendar date and type |
| Type percentage | Type count divided by total logs in range |
| Medicine events | Number of Medicine entries, independent of quantity |
| Quantity by medicine | Sum of quantity grouped by canonical `medicineName` |

Historical Medicine rows without `medicineName` should group under **Unknown medicine**. Unknown
`TypeId` values should group under **Other** rather than disappearing from totals.

For 7, 30, and 90 day views, include days with zero activity in the trend series. For All time,
start at the first entry and aggregate by day until 90 days; if the span is longer, aggregate by
week to keep the chart readable.

---

## Data and State Design

### Existing source of truth

Keep `logs` in `App.jsx` as the single client-side source of truth. The current create, update, and
delete handlers already replace this state after successful API calls, so dashboard values can be
derived from it without additional fetches.

### New state

Add:

- `activeView`: `dashboard` or `add`.
- `timeRange`: `7`, `30`, `90`, or `all`.
- `typeFilter`: `all`, `1`, `2`, or `3`.

Do not persist these controls initially. Resetting to defaults after a reload is acceptable.

### Derived data

Create pure utilities in `src/dashboardMetrics.js` rather than embedding calculations in React
components. Suggested functions:

```text
filterLogsByRange(logs, range, now)
buildSummaryMetrics(logs)
buildDailySeries(logs, range, now)
buildTypeBreakdown(logs)
buildMedicineSummary(logs)
```

Pass `now` into range utilities so date-boundary tests are deterministic. Keep these helpers free of
React and browser APIs except standard `Date` operations.

For the current data size, calculate derived values during render. Do not add `useMemo` unless
profiling demonstrates a need or the repository adopts React Compiler guidance requiring it.

---

## Frontend Design

### Components

Add:

```text
src/components/dashboard/
  Dashboard.jsx          Coordinates filters and dashboard sections
  SummaryMetrics.jsx     Four compact metrics
  ActivityChart.jsx      Daily activity visualization
  TypeBreakdown.jsx      Counts and percentages by type
  MedicineSummary.jsx    Quantity and event totals by medicine
  TimeRangeControl.jsx   7/30/90/All segmented control
```

Refactor `LogList.jsx` only enough to accept a filtered log collection and an optional display limit.
Keep editing and deletion owned by `LogList` in the first version to avoid widening the CRUD change.

### Charts

Use Recharts for the activity visualization rather than hand-building chart scales and interaction.
Add `recharts` to the web project dependencies. Use its responsive container and accessible labels.

Desktop:

- Summary metrics in a four-column row.
- Activity trend as the primary wide visualization.
- Type breakdown and medicine summary in a two-column supporting row.
- Recent activity below.

Mobile:

- Summary metrics in a stable two-column grid.
- Charts become single-column and preserve a minimum readable height.
- Avoid horizontal scrolling for the page.
- Show chart tooltips on tap/focus as well as hover.

### Visual language

Extend the existing design rather than replacing it. Use restrained semantic colors consistently:
Medicine, Food, and Custom must have distinct colors that also work with text labels and patterns.
Do not rely on color alone to identify a series. Keep section headings compact and avoid oversized
hero typography.

### Accessibility

- Use real buttons for view, time-range, and type-filter controls.
- Expose selected state with `aria-pressed` or tab semantics.
- Give charts an accessible summary or data table fallback.
- Maintain visible keyboard focus.
- Ensure text and chart colors meet WCAG AA contrast.
- Announce loading/errors through an appropriate live region.
- Preserve confirmation before deletion.

---

## API Strategy

### Version 1

No API changes are required. Continue using:

```text
GET /api/logs
```

The frontend filters and aggregates the returned collection.

### Scaling threshold

Introduce server-side filtering and aggregation when either condition becomes true:

- Typical responses exceed 5,000 entries.
- Dashboard load or recalculation becomes visibly slow on target Android devices.

At that point, add optional UTC query parameters to `GET /api/logs`:

```text
GET /api/logs?from=2026-07-18T00:00:00Z&to=2026-08-17T00:00:00Z&typeId=1
```

Then add a dedicated summary endpoint:

```text
GET /api/logs/dashboard?from=...&to=...
```

The endpoint should return summary metrics and chart-ready buckets, not expose EF query details.
Add database indexes on `Timestamp` and, if needed, `(TypeId, Timestamp)` with a tested SQLite
upgrade step.

---

## Error, Loading, and Empty States

- **Initial loading**: show stable skeleton rows or reserved dashboard regions; do not flash zeroes.
- **API failure**: show one actionable message with a Retry button.
- **No logs at all**: show a concise empty state and an **Add first log** action.
- **No logs in range**: retain the range control and show **No activity in this period**.
- **No Medicine data**: omit Medicine summary rather than displaying misleading zero dosage data.
- **Mutation failure**: keep the current record and dashboard values unchanged, then show the error.

---

## Implementation Phases

### Phase 1 - Metrics foundation

- [ ] Define type names/colors in one shared frontend module instead of duplicating TypeId mapping.
- [ ] Add deterministic range filtering utilities.
- [ ] Add summary, daily series, type breakdown, and medicine aggregation utilities.
- [ ] Add unit tests for every metric and range boundary.
- [ ] Cover null medicine fields, unknown types, ties, empty input, and invalid timestamps.

### Phase 2 - Dashboard shell

- [ ] Add Dashboard/Add log view navigation to `App.jsx`.
- [ ] Add time-range state with 30 days as the default.
- [ ] Add dashboard empty, loading, error, and retry states.
- [ ] Preserve current create/update/delete handlers as the single mutation path.
- [ ] Confirm dashboard values update immediately after each successful mutation.

### Phase 3 - Summary and charts

- [ ] Install Recharts.
- [ ] Build the four summary metrics.
- [ ] Build the daily activity chart with zero-filled dates.
- [ ] Build the type breakdown with count and percentage labels.
- [ ] Build the medicine quantity/event summary.
- [ ] Add accessible summaries for visualizations.

### Phase 4 - Recent activity

- [ ] Add All/Medicine/Food/Custom filtering.
- [ ] Reuse `LogList` for filtered recent activity.
- [ ] Keep inline Edit and confirmed Delete functional.
- [ ] Limit the dashboard view to the newest 20 matching entries initially.
- [ ] Add a clear path to show all matching entries.

### Phase 5 - Responsive polish

- [ ] Verify desktop layouts at 1280px and 1440px widths.
- [ ] Verify mobile layouts at 360px, 390px, and 412px widths.
- [ ] Ensure charts resize without clipping labels or tooltips.
- [ ] Ensure controls and card text do not overlap at large text sizes.
- [ ] Test keyboard-only navigation and visible focus.
- [ ] Test the dashboard in the WPF WebView2 tab.
- [ ] Test the dashboard in a Capacitor Android build or Android emulator.

### Phase 6 - Documentation

- [ ] Update the root README with dashboard capabilities.
- [ ] Update the web README with component structure and metric definitions.
- [ ] Document the client-side aggregation limit and future API path.

---

## Test Plan

### Unit tests

Add a frontend test runner only if one is not already present. Prefer Vitest for the Vite project.
Test:

- Range boundaries at local midnight.
- Daylight-saving transitions where applicable.
- Seven-, thirty-, and ninety-day zero-filled series.
- All-time daily-to-weekly bucket transition.
- Quantity sums with null values.
- Most-common-type ties.
- Unknown type and medicine fallbacks.
- Input arrays are not mutated.

### Component tests

- Dashboard shows loading, error, empty, and populated states.
- Changing time range changes all sections consistently.
- Changing type filter affects recent activity only, unless explicitly designed otherwise.
- Create, update, and delete recalculate visible metrics.
- Edit and Delete remain keyboard operable.

### Browser tests

Use Playwright to verify:

1. Create Medicine, Food, and Custom logs with controlled timestamps.
2. Confirm summary totals and medicine quantities.
3. Change from 30 days to 7 days and verify exclusions.
4. Edit a Medicine quantity and verify the summary changes.
5. Delete an entry and verify totals, chart, and recent activity change.
6. Reload and verify the dashboard matches persisted API data.
7. Capture desktop and mobile screenshots and inspect for clipping or overlap.

### API regression tests

Even though version 1 adds no endpoints, verify existing GET, POST, PUT, and DELETE behavior remains
unchanged because the dashboard depends on their response consistency.

---

## Acceptance Criteria

- Dashboard is the default populated-state view and Add log remains one action away.
- A user can select 7, 30, 90 days, or All time.
- All metrics use the same selected time range and local date boundaries.
- Total logs, medicine quantity, active days, and most logged type are correct.
- Activity trend includes zero-activity dates for fixed ranges.
- Medicine totals are grouped by medicine name and sum quantities correctly.
- Recent activity can be filtered by log type.
- Editing or deleting a log updates every affected dashboard section without a reload.
- Creating a log updates the dashboard without a second API fetch.
- Empty, loading, and API error states are clear and actionable.
- No UI overlap occurs at supported desktop/mobile widths or 200% text zoom.
- Existing browser, WPF launcher, and Android packaging builds still pass.

---

## Expected Files to Change

```text
src/LogAllTheThings.Web/package.json
src/LogAllTheThings.Web/package-lock.json
src/LogAllTheThings.Web/src/App.jsx
src/LogAllTheThings.Web/src/api.js                 (only if shared type helpers move)
src/LogAllTheThings.Web/src/dashboardMetrics.js
src/LogAllTheThings.Web/src/logTypes.js
src/LogAllTheThings.Web/src/style.css
src/LogAllTheThings.Web/src/components/LogList.jsx
src/LogAllTheThings.Web/src/components/dashboard/*
src/LogAllTheThings.Web/src/**/*.test.js
README.md
src/LogAllTheThings.Web/README.md
```

No API, model, database, or schema files should change for version 1 unless implementation testing
shows that loading the complete history is already too expensive.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Local timezone boundaries produce incorrect days | Centralize date bucketing and test midnight/DST cases |
| Charts are unreadable on phones | Use responsive dimensions, fewer ticks, and accessible text summaries |
| Metrics diverge after CRUD actions | Derive all sections from the single `logs` state |
| Full-history response grows too large | Use the documented 5,000-entry threshold and server aggregation path |
| Medicine quantity is mistaken for medical guidance | Label it as logged quantity only; do not score or recommend dosage |
| Added chart dependency increases APK size | Record bundle-size delta and keep only one chart library |

---

## Recommended Delivery Order

Deliver the dashboard in two reviewable commits:

1. **Dashboard metrics and tests**: shared type definitions, pure aggregation utilities, and unit tests.
2. **Dashboard interface**: navigation, metrics, charts, filters, responsive styles, browser tests, and
   documentation.

This separates calculation correctness from visual implementation and makes regressions easier to
locate.
