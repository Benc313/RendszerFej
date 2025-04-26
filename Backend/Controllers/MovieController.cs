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
        Movie? movie = await _db.Movies.FindAsync(id);
        if (movie == null)
            return NotFound(); // 404


        return  Ok(new MovieResponse(movie));
    }

    [HttpPost]
    [Authorize(Policy = "AdminPolicy")]
    public async Task<ActionResult<MovieRequest>> CreateMovie(MovieRequest movieRequest)
    {
        
        var movie = new Movie(movieRequest);

        _db.Movies.Add(movie);
        await _db.SaveChangesAsync();
        
        return Ok();
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MovieResponse>> UpdateMovie(int id, MovieRequest movie) 
    {
       
        var movieToUpdate = await _db.Movies.FindAsync(id);
        if (movieToUpdate == null)
            return NotFound();
        
        movieToUpdate.Update(movie);
        

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            
        } 

        return Ok();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteMovie(int id) //DELETEMOVIE
    {
        var movie = await _db.Movies.FindAsync(id);
        if (movie == null)
            return NotFound();

        _db.Movies.Remove(movie);
        await _db.SaveChangesAsync();

        return Ok();
    }
}