using System.Diagnostics;
using System.Text;
using DevLauncher.Diagnostics;
using DevLauncher.Models;

namespace DevLauncher.Services;

public sealed class ProcessSupervisor : IDisposable
{
    private readonly Dictionary<string, SupervisedProcess> _processes = [];
    private readonly object _sync = new();

    public event Action<LogLine>? LogReceived;
    public event Action<string, ServiceState, int?>? StateChanged;

    public Task StartAsync(ServiceDefinition definition)
    {
        lock (_sync)
        {
            if (_processes.TryGetValue(definition.Id, out var existing) && existing.IsActive)
            {
                Log(definition.Id, false, "Start ignored because the service is already active.");
                return Task.CompletedTask;
            }

            if (PortInspector.IsListening(definition.Port))
            {
                Log(definition.Id, true, $"Port {definition.Port} is already in use. Stop the existing service and try again.");
                StateChanged?.Invoke(definition.Id, ServiceState.Crashed, null);
                return Task.CompletedTask;
            }

            Log(definition.Id, false, $"Starting {definition.Name} in {definition.WorkingDirectory}.");
            StateChanged?.Invoke(definition.Id, ServiceState.Starting, null);

            var startInfo = new ProcessStartInfo
            {
                FileName = definition.FileName,
                WorkingDirectory = definition.WorkingDirectory,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            foreach (var argument in definition.Arguments)
            {
                startInfo.ArgumentList.Add(argument);
            }

            var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
            var supervised = new SupervisedProcess(process, definition);
            process.OutputDataReceived += (_, args) => HandleOutput(supervised, args.Data, false);
            process.ErrorDataReceived += (_, args) => HandleOutput(supervised, args.Data, true);
            process.Exited += (_, _) => HandleExit(supervised);

            try
            {
                if (!process.Start())
                {
                    throw new InvalidOperationException($"Failed to start {definition.Name}.");
                }

                supervised.ProcessId = process.Id;
                _processes[definition.Id] = supervised;
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();
                Log(definition.Id, false, $"Started {definition.FileName} (PID {supervised.ProcessId}).");
                StateChanged?.Invoke(definition.Id, ServiceState.Starting, supervised.ProcessId);
            }
            catch (Exception exception)
            {
                _processes.Remove(definition.Id);
                process.Dispose();
                Log(definition.Id, true, $"Start failed: {exception}");
                StateChanged?.Invoke(definition.Id, ServiceState.Crashed, null);
            }
        }

        return Task.CompletedTask;
    }

    public async Task StopAsync(string serviceId)
    {
        SupervisedProcess? supervised;
        lock (_sync)
        {
            if (!_processes.TryGetValue(serviceId, out supervised) || !supervised.IsActive)
            {
                Log(serviceId, false, "Stop ignored because the service is not active.");
                StateChanged?.Invoke(serviceId, ServiceState.Stopped, null);
                return;
            }

            supervised.StopRequested = true;
            Log(serviceId, false, $"Stopping process tree for PID {supervised.ProcessId}.");
            StateChanged?.Invoke(serviceId, ServiceState.Stopping, supervised.ProcessId);
        }

        try
        {
            supervised.Process.Kill(entireProcessTree: true);
            await supervised.Process.WaitForExitAsync();
        }
        catch (Exception exception) when (exception is InvalidOperationException or ObjectDisposedException)
        {
            Log(serviceId, false, $"Process was already stopped: {exception.Message}");
            StateChanged?.Invoke(serviceId, ServiceState.Stopped, null);
        }
    }

    public void Dispose()
    {
        SupervisedProcess[] processes;
        lock (_sync)
        {
            processes = [.. _processes.Values];
        }

        foreach (var supervised in processes)
        {
            try
            {
                if (supervised.IsActive)
                {
                    supervised.StopRequested = true;
                    supervised.Process.Kill(entireProcessTree: true);
                    supervised.Process.WaitForExit(5000);
                }
            }
            catch (Exception exception) when (exception is InvalidOperationException or ObjectDisposedException)
            {
                LauncherLog.Write($"Process {supervised.ProcessId} was already unavailable during shutdown.", exception);
            }
            finally
            {
                supervised.Process.Dispose();
            }
        }
    }

    private void HandleOutput(SupervisedProcess supervised, string? text, bool isError)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return;
            }

            Log(supervised.Definition.Id, isError, text);

            if (!supervised.Ready && text.Contains(supervised.Definition.ReadyPattern, StringComparison.OrdinalIgnoreCase))
            {
                supervised.Ready = true;
                StateChanged?.Invoke(supervised.Definition.Id, ServiceState.Running, supervised.ProcessId);
            }
        }
        catch (Exception exception)
        {
            LauncherLog.Write($"Failed to handle output for {supervised.Definition.Id}.", exception);
        }
    }

    private void HandleExit(SupervisedProcess supervised)
    {
        if (Interlocked.Exchange(ref supervised.ExitHandled, 1) != 0)
        {
            return;
        }

        try
        {
            supervised.Process.WaitForExit();
            var state = supervised.StopRequested ? ServiceState.Stopped : ServiceState.Crashed;
            Log(supervised.Definition.Id, !supervised.StopRequested, $"Process exited with code {supervised.Process.ExitCode}.");
            StateChanged?.Invoke(supervised.Definition.Id, state, null);
        }
        catch (Exception exception)
        {
            LauncherLog.Write($"Failed to handle process exit for {supervised.Definition.Id}.", exception);
            StateChanged?.Invoke(supervised.Definition.Id, ServiceState.Crashed, null);
        }
        finally
        {
            lock (_sync)
            {
                _processes.Remove(supervised.Definition.Id);
            }

            supervised.Process.Dispose();
        }
    }

    private void Log(string serviceId, bool isError, string text)
    {
        LauncherLog.Write($"[{serviceId.ToUpperInvariant()}] {(isError ? "ERROR " : string.Empty)}{text}");
        LogReceived?.Invoke(new LogLine(DateTimeOffset.Now, serviceId, isError, text));
    }

    private sealed class SupervisedProcess(Process process, ServiceDefinition definition)
    {
        public Process Process { get; } = process;
        public ServiceDefinition Definition { get; } = definition;
        public int? ProcessId { get; set; }
        public bool Ready { get; set; }
        public bool StopRequested { get; set; }
        public int ExitHandled;

        public bool IsActive
        {
            get
            {
                try
                {
                    return ProcessId is not null && !Process.HasExited;
                }
                catch (InvalidOperationException)
                {
                    return false;
                }
            }
        }
    }
}