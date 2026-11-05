@echo off
setlocal
echo Stopping Aparna RMC Desktop Application and Services...
cd /d "%~dp0"
if exist "Aparna-RMC.exe" (
    start "" "Aparna-RMC.exe" --stop
) else (
    powershell -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*server/index.js*' -or $_.CommandLine -like '*server\\index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
    echo All Aparna RMC services stopped.
)
