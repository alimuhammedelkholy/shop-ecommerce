using Shop.Application.Abstractions;
using Shop.Application.Common;

namespace Shop.Application.Auth;

public sealed record AuthUserDto(string Id, string Name, string Email);
public sealed record AuthResultDto(string Token, AuthUserDto User);
public sealed record LoginRequest(string Email, string Password);
public sealed record RegisterRequest(string Name, string Email, string Password);

public interface IAuthService
{
    Task<AuthResultDto> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResultDto> RegisterAsync(RegisterRequest request, CancellationToken ct);
}

public sealed class AuthService(IIdentityService identity, ITokenService tokens) : IAuthService
{
    public async Task<AuthResultDto> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrEmpty(request.Password))
            throw AppException.Unauthorized("auth.invalid", "Invalid email or password.");

        var user = await identity.ValidateCredentialsAsync(request.Email.Trim(), request.Password, ct);
        return Build(user);
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var name = (request.Name ?? string.Empty).Trim();
        if (name.Length is < 2 or > 100) throw AppException.Validation("Name must be 2-100 characters.");
        if (!Validation.IsEmail(request.Email?.Trim())) throw AppException.Validation("Enter a valid email address.");

        var user = await identity.RegisterAsync(name, request.Email!.Trim(), request.Password ?? string.Empty, ct);
        return Build(user);
    }

    private AuthResultDto Build(UserInfo u) => new(tokens.CreateAccessToken(u), new AuthUserDto(u.Id.ToString(), u.Name, u.Email));
}
