using Microsoft.AspNetCore.Mvc;
using Shop.Application.Marketing;

namespace Shop.Api.Controllers;

public sealed record ValidateCouponRequest(string Code, decimal Subtotal);
public sealed record SubscribeRequest(string Email);

[ApiController]
[Route("api")]
public sealed class StoreController(ICouponService coupons, IShippingService shipping, INewsletterService newsletter) : ControllerBase
{
    [HttpGet("shipping-methods")]
    public async Task<IReadOnlyList<ShippingMethodDto>> ShippingMethods(CancellationToken ct) => await shipping.GetAsync(ct);

    [HttpPost("coupons/validate")]
    public async Task<CouponDto> ValidateCoupon(ValidateCouponRequest request, CancellationToken ct) =>
        await coupons.ValidateAsync(request.Code, request.Subtotal, ct);

    [HttpPost("newsletter")]
    public async Task<IActionResult> Subscribe(SubscribeRequest request, CancellationToken ct)
    {
        await newsletter.SubscribeAsync(request.Email, ct);
        return NoContent();
    }
}
