import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export async function initFtpConfigTable(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_ftp_config (
        id VARCHAR(64) PRIMARY KEY,
        host VARCHAR(255) NOT NULL,
        api_url VARCHAR(512) NOT NULL,
        ftp_port INT DEFAULT 2121,
        sftp_port INT DEFAULT 2222,
        username VARCHAR(128) NOT NULL,
        password VARCHAR(255) NOT NULL,
        camera_user VARCHAR(128) DEFAULT 'sarath',
        camera_password VARCHAR(255) DEFAULT 'Password@123',
        admin_user VARCHAR(128) DEFAULT 'ftpsuperadmin',
        admin_password VARCHAR(255) DEFAULT 'Demo#Test@2026',
        remote_folder VARCHAR(255) DEFAULT '/weighbridge',
        web_admin_url VARCHAR(512),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.query('SELECT id FROM device_ftp_config WHERE id = "default"');
    if (rows.length === 0) {
      await pool.query(`
        INSERT INTO device_ftp_config (
          id, host, api_url, ftp_port, sftp_port, username, password,
          camera_user, camera_password, admin_user, admin_password,
          remote_folder, web_admin_url
        ) VALUES (
          'default',
          '213.210.37.249',
          'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/api/v2',
          2121,
          2222,
          'aparna_rmc',
          'Rmc@Aparna#2026',
          'sarath',
          'Password@123',
          'ftpsuperadmin',
          'Demo#Test@2026',
          '/weighbridge',
          'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users'
        )
      `);
      console.log('✅ device_ftp_config seeded with default configuration');
    } else {
      console.log('✅ device_ftp_config table verified');
    }
    return true;
  } catch (error) {
    console.error('Failed to init device_ftp_config table:', error.message);
    return false;
  }
}

// Self-run if called directly
if (process.argv[1]?.endsWith('schema_ftp_config.js')) {
  (async () => {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.APARNA_DB_NAME || process.env.DB_NAME || 'Aparna_RMC_Db'
    });
    await initFtpConfigTable(conn);
    await conn.end();
  })();
}
