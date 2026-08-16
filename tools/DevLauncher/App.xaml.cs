using System.Windows;
using System.Windows.Threading;
using DevLauncher.Diagnostics;

namespace DevLauncher;

public partial class App : Application
{
    private void Application_Startup(object sender, StartupEventArgs e)
    {
        LauncherLog.Write($"Launcher started. Log file: {LauncherLog.FilePath}");
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
            LauncherLog.Write("Unhandled application-domain exception.", args.ExceptionObject as Exception);
        TaskScheduler.UnobservedTaskException += (_, args) =>
        {
            LauncherLog.Write("Unobserved task exception.", args.Exception);
            args.SetObserved();
        };
    }

    private void Application_DispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        LauncherLog.Write("Unhandled UI exception.", e.Exception);
        if (MainWindow is MainWindow window)
        {
            window.ShowError("The launcher encountered an error. Details were written to the log file.");
        }

        e.Handled = true;
    }

    private void Application_Exit(object sender, ExitEventArgs e) =>
        LauncherLog.Write($"Launcher exited with code {e.ApplicationExitCode}.");
}

