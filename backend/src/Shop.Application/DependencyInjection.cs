using Microsoft.Extensions.DependencyInjection;
using Shop.Application.Auth;
using Shop.Application.Catalog;
using Shop.Application.Marketing;
using Shop.Application.Orders;
using Shop.Application.Reviews;

namespace Shop.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<ICouponService, CouponService>();
        services.AddScoped<IShippingService, ShippingService>();
        services.AddScoped<INewsletterService, NewsletterService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
