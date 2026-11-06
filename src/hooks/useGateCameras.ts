import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { CameraFeed } from '@/types/anpr';

export function useGateCameras() {
  const [cameras, setCameras] = useState<CameraFeed[]>([
    {
      id: "cam_gate_1",
      name: "Main Gate - Entry ANPR Camera",
      location: "Gate Entry Lane",
      status: "online",
      ip_address: "192.168.0.101",
      ipAddress: "192.168.0.101",
      cameraType: "anpr",
      isANPR: true,
    },
    {
      id: "cam_gate_2",
      name: "Main Gate - Overview Camera",
      location: "Gate Entry Area",
      status: "online",
      ip_address: "192.168.0.99",
      ipAddress: "192.168.0.99",
      cameraType: "overview",
      isANPR: false,
    },
  ]);
  const [initialized, setInitialized] = useState(false);

  const initializeGateCameras = useCallback(async () => {
    try {
      // Fetch devices from MySQL database
      const dbCameras = await api.getCameras();
      
      if (Array.isArray(dbCameras) && dbCameras.length > 0) {
        const formattedList = dbCameras.map((c: any) => {
          const devId = c.device_id || c.id;
          let friendlyName = c.name;
          if (devId === 'cam_gate_1') friendlyName = 'Main Gate - Entry ANPR Camera';
          else if (devId === 'cam_gate_2') friendlyName = 'Main Gate - Overview Camera';
          else if (devId === 'cam_gate_3') friendlyName = 'Gate Exit & Weighbridge Camera';
          else if (devId === 'Exit 2') friendlyName = 'Weighbridge ANPR Camera';
          else {
            friendlyName = (c.name || devId).replace(/\s*\(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\)/g, '');
          }

          const isAnpr = (
            devId === 'cam_gate_1' || 
            devId === 'Exit 2' ||
            friendlyName.toLowerCase().includes('anpr') || 
            devId.toLowerCase().includes('anpr')
          );

          const ip = c.ip_address || (devId === 'cam_gate_1' ? '192.168.0.101' : '192.168.0.99');
          return {
            id: devId,
            name: friendlyName,
            location: c.location === 'entry' ? 'Gate Entry Lane' : c.location === 'exit' ? 'Gate Exit Lane' : (c.location || 'Main Gate'),
            status: (c.status || 'online') as 'online' | 'offline' | 'error',
            ip_address: ip,
            ipAddress: ip,
            cameraType: (isAnpr ? 'anpr' : 'overview') as 'anpr' | 'overview',
            isANPR: isAnpr,
          };
        });

        if (formattedList.length > 0) {
          setCameras(formattedList);
        }
      }

      // Ensure RTSP configs exist with correct URLs
      try {
        const c1 = await api.getRTSPConfig('cam_gate_1');
        if (!c1 || !c1.hls_proxy_url || c1.hls_proxy_url === '/hls/cam1/index.m3u8') {
          await api.saveRTSPConfig({
            device_id: 'cam_gate_1',
            enabled: true,
            direct_url: 'rtsp://admin:Password@123@192.168.0.101:554/ch1/main/av_stream',
            use_direct_url: true,
            port: 554,
            username: 'admin',
            password: 'Password@123',
            stream_path: '/ch1/main/av_stream',
            transport: 'tcp',
            reconnect_interval: 5,
            buffer_size: 1024,
            low_latency_mode: true,
            hls_proxy_url: '/hls/live_cam1/index.m3u8',
          });
        }
      } catch {
        // save default
        await api.saveRTSPConfig({
          device_id: 'cam_gate_1',
          enabled: true,
          direct_url: 'rtsp://admin:Password@123@192.168.0.101:554/ch1/main/av_stream',
          use_direct_url: true,
          port: 554,
          username: 'admin',
          password: 'Password@123',
          stream_path: '/ch1/main/av_stream',
          transport: 'tcp',
          reconnect_interval: 5,
          buffer_size: 1024,
          low_latency_mode: true,
          hls_proxy_url: '/hls/live_cam1/index.m3u8',
        });
      }

      try {
        const c2 = await api.getRTSPConfig('cam_gate_2');
        if (!c2 || !c2.hls_proxy_url || c2.hls_proxy_url === '/hls/cam2/index.m3u8') {
          await api.saveRTSPConfig({
            device_id: 'cam_gate_2',
            enabled: true,
            direct_url: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
            use_direct_url: true,
            port: 554,
            username: 'admin',
            password: 'Password@123',
            stream_path: '/Streaming/Channels/101',
            transport: 'tcp',
            reconnect_interval: 5,
            buffer_size: 1024,
            low_latency_mode: true,
            hls_proxy_url: '/hls/live_cam2/index.m3u8',
          });
        }
      } catch {
        await api.saveRTSPConfig({
          device_id: 'cam_gate_2',
          enabled: true,
          direct_url: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
          use_direct_url: true,
          port: 554,
          username: 'admin',
          password: 'Password@123',
          stream_path: '/Streaming/Channels/101',
          transport: 'tcp',
          reconnect_interval: 5,
          buffer_size: 1024,
          low_latency_mode: true,
          hls_proxy_url: '/hls/live_cam2/index.m3u8',
        });
      }

      try {
        const c3 = await api.getRTSPConfig('cam_gate_3');
        if (!c3 || !c3.hls_proxy_url) {
          await api.saveRTSPConfig({
            device_id: 'cam_gate_3',
            enabled: true,
            direct_url: 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101',
            use_direct_url: true,
            port: 554,
            username: 'admin',
            password: 'Password@123',
            stream_path: '/Streaming/Channels/101',
            transport: 'tcp',
            reconnect_interval: 5,
            buffer_size: 1024,
            low_latency_mode: true,
            hls_proxy_url: '/hls/live_cam2/index.m3u8',
          });
        }
      } catch {
        // default
      }

      setInitialized(true);
    } catch (error) {
      console.error('Error initializing gate cameras:', error);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    initializeGateCameras();
  }, [initializeGateCameras]);

  return { cameras, initialized, refreshCameras: initializeGateCameras };
}
