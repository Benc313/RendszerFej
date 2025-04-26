using Backend.Model;

namespace Backend.Messages
{
    public class ScreeningResponse
    {
        public int Id { get; set; }
        public DateTime ScreeningDate { get; set; }
        public string MovieName { get; set; }
        public string Room { get; set; }
        public int Price { get; set; }
        public ScreeningResponse(Screening vetites)
        {
            Id = vetites.Id;
            ScreeningDate = vetites.ScreeningDate;
            MovieName = vetites.Movie.Title;
            Room = vetites.Terem.Room;
            Price = vetites.Price;
        }
    }
}
