using System.Net.NetworkInformation;

namespace DevLauncher.Services;

public static class PortInspector
{
    public static bool IsListening(int port) =>
        IPGlobalProperties.GetIPGlobalProperties()
            .GetActiveTcpListeners()
            .Any(endpoint => endpoint.Port == port);
}