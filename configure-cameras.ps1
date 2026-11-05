# Configure HLS Proxy URLs for cameras
$API_URL = "http://localhost:3001/api"

Write-Host "🔧 Configuring Camera HLS Proxy URLs..." -ForegroundColor Cyan
Write-Host ""

# Camera 1 Configuration
$cam1 = @{
    device_id = "cam_gate_1"
    enabled = $true
    url = ""
    direct_url = "rtsp://192.168.0.168:554/rtsp/streaming?channel=01`&subtype=0"
    use_direct_url = $true
    port = 554
    username = "admin"
    password = ""
    stream_path = "/rtsp/streaming?channel=01`&subtype=0"
    transport = "tcp"
    reconnect_interval = 5
    buffer_size = 1024
    low_latency_mode = $true
    hls_proxy_url = "http://localhost:8888/cam1/index.m3u8"
} | ConvertTo-Json

Write-Host "📹 Configuring Gate Entry - ANPR..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/rtsp-config" -Method Post -Body $cam1 -ContentType "application/json"
    Write-Host "✅ Camera 1 configured" -ForegroundColor Green
    Write-Host "   HLS: http://localhost:8888/cam1/index.m3u8" -ForegroundColor White
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Camera 2 Configuration
$cam2 = @{
    device_id = "cam_gate_2"
    enabled = $true
    url = ""
    direct_url = "rtsp://192.168.0.169:554/rtsp/streaming?channel=01`&subtype=0"
    use_direct_url = $true
    port = 554
    username = "admin"
    password = ""
    stream_path = "/rtsp/streaming?channel=01`&subtype=0"
    transport = "tcp"
    reconnect_interval = 5
    buffer_size = 1024
    low_latency_mode = $true
    hls_proxy_url = "http://localhost:8888/cam2/index.m3u8"
} | ConvertTo-Json

Write-Host "📹 Configuring Gate Entry - Side View..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/rtsp-config" -Method Post -Body $cam2 -ContentType "application/json"
    Write-Host "✅ Camera 2 configured" -ForegroundColor Green
    Write-Host "   HLS: http://localhost:8888/cam2/index.m3u8" -ForegroundColor White
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📺 View live streams at: http://localhost:8080/gate-monitor" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test HLS streams:" -ForegroundColor Cyan
Write-Host "   Camera 1: http://localhost:8888/cam1/index.m3u8" -ForegroundColor White
Write-Host "   Camera 2: http://localhost:8888/cam2/index.m3u8" -ForegroundColor White
Write-Host "   Test Stream: http://localhost:8888/test/index.m3u8" -ForegroundColor White
