using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Domain.Constants;

namespace Shop.Infrastructure.Identity;

public sealed class IdentityService(UserManager<ApplicationUser> users) : IIdentityService
{
    public async Task<UserInfo> RegisterAsync(string name, string email, string password, CancellationToken ct)
    {
        if (await users.FindByEmailAsync(email) is not null)
            throw AppException.Conflict("auth.exists", "An account with this email already exists.");

        var parts = name.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var user = new ApplicationUser
        {
            UserName = email, Email = email, EmailConfirmed = true,
            FirstName = parts[0], LastName = parts.Length > 1 ? parts[1] : string.Empty,
        };

        var created = await users.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            var weak = created.Errors.Any(e => e.Code.StartsWith("Password", StringComparison.Ordinal));
            throw weak
                ? AppException.Validation(string.Join(" ", created.Errors.Select(e => e.Description)), "auth.weak")
                : AppException.Validation(string.Join(" ", created.Errors.Select(e => e.Description)));
        }

        await users.AddToRoleAsync(user, Roles.Customer);
        return await ToInfoAsync(user);
    }

    public async Task<UserInfo> ValidateCredentialsAsync(string email, string password, CancellationToken ct)
    {
        var invalid = AppException.Unauthorized("auth.invalid", "Invalid email or password.");
        var user = await users.FindByEmailAsync(email);
        if (user is null || !user.IsActive) throw invalid;
        if (await users.IsLockedOutAsync(user)) throw AppException.Unauthorized("auth.locked", "Account temporarily locked. Try again later.");

        if (!await users.CheckPasswordAsync(user, password))
        {
            await users.AccessFailedAsync(user);
            throw invalid;
        }

        await users.ResetAccessFailedCountAsync(user);
        user.LastLoginAt = DateTime.UtcNow;
        await users.UpdateAsync(user);
        return await ToInfoAsync(user);
    }

    public async Task<IReadOnlyDictionary<Guid, string>> GetDisplayNamesAsync(IEnumerable<Guid> userIds, CancellationToken ct)
    {
        var ids = userIds.Distinct().ToList();
        var rows = await users.Users.AsNoTracking().Where(u => ids.Contains(u.Id)).Select(u => new { u.Id, u.FirstName, u.LastName }).ToListAsync(ct);
        // Only first name + last initial are ever shown publicly.
        return rows.ToDictionary(u => u.Id, u => u.LastName.Length > 0 ? $"{u.FirstName} {u.LastName[0]}." : u.FirstName);
    }

    private async Task<UserInfo> ToInfoAsync(ApplicationUser u) =>
        new(u.Id, $"{u.FirstName} {u.LastName}".Trim(), u.Email ?? string.Empty, (await users.GetRolesAsync(u)).ToList());
}
