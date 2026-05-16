using System;

namespace LogAllTheThings.Api.Models
{
    public class LogEntry
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public LogType Type { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? Category { get; set; }
        public string? CustomName { get; set; }
    }
}
