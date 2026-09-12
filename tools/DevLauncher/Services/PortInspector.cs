using System.Diagnostics;
using System.Net.NetworkInformation;

namespace DevLauncher.Services;

public static class PortInspector
{
    public static bool IsListening(int port) =>
        IPGlobalProperties.GetIPGlobalProperties()
            .GetActiveTcpListeners()
            .Any(endpoint => endpoint.Port == port);

    public static void FreePort(int port)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -Command \"Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}\"",
                CreateNoWindow = true,
                UseShellExecute = false
            };
            using var process = Process.Start(startInfo);
            process?.WaitForExit(5000);
        }
        catch
        {
            // Ignore if process cleanup fails
        }
    }
}