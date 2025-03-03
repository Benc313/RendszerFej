using Backend.Model;

namespace Backend.Messages;

public class LoginResponse
{
	public string Name { get; set; }
	public string Email { get; set; }
	
	public LoginResponse(Users user)
	{
		Name = user.Name;
		Email = user.Email;
	}
}