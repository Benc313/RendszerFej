using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("/admin")] 
public class AdminController : ControllerBase
{
    private readonly dbContext _db;

    public AdminController(dbContext db)
    {
        _db = db;
    }

    [HttpPost("cashier")] 
    public async Task<ActionResult> AddCashier( CashierRequest cashierRequest)
    {
        try
        {
            if (await _db.Users.AnyAsync(c => c.Email == cashierRequest.Email))
            {
                return BadRequest(new { Errors = new List<string> { "Cashier with this email already exists." } });
            }

            _db.Users.Add(new Users(cashierRequest));
            await _db.SaveChangesAsync();
            return Ok();
        }
        catch (DbUpdateException)
        {
            return StatusCode(500, new { Errors = new List<string> { "An error occurred while saving the cashier. Please try again later." } });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred. Please try again later." } });
        }
    }

    [HttpDelete("user/{id}")] 
    public async Task<ActionResult> DeleteCashier(int id)
    {
        try
        {
            var cashier = await _db.Users.FirstOrDefaultAsync(c => c.Id == id);
            if (cashier == null)
                return NotFound();

            _db.Users.Remove(cashier);
            await _db.SaveChangesAsync();
            return Ok();
        }
        catch (DbUpdateException)
        {
            return StatusCode(500, new { Errors = new List<string> { "An error occurred while deleting the cashier." } });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Errors = new List<string> { "An unexpected error occurred." } });
        }
    }

    [HttpPost("ban/{id}")]
    public async Task<ActionResult> BanUser(int id)
    {
        try
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { Errors = new List<string> { "User not found." } });
            }

            if (user.BannedTill != null && user.BannedTill > DateTime.UtcNow)
            {
                return BadRequest(new { Errors = new List<string> { "User is already banned." } });
            }

            user.BannedTill = DateTime.UtcNow.AddDays(30); // 30 napra tiltás
            await _db.SaveChangesAsync();

            return Ok(new { Message = $"User banned until {user.BannedTill}" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Errors = new List<string> { "Unexpected error occurred." } });
        }
    }

}
