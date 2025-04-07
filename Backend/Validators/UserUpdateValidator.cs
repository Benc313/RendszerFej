using Backend.Messages;
using expenseTracker.Data;
using FluentValidation;

namespace expenseTracker.Validators;


public class UserUpdateValidator : AbstractValidator<UserRequest>
{
    private readonly dbContext _db;

    public UserUpdateValidator(dbContext db)
    {
        _db = db;
        RuleFor(user => user.Name)
            .Length(4, 32).WithMessage("Name must be between 4 and 32 characters");
        RuleFor(user => user.Email)
            .EmailAddress().WithMessage("Valid email is required")
            .Length(8, 320).WithMessage("Email must be between 8 and 320 characters long")
            .Must(UniqueEmail).WithMessage("Email already exists");
        RuleFor(user => user.Password)
            .MinimumLength(6).WithMessage("Password must be at least 6 characters");
        RuleFor(user => user.Phone)
            .Length(6, 16).WithMessage("Phone number must be between 6 and 16 characters");
    }

    public bool UniqueEmail(string email)
    {
        return !_db.Users.Any(u => u.Email == email);
    }
}