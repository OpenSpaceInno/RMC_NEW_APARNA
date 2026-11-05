import { useState, useEffect, useCallback } from 'react';
import { GPSDevice, GPSPosition } from '@/types/gps';
import { Trip } from '@/types/tripManagement';
import { useToast } from '@/hooks/use-toast';

const mockDevices: GPSDevice[] = [
  {
    id: 'device-001',
    deviceId: 'GPS-001',
    name: 'Tracker Alpha',
    type: 'traccar',
    status: 'online',
    lastSeen: new Date().toISOString(),
    configuration: {
      apiUrl: 'https://traccar.example.com',
      updateInterval: 30,
    },
  },
  {
    id: 'device-002',
    deviceId: 'GPS-002',
    name: 'Tracker Beta',
    type: 'traccar',
    status: 'online',
    lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
    configuration: {
      apiUrl: 'https://traccar.example.com',
      updateInterval: 30,
    },
  },
  {
    id: 'device-003',
    deviceId: 'GPS-003',
    name: 'Webhook Device 1',
    type: 'webhook',
    status: 'idle',
    lastSeen: new Date(Date.now() - 30 * 60000).toISOString(),
    configuration: {
      webhookSecret: 'wh_secret_xxx',
      updateInterval: 15,
    },
  },
  {
    id: 'device-004',
    deviceId: 'GPS-004',
    name: 'Manual Entry Device',
    type: 'manual',
    status: 'offline',
    configuration: {
      updateInterval: 60,
    },
  },
];

export const useGPSIntegration = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<GPSDevice[]>(mockDevices);
  const [positions, setPositions] = useState<Map<string, GPSPosition>>(new Map());
  const [isConnecting, setIsConnecting] = useState(false);

  // Simulate real-time position updates for online devices
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prevDevices =>
        prevDevices.map(device => {
          if (device.status === 'online') {
            return {
              ...device,
              lastSeen: new Date().toISOString(),
            };
          }
          return device;
        })
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const registerDevice = useCallback(async (device: Omit<GPSDevice, 'id' | 'status' | 'lastSeen'>): Promise<GPSDevice> => {
    setIsConnecting(true);
    
    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newDevice: GPSDevice = {
      ...device,
      id: `device-${Date.now()}`,
      status: 'idle',
      lastSeen: new Date().toISOString(),
    };
    
    setDevices(prev => [...prev, newDevice]);
    setIsConnecting(false);
    
    toast({
      title: 'Device Registered',
      description: `${device.name} has been registered successfully`,
    });
    
    return newDevice;
  }, [toast]);

  const connectToTraccar = useCallback(async (
    apiUrl: string,
    credentials: { username: string; password: string }
  ): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      // Simulate Traccar API connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Connected to Traccar',
        description: 'GPS tracking server connected successfully',
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to Traccar server',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const processWebhookData = useCallback((payload: {
    deviceId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp?: string;
    tripId?: string;
  }): GPSPosition => {
    const position: GPSPosition = {
      deviceId: payload.deviceId,
      tripId: payload.tripId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speed: payload.speed || 0,
      heading: payload.heading || 0,
      timestamp: payload.timestamp || new Date().toISOString(),
    };
    
    setPositions(prev => new Map(prev).set(payload.deviceId, position));
    
    // Update device status
    setDevices(prev =>
      prev.map(d =>
        d.deviceId === payload.deviceId
          ? { ...d, status: 'online' as const, lastSeen: position.timestamp }
          : d
      )
    );
    
    return position;
  }, []);

  const updateDeviceStatus = useCallback((deviceId: string, status: GPSDevice['status']) => {
    setDevices(prev =>
      prev.map(d =>
        d.deviceId === deviceId
          ? { ...d, status, lastSeen: new Date().toISOString() }
          : d
      )
    );
  }, []);

  const getDevicePosition = useCallback((deviceId: string): GPSPosition | undefined => {
    return positions.get(deviceId);
  }, [positions]);

  const getOnlineDevices = useCallback(() => {
    return devices.filter(d => d.status === 'online');
  }, [devices]);

  const getAvailableDevices = useCallback(() => {
    return devices.filter(d => d.status !== 'offline');
  }, [devices]);

  const deleteDevice = useCallback((deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    toast({
      title: 'Device Removed',
      description: 'GPS device has been removed',
    });
  }, [toast]);

  const testConnection = useCallback(async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;

    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    if (success) {
      updateDeviceStatus(device.deviceId, 'online');
      toast({
        title: 'Connection Test Passed',
        description: `${device.name} is responding correctly`,
      });
    } else {
      toast({
        title: 'Connection Test Failed',
        description: `${device.name} is not responding`,
        variant: 'destructive',
      });
    }
    
    setIsConnecting(false);
    return success;
  }, [devices, updateDeviceStatus, toast]);

  return {
    devices,
    positions,
    isConnecting,
    registerDevice,
    connectToTraccar,
    processWebhookData,
    updateDeviceStatus,
    getDevicePosition,
    getOnlineDevices,
    getAvailableDevices,
    deleteDevice,
    testConnection,
  };
};
