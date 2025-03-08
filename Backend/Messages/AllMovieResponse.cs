using Backend.Model;

namespace Backend.Messages;

public class AllMovieResponse
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public uint Duration { get; set; }

    public AllMovieResponse(Movie movie)
    {
        Id = movie.Id;
        Title = movie.Title;
        Description = movie.Description;
        Duration = movie.Duration;
    }
}



