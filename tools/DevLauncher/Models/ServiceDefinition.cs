namespace DevLauncher.Models;

public sealed record ServiceDefinition(
    string Id,
    string Name,
    string FileName,
    IReadOnlyList<string> Arguments,
    string WorkingDirectory,
    int Port,
    string ReadyPattern);