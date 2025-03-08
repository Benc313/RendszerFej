using Backend.Model;
using Microsoft.EntityFrameworkCore;

namespace expenseTracker.Data;

public class dbContext : DbContext
{
	protected readonly IConfiguration Configuration;

	public dbContext(IConfiguration configuration)
	{
		Configuration = configuration;
	}

	protected override void OnConfiguring(DbContextOptionsBuilder options)
	{
		// connect to sqlite database
		options.UseSqlite(Configuration.GetConnectionString("DefaultConnection"));
	}
	public DbSet<Users> Users { get; set; }
	public DbSet<Movie> Movies { get; set; }
	public DbSet<Orders> Orders { get; set; }
	public DbSet<Screening> Screenings { get; set; }
	public DbSet<Ticket> Tickets { get; set; }
	public DbSet<Terem> Terems { get; set; }

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		// User
		modelBuilder.Entity<Users>()
			.HasMany(u => u.Orders)
			.WithOne(t => t.User)
			.HasForeignKey(t => t.UserId)
			.OnDelete(DeleteBehavior.Cascade);
        
		modelBuilder.Entity<Orders>()
			.HasMany(u => u.Tickets)
			.WithOne(r => r.Order)
			.HasForeignKey(r => r.OrderId)
			.OnDelete(DeleteBehavior.Cascade);
		
		modelBuilder.Entity<Screening>()
			.HasMany(u => u.Tickets)
			.WithOne(r => r.Screening)
			.HasForeignKey(r => r.ScreeningId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Screening>()
			.HasOne(r => r.Terem)
			.WithMany(t => t.Screenings);
		
		modelBuilder.Entity<Movie>()
			.HasMany(u => u.Screenings)
			.WithOne(r => r.Movie)
			.OnDelete(DeleteBehavior.Cascade);
		
	}
}