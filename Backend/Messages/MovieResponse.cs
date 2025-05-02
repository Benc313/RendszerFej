using Backend.Model;
using System.Linq; // Add this for Select

namespace Backend.Messages;

public class MovieResponse
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public uint Duration { get; set; }


    // Use ScreeningResponse to avoid cycles and control data shape
    public List<ScreeningResponse> Screenings { get; set; } = new List<ScreeningResponse>();

    public MovieResponse(Movie movie)
    {
        Id = movie.Id;
        Title = movie.Title;
        Description = movie.Description;
        Duration = movie.Duration;
        // Map Screenings to ScreeningResponse
        Screenings = movie.Screenings?.Select(s => new ScreeningResponse(s)).ToList() ?? new List<ScreeningResponse>();
    }
    // Add a parameterless constructor if needed for other scenarios
    public MovieResponse() { }
}