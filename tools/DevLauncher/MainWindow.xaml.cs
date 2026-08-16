using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using DevLauncher.Diagnostics;
using DevLauncher.Models;
using DevLauncher.ViewModels;
using Microsoft.Web.WebView2.Core;

namespace DevLauncher;

public partial class MainWindow : Window
{
    private static readonly Uri WebAppAddress = new("http://localhost:5173");
    private readonly MainViewModel _viewModel = new();
    private bool _shutdownComplete;
    private bool _shutdownStarted;
    private bool _scrollPending;
    private bool _webViewInitialized;

    public MainWindow()
    {
        InitializeComponent();
        DataContext = _viewModel;
        _viewModel.WebStateChanged += OnWebStateChanged;
        AppWebView.NavigationCompleted += AppWebView_NavigationCompleted;
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

    private async void OnWebStateChanged(ServiceState state)
    {
        if (_shutdownStarted)
        {
            return;
        }

        if (state != ServiceState.Running)
        {
            AppWebView.Visibility = Visibility.Collapsed;
            AppWaitingPanel.Visibility = Visibility.Visible;
            AppWaitingText.Text = state == ServiceState.Crashed
                ? "The Web service stopped unexpectedly. Check the Logs tab for details."
                : "Start the Web service to load the app here.";
            return;
        }

        AppTab.IsSelected = true;
        AppWaitingPanel.Visibility = Visibility.Visible;
        AppWaitingText.Text = "Loading the app...";

        try
        {
            if (!_webViewInitialized)
            {
                await AppWebView.EnsureCoreWebView2Async();
                _webViewInitialized = true;
            }

            AppWebView.Visibility = Visibility.Visible;
            AppWebView.Source = WebAppAddress;
            LauncherLog.Write($"[LAUNCHER] Loading app preview from {WebAppAddress}.");
        }
        catch (Exception exception)
        {
            LauncherLog.Write("Failed to initialize the app preview.", exception);
            AppWebView.Visibility = Visibility.Collapsed;
            AppWaitingText.Text = "The embedded browser could not start. Use Open in browser instead.";
            ShowError("The app preview could not start. Details were written to the log file.");
        }
    }

    private void AppWebView_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        if (e.IsSuccess)
        {
            AppWaitingPanel.Visibility = Visibility.Collapsed;
            return;
        }

        LauncherLog.Write($"App preview navigation failed: {e.WebErrorStatus}.");
        AppWebView.Visibility = Visibility.Collapsed;
        AppWaitingPanel.Visibility = Visibility.Visible;
        AppWaitingText.Text = $"The app could not be loaded ({e.WebErrorStatus}). Check the Logs tab.";
    }

    private void RefreshApp_Click(object sender, RoutedEventArgs e)
    {
        if (_webViewInitialized)
        {
            AppWebView.Reload();
        }
    }

    private void OpenApp_Click(object sender, RoutedEventArgs e) => Process.Start(new ProcessStartInfo
    {
        FileName = WebAppAddress.AbsoluteUri,
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
        AppWebView.Dispose();
        _shutdownComplete = true;
        _ = Dispatcher.InvokeAsync(Close, DispatcherPriority.ApplicationIdle);
    }
}