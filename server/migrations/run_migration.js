import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { seedAllData } from './seed_data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runCompleteMigration() {
  console.log('🚀 Running complete schema migration for all RMC modules...');
  const sqlPath = path.join(__dirname, 'schema_all_modules.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await pool.getConnection();
  try {
    // Split SQL by semicolons, accounting for possible multiline comments
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log(`✅ Executed ${statements.length} table definitions successfully.`);

    // Now seed data
    await seedAllData();
    console.log('🎉 Full database migration & seeding completed!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Allow direct execution
if (process.argv[1] === __filename) {
  runCompleteMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
