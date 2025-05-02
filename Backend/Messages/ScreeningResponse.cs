using Backend.Model;

namespace Backend.Messages
{
    public class ScreeningResponse
    {
        public int Id { get; set; }
        public DateTime ScreeningDate { get; set; }
        public string MovieName { get; set; }
        public string RoomName { get; set; }
        public int RoomId { get; set; }
        public List<int> TakenSeats { get; set; } = new List<int>();
        public int Price { get; set; }
        public ScreeningResponse(Screening vetites)
        {
            Id = vetites.Id;
            ScreeningDate = vetites.ScreeningDate;
            MovieName = vetites.Movie.Title;
            RoomId = vetites.TeremId;
            TakenSeats = vetites.Tickets?.Select(t => t.SeatNumber).ToList() ?? new List<int>();
            RoomName = vetites.Terem.Room; 
            Price = vetites.Price;
        }
    }
}
