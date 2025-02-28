using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public string Role { get; set; }

        public DateTime? BannedTill { get; set; } = null;

        public List<Orders> Orders { get; set; } = new List<Orders>();
    }
}
