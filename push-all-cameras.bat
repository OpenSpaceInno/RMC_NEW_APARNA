@echo off
title Aparna RMC - Start All Cameras Streaming Bridge
echo ==========================================================
echo  Aparna RMC - Launching Cloud Streaming for All Cameras
echo ==========================================================
echo.

start "Aparna RMC - Camera 1 (192.168.0.101)" "%~dp0push-camera1-live.bat"
start "Aparna RMC - Camera 2 (192.168.0.99)" "%~dp0push-camera2-live.bat"

echo [OK] Both camera bridges started in separate background windows.
echo Live feeds are streaming to:
echo   Camera 1 - Entry:  https://uyh1bzdewdyahpxpmqgo64gh.213.210.37.249.sslip.io/hls/live_cam1/index.m3u8
echo   Camera 2 - Scale:  https://uyh1bzdewdyahpxpmqgo64gh.213.210.37.249.sslip.io/hls/live_cam2/index.m3u8
echo.
pause
