namespace Shop.Application.Common;

public enum ErrorKind { Validation, NotFound, Conflict, Unauthorized }

/// <summary>
/// A business-rule failure. <see cref="Code"/> is a stable machine-readable key (e.g. "coupon.invalid")
/// that the Angular client maps to a localized message; the Api layer maps <see cref="Kind"/> to an HTTP status.
/// </summary>
public class AppException(ErrorKind kind, string code, string message, IReadOnlyDictionary<string, object>? parameters = null)
    : Exception(message)
{
    public ErrorKind Kind { get; } = kind;
    public string Code { get; } = code;
    public IReadOnlyDictionary<string, object>? Parameters { get; } = parameters;

    public static AppException NotFound(string message = "Resource not found.") => new(ErrorKind.NotFound, "error.notFound", message);
    public static AppException Validation(string message, string code = "error.validation") => new(ErrorKind.Validation, code, message);
    public static AppException Conflict(string code, string message) => new(ErrorKind.Conflict, code, message);
    public static AppException Unauthorized(string code, string message) => new(ErrorKind.Unauthorized, code, message);
}
