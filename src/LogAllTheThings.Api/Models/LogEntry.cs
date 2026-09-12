using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogAllTheThings.Api.Models
{
    public class LogEntry
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        // Foreign key to LogType
        public int TypeId { get; set; }
        public LogType? Type { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? Category { get; set; }
        public string? CustomName { get; set; }
        public string? MedicineName { get; set; }
        public int? MedicineQuantity { get; set; }
        public string? CarEventName { get; set; }
        public decimal? CarCost { get; set; }
    }
}
