using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Messages;

namespace Backend.Model
{
    public class Users
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [Column(TypeName = "varchar(32)")]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "varchar(320)")]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        [Required]
        [Column(TypeName = "varchar(16)")]
        public string Phone { get; set; }

        [Required]
[StringLength(50)]
        public string Role { get; set; } = "User";

        public DateTime? BannedTill { get; set; } = null;

        public List<Orders> Orders { get; set; } = new List<Orders>();

        public Users() { }
        public Users(CashierRequest cashierRequest)
        {
            Name = cashierRequest.Name;
            Email = cashierRequest.Email;
            Phone = cashierRequest.PhoneNumber;
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(cashierRequest.Password);
            Role = "Cashier";
        }

        public Users(RegisterRequest registerRequest)
        {
            Name = registerRequest.Name;
            Email = registerRequest.Email;
            Phone = registerRequest.PhoneNumber;
              PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password);
            Role = "User";
        }
    }
}
