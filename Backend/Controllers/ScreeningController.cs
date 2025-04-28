using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("screenings")]
    public class ScreeningController : ControllerBase
    {
        private readonly dbContext _db;

        public ScreeningController(dbContext db)
        {
            _db = db;
        }


        [HttpGet]
        public async Task<ActionResult<List<ScreeningResponse>>> GetScreenings()
        {
            List<Screening> vetitesek = await _db.Screenings
                .Include(s => s.Movie)
                .Include(s => s.Terem)
                .ToListAsync();
            return Ok(vetitesek.Select(v => new ScreeningResponse(v)).ToList());
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ScreeningResponse>> AddScreening(ScreeningRequest screeningRequest)
        {
            try
            {
                if (screeningRequest.Price < 0)
                {
                    return BadRequest(new { Errors = new List<string> { "Price cannot be negative" } });
                }

                if (!await _db.Terems.AnyAsync(t => t.Room == screeningRequest.TeremName))
                {
                    return BadRequest(new { Errors = new List<string> { "No valid Room was assigned!" } });
                }
                else if (!await _db.Movies.AnyAsync(s => s.Title == screeningRequest.MovieTitle))
                {
                    return BadRequest(new { Errors = new List<string> { "No valid Movie title was used!" } });
                }

                var room = await _db.Terems.FirstAsync(m => m.Room == screeningRequest.TeremName);
                if (room.Seats <= 0)
                {
                    return BadRequest(new { Errors = new List<string> { "Room must have available seats" } });
                }

                Screening screening = new Screening
                {
                    ScreeningDate = screeningRequest.ScreeningDate,
                    Tickets = new List<Ticket>(),
                    Terem = room,
                    Movie = _db.Movies.First(m => m.Title == screeningRequest.MovieTitle),
                    Price = screeningRequest.Price
                };

                _db.Screenings.Add(screening);

                await _db.SaveChangesAsync();
                return Ok(new ScreeningResponse(screening));
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, new { Errors = new List<string> { "An error occurred while saving the screening. Please try again later." } });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred. Please try again later."  } });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ScreeningResponse>> GetScreening(int id)
        {
            Screening? screening = await _db.Screenings
                .Include(s => s.Movie)
                .Include(s => s.Terem)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (screening == null)
                return NotFound();
            return Ok(new ScreeningResponse(screening));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteScreening(int id)
        {
            Screening? screening = await _db.Screenings.FirstOrDefaultAsync(s => s.Id == id);
            if (screening == null)
                return NotFound();
            _db.Screenings.Remove(screening);
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ScreeningResponse>> UpdateScreening(int id, ScreeningRequest screeningRequest)
        {
            if (screeningRequest.Price < 0)
            {
                return BadRequest(new { Errors = new List<string> { "Price cannot be negative" } });
            }

            Screening? screening = await _db.Screenings
                .Include(s => s.Movie)
                .Include(s => s.Terem)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (screening == null)
            {
                return NotFound(new { Errors = new List<string> { "Screening not found" } });
            }

            Terem? terem = await _db.Terems.FirstOrDefaultAsync(t => t.Room == screeningRequest.TeremName);
            if (terem == null)
            {
                return BadRequest(new { Errors = new List<string> { "No valid Room was assigned!" } });
            }

            Movie? movie = await _db.Movies.FirstOrDefaultAsync(m => m.Title == screeningRequest.MovieTitle);
            if (movie == null)
            {
                return BadRequest(new { Errors = new List<string> { "No valid Movie title was used!" } });
            }

            screening.Update(screeningRequest, terem, movie);
            screening.Price = screeningRequest.Price; 

            await _db.SaveChangesAsync(); 
            return Ok(new ScreeningResponse(screening)); 
        }

    }
}
