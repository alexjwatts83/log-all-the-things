# Medicine Type Selector - Implementation Plan

## Overview

Add medicine-specific controls to the log form so users can record which medicine they took and
how many they took. Start with **Panadol Extra** and **Panadol Rapid**, default the quantity to `2`,
persist both values in the API, and show them in recent log entries.

---

## Goals

- Show a medicine selector only when the **Medicine** log type is active.
- Initially provide these options:
  - Panadol Extra
  - Panadol Rapid
- Allow the user to optionally select a medicine type before submitting a Medicine log.
- Show a quantity control for Medicine logs and default it to `2`.
- Require the Medicine quantity to be a positive whole number.
- Persist the selected medicine as its own field rather than placing it in description, details,
  or category.
- Persist the Medicine quantity as its own numeric field.
- Derive the Medicine description from the selected medicine type, falling back to `Medicine`.
- Return the medicine value from the API and display it in the recent-log list.
- Keep existing Food and Custom log behavior unchanged.
- Preserve existing SQLite data when the schema is updated.

## Non-Goals

- Medicine inventory or stock tracking.
- Dosage schedules, reminders, or notifications.
- A database-managed medicine catalogue in the first version.
- Editing existing log entries.
- Retrofitting a medicine value onto historical entries.

---

## Proposed Design

### API model

Add a nullable property to `LogEntry`:

```csharp
public string? MedicineName { get; set; }
public int? MedicineQuantity { get; set; }
```

Both properties remain nullable so existing rows and non-Medicine entries continue to work.

### API validation

For entries with `TypeId == 1` (Medicine):

- `MedicineName` may be null or empty when the user does not select a medicine type.
- When supplied, accept only values from the supported medicine allowlist.
- Return `400 Bad Request` for an unsupported non-empty value.
- `MedicineQuantity` defaults to `2` when omitted by a Medicine request.
- Reject Medicine quantities below `1` or values that are not whole numbers.
- Replace `Description` with the canonical medicine name, or `Medicine` when no type is selected.

For Food and Custom entries, ignore or clear medicine-specific values before persistence.

Initial allowlist:

```text
Panadol Extra
Panadol Rapid
```

The API must enforce this list; frontend validation alone is not sufficient.

### Frontend form

When `type === 'Medicine'`, render a `<select>` labelled **Medicine type**. Use a native select
rather than free text so values are consistent.

Also render a numeric input labelled **Quantity**:

```html
<input type="number" min="1" step="1" value="2" />
```

The quantity defaults to `2` whenever the form starts a new Medicine entry.

Hide the Description input for Medicine logs. Food and Custom logs continue to require it.

Default option:

```text
No medicine type selected
```

Reset the medicine selection and quantity (`2`) after a successful Medicine submission and when
appropriate as the active log type changes.

### Recent-log display

For Medicine entries, show the selected medicine and quantity as the primary metadata label, for
example **Panadol Extra x2**. When no medicine type was selected, show **Medicine x2**. Continue
using category, custom name, or `General` for other entry types.

---

## Database Compatibility

The API currently uses `Database.EnsureCreated()` and has no Entity Framework migrations.
`EnsureCreated()` does not add new columns to an existing `logs.db`, so changing only the C# model
would break existing databases with a missing-column error for `MedicineName` or
`MedicineQuantity`.

Recommended approach:

1. Introduce Entity Framework Core migrations for the current schema.
2. Add a migration containing nullable `MedicineName` and `MedicineQuantity` columns.
3. Replace `Database.EnsureCreated()` with `Database.Migrate()`.
4. Verify both scenarios:
   - A fresh database is created with all tables and seed data.
   - An existing database is upgraded without losing log entries.

Before applying the first migration to an existing database created by `EnsureCreated()`, account
for the fact that it has no migration history. Use a tested baseline/adoption strategy rather than
assuming EF can replay the initial schema migration over existing tables.

Fallback for this small local-only app: run an idempotent SQLite command at startup:

```sql
ALTER TABLE LogEntries ADD COLUMN MedicineName TEXT NULL;
ALTER TABLE LogEntries ADD COLUMN MedicineQuantity INTEGER NULL;
```

Only run it when `PRAGMA table_info('LogEntries')` confirms the column is absent. This is less
scalable than migrations but preserves the current lightweight database setup.

Decision required before implementation: **EF migrations (preferred)** or **idempotent startup
schema update (smallest change)**.

---

## Implementation Checklist

### Phase 1 - Data and API

- [x] Choose the SQLite upgrade strategy (idempotent startup schema update).
- [x] Back up or copy an existing `logs.db` for upgrade testing.
- [x] Add nullable `MedicineName` to `Models/LogEntry.cs`.
- [x] Add nullable `MedicineQuantity` to `Models/LogEntry.cs`.
- [x] Add a central supported-medicine allowlist in the API.
- [x] Validate `MedicineName` when `TypeId == 1`.
- [x] Default a missing Medicine quantity to `2`.
- [x] Validate that a Medicine quantity is a positive whole number.
- [x] Clear medicine-specific values for Food and Custom entries.
- [x] Normalize accepted values to their canonical display spelling.
- [x] Update the SQLite schema without deleting existing data.
- [x] Confirm fresh database creation still seeds Medicine, Food, and Custom types.

### Phase 2 - Frontend form

- [x] Add the supported medicine options in one named frontend constant.
- [x] Add `medicineName` state to `LogForm.jsx`.
- [x] Add `medicineQuantity` state with an initial value of `2`.
- [x] Render the **Medicine type** selector only for Medicine logs.
- [x] Include a default **No medicine type selected** option.
- [x] Keep the selector optional for Medicine submissions.
- [x] Render a Medicine-only numeric **Quantity** input with minimum `1` and step `1`.
- [x] Include `medicineName` in the form payload.
- [x] Include `medicineQuantity` in the form payload.
- [x] Reset the medicine selection and quantity (`2`) after submission.
- [x] Add `MedicineName` to the request body in `api.js`.
- [x] Add `MedicineQuantity` to the request body in `api.js`.
- [x] Preserve Food and Custom payload behavior.
- [x] Hide Description for Medicine while keeping it required for Food and Custom.

### Phase 3 - Log display

- [x] Display the selected medicine and quantity on Medicine log cards.
- [x] Provide a sensible fallback for historical Medicine rows with no medicine value.
- [x] Provide a sensible fallback for historical Medicine rows with no quantity.
- [x] Confirm category and custom-name labels still display for other log types.

### Phase 4 - Documentation

- [x] Update the API README model and POST examples with `medicineName` and `medicineQuantity`.
- [x] Update the web README with Medicine selector behavior and option maintenance.
- [x] Document how to add another supported medicine in both API and frontend lists.

### Phase 5 - Validation

- [x] Build the API project.
- [x] Build the web project.
- [x] Start both services through the Dev Launcher.
- [x] Create a Panadol Extra entry and verify it persists after refresh.
- [x] Create a Panadol Rapid entry and verify it persists after refresh.
- [x] Verify the Medicine quantity initially displays `2`.
- [x] Create a Medicine entry with a quantity other than `2` and verify it persists.
- [x] Create a Medicine entry without selecting a medicine type and verify it succeeds.
- [x] Verify Medicine derives its description from the selected type or falls back to `Medicine`.
- [x] Verify Food and Custom still require a description.
- [x] Verify the API rejects an unsupported medicine value.
- [x] Verify the API rejects zero, negative, and fractional Medicine quantities.
- [x] Create Food and Custom entries to check medicine-field clearing and regressions.
- [x] Upgrade an existing SQLite database and verify old entries remain readable.
- [x] Create a fresh SQLite database and verify startup and seed data.

---

## Suggested API Request

```json
{
  "typeId": 1,
  "medicineName": "Panadol Extra",
  "medicineQuantity": 2,
  "details": "With water",
  "category": "Headache",
  "customName": null
}
```

## Expected Validation Response

Unsupported non-empty medicine type:

```json
{
  "error": "Unsupported medicine type."
}
```

Invalid Medicine quantity:

```json
{
  "error": "Medicine quantity must be a positive whole number."
}
```

---

## Files Expected to Change

```text
src/LogAllTheThings.Api/
  Controllers/LogsController.cs
  Models/LogEntry.cs
  Program.cs or Migrations/
  README.md

src/LogAllTheThings.Web/
  src/api.js
  src/components/LogForm.jsx
  src/components/LogList.jsx
  README.md
```

---

## Completion Criteria

The feature is complete when selecting **Medicine** reveals an optional medicine-type dropdown and
a quantity control defaulting to `2`; a user can choose **Panadol Extra**, **Panadol Rapid**, or no
medicine type and enter a positive whole-number quantity; the API persists both values; the recent
log list displays them; and both fresh and existing SQLite databases work without data loss.
