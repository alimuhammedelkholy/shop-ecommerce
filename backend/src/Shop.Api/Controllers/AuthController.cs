using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Shop.Application.Auth;

namespace Shop.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    public async Task<AuthResultDto> Login(LoginRequest request, CancellationToken ct) => await auth.LoginAsync(request, ct);

    [HttpPost("register")]
    public async Task<AuthResultDto> Register(RegisterRequest request, CancellationToken ct) => await auth.RegisterAsync(request, ct);
}
