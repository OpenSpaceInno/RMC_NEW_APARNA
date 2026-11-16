import mysql from '../node_modules/mysql2/promise.js';
import { pool as localPool } from '../db.js';

async function sync() {
  const prodPool = mysql.createPool({
    host: '213.210.37.249',
    port: 3306,
    user: 'rmc_user',
    password: 'SecureRmcPassword2026!',
    database: 'Aparna_RMC_Db',
    waitForConnections: true,
    connectionLimit: 5
  });

  // Sync Local DB
  await localPool.query(`
    INSERT INTO camera_devices (id, device_id, name, model, location, plant_id, ip_address, mac_address, status, firmware, show_on_dashboard, last_seen)
    VALUES 
      ('cam-uuid-cam_gate_1-shamshabad', 'cam_gate_1', 'Main Gate - Entry ANPR Camera', 'Hikvision / ANPR Smart Cam', 'entry', 'PL01', '192.168.0.101', 'AA:BB:CC:DD:EE:01', 'online', 'V5.5.800', 1, NOW())
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name), plant_id = 'PL01', ip_address = '192.168.0.101', status = 'online', show_on_dashboard = 1, updated_at = NOW()
  `);

  await localPool.query(`
    INSERT INTO camera_devices (id, device_id, name, model, location, plant_id, ip_address, mac_address, status, firmware, show_on_dashboard, last_seen)
    VALUES 
      ('cam-uuid-cam_gate_2-shamshabad', 'cam_gate_2', 'Weighbridge & Platform Scale Camera', 'Hikvision / IP Network Cam', 'weighbridge', 'PL01', '192.168.0.99', 'AA:BB:CC:DD:EE:02', 'online', 'V5.5.800', 1, NOW())
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name), plant_id = 'PL01', ip_address = '192.168.0.99', status = 'online', show_on_dashboard = 1, updated_at = NOW()
  `);

  const [localRows] = await localPool.query('SELECT device_id, name, plant_id, ip_address, location FROM camera_devices');
  console.log('Final local camera_devices:', localRows);

  const [prodRows] = await prodPool.query('SELECT device_id, name, plant_id, ip_address, location FROM camera_devices');
  console.log('Final production camera_devices:', prodRows);

  await prodPool.end();
}

sync().catch(console.error);

