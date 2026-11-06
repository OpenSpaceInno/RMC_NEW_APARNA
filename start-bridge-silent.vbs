Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Run Camera 1 bridge silently in background (0 = hidden window)
WshShell.Run """" & strPath & "\push-camera1-live.bat""", 0, False

' Small 1-second stagger to prevent simultaneous resource spike
WScript.Sleep 1000

' Run Camera 2 bridge silently in background (0 = hidden window)
WshShell.Run """" & strPath & "\push-camera2-live.bat""", 0, False
