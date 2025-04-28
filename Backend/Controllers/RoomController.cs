using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
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

	[HttpPost()]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<RoomResponse>> AddRoom(RoomRequest roomRequest)
	{
		try
		{
			if (await _db.Terems.AnyAsync(r => r.Room == roomRequest.RoomName))
			{
				return BadRequest(new { Errors = new List<string> { "Room already exists" } });
			}

			if (roomRequest.Seats <= 0)
			{
				return BadRequest(new { Errors = new List<string> { "Room must have a positive number of seats" } });
			}

			var newRoom = new Terem(roomRequest); // Store the new room
			_db.Terems.Add(newRoom);
			await _db.SaveChangesAsync();
			// Return the created room details
			return CreatedAtAction(nameof(GetRoom), new { id = newRoom.Id }, new RoomResponse(newRoom)); 
		}
		catch (DbUpdateException)
		{
			return StatusCode(500, new { Errors = new List<string> { "An error occurred while saving the room. Please try again later." } });
		}
		catch (Exception)
		{
			return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred. Please try again later." } });
		}
	}

	[HttpGet()]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<List<RoomResponse>>> GetRooms()
	{
		List<Terem> rooms = await _db.Terems.ToListAsync();
		return Ok(rooms.Select(r => new RoomResponse(r)).ToList());
	}

	[HttpGet("{id}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<RoomResponse>> GetRoom(int id)
	{
		Terem? room = await _db.Terems.FirstOrDefaultAsync(r => r.Id == id); 
		if (room == null)
			 return NotFound(new { Errors = new List<string> { "Room not found" } });
		return Ok(new RoomResponse(room));
	}

	[HttpDelete("{id}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult> DeleteRoom(int id)
	{
		Terem? room = await _db.Terems.FirstOrDefaultAsync(r => r.Id == id); 
		if (room == null)
			return NotFound();
		_db.Terems.Remove(room);
		await _db.SaveChangesAsync();
		return Ok();
	}

	[HttpPut("{id}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<RoomResponse>> UpdateRoom(int id, RoomRequest roomRequest)
	{
		Terem? room = await _db.Terems.FirstOrDefaultAsync(r => r.Id == id); 
		if (room == null)
			return NotFound();

        
        if (await _db.Terems.AnyAsync(r => r.Room == roomRequest.RoomName && r.Id != id))
        {
            return BadRequest(new { Errors = new List<string> { "Another room with this name already exists" } });
        }
         if (roomRequest.Seats <= 0)
        {
            return BadRequest(new { Errors = new List<string> { "Room must have a positive number of seats" } });
        }

		room.Update(roomRequest);
        await _db.SaveChangesAsync();
        return Ok(new RoomResponse(room)); 
	}
}