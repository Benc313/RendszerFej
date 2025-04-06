namespace Backend.Messages;

public class OrderRequest
{
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int UserId { get; set; }
    public List<int> TicketIds { get; set; } = new List<int>();
}