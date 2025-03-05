﻿using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[Route("movies")]
public class MovieController : ControllerBase
{
    private readonly dbContext _db;

    public MovieController(dbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> GetMovies() 
    {
        return Ok(await _db.Movies.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MovieResponse>> GetMovie(int id)
    {
        Movie? movie = await _db.Movies.FindAsync(id);
        if (movie == null)
            return NotFound(); // 404

        var movieResponse = new MovieResponse
        {
            Id = movie.Id,
            Title = movie.Title,
            Description = movie.Description,
            Duration = movie.Duration,
            //idk kell e screenings ide
        };

        return Ok(movieResponse);
    }

    [HttpPost]
    //[Authorize(Roles = "Admin")]
    public async Task<ActionResult<Movie>> CreateMovie(MovieRequest movieRequest) //screening nelkul create movie
    {
        var movie = new Movie
        {
            Title = movieRequest.Title,
            Description = movieRequest.Description,
            Duration = movieRequest.Duration
        };

        _db.Movies.Add(movie);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMovie), new { id = movie.Id }, movie);
    }

    [HttpPut("{id}")]
    //[Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateMovie(int id, Movie movie) //UPDATEMOVIE
    {
        if (id != movie.Id)
            return BadRequest();

        _db.Entry(movie).State = EntityState.Modified;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!MovieExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    //[Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteMovie(int id) //DELETEMOVIE
    {
        var movie = await _db.Movies.FindAsync(id);
        if (movie == null)
            return NotFound();

        _db.Movies.Remove(movie);
        await _db.SaveChangesAsync();

        return NoContent();
    }
    
 

    private bool MovieExists(int id) //SEGEDMETHOD
    {
        return _db.Movies.Any(x => x.Id == id);
    }
    
    public class MovieResponse
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public uint Duration { get; set; }
    }
    public class MovieRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public uint Duration { get; set; }
    }
  
}