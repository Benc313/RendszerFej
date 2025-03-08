using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Backend.Messages;

namespace Backend.Model
{
    public class Terem
    {

        [Key]
        public int Id { get; set; }

        [Required]
        [Column(TypeName = "char(1)")]
        public string Room { get; set; }

        [Required]
        public int Seats { get; set; }
        
        public List<Screening> Screenings { get; set; } = new List<Screening>();
        
        public Terem() { }
        
        public Terem(RoomRequest roomRequest)
        {
            Room = roomRequest.Name;
            Seats = roomRequest.Seats;
        }

        public void Update(RoomRequest roomRequest)
        {
            Room = roomRequest.Name;
            Seats = roomRequest.Seats;
        }
    }
}
