namespace LogAllTheThings.Api.Models;

public static class SupportedCarEvents
{
    public static IReadOnlyList<string> Names { get; } =
    [
        "Car Washed",
        "Petrol",
        "Service",
        "Rego",
        "Insurance",
        "Misc"
    ];

    public static string? FindCanonicalName(string? value) =>
        Names.FirstOrDefault(name => string.Equals(name, value?.Trim(), StringComparison.OrdinalIgnoreCase));
}