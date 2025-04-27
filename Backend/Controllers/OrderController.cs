using System.Security.Claims;
using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
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
    [Authorize(Roles = "Admin, Cashier")]
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
        var order = await _db.Orders
            .Include(o => o.Tickets)
            .ThenInclude(t => t.Screening)
            .Include(o => o.User) // Include user for authorization check
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound();

        // Authorization Check: Allow Admin, Cashier, or the user who placed the order
        var userIdClaim = User.FindFirstValue("id");
        var userRoleClaim = User.FindFirstValue("role");
        int.TryParse(userIdClaim, out var currentUserId);

        bool isOwner = order.UserId.HasValue && order.UserId.Value == currentUserId;
        bool isAdminOrCashier = userRoleClaim == "Admin" || userRoleClaim == "Cashier";

        if (!isOwner && !isAdminOrCashier)
        {
            return Forbid(); // User is not authorized to cancel this order
        }


        // Check if cancellation is allowed (more than 4 hours before screening)
        if (order.Tickets.Any(t => t.Screening.ScreeningDate <= DateTime.UtcNow.AddHours(4)))
            return BadRequest(new { Errors = new List<string> { "Cannot cancel order within 4 hours of screening" } });

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync(); // Add SaveChangesAsync
        return Ok(new { Message = "Order cancelled successfully" }); // Add return Ok
    }
}