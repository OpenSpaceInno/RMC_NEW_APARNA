# Test camera connectivity
Write-Host "🔍 Testing Camera Connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Ping camera
Write-Host "1️⃣ Testing network connectivity..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName 192.168.0.168 -Count 2 -Quiet
if ($pingResult) {
    Write-Host "   ✅ Camera is reachable on network" -ForegroundColor Green
} else {
    Write-Host "   ❌ Cannot reach camera at 192.168.0.168" -ForegroundColor Red
    Write-Host "   💡 Check: Is camera powered on? Is IP correct?" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Test 2: Check RTSP port
Write-Host "2️⃣ Testing RTSP port 554..." -ForegroundColor Yellow
$tcpClient = New-Object System.Net.Sockets.TcpClient
try {
    $tcpClient.Connect("192.168.0.168", 554)
    Write-Host "   ✅ RTSP port 554 is open" -ForegroundColor Green
    $tcpClient.Close()
} catch {
    Write-Host "   ❌ Cannot connect to RTSP port 554" -ForegroundColor Red
    Write-Host "   💡 Check: Is RTSP enabled on camera?" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Try to access HLS stream
Write-Host "3️⃣ Testing HLS stream availability..." -ForegroundColor Yellow
Write-Host "   Opening browser to test stream..." -ForegroundColor White
Write-Host "   URL: http://localhost:8888/cam1/index.m3u8" -ForegroundColor White
Write-Host ""
Write-Host "   If you see video, camera is working! ✅" -ForegroundColor Green
Write-Host "   If you see error, check MediaMTX logs below..." -ForegroundColor Yellow
Write-Host ""

# Open test page
Start-Process "http://localhost:8080/gate-monitor"

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check Gate Monitor page for live video" -ForegroundColor White
Write-Host "   2. If no video, check camera settings:" -ForegroundColor White
Write-Host "      - Username: admin" -ForegroundColor White
Write-Host "      - Password: (empty or check camera manual)" -ForegroundColor White
Write-Host "      - RTSP URL: rtsp://admin:@192.168.0.168:554/rtsp/streaming?channel=01&subtype=0" -ForegroundColor White
Write-Host ""
Write-Host "   3. Test in VLC first:" -ForegroundColor White
Write-Host "      - Open VLC > Media > Open Network Stream" -ForegroundColor White
Write-Host "      - Paste RTSP URL above" -ForegroundColor White
Write-Host "      - If VLC works, browser should work too" -ForegroundColor White
