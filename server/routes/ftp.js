import express from 'express';
import multer from 'multer';
import ftpService from '../ftp-service.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// GET /api/ftp/status
router.get('/status', async (req, res) => {
  try {
    const status = await ftpService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ftp/config
// Returns current FTP / SFTP configuration
router.get('/config', async (req, res) => {
  try {
    const config = ftpService.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/ftp/config
// Updates and persists FTP / SFTP configuration
router.put('/config', async (req, res) => {
  try {
    const updated = await ftpService.updateConfig(req.body);
    res.json({ success: true, message: 'FTP configuration updated successfully', config: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ftp/test
// Tests connection and authentication with remote SFTPGo / FTP server
router.post('/test', async (req, res) => {
  try {
    const result = await ftpService.testConnection(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ftp/recent
router.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const files = await ftpService.getRecentUploads(limit);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ftp/plant-folders/:plantId
// Lists (and ensures) FTP gate folders for a plant
router.get('/plant-folders/:plantId', async (req, res) => {
  try {
    const result = await ftpService.getPlantFolders(req.params.plantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ftp/sync-plant-folders
// Ensures FTP folders (Plant Name -> Entry Gate / Exit Gate) exist for all plants
router.post('/sync-plant-folders', async (req, res) => {
  try {
    const synced = await ftpService.syncAllPlantFolders();
    res.json({ success: true, count: synced.length, plants: synced });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ftp/latest-plate
// Automatically reads the latest vehicle name plate from scoped camera FTP folders
router.get('/latest-plate', async (req, res) => {
  try {
    const { plantId, cameraId, gateType } = req.query;
    const latest = await ftpService.getLatestFtpAnprPlate({ plantId, cameraId, gateType });
    if (!latest) {
      return res.json({ success: false, message: 'No ANPR plate files found in scoped FTP folders yet' });
    }
    res.json({
      success: true,
      ...latest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ftp/plates
// Lists recent vehicle name plates from scoped camera FTP folders
router.get('/plates', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const { plantId, cameraId, gateType } = req.query;
    const plates = await ftpService.getFtpAnprPlates({ limit, plantId, cameraId, gateType });
    res.json(plates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ftp/file?path=/...&user=sarath
router.get('/file', async (req, res) => {
  try {
    const remotePath = req.query.path;
    const requestedUser = req.query.user || null;
    if (!remotePath) {
      return res.status(400).json({ error: 'path query parameter is required' });
    }

    const { buffer, contentType } = await ftpService.getFile(remotePath, requestedUser);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ftp/upload
// Handles both multipart form and JSON base64 data URLs
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    let buffer = null;
    let filename = req.body.filename;
    const vehicleRegNo = req.body.vehicleRegNo || 'UNKNOWN';
    const angle = req.body.angle || 'overview';
    const weight = req.body.weight ? Number(req.body.weight) : null;
    const sessionId = req.body.sessionId || null;
    const cameraId = req.body.cameraId || req.body.deviceId || null;
    const plantId = req.body.plantId || null;
    const cameraName = req.body.cameraName || 'Weighbridge Camera';
    const cameraIp = req.body.cameraIp || req.body.ip || null;
    const gateType = req.body.gateType || null;
    const targetUser = req.body.targetUser || req.body.user || 'sarath';

    if (req.file) {
      buffer = req.file.buffer;
      filename = filename || req.file.originalname;
    } else if (req.body.image) {
      const dataUri = String(req.body.image).trim();
      if (dataUri.startsWith('data:image')) {
        const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else if (dataUri.includes('/api/ftp/file')) {
        const parsed = dataUri.startsWith('http')
          ? new URL(dataUri)
          : new URL(`http://localhost:3001${dataUri.startsWith('/') ? '' : '/'}${dataUri}`);
        const filePath = parsed.searchParams.get('path');
        const reqUser = parsed.searchParams.get('user') || targetUser;
        const fileObj = await ftpService.getFile(filePath, reqUser);
        buffer = fileObj.buffer;
      } else if (dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
        const fetchRes = await fetch(dataUri);
        const arrayBuf = await fetchRes.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } else {
        // Base64 without data URI scheme
        buffer = Buffer.from(dataUri, 'base64');
      }
    } else if (req.body.imageBase64) {
      buffer = Buffer.from(req.body.imageBase64, 'base64');
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No image data provided (provide file, image base64, or image data URL)' });
    }

    const result = await ftpService.uploadEvidenceImage({
      buffer,
      filename,
      vehicleRegNo,
      angle,
      weight,
      sessionId,
      cameraId,
      plantId,
      cameraName,
      cameraIp,
      gateType,
      targetUser
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('FTP upload route error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
