## Plan: React + C# Visual Studio Solution for Logging

TL;DR: Create a Visual Studio solution with a C# ASP.NET Core backend and a React frontend. The backend exposes REST endpoints for medicine, food, and custom log events. The frontend consumes those endpoints, provides forms for each log type, and displays the log history.

**Steps**
1. Create the repository structure and solution.
   - Add `LogAllTheThings.sln` at the repo root.
   - Add a `src/LogAllTheThings.Api/` ASP.NET Core Web API project.
   - Add a `src/LogAllTheThings.Web/` React app project.

2. Design the backend data model and API contract.
   - Create shared models for `LogEntry`, `LogType`, and `CustomLogEvent`.
   - Support log types: `Medicine`, `Food`, `Custom`.
   - Include fields: `Id`, `Type`, `Timestamp`, `Description`, `Details`, and an optional `Category` or `CustomName`.

3. Build the C# backend.
   - Configure ASP.NET Core with JSON endpoints and in-memory storage.
   - Add `LogsController` with endpoints:
     - `GET /api/logs` to retrieve all log entries.
     - `POST /api/logs` to create a new log entry.
     - Optional: `GET /api/logs/{id}` and `DELETE /api/logs/{id}`.
   - Add simple validation for required fields.
   - Enable CORS for the React frontend.
   - Add Swagger / API explorer for development.

4. Build the React frontend.
   - Create component structure: `App`, `LogForm`, `LogList`, `LogItem`, `CustomLogForm`.
   - Implement an API service wrapper `api.js` for `GET /api/logs` and `POST /api/logs`.
   - Provide a simple UI with form controls for medicine, food, and custom event logging.
   - Add a list view showing saved logs with type, timestamp, and details.
   - Add tabs or buttons to switch between log types.

5. Wire up frontend/backend integration.
   - Configure `package.json` proxy or backend launch settings so React can call the API during development.
   - Ensure the backend and frontend can run together in one Visual Studio solution or with separate run commands.

6. Verify and document.
   - Validate the solution builds in Visual Studio / `dotnet build`.
   - Validate the React app starts and the backend API responds.
   - Manually test logging medicine, food, and custom events.
   - Add usage instructions to `README.md`.

**Relevant files**
- `LogAllTheThings.sln` — Visual Studio solution container.
- `src/LogAllTheThings.Api/Program.cs` — backend startup and configuration.
- `src/LogAllTheThings.Api/Controllers/LogsController.cs` — API endpoints.
- `src/LogAllTheThings.Api/Models/LogEntry.cs` — log data model.
- `src/LogAllTheThings.Web/package.json` — frontend dependencies and proxy.
- `src/LogAllTheThings.Web/src/App.jsx` — root React app.
- `src/LogAllTheThings.Web/src/components/LogForm.jsx` — log input forms.
- `src/LogAllTheThings.Web/src/components/LogList.jsx` — log history display.
- `README.md` — project setup and run instructions.

**Verification**
1. Run `dotnet build LogAllTheThings.sln` and confirm success.
2. Run the backend project and access `swagger` or `GET /api/logs`.
3. Start the React app and confirm the UI loads.
4. Create medicine, food, and custom logs via the UI and verify they appear in the list.
5. Confirm the `README.md` contains startup instructions.

**Decisions**
- Use a Visual Studio solution with separate backend and frontend projects so the architecture is clear and maintainable.
- Use in-memory storage initially for simplicity; the plan can be extended later to persistent storage.
- Keep the UI minimal and focused on the three log types with a shared log list.

**Further Considerations**
1. The plan uses separate frontend and backend projects in one Visual Studio solution.
2. Should custom log entries allow arbitrary categories, or just a single custom title plus description?
3. Will deployment target a hosted ASP.NET Core app serving the React build, or separate frontend hosting with API backend?