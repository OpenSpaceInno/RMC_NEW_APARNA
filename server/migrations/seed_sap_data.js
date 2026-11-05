import { pool } from '../db.js';

export async function runSapMigration() {
  console.log('🚀 Running SAP ERP Integration migration...');

  // 1. Create sap_purchase_orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sap_purchase_orders (
      po_number VARCHAR(50) PRIMARY KEY,
      vendor_code VARCHAR(50) NOT NULL,
      vendor_name VARCHAR(150) NOT NULL,
      material_code VARCHAR(50) NOT NULL,
      material_name VARCHAR(150) NOT NULL,
      category VARCHAR(50) NOT NULL,
      ordered_qty DECIMAL(12,2) NOT NULL,
      received_qty DECIMAL(12,2) DEFAULT 0,
      pending_qty DECIMAL(12,2) NOT NULL,
      unit VARCHAR(20) DEFAULT 'ton',
      plant_code VARCHAR(50) DEFAULT 'PL01',
      storage_location VARCHAR(100) DEFAULT 'SILO-01',
      default_vehicle VARCHAR(50),
      default_driver VARCHAR(100),
      status VARCHAR(30) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sap_po_vendor (vendor_code),
      INDEX idx_sap_po_mat (material_code),
      INDEX idx_sap_po_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Created table: sap_purchase_orders');

  // 2. Create sap_weighbridge_sync table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sap_weighbridge_sync (
      id VARCHAR(50) PRIMARY KEY,
      session_id VARCHAR(50),
      slip_number VARCHAR(50),
      sync_type VARCHAR(30) NOT NULL,
      po_number VARCHAR(50),
      vendor_name VARCHAR(150),
      material_name VARCHAR(150),
      vehicle_no VARCHAR(50),
      driver_name VARCHAR(100),
      tare_weight DECIMAL(12,2),
      gross_weight DECIMAL(12,2),
      net_weight DECIMAL(12,2),
      sap_doc_number VARCHAR(50),
      movement_type VARCHAR(20) DEFAULT '101',
      plant_code VARCHAR(50) DEFAULT 'PL01',
      storage_location VARCHAR(100),
      direction VARCHAR(30) DEFAULT 'bidirectional',
      status VARCHAR(30) DEFAULT 'synced',
      notes TEXT,
      payload_json JSON,
      response_json JSON,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sync_po (po_number),
      INDEX idx_sync_sess (session_id),
      INDEX idx_sync_doc (sap_doc_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Created table: sap_weighbridge_sync');

  // 3. Add columns to weighbridge_sessions if missing
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM weighbridge_sessions LIKE "sap_po_number"');
    if (cols.length === 0) {
      await pool.query(`
        ALTER TABLE weighbridge_sessions 
        ADD COLUMN sap_po_number VARCHAR(50) NULL AFTER destination,
        ADD COLUMN sap_doc_number VARCHAR(50) NULL AFTER sap_po_number,
        ADD COLUMN sap_sync_status VARCHAR(30) DEFAULT 'none' AFTER sap_doc_number,
        ADD COLUMN sync_type VARCHAR(30) DEFAULT 'none' AFTER sap_sync_status,
        ADD COLUMN vendor_name VARCHAR(150) NULL AFTER sync_type
      `);
      console.log('✅ Added SAP columns to weighbridge_sessions');
    }
  } catch (err) {
    console.warn('Note on weighbridge_sessions columns:', err.message);
  }

  // 4. Seed SAP Purchase Orders
  const [poCount] = await pool.query('SELECT COUNT(*) as count FROM sap_purchase_orders');
  if (poCount[0].count === 0) {
    console.log('🌱 Seeding SAP Purchase Orders...');
    const pos = [
      {
        po_number: '4500128490',
        vendor_code: 'VEND-10023',
        vendor_name: 'UltraTech Cement Limited',
        material_code: 'MAT-CEM-OPC53',
        material_name: 'Ordinary Portland Cement (OPC 53 Grade)',
        category: 'Cement',
        ordered_qty: 120.00,
        received_qty: 42.50,
        pending_qty: 77.50,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'SILO-01 (Cement Main)',
        default_vehicle: 'TS07UA1289',
        default_driver: 'Ramesh Naidu',
        status: 'open'
      },
      {
        po_number: '4500128491',
        vendor_code: 'VEND-10045',
        vendor_name: 'Deccan Cements Ltd',
        material_code: 'MAT-CEM-PPC',
        material_name: 'Portland Pozzolana Cement (PPC)',
        category: 'Cement',
        ordered_qty: 100.00,
        received_qty: 25.00,
        pending_qty: 75.00,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'SILO-02 (PPC Backup)',
        default_vehicle: 'AP28TD4521',
        default_driver: 'K. Venkatesh',
        status: 'open'
      },
      {
        po_number: '4500128492',
        vendor_code: 'VEND-20012',
        vendor_name: 'GMR Mining & Infrastructure',
        material_code: 'MAT-AGG-20MM',
        material_name: '20mm Blue Metal Granite Aggregate',
        category: 'Aggregates',
        ordered_qty: 250.00,
        received_qty: 95.00,
        pending_qty: 155.00,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'BIN-AGG-A (20mm Yard)',
        default_vehicle: 'TS08UB9920',
        default_driver: 'Mohd. Imran',
        status: 'open'
      },
      {
        po_number: '4500128493',
        vendor_code: 'VEND-20038',
        vendor_name: 'Sri Rama Stone Crushers',
        material_code: 'MAT-AGG-10MM',
        material_name: '10mm Graded Granite Aggregate',
        category: 'Aggregates',
        ordered_qty: 200.00,
        received_qty: 60.00,
        pending_qty: 140.00,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'BIN-AGG-B (10mm Yard)',
        default_vehicle: 'TS07UC3341',
        default_driver: 'P. Shiva Kumar',
        status: 'open'
      },
      {
        po_number: '4500128494',
        vendor_code: 'VEND-30018',
        vendor_name: 'Megha Sand Quarries Pvt Ltd',
        material_code: 'MAT-SND-MSAND',
        material_name: 'Manufactured Sand (M-Sand / Robo Sand)',
        category: 'Sand',
        ordered_qty: 300.00,
        received_qty: 110.00,
        pending_qty: 190.00,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'BIN-SND-01 (M-Sand Bunker)',
        default_vehicle: 'AP29TC7784',
        default_driver: 'B. Jagadish',
        status: 'open'
      },
      {
        po_number: '4500128495',
        vendor_code: 'VEND-40005',
        vendor_name: 'NTPC Limited (Ramagundam STPS)',
        material_code: 'MAT-FLY-ASH-P60',
        material_name: 'Dry Electrostatic Fly Ash (Grade I - IS 3812)',
        category: 'Fly Ash',
        ordered_qty: 150.00,
        received_qty: 30.00,
        pending_qty: 120.00,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'SILO-03 (Fly Ash Silo)',
        default_vehicle: 'TS09UB6652',
        default_driver: 'N. Ravinder',
        status: 'open'
      },
      {
        po_number: '4500128496',
        vendor_code: 'VEND-50022',
        vendor_name: 'Sika India Private Limited',
        material_code: 'MAT-ADM-VISCO',
        material_name: 'Sika ViscoCrete-20 HE Superplasticizer',
        category: 'Chemical Admixture',
        ordered_qty: 15.00,
        received_qty: 5.00,
        pending_qty: 10.00,
        unit: 'ton',
        plant_code: 'PL01',
        storage_location: 'TANK-CHEM-01 (Admixture Tank)',
        default_vehicle: 'MH12TC9012',
        default_driver: 'Santosh Shinde',
        status: 'open'
      }
    ];

    for (const po of pos) {
      await pool.query(`
        INSERT INTO sap_purchase_orders (
          po_number, vendor_code, vendor_name, material_code, material_name,
          category, ordered_qty, received_qty, pending_qty, unit, plant_code,
          storage_location, default_vehicle, default_driver, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        po.po_number, po.vendor_code, po.vendor_name, po.material_code, po.material_name,
        po.category, po.ordered_qty, po.received_qty, po.pending_qty, po.unit, po.plant_code,
        po.storage_location, po.default_vehicle, po.default_driver, po.status
      ]);
    }
    console.log(`✅ Seeded ${pos.length} SAP Purchase Orders successfully!`);
  }

  // 5. Seed initial sample SAP weighbridge sync transactions
  const [syncCount] = await pool.query('SELECT COUNT(*) as count FROM sap_weighbridge_sync');
  if (syncCount[0].count === 0) {
    console.log('🌱 Seeding initial SAP sync transactions...');
    const syncs = [
      {
        id: 'SYNC-8001',
        session_id: 'WB-1728489100',
        slip_number: 'WS-849100',
        sync_type: 'po_ref',
        po_number: '4500128490',
        vendor_name: 'UltraTech Cement Limited',
        material_name: 'Ordinary Portland Cement (OPC 53 Grade)',
        vehicle_no: 'TS07UA1289',
        driver_name: 'Ramesh Naidu',
        tare_weight: 14.10,
        gross_weight: 42.60,
        net_weight: 28.50,
        sap_doc_number: 'MIGO-5000192841',
        movement_type: '101',
        plant_code: 'PL01',
        storage_location: 'SILO-01 (Cement Main)',
        direction: 'bidirectional',
        status: 'synced',
        notes: 'SAP Inbound GRN posted automatically upon Gross weighment approval.',
        payload_json: {
          bapiName: 'BAPI_GOODSMVT_CREATE',
          header: { pstngDate: '2026-10-09', docDate: '2026-10-09', refDocNo: 'WS-849100' },
          item: { poNumber: '4500128490', poItem: '00010', moveType: '101', quantity: 28.50, uom: 'TO', plant: 'PL01', storLoc: 'SILO-01' }
        },
        response_json: {
          status: 'SUCCESS',
          matDocNo: '5000192841',
          fiscalYear: '2026',
          message: 'Document 5000192841 posted to SAP S/4HANA successfully'
        }
      },
      {
        id: 'SYNC-8002',
        session_id: 'WB-1728490200',
        slip_number: 'WS-849200',
        sync_type: 'without_po',
        po_number: null,
        vendor_name: 'Sri Krishna Stone Works (Spot Quarry)',
        material_name: '20mm Blue Metal Granite Aggregate',
        vehicle_no: 'TS08UB4412',
        driver_name: 'M. Prabhakar',
        tare_weight: 12.80,
        gross_weight: 38.30,
        net_weight: 25.50,
        sap_doc_number: 'MIGO-5000192842',
        movement_type: '501',
        plant_code: 'PL01',
        storage_location: 'BIN-AGG-A',
        direction: 'bidirectional',
        status: 'synced',
        notes: 'Direct Non-PO GR posted to SAP Cost Center CC-RMC-PL01 (Movement 501)',
        payload_json: {
          bapiName: 'BAPI_GOODSMVT_CREATE',
          header: { pstngDate: '2026-10-09', docDate: '2026-10-09', refDocNo: 'DC-8891' },
          item: { moveType: '501', material: 'MAT-AGG-20MM', quantity: 25.50, plant: 'PL01', storLoc: 'BIN-AGG-A', costCenter: 'CC-RMC-PL01' }
        },
        response_json: {
          status: 'SUCCESS',
          matDocNo: '5000192842',
          fiscalYear: '2026',
          message: 'Direct receipt document 5000192842 created in SAP'
        }
      }
    ];

    for (const s of syncs) {
      await pool.query(`
        INSERT INTO sap_weighbridge_sync (
          id, session_id, slip_number, sync_type, po_number, vendor_name,
          material_name, vehicle_no, driver_name, tare_weight, gross_weight,
          net_weight, sap_doc_number, movement_type, plant_code, storage_location,
          direction, status, notes, payload_json, response_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        s.id, s.session_id, s.slip_number, s.sync_type, s.po_number, s.vendor_name,
        s.material_name, s.vehicle_no, s.driver_name, s.tare_weight, s.gross_weight,
        s.net_weight, s.sap_doc_number, s.movement_type, s.plant_code, s.storage_location,
        s.direction, s.status, s.notes, JSON.stringify(s.payload_json), JSON.stringify(s.response_json)
      ]);
    }
    console.log(`✅ Seeded ${syncs.length} SAP sync transactions!`);
  }

  console.log('🎉 SAP ERP Integration migration & seed complete!');
}

if (process.argv[1]?.includes('seed_sap_data.js')) {
  runSapMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
