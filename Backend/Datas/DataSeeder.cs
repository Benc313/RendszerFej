using Backend.Model;
using expenseTracker.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace expenseTracker.Data
{
    public static class DataSeeder
    {
        public static void SeedData(dbContext context)
        {
            if (context.Users.Any() || context.Movies.Any() || context.Terems.Any() || context.Screenings.Any())
            {
                return; 
            }

            // felhasználók létrehozása (Admin, Cashier, User)
            var users = new[]
            {
                new Users { Name = "Admin User", Email = "admin@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("adminpass"), Phone = "1234567890", Role = "Admin" }, // Already correct
                new Users { Name = "Cashier User", Email = "cashier@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("cashierpass"), Phone = "0987654321", Role = "Cashier" }, // Already correct
                new Users { Name = "Regular User", Email = "user@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("userpass"), Phone = "1122334455", Role = "User" } // Already correct
            };
            context.Users.AddRange(users);
            context.SaveChanges(); 

            // filmek létrehozása
            var movies = new[]
            {
                new Movie { Title = "Inception", Description = "Egy profi tolvaj képes belépni mások álmaiba, hogy ellopja a legféltettebb titkaikat.", Duration = 148 },
                new Movie { Title = "The Godfather", Description = "A Corleone család felemelkedése és bukása a maffia világában.", Duration = 175 },
                new Movie { Title = "Pulp Fiction", Description = "Különböző karakterek sorsa fonódik össze Los Angeles alvilágában.", Duration = 154 },
                new Movie { Title = "The Shawshank Redemption", Description = "Egy ártatlanul elítélt férfi reményről és kitartásról szóló története a börtön falai között.", Duration = 142 },
                new Movie { Title = "Forrest Gump", Description = "Egy egyszerű férfi rendkívüli életútja az amerikai történelem nagy pillanataiban.", Duration = 142 },
                new Movie { Title = "The Matrix", Description = "Egy programozó felfedezi, hogy a valóság, amit ismer, csak illúzió.", Duration = 136 },
                new Movie { Title = "Interstellar", Description = "Űrhajósok egy féreglyukon keresztül próbálják megmenteni az emberiséget.", Duration = 169 },
                new Movie { Title = "Fight Club", Description = "Egy kiégett irodista és egy titokzatos férfi földalatti harci klubot alapít.", Duration = 139 }
            };
            context.Movies.AddRange(movies);
            context.SaveChanges();

            // Terem létrehozása
            var rooms = new[]
            {
                new Terem { Room = "A", Seats = 50 },
                new Terem { Room = "B", Seats = 75 },
                new Terem { Room = "C", Seats = 60 },
                new Terem { Room = "D", Seats = 40 }
            };
            context.Terems.AddRange(rooms);
            context.SaveChanges();

            // Screeningek létrehozása
            var screenings = new System.Collections.Generic.List<Screening>();
            int priceBase = 2000;
            for (int m = 0; m < movies.Length; m++)
            {
                for (int day = 1; day <= 3; day++) // 3 nap
                {
                    for (int r = 0; r < rooms.Length; r++)
                    {
                        screenings.Add(new Screening {
                            MovieId = movies[m].Id,
                            TeremId = rooms[r].Id,
                            ScreeningDate = DateTime.UtcNow.Date.AddDays(day + m).AddHours(14 + r * 2), // minden film más napon, más teremben, más időpontban
                            Price = priceBase + (m * 100) + (r * 50)
                        });
                    }
                }
            }
            context.Screenings.AddRange(screenings);
            context.SaveChanges();
        }
    }
}
