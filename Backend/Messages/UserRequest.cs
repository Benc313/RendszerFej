using System.ComponentModel.DataAnnotations;

namespace Backend.Messages;

public class UserRequest
{
    // Remove Name as it's not updated via profile page
    // public string Name { get; set; }

    [Required]
    public string Email { get; set; }

    // Password is optional for update
    public string? Password { get; set; }

    [Required]
    public string Phone { get; set; }
}
