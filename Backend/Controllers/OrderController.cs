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
        List<Orders> orders = await _db.Orders.Include(o => o.Tickets).ToListAsync();
        return Ok(orders.Select(o => new OrderResponse(o)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult> PurchaseTickets(OrderRequest orderRequest)
    {
        var order = new Orders
        {
            Phone = orderRequest.Phone,
            Email = orderRequest.Email,
            UserId = orderRequest.UserId,
            Tickets = await _db.Tickets.Where(t => orderRequest.TicketIds.Contains(t.Id)).ToListAsync()
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        return Ok(new OrderResponse(order));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> CancelOrder(int id)
    {
        var order = await _db.Orders.Include(o => o.Tickets).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
            return NotFound();

        if (order.Tickets.Any(t => t.Screening.ScreeningDate <= DateTime.Now.AddHours(4)))
            return BadRequest(new { Errors = new List<string> { "Cannot cancel order within 4 hours of screening" } });

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return Ok();
    }
}