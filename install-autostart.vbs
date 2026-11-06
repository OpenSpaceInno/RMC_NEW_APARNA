Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
strStartup = WshShell.SpecialFolders("Startup")

' 1. Create Auto-Start shortcut in Windows Startup folder (auto-runs on boot)
Set oLink = WshShell.CreateShortcut(strStartup & "\AparnaRMC_CameraBridge.lnk")
oLink.TargetPath = "wscript.exe"
oLink.Arguments = """" & strPath & "\start-bridge-silent.vbs"""
oLink.WorkingDirectory = strPath
oLink.Description = "Aparna RMC 24/7 Silent Camera Streaming Bridge"
oLink.Save

' 2. Start the silent bridge right now
WshShell.Run "wscript.exe """ & strPath & "\start-bridge-silent.vbs""", 0, False

WScript.Echo "SUCCESS: Aparna RMC 24/7 Camera Service installed into Windows Startup folder!" & vbCrLf & _
             "Streams are now running silently in the background and will auto-start every time Windows boots."
