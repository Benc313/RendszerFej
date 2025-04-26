namespace Backend.Messages
{
    public class ScreeningRequest
    {
        public DateTime ScreeningDate { get; set; }
        //ticketset nem tudom hogy adjunk itt hozzá, vagy hogy kell e egyáltalán
        public string TeremName { get; set; }
        public string MovieTitle { get; set; }
        public int Price { get; set; }

    }
}
