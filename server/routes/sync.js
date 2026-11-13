import express from 'express';
import { pool } from '../db.js';
import cloudSyncService from '../cloud-sync-service.js';

const router = express.Router();
const EXPECTED_SYNC_SECRET = process.env.CLOUD_SYNC_SECRET || 'Aparna_RMC_Cloud_Sync_Secret_2026!';

// Helper to sanitize incoming date/JSON values for MySQL insertion
function sanitizeValueForMysql(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') {
    if (val instanceof Date) {
      return val.toISOString().slice(0, 19).replace('T', ' ');
    }
    // Arrays or objects serialize to JSON string
    return JSON.stringify(val);
  }
  if (typeof val === 'string') {
    // Check if ISO 8601 datetime: e.g. 2026-11-05T09:44:09.000Z or 2026-11-05T09:44:09Z
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/i.test(val)) {
      return val.replace('T', ' ').replace(/\..*$/, '').replace(/Z$/, '');
    }
    return val;
  }
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
  return val;
}

// ============================================================================
// POST /api/sync/push
// Central Server Receiver: Upserts incoming data batches sent from local PCs
// ============================================================================
router.post('/push', async (req, res) => {
  const incomingSecret = req.headers['x-sync-secret'] || req.body?.syncSecret;
  if (incomingSecret !== EXPECTED_SYNC_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid x-sync-secret' });
  }

  const { plantId, tables } = req.body;
  if (!tables || typeof tables !== 'object') {
    return res.status(400).json({ success: false, error: 'Payload must contain a tables map' });
  }

  const connection = await pool.getConnection();
  const syncedCounts = {};

  try {
    // Get list of existing tables in this database
    const [existingTableRows] = await connection.query('SHOW TABLES');
    const existingTableSet = new Set(existingTableRows.map((r) => Object.values(r)[0].toLowerCase()));

    for (const [tableName, rows] of Object.entries(tables)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      if (!existingTableSet.has(tableName.toLowerCase())) {
        console.warn(`[Sync Receiver] Skipped table '${tableName}': does not exist on this server`);
        continue;
      }

      // Query valid columns for this table to prevent invalid column injection
      const [colRows] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tableName]
      );
      const validColSet = new Set(colRows.map((c) => c.COLUMN_NAME));

      // Filter sample row to only existing table columns
      const firstRow = rows[0];
      const validCols = Object.keys(firstRow).filter((c) => validColSet.has(c));
      if (validCols.length === 0) continue;

      const colListSql = validCols.map((c) => `\`${c}\``).join(', ');
      const updateListSql = validCols
        .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
        .join(', ');

      let upsertedThisTable = 0;

      // Process in batches of 50 to avoid packet overflow
      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        for (const row of chunk) {
          const values = validCols.map((col) => sanitizeValueForMysql(row[col]));
          const placeholders = validCols.map(() => '?').join(', ');
          const sql = `INSERT INTO \`${tableName}\` (${colListSql}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateListSql}`;
          await connection.query(sql, values);
          upsertedThisTable++;
        }
      }

      syncedCounts[tableName] = upsertedThisTable;
    }

    console.log(`📥 [Sync Receiver] Received from plant [${plantId || 'remote'}]:`, syncedCounts);

    res.json({
      success: true,
      plantId,
      syncedTables: syncedCounts,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync Receiver] Upsert error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================================
// GET /api/sync/status
// Diagnostic endpoint: reports local sync worker status & tracking statistics
// ============================================================================
router.get('/status', async (req, res) => {
  try {
    const status = await cloudSyncService.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// POST /api/sync/trigger
// Manually triggers an immediate synchronization cycle
// ============================================================================
router.post('/trigger', async (req, res) => {
  try {
    cloudSyncService.runSyncCycle().catch((e) => console.warn('Manual sync cycle note:', e.message));
    res.json({ success: true, message: 'Sync cycle triggered' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// GET /api/sync/pull
// Allows local plants to pull central master configuration (plants, roles, etc.)
// ============================================================================
router.get('/pull', async (req, res) => {
  try {
    const tablesParam = req.query.tables || 'plants,roles,company_settings';
    const requested = tablesParam.split(',').map((t) => t.trim());
    const allowed = ['plants', 'roles', 'users', 'company_settings', 'device_ftp_config'];

    const result = {};
    for (const t of requested) {
      if (allowed.includes(t)) {
        const [rows] = await pool.query(`SELECT * FROM \`${t}\``).catch(() => [[]]);
        result[t] = rows;
      }
    }
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
