import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const SFTPGO_API_URL = process.env.SFTPGO_API_URL || 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/api/v2';
const SFTPGO_HOST = process.env.SFTPGO_HOST || '213.210.37.249';
const SFTPGO_ADMIN_USER = process.env.SFTPGO_ADMIN_USER || 'ftpsuperadmin';
const SFTPGO_ADMIN_PASS = process.env.SFTPGO_ADMIN_PASS || 'Demo#Test@2026';
const SFTPGO_USER = process.env.SFTPGO_USER || 'aparna_rmc';
const SFTPGO_PASS = process.env.SFTPGO_PASS || 'Rmc@Aparna#2026';
const SFTPGO_CAMERA_USER = process.env.SFTPGO_CAMERA_USER || 'sarath';
const SFTPGO_CAMERA_PASS = process.env.SFTPGO_CAMERA_PASS || 'Password@123';
const SFTPGO_FTP_PORT = process.env.SFTPGO_FTP_PORT || '2121';
const SFTPGO_SFTP_PORT = process.env.SFTPGO_SFTP_PORT || '2222';
const SFTPGO_WEB_ADMIN_URL = process.env.SFTPGO_WEB_ADMIN_URL || 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users';

class FtpService {
  constructor() {
    this.userTokens = {};
  }

  // Get or refresh User Access Token from SFTPGo for a specific user
  async getUserToken(username = SFTPGO_USER, password = SFTPGO_PASS) {
    const now = Date.now();
    const cached = this.userTokens[username];
    if (cached && cached.expiresAt > now + 60000) {
      return cached.token;
    }

    try {
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      const res = await fetch(`${SFTPGO_API_URL}/user/token`, {
        headers: {
          Authorization: `Basic ${basicAuth}`
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`SFTPGo user auth failed for ${username} (${res.status}): ${errText}`);
      }

      const data = await res.json();
      this.userTokens[username] = {
        token: data.access_token,
        expiresAt: new Date(data.expires_at).getTime()
      };
      return data.access_token;
    } catch (err) {
      console.error(`FTP Service: Error getting user token for ${username}:`, err.message);
      throw err;
    }
  }

  // Upload an evidence or telemetry image buffer to remote SFTPGo server
  async uploadEvidenceImage({
    buffer,
    filename,
    vehicleRegNo = 'UNKNOWN',
    angle = 'overview',
    weight = null,
    sessionId = null,
    cameraName = 'Weighbridge Camera',
    cameraIp = null,
    gateType = null
  }) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Image buffer is empty');
    }

    const token = await this.getUserToken();
    const cleanAngle = (angle || 'overview').toLowerCase();

    // Determine filename following Entry_Gate_IP_DDMMYY convention or fallback
    let finalFilename = filename;
    if (!finalFilename) {
      const isEntry = gateType === 'entry' || (cameraName && /gate|entry/i.test(cameraName));
      if (isEntry) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const ddmmyy = `${dd}${mm}${yy}`;
        const ip = cameraIp || '192.168.0.100';
        finalFilename = `Entry_Gate_${ip}_${ddmmyy}.jpg`;
      } else {
        const cleanReg = (vehicleRegNo || 'VEH').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        finalFilename = `WB_${cleanReg}_${cleanAngle}_${Date.now()}.jpg`;
      }
    } else {
      // Ensure image file extension is present
      if (!/\.(jpg|jpeg|png)$/i.test(finalFilename)) {
        finalFilename = `${finalFilename}.jpg`;
      }
    }

    const remotePath = `/weighbridge/${finalFilename}`;

    console.log(`📤 Uploading image to SFTPGo: ${remotePath} (${(buffer.length / 1024).toFixed(1)} KB)`);

    const uploadUrl = `${SFTPGO_API_URL}/user/files/upload?path=${encodeURIComponent(remotePath)}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'X-Filename': finalFilename
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`SFTPGo upload failed (${uploadRes.status}): ${errText}`);
    }

    const result = await uploadRes.json().catch(() => ({ message: 'Uploaded' }));
    console.log(`✅ Upload complete to SFTPGo: ${remotePath}`, result);

    const ftpUrl = `ftp://${SFTPGO_HOST}:${SFTPGO_FTP_PORT}${remotePath}`;
    const sftpUrl = `sftp://${SFTPGO_USER}@${SFTPGO_HOST}:${SFTPGO_SFTP_PORT}${remotePath}`;
    const httpProxyUrl = `/api/ftp/file?path=${encodeURIComponent(remotePath)}`;

    // Store evidence metadata in MySQL database
    try {
      const isEntry = gateType === 'entry' || (cameraName && /gate|entry/i.test(cameraName));
      const eventId = sessionId || (isEntry ? `GATE_EV_${Date.now()}` : `WB_TEL_${Date.now()}`);
      const validAngle = ['front', 'side', 'rear', 'plate', 'overview', 'exit'].includes(cleanAngle) ? cleanAngle : 'overview';
      const source = isEntry ? 'gate_monitor' : 'weighbridge_telemetry';
      const cameraId = cameraIp ? `cam_${cameraIp}` : (isEntry ? 'cam_gate_1' : 'weighbridge');

      // Ensure parent ANPR event exists for foreign key constraint
      await pool.query(
        `INSERT INTO anpr_events 
         (event_id, plant_id, camera_id, vehicle_reg_no, confidence, source, vehicle_type, timestamp)
         VALUES (?, 'plant_001', ?, ?, 0.98, ?, 'Transit Mixer', NOW())
         ON DUPLICATE KEY UPDATE vehicle_reg_no = VALUES(vehicle_reg_no)`,
        [eventId, cameraId, vehicleRegNo || 'UNKNOWN', source]
      );

      await pool.query(
        `INSERT INTO anpr_evidence 
         (event_id, evidence_type, url, thumbnail_url, angle, timestamp, file_size, mime_type)
         VALUES (?, 'image', ?, ?, ?, NOW(), ?, 'image/jpeg')`,
        [eventId, ftpUrl, httpProxyUrl, validAngle, buffer.length]
      );
    } catch (dbErr) {
      console.warn('FTP Service: DB evidence log warning:', dbErr.message);
    }


    return {
      success: true,
      filename: finalFilename,
      remotePath,
      ftpUrl,
      sftpUrl,
      httpProxyUrl,
      webAdminUrl: SFTPGO_WEB_ADMIN_URL,
      sizeBytes: buffer.length,
      angle: cleanAngle,
      vehicleRegNo,
      weight,
      cameraName,
      timestamp: new Date().toISOString()
    };
  }

  // Read and parse all ANPR plate image files from camera FTP directory
  async getFtpAnprPlates(limit = 25) {
    try {
      const token = await this.getUserToken(SFTPGO_CAMERA_USER, SFTPGO_CAMERA_PASS);
      const dirsRes = await fetch(`${SFTPGO_API_URL}/user/dirs?path=%2F`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!dirsRes.ok) {
        throw new Error(`SFTPGo list dirs failed: ${dirsRes.statusText}`);
      }

      const list = await dirsRes.json();
      const plates = [];

      for (const item of list) {
        // Pattern: Unkown_<VEHICLE_NO>(CH1_YYYY_MM_DD_HHMMSS).jpg or Unknown_<VEHICLE_NO>(...)
        const match = item.name.match(/^un\w*?_([^(.]+)(?:\(([^_]+)_(\d{4})_(\d{2})_(\d{2})_(\d{2})(\d{2})(\d{2})\))?/i);
        if (match) {
          const rawPlate = match[1].trim().toUpperCase();
          const channel = match[2] || 'CH1';
          const fileTime = match[3] 
            ? `${match[3]}-${match[4]}-${match[5]}T${match[6]}:${match[7]}:${match[8]}Z`
            : item.last_modified;

          plates.push({
            plate: rawPlate,
            filename: item.name,
            sizeBytes: item.size,
            channel,
            timestamp: fileTime,
            lastModified: item.last_modified,
            imageUrl: `/api/ftp/file?user=${SFTPGO_CAMERA_USER}&path=${encodeURIComponent('/' + item.name)}`
          });
        }
      }

      // Sort newest first by lastModified
      plates.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

      return plates.slice(0, limit);
    } catch (err) {
      console.error('FTP Service: Error fetching ANPR plates from FTP:', err.message);
      return [];
    }
  }

  // Get single latest ANPR plate detected from camera FTP
  async getLatestFtpAnprPlate() {
    const plates = await this.getFtpAnprPlates(1);
    return plates.length > 0 ? plates[0] : null;
  }

  // Retrieve file buffer from remote SFTPGo server
  async getFile(remotePath, requestedUser = null) {
    // Determine target user
    let targetUser = requestedUser;
    if (!targetUser) {
      if (/un\w*?_/i.test(remotePath) || !remotePath.startsWith('/weighbridge')) {
        targetUser = SFTPGO_CAMERA_USER;
      } else {
        targetUser = SFTPGO_USER;
      }
    }

    const targetPass = targetUser === SFTPGO_CAMERA_USER ? SFTPGO_CAMERA_PASS : SFTPGO_PASS;
    const token = await this.getUserToken(targetUser, targetPass);

    const cleanPath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    const downloadUrl = `${SFTPGO_API_URL}/user/files?path=${encodeURIComponent(cleanPath)}`;

    let res = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok && !cleanPath.endsWith('.jpg')) {
      const fallbackUrl = `${SFTPGO_API_URL}/user/files?path=${encodeURIComponent(cleanPath + '.jpg')}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fallbackRes.ok) {
        res = fallbackRes;
      }
    }

    if (!res.ok) {
      throw new Error(`SFTPGo file retrieval failed for ${cleanPath} (${res.status})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: res.headers.get('content-type') || 'image/jpeg'
    };
  }

  // Get status of SFTPGo service and user account
  async getStatus() {
    try {
      const token = await this.getUserToken();
      return {
        online: true,
        host: SFTPGO_HOST,
        ftpPort: SFTPGO_FTP_PORT,
        sftpPort: SFTPGO_SFTP_PORT,
        username: SFTPGO_USER,
        targetFolder: '/weighbridge',
        webAdminUrl: SFTPGO_WEB_ADMIN_URL,
        message: 'Connected to SFTPGo remote server'
      };
    } catch (err) {
      return {
        online: false,
        host: SFTPGO_HOST,
        error: err.message,
        webAdminUrl: SFTPGO_WEB_ADMIN_URL,
        message: 'Failed to connect to SFTPGo'
      };
    }
  }

  // List recent uploads from database
  async getRecentUploads(limit = 20) {
    try {
      const [rows] = await pool.query(
        `SELECT id, event_id, evidence_type, url, thumbnail_url, angle, timestamp, file_size, created_at
         FROM anpr_evidence
         WHERE url LIKE '%weighbridge%' OR url LIKE '%ftp%'
         ORDER BY created_at DESC
         LIMIT ?`,
        [Number(limit)]
      );
      return rows;
    } catch (err) {
      console.warn('Error fetching recent FTP uploads:', err.message);
      return [];
    }
  }
}

export const ftpService = new FtpService();
export default ftpService;
