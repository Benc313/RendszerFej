namespace Backend.Messages;

public class MovieRequest
{
    public string Title { get; set; }
    public string Description { get; set; }
    public uint Duration { get; set; }
}