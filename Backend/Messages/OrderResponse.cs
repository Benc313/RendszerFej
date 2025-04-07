using Backend.Model;

namespace Backend.Messages;

public class OrderResponse
{
    public int Id { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int? UserId { get; set; }
    public double TotalPrice { get; set; }
    public List<TicketResponse> Tickets { get; set; } = new List<TicketResponse>();

    public OrderResponse(Orders order)
    {
        Id = order.Id;
        Phone = order.Phone;
        Email = order.Email;
        UserId = order.UserId;
        TotalPrice = order.TotalPrice;
        Tickets = order.Tickets.Select(t => new TicketResponse(t)).ToList();
    }
}

public class TicketResponse
{
    public int Id { get; set; }
    public int SeatNumber { get; set; }
    public int Price { get; set; }
    public string Status { get; set; }
    public int ScreeningId { get; set; }

    public TicketResponse(Ticket ticket)
    {
        Id = ticket.Id;
        SeatNumber = ticket.SeatNumber;
        Price = ticket.Price;
        Status = ticket.Status;
        ScreeningId = ticket.ScreeningId;
    }
}