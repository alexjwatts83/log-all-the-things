using LogAllTheThings.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace LogAllTheThings.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly Data.LogsDbContext _db;

        public LogsController(Data.LogsDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public ActionResult<IEnumerable<LogEntry>> Get()
        {
            var entries = _db.LogEntries.OrderByDescending(e => e.Timestamp).ToList();
            return Ok(entries);
        }

        [HttpGet("{id:guid}")]
        public ActionResult<LogEntry> Get(Guid id)
        {
            var entry = _db.LogEntries.Find(id);
            return entry is null ? NotFound() : Ok(entry);
        }

        [HttpPost]
        public ActionResult<LogEntry> Post([FromBody] LogEntry entry)
        {
            if (entry is null || string.IsNullOrWhiteSpace(entry.Description))
            {
                return BadRequest(new { error = "Description is required." });
            }

            entry.Id = Guid.NewGuid();
            entry.Timestamp = entry.Timestamp == default ? DateTime.UtcNow : entry.Timestamp;
            _db.LogEntries.Add(entry);
            _db.SaveChanges();
            return CreatedAtAction(nameof(Get), new { id = entry.Id }, entry);
        }

        [HttpDelete("{id:guid}")]
        public ActionResult Delete(Guid id)
        {
            var entry = _db.LogEntries.Find(id);
            if (entry is null)
            {
                return NotFound();
            }

            _db.LogEntries.Remove(entry);
            _db.SaveChanges();
            return NoContent();
        }
    }
}
