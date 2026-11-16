@echo off
setlocal
cd /d "%~dp0\.."

if not exist "logs" mkdir "logs"

:: Locate node executable
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node server\scripts\sync-now.js >> logs\cloud-sync-task.log 2>&1
) else (
    echo [ERROR] Node.js not found in PATH >> logs\cloud-sync-task.log
)
exit /b %ERRORLEVEL%

