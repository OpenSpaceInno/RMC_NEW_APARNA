@echo off
setlocal
echo ===================================================
echo   Building Aparna RMC Desktop Application (.exe)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Building production frontend assets...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Compiling native Windows executable (Aparna-RMC.exe)...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /win32icon:"public\app-icon.ico" /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll /r:System.Core.dll /out:"Aparna-RMC.exe" "launcher\Program.cs"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] C# compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Creating/Updating Desktop shortcut...
powershell -ExecutionPolicy Bypass -File "scripts\create-desktop-shortcut.ps1"

echo.
echo ===================================================
echo   Aparna-RMC.exe built successfully!
echo   Desktop icon is ready on your Desktop.
echo ===================================================
pause
