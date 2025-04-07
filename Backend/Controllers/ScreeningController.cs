using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
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
        public async Task<ActionResult<ScreeningResponse>> AddScreening(ScreeningRequest screeningRequest)
        {
            try
            {
                //itt meg lehetne oldani, hogy string be jöjjön be a screeningtime, és valahol itt konvertáljuk datetime-ba,
                //- egyenlőre azt feltételezi a kód hogy datetime-ot kap!
                if (await _db.Screenings.AnyAsync(s => s.Terem.Room == screeningRequest.TeremName))
                {
                    return BadRequest(new { Errors = new List<string> { "No valid Room was assigned!" } });
                }
                else if (await _db.Screenings.AnyAsync(s => s.Movie.Title == screeningRequest.MovieTitle))
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
                return StatusCode(500, new { Errors = new List<string> { "An error occurred while saving the user. Please try again later." } });
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
        public async Task<ActionResult> DeleteScreening(int id)
        {
            Screening screening = await _db.Screenings.FirstOrDefaultAsync(s => s.Id == id);
            if (screening == null)
                return NotFound();
            _db.Screenings.Remove(screening);
            _db.SaveChangesAsync();
            return Ok();
            //Ide még nagyon kéne hogy a program mit csinál a jegyekkel, küld e emailt a jeggyel rendelkezőknek, stb!!!!!4!4!!@EVERYONE!!FONTOS 
            //ehhez én nem értek c': 
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ScreeningResponse>> UpdateScreeening(int id, ScreeningRequest screeningRequest)
        {

            //var ScreeningToUpdate = await _db.Screenings.FindAsync(id);
            //if (ScreeningToUpdate == null)
            //    return NotFound();

            //ScreeningToUpdate.Update(id, screeningRequest);
            Screening screening = await _db.Screenings.FirstOrDefaultAsync(s => s.Id == id);
            if (screening == null)
                return NotFound();

            /*Screening updatedScreening = new Screening
            {
                Terem = _db.Terems.First(m => m.Room == screeningRequest.TeremName),
                Movie = _db.Movies.First(m => m.Title == screeningRequest.MovieTitle),
                ScreeningDate = screeningRequest.ScreeningDate,
                Tickets = new List<Ticket>()
            };*/
            screening.Movie=await _db.Movies.FirstOrDefaultAsync(x=>x.Title.Equals(screeningRequest.MovieTitle));
            screening.Terem = await _db.Terems.FirstOrDefaultAsync(x => x.Room.Equals(screeningRequest.TeremName));
            screening.ScreeningDate = screeningRequest.ScreeningDate;

            await _db.SaveChangesAsync();

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {

            }
            return Ok();
        }

    }
}
