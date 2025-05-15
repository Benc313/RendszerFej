using Backend.Messages; 
using Backend.Model;
using expenseTracker.Data;
using expenseTracker.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity.Data;
using ValidationResult = FluentValidation.Results.ValidationResult;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Linq; 

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] 
    public class UserController : ControllerBase
    {
        private readonly dbContext _db;
        public UserController(dbContext db)
        {
            _db = db;
        }

        // ÚJ VÉGPONT: Bejelentkezett felhasználó adatainak lekérése
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<MeResponse>> GetCurrentUser() 
        {
            var userIdString = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { Errors = new List<string> { "Invalid token or user ID not found." } });
            }

            var user = await _db.Users.FindAsync(userId);

            if (user == null)
            {
                return Unauthorized(new { Errors = new List<string> { "User not found." } });
            }

          
            return Ok(new MeResponse(user));
        }

        // ÚJ VÉGPONT: Bejelentkezett felhasználó rendeléseinek lekérése
        [HttpGet("my-orders")]
        [Authorize] // Csak bejelentkezett felhasználók érhetik el
        public async Task<ActionResult<List<OrderResponse>>> GetMyOrders()
        {
            var userIdString = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { Errors = new List<string> { "Invalid token or user ID not found." } });
            }

            var orders = await _db.Orders
                .Where(o => o.UserId == userId) 
                .Include(o => o.Tickets)
                    .ThenInclude(t => t.Screening)
                        .ThenInclude(s => s.Movie) 
                .Include(o => o.Tickets)
                    .ThenInclude(t => t.Screening)
                        .ThenInclude(s => s.Terem) 
                .OrderByDescending(o => o.Id) // Legújabb elöl
                .ToListAsync();

            if (orders == null)
            {
                return Ok(new List<OrderResponse>());
            }

            var orderResponses = orders.Select(o => new OrderResponse(o)).ToList();
            return Ok(orderResponses);
        }

        [HttpPut("user/{id}")]
        [Authorize] // Require authentication
        public async Task<ActionResult> UpdateUser(int id, UserRequest userRequest) 
        {
            var userIdString = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var currentUserId))
            {
                return Unauthorized(new { Errors = new List<string> { "Invalid token." } });
            }

            // user saját profilját frissíti-e
            if (currentUserId != id)
            {
                 if (!User.IsInRole("Admin")) 
                 {
                    return Forbid(); 
                 }
            }

            Users? existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser == null)
                return NotFound();

            UserUpdateValidator validator = new UserUpdateValidator(_db);
            ValidationResult result = await validator.ValidateAsync(userRequest); 
            if (!result.IsValid)
                return BadRequest(new { Errors = result.Errors.Select(x => x.ErrorMessage).ToList() });

            if (!string.IsNullOrWhiteSpace(userRequest.Email))
            {
                existingUser.Email = userRequest.Email;
            }
            if (!string.IsNullOrWhiteSpace(userRequest.Phone))
                existingUser.Phone = userRequest.Phone;

            if (!string.IsNullOrWhiteSpace(userRequest.Password))
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(userRequest.Password);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await UserExists(id))
                    return NotFound();
                else
                    throw;
            }
            return NoContent();
        }

        [HttpDelete("user/{id}")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            Users? user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return NotFound();
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        private async Task<bool> UserExists(int id)
        {
            return await _db.Users.AnyAsync(e => e.Id == id);
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")] 
        public async Task<ActionResult<List<Users>>> GetUsers()
        {
            List<Users> users = await _db.Users.ToListAsync();
            return Ok(users);
        }
    }
}


