import { pool } from './db.js';

async function update() {
  await pool.query(
    "UPDATE device_rtsp_config SET direct_url = 'rtsp://admin:Password@123@192.168.0.100:554/ch1/main/av_stream', stream_path = '/ch1/main/av_stream' WHERE device_id = 'cam_gate_1'"
  );

  console.log('✅ Successfully updated cam_gate_1 direct_url to /ch1/main/av_stream in MySQL');
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
