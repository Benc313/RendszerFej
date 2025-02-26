using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Backend.Model
{
    public class Screening
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime ScreeningDate { get; set; }


    }
}
