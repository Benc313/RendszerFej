using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("movies")]
public class MovieController : ControllerBase
{
    private readonly dbContext _db;

    public MovieController(dbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<AllMovieResponse>>> GetMovies()
    {
        List<Movie> movies = await _db.Movies.ToListAsync();
        return Ok(movies.Select(x => new AllMovieResponse(x)).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MovieResponse>> GetMovie(int id)
    {
        var movie = await _db.Movies
            .Include(m => m.Screenings)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (movie == null)
            return NotFound(new { Error = "Movie not found." });

        return Ok(new MovieResponse(movie));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MovieResponse>> CreateMovie(MovieRequest movieRequest)
    {
        if (string.IsNullOrWhiteSpace(movieRequest.Title) || string.IsNullOrWhiteSpace(movieRequest.Description))
            return BadRequest(new { Error = "Title and Description are required." });

        var existingMovie = await _db.Movies.FirstOrDefaultAsync(m => m.Title == movieRequest.Title);
        if (existingMovie != null)
            return BadRequest(new { Error = "A movie with this title already exists." });

        var movie = new Movie(movieRequest);

        _db.Movies.Add(movie);
        await _db.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetMovie), new { id = movie.Id }, new MovieResponse(movie));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateMovie(int id, MovieRequest movieRequest) 
    {
        var movieToUpdate = await _db.Movies.FindAsync(id);
        if (movieToUpdate == null)
            return NotFound(new { Error = "Movie not found." });

        movieToUpdate.Update(movieRequest);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { Error = "Concurrency conflict occurred while updating the movie." });
        }

     
        return Ok(new MovieResponse(movieToUpdate));
    }

    [HttpDelete("{id}")]
   [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteMovie(int id) 
    {
        var movie = await _db.Movies.Include(m => m.Screenings).FirstOrDefaultAsync(m => m.Id == id);
        if (movie == null)
            return NotFound(new { Error = "Movie not found." });

        if (movie.Screenings.Any())
            return BadRequest(new { Error = "Cannot delete a movie with active screenings." });

        _db.Movies.Remove(movie);
        await _db.SaveChangesAsync();

        return Ok();

    }
}