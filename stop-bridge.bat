@echo off
title Stop Aparna RMC Camera Streaming Bridge
echo ==========================================================
echo  Aparna RMC - Stopping Background Camera Streams
echo ==========================================================
echo.
taskkill /F /IM ffmpeg.exe /T >nul 2>&1
echo [OK] All running camera streaming processes have been stopped.
echo.
pause
