using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    }
}
