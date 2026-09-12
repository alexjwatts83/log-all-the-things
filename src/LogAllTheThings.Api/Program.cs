using LogAllTheThings.Api;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using LogAllTheThings.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Configure SQLite DbContext
builder.Services.AddDbContext<LogsDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("LogsSqlite") ?? "Data Source=logs.db"));

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LogsDbContext>();
    db.Database.EnsureCreated();
    DatabaseSchemaUpdater.AddLogEntryColumns(db);
    var defaultLogTypes = new[] {
        new LogAllTheThings.Api.Models.LogType { Id = 1, Name = "Medicine" },
        new LogAllTheThings.Api.Models.LogType { Id = 2, Name = "Food" },
        new LogAllTheThings.Api.Models.LogType { Id = 3, Name = "Custom" },
        new LogAllTheThings.Api.Models.LogType { Id = 4, Name = "Car" },
        new LogAllTheThings.Api.Models.LogType { Id = 5, Name = "Life" }
    };
    var existingTypeIds = db.LogTypes.Select(type => type.Id).ToHashSet();
    db.LogTypes.AddRange(defaultLogTypes.Where(type => !existingTypeIds.Contains(type.Id)));
    db.SaveChanges();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.Run("http://localhost:5000");
