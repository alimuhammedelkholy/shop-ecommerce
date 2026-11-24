using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Address : BaseEntity
{
    public Guid UserId { get; set; }
    public string? Label { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
