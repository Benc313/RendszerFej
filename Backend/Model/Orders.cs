using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Messages;
using Microsoft.AspNetCore.Identity;

namespace Backend.Model
{
    public class Orders
    {
        public Orders(OrderRequest orderRequest, Users? user)
        {
            Phone = orderRequest.Phone;
            Email = orderRequest.Email;
            User = user;
            if(user != null)
                UserId = user.Id;
            else
            {
                UserId = null;
            }
        }  
       public Orders () { }

        [Key]
        public int Id { get; set; }

        [Column(TypeName = "varchar(16)")]
        public string? Phone { get; set; }

        [Column(TypeName = "varchar(320)")]
        public string? Email { get; set; }
        public int?  UserId { get; set; }
        
        public Users? User { get; set; }
        public List<Ticket> Tickets { get; set; } = new List<Ticket>();
        public double TotalPrice { get; set; } = 0;
    }
}
