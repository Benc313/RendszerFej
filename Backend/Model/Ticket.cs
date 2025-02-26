using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Model
{
    public class Ticket
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SeatNumber { get; set; }

        [Required]
        
        public int Price { get; set; }

        [Required]
        [Column(TypeName = "varchar(32)")]
        public string Status { get; set; }
        public int OrderId { get; set; }
        public int ScreeningId { get; set; }
        public Orders Order { get; set; }
        public Screening Screening { get; set; }
    }
}
