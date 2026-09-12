namespace LogAllTheThings.Api.Models;

public static class SupportedLifeEvents
{
    public static IReadOnlyList<string> Names { get; } =
    [
        "Haircut",
        "Nags"
    ];

    public static string? FindCanonicalName(string? value) =>
        Names.FirstOrDefault(name => string.Equals(name, value?.Trim(), StringComparison.OrdinalIgnoreCase));
}