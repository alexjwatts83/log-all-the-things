using LogAllTheThings.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LogAllTheThings.Api.Data
{
    public class LogsDbContext : DbContext
    {
        public LogsDbContext(DbContextOptions<LogsDbContext> options) : base(options)
        {
        }

        public DbSet<LogEntry> LogEntries { get; set; } = null!;
        public DbSet<LogType> LogTypes { get; set; } = null!;
    }
}
