using Microsoft.EntityFrameworkCore;

namespace LogAllTheThings.Api.Data;

public static class DatabaseSchemaUpdater
{
    public static void AddLogEntryColumns(LogsDbContext db)
    {
        var columns = GetColumns(db);

        if (!columns.Contains("MedicineName"))
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE LogEntries ADD COLUMN MedicineName TEXT NULL");
        }

        if (!columns.Contains("MedicineQuantity"))
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE LogEntries ADD COLUMN MedicineQuantity INTEGER NULL");
        }

        if (!columns.Contains("CarEventName"))
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE LogEntries ADD COLUMN CarEventName TEXT NULL");
        }

        if (!columns.Contains("CarCost"))
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE LogEntries ADD COLUMN CarCost TEXT NULL");
        }

        if (!columns.Contains("LifeEventName"))
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE LogEntries ADD COLUMN LifeEventName TEXT NULL");
        }

        if (!columns.Contains("LifeCost"))
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE LogEntries ADD COLUMN LifeCost TEXT NULL");
        }
    }

    private static HashSet<string> GetColumns(LogsDbContext db)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != System.Data.ConnectionState.Open;
        if (shouldClose)
        {
            connection.Open();
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA table_info('LogEntries')";
            using var reader = command.ExecuteReader();
            var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            while (reader.Read())
            {
                columns.Add(reader.GetString(1));
            }

            return columns;
        }
        finally
        {
            if (shouldClose)
            {
                connection.Close();
            }
        }
    }
}