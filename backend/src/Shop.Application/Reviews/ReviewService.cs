using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Reviews;

public sealed record ReviewDto(int Id, int ProductId, string Author, int Rating, string Title, string Comment, bool IsVerifiedPurchase, DateTime CreatedAt);
public sealed record CreateReviewRequest(int Rating, string? Title, string? Comment);

public interface IReviewService
{
    Task<IReadOnlyList<ReviewDto>> GetAsync(int productId, CancellationToken ct);
    Task<ReviewDto> AddAsync(int productId, CreateReviewRequest request, CancellationToken ct);
}

public sealed class ReviewService(IApplicationDbContext db, IIdentityService identity, ICurrentUser user) : IReviewService
{
    public async Task<IReadOnlyList<ReviewDto>> GetAsync(int productId, CancellationToken ct)
    {
        var reviews = await db.Reviews.AsNoTracking()
            .Where(r => r.ProductId == productId && r.Status == ReviewStatus.Approved)
            .OrderByDescending(r => r.CreatedAt).Take(100).ToListAsync(ct);
        var names = await identity.GetDisplayNamesAsync(reviews.Select(r => r.UserId).Distinct(), ct);
        return reviews.Select(r => ToDto(r, names.GetValueOrDefault(r.UserId, "Customer"))).ToList();
    }

    public async Task<ReviewDto> AddAsync(int productId, CreateReviewRequest request, CancellationToken ct)
    {
        var userId = user.UserId ?? throw AppException.Unauthorized("review.signin", "Sign in to write a review.");

        if (request.Rating is < 1 or > 5) throw AppException.Validation("Rating must be between 1 and 5.");
        var comment = (request.Comment ?? string.Empty).Trim();
        if (comment.Length is < 3 or > 2000) throw AppException.Validation("Comment must be 3-2000 characters.");

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.IsActive, ct)
            ?? throw AppException.NotFound("Product not found.");

        if (await db.Reviews.AnyAsync(r => r.ProductId == productId && r.UserId == userId, ct))
            throw AppException.Conflict("review.exists", "You already reviewed this product.");

        var verified = await db.OrderItems.AnyAsync(i => i.ProductId == productId && i.Order.UserId == userId
            && i.Order.Status != OrderStatus.Cancelled, ct);

        var review = new Review
        {
            ProductId = productId, UserId = userId, Rating = request.Rating,
            Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim()[..Math.Min(request.Title.Trim().Length, 150)],
            Comment = comment,
            Status = ReviewStatus.Approved, // no moderation queue yet: reviews are published immediately
            IsVerifiedPurchase = verified,
        };
        db.Reviews.Add(review);

        // Keep the denormalised aggregates in sync.
        var approved = db.Reviews.Where(r => r.ProductId == productId && r.Status == ReviewStatus.Approved);
        var count = await approved.CountAsync(ct);
        var sum = count == 0 ? 0 : await approved.SumAsync(r => r.Rating, ct);
        product.ReviewCount = count + 1;
        product.AverageRating = Math.Round((sum + request.Rating) / (decimal)(count + 1), 2);

        await db.SaveChangesAsync(ct);

        var names = await identity.GetDisplayNamesAsync([userId], ct);
        return ToDto(review, names.GetValueOrDefault(userId, "Customer"));
    }

    private static ReviewDto ToDto(Review r, string author) =>
        new(r.Id, r.ProductId, author, r.Rating, r.Title ?? string.Empty, r.Comment, r.IsVerifiedPurchase, r.CreatedAt);
}
