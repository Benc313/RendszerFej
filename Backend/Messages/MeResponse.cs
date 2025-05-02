using Backend.Model;

namespace Backend.Messages;

public class MeResponse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; } // e.g., "User", "Admin", "Cashier" - Already correct
    public string Phone { get; set; } 
    public DateTime? BannedTill { get; set; }

    public MeResponse(Users user)
    {
        Id = user.Id;
        Name = user.Name;
        Email = user.Email;
        Role = user.Role; 
        Phone = user.Phone;
        BannedTill = user.BannedTill;
    }
}
