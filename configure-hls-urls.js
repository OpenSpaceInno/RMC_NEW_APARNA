// Script to automatically configure HLS proxy URLs for cameras
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function configureHLSUrls() {
  console.log('🔧 Configuring HLS Proxy URLs...\n');

  const cameras = [
    {
      device_id: 'cam_gate_1',
      name: 'Gate Entry - ANPR',
      hls_url: 'http://localhost:8888/cam1/index.m3u8',
      rtsp_url: 'rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0'
    },
    {
      device_id: 'cam_gate_2',
      name: 'Gate Entry - Side View',
      hls_url: 'http://localhost:8888/cam2/index.m3u8',
      rtsp_url: 'rtsp://192.168.0.169:554/rtsp/streaming?channel=01&subtype=0'
    }
  ];

  for (const camera of cameras) {
    try {
      console.log(`📹 Configuring ${camera.name}...`);
      
      const response = await fetch(`${API_URL}/rtsp-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: camera.device_id,
          enabled: true,
          url: '',
          direct_url: camera.rtsp_url,
          use_direct_url: true,
          port: 554,
          username: 'admin',
          password: '',
          stream_path: '/rtsp/streaming?channel=01&subtype=0',
          transport: 'tcp',
          reconnect_interval: 5,
          buffer_size: 1024,
          low_latency_mode: true,
          hls_proxy_url: camera.hls_url
        })
      });

      if (response.ok) {
        console.log(`✅ ${camera.name} configured`);
        console.log(`   RTSP: ${camera.rtsp_url}`);
        console.log(`   HLS:  ${camera.hls_url}\n`);
      } else {
        console.log(`❌ Failed to configure ${camera.name}\n`);
      }
    } catch (error) {
      console.error(`❌ Error configuring ${camera.name}:`, error.message, '\n');
    }
  }

  console.log('✅ Configuration complete!');
  console.log('\n📺 View live streams at: http://localhost:8080/gate-monitor');
}

configureHLSUrls();
