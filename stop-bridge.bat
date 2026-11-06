@echo off
title Stop Aparna RMC Camera Streaming Bridge
echo ==========================================================
echo  Aparna RMC - Stopping Background Camera Streams
echo ==========================================================
echo.
wmic process where "commandline like '%%plant-camera-bridge.js%%'" delete >nul 2>&1
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*plant-camera-bridge.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1
taskkill /F /IM ffmpeg.exe /T >nul 2>&1
echo [OK] All running camera streaming processes have been stopped.
echo.
pause
