Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Locate node.exe
strNode = "node"
If fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    strNode = "C:\Program Files\nodejs\node.exe"
End If

' Run plant camera bridge supervisor 100% silently in background (0 = hidden window, zero CMD window)
WshShell.Run """" & strNode & """ """ & strPath & "\plant-camera-bridge.js""", 0, False
