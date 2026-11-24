using Shop.Domain.Enums;

namespace Shop.Application.Abstractions;

public sealed record UserInfo(Guid Id, string Name, string Email, IReadOnlyList<string> Roles);

/// <summary>User management. Implemented in Infrastructure on top of ASP.NET Core Identity.</summary>
public interface IIdentityService
{
    Task<UserInfo> RegisterAsync(string name, string email, string password, CancellationToken ct);
    Task<UserInfo> ValidateCredentialsAsync(string email, string password, CancellationToken ct);
    Task<IReadOnlyDictionary<Guid, string>> GetDisplayNamesAsync(IEnumerable<Guid> userIds, CancellationToken ct);
}

public interface ITokenService
{
    string CreateAccessToken(UserInfo user);
}

/// <summary>The signed-in caller, if any. Implemented in the Api layer from HttpContext.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}

public sealed record PaymentRequest(string OrderNumber, PaymentProvider Provider, decimal Amount, string Currency);
public sealed record PaymentResult(bool Succeeded, bool Captured, string? ProviderPaymentId, string? FailureReason);

/// <summary>Payment provider seam. Infrastructure ships a development stub; plug Stripe/PayPal in here.</summary>
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken ct);
}
