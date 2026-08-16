using System.IO;

namespace DevLauncher.Diagnostics;

public static class LauncherLog
{
    private static readonly object Sync = new();

    public static string FilePath { get; } = Path.Combine(
        @"C:\logs",
        "LogAllTheThings",
        "DevLauncher",
        "launcher.log");

    public static void Write(string message, Exception? exception = null)
    {
        try
        {
            var detail = exception is null ? message : $"{message}{Environment.NewLine}{exception}";
            var line = $"{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss.fff zzz}  {detail}{Environment.NewLine}";

            lock (Sync)
            {
                Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
                File.AppendAllText(FilePath, line);
            }
        }
        catch
        {
        }
    }
}