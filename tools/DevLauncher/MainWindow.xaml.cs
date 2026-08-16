using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using DevLauncher.Diagnostics;
using DevLauncher.ViewModels;

namespace DevLauncher;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel = new();
    private bool _shutdownComplete;
    private bool _shutdownStarted;
    private bool _scrollPending;

    public MainWindow()
    {
        InitializeComponent();
        DataContext = _viewModel;
        _viewModel.Logs.CollectionChanged += (_, _) =>
        {
            if (AutoScrollCheckBox.IsChecked == true && _viewModel.Logs.Count > 0 && !_scrollPending)
            {
                _scrollPending = true;
                _ = Dispatcher.InvokeAsync(() =>
                {
                    _scrollPending = false;
                    if (AutoScrollCheckBox.IsChecked == true && _viewModel.Logs.Count > 0)
                    {
                        LogList.ScrollIntoView(_viewModel.Logs[^1]);
                    }
                }, DispatcherPriority.ContextIdle);
            }
        };
    }

    public void ShowError(string message)
    {
        if (_shutdownStarted)
        {
            return;
        }

        ErrorText.Text = message;
        ErrorBanner.Visibility = Visibility.Visible;
    }

    private void ClearLogs_Click(object sender, RoutedEventArgs e) => _viewModel.ClearLogs();

    private void DismissError_Click(object sender, RoutedEventArgs e) =>
        ErrorBanner.Visibility = Visibility.Collapsed;

    private void OpenLog_Click(object sender, RoutedEventArgs e) => Process.Start(new ProcessStartInfo
    {
        FileName = LauncherLog.FilePath,
        UseShellExecute = true
    });

    private async void Window_Closing(object? sender, CancelEventArgs e)
    {
        if (_shutdownComplete)
        {
            return;
        }

        e.Cancel = true;
        if (_shutdownStarted)
        {
            return;
        }

        _shutdownStarted = true;
        IsEnabled = false;
        await _viewModel.StopAllAsync();
        _viewModel.Dispose();
        _shutdownComplete = true;
        _ = Dispatcher.InvokeAsync(Close, DispatcherPriority.ApplicationIdle);
    }
}