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
    // Seed default log types if none exist
    if (!db.LogTypes.Any())
    {
        db.LogTypes.AddRange(new[] {
            new LogAllTheThings.Api.Models.LogType { Name = "Medicine" },
            new LogAllTheThings.Api.Models.LogType { Name = "Food" },
            new LogAllTheThings.Api.Models.LogType { Name = "Custom" }
        });
        db.SaveChanges();
    }
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
