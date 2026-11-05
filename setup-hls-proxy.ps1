# MediaMTX Setup Script for Windows
# This script downloads and configures MediaMTX for RTSP to HLS conversion

$ErrorActionPreference = "Stop"

Write-Host "🎬 MediaMTX HLS Proxy Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if MediaMTX is already downloaded
if (Test-Path "mediamtx.exe") {
    Write-Host "✅ MediaMTX already downloaded" -ForegroundColor Green
} else {
    Write-Host "📥 Downloading MediaMTX..." -ForegroundColor Yellow
    
    # Download MediaMTX for Windows
    $url = "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_windows_amd64.zip"
    $output = "mediamtx.zip"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "✅ Download complete" -ForegroundColor Green
        
        # Extract
        Write-Host "📦 Extracting..." -ForegroundColor Yellow
        Expand-Archive -Path $output -DestinationPath "." -Force
        Remove-Item $output
        Write-Host "✅ Extraction complete" -ForegroundColor Green
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "  - RTSP Server: rtsp://localhost:8554" -ForegroundColor White
Write-Host "  - HLS Server: http://localhost:8888" -ForegroundColor White
Write-Host "  - API: http://localhost:9997" -ForegroundColor White
Write-Host "  - Metrics: http://localhost:9998" -ForegroundColor White
Write-Host ""

Write-Host "📹 Configured Streams:" -ForegroundColor Cyan
Write-Host "  Camera 1: http://localhost:8888/cam1/index.m3u8" -ForegroundColor White
Write-Host "  Camera 2: http://localhost:8888/cam2/index.m3u8" -ForegroundColor White
Write-Host "  Test Stream: http://localhost:8888/test/index.m3u8" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting MediaMTX..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start MediaMTX
.\mediamtx.exe mediamtx.yml
