using Microsoft.Extensions.Logging;
using Shop.Application.Abstractions;

namespace Shop.Infrastructure.Payments;

/// <summary>
/// Development stand-in for a real PSP: approves every card/PayPal payment without contacting anyone.
/// Replace with a Stripe/PayPal implementation of <see cref="IPaymentGateway"/> before taking real money.
/// </summary>
public sealed class DevPaymentGateway(ILogger<DevPaymentGateway> logger) : IPaymentGateway
{
    public Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken ct)
    {
        logger.LogWarning("DEV payment gateway approved {Amount} {Currency} for {Order} via {Provider}. No real charge was made.",
            request.Amount, request.Currency, request.OrderNumber, request.Provider);
        return Task.FromResult(new PaymentResult(true, true, $"dev_{Guid.NewGuid():N}", null));
    }
}
