import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ScaleConnectionInfo {
  connected: boolean;
  mode: 'serial' | 'tcp' | 'simulator';
  indicator: string;
  port: string;
}

export interface LiveScaleState {
  weight: number;
  tareWeight: number;
  netWeight: number;
  unit: string;
  stable: boolean;
  rawString: string;
  timestamp: string;
  connection: ScaleConnectionInfo;
}

export function useWeighbridgeScale() {
  const [scaleState, setScaleState] = useState<LiveScaleState>({
    weight: 0,
    tareWeight: 0,
    netWeight: 0,
    unit: 'kg',
    stable: false,
    rawString: '',
    timestamp: new Date().toISOString(),
    connection: {
      connected: false,
      mode: 'simulator',
      indicator: 'Mettler Toledo 8142',
      port: 'COM1 (Live Stream)'
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Determine WebSocket host dynamically (defaulting to localhost:3001)
    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:3001/scale`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.log('⚖️ Connected to Weighbridge Indicator Live Stream (WebSocket)');
        setScaleState(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
            connected: true
          }
        }));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SCALE_DATA' || data.type === 'SCALE_READING') {
            setScaleState({
              weight: typeof data.weight === 'number' ? data.weight : 0,
              tareWeight: typeof data.tareWeight === 'number' ? data.tareWeight : 0,
              netWeight: typeof data.netWeight === 'number' ? data.netWeight : 0,
              unit: data.unit || 'kg',
              stable: Boolean(data.stable),
              rawString: data.raw || '',
              timestamp: data.timestamp || new Date().toISOString(),
              connection: data.connection || {
                connected: true,
                mode: 'simulator',
                indicator: 'Mettler Toledo 8142',
                port: 'ws://localhost:3001/scale'
              }
            });
          } else if (data.type === 'SCALE_HELLO') {
            if (data.config && data.state) {
              setScaleState(prev => ({
                ...prev,
                weight: data.state.currentWeight,
                stable: data.state.stable,
                connection: {
                  connected: true,
                  mode: data.config.connectionMode,
                  indicator: data.config.indicatorModel,
                  port: data.config.serialPort || 'COM1'
                }
              }));
            }
          }
        } catch (e) {
          console.warn('Error parsing scale frame:', e);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setScaleState(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
            connected: false
          }
        }));
        wsRef.current = null;
        // Auto-reconnect after 3 seconds
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) connectWebSocket();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('Scale WebSocket notice (using HTTP fallback):', err);
        ws.close();
      };
    } catch (err) {
      console.warn('WebSocket connection error:', err);
      // Retry in 5 seconds
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) connectWebSocket();
      }, 5000);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const zeroScale = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'ZERO' }));
    } else {
      await api.zeroScale().catch(e => console.warn(e));
    }
  }, []);

  const tareScale = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'TARE' }));
    } else {
      await api.tareScale().catch(e => console.warn(e));
    }
  }, []);

  const injectWeight = useCallback(async (weightKg: number, instant = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'SET_SIMULATED_WEIGHT', weight: weightKg, instant }));
    } else {
      await api.injectScaleWeight(weightKg, instant).catch(e => console.warn(e));
    }
  }, []);

  return {
    ...scaleState,
    zeroScale,
    tareScale,
    injectWeight,
    reconnect: connectWebSocket,
  };
}
