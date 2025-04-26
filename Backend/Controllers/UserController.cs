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

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly dbContext _db;
        public UserController(dbContext db)
        {
            _db = db;
        }

        [HttpPut("user/{id}")]      //közel sincs kész, nem lehet ellenőrizni, hogy a felhasználó a saját profilját szerkeszti-e jwt nélkül (elvileg)
        public async Task<ActionResult> UpdateUser(int id, UserRequest user)
        {
            if (/*id != user.Id*/ false)    //ide úgyis azt a userId-t fogjuk kapni, mint ami a jwt-ben van, vagymi
                return BadRequest();

            Users existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser == null)
                return NotFound();

            UserUpdateValidator validator = new UserUpdateValidator(_db);
            ValidationResult result = validator.Validate(user);
            if (!result.IsValid)
                return BadRequest(result.Errors.Select(x => x.ErrorMessage).ToList());

            if (user.Name != null)
                existingUser.Name = user.Name;
            if(user.Email != null)
                existingUser.Email = user.Email;
            if(user.Phone != null)
                existingUser.Phone = user.Phone;
            if(user.Password != null)
            existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.Password);

            //_db.Entry(user).State = EntityState.Modified;     //ezt autofilll baszta ide, nem tudom mit jelent, de működink nélküle so \-*_*-/
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
            Users user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
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
