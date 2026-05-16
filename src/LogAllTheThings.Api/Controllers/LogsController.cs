using LogAllTheThings.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace LogAllTheThings.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private static readonly List<LogEntry> Entries = new();

        [HttpGet]
        public ActionResult<IEnumerable<LogEntry>> Get()
        {
            return Ok(Entries.OrderByDescending(entry => entry.Timestamp));
        }

        [HttpGet("{id:guid}")]
        public ActionResult<LogEntry> Get(Guid id)
        {
            var entry = Entries.FirstOrDefault(x => x.Id == id);
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
            Entries.Add(entry);
            return CreatedAtAction(nameof(Get), new { id = entry.Id }, entry);
        }

        [HttpDelete("{id:guid}")]
        public ActionResult Delete(Guid id)
        {
            var entry = Entries.FirstOrDefault(x => x.Id == id);
            if (entry is null)
            {
                return NotFound();
            }

            Entries.Remove(entry);
            return NoContent();
        }
    }
}
