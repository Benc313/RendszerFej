using Backend.Model;

namespace Backend.Messages;

public class OrderResponse
{
    public int Id { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int UserId { get; set; }
    public List<int> TicketIds { get; set; } = new List<int>();

    public OrderResponse(Orders order)
    {
        Id = order.Id;
        Phone = order.Phone;
        Email = order.Email;
        UserId = order.UserId;
        TicketIds = order.Tickets.Select(t => t.Id).ToList();
    }
}