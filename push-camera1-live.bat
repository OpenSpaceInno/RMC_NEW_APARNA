@echo off
title Push Camera 1 (192.168.0.101) to Aparna RMC Cloud
echo ==========================================================
echo  Aparna RMC - Live Streaming Bridge for Camera 1 (ANPR)
echo  Source: rtsp://192.168.0.101:554/ch1/main/av_stream
echo  Target: rtsp://213.210.37.249:8554/live_cam1
echo ==========================================================
echo.

set FFMPEG_BIN=ffmpeg
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build-shared\bin\ffmpeg.exe" (
        set "FFMPEG_BIN=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build-shared\bin\ffmpeg.exe"
    )
)

:stream_loop
echo [%date% %time%] Connecting to Camera 1 and streaming to cloud server...
"%FFMPEG_BIN%" -rtsp_transport tcp -i "rtsp://admin:Password@123@192.168.0.101:554/ch1/main/av_stream" -c:v libx264 -preset ultrafast -tune zerolatency -g 25 -keyint_min 25 -sc_threshold 0 -b:v 2500k -an -rtsp_transport tcp -f rtsp "rtsp://213.210.37.249:8554/live_cam1"

echo.
echo [%date% %time%] Camera session ended or network reconnected. Restarting in 2 seconds...
ping 127.0.0.1 -n 3 >nul
goto stream_loop
