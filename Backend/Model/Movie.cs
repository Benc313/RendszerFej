using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Messages;

namespace Backend.Model
{
    public class Movie
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [Column(TypeName = "varchar(32)")]
        public string Title { get; set; }
        [Required]
        [Column(TypeName = "ntext")]
        public string Description { get; set; }
        [Required]
        public uint Duration { get; set; }
        
        
        public List<Screening> Screenings { get; set; } = new List<Screening>();

        public Movie(MovieRequest movieRequest)
        {
            Title = movieRequest.Title;
            Description = movieRequest.Description;
            Duration = movieRequest.Duration;
        }
        public Movie() { }

        public void Update(MovieRequest movieRequest)
        {
            Title = movieRequest.Title;
            Description = movieRequest.Description;
            Duration = movieRequest.Duration;
        }
        
     
    }
}
