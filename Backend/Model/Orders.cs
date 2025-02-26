using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Model
{
    public class Orders
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int User_Id { get; set; }

        public string? Phone { get; set; }

        [Column(TypeName = "varchar(320)")]
        public string? Email { get; set; }
    }
}
