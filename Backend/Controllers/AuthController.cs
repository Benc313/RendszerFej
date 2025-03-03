using Backend.Messages;
using Backend.Model;
using expenseTracker.Data;
using expenseTracker.Validators;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
		Users user = await _db.Users.FirstOrDefaultAsync(u => u.Email == loginRequest.Email);
		if (user == null)
			return BadRequest(new { Errors = new List<string> { "Invalid email or passworda" } });

		if (!BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
			return BadRequest(new { Errors = new List<string> { "Invalid email or password" } });
		return Ok(new LoginResponse(user));
	}
}