using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Reviews;

namespace Shop.Api.Controllers;

[ApiController]
[Route("api/products/{productId:int}/reviews")]
public sealed class ReviewsController(IReviewService reviews) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<ReviewDto>> Get(int productId, CancellationToken ct) => await reviews.GetAsync(productId, ct);

    [HttpPost, Authorize]
    public async Task<ActionResult<ReviewDto>> Post(int productId, CreateReviewRequest request, CancellationToken ct)
    {
        var created = await reviews.AddAsync(productId, request, ct);
        return CreatedAtAction(nameof(Get), new { productId }, created);
    }
}
