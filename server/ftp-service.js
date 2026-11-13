import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

export function sanitizeFolderName(name, fallback = 'Default') {
  const cleaned = String(name || fallback)
    .replace(/•/g, '-')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
}

export function mapLocationToFolderName(location) {
  const raw = String(location || '').trim();
  const lower = raw.toLowerCase();
  if (!lower || lower === 'entry' || lower === 'entry gate' || lower === 'entry_gate') {
    return 'Entry Gate';
  }
  if (lower === 'exit' || lower === 'exit gate' || lower === 'exit_gate' || lower === 'weighbridge') {
    return 'Exit Gate';
  }
  return sanitizeFolderName(raw, 'Entry Gate');
}

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

  // Ensure every segment of a directory path exists in SFTPGo
  async ensureDirectory(remoteDirPath, targetUser = null) {
    const authUser = targetUser || this.config.cameraUser;
    const authPass = authUser === this.config.cameraUser ? this.config.cameraPass : this.config.password;
    const token = await this.getUserToken(authUser, authPass);

    const segments = String(remoteDirPath || '')
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    let currentPath = '';
    for (const seg of segments) {
      currentPath += `/${seg}`;
      const res = await fetch(`${this.config.apiUrl}/user/dirs?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 201 = created; 400/409/500 with "already exists" is fine
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        if (!/exist/i.test(bodyText) && res.status !== 409) {
          // Verify whether the directory already exists via listing
          const checkRes = await fetch(
            `${this.config.apiUrl}/user/dirs?path=${encodeURIComponent(currentPath)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!checkRes.ok) {
            throw new Error(`Failed to create FTP directory ${currentPath} (${res.status}): ${bodyText}`);
          }
        }
      }
    }

    return currentPath || '/';
  }

  // Ensure a plant's root folder + Entry Gate / Exit Gate subfolders exist in FTP
  async ensurePlantFolders(plant) {
    if (!plant) return null;
    const plantFolder = sanitizeFolderName(plant.name || plant.code || plant.id, 'Plant');
    const basePath = `/${plantFolder}`;
    const entryPath = `${basePath}/Entry Gate`;
    const exitPath = `${basePath}/Exit Gate`;

    await this.ensureDirectory(entryPath, this.config.cameraUser);
    await this.ensureDirectory(exitPath, this.config.cameraUser);

    return {
      plantId: plant.id,
      plantName: plant.name,
      plantFolder,
      basePath,
      entryPath,
      exitPath,
    };
  }

  // Ensure a plant's gate location folder exists (never creating camera subfolders inside Entry/Exit Gate)
  async ensureCameraFolder({ plantId, plantName, location }) {
    let resolvedPlantName = plantName;
    if (!resolvedPlantName && plantId) {
      const [rows] = await pool.query('SELECT name, code FROM plants WHERE id = ? LIMIT 1', [plantId]).catch(() => [[]]);
      if (rows && rows.length > 0) {
        resolvedPlantName = rows[0].name || rows[0].code;
      }
    }
    const plantFolder = sanitizeFolderName(resolvedPlantName || plantId || 'Plant 01 - Shamshabad Central');
    const locationFolder = mapLocationToFolderName(location);
    const fullPath = `/${plantFolder}/${locationFolder}`;
    await this.ensureDirectory(fullPath, this.config.cameraUser);
    return fullPath;
  }

  // Sync FTP folders for all plants (2-level only: /<Plant Name>/Entry Gate and /<Plant Name>/Exit Gate)
  async syncAllPlantFolders() {
    const [plants] = await pool.query('SELECT id, code, name FROM plants ORDER BY code ASC');
    const results = [];
    for (const plant of plants) {
      try {
        const res = await this.ensurePlantFolders(plant);
        if (res) results.push(res);
      } catch (err) {
        console.warn(`FTP Service: Could not sync folders for plant ${plant.id} (${plant.name}):`, err.message);
      }
    }

    const [cameras] = await pool.query(
      `SELECT DISTINCT c.plant_id, c.location, p.name AS plant_name, p.code AS plant_code
       FROM camera_devices c
       INNER JOIN plants p ON p.id = c.plant_id`
    ).catch(() => [[]]);

    let gateSynced = 0;
    for (const cam of cameras) {
      try {
        await this.ensureCameraFolder({
          plantId: cam.plant_id,
          plantName: cam.plant_name || cam.plant_code,
          location: cam.location,
        });
        gateSynced++;
      } catch (err) {
        console.warn(`FTP Service: Could not sync gate folder for plant ${cam.plant_id}:`, err.message);
      }
    }

    console.log(`📁 FTP Service: Synced 2-level folders for ${results.length}/${plants.length} plants (${gateSynced} camera gate folder(s))`);
    return results;
  }

  // Fetch FTP gate folders for a plant (ensuring Entry Gate & Exit Gate exist)
  async getPlantFolders(plantId) {
    const [rows] = await pool.query('SELECT id, code, name FROM plants WHERE id = ? LIMIT 1', [plantId]);
    if (!rows || rows.length === 0) {
      throw new Error(`Plant '${plantId}' not found`);
    }

    const plant = rows[0];
    const plantFolder = sanitizeFolderName(plant.name || plant.code || plant.id);

    try {
      await this.ensurePlantFolders(plant);
    } catch (err) {
      console.warn(`FTP Service: ensurePlantFolders warning for ${plantId}:`, err.message);
    }

    const folders = [
      { value: 'entry', label: 'Entry Gate', folderName: 'Entry Gate', path: `/${plantFolder}/Entry Gate` },
      { value: 'exit', label: 'Exit Gate', folderName: 'Exit Gate', path: `/${plantFolder}/Exit Gate` },
    ];

    try {
      const token = await this.getUserToken(this.config.cameraUser, this.config.cameraPass);
      const listRes = await fetch(
        `${this.config.apiUrl}/user/dirs?path=${encodeURIComponent('/' + plantFolder)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (listRes.ok) {
        const entries = await listRes.json();
        if (Array.isArray(entries)) {
          for (const entry of entries) {
            const isDir = entry.type === 'dir' || (typeof entry.mode === 'number' && (entry.mode & 0x80000000) !== 0);
            if (!isDir) continue;
            const lower = entry.name.toLowerCase();
            if (lower === 'entry gate' || lower === 'exit gate') continue;
            folders.push({
              value: entry.name,
              label: entry.name,
              folderName: entry.name,
              path: `/${plantFolder}/${entry.name}`,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`FTP Service: Could not list folders for ${plantFolder}:`, err.message);
    }

    return {
      success: true,
      plantId: plant.id,
      plantName: plant.name,
      plantFolder,
      folders,
    };
  }

  // Upload an evidence or telemetry image buffer to remote SFTPGo server
  async uploadEvidenceImage({
    buffer,
    filename,
    vehicleRegNo = 'UNKNOWN',
    angle = 'overview',
    weight = null,
    sessionId = null,
    cameraId = null,
    plantId = null,
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

    // Resolve Plant / Gate Location / Camera folder path from database
    let resolvedPlantName = null;
    let resolvedLocation = gateType || null;
    let resolvedCameraName = cameraName || cameraId || null;

    try {
      let camRows = [];
      if (cameraId) {
        [camRows] = await pool.query(
          `SELECT c.device_id, c.name, c.location, c.plant_id, p.name AS plant_name
           FROM camera_devices c LEFT JOIN plants p ON p.id = c.plant_id
           WHERE c.device_id = ? LIMIT 1`,
          [cameraId]
        );
      }
      if ((!camRows || camRows.length === 0) && cameraIp) {
        [camRows] = await pool.query(
          `SELECT c.device_id, c.name, c.location, c.plant_id, p.name AS plant_name
           FROM camera_devices c LEFT JOIN plants p ON p.id = c.plant_id
           WHERE c.ip_address = ? LIMIT 1`,
          [cameraIp]
        );
      }
      if ((!camRows || camRows.length === 0) && cameraName) {
        [camRows] = await pool.query(
          `SELECT c.device_id, c.name, c.location, c.plant_id, p.name AS plant_name
           FROM camera_devices c LEFT JOIN plants p ON p.id = c.plant_id
           WHERE c.name = ? LIMIT 1`,
          [cameraName]
        );
      }

      if (camRows && camRows.length > 0) {
        resolvedPlantName = camRows[0].plant_name || camRows[0].plant_id;
        resolvedLocation = camRows[0].location || resolvedLocation;
        resolvedCameraName = camRows[0].name || camRows[0].device_id;
      } else if (plantId) {
        const [pRows] = await pool.query('SELECT name, code FROM plants WHERE id = ? LIMIT 1', [plantId]);
        if (pRows && pRows.length > 0) {
          resolvedPlantName = pRows[0].name || pRows[0].code;
        }
      }
    } catch (lookupErr) {
      console.warn('FTP Service: Camera/plant lookup fallback:', lookupErr.message);
    }

    let remoteBase = '';
    if (resolvedPlantName) {
      const plantFolder = sanitizeFolderName(resolvedPlantName);
      const locationFolder = mapLocationToFolderName(resolvedLocation || (cleanAngle === 'front' ? 'entry' : 'exit'));
      remoteBase = `/${plantFolder}/${locationFolder}`;
      await this.ensureDirectory(remoteBase, authUser);
    } else {
      remoteBase = isCameraUser ? '' : (this.config.remoteFolder || '/weighbridge').replace(/\/+$/, '');
    }

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

  // Move / rename a file inside SFTPGo server-side
  async moveFile(srcPath, dstPath, targetUser = null) {
    const authUser = targetUser || this.config.cameraUser;
    const authPass = authUser === this.config.cameraUser ? this.config.cameraPass : this.config.password;
    const token = await this.getUserToken(authUser, authPass);

    const res = await fetch(
      `${this.config.apiUrl}/user/files?path=${encodeURIComponent(srcPath)}&target=${encodeURIComponent(dstPath)}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed moving FTP file ${srcPath} -> ${dstPath} (${res.status}): ${errText}`);
    }
    return true;
  }

  // Resolve DB-backed 2-level camera FTP folders (/<Plant Name>/<Gate Folder>) scoped by optional plantId / cameraId / gateType
  async getScopedCameraFolders({ plantId = null, cameraId = null, gateType = null } = {}) {
    const params = [];
    const conditions = [];

    if (plantId && plantId !== 'all') {
      conditions.push('c.plant_id = ?');
      params.push(plantId);
    }
    if (cameraId && cameraId !== 'all') {
      conditions.push('c.device_id = ?');
      params.push(cameraId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT c.device_id, c.name, c.location, c.ip_address, c.plant_id,
              p.name AS plant_name, p.code AS plant_code
       FROM camera_devices c
       INNER JOIN plants p ON p.id = c.plant_id
       ${whereClause}
       ORDER BY c.created_at ASC`,
      params
    );

    return rows
      .filter((row) => {
        if (!gateType || gateType === 'all') return true;
        return mapLocationToFolderName(row.location) === mapLocationToFolderName(gateType);
      })
      .map((row) => {
        const plantFolder = sanitizeFolderName(row.plant_name || row.plant_code || row.plant_id);
        const locationFolder = mapLocationToFolderName(row.location);
        const folderPath = `/${plantFolder}/${locationFolder}`;
        return {
          deviceId: row.device_id,
          cameraName: row.name,
          location: row.location,
          ipAddress: row.ip_address || '',
          plantId: row.plant_id,
          plantName: row.plant_name || row.plant_code || row.plant_id,
          plantFolder,
          locationFolder,
          folderPath,
        };
      });
  }

  // Resolve unique 2-level FTP folders to scan for a plant/camera (works even if plant has no cameras registered yet)
  async getScopedScanFolders({ plantId = null, cameraId = null, gateType = null } = {}) {
    const camTargets = await this.getScopedCameraFolders({ plantId, cameraId, gateType });
    const folderMap = new Map();

    for (const cam of camTargets) {
      if (!folderMap.has(cam.folderPath)) {
        folderMap.set(cam.folderPath, {
          folderPath: cam.folderPath,
          plantId: cam.plantId,
          plantName: cam.plantName,
          cameraId: cam.deviceId,
          cameraName: cam.cameraName,
          location: cam.location,
        });
      }
    }

    // If no specific cameraId was requested, also include the plant's Entry Gate & Exit Gate folders directly
    if (!cameraId || cameraId === 'all') {
      const pParams = [];
      let pWhere = '';
      if (plantId && plantId !== 'all') {
        pWhere = 'WHERE id = ?';
        pParams.push(plantId);
      }
      const [plantRows] = await pool.query(`SELECT id, code, name FROM plants ${pWhere} ORDER BY code ASC`, pParams);
      for (const plant of plantRows) {
        const plantFolder = sanitizeFolderName(plant.name || plant.code || plant.id);
        const gateDirs = gateType && gateType !== 'all'
          ? [mapLocationToFolderName(gateType)]
          : ['Entry Gate', 'Exit Gate'];

        for (const g of gateDirs) {
          const folderPath = `/${plantFolder}/${g}`;
          if (!folderMap.has(folderPath)) {
            folderMap.set(folderPath, {
              folderPath,
              plantId: plant.id,
              plantName: plant.name || plant.code || plant.id,
              cameraId: null,
              cameraName: g,
              location: g === 'Exit Gate' ? 'exit' : 'entry',
            });
          }
        }
      }
    }

    return Array.from(folderMap.values());
  }

  // Parse camera upload filenames (IP detection, ANPR crop, or generic uploaded image)
  parseCameraUploadMeta(filename, lastModified) {
    // 1. Hikvision full-frame detection: 192.168.0.101_01_20261112190116504_LICENSE_PLATE_DETECTION.jpg
    const ipMatch = filename.match(
      /^(\d{1,3}(?:\.\d{1,3}){3})_(\d+)_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})?_/
    );
    if (ipMatch) {
      const clockMs = Date.UTC(
        Number(ipMatch[3]),
        Number(ipMatch[4]) - 1,
        Number(ipMatch[5]),
        Number(ipMatch[6]),
        Number(ipMatch[7]),
        Number(ipMatch[8]),
        Number(ipMatch[9] || 0)
      );
      return {
        kind: 'ip_detection',
        ip: ipMatch[1],
        channelNum: Number(ipMatch[2]),
        plate: '',
        clockMs,
        modMs: lastModified ? new Date(lastModified).getTime() : clockMs,
      };
    }

    // 2. ANPR cropped plate: Unkown_BR01CJ6440(CH1_2026_11_12_190118).jpg
    const plateMatch = filename.match(
      /^un\w*?_([^(.]+)(?:\(([^_]+)_(\d{4})_(\d{2})_(\d{2})_(\d{2})(\d{2})(\d{2})\))?/i
    );
    if (plateMatch) {
      const clockMs = plateMatch[3]
        ? Date.UTC(
            Number(plateMatch[3]),
            Number(plateMatch[4]) - 1,
            Number(plateMatch[5]),
            Number(plateMatch[6]),
            Number(plateMatch[7]),
            Number(plateMatch[8])
          )
        : (lastModified ? new Date(lastModified).getTime() : Date.now());
      return {
        kind: 'anpr_plate',
        plate: plateMatch[1].trim().toUpperCase(),
        channel: plateMatch[2] || 'CH1',
        timestampIso: plateMatch[3]
          ? `${plateMatch[3]}-${plateMatch[4]}-${plateMatch[5]}T${plateMatch[6]}:${plateMatch[7]}:${plateMatch[8]}Z`
          : lastModified,
        clockMs,
        modMs: lastModified ? new Date(lastModified).getTime() : clockMs,
      };
    }

    // 3. Generic image uploaded into a plant gate folder (extract plate from filename if present)
    if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      const regMatch = filename.toUpperCase().match(/\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\b/);
      return {
        kind: 'uploaded_image',
        plate: regMatch ? regMatch[1] : '',
        channel: 'CAM',
        timestampIso: lastModified || new Date().toISOString(),
        clockMs: lastModified ? new Date(lastModified).getTime() : Date.now(),
        modMs: lastModified ? new Date(lastModified).getTime() : Date.now(),
      };
    }

    return null;
  }

  // Automatically route camera-pushed files from SFTPGo root '/' into their DB camera folders
  async routeIncomingCameraFiles({ maxFiles = 60 } = {}) {
    if (this._routingPromise) {
      return this._routingPromise;
    }

    this._routingPromise = (async () => {
      try {
        const cameras = await this.getScopedCameraFolders({});
        if (!cameras.length) return { moved: 0, remaining: 0 };

        const camerasByIp = new Map();
        for (const cam of cameras) {
          if (cam.ipAddress) camerasByIp.set(cam.ipAddress.trim(), cam);
        }

        // Single unambiguous ANPR/entry camera in DB (used only when an Unkown_* file lacks an IP companion)
        const anprCandidates = cameras.filter(
          (c) =>
            c.locationFolder === 'Entry Gate' ||
            /anpr/i.test(c.cameraName || '') ||
            /anpr/i.test(c.deviceId || '')
        );
        const fallbackAnprCam =
          anprCandidates.length === 1
            ? anprCandidates[0]
            : cameras.length === 1
            ? cameras[0]
            : null;

        const token = await this.getUserToken(this.config.cameraUser, this.config.cameraPass);
        const dirsRes = await fetch(`${this.config.apiUrl}/user/dirs?path=%2F`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!dirsRes.ok) return { moved: 0, remaining: 0 };

        const entries = await dirsRes.json();
        if (!Array.isArray(entries)) return { moved: 0, remaining: 0 };

        const rootFiles = entries.filter((item) => {
          const isDir = item.type === 'dir' || (typeof item.mode === 'number' && (item.mode & 0x80000000) !== 0);
          return !isDir && item.name;
        });

        // Index IP-prefixed detections first so companion Unkown_* plate files resolve accurately by timestamp
        const ipDetections = [];
        const candidates = [];

        for (const item of rootFiles) {
          const meta = this.parseCameraUploadMeta(item.name, item.last_modified);
          if (!meta) continue;
          if (meta.kind === 'ip_detection' && camerasByIp.has(meta.ip)) {
            ipDetections.push({ ...meta, cam: camerasByIp.get(meta.ip) });
          }
          candidates.push({ item, meta });
        }

        const plannedMoves = [];
        for (const { item, meta } of candidates) {
          let targetCam = null;

          if (meta.kind === 'ip_detection') {
            targetCam = camerasByIp.get(meta.ip) || null;
          } else if (meta.kind === 'anpr_plate') {
            let bestDiff = 60_000; // Match full-frame camera detection within ±60s
            for (const det of ipDetections) {
              const diff = Math.abs(det.clockMs - meta.clockMs);
              if (diff <= bestDiff) {
                bestDiff = diff;
                targetCam = det.cam;
              }
            }
            if (!targetCam) {
              targetCam = fallbackAnprCam;
            }
          }

          if (targetCam) {
            plannedMoves.push({
              srcPath: `/${item.name}`,
              dstPath: `${targetCam.folderPath}/${item.name}`,
              targetDir: targetCam.folderPath,
              modMs: meta.modMs || 0,
            });
          }
        }

        if (plannedMoves.length === 0) return { moved: 0, remaining: 0 };

        // Move newest files first so latest captures arrive in the target folder immediately
        plannedMoves.sort((a, b) => b.modMs - a.modMs);
        const batch = plannedMoves.slice(0, maxFiles);

        const uniqueDirs = [...new Set(batch.map((m) => m.targetDir))];
        for (const dir of uniqueDirs) {
          await this.ensureDirectory(dir, this.config.cameraUser);
        }

        let moved = 0;
        const concurrency = 6;
        for (let i = 0; i < batch.length; i += concurrency) {
          const slice = batch.slice(i, i + concurrency);
          const outcomes = await Promise.allSettled(
            slice.map((m) => this.moveFile(m.srcPath, m.dstPath, this.config.cameraUser))
          );
          for (const out of outcomes) {
            if (out.status === 'fulfilled') moved++;
          }
        }

        if (moved > 0) {
          console.log(`📂 FTP Auto-Router: Moved ${moved}/${plannedMoves.length} camera file(s) into Plant/Gate/Camera folders`);
        }

        return { moved, remaining: Math.max(0, plannedMoves.length - batch.length) };
      } catch (err) {
        console.warn('FTP Auto-Router warning:', err.message);
        return { moved: 0, remaining: 0 };
      } finally {
        this._routingPromise = null;
      }
    })();

    return this._routingPromise;
  }

  // Read and parse ANPR plate & uploaded images strictly from scoped 2-level plant gate FTP folders (/<Plant>/<Gate>/)
  async getFtpAnprPlates(optionsOrLimit = 25) {
    const opts =
      typeof optionsOrLimit === 'object' && optionsOrLimit !== null
        ? optionsOrLimit
        : { limit: optionsOrLimit };

    const limit = Number(opts.limit) || 25;
    const plantId = opts.plantId || null;
    const cameraId = opts.cameraId || null;
    const gateType = opts.gateType || null;

    try {
      // Ensure any incoming camera files pushed to '/' are routed into their /<Plant>/<Gate> folder first
      await this.routeIncomingCameraFiles({ maxFiles: 60 });

      const targetFolders = await this.getScopedScanFolders({ plantId, cameraId, gateType });
      if (targetFolders.length === 0) {
        return [];
      }

      const token = await this.getUserToken(this.config.cameraUser, this.config.cameraPass);
      const plates = [];

      await Promise.all(
        targetFolders.map(async (target) => {
          try {
            const dirsRes = await fetch(
              `${this.config.apiUrl}/user/dirs?path=${encodeURIComponent(target.folderPath)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!dirsRes.ok) return;

            const list = await dirsRes.json();
            if (!Array.isArray(list)) return;

            for (const item of list) {
              const isDir = item.type === 'dir' || (typeof item.mode === 'number' && (item.mode & 0x80000000) !== 0);
              if (isDir || !item.name) continue;

              const meta = this.parseCameraUploadMeta(item.name, item.last_modified);
              if (!meta) continue;

              const remotePath = `${target.folderPath}/${item.name}`.replace(/\/+/g, '/');
              plates.push({
                plate: meta.plate || '',
                kind: meta.kind,
                isAnprPlate: meta.kind === 'anpr_plate',
                filename: item.name,
                remotePath,
                folderPath: target.folderPath,
                plantId: target.plantId,
                plantName: target.plantName,
                cameraId: target.cameraId,
                cameraName: target.cameraName,
                location: target.location,
                ftpUrl: `ftp://${this.config.host}:${this.config.ftpPort}${remotePath}`,
                sizeBytes: item.size,
                channel: meta.channel || 'CH1',
                timestamp: meta.timestampIso || item.last_modified,
                lastModified: item.last_modified,
                imageUrl: `/api/ftp/file?user=${this.config.cameraUser}&path=${encodeURIComponent(remotePath)}`,
              });
            }
          } catch (camErr) {
            console.warn(`FTP Service: Could not list folder ${target.folderPath}:`, camErr.message);
          }
        })
      );

      // Sort newest first; when an ANPR plate crop and a companion raw detection share the same ~15s capture window, prioritize the parsed ANPR plate
      plates.sort((a, b) => {
        const timeA = new Date(a.lastModified).getTime() || 0;
        const timeB = new Date(b.lastModified).getTime() || 0;
        if (Math.abs(timeB - timeA) <= 15000 && a.isAnprPlate !== b.isAnprPlate) {
          return a.isAnprPlate ? -1 : 1;
        }
        return timeB - timeA;
      });
      return plates.slice(0, limit);
    } catch (err) {
      console.error('FTP Service: Error fetching ANPR plates from FTP:', err.message);
      return [];
    }
  }

  // Get single latest ANPR plate detected from scoped camera FTP folders
  async getLatestFtpAnprPlate(options = {}) {
    const plates = await this.getFtpAnprPlates({ ...options, limit: 1 });
    return plates.length > 0 ? plates[0] : null;
  }

  // Retrieve file buffer from remote SFTPGo server
  async getFile(remotePath, requestedUser = null) {
    let targetUser = requestedUser;
    const defaultRemoteFolder = (this.config.remoteFolder || '/weighbridge').replace(/\/+$/, '');
    if (!targetUser) {
      if (/un\w*?_/i.test(remotePath) || !remotePath.startsWith(defaultRemoteFolder)) {
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
