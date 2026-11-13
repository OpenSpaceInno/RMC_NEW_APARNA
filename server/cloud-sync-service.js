import { pool } from './db.js';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

/**
 * CloudSyncService
 * ============================================================================
 * Automatically synchronizes data from the local plant MySQL database to the
 * central cloud server database.
 *
 * Supports two automatic synchronization channels:
 *  1. HTTP Sync (Recommended): Posts delta changes to ${CLOUD_SERVER_URL}/api/sync/push
 *     - Works behind NAT, corporate firewalls, mobile 4G, and Coolify/Nginx proxies.
 *     - 100% offline resilient: queues changes locally when internet drops,
 *       auto-syncs backlog immediately upon reconnection.
 *  2. Direct Remote MySQL Pool (Optional): Directly upserts into remote MySQL
 *     if REMOTE_DB_HOST is configured.
 * ============================================================================
 */

export class CloudSyncService {
  constructor() {
    this.cloudServerUrl = (process.env.CLOUD_SERVER_URL || '').trim().replace(/\/+$/, '');
    this.cloudSyncSecret = process.env.CLOUD_SYNC_SECRET || 'Aparna_RMC_Cloud_Sync_Secret_2026!';
    this.plantId = process.env.PLANT_ID || 'PL01';
    this.intervalMs = Math.max(3000, Number(process.env.CLOUD_SYNC_INTERVAL_MS) || 5000);
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
      totalRecordsSynced: 0,
      recentErrors: [],
    };

    // Core business tables to synchronize
    this.targetTables = [
      'plants',
      'camera_devices',
      'users',
      'roles',
      'vehicles',
      'drivers',
      'driver_trip_assignments',
      'weighbridge_sessions',
      'weigh_slips',
      'loading_bays',
      'loading_sessions',
      'dispatches',
      'trips',
      'trip_events',
      'exit_verifications',
      'incidents',
      'fuel_records',
      'maintenance_tasks',
      'parts_inventory',
      'invoices',
      'payments',
      'inventory_items',
      'stock_movements',
      'reorder_alerts',
      'audit_logs',
      'anpr_events',
      'anpr_evidence',
      'company_settings',
      'device_ftp_config',
      'device_network_config',
      'device_rtsp_config',
      'sap_connection_config',
      'sap_purchase_orders',
      'sap_outbound_deliveries',
      'sap_weighbridge_sync',
      'sap_exit_sync',
      'sap_billing_sync',
      'sap_sync_queue',
    ];
  }

  // Initialize tracking tables and start background sync daemon
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

      // Initialize remote MySQL pool if REMOTE_DB_HOST is provided
      if (process.env.REMOTE_DB_HOST) {
        try {
          this.remoteDbPool = mysql.createPool({
            host: process.env.REMOTE_DB_HOST,
            port: Number(process.env.REMOTE_DB_PORT) || 3306,
            user: process.env.REMOTE_DB_USER || 'root',
            password: process.env.REMOTE_DB_PASSWORD || '',
            database: process.env.REMOTE_DB_NAME || process.env.DB_NAME || 'Aparna_RMC_Db',
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
          });
          console.log(`📡 CloudSync: Direct Remote MySQL channel configured -> ${process.env.REMOTE_DB_HOST}`);
        } catch (remoteErr) {
          console.warn('CloudSync: Could not initialize direct remote DB pool:', remoteErr.message);
        }
      }

      if (!this.isEnabled) {
        console.log('ℹ️ CloudSync: Set CLOUD_SERVER_URL or CLOUD_SYNC_ENABLED=true in .env to enable automatic cloud sync.');
        return;
      }

      console.log(`🔄 CloudSync: Auto-sync engine started [Target: ${this.cloudServerUrl || process.env.REMOTE_DB_HOST || 'local'}, Interval: ${this.intervalMs}ms]`);
      this.startSyncLoop();
    } catch (err) {
      console.error('CloudSync initialization error:', err.message);
    }
  }

  startSyncLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run first sync shortly after startup
    setTimeout(() => this.runSyncCycle(), 2000);

    this.timer = setInterval(() => {
      this.runSyncCycle();
    }, this.intervalMs);
  }

  stopSyncLoop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Inspect existing local tables to prevent errors on missing optional tables
  async getExistingLocalTables() {
    const [rows] = await pool.query('SHOW TABLES');
    const existing = new Set(rows.map((r) => Object.values(r)[0].toLowerCase()));
    return this.targetTables.filter((t) => existing.has(t.toLowerCase()));
  }

  // Run a single synchronization cycle across all tables
  async runSyncCycle() {
    if (this.isSyncing) return;
    if (!this.isEnabled) return;

    this.isSyncing = true;
    this.lastSyncReport.lastAttemptAt = new Date().toISOString();

    try {
      const activeTables = await this.getExistingLocalTables();
      let cycleSyncedTotal = 0;
      const batchPayload = {};

      for (const table of activeTables) {
        try {
          // Read last sync timestamp
          const [trackRows] = await pool.query(
            'SELECT last_synced_at FROM edge_sync_tracking WHERE table_name = ?',
            [table]
          );

          const lastSyncedAt = trackRows.length > 0 && trackRows[0].last_synced_at
            ? new Date(trackRows[0].last_synced_at)
            : new Date('2000-01-01 00:00:00');

          // Check if table has updated_at, created_at, or timestamp columns
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
            // For small static configuration tables (e.g. company_settings), sync full table periodically
            query = `SELECT * FROM \`${table}\` LIMIT ?`;
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
        } catch (tableErr) {
          console.warn(`CloudSync: Notice checking table ${table}:`, tableErr.message);
        }
      }

      // If we have records to sync, send them to the cloud
      const tableNames = Object.keys(batchPayload);
      if (tableNames.length > 0) {
        const payloadData = {};
        for (const t of tableNames) {
          payloadData[t] = batchPayload[t].rows;
        }

        let pushSuccess = false;

        // Channel 1: HTTP Sync to Remote Server API
        if (this.cloudServerUrl) {
          pushSuccess = await this.pushHttpSync(payloadData);
        }

        // Channel 2: Direct Remote MySQL Sync (fallback or primary)
        if (!pushSuccess && this.remoteDbPool) {
          pushSuccess = await this.pushDirectDbSync(payloadData);
        }

        if (pushSuccess) {
          // Advance the local sync watermark for successfully pushed tables
          for (const table of tableNames) {
            const { rows, maxTimestamp } = batchPayload[table];
            cycleSyncedTotal += rows.length;

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
          }

          this.lastSyncReport.lastSuccessAt = new Date().toISOString();
          this.lastSyncReport.status = 'healthy';
          this.lastSyncReport.totalRecordsSynced += cycleSyncedTotal;
          console.log(`☁️ CloudSync: Successfully synchronized ${cycleSyncedTotal} records across [${tableNames.join(', ')}] to cloud server`);
        } else {
          this.lastSyncReport.status = 'offline_queued';
        }
      } else {
        this.lastSyncReport.status = 'idle';
      }
    } catch (cycleErr) {
      this.lastSyncReport.status = 'error';
      this.lastSyncReport.recentErrors = [cycleErr.message, ...this.lastSyncReport.recentErrors.slice(0, 4)];
      console.warn('CloudSync cycle note (will retry automatically):', cycleErr.message);
    } finally {
      this.isSyncing = false;
    }
  }

  // Push rows via HTTP REST API to central server endpoint: POST /api/sync/push
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
      return Boolean(json.success);
    } catch (err) {
      console.warn(`CloudSync HTTP channel unavailable (${err.message}). Data remains safe locally and will auto-sync when online.`);
      return false;
    }
  }

  // Push rows directly to remote MySQL pool using ON DUPLICATE KEY UPDATE
  async pushDirectDbSync(payloadData) {
    if (!this.remoteDbPool) return false;

    let conn = null;
    try {
      conn = await this.remoteDbPool.getConnection();
      for (const [table, rows] of Object.entries(payloadData)) {
        if (!rows || rows.length === 0) continue;

        const sample = rows[0];
        const cols = Object.keys(sample);
        const colList = cols.map((c) => `\`${c}\``).join(', ');
        const updateClause = cols
          .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
          .join(', ');

        for (const row of rows) {
          const values = cols.map((c) => {
            const val = row[c];
            if (val === undefined || val === null) return null;
            if (typeof val === 'object') {
              if (val instanceof Date) return val.toISOString().slice(0, 19).replace('T', ' ');
              return JSON.stringify(val);
            }
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/i.test(val)) {
              return val.replace('T', ' ').replace(/\..*$/, '').replace(/Z$/, '');
            }
            if (typeof val === 'boolean') return val ? 1 : 0;
            return val;
          });
          const placeholders = cols.map(() => '?').join(', ');
          const sql = `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
          await conn.query(sql, values);
        }
      }
      return true;
    } catch (err) {
      console.warn('CloudSync direct DB channel error:', err.message);
      return false;
    } finally {
      if (conn) conn.release();
    }
  }

  // Return live sync status report for frontend and monitoring diagnostics
  async getStatus() {
    const [tracking] = await pool.query('SELECT * FROM edge_sync_tracking ORDER BY table_name ASC').catch(() => [[]]);
    return {
      enabled: this.isEnabled,
      mode: this.cloudServerUrl ? 'http_api' : (this.remoteDbPool ? 'direct_db' : 'none'),
      target: this.cloudServerUrl || process.env.REMOTE_DB_HOST || 'not_configured',
      plantId: this.plantId,
      intervalMs: this.intervalMs,
      isCurrentlySyncing: this.isSyncing,
      ...this.lastSyncReport,
      tables: tracking,
    };
  }
}

export const cloudSyncService = new CloudSyncService();
export default cloudSyncService;
