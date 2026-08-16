# LogAllTheThings Web

React frontend for creating and viewing Medicine, Food, and Custom log entries.

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

- An optional **Medicine type** selector with Panadol Extra and Panadol Rapid.
- A positive whole-number **Quantity** field that defaults to `2`.

Medicine does not show a description field. The selected medicine type becomes the description;
when no type is selected, the description is `Medicine`.

To add another medicine, update `medicineTypes` in `src/components/LogForm.jsx` and
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

## Project structure

```text
src/
  api.js                 API request and type mapping helpers
  App.jsx                Main application state and layout
  main.jsx               React entry point
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
