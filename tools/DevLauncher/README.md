# Dev Launcher

Windows desktop control panel for running the LogAllTheThings API and web frontend during local development.

## Prerequisites

- Windows 10 or later
- .NET 8 SDK
- Node.js 20 or later with npm
- Web dependencies installed in `src/LogAllTheThings.Web`

Install the web dependencies once from the repository root:

```powershell
npm install --prefix .\src\LogAllTheThings.Web
```

## Start the launcher

From the repository root:

```powershell
dotnet run --project .\tools\DevLauncher\DevLauncher.csproj
```

To build first and run the executable directly:

```powershell
dotnet build .\tools\DevLauncher\DevLauncher.csproj
.\tools\DevLauncher\bin\Debug\net8.0-windows\DevLauncher.exe
```

## Controls

- **Start all** starts the API followed by the web frontend.
- **Stop all** stops both services and their child processes.
- **Restart all** restarts both services.
- **Force restart all** force stops any running processes and port listeners, then starts both services.
- Each service card also has its own **Start**, **Stop**, **Restart**, and **Force restart** controls.
- **Auto-scroll** keeps the newest process output visible.
- **Open log file** opens the persistent launcher log.
- **Clear** removes the currently displayed log lines.
- The **App** tab embeds the web frontend after the Web service reaches `Running`.
- **Refresh** reloads the embedded app, and **Open in browser** opens it externally.
- Closing the launcher stops all processes that it started.

## Logs

Process output, lifecycle events, command failures, and unhandled exceptions are written to:

```text
C:\logs\LogAllTheThings\DevLauncher\launcher.log
```

The log remains available after the launcher closes. Use **Open log file** in the output toolbar
to open it with the system's default text editor.

## Services

| Service | Address | Command |
| --- | --- | --- |
| API | <http://localhost:5000> | `dotnet run` |
| Web | <http://localhost:5173> | `npm run dev` |

The web frontend proxies `/api` requests to the API on port 5000.

## Troubleshooting

### A service remains in `Starting`

The launcher changes a service to `Running` after its normal readiness message appears. Check the output panel for build errors, missing dependencies, or a port conflict.

### `npm.cmd` cannot be found

Install Node.js and restart VS Code so npm is available on `PATH`.

### A port is already in use

Use the **Force restart** or **Force restart all** controls in the launcher, or stop the existing listener with the repository script:

```powershell
.\scripts\stop.ps1
```

Or run the force restart script:

```powershell
.\scripts\restart.ps1
```

Then start the services again.

## Current limitations

- Windows-only because the launcher uses WPF.
- The App tab requires the Microsoft Edge WebView2 Runtime (included with current Windows releases).
- The on-screen log is capped at 5,000 lines; the complete persistent log remains available on disk.
- Log filtering, saving logs, and uptime display are planned but not implemented yet.
