@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [REQUESTING ADMIN PRIVILEGES]
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

title Aparna RMC - Uninstall Camera Background Service
echo ==========================================================
echo  Aparna RMC - Remove 24/7 Camera Background Service
echo ==========================================================
echo.
echo Removing AparnaRMC_CameraBridge from Startup folder and Task Scheduler...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AparnaRMC_CameraBridge.lnk" (
    del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AparnaRMC_CameraBridge.lnk" >nul 2>&1
)
schtasks /delete /tn "AparnaRMC_CameraBridge" /f >nul 2>&1
taskkill /F /IM ffmpeg.exe >nul 2>&1
echo [OK] 24/7 Camera Background Service uninstalled and stopped.
echo.
pause
