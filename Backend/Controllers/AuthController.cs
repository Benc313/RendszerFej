using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using expenseTracker.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ValidationResult = FluentValidation.Results.ValidationResult;

namespace Backend.Controllers;

[ApiController]
[Route("")]
public class AuthController : ControllerBase
{
	private readonly dbContext _db;
	private readonly IConfiguration _configuration;

	public AuthController(dbContext db, IConfiguration configuration)
	{
		_db = db;
		_configuration = configuration;
	}
	
	[HttpPost("register")]
	public async Task<ActionResult> Register(RegisterRequest registerRequest)
	{
		RegisterValidator validator = new RegisterValidator(_db);
		     ValidationResult result = validator.Validate(registerRequest);
		if (!result.IsValid)
			return BadRequest(result.Errors.Select(x => x.ErrorMessage).ToList());

		try
		{
			if (await _db.Users.AnyAsync(u => u.Email == registerRequest.Email))
			{
				return BadRequest(new { Errors = new List<string> { "Email already exists" } });
			}

			_db.Users.Add(new Users(registerRequest));
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

	[HttpPost("login")]
	public async Task<ActionResult<LoginResponse>> Login(LoginRequest loginRequest)
	{
		Users? user = await _db.Users.FirstOrDefaultAsync(u => u.Email == loginRequest.Email); // Use nullable type
		if (user == null)
			return BadRequest(new { Errors = new List<string> { "Invalid email or password" } }); // Corrected error message

		if (!BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
			return BadRequest(new { Errors = new List<string> { "Invalid email or password" } });

        // Check if banned
        if (user.BannedTill.HasValue && user.BannedTill.Value > DateTime.UtcNow)
        {
             return Unauthorized(new { Errors = new List<string> { $"User is banned until {user.BannedTill.Value}" } });
        }

		// Generate JWT token
		var tokenHandler = new JwtSecurityTokenHandler();
		var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]);
		var tokenDescriptor = new SecurityTokenDescriptor()
		{
			Subject = new System.Security.Claims.ClaimsIdentity(new[]
			{
				new Claim("id", user.Id.ToString()),
				new Claim("role", user.Role)
			}),
			Expires = DateTime.UtcNow.AddDays(1),
			Issuer = _configuration["Jwt:Issuer"],
			Audience = _configuration["Jwt:Audience"],
			SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
		};
		var token = tokenHandler.CreateToken(tokenDescriptor);
		var tokenString = tokenHandler.WriteToken(token);
		// Set the token in a cookie
		Response.Cookies.Append("accessToken", tokenString, new CookieOptions
		{
			HttpOnly = true,
			Secure = true,
			SameSite = SameSiteMode.None,
			Expires = DateTime.UtcNow.AddDays(1)
		});
		return Ok(new LoginResponse(user));
	}
	
	[HttpPost("logout")]
	[Authorize] // Uncomment this line to require authentication
	public async Task<ActionResult> Logout()
    {
		// Remove the token from the cookie
		Response.Cookies.Delete("accessToken");
		return Ok();
    }


}