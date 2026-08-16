# Log All The Things

A React frontend and ASP.NET Core backend project for creating, editing, and deleting medicine,
food, and custom event logs.

## Structure

- `LogAllTheThings.sln` — Visual Studio solution containing the API project.
- `src/LogAllTheThings.Api/` — ASP.NET Core Web API backend.
- `src/LogAllTheThings.Web/` — React frontend built with Vite.

## Run the backend

1. Open `LogAllTheThings.sln` in Visual Studio.
2. Set `LogAllTheThings.Api` as the startup project.
3. Run the API.

The backend listens on `http://localhost:5000` and exposes `/api/logs`.

## Run the frontend

1. Open a terminal in `src/LogAllTheThings.Web`.
2. Install dependencies:

```bash
npm install
```

3. Start the frontend:

```bash
npm run dev
```

4. Open the local Vite URL shown in the terminal.

The React app proxies API requests to `http://localhost:5000` and lets you log medicine, food, and custom events.

## API endpoints

- `GET /api/logs` — retrieve all log entries.
- `POST /api/logs` — create a new log entry.
- `PUT /api/logs/{id}` — update an existing log entry.
- `GET /api/logs/{id}` — retrieve a log entry by ID.
- `DELETE /api/logs/{id}` — delete a log entry.

## Notes

- The backend persists entries in a local SQLite database.
- Medicine logs require either Panadol Extra or Panadol Rapid and default to a quantity of `2`.
