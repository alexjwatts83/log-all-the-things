using System.ComponentModel;
using System.Runtime.CompilerServices;
using DevLauncher.Models;

namespace DevLauncher.ViewModels;

public sealed class ServiceViewModel : INotifyPropertyChanged
{
    private ServiceState _state = ServiceState.Stopped;
    private int? _processId;

    public ServiceViewModel(
        ServiceDefinition definition,
        Func<ServiceDefinition, Task> start,
        Func<string, Task> stop,
        Func<ServiceDefinition, Task> restart,
        Func<ServiceDefinition, Task> forceRestart)
    {
        Definition = definition;
        StartCommand = new AsyncCommand(() => start(definition), () => State is ServiceState.Stopped or ServiceState.Crashed);
        StopCommand = new AsyncCommand(() => stop(definition.Id), () => State is ServiceState.Starting or ServiceState.Running);
        RestartCommand = new AsyncCommand(() => restart(definition), () => State is ServiceState.Starting or ServiceState.Running or ServiceState.Crashed);
        ForceRestartCommand = new AsyncCommand(() => forceRestart(definition));
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    public ServiceDefinition Definition { get; }
    public string Name => Definition.Name;
    public string Address => $"http://localhost:{Definition.Port}";
    public AsyncCommand StartCommand { get; }
    public AsyncCommand StopCommand { get; }
    public AsyncCommand RestartCommand { get; }
    public AsyncCommand ForceRestartCommand { get; }

    public ServiceState State
    {
        get => _state;
        private set
        {
            if (_state == value)
            {
                return;
            }

            _state = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(StateText));
            RaiseCommandStates();
        }
    }

    public string StateText => State.ToString();

    public int? ProcessId
    {
        get => _processId;
        private set
        {
            _processId = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(ProcessText));
        }
    }

    public string ProcessText => ProcessId is null ? "No process" : $"PID {ProcessId}";

    public void Update(ServiceState state, int? processId)
    {
        ProcessId = processId;
        State = state;
    }

    private void RaiseCommandStates()
    {
        StartCommand.RaiseCanExecuteChanged();
        StopCommand.RaiseCanExecuteChanged();
        RestartCommand.RaiseCanExecuteChanged();
        ForceRestartCommand.RaiseCanExecuteChanged();
    }

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}