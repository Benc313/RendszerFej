﻿using Backend.Model;

namespace Backend.Messages;

public class MovieResponse
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public uint Duration { get; set; }
        
        
    public List<Screening> Screenings { get; set; } = new List<Screening>();

    public MovieResponse(Movie movie)
    {
        Id = movie.Id;
        Title = movie.Title;
        Description = movie.Description;
        Duration = movie.Duration;
        Screenings = movie.Screenings;
    }
}