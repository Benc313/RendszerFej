using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Backend.Messages;
using SQLitePCL;

namespace Backend.Model
{
    public class Screening
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime ScreeningDate { get; set; }
        public List<Ticket> Tickets { get; set; } = new List<Ticket>();

        [ForeignKey("Terem")]
        public int TeremId { get; set; }
        public Terem Terem { get; set; }

        [ForeignKey("Movie")]
        public int MovieId { get; set; }
        public Movie Movie { get; set; }

        public void Update(int id, ScreeningRequest screeningRequest)
        {
            ScreeningDate = screeningRequest.ScreeningDate;
            Terem = new Terem { Room = screeningRequest.TeremName };
            Movie = new Movie { Title = screeningRequest.MovieTitle };

        }

        //public Screening(ScreeningRequest screeningRequest)
        //{
        //    Terem = screeningRequest.TeremName;
        //    Movie = screeningRequest.MovieTitle;
        //}
    }
}
