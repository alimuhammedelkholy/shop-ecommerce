using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Orders;

namespace Shop.Api.Controllers;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController(IOrderService orders) : ControllerBase
{
    /// <summary>Guest checkout is allowed; when a valid bearer token is sent the order is attached to that account.</summary>
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Place(PlaceOrderRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey, CancellationToken ct)
    {
        var order = await orders.PlaceAsync(request, idempotencyKey, ct);
        return Created($"/api/orders/{order.Number}", order);
    }

    [HttpGet, Authorize]
    public async Task<IReadOnlyList<OrderDto>> Mine(CancellationToken ct) => await orders.ListMineAsync(ct);

    [HttpGet("{number}")]
    public async Task<OrderDto> Get(string number, [FromQuery] string? email, CancellationToken ct) => await orders.GetAsync(number, email, ct);
}
