using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("orders")]
public class OrderController : ControllerBase
{
    private readonly dbContext _db;

    public OrderController(dbContext db)
    {
        _db = db;
    }

    
    [HttpGet]
    public async Task<ActionResult<List<OrderResponse>>> GetOrders()
    {
        List<Orders> orders = await _db.Orders
            .Include(o => o.Tickets)
            .ThenInclude(t => t.Screening)
            .ToListAsync();
        
        return Ok(orders.Select(o => new OrderResponse(o)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult> PurchaseTickets(OrderRequest orderRequest)
    {
        try
        {
           
            if (orderRequest.Tickets == null || !orderRequest.Tickets.Any())
                return BadRequest(new { Errors = new List<string> { "No tickets in order" } });

          
            Users? user = null;
            if (orderRequest.UserId.HasValue)
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.Id == orderRequest.UserId);
            }

           
            var order = new Orders(orderRequest, user);
            _db.Orders.Add(order);

          
            foreach (var ticketRequest in orderRequest.Tickets)
            {
                var screening = await _db.Screenings.FindAsync(ticketRequest.ScreeningId);
                if (screening == null)
                    return BadRequest(new { Errors = new List<string> { $"Screening with ID {ticketRequest.ScreeningId} not found" } });

                var ticket = new Ticket
                {
                    SeatNumber = ticketRequest.SeatNumber,
                    ScreeningId = ticketRequest.ScreeningId,
                    Status = "Purchased",
                    Order = order,
                    Price = screening.Price 
                };

                order.Tickets.Add(ticket);
                order.TotalPrice += ticket.Price;
            }

           
            await _db.SaveChangesAsync();

            return Ok(new OrderResponse(order));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Errors = new List<string> { "An error occurred: " + ex.Message } });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> CancelOrder(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Tickets)
            .ThenInclude(t => t.Screening)
            .FirstOrDefaultAsync(o => o.Id == id);
    
        if (order == null)
            return NotFound();
        
        if (order.Tickets.Any(t => t.Screening.ScreeningDate <= DateTime.Now.AddHours(4)))
            return BadRequest(new { Errors = new List<string> { "Cannot cancel order within 4 hours of screening" } });

        _db.Orders.Remove(order);
        
        await _db.SaveChangesAsync();
        return Ok();
    }
}