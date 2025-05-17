using System.ComponentModel.DataAnnotations;

namespace Backend.Messages;

public class UserRequest
{
    public string? Name {get; set; }
    [Required]
    public string Email { get; set; }
    public string? Password { get; set; }
    [Required]
    public string Phone { get; set; }
}
