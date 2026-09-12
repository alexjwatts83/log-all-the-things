using System.Collections.ObjectModel;
using System.Windows;
using DevLauncher.Diagnostics;
using DevLauncher.Models;
using DevLauncher.Services;

namespace DevLauncher.ViewModels;

public sealed class MainViewModel : IDisposable
{
    private const int MaximumLogLines = 5000;
    private readonly ProcessSupervisor _supervisor = new();

    public event Action<ServiceState>? WebStateChanged;

    public MainViewModel()
    {
        Services = new ObservableCollection<ServiceViewModel>(
            ServiceRegistry.Create().Select(definition => new ServiceViewModel(
                definition,
                StartAsync,
                StopAsync,
                RestartAsync,
                ForceRestartAsync)));

        StartAllCommand = new AsyncCommand(StartAllAsync);
        StopAllCommand = new AsyncCommand(StopAllAsync);
        RestartAllCommand = new AsyncCommand(RestartAllAsync);
        ForceRestartAllCommand = new AsyncCommand(ForceRestartAllAsync);
        _supervisor.LogReceived += OnLogReceived;
        _supervisor.StateChanged += OnStateChanged;
    }

    public ObservableCollection<ServiceViewModel> Services { get; }
    public ObservableCollection<LogLine> Logs { get; } = [];
    public AsyncCommand StartAllCommand { get; }
    public AsyncCommand StopAllCommand { get; }
    public AsyncCommand RestartAllCommand { get; }
    public AsyncCommand ForceRestartAllCommand { get; }

    public async Task StartAllAsync()
    {
        AddLauncherLog("Start all requested.");
        foreach (var service in Services)
        {
            await StartAsync(service.Definition);
        }
    }

    public async Task StopAllAsync()
    {
        AddLauncherLog("Stop all requested.");
        foreach (var service in Services.Reverse())
        {
            await StopAsync(service.Definition.Id);
        }
    }

    public void ClearLogs() => Logs.Clear();

    public void Dispose()
    {
        _supervisor.LogReceived -= OnLogReceived;
        _supervisor.StateChanged -= OnStateChanged;
        _supervisor.Dispose();
    }

    private Task StartAsync(ServiceDefinition definition) => _supervisor.StartAsync(definition);

    private Task StopAsync(string serviceId) => _supervisor.StopAsync(serviceId);

    private Task ForceStopAsync(ServiceDefinition definition) => _supervisor.ForceStopAsync(definition);

    private async Task RestartAsync(ServiceDefinition definition)
    {
        await StopAsync(definition.Id);
        await StartAsync(definition);
    }

    private Task ForceRestartAsync(ServiceDefinition definition) => _supervisor.ForceRestartAsync(definition);

    private async Task RestartAllAsync()
    {
        AddLauncherLog("Restart all requested.");
        await StopAllAsync();
        await StartAllAsync();
    }

    private async Task ForceRestartAllAsync()
    {
        AddLauncherLog("Force restart all requested.");
        foreach (var service in Services.Reverse())
        {
            await ForceStopAsync(service.Definition);
        }

        foreach (var service in Services)
        {
            await StartAsync(service.Definition);
        }
    }

    private void OnLogReceived(LogLine line) => Dispatch(() =>
    {
        Logs.Add(line);
        if (Logs.Count > MaximumLogLines)
        {
            Logs.RemoveAt(0);
        }
    });

    private void OnStateChanged(string serviceId, ServiceState state, int? processId) => Dispatch(() =>
    {
        Services.First(service => service.Definition.Id == serviceId).Update(state, processId);
        if (serviceId == "web")
        {
            WebStateChanged?.Invoke(state);
        }
    });

    private void AddLauncherLog(string text)
    {
        LauncherLog.Write($"[LAUNCHER] {text}");
        OnLogReceived(new LogLine(DateTimeOffset.Now, "launcher", false, text));
    }

    private static void Dispatch(Action action)
    {
        var dispatcher = Application.Current.Dispatcher;
        if (dispatcher.CheckAccess())
        {
            action();
        }
        else
        {
            _ = dispatcher.InvokeAsync(action);
        }
    }
}