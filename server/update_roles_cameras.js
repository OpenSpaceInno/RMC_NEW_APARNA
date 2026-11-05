import { pool } from './db.js';

async function update() {
  try {
    // Update roles
    await pool.query(`UPDATE roles SET name = 'Plant Head / Admin', description = 'Executive leadership with comprehensive plant-wide visibility, multi-camera CCTV wall, all operational modules, and configuration overrides.' WHERE id = 'admin'`);
    await pool.query(`UPDATE roles SET name = 'Gate Monitor / Security Officer', description = 'Controls entry and exit gate ANPR cameras, barriers, physical challan verification, and vehicle movement security.' WHERE id = 'gate_operator'`);
    await pool.query(`UPDATE roles SET name = 'Weighbridge In-charge / Operator', modules = JSON_ARRAY('/', '/weighbridge', '/gate-monitor', '/exit-verification', '/reports'), description = 'Performs gross and tare weighment, views 3-camera scale surveillance, monitors incoming trucks from gate, and prints weigh slips.' WHERE id = 'weighbridge_operator'`);

    // Update users
    await pool.query(`UPDATE users SET role_name = 'Plant Head / Admin', name = 'Rajesh Sharma (Plant Head)' WHERE username = 'admin'`);
    await pool.query(`UPDATE users SET role_name = 'Gate Monitor / Security Officer', name = 'Mahesh Patil (Gate Monitor)' WHERE username = 'gate.security'`);
    await pool.query(`UPDATE users SET role_name = 'Weighbridge In-charge / Operator', name = 'Ramesh Kulkarni (Weighbridge)' WHERE username = 'weighbridge.op'`);

    // Check if cam_gate_3 exists
    const [existingCam3] = await pool.query(`SELECT * FROM camera_devices WHERE device_id = 'cam_gate_3'`);
    if (existingCam3.length === 0) {
      await pool.query(`INSERT INTO camera_devices (id, device_id, name, model, location, ip_address, mac_address, status, firmware) VALUES (UUID(), 'cam_gate_3', 'Exit & Weighbridge Camera (192.168.0.99)', 'GV-DNC564-MV', 'exit', '192.168.0.99', 'AA:BB:CC:DD:EE:03', 'online', '2.3.1')`);
      await pool.query(`INSERT INTO device_rtsp_config (id, device_id, enabled, direct_url, use_direct_url, port, username, password, stream_path, transport, reconnect_interval, buffer_size, low_latency_mode, hls_proxy_url) VALUES (UUID(), 'cam_gate_3', 1, 'rtsp://admin:Password@123@192.168.0.99:554/Streaming/Channels/101', 1, 554, 'admin', 'Password@123', '/Streaming/Channels/101', 'tcp', 5, 1024, 1, 'http://localhost:8888/cam3/index.m3u8')`);
      console.log('✅ Added cam_gate_3 to database');
    } else {
      console.log('ℹ️ cam_gate_3 already exists in database');
    }

    const [roles] = await pool.query(`SELECT id, name, modules FROM roles WHERE id IN ('admin', 'gate_operator', 'weighbridge_operator')`);
    console.log('Updated roles:', roles);

    const [cams] = await pool.query(`SELECT device_id, name, location, status FROM camera_devices`);
    console.log('Current cameras:', cams);

    process.exit(0);
  } catch (error) {
    console.error('Error updating DB:', error);
    process.exit(1);
  }
}

update();
