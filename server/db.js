import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to cwd .env as well

// Create connection pool (without database selection initially)
const poolWithoutDb = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create connection pool (with database)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rmc_gate_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
async function testConnection() {
  try {
    const dbName = process.env.DB_NAME || 'rmc_gate_system';
    // First, create database if it doesn't exist
    const connection = await poolWithoutDb.getConnection();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    connection.release();
    
    // Then test connection to the database
    const dbConnection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully!');
    dbConnection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

// Initialize database and tables
async function initializeDatabase() {
  try {
    const dbName = process.env.DB_NAME || 'rmc_gate_system';
    const connection = await poolWithoutDb.getConnection();
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);
    connection.release();
    
    // Now use the database connection pool
    const dbConnection = await pool.getConnection();
    
    // Create camera_devices table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS camera_devices (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        device_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(100) NOT NULL,
        location VARCHAR(50) NOT NULL,
        plant_id VARCHAR(64) NOT NULL DEFAULT 'PL01',
        ip_address VARCHAR(45) NOT NULL,
        mac_address VARCHAR(17),
        status VARCHAR(20) NOT NULL DEFAULT 'offline',
        last_seen DATETIME,
        firmware VARCHAR(50),
        show_on_dashboard BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_device_id (device_id),
        INDEX idx_location (location),
        INDEX idx_plant_id (plant_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try {
      await dbConnection.query(`
        ALTER TABLE camera_devices 
        ADD COLUMN IF NOT EXISTS show_on_dashboard BOOLEAN NOT NULL DEFAULT TRUE
      `);
    } catch (e) {
      // Column may already exist or MariaDB/MySQL version syntax fallback
    }

    try {
      const [plantCols] = await dbConnection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'camera_devices' AND COLUMN_NAME = 'plant_id'`,
        [dbName]
      );
      if (plantCols.length === 0) {
        await dbConnection.query(`
          ALTER TABLE camera_devices
          ADD COLUMN plant_id VARCHAR(64) NOT NULL DEFAULT 'PL01'
        `);
      }
      await dbConnection.query(`
        UPDATE camera_devices SET plant_id = 'PL01' WHERE plant_id IS NULL OR plant_id = ''
      `);

      const [camCount] = await dbConnection.query('SELECT COUNT(*) as cnt FROM camera_devices');
      if (camCount[0]?.cnt === 0) {
        await dbConnection.query(`
          INSERT INTO camera_devices (device_id, name, model, location, plant_id, ip_address, mac_address, status, firmware, show_on_dashboard, last_seen)
          VALUES
            ('cam_gate_1', 'Main Gate - Entry ANPR Camera', 'Hikvision / ANPR Smart Cam', 'entry', 'PL01', '192.168.0.101', 'AA:BB:CC:DD:EE:01', 'online', 'V5.5.800', TRUE, NOW()),
            ('cam_gate_2', 'Main Gate - Overview Camera', 'Hikvision / IP Network Cam', 'exit', 'PL01', '192.168.0.99', 'AA:BB:CC:DD:EE:02', 'online', 'V5.5.800', TRUE, NOW())
        `);
      }
    } catch (e) {
      console.warn('Note checking camera_devices.plant_id column:', e.message);
    }
    
    // Create device_rtsp_config table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS device_rtsp_config (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        device_id VARCHAR(50) UNIQUE NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        url TEXT,
        direct_url TEXT,
        use_direct_url BOOLEAN NOT NULL DEFAULT TRUE,
        port INT NOT NULL DEFAULT 554,
        username VARCHAR(255),
        password VARCHAR(255),
        stream_path VARCHAR(500) NOT NULL DEFAULT '/rtsp/streaming?channel=01&subtype=0',
        transport VARCHAR(10) NOT NULL DEFAULT 'tcp',
        reconnect_interval INT NOT NULL DEFAULT 5,
        buffer_size INT NOT NULL DEFAULT 1024,
        low_latency_mode BOOLEAN NOT NULL DEFAULT TRUE,
        hls_proxy_url TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES camera_devices(device_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Create device_network_config table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS device_network_config (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        device_id VARCHAR(50) UNIQUE NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        subnet_mask VARCHAR(45) NOT NULL DEFAULT '255.255.255.0',
        gateway VARCHAR(45) NOT NULL,
        primary_dns VARCHAR(45) NOT NULL DEFAULT '8.8.8.8',
        secondary_dns VARCHAR(45) DEFAULT '8.8.4.4',
        dhcp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES camera_devices(device_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create anpr_evidence table for FTP evidence images
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS anpr_evidence (
        id VARCHAR(100) PRIMARY KEY,
        event_id VARCHAR(100),
        evidence_type VARCHAR(50) DEFAULT 'IMAGE',
        url TEXT,
        thumbnail_url TEXT,
        angle VARCHAR(50) DEFAULT 'overview',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata JSON,
        file_size INT DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    console.log('✅ Database tables created successfully!');
    dbConnection.release();
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

export { pool, testConnection, initializeDatabase };
