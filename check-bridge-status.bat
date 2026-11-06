@echo off
title Aparna RMC - Check Camera Streaming Bridge Status
echo ==========================================================
echo  Aparna RMC - Live Streaming Bridge Status
echo ==========================================================
echo.
echo [1] Checking active FFmpeg background processes:
tasklist /FI "IMAGENAME eq ffmpeg.exe" 2>nul | find /I "ffmpeg.exe" >nul
if %errorlevel% equ 0 (
    echo  * [ACTIVE] FFmpeg streaming processes are RUNNING in background:
    tasklist /FI "IMAGENAME eq ffmpeg.exe" /FO TABLE
) else (
    echo  * [INACTIVE] No FFmpeg streaming processes currently running.
)

echo.
echo [2] Checking Windows Auto-Start Task:
schtasks /query /tn "AparnaRMC_CameraBridge" >nul 2>&1
if %errorlevel% equ 0 (
    echo  * [INSTALLED] Windows Task "AparnaRMC_CameraBridge" is registered to auto-start on boot.
) else (
    echo  * [NOT INSTALLED] Background service task is not yet installed. Run install-plant-bridge-service.bat
)

echo.
echo [3] Cloud Server Endpoints:
echo  * Camera 1 (Entry ANPR):  https://uyh1bzdewdyahpxpmqgo64gh.213.210.37.249.sslip.io/hls/live_cam1/index.m3u8
echo  * Camera 2 (Exit Scale):  https://uyh1bzdewdyahpxpmqgo64gh.213.210.37.249.sslip.io/hls/live_cam2/index.m3u8
echo.
pause
