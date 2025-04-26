using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;
[ApiController]
[Route("/tickets")]
public class TicketController : ControllerBase
{
	private readonly dbContext _db;

	public TicketController(dbContext db)
	{
		_db = db;
	}

	[HttpGet("validate/{id}")]
	[Authorize(Roles = "Admin, Cashier")]
	public async Task<ActionResult> ValidateTicket(int id)
	{
		//only cashier and admin can validate tickets
		var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
		if (ticket == null)
		{
			return NotFound(new { Errors = new List<string> { "Ticket not found" } });
		}
		
		if(ticket.Status == "VALIDATED")
		{
			return BadRequest(new { Message = "Ticket already validated" });
		}
		ticket.Status = "VALIDATED";
		await _db.SaveChangesAsync();
		return Ok(new { Message = "Ticket successfully validated" });
	}
}