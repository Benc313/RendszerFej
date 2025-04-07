using Backend.Model;

namespace Backend.Messages;

public class OrderRequest
{
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int? UserId { get; set; }
    public List<TicketRequest> Tickets { get; set; }
   // public double TotalPrice { get; set; } = 0;
   
}
public class TicketRequest
{
    public int SeatNumber { get; set; }
    public int ScreeningId { get; set; }
    //public string Status { get; set; } = "Pending";
}