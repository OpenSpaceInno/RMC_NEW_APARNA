@echo off
:: Ensure administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [REQUESTING ADMIN PRIVILEGES]
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

title Aparna RMC - Install 24/7 Camera Background Service
echo =================================================================
echo  Aparna RMC - 24/7 Automated Plant Camera Streaming Service
echo =================================================================
echo.
echo Installing Windows Task Scheduler background service...
echo The bridge will automatically start on Windows boot, run silently
echo in the background (no CMD windows), and stream 24/7 to the cloud.
echo.

set SCRIPT_DIR=%~dp0
set VBS_PATH=%SCRIPT_DIR%start-bridge-silent.vbs

:: Kill any existing running streams first
taskkill /F /IM ffmpeg.exe >nul 2>&1

:: Create Scheduled Task that runs on user logon with highest privileges
schtasks /create /tn "AparnaRMC_CameraBridge" /tr "wscript.exe \"%VBS_PATH%\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo =================================================================
    echo  [SUCCESS] Aparna RMC 24/7 Camera Service installed!
    echo =================================================================
    echo  * Automatically starts on Windows boot / logon.
    echo  * Runs 100%% silently in the background (zero CMD windows).
    echo  * Auto-reconnects if network or camera drops.
    echo  * Mobile & remote users can view live streams 24/7.
    echo.
    echo Starting background service now...
    wscript.exe "%VBS_PATH%"
    timeout /t 3 /nobreak >nul
    echo.
    echo [STATUS] Checking running streaming processes:
    tasklist /FI "IMAGENAME eq ffmpeg.exe" 2>nul | find /I "ffmpeg.exe" >nul
    if %errorlevel% equ 0 (
        echo  [OK] Streaming bridge is ACTIVE and running in background!
    ) else (
        echo  [INFO] Service registered. It will run automatically.
    )
) else (
    echo.
    echo [ERROR] Failed to register task. Please run as Administrator.
)

echo.
pause
