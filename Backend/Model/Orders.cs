using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Model
{
    public class Orders
    {
        [Key]
        public int Id { get; set; }

        [Column(TypeName = "varchar(16)")]
        public string? Phone { get; set; }

        [Column(TypeName = "varchar(320)")]
        public string? Email { get; set; }
        public int  UserId { get; set; }
        
        public Users? User { get; set; }
        public List<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
