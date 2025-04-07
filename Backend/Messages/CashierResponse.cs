using Backend.Model;

namespace Backend.Messages
{
    public class CashierResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }

        public CashierResponse(Users cashier)
        {
            Id = cashier.Id;
            Name = cashier.Name;
            Email = cashier.Email;
        }
    }
}
