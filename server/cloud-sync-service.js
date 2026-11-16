import { pool } from './db.js';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const logsDir = path.join(projectRoot, 'logs');
const logFile = path.join(logsDir, 'cloud-sync.log');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Helper to sanitize incoming date/JSON values for MySQL insertion
function sanitizeValueForMysql(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') {
    if (val instanceof Date) {
      return val.toISOString().slice(0, 19).replace('T', ' ');
    }
    return JSON.stringify(val);
  }
  if (typeof val === 'string') {
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

/**
 * CloudSyncService
 * ============================================================================
 * Automatically synchronizes data from local plant MySQL to the central server MySQL.
 * Runs on a 5-minute schedule (300,000ms).
 *
 * Supports two redundant synchronization channels:
 *  1. HTTP Sync (Primary): Posts delta changes to ${CLOUD_SERVER_URL}/api/sync/push
 *     - Authenticated with x-sync-secret.
 *     - Works behind NAT, firewalls, and proxy layers.
 *  2. Direct Remote MySQL Pool (Secondary / Fallback):
 *     - Directly upserts into remote MySQL (213.210.37.249:3306) if REMOTE_DB_HOST is set.
 *
 * Features:
 *  - Topological parent-first table processing (foreign keys are respected).
 *  - Incremental watermarks (updated_at > last_synced_at).
 *  - Accurate counts of inserted vs updated records.
 *  - Bounded size-rotated log file in logs/cloud-sync.log (max 10MB).
 *  - Offline resilient: pauses when network drops, catches up backlog on reconnect.
 * ============================================================================
 */
export class CloudSyncService {
  constructor() {
    this.cloudServerUrl = (process.env.CLOUD_SERVER_URL || 'http://213.210.37.249:3001').trim().replace(/\/+$/, '');
    this.cloudSyncSecret = process.env.CLOUD_SYNC_SECRET || 'Aparna_RMC_Cloud_Sync_Secret_2026!';
    this.plantId = process.env.PLANT_ID || 'PL01';
    this.intervalMs = Math.max(5000, Number(process.env.CLOUD_SYNC_INTERVAL_MS) || 300000); // Default 5 minutes
    this.syncBatchSize = Number(process.env.CLOUD_SYNC_BATCH_SIZE) || 100;
    this.isEnabled = process.env.CLOUD_SYNC_ENABLED === 'true' || Boolean(this.cloudServerUrl) || Boolean(process.env.REMOTE_DB_HOST);

    this.remoteDbPool = null;
    this.isRunning = false;
    this.timer = null;
    this.isSyncing = false;

    this.lastSyncReport = {
      lastAttemptAt: null,
      lastSuccessAt: null,
      status: 'idle',
      totalInserted: 0,
      totalUpdated: 0,
      totalUnchanged: 0,
      recentErrors: [],
    };

    // Topological order: Master and parent tables MUST be synchronized before child tables!
    this.targetTables = [
      // Stage 1: Core master settings & plants
      'plants',
      'roles',
      'company_settings',
      'loading_bays',
      'device_ftp_config',
      'device_network_config',
      'device_rtsp_config',
      'camera_devices',

      // Stage 2: Users & Profiles
      'users',
      'vehicles',
      'drivers',
      'vehicle_documents',
      'vehicle_maintenance',
      'parts_inventory',
      'inventory_items',

      // Stage 3: SAP Documents & Master Config
      'sap_connection_config',
      'sap_purchase_orders',
      'sap_outbound_deliveries',

      // Stage 4: Operations & Sessions
      'weighbridge_sessions',
      'weigh_slips',
      'loading_sessions',
      'dispatches',
      'trips',
      'driver_trip_assignments',
      'trip_events',
      'exit_verifications',

      // Stage 5: Telemetry, Logs & Evidence
      'anpr_events',
      'anpr_evidence',
      'incidents',
      'fuel_records',
      'maintenance_tasks',
      'stock_movements',
      'reorder_alerts',
      'invoices',
      'payments',
      'generated_reports',
      'audit_logs',

      // Stage 6: SAP Sync queues
      'sap_weighbridge_sync',
      'sap_exit_sync',
      'sap_billing_sync',
      'sap_sync_queue'
    ];
  }

  // Bounded size-rotated file logger
  log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}`;
    console.log(line);

    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Rotate if log exceeds 10MB
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > 10 * 1024 * 1024) {
          const oldFile = `${logFile}.1`;
          try { if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile); } catch {}
          try { fs.renameSync(logFile, oldFile); } catch {}
        }
      }

      fs.appendFileSync(logFile, line + '\n', 'utf8');
    } catch {}
  }

  // Initialize tracking tables and background loop
  async initialize() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS edge_sync_tracking (
          table_name VARCHAR(64) PRIMARY KEY,
          last_synced_at DATETIME NOT NULL DEFAULT '2000-01-01 00:00:00',
          total_synced INT NOT NULL DEFAULT 0,
          pending_count INT NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'idle',
          last_error TEXT,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // Initialize direct MySQL fallback pool if host is configured
      const remoteHost = process.env.REMOTE_DB_HOST || (this.cloudServerUrl.includes('213.210.37.249') ? '213.210.37.249' : null);
      if (remoteHost && remoteHost !== 'localhost' && remoteHost !== '127.0.0.1') {
        try {
          this.remoteDbPool = mysql.createPool({
            host: remoteHost,
            port: Number(process.env.REMOTE_DB_PORT) || 3306,
            user: process.env.REMOTE_DB_USER || 'rmc_user',
            password: process.env.REMOTE_DB_PASSWORD || 'SecureRmcPassword2026!',
            database: process.env.REMOTE_DB_NAME || 'Aparna_RMC_Db',
            waitForConnections: true,
            connectionLimit: 3,
            queueLimit: 0,
          });
          this.log(`📡 Direct Remote MySQL pool initialized -> ${remoteHost}:3306 (Aparna_RMC_Db)`);
        } catch (poolErr) {
          this.log(`Direct remote DB pool init note: ${poolErr.message}`);
        }
      }

      if (process.env.IS_CLOUD_SERVER === 'true' || process.env.DB_HOST === 'db') {
        this.log('☁️ Central Cloud Server mode active — sync receiver endpoint ready on /api/sync/push');
        return;
      }

      if (!this.isEnabled) {
        this.log('ℹ️ CloudSync disabled. Set CLOUD_SYNC_ENABLED=true in server/.env to enable.');
        return;
      }

      this.log(`🔄 CloudSync engine initialized [Target: ${this.cloudServerUrl || remoteHost}, Interval: ${Math.round(this.intervalMs / 1000)}s]`);
      this.startSyncLoop();
    } catch (err) {
      this.log(`❌ CloudSync initialization error: ${err.message}`);
    }
  }

  startSyncLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run first synchronization 3 seconds after startup
    setTimeout(() => {
      this.runSyncCycle().catch((e) => this.log(`Initial sync cycle note: ${e.message}`));
    }, 3000);

    // Schedule regular 5-minute recurring timer
    this.timer = setInterval(() => {
      this.runSyncCycle().catch((e) => this.log(`Interval sync cycle note: ${e.message}`));
    }, this.intervalMs);
  }

  stopSyncLoop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Get active existing tables in local database
  async getExistingLocalTables() {
    const [rows] = await pool.query('SHOW TABLES');
    const existing = new Set(rows.map((r) => Object.values(r)[0].toLowerCase()));
    return this.targetTables.filter((t) => existing.has(t.toLowerCase()));
  }

  // Run a complete synchronization cycle across all tables in topological order
  async runSyncCycle() {
    if (this.isSyncing) {
      this.log('⏳ Sync cycle already in progress. Skipping overlapping run.');
      return { skipped: true, reason: 'in_progress' };
    }

    this.isSyncing = true;
    const cycleStartTime = new Date();
    this.lastSyncReport.lastAttemptAt = cycleStartTime.toISOString();

    const report = {
      startTime: cycleStartTime.toISOString(),
      endTime: null,
      status: 'pending',
      channel: 'none',
      tablesProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalUnchanged: 0,
      errors: [],
      tableDetails: {}
    };

    try {
      const activeTables = await this.getExistingLocalTables();
      const batchPayload = {};

      for (const table of activeTables) {
        try {
          // Read watermark from tracking table
          const [trackRows] = await pool.query(
            'SELECT last_synced_at FROM edge_sync_tracking WHERE table_name = ?',
            [table]
          );

          const lastSyncedAt = trackRows.length > 0 && trackRows[0].last_synced_at
            ? new Date(trackRows[0].last_synced_at)
            : new Date('2000-01-01 00:00:00');

          // Query table columns to select optimal change detection watermark
          const [colRows] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table]
          );
          const cols = new Set(colRows.map((c) => c.COLUMN_NAME.toLowerCase()));

          let query = '';
          let orderCol = '';

          if (cols.has('updated_at')) {
            orderCol = 'updated_at';
            query = `SELECT * FROM \`${table}\` WHERE updated_at > ? ORDER BY updated_at ASC LIMIT ?`;
          } else if (cols.has('created_at')) {
            orderCol = 'created_at';
            query = `SELECT * FROM \`${table}\` WHERE created_at > ? ORDER BY created_at ASC LIMIT ?`;
          } else if (cols.has('timestamp')) {
            orderCol = 'timestamp';
            query = `SELECT * FROM \`${table}\` WHERE timestamp > ? ORDER BY timestamp ASC LIMIT ?`;
          } else {
            // Static lookup tables without timestamps: only re-sync if not synced yet
            if (trackRows.length === 0 || lastSyncedAt.getFullYear() <= 2000) {
              query = `SELECT * FROM \`${table}\` LIMIT ?`;
            } else {
              continue;
            }
          }

          const params = orderCol ? [lastSyncedAt, this.syncBatchSize] : [this.syncBatchSize];
          const [rows] = await pool.query(query, params);

          if (rows && rows.length > 0) {
            batchPayload[table] = {
              rows,
              orderCol,
              maxTimestamp: orderCol
                ? rows.reduce((max, r) => (new Date(r[orderCol]) > new Date(max) ? r[orderCol] : max), rows[0][orderCol])
                : new Date(),
            };
          }
        } catch (tblErr) {
          report.errors.push(`Table ${table} read error: ${tblErr.message}`);
        }
      }

      const tableNames = Object.keys(batchPayload);
      if (tableNames.length > 0) {
        const payloadData = {};
        for (const t of tableNames) {
          payloadData[t] = batchPayload[t].rows;
        }

        let pushResult = null;

        // Channel 1: HTTP API Push to Central Server
        if (this.cloudServerUrl) {
          pushResult = await this.pushHttpSync(payloadData);
          if (pushResult && pushResult.success) {
            report.channel = 'http_api';
          }
        }

        // Channel 2: Direct Remote MySQL Pool fallback
        if ((!pushResult || !pushResult.success) && this.remoteDbPool) {
          this.log('⚠️ HTTP push unavailable. Falling back to direct Remote MySQL pool...');
          pushResult = await this.pushDirectDbSync(payloadData);
          if (pushResult && pushResult.success) {
            report.channel = 'direct_mysql';
          }
        }

        if (pushResult && pushResult.success) {
          // Advance the local watermark for successfully pushed tables
          for (const table of tableNames) {
            const { rows, maxTimestamp } = batchPayload[table];
            const stats = pushResult.summary?.tableStats?.[table] || {
              inserted: rows.length,
              updated: 0,
              unchanged: 0
            };

            await pool.query(
              `INSERT INTO edge_sync_tracking (table_name, last_synced_at, total_synced, status, last_error)
               VALUES (?, ?, ?, 'synced', NULL)
               ON DUPLICATE KEY UPDATE
                 last_synced_at = VALUES(last_synced_at),
                 total_synced = total_synced + VALUES(total_synced),
                 status = 'synced',
                 last_error = NULL,
                 updated_at = NOW()`,
              [table, maxTimestamp, rows.length]
            );

            report.tableDetails[table] = stats;
            report.totalInserted += stats.inserted || 0;
            report.totalUpdated += stats.updated || 0;
            report.totalUnchanged += stats.unchanged || 0;
          }

          report.tablesProcessed = tableNames.length;
          report.status = 'success';
          this.lastSyncReport.lastSuccessAt = new Date().toISOString();
          this.lastSyncReport.status = 'healthy';
          this.lastSyncReport.totalInserted += report.totalInserted;
          this.lastSyncReport.totalUpdated += report.totalUpdated;
          this.lastSyncReport.totalUnchanged += report.totalUnchanged;

          this.log(
            `✅ Sync Success [Channel: ${report.channel}]: ${report.tablesProcessed} tables | ` +
            `Inserted: ${report.totalInserted} | Updated: ${report.totalUpdated} | Unchanged: ${report.totalUnchanged} ` +
            `(${tableNames.join(', ')})`
          );
        } else {
          report.status = 'offline_queued';
          this.lastSyncReport.status = 'offline_queued';
          this.log(`⚠️ Central server unreachable. ${tableNames.length} tables queued locally. Will retry in 5 minutes.`);
        }
      } else {
        report.status = 'clean_no_changes';
        this.lastSyncReport.status = 'idle';
        this.log('✅ Sync check complete: All 41 tables clean. Local database is fully in sync with server.');
      }
    } catch (cycleErr) {
      report.status = 'error';
      report.errors.push(cycleErr.message);
      this.lastSyncReport.status = 'error';
      this.lastSyncReport.recentErrors = [cycleErr.message, ...this.lastSyncReport.recentErrors.slice(0, 4)];
      this.log(`❌ Sync cycle error: ${cycleErr.message}`);
    } finally {
      report.endTime = new Date().toISOString();
      this.isSyncing = false;
    }

    return report;
  }

  // Push payload via HTTP REST API to central server endpoint: POST /api/sync/push
  async pushHttpSync(payloadData) {
    try {
      const endpoint = `${this.cloudServerUrl}/api/sync/push`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-secret': this.cloudSyncSecret,
          'x-plant-id': this.plantId,
        },
        body: JSON.stringify({
          plantId: this.plantId,
          timestamp: new Date().toISOString(),
          tables: payloadData,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const json = await res.json().catch(() => ({ success: true }));
      return json;
    } catch (err) {
      this.log(`HTTP Sync push note (${err.message})`);
      return { success: false, error: err.message };
    }
  }

  // Push directly to remote MySQL pool using ON DUPLICATE KEY UPDATE with transactional safety
  async pushDirectDbSync(payloadData) {
    if (!this.remoteDbPool) return { success: false, error: 'Remote DB pool not configured' };

    let conn = null;
    const summary = {
      tableStats: {},
      insertedRecords: 0,
      updatedRecords: 0,
      unchangedRecords: 0
    };

    try {
      conn = await this.remoteDbPool.getConnection();
      await conn.beginTransaction();
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');

      for (const [table, rows] of Object.entries(payloadData)) {
        if (!rows || rows.length === 0) continue;

        // Query remote table columns to ensure compatibility
        const [colRows] = await conn.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [table]
        );
        const validCols = new Set(colRows.map((c) => c.COLUMN_NAME));
        const sampleCols = Object.keys(rows[0]).filter((c) => validCols.has(c));
        if (sampleCols.length === 0) continue;

        const colList = sampleCols.map((c) => `\`${c}\``).join(', ');
        const updateClause = sampleCols
          .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
          .join(', ');

        let ins = 0;
        let upd = 0;
        let unc = 0;

        for (const row of rows) {
          const values = sampleCols.map((c) => sanitizeValueForMysql(row[c]));
          const placeholders = sampleCols.map(() => '?').join(', ');
          const sql = `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
          const [result] = await conn.query(sql, values);

          if (result.affectedRows === 1) ins++;
          else if (result.affectedRows === 2) upd++;
          else unc++;
        }

        summary.tableStats[table] = { inserted: ins, updated: upd, unchanged: unc };
        summary.insertedRecords += ins;
        summary.updatedRecords += upd;
        summary.unchangedRecords += unc;
      }

      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      await conn.commit();
      return { success: true, summary };
    } catch (err) {
      if (conn) {
        try {
          await conn.query('SET FOREIGN_KEY_CHECKS = 1');
          await conn.rollback();
        } catch {}
      }
      this.log(`Direct DB sync error: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      if (conn) conn.release();
    }
  }

  // Diagnostic status report
  async getStatus() {
    const [tracking] = await pool.query('SELECT * FROM edge_sync_tracking ORDER BY table_name ASC').catch(() => [[]]);
    return {
      enabled: this.isEnabled,
      mode: this.cloudServerUrl ? 'http_api' : (this.remoteDbPool ? 'direct_db' : 'none'),
      target: this.cloudServerUrl || 'direct_mysql',
      plantId: this.plantId,
      intervalMs: this.intervalMs,
      intervalMinutes: Math.round(this.intervalMs / 60000),
      isCurrentlySyncing: this.isSyncing,
      ...this.lastSyncReport,
      tables: tracking,
    };
  }
}

export const cloudSyncService = new CloudSyncService();
export default cloudSyncService;
