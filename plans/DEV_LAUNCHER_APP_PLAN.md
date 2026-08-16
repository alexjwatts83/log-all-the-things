# Dev Launcher App - Project Plan

## Project Overview
A small desktop control panel for this repository that lets a developer start and stop the
LogAllTheThings stack (API + web) with buttons, and streams the live console output of those
processes into a log panel in the UI.

Replaces the manual workflow of running `scripts/start.ps1` and `scripts/stop.ps1` in a terminal.

---

## Goals

- One **Start** button and one **Stop** button per service (API, Web), plus **Start All** / **Stop All**.
- Live status indicator per service: `Stopped`, `Starting`, `Running`, `Stopping`, `Crashed`.
- Log panel that streams stdout/stderr from each process in real time.
- Log panel supports: filter by service, filter by text, clear, auto-scroll toggle, save to file.
- Closing the app cleanly stops every child process it started.

## Non-Goals

- Remote/production deployment control. Local developer tool only.
- Arbitrary command execution — services come from a fixed list in code.
- Multi-user support or authentication.

---

## Technology Stack

A desktop app is the right shape for this: it drives local processes directly with no HTTP server,
no browser, and no network surface to defend.

### Option A (recommended): WPF on .NET 8
- **UI**: WPF, XAML, MVVM (`CommunityToolkit.Mvvm` for `ObservableObject` / `RelayCommand`)
- **Process control**: `System.Diagnostics.Process` with redirected stdout/stderr
- **Why**: Same .NET toolchain as the existing API, mature, and data binding makes a live,
  colour-coded log list straightforward.
- **Trade-off**: Windows-only. Acceptable — the existing scripts are PowerShell and Windows-first.

### Option B: Avalonia UI on .NET 8
- Same MVVM model as WPF, but cross-platform (Windows/macOS/Linux).
- **Why**: Pick this if anyone on the team develops on macOS or Linux.
- **Trade-off**: Extra dependency, smaller ecosystem than WPF.

### Option C: WinUI 3 / Windows App SDK
- The newest Microsoft desktop stack, Fluent styling out of the box.
- **Trade-off**: Heavier packaging/deployment story and more churn than WPF for what is an
  internal tool. Not worth it here.

### Rejected: WinForms
- Would work, but the log panel wants virtualised, colour-coded, data-bound output — that is
  fighting WinForms and nearly free in WPF/Avalonia.

### Rejected: local web server + browser UI
- Would need localhost-only binding, a command allowlist, CSRF protection and WebSocket origin
  validation, because any page you visit in a browser could otherwise POST to the local server and
  spawn processes. A desktop app removes that entire class of risk.

Decision: **Option A (WPF)**. Implementation started on .NET 8. Revisit Avalonia only if
non-Windows developer machines need support.

---

## Location

```
tools/
  DevLauncher/
    DevLauncher.csproj
    App.xaml / App.xaml.cs
    MainWindow.xaml / MainWindow.xaml.cs
    Models/
      ServiceDefinition.cs     # id, exe, args, working dir, port, ready-log pattern
      ServiceState.cs          # enum: Stopped/Starting/Running/Stopping/Crashed
      LogLine.cs               # service id, stream, timestamp, text
    Services/
      ServiceRegistry.cs       # the fixed list of launchable services
      ProcessSupervisor.cs     # start/stop/kill-tree/status, raises events
      PortInspector.cs         # find and free the listener on a port
    ViewModels/
      MainViewModel.cs
      ServiceViewModel.cs
      LogViewModel.cs
    Views/
      ServiceCard.xaml
      LogPanel.xaml
```

Added to `LogAllTheThings.sln` so it builds and runs from the same solution.

---

## Service Definitions

Fixed list in `ServiceRegistry.cs`. Paths resolve relative to the repo root, located by walking up
from the executable until `LogAllTheThings.sln` is found.

| Id    | Exe      | Args      | Working dir                  | Port | Ready log match     |
|-------|----------|-----------|------------------------------|------|---------------------|
| `api` | `dotnet` | `run`     | `src/LogAllTheThings.Api`    | 5000 | `Now listening on`  |
| `web` | `npm.cmd`| `run dev` | `src/LogAllTheThings.Web`    | 5173 | `ready in`          |

Notes:
- **Start All** launches `api` first — Vite proxies `/api` to port 5000.
- Use `ProcessStartInfo` with `ArgumentList` (not a concatenated `Arguments` string) and
  `UseShellExecute = false` so output can be redirected.

---

## Process Supervision Design

### `ProcessSupervisor` responsibilities
- `Start(id)` — no-op if already running; capture pid and start time.
- `Stop(id)` — graceful close, then force kill after a timeout.
  - `Process.Kill(entireProcessTree: true)` — both `dotnet run` and `npm run dev` spawn children,
    so killing only the parent leaves the real server holding the port.
- `Restart(id)` — stop, wait for exit, start.
- Uptime refresh via a `DispatcherTimer` in the view model.
- Raises `LogReceived`, `StateChanged`, `Exited` events.

### Output streaming
- Subscribe to `OutputDataReceived` / `ErrorDataReceived`, then call `BeginOutputReadLine()` and
  `BeginErrorReadLine()`.
- Those callbacks arrive on a background thread — marshal to the UI thread
  (`Dispatcher.InvokeAsync`) before touching the bound collection, or the binding will throw.
- Set `StandardOutputEncoding = Encoding.UTF8` so console box/colour characters do not mangle.

### Log storage
- Bounded in-memory collection (e.g. last 5,000 lines total) so a long session does not grow
  without limit. Drop oldest lines when full.

### Port reclaim
`PortInspector` mirrors [scripts/stop.ps1](scripts/stop.ps1): if a start fails because the port is
in use, surface a **Force free port** button that finds the listening process and offers to kill it
after a confirmation prompt.

---

## UI Design

### Layout
- Toolbar: **Start All**, **Stop All**, **Restart All**.
- One `ServiceCard` per service: name, state badge, pid, uptime, clickable localhost link,
  Start / Stop / Restart buttons.
- `LogPanel` fills the remaining height.

### Log panel behaviour
- Colour-coded per service; `stderr` lines in red.
- Controls: per-service filter toggles, text filter box, auto-scroll toggle, Clear, Save to file.
- Use a virtualising `ListView`/`ItemsControl` (`VirtualizingStackPanel.IsVirtualizing="True"`) —
  a non-virtualised panel will crawl once a few thousand lines accumulate.

### States
- Start/Stop buttons disabled during `Starting` / `Stopping`.
- `Crashed` shows the exit code and keeps the final log lines on screen.

---

## Safety

Much smaller surface than a web version, but still worth stating:

- The launchable services are a **fixed list compiled into the app**. There is no text box that
  accepts a command, path, or arguments.
- No listening socket, so nothing external can trigger a start/stop.
- Killing a process found on a port requires explicit confirmation showing the process name and
  pid, so an unrelated process is not silently terminated.
- Do not surface environment variables or connection strings in the log panel.

---

## Implementation Phases

### Phase 1 — Shell and process control
1. [x] Create `tools/DevLauncher` WPF project on .NET 8, add to the solution.
2. [x] `ServiceRegistry` with the two service definitions and repo-root discovery.
3. [x] `ProcessSupervisor` start/stop with `Kill(entireProcessTree: true)`.
4. [x] Window with per-service and all-service start/stop/restart controls.

### Phase 2 — Log streaming
1. [x] Redirect and read stdout/stderr, marshal to the UI thread.
2. [x] Bounded observable log collection, bound to a virtualised list.
3. [x] Colour coding and stderr highlighting.

### Phase 3 — Full UI
1. `ServiceCard` with state badge, pid, uptime, port link.
2. Start All / Stop All / Restart All with correct ordering.
3. Log filters, auto-scroll, Clear, Save to file.

### Phase 4 — Robustness
1. Ready-state detection via log pattern match.
2. Port-in-use detection and **Force free port** with confirmation.
3. Kill all children on window close, including on unexpected shutdown.
4. Detect externally-killed processes and flip state to `Crashed`.

### Phase 5 — Integration
1. Launch profile / task so the tool starts from VS Code or the solution.
2. README section documenting the tool alongside the existing scripts.

---

## Testing

- Unit: `ProcessSupervisor` state transitions against a fake process abstraction.
- Unit: bounded log collection drops oldest lines at capacity.
- Integration: start → assert `Running` and port listening → stop → assert port free.
- Manual: kill `dotnet` externally, confirm the UI reports `Crashed`.
- Manual: close the window while both services run, confirm no orphaned `dotnet`/`node` processes.

---

## Open Questions

1. WPF (Windows-only) or Avalonia (cross-platform)? Does anyone develop on macOS/Linux?
2. Should the launcher run `npm install` / `dotnet restore` when dependencies are missing?
3. Persist logs to disk (`logs/api-<date>.log`) or keep them in memory only?
4. Keep [scripts/start.ps1](scripts/start.ps1) and [scripts/stop.ps1](scripts/stop.ps1) as the
   scriptable/CI path, with the launcher as a UI on top?
