import { pool } from '../db.js';
import { seedUsersAndRoles } from './seed_users_roles.js';

export async function runUsersMigration() {
  console.log('🚀 Running schema migration for users and roles...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      description TEXT,
      color VARCHAR(32) DEFAULT 'blue',
      modules JSON NOT NULL,
      permissions JSON NOT NULL,
      is_system BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Created table: roles');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role_id VARCHAR(64) NOT NULL,
      role_name VARCHAR(128) NOT NULL,
      plant_id VARCHAR(64) DEFAULT 'PL01',
      plant_name VARCHAR(128) DEFAULT 'Plant 01 • Shamshabad Central',
      phone VARCHAR(32),
      department VARCHAR(64),
      shift VARCHAR(64),
      status VARCHAR(32) DEFAULT 'active',
      avatar VARCHAR(255),
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_role (role_id),
      INDEX idx_users_plant (plant_id),
      INDEX idx_users_status (status)
    )
  `);

  // Ensure plant_id & plant_name columns exist on pre-existing users tables
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN plant_id VARCHAR(64) DEFAULT 'PL01'`);
  } catch (e) {}
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN plant_name VARCHAR(128) DEFAULT 'Plant 01 • Shamshabad Central'`);
  } catch (e) {}
  console.log('✅ Created table: users');

  await seedUsersAndRoles();
  console.log('🎉 Users and Roles migration complete!');
}

if (process.argv[1]?.endsWith('run_user_migration.js')) {
  runUsersMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
