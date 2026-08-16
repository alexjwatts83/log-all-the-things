# LogAllTheThings Web

React frontend for creating, viewing, editing, and deleting Medicine, Food, and Custom log entries.

## Prerequisites

- Node.js 20 or later
- npm
- LogAllTheThings API running on port 5000

## Install

From the repository root:

```powershell
npm install --prefix .\src\LogAllTheThings.Web
```

## Run

Start the API first:

```powershell
dotnet run --project .\src\LogAllTheThings.Api\LogAllTheThings.Api.csproj
```

Then start Vite in another terminal:

```powershell
npm run dev --prefix .\src\LogAllTheThings.Web
```

Open <http://localhost:5173>.

The repository's WPF launcher can start both services and display the frontend in its **App** tab:

```powershell
dotnet run --project .\tools\DevLauncher\DevLauncher.csproj
```

## Development proxy

The frontend calls the API through relative `/api` URLs. During development, Vite proxies those requests to:

```text
http://localhost:5000
```

The proxy is configured in `vite.config.js`. If the API port changes, update the proxy target there as well.

## Log types

The UI currently provides three fixed log types, mapped to API type IDs in `src/api.js`:

| UI type | API `TypeId` |
| --- | --- |
| Medicine | 1 |
| Food | 2 |
| Custom | 3 |

Food and Custom entries require a description. Details and category are optional. Custom entries
also support an optional event name.

Selecting **Medicine** reveals:

- A required **Medicine type** selector with Panadol Extra and Panadol Rapid. Panadol Extra is the
  default.
- A positive whole-number **Quantity** field that defaults to `2`.

Medicine does not show a description field. The selected medicine type becomes the description.

Each recent log has **Edit** and **Delete** actions. Edit opens the relevant fields directly in the
log card; the log type cannot be changed. Delete asks for confirmation before removing the entry.

To add another medicine, update `medicineTypes` in `src/medicineTypes.js` and
`SupportedMedicines.Names` in the API. The API allowlist remains the source of validation truth.

## Scripts

Run these commands from `src/LogAllTheThings.Web`, or add `--prefix .\src\LogAllTheThings.Web` when running from the repository root.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist` |
| `npm run preview` | Serve the production build locally for inspection |

## Build

From the repository root:

```powershell
npm run build --prefix .\src\LogAllTheThings.Web
```

## Build and sideload the Android APK

The Android build uses Capacitor and produces a debug APK that can be installed directly without
the Google Play Store.

Prerequisites:

- Node.js 22 or later and npm.
- Android Studio with Android SDK Platform 36 installed.
- Java JDK 21 or later configured through `JAVA_HOME` or `PATH`, or Android Studio installed in its
  standard location.
- `ANDROID_HOME` set when the SDK is not at `%LOCALAPPDATA%\Android\Sdk`.
- A LogAllTheThings API URL reachable from the phone.

Find the PC's Wi-Fi IPv4 address with `ipconfig`, start the API on all network interfaces, and allow
port 5000 through Windows Firewall when prompted:

```powershell
dotnet run --project .\src\LogAllTheThings.Api\LogAllTheThings.Api.csproj --urls http://0.0.0.0:5000
```

In another terminal, build the APK using that PC address rather than `localhost`:

```powershell
.\scripts\build-android-apk.ps1 -ApiUrl http://192.168.1.20:5000
```

The script installs npm dependencies, builds the web app with `VITE_API_BASE_URL`, creates
the generated Capacitor Android project when needed, synchronizes its assets, and runs Gradle. The
result is copied to:

```text
artifacts/android/LogAllTheThings-debug.apk
```

Transfer that file to the phone and open it. Android will ask you to allow **Install unknown apps**
for the browser or file manager used to open the APK. The PC and API must remain available while
using this version of the app because data is still stored by the ASP.NET Core API.

Re-run the same command after frontend changes. Supply `-SkipInstall` only when dependencies are
already installed. The generated `android` directory and APK artifacts are intentionally ignored
by Git.

### Android cannot load logs

- Confirm the phone and PC are on the same Wi-Fi network.
- Open `http://PC-IP:5000/api/logs` in the phone's browser to test connectivity.
- Do not use `localhost` in `-ApiUrl`; on Android it refers to the phone.
- Confirm the API uses `--urls http://0.0.0.0:5000` and Windows Firewall permits port 5000.
- Rebuild the APK whenever its API URL needs to change.

## Project structure

```text
src/
  api.js                 API request and type mapping helpers
  App.jsx                Main application state and layout
  main.jsx               React entry point
  medicineTypes.js       Shared Medicine selector options
  style.css              Application styles
  components/
    LogForm.jsx           Entry form
    LogList.jsx           Recent-entry list
```

## Troubleshooting

### The page shows "Unable to load logs"

Confirm the API is running at <http://localhost:5000> and that Vite was started in development mode.

### Port 5173 is already in use

Stop the existing development process from the repository root:

```powershell
.\scripts\stop.ps1
```

### A new log type is not saved correctly

Add the type to both `defaultTypes` in `src/App.jsx` and `typeMap` in `src/api.js`. The corresponding type must also exist in the API database.
