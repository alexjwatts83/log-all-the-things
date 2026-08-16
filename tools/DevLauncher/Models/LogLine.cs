namespace DevLauncher.Models;

public sealed record LogLine(DateTimeOffset Timestamp, string ServiceId, bool IsError, string Text)
{
    public string Display => $"{Timestamp:HH:mm:ss}  [{ServiceId.ToUpperInvariant()}]  {Text}";
}