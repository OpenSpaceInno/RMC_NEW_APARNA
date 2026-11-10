import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

class FtpService {
  constructor() {
    this.userTokens = {};
    this.config = {
      host: process.env.SFTPGO_HOST || '213.210.37.249',
      apiUrl: (process.env.SFTPGO_API_URL || 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/api/v2').replace(/\/+$/, ''),
      adminUser: process.env.SFTPGO_ADMIN_USER || 'ftpsuperadmin',
      adminPass: process.env.SFTPGO_ADMIN_PASS || 'Demo#Test@2026',
      username: process.env.SFTPGO_USER || 'aparna_rmc',
      password: process.env.SFTPGO_PASS || 'Rmc@Aparna#2026',
      cameraUser: process.env.SFTPGO_CAMERA_USER || 'sarath',
      cameraPass: process.env.SFTPGO_CAMERA_PASS || 'Password@123',
      ftpPort: Number(process.env.SFTPGO_FTP_PORT) || 2121,
      sftpPort: Number(process.env.SFTPGO_SFTP_PORT) || 2222,
      remoteFolder: '/weighbridge',
      webAdminUrl: process.env.SFTPGO_WEB_ADMIN_URL || 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users'
    };
    this.initFromDatabase();
  }

  // Load persistent FTP config from database if present
  async initFromDatabase() {
    try {
      const [rows] = await pool.query('SELECT * FROM device_ftp_config WHERE id = "default" LIMIT 1');
      if (rows && rows.length > 0) {
        const row = rows[0];
        this.config = {
          host: row.host || this.config.host,
          apiUrl: (row.api_url || this.config.apiUrl).replace(/\/+$/, ''),
          adminUser: row.admin_user || this.config.adminUser,
          adminPass: row.admin_password || this.config.adminPass,
          username: row.username || this.config.username,
          password: row.password || this.config.password,
          cameraUser: row.camera_user || this.config.cameraUser,
          cameraPass: row.camera_password || this.config.cameraPass,
          ftpPort: Number(row.ftp_port) || this.config.ftpPort,
          sftpPort: Number(row.sftp_port) || this.config.sftpPort,
          remoteFolder: row.remote_folder || this.config.remoteFolder,
          webAdminUrl: row.web_admin_url || this.config.webAdminUrl
        };
        console.log(`📡 FTP Service: Loaded persistent configuration from database [host: ${this.config.host}]`);
      }
    } catch (err) {
      console.warn('FTP Service: Could not read device_ftp_config from db, using defaults:', err.message);
    }
  }

  // Return the active configuration
  getConfig() {
    return {
      host: this.config.host,
      apiUrl: this.config.apiUrl,
      ftpPort: this.config.ftpPort,
      sftpPort: this.config.sftpPort,
      username: this.config.username,
      password: this.config.password,
      cameraUser: this.config.cameraUser,
      cameraPassword: this.config.cameraPass,
      adminUser: this.config.adminUser,
      adminPassword: this.config.adminPass,
      remoteFolder: this.config.remoteFolder,
      webAdminUrl: this.config.webAdminUrl
    };
  }

  // Update configuration in-memory and in database
  async updateConfig(newConfig) {
    if (!newConfig) throw new Error('Configuration object is required');

    if (newConfig.host) this.config.host = newConfig.host.trim();
    if (newConfig.apiUrl) this.config.apiUrl = newConfig.apiUrl.trim().replace(/\/+$/, '');
    if (newConfig.ftpPort) this.config.ftpPort = Number(newConfig.ftpPort);
    if (newConfig.sftpPort) this.config.sftpPort = Number(newConfig.sftpPort);
    if (newConfig.username) this.config.username = newConfig.username.trim();
    if (newConfig.password) this.config.password = newConfig.password;
    if (newConfig.cameraUser) this.config.cameraUser = newConfig.cameraUser.trim();
    if (newConfig.cameraPassword) this.config.cameraPass = newConfig.cameraPassword;
    if (newConfig.adminUser) this.config.adminUser = newConfig.adminUser.trim();
    if (newConfig.adminPassword) this.config.adminPass = newConfig.adminPassword;
    if (newConfig.remoteFolder) this.config.remoteFolder = newConfig.remoteFolder.trim();
    if (newConfig.webAdminUrl) this.config.webAdminUrl = newConfig.webAdminUrl.trim();

    // Invalidate cached user access tokens
    this.userTokens = {};

    try {
      await pool.query(`
        INSERT INTO device_ftp_config (
          id, host, api_url, ftp_port, sftp_port, username, password,
          camera_user, camera_password, admin_user, admin_password,
          remote_folder, web_admin_url
        ) VALUES (
          'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        ) ON DUPLICATE KEY UPDATE
          host = VALUES(host),
          api_url = VALUES(api_url),
          ftp_port = VALUES(ftp_port),
          sftp_port = VALUES(sftp_port),
          username = VALUES(username),
          password = VALUES(password),
          camera_user = VALUES(camera_user),
          camera_password = VALUES(camera_password),
          admin_user = VALUES(admin_user),
          admin_password = VALUES(admin_password),
          remote_folder = VALUES(remote_folder),
          web_admin_url = VALUES(web_admin_url),
          updated_at = NOW()
      `, [
        this.config.host,
        this.config.apiUrl,
        this.config.ftpPort,
        this.config.sftpPort,
        this.config.username,
        this.config.password,
        this.config.cameraUser,
        this.config.cameraPass,
        this.config.adminUser,
        this.config.adminPass,
        this.config.remoteFolder,
        this.config.webAdminUrl
      ]);
      console.log('✅ FTP Service: Configuration persisted to MySQL table device_ftp_config');
    } catch (err) {
      console.error('FTP Service: Failed to persist configuration to database:', err.message);
    }

    return this.getConfig();
  }

  // Test connection to SFTPGo server with given or current credentials
  async testConnection(testConfig = null) {
    const targetUrl = (testConfig?.apiUrl || this.config.apiUrl).replace(/\/+$/, '');
    const user = testConfig?.username || this.config.username;
    const pass = testConfig?.password || this.config.password;
    const start = Date.now();

    try {
      const basicAuth = Buffer.from(`${user}:${pass}`).toString('base64');
      const res = await fetch(`${targetUrl}/user/token`, {
        headers: {
          Authorization: `Basic ${basicAuth}`
        }
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          latencyMs,
          status: res.status,
          error: `SFTPGo authentication failed (${res.status}): ${errText}`
        };
      }

      const data = await res.json();
      return {
        success: true,
        latencyMs,
        tokenExpiry: data.expires_at,
        host: testConfig?.host || this.config.host,
        user,
        message: `Connected successfully to SFTPGo API (${latencyMs}ms)`
      };
    } catch (err) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: `Connection error: ${err.message}`
      };
    }
  }

  // Get or refresh User Access Token from SFTPGo for a specific user
  async getUserToken(username, password) {
    const authUser = username || this.config.username;
    const authPass = password || (authUser === this.config.cameraUser ? this.config.cameraPass : this.config.password);

    const now = Date.now();
    const cached = this.userTokens[authUser];
    if (cached && cached.expiresAt > now + 60000) {
      return cached.token;
    }

    try {
      const basicAuth = Buffer.from(`${authUser}:${authPass}`).toString('base64');
      const res = await fetch(`${this.config.apiUrl}/user/token`, {
        headers: {
          Authorization: `Basic ${basicAuth}`
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`SFTPGo user auth failed for ${authUser} (${res.status}): ${errText}`);
      }

      const data = await res.json();
      this.userTokens[authUser] = {
        token: data.access_token,
        expiresAt: new Date(data.expires_at).getTime()
      };
      return data.access_token;
    } catch (err) {
      console.error(`FTP Service: Error getting user token for ${authUser}:`, err.message);
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
    gateType = null,
    targetUser = 'sarath'
  }) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Image buffer is empty');
    }

    const isCameraUser = !targetUser || targetUser.toLowerCase() === 'sarath' || targetUser === this.config.cameraUser;
    const authUser = isCameraUser ? this.config.cameraUser : (targetUser || this.config.username);
    const authPass = isCameraUser ? this.config.cameraPass : this.config.password;

    const token = await this.getUserToken(authUser, authPass);
    const cleanAngle = (angle || 'overview').toLowerCase();

    // Determine filename following Front/Back/Top or convention
    let finalFilename = filename;
    if (!finalFilename) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const prefix = cleanAngle === 'front' ? 'Front' : (cleanAngle === 'back' || cleanAngle === 'rear' || cleanAngle === 'platform') ? 'Back' : (cleanAngle === 'top' || cleanAngle === 'cabin') ? 'Top' : 'Evidence';
      finalFilename = `${prefix}_${timestamp}.jpg`;
    } else {
      if (!/\.(jpg|jpeg|png)$/i.test(finalFilename)) {
        finalFilename = `${finalFilename}.jpg`;
      }
    }

    const remoteBase = isCameraUser ? '' : (this.config.remoteFolder || '/weighbridge').replace(/\/+$/, '');
    const remotePath = `${remoteBase}/${finalFilename}`.replace(/\/+/g, '/');

    console.log(`📤 Uploading image to SFTPGo for user [${authUser}]: ${remotePath} (${(buffer.length / 1024).toFixed(1)} KB)`);

    const uploadUrl = `${this.config.apiUrl}/user/files/upload?path=${encodeURIComponent(remotePath)}`;
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
      throw new Error(`SFTPGo upload failed for ${authUser} (${uploadRes.status}): ${errText}`);
    }

    const result = await uploadRes.json().catch(() => ({ message: 'Uploaded' }));
    console.log(`✅ Upload complete to SFTPGo for user [${authUser}]: ${remotePath}`, result);

    const ftpUrl = `ftp://${this.config.host}:${this.config.ftpPort}${remotePath}`;
    const sftpUrl = `sftp://${authUser}@${this.config.host}:${this.config.sftpPort}${remotePath}`;
    const httpProxyUrl = `/api/ftp/file?path=${encodeURIComponent(remotePath)}&user=${authUser}`;

    // Store evidence metadata in MySQL database
    try {
      const isEntry = gateType === 'entry' || (cameraName && /gate|entry/i.test(cameraName));
      const eventType = isEntry ? 'INBOUND_ENTRY' : 'WEIGHBRIDGE_CAPTURE';
      const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await pool.query(
        `INSERT INTO anpr_evidence (
          id, event_id, evidence_type, url, thumbnail_url, angle,
          timestamp, metadata, file_size
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [
          `EVD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          eventId,
          'IMAGE',
          httpProxyUrl,
          httpProxyUrl,
          cleanAngle,
          JSON.stringify({
            vehicleRegNo,
            weight,
            sessionId,
            cameraName,
            cameraIp,
            gateType,
            ftpUrl,
            sftpUrl,
            remotePath,
            targetUser: authUser
          }),
          buffer.length
        ]
      ).catch((err) => {
        console.warn('Could not save evidence record to database:', err.message);
      });
    } catch (dbErr) {
      console.warn('DB evidence logging error:', dbErr.message);
    }

    return {
      success: true,
      filename: finalFilename,
      remotePath,
      ftpUrl,
      sftpUrl,
      httpProxyUrl,
      webAdminUrl: this.config.webAdminUrl,
      targetUser: authUser,
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
      const token = await this.getUserToken(this.config.cameraUser, this.config.cameraPass);
      const dirsRes = await fetch(`${this.config.apiUrl}/user/dirs?path=%2F`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!dirsRes.ok) {
        throw new Error(`SFTPGo list dirs failed: ${dirsRes.statusText}`);
      }

      const list = await dirsRes.json();
      const plates = [];

      for (const item of list) {
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
            imageUrl: `/api/ftp/file?user=${this.config.cameraUser}&path=${encodeURIComponent('/' + item.name)}`
          });
        }
      }

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
    let targetUser = requestedUser;
    if (!targetUser) {
      if (/un\w*?_/i.test(remotePath) || !remotePath.startsWith('/weighbridge')) {
        targetUser = this.config.cameraUser;
      } else {
        targetUser = this.config.username;
      }
    }

    const targetPass = targetUser === this.config.cameraUser ? this.config.cameraPass : this.config.password;
    const token = await this.getUserToken(targetUser, targetPass);

    const cleanPath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    const downloadUrl = `${this.config.apiUrl}/user/files?path=${encodeURIComponent(cleanPath)}`;

    let res = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok && !cleanPath.endsWith('.jpg')) {
      const fallbackUrl = `${this.config.apiUrl}/user/files?path=${encodeURIComponent(cleanPath + '.jpg')}`;
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
        host: this.config.host,
        apiUrl: this.config.apiUrl,
        ftpPort: String(this.config.ftpPort),
        sftpPort: String(this.config.sftpPort),
        username: this.config.username,
        targetFolder: this.config.remoteFolder,
        webAdminUrl: this.config.webAdminUrl,
        message: 'Connected to SFTPGo remote server'
      };
    } catch (err) {
      return {
        online: false,
        host: this.config.host,
        apiUrl: this.config.apiUrl,
        error: err.message,
        webAdminUrl: this.config.webAdminUrl,
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
