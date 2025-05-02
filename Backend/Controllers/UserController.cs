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
using System.Linq; // Add this for LINQ methods like Select

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // <-- Add this line
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
        public async Task<ActionResult<MeResponse>> GetCurrentUser() // Visszatérési típus MeResponse
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
                .Where(o => o.UserId == userId) // Csak az adott felhasználó rendelései
                .Include(o => o.Tickets)
                    .ThenInclude(t => t.Screening)
                        .ThenInclude(s => s.Movie) // Include Movie details
                .Include(o => o.Tickets)
                    .ThenInclude(t => t.Screening)
                        .ThenInclude(s => s.Terem) // Include Room details
                .OrderByDescending(o => o.Id) // Legújabb elöl
                .ToListAsync();

            if (orders == null)
            {
                // Ha nincs rendelése, üres listát adunk vissza, nem hiba
                return Ok(new List<OrderResponse>());
            }

            // Mappelés OrderResponse-ra
            var orderResponses = orders.Select(o => new OrderResponse(o)).ToList();
            return Ok(orderResponses);
        }

        [HttpPut("user/{id}")]
        [Authorize] // Require authentication
        public async Task<ActionResult> UpdateUser(int id, UserRequest userRequest) // Renamed parameter
        {
            // --- Authorization Check ---
            var userIdString = User.FindFirstValue("id");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var currentUserId))
            {
                return Unauthorized(new { Errors = new List<string> { "Invalid token." } });
            }

            // Check if the user is trying to update their own profile
            if (currentUserId != id)
            {
                // Allow Admins to update any user? Decide based on requirements.
                // For now, only allow self-update.
                 if (!User.IsInRole("Admin")) // Example: Allow Admins to bypass
                 {
                    return Forbid(); // User is not authorized to update this profile
                 }
            }
            // --- End Authorization Check ---

            Users? existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser == null)
                return NotFound();

            // Pass the user ID to the validator
            UserUpdateValidator validator = new UserUpdateValidator(_db);
            // Validate the incoming userRequest, not the existingUser
            ValidationResult result = await validator.ValidateAsync(userRequest); // Use async validation
            if (!result.IsValid)
                // Return 400 Bad Request with validation errors
                return BadRequest(new { Errors = result.Errors.Select(x => x.ErrorMessage).ToList() });

            // Update fields only if they are provided in the request
            // Name is not updated here based on current frontend
            // if (!string.IsNullOrWhiteSpace(userRequest.Name))
            //     existingUser.Name = userRequest.Name;
            if (!string.IsNullOrWhiteSpace(userRequest.Email))
            {
                 // Check if email is changing and if it's already taken by another user (Validator handles this now)
                 // if (userRequest.Email != existingUser.Email && await _db.Users.AnyAsync(u => u.Email == userRequest.Email && u.Id != id))
                 // {
                 //     return BadRequest(new { Errors = new List<string> { "Email already in use by another account." } });
                 // }
                existingUser.Email = userRequest.Email;
            }
            if (!string.IsNullOrWhiteSpace(userRequest.Phone))
                existingUser.Phone = userRequest.Phone;
            // Only hash and update password if a new one is provided
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

        //for testing purposes only --- later admin use only
        [HttpGet("users")]
        [Authorize(Roles = "Admin")] 
        public async Task<ActionResult<List<Users>>> GetUsers()
        {
            List<Users> users = await _db.Users.ToListAsync();
            return Ok(users);
        }
    }
}


