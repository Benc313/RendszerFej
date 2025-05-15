using System.Security.Claims;
using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    private readonly dbContext _db;

    public OrderController(dbContext db)
    {
        _db = db;
    }

    
    [HttpGet]
    [Authorize(Roles = "Admin, Cashier")]
    public async Task<ActionResult<List<OrderResponse>>> GetOrders()
    {
        List<Orders> orders = await _db.Orders
            .Include(o => o.Tickets)
            .ThenInclude(t => t.Screening)
            .Include(o => o.User) // EZ HOZZÁADVA!
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
                var screening = await _db.Screenings
                    .Include(s => s.Tickets)
                    .FirstOrDefaultAsync(s => s.Id == ticketRequest.ScreeningId);

                if (screening == null)
                    return BadRequest(new { Errors = new List<string> { $"Screening with ID {ticketRequest.ScreeningId} not found" } });

                if (screening.Tickets.Any(t => t.SeatNumber == ticketRequest.SeatNumber))
                    return BadRequest(new { Errors = new List<string> { $"Seat {ticketRequest.SeatNumber} is already taken for screening {ticketRequest.ScreeningId}" } });

                if (screening.ScreeningDate <= DateTime.UtcNow)
                    return BadRequest(new { Errors = new List<string> { "Cannot purchase tickets for past screenings" } });

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
    [Authorize] // Require login to cancel
    public async Task<ActionResult> CancelOrder(int id)
    {
        // --- Authorization Check ---
        var userIdString = User.FindFirstValue("id");
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var currentUserId))
        {
            return Unauthorized(new { Errors = new List<string> { "Invalid token." } });
        }

        var order = await _db.Orders.Include(o => o.Tickets).FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound(new { Errors = new List<string> { "Order not found." } });
        }

        // Check if the user owns the order or is an Admin/Cashier
        if (order.UserId != currentUserId && !User.IsInRole("Admin") && !User.IsInRole("Cashier"))
        {
            return Forbid(); 
        }
      
        _db.Tickets.RemoveRange(order.Tickets);
        _db.Orders.Remove(order);

        try
        {
            await _db.SaveChangesAsync();
            return NoContent(); 
        }
        catch (DbUpdateException)
        {
            return StatusCode(500, new { Errors = new List<string> { "An error occurred while cancelling the order." } });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred." } });
        }
    }
}