import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCameraHlsUrl } from '@/lib/cameraStream';
import { CameraFeed } from '@/types/anpr';

export interface PlantCameraFeed extends CameraFeed {
  plantId?: string;
  hlsUrl?: string;
  rawLocation?: string;
}

export function useGateCameras() {
  const { user, activePlant, isSuperAdmin } = useAuth();
  const effectivePlantId = isSuperAdmin
    ? (activePlant?.id || 'all')
    : (user?.plantId && user.plantId !== 'all' ? user.plantId : (activePlant?.id || 'PL01'));

  const [cameras, setCameras] = useState<PlantCameraFeed[]>([]);
  const [initialized, setInitialized] = useState(false);

  const initializeGateCameras = useCallback(async () => {
    try {
      setInitialized(false);
      // Fetch devices strictly scoped to the active / assigned plant
      const dbCameras = await api.getCameras(effectivePlantId);
      
      if (Array.isArray(dbCameras)) {
        const formattedList: PlantCameraFeed[] = await Promise.all(
          dbCameras.map(async (c: any) => {
            const devId = c.device_id || c.id;
            const rawName = (c.name || devId).trim();
            const isAnpr = (
              devId === 'cam_gate_1' || 
              devId === 'Exit 2' ||
              rawName.toLowerCase().includes('anpr') || 
              devId.toLowerCase().includes('anpr') ||
              (c.location || '').toLowerCase() === 'entry'
            );

            const defaultStream =
              devId === 'cam_gate_1'
                ? 'live_cam1'
                : devId === 'cam_gate_2' || devId === 'cam_gate_3'
                ? 'live_cam2'
                : devId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'live_cam1';

            let hlsUrl = `/hls/${defaultStream}/index.m3u8`;
            try {
              const rtsp = await api.getRTSPConfig(devId);
              if (rtsp && rtsp.hls_proxy_url) {
                hlsUrl = resolveCameraHlsUrl(rtsp.hls_proxy_url, defaultStream);
              }
            } catch {
              // keep default stream path
            }

            const ip = c.ip_address || (devId === 'cam_gate_1' ? '192.168.0.101' : '192.168.0.99');
            return {
              id: devId,
              name: rawName,
              location: c.location === 'entry' ? 'Gate Entry Lane' : c.location === 'exit' ? 'Gate Exit Lane' : c.location === 'weighbridge' ? 'Weighbridge Bay' : (c.location || 'Main Gate'),
              rawLocation: c.location || 'entry',
              plantId: c.plant_id || effectivePlantId,
              status: (c.status || 'online') as 'online' | 'offline' | 'error',
              ip_address: ip,
              ipAddress: ip,
              cameraType: (isAnpr ? 'anpr' : 'overview') as 'anpr' | 'overview',
              isANPR: isAnpr,
              hlsUrl,
            };
          })
        );

        setCameras(formattedList);

        const hasCam = (id: string) => formattedList.some((cam) => cam.id === id);

        // Ensure default RTSP configs exist for legacy seeded cameras if present in this plant
        if (hasCam('cam_gate_1')) {
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
            // ignore if unable to save
          }
        }

        if (hasCam('cam_gate_2')) {
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
            // ignore if unable to save
          }
        }
      }

      setInitialized(true);
    } catch (error) {
      console.error('Error initializing gate cameras:', error);
      setCameras([]);
      setInitialized(true);
    }
  }, [effectivePlantId]);

  useEffect(() => {
    initializeGateCameras();
    const handleCameraUpdated = () => {
      initializeGateCameras();
    };
    window.addEventListener('rmc-camera-updated', handleCameraUpdated);
    return () => window.removeEventListener('rmc-camera-updated', handleCameraUpdated);
  }, [initializeGateCameras]);

  return { cameras, initialized, effectivePlantId, refreshCameras: initializeGateCameras };
}
