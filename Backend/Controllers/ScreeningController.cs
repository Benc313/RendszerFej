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
            Console.WriteLine("Vetitesek: " + vetitesek.Count);
            return Ok(vetitesek.Select(v => new ScreeningResponse(v)).ToList());
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ScreeningResponse>> AddScreening(ScreeningRequest screeningRequest)
        {
            try
            {
                //itt meg lehetne oldani, hogy string be jöjjön be a screeningtime, és valahol itt konvertáljuk datetime-ba,
                //- egyenlőre azt feltételezi a kód hogy datetime-ot kap!
                if (!await _db.Terems.AnyAsync(t => t.Room == screeningRequest.TeremName))
                {
                    return BadRequest(new { Errors = new List<string> { "No valid Room was assigned!" } });
                }
                else if (!await _db.Movies.AnyAsync(s => s.Title == screeningRequest.MovieTitle))
                {
                    return BadRequest(new { Errors = new List<string> { "No valid Movie title was used!" } });
                }
                Screening asd = new Screening
                {
                    ScreeningDate = screeningRequest.ScreeningDate,
                    Tickets = new List<Ticket>(),
                    Terem = _db.Terems.First(m => m.Room == screeningRequest.TeremName),
                    Movie = _db.Movies.First(m => m.Title == screeningRequest.MovieTitle),

                };

                _db.Screenings.Add(asd);

                await _db.SaveChangesAsync();
                return Ok(new ScreeningResponse(asd));
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { Errors = new List<string> { "An error occurred while saving the screening. Please try again later." } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred. Please try again later.:"+ex.Message } });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ScreeningResponse>> GetScreening(int id)
        {
            Screening screening = await _db.Screenings
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
            Screening screening = await _db.Screenings.FirstOrDefaultAsync(s => s.Id == id);
            if (screening == null)
                return NotFound();
            _db.Screenings.Remove(screening);
            await _db.SaveChangesAsync();
            return Ok();
            //Ide még nagyon kéne hogy a program mit csinál a jegyekkel, küld e emailt a jeggyel rendelkezőknek, stb!!!!!4!4!!@EVERYONE!!FONTOS 
            //ehhez én nem értek c': 
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ScreeningResponse>> UpdateScreeening(int id, ScreeningRequest screeningRequest)
        {

            Screening screening = await _db.Screenings
                .Include(s => s.Movie)
                .Include(s => s.Terem)
                .FirstOrDefaultAsync(s => s.Id == id);
            Terem terem = await _db.Terems.FirstOrDefaultAsync(t => t.Room == screeningRequest.TeremName);
            Movie movie = await _db.Movies.FirstOrDefaultAsync(m => m.Title == screeningRequest.MovieTitle);
            screening.Update(screeningRequest, terem, movie);
            await _db.SaveChangesAsync();
            return Ok(new ScreeningResponse(screening));
        }

    }
}
