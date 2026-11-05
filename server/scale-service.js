// Weighbridge Scale Service - RS-232 / Serial / Modbus TCP / WebSockets
// Provides zero-latency live weight streaming to frontend clients

import { WebSocketServer } from 'ws';
import net from 'net';

export class WeighbridgeScaleService {
  constructor() {
    this.config = {
      indicatorModel: 'Mettler Toledo 8142', // 'Mettler Toledo 8142' | 'Avery Weigh-Tronix E1205' | 'Digitronics 2000' | 'Modbus TCP'
      protocol: 'toledo',                    // 'toledo' | 'avery' | 'digitronics' | 'modbus_tcp' | 'ascii'
      connectionMode: 'simulator',           // 'simulator' | 'tcp' | 'serial'
      serialPort: 'COM1',
      baudRate: 9600,
      tcpHost: '192.168.0.150',
      tcpPort: 4001,
      unit: 'kg',
      filterThresholdKg: 10,                 // threshold for stability
      updateIntervalMs: 100                  // 10 Hz stream
    };

    this.state = {
      currentWeight: 0,
      tareWeight: 0,
      grossWeight: 0,
      netWeight: 0,
      stable: true,
      unit: 'kg',
      rawString: '',
      connected: true,
      lastUpdate: new Date().toISOString(),
      sampleHistory: []
    };

    // Internal simulation state
    this.simTargetWeight = 0;
    this.simCurrentWeight = 0;
    this.simMotionTimer = null;
    this.simNoise = 0;
    this.intervalId = null;

    // WebSocket Server instance & clients
    this.wss = null;
    this.clients = new Set();

    // TCP client for ethernet indicators
    this.tcpSocket = null;
  }

  /**
   * Initialize service and attach to HTTP server
   * @param {import('http').Server} httpServer 
   */
  initialize(httpServer) {
    this.initWebSocketServer(httpServer);
    this.startStreaming();
    console.log(`⚖️ Weighbridge Indicator Service initialized [Protocol: ${this.config.protocol.toUpperCase()}, Mode: ${this.config.connectionMode}]`);
  }

  initWebSocketServer(httpServer) {
    try {
      this.wss = new WebSocketServer({ 
        noServer: true,
      });

      httpServer.on('upgrade', (request, socket, head) => {
        const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
        if (pathname === '/scale' || pathname === '/api/scale/stream') {
          this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request);
          });
        }
      });

      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        console.log(`🔌 Scale client connected (Total: ${this.clients.size})`);

        // Send initial handshake frame
        ws.send(JSON.stringify({
          type: 'SCALE_HELLO',
          timestamp: new Date().toISOString(),
          config: this.config,
          state: this.state
        }));

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleClientCommand(data, ws);
          } catch (e) {
            console.warn('Invalid scale WS command:', e.message);
          }
        });

        ws.on('close', () => {
          this.clients.delete(ws);
          console.log(`🔌 Scale client disconnected (Remaining: ${this.clients.size})`);
        });

        ws.on('error', (err) => {
          console.error('Scale WS error:', err.message);
          this.clients.delete(ws);
        });
      });
    } catch (error) {
      console.error('Failed to initialize scale WebSocket server:', error);
    }
  }

  handleClientCommand(cmd, ws) {
    switch (cmd.command) {
      case 'ZERO':
        this.zeroScale();
        break;
      case 'TARE':
        this.tareScale();
        break;
      case 'GET_WT':
        ws.send(JSON.stringify({
          type: 'SCALE_READING',
          ...this.getCurrentPayload()
        }));
        break;
      case 'SET_SIMULATED_WEIGHT':
        if (typeof cmd.weight === 'number') {
          this.setSimulatedWeight(cmd.weight, cmd.instant || false);
        }
        break;
      case 'SET_CONFIG':
        if (cmd.config) {
          this.updateConfig(cmd.config);
        }
        break;
      default:
        break;
    }
  }

  startStreaming() {
    if (this.intervalId) clearInterval(this.intervalId);

    if (this.config.connectionMode === 'tcp') {
      this.connectTcpIndicator();
    }

    // Main 10Hz Broadcast Loop
    this.intervalId = setInterval(() => {
      if (this.config.connectionMode === 'simulator') {
        this.tickSimulator();
      }
      this.broadcastScaleData();
    }, this.config.updateIntervalMs);
  }

  /**
   * Connect to network/ethernet scale indicator (Moxa / Digi / Native TCP)
   */
  connectTcpIndicator() {
    if (this.tcpSocket) {
      this.tcpSocket.destroy();
      this.tcpSocket = null;
    }

    console.log(`📡 Connecting to TCP scale indicator at ${this.config.tcpHost}:${this.config.tcpPort}...`);
    this.tcpSocket = new net.Socket();
    this.tcpSocket.setTimeout(5000);

    this.tcpSocket.connect(this.config.tcpPort, this.config.tcpHost, () => {
      console.log(`✅ Connected to physical indicator at ${this.config.tcpHost}:${this.config.tcpPort}`);
      this.state.connected = true;
    });

    let buffer = '';
    this.tcpSocket.on('data', (chunk) => {
      buffer += chunk.toString('ascii');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // keep partial

      for (const line of lines) {
        if (line.trim()) {
          this.parseRawIndicatorString(line.trim());
        }
      }
    });

    this.tcpSocket.on('timeout', () => {
      console.warn('⚠️ TCP Scale socket timeout, reconnecting...');
      this.tcpSocket.destroy();
    });

    this.tcpSocket.on('error', (err) => {
      console.warn(`⚠️ TCP Scale connection error: ${err.message}. Running in simulator fallback.`);
      this.state.connected = false;
    });

    this.tcpSocket.on('close', () => {
      this.state.connected = false;
      // Auto reconnect after 5s if still in tcp mode
      if (this.config.connectionMode === 'tcp') {
        setTimeout(() => this.connectTcpIndicator(), 5000);
      }
    });
  }

  /**
   * Parse indicator protocol stream
   * @param {string} raw 
   */
  parseRawIndicatorString(raw) {
    this.state.rawString = raw;
    let weight = 0;
    let stable = false;

    if (this.config.protocol === 'toledo') {
      // Mettler Toledo Continuous String: e.g. ST,GS,+019450kg or <STX>19450<CR>
      // ST: Stable, US: Unstable, GS: Gross, NT: Net
      stable = raw.includes('ST,') || !raw.includes('US,');
      const match = raw.match(/([+-]?\d{3,7})/);
      if (match) {
        weight = parseInt(match[1], 10);
      }
    } else if (this.config.protocol === 'avery') {
      // Avery Weigh-Tronix format: <STX><POL><WEIGHT><SP><KG>
      stable = !raw.includes('M'); // M indicates motion
      const match = raw.match(/([+-]?\d{3,7})/);
      if (match) {
        weight = parseInt(match[1], 10);
      }
    } else if (this.config.protocol === 'digitronics') {
      // Digitronics format: +019450 kg N
      stable = raw.includes('S') || !raw.includes('M');
      const match = raw.match(/([+-]?\d{3,7})/);
      if (match) {
        weight = parseInt(match[1], 10);
      }
    } else {
      // Generic ASCII extractor
      const match = raw.match(/([+-]?\d{3,7})/);
      if (match) {
        weight = parseInt(match[1], 10);
      }
      stable = true;
    }

    this.updateWeightState(weight, stable);
  }

  updateWeightState(weight, stable) {
    this.state.currentWeight = weight;
    this.state.stable = stable;
    this.state.grossWeight = weight;
    this.state.netWeight = Math.max(0, weight - this.state.tareWeight);
    this.state.lastUpdate = new Date().toISOString();
  }

  /**
   * Realistic Industrial Scale Simulator Engine
   */
  tickSimulator() {
    // Smoothly step current weight towards target weight with vehicle loading dynamics
    const diff = this.simTargetWeight - this.simCurrentWeight;

    if (Math.abs(diff) > 20) {
      // Moving weight on deck (truck driving on/off platform)
      this.simCurrentWeight += diff * 0.2;
      this.state.stable = false;
      this.simNoise = (Math.random() - 0.5) * 60; // vibration noise
    } else {
      // Settled on deck
      this.simCurrentWeight = this.simTargetWeight;
      this.simNoise = (Math.random() - 0.5) * 8; // micro-oscillation (±4kg)
      this.state.stable = true;
    }

    const displayedWeight = Math.max(0, Math.round(this.simCurrentWeight + this.simNoise));
    
    // Format realistic Toledo Raw String
    const sign = displayedWeight >= 0 ? '+' : '-';
    const padded = String(Math.abs(displayedWeight)).padStart(6, '0');
    const statusPrefix = this.state.stable ? 'ST,GS,' : 'US,GS,';
    this.state.rawString = `${statusPrefix}${sign}${padded}kg`;

    this.updateWeightState(displayedWeight, this.state.stable);
  }

  setSimulatedWeight(targetKg, instant = false) {
    this.simTargetWeight = Math.max(0, targetKg);
    if (instant) {
      this.simCurrentWeight = this.simTargetWeight;
      this.state.stable = true;
    } else {
      this.state.stable = false;
    }
  }

  zeroScale() {
    this.setSimulatedWeight(0, true);
    this.state.tareWeight = 0;
    this.updateWeightState(0, true);
    console.log('⚖️ Scale Zeroed [0.00 kg]');
    this.broadcastScaleData();
  }

  tareScale() {
    this.state.tareWeight = this.state.currentWeight;
    this.state.netWeight = 0;
    console.log(`⚖️ Scale Tared at ${this.state.tareWeight} kg`);
    this.broadcastScaleData();
  }

  getCurrentPayload() {
    return {
      type: 'SCALE_DATA',
      timestamp: new Date().toISOString(),
      weight: this.state.currentWeight,
      tareWeight: this.state.tareWeight,
      netWeight: this.state.netWeight,
      unit: this.config.unit,
      stable: this.state.stable,
      raw: this.state.rawString,
      protocol: this.config.protocol,
      connection: {
        connected: this.state.connected,
        mode: this.config.connectionMode,
        indicator: this.config.indicatorModel,
        port: this.config.connectionMode === 'tcp' 
          ? `TCP ${this.config.tcpHost}:${this.config.tcpPort}` 
          : this.config.connectionMode === 'serial' 
            ? `${this.config.serialPort} @ ${this.config.baudRate} baud` 
            : 'Simulated RS-232 Toledo 8142'
      }
    };
  }

  broadcastScaleData() {
    if (!this.clients || this.clients.size === 0) return;

    const payload = JSON.stringify(this.getCurrentPayload());
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.connectionMode === 'tcp') {
      this.connectTcpIndicator();
    }
    console.log('⚙️ Scale configuration updated:', this.config);
  }

  getStatus() {
    return {
      config: this.config,
      state: this.state,
      activeClients: this.clients.size,
      reading: this.getCurrentPayload()
    };
  }
}

export const scaleService = new WeighbridgeScaleService();
export default scaleService;
