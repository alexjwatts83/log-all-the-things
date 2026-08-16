namespace LogAllTheThings.Api.Models;

public static class SupportedMedicines
{
    public static IReadOnlyList<string> Names { get; } =
    [
        "Panadol Extra",
        "Panadol Rapid"
    ];

    public static string? FindCanonicalName(string? value) =>
        Names.FirstOrDefault(name => string.Equals(name, value?.Trim(), StringComparison.OrdinalIgnoreCase));
}