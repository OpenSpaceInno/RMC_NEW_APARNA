using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;

namespace AparnaRMC.Launcher
{
    static class Program
    {
        private static Mutex mutex = null;
        private static Process serverProcess = null;
        private static NotifyIcon trayIcon = null;
        private static string appDir = "";
        private const string AppUrl = "http://localhost:3001";
        private const string AppTitle = "Aparna RMC - Plant Management System";

        [STAThread]
        static void Main(string[] args)
        {
            // Support command line --stop
            if (args.Length > 0 && args[0].ToLower() == "--stop")
            {
                KillRunningNodeServers();
                MessageBox.Show("Aparna RMC services have been stopped.", "Aparna RMC", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            bool createdNew;
            mutex = new Mutex(true, "Aparna_RMC_Desktop_Application_Mutex", out createdNew);

            // If another instance is already running, just open the app window and exit
            if (!createdNew)
            {
                OpenAppWindow();
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Determine application directory
            appDir = AppDomain.CurrentDomain.BaseDirectory;
            if (!File.Exists(Path.Combine(appDir, "server", "index.js")))
            {
                // Fallback to project root if executed from a subfolder
                DirectoryInfo parentInfo = Directory.GetParent(appDir);
                string parent = parentInfo != null ? parentInfo.FullName : null;
                if (parent != null && File.Exists(Path.Combine(parent, "server", "index.js")))
                {
                    appDir = parent;
                }
                else
                {
                    // Fallback to configured workspace directory
                    string hardcodedDir = @"s:\FULLstack\Internship\open_space\short film\Aparna_RMC-main";
                    if (File.Exists(Path.Combine(hardcodedDir, "server", "index.js")))
                    {
                        appDir = hardcodedDir;
                    }
                }
            }

            // Ensure server is running
            EnsureServerRunning();

            // Open the desktop application window
            OpenAppWindow();

            // Setup System Tray Icon
            SetupTrayIcon();

            // Register cleanup on exit
            Application.ApplicationExit += (s, e) => Cleanup();
            AppDomain.CurrentDomain.ProcessExit += (s, e) => Cleanup();

            // Run message loop for System Tray
            Application.Run();
        }

        private static bool IsServerHealthy()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(AppUrl + "/api/health");
                req.Timeout = 1500;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return res.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void EnsureServerRunning()
        {
            if (IsServerHealthy())
            {
                return; // Already active
            }

            string nodePath = FindNodeExecutable();
            if (string.IsNullOrEmpty(nodePath))
            {
                MessageBox.Show(
                    "Node.js was not found on your system. Please install Node.js from https://nodejs.org or verify your PATH.",
                    "Aparna RMC - Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                Environment.Exit(1);
            }

            string serverScript = Path.Combine(appDir, "server", "index.js");
            if (!File.Exists(serverScript))
            {
                MessageBox.Show(
                    "Cannot locate server entry point at: " + serverScript,
                    "Aparna RMC - Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                Environment.Exit(1);
            }

            try
            {
                string logsDir = Path.Combine(appDir, "logs");
                if (!Directory.Exists(logsDir))
                {
                    Directory.CreateDirectory(logsDir);
                }
                string logFile = Path.Combine(logsDir, "server.log");

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c \"\"" + nodePath + "\" \"" + serverScript + "\" >> \"" + logFile + "\" 2>&1\"";
                psi.WorkingDirectory = appDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;

                serverProcess = Process.Start(psi);

                // Wait up to 25 seconds for server to report healthy
                int maxRetries = 50;
                for (int i = 0; i < maxRetries; i++)
                {
                    Thread.Sleep(500);
                    if (IsServerHealthy())
                    {
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch background service: " + ex.Message, "Aparna RMC - Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static string FindNodeExecutable()
        {
            string[] candidatePaths = new string[]
            {
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\nodejs\node.exe")
            };

            foreach (string p in candidatePaths)
            {
                if (File.Exists(p)) return p;
            }

            // Check PATH environment variable
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                string[] parts = pathEnv.Split(Path.PathSeparator);
                foreach (string part in parts)
                {
                    try
                    {
                        string full = Path.Combine(part.Trim(), "node.exe");
                        if (File.Exists(full)) return full;
                    }
                    catch { }
                }
            }

            return "node.exe";
        }

        private static void OpenAppWindow()
        {
            string edge = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edge)) edge = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";

            string chrome = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chrome)) chrome = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";

            string args = "--app=\"" + AppUrl + "\" --window-size=1440,900";

            try
            {
                if (File.Exists(edge))
                {
                    Process.Start(edge, args);
                }
                else if (File.Exists(chrome))
                {
                    Process.Start(chrome, args);
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(AppUrl);
                }
            }
            catch
            {
                Process.Start(AppUrl);
            }
        }

        private static void SetupTrayIcon()
        {
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Aparna RMC Plant Management";

            // Load icon
            string iconPath = Path.Combine(appDir, "public", "app-icon.ico");
            if (File.Exists(iconPath))
            {
                try
                {
                    trayIcon.Icon = new Icon(iconPath);
                }
                catch
                {
                    trayIcon.Icon = SystemIcons.Application;
                }
            }
            else
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            // Context Menu
            ContextMenu menu = new ContextMenu();

            MenuItem openItem = new MenuItem("Open Aparna RMC", (s, e) => OpenAppWindow());
            openItem.DefaultItem = true;
            menu.MenuItems.Add(openItem);

            menu.MenuItems.Add("Open in Browser", (s, e) => Process.Start(AppUrl));

            menu.MenuItems.Add("View Server Logs", (s, e) => {
                string lf = Path.Combine(appDir, "logs", "server.log");
                if (File.Exists(lf))
                {
                    Process.Start("notepad.exe", lf);
                }
                else
                {
                    MessageBox.Show("No log file found yet.", "Aparna RMC", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            });

            menu.MenuItems.Add("-");

            menu.MenuItems.Add("Restart Backend Server", (s, e) => {
                KillServerProcess();
                KillRunningNodeServers();
                Thread.Sleep(1000);
                EnsureServerRunning();
                trayIcon.ShowBalloonTip(2000, "Aparna RMC", "Backend server restarted successfully.", ToolTipIcon.Info);
            });

            menu.MenuItems.Add("-");

            menu.MenuItems.Add("Exit & Stop Aparna RMC", (s, e) => {
                Cleanup();
                KillRunningNodeServers();
                Application.Exit();
            });

            trayIcon.ContextMenu = menu;
            trayIcon.DoubleClick += (s, e) => OpenAppWindow();
            trayIcon.Visible = true;

            trayIcon.ShowBalloonTip(3000, "Aparna RMC Ready", "Aparna RMC is active. Click this icon to open anytime.", ToolTipIcon.Info);
        }

        private static void KillServerProcess()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    // Kill process tree
                    Process p = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = "/PID " + serverProcess.Id + " /T /F",
                        CreateNoWindow = true,
                        UseShellExecute = false
                    });
                    if (p != null) p.WaitForExit(3000);
                }
            }
            catch { }
            serverProcess = null;
        }

        private static void KillRunningNodeServers()
        {
            try
            {
                // Kill any node processes running server/index.js
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "powershell",
                    Arguments = "-Command \"Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*server/index.js*' -or $_.CommandLine -like '*server\\\\index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\"",
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process p = Process.Start(psi);
                if (p != null) p.WaitForExit(5000);
            }
            catch { }
        }

        private static void Cleanup()
        {
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
                trayIcon = null;
            }

            KillServerProcess();

            if (mutex != null)
            {
                try { mutex.ReleaseMutex(); } catch { }
                mutex.Dispose();
                mutex = null;
            }
        }
    }
}
