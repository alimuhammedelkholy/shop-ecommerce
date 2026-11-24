using System.Net.Mail;

namespace Shop.Application.Common;

public static class Validation
{
    public static bool IsEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 256) return false;
        return MailAddress.TryCreate(value, out var addr) && addr.Address == value && value.Contains('.', StringComparison.Ordinal);
    }
}
