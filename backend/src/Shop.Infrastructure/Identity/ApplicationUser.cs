using Microsoft.AspNetCore.Identity;

namespace Shop.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public ApplicationUser()
    {
        Id = Guid.NewGuid();
    }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Notification preferences
    public bool EmailOrderUpdates { get; set; } = true;
    public bool EmailPromotions { get; set; }
    public bool PushNotifications { get; set; } = true;
}
