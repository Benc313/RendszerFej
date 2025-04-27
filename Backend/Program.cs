using System.Text;
using expenseTracker.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // Adjust port if your frontend runs elsewhere
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Needed for cookies
        });
});


builder.Services.AddDbContext<dbContext>(options =>
	options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
// Add services to the container.

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters()
		{
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = builder.Configuration["Jwt:Issuer"],
			ValidAudience = builder.Configuration["Jwt:Audience"],
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]))
		};

		// Add custom logic to extract the token from the cookie
		options.Events = new JwtBearerEvents
		{
			OnMessageReceived = context =>
			{
				// Extract the token from the 'accessToken' cookie
				var token = context.Request.Cookies["accessToken"];
				if (!string.IsNullOrEmpty(token))
				{
					context.Token = token; // Set the token for validation
				}
				return Task.CompletedTask;
			}
		};
	});
builder.Services.AddAuthorization(options =>
{
	options.AddPolicy("AdminPolicy", policy =>
	{
		policy.RequireClaim("role", "Admin");
	});
	options.AddPolicy("CashierPolicy", policy =>
	{
		policy.RequireClaim("role", "Cashier");
	});
	options.AddPolicy("UserPolicy", policy =>
	{
		policy.RequireClaim("role", "User");
	});
});
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
	var dbContext = scope.ServiceProvider.GetRequiredService<dbContext>();
	dbContext.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
	app.MapScalarApiReference();
}

app.UseHttpsRedirection();

// Use CORS policy
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers(); 

app.Run(); 