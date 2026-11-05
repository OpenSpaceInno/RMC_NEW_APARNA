// Migration: SAP Weighbridge Gate In & Gate Out Enhanced Ticket Lifecycle
// Adds ticket_number, scenario, stage, first_weight, second_weight, and dual-gate metadata to sap_weighbridge_sync

import { pool } from '../db.js';

export async function runWeighbridgeGateInOutMigration() {
  console.log('🚀 Running Weighbridge Gate In & Gate Out migration...');

  try {
    // 1. Fetch existing columns in sap_weighbridge_sync
    const [existingCols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'sap_weighbridge_sync'
    `);
    const colSet = new Set(existingCols.map(c => c.COLUMN_NAME.toLowerCase()));

    const addColIfNotExists = async (colName, colDef) => {
      if (!colSet.has(colName.toLowerCase())) {
        console.log(`Adding column '${colName}' to sap_weighbridge_sync...`);
        await pool.query(`ALTER TABLE sap_weighbridge_sync ADD COLUMN ${colName} ${colDef}`);
      } else {
        console.log(`Column '${colName}' already exists.`);
      }
    };

    await addColIfNotExists('ticket_number', 'VARCHAR(50) UNIQUE');
    await addColIfNotExists('scenario', 'VARCHAR(30) NOT NULL DEFAULT "WITH_PO"');
    await addColIfNotExists('stage', 'VARCHAR(30) NOT NULL DEFAULT "GATE_IN"');
    await addColIfNotExists('first_weight', 'DECIMAL(12,2)');
    await addColIfNotExists('first_weight_type', 'VARCHAR(10) DEFAULT "GROSS"');
    await addColIfNotExists('second_weight', 'DECIMAL(12,2)');
    await addColIfNotExists('second_weight_type', 'VARCHAR(10) DEFAULT "TARE"');
    await addColIfNotExists('gate_in_time', 'DATETIME');
    await addColIfNotExists('gate_out_time', 'DATETIME');
    await addColIfNotExists('gate_in_operator_id', 'VARCHAR(50)');
    await addColIfNotExists('gate_in_operator_name', 'VARCHAR(100)');
    await addColIfNotExists('gate_out_operator_id', 'VARCHAR(50)');
    await addColIfNotExists('gate_out_operator_name', 'VARCHAR(100)');
    await addColIfNotExists('item_no', 'VARCHAR(20) DEFAULT "10"');
    await addColIfNotExists('vendor_code', 'VARCHAR(50)');
    await addColIfNotExists('material_code', 'VARCHAR(50)');
    await addColIfNotExists('challan_no', 'VARCHAR(100)');
    await addColIfNotExists('challan_weight', 'DECIMAL(12,2)');
    await addColIfNotExists('challan_date', 'VARCHAR(30)');
    await addColIfNotExists('transporter', 'VARCHAR(150)');
    await addColIfNotExists('customer_name', 'VARCHAR(150)');
    await addColIfNotExists('destination_site', 'VARCHAR(150)');
    await addColIfNotExists('seal_number', 'VARCHAR(50)');

    // 2. Add indexes safely
    const [indexes] = await pool.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'sap_weighbridge_sync'
    `);
    const indexSet = new Set(indexes.map(i => i.INDEX_NAME.toLowerCase()));

    if (!indexSet.has('idx_wb_ticket')) {
      await pool.query('ALTER TABLE sap_weighbridge_sync ADD INDEX idx_wb_ticket (ticket_number)');
      console.log('Added index: idx_wb_ticket');
    }
    if (!indexSet.has('idx_wb_stage')) {
      await pool.query('ALTER TABLE sap_weighbridge_sync ADD INDEX idx_wb_stage (stage)');
      console.log('Added index: idx_wb_stage');
    }
    if (!indexSet.has('idx_wb_scenario')) {
      await pool.query('ALTER TABLE sap_weighbridge_sync ADD INDEX idx_wb_scenario (scenario)');
      console.log('Added index: idx_wb_scenario');
    }

    console.log('✅ Weighbridge Gate In & Gate Out migration finished successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Direct execution
if (process.argv[1]?.endsWith('run_weighbridge_gate_in_out_migration.js')) {
  runWeighbridgeGateInOutMigration()
    .then(() => {
      console.log('Migration script complete.');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
