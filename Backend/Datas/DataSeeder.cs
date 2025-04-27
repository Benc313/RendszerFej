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
            // Check if data already exists
            if (context.Users.Any() || context.Movies.Any() || context.Terems.Any() || context.Screenings.Any())
            {
                return; // DB has been seeded
            }

            // Seed Users
            var users = new[]
            {
                new Users { Name = "Admin User", Email = "admin@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("adminpass"), Phone = "1234567890", Role = "Admin" }, // Already correct
                new Users { Name = "Cashier User", Email = "cashier@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("cashierpass"), Phone = "0987654321", Role = "Cashier" }, // Already correct
                new Users { Name = "Regular User", Email = "user@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("userpass"), Phone = "1122334455", Role = "User" } // Already correct
            };
            context.Users.AddRange(users);
            context.SaveChanges(); // Save users first if needed, though not strictly necessary here

            // Seed Movies
            var movies = new[]
            {
                new Movie { Title = "Inception", Description = "A thief who steals corporate secrets through the use of dream-sharing technology...", Duration = 148 },
                new Movie { Title = "The Matrix", Description = "A computer hacker learns from mysterious rebels about the true nature of his reality...", Duration = 136 },
                new Movie { Title = "Interstellar", Description = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival...", Duration = 169 }
            };
            context.Movies.AddRange(movies);
            context.SaveChanges();

            // Seed Rooms (Terems)
            var rooms = new[]
            {
                new Terem { Room = "A", Seats = 50 },
                new Terem { Room = "B", Seats = 75 }
            };
            context.Terems.AddRange(rooms);
            context.SaveChanges();

            // Seed Screenings
            var screenings = new[]
            {
                new Screening { MovieId = movies[0].Id, TeremId = rooms[0].Id, ScreeningDate = DateTime.UtcNow.AddDays(1).AddHours(2), Price = 2500 },
                new Screening { MovieId = movies[1].Id, TeremId = rooms[1].Id, ScreeningDate = DateTime.UtcNow.AddDays(1).AddHours(5), Price = 2200 },
                new Screening { MovieId = movies[0].Id, TeremId = rooms[1].Id, ScreeningDate = DateTime.UtcNow.AddDays(2).AddHours(3), Price = 2500 }
            };
            context.Screenings.AddRange(screenings);
            context.SaveChanges();
        }
    }
}
