using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("/room")]
public class RoomController : ControllerBase
{
	private readonly dbContext _db;

	public RoomController(dbContext db)
	{
		_db = db;
	}

	[HttpPost("/add")]
	public async Task<ActionResult<RoomResponse>> AddRoom(RoomRequest roomRequest)
	{
		try
		{
			if (await _db.Terems.AnyAsync(r => r.Room == roomRequest.Name))
			{
				return BadRequest(new { Errors = new List<string> { "Room already exists" } });
			}
			_db.Terems.Add(new Terem(roomRequest));
			await _db.SaveChangesAsync();
			return Ok();
		}
		catch (DbUpdateException ex)
		{
			return StatusCode(500, new { Errors = new List<string> { "An error occurred while saving the user. Please try again later." } });
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred. Please try again later." } });
		}
	}
}