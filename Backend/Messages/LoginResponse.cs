using Backend.Model;

namespace Backend.Messages;

public class LoginResponse
{
    public int Id { get; set; }
	public string Name { get; set; }
	public string Email { get; set; }
	   public string Role { get; set; } 
	public DateTime? BannedTill { get; set; }

	public LoginResponse(Users user)
	{
		Id=user.Id;
		Name = user.Name;
		Email = user.Email;
		Role=user.Role;
		BannedTill = user.BannedTill;
	}
}