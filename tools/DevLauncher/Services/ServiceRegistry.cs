using System.IO;
using DevLauncher.Models;

namespace DevLauncher.Services;

public static class ServiceRegistry
{
    public static IReadOnlyList<ServiceDefinition> Create()
    {
        var root = FindRepositoryRoot();

        return
        [
            new(
                "api",
                "API",
                "dotnet",
                ["run"],
                Path.Combine(root, "src", "LogAllTheThings.Api"),
                5000,
                "Now listening on"),
            new(
                "web",
                "Web",
                ResolveExecutable("npm.cmd"),
                ["run", "dev"],
                Path.Combine(root, "src", "LogAllTheThings.Web"),
                5173,
                "ready in")
        ];
    }

    private static string FindRepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "LogAllTheThings.sln")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException("Could not find LogAllTheThings.sln from the launcher directory.");
    }

    private static string ResolveExecutable(string fileName)
    {
        var path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        foreach (var directory in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(directory.Trim('"'), fileName);
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        throw new FileNotFoundException($"Could not find {fileName} on PATH.");
    }
}