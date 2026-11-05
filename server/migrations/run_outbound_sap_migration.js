import { pool } from '../db.js';

export async function runOutboundSapMigration() {
  console.log('🚀 Running SAP Outbound Deliveries & Exit Gate migration...');

  // 1. Create sap_outbound_deliveries
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sap_outbound_deliveries (
      delivery_number VARCHAR(50) PRIMARY KEY,
      sales_order VARCHAR(50) NOT NULL,
      customer_code VARCHAR(50) NOT NULL,
      customer_name VARCHAR(150) NOT NULL,
      destination_site VARCHAR(255) NOT NULL,
      concrete_grade VARCHAR(100) NOT NULL,
      ordered_volume_m3 DECIMAL(10,2) NOT NULL,
      batch_volume_m3 DECIMAL(10,2) NOT NULL,
      expected_net_weight_kg DECIMAL(12,2) NOT NULL,
      tolerance_percentage DECIMAL(5,2) DEFAULT 1.50,
      vehicle_no VARCHAR(50) NOT NULL,
      driver_name VARCHAR(100) NOT NULL,
      driver_phone VARCHAR(50),
      mixer_tare_kg DECIMAL(12,2) NOT NULL,
      slump_mm VARCHAR(50) DEFAULT '120 ± 25 mm',
      water_cement_ratio VARCHAR(30) DEFAULT '0.42',
      batch_plant_bay VARCHAR(100) DEFAULT 'BAY-01 (Liebherr 2.25m³)',
      qc_status VARCHAR(30) DEFAULT 'approved',
      seal_number VARCHAR(50),
      eway_bill_no VARCHAR(50),
      tax_invoice_no VARCHAR(50),
      status VARCHAR(30) DEFAULT 'ready_for_exit',
      pgi_status VARCHAR(30) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sap_obd_veh (vehicle_no),
      INDEX idx_sap_obd_status (status),
      INDEX idx_sap_obd_so (sales_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Created table: sap_outbound_deliveries');

  // 2. Create sap_exit_sync table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sap_exit_sync (
      id VARCHAR(50) PRIMARY KEY,
      gate_pass_number VARCHAR(50) NOT NULL,
      delivery_number VARCHAR(50),
      sales_order VARCHAR(50),
      sync_type VARCHAR(30) NOT NULL,
      customer_name VARCHAR(150),
      destination_site VARCHAR(255),
      concrete_grade VARCHAR(100),
      vehicle_no VARCHAR(50) NOT NULL,
      driver_name VARCHAR(100),
      seal_number VARCHAR(50),
      tare_weight DECIMAL(12,2) NOT NULL,
      gross_weight DECIMAL(12,2) NOT NULL,
      net_weight DECIMAL(12,2) NOT NULL,
      batch_volume_m3 DECIMAL(10,2),
      tolerance_variance_kg DECIMAL(12,2),
      tolerance_variance_pct DECIMAL(5,2),
      qc_slump_mm VARCHAR(50),
      sap_pgi_doc_number VARCHAR(50) NOT NULL,
      movement_type VARCHAR(20) DEFAULT '601',
      plant_code VARCHAR(50) DEFAULT 'PL01',
      barrier_status VARCHAR(30) DEFAULT 'OPEN',
      status VARCHAR(30) DEFAULT 'synced',
      notes TEXT,
      payload_json JSON,
      response_json JSON,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_exit_sync_obd (delivery_number),
      INDEX idx_exit_sync_gp (gate_pass_number),
      INDEX idx_exit_sync_veh (vehicle_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Created table: sap_exit_sync');

  // 3. Seed sample Outbound Deliveries
  const [obdCount] = await pool.query('SELECT COUNT(*) as count FROM sap_outbound_deliveries');
  if (obdCount[0].count === 0) {
    console.log('🌱 Seeding SAP Outbound Deliveries...');
    const deliveries = [
      {
        delivery_number: '80012940',
        sales_order: 'SO-3001882',
        customer_code: 'CUST-APARNA-01',
        customer_name: 'Aparna Constructions & Estates Ltd',
        destination_site: 'Aparna Sarovar Zenith - Tower 4 Slab Pour, Nallagandla',
        concrete_grade: 'M35 Design Mix (Pumpable - Slump 120±25mm)',
        ordered_volume_m3: 7.00,
        batch_volume_m3: 7.00,
        expected_net_weight_kg: 16800.00,
        tolerance_percentage: 1.50,
        vehicle_no: 'TS07UA9944',
        driver_name: 'K. Narayana',
        driver_phone: '+91 98490 12345',
        mixer_tare_kg: 13420.00,
        slump_mm: '125 mm',
        water_cement_ratio: '0.42',
        batch_plant_bay: 'BAY-01 (Liebherr 2.25m³)',
        qc_status: 'approved',
        seal_number: 'SL-88491',
        eway_bill_no: 'EB-241098124801',
        tax_invoice_no: 'INV-RMC-2026-9042',
        status: 'ready_for_exit',
        pgi_status: 'pending'
      },
      {
        delivery_number: '80012941',
        sales_order: 'SO-3001885',
        customer_code: 'CUST-MYHOME-02',
        customer_name: 'My Home Constructions Pvt Ltd',
        destination_site: 'My Home Sayuk - Wing B Raft Foundation, Tellapur',
        concrete_grade: 'M40 High-Strength Self-Compacting (SCC)',
        ordered_volume_m3: 8.00,
        batch_volume_m3: 8.00,
        expected_net_weight_kg: 19200.00,
        tolerance_percentage: 1.50,
        vehicle_no: 'TS08UB1122',
        driver_name: 'S. Venkat Reddy',
        driver_phone: '+91 98490 67890',
        mixer_tare_kg: 13850.00,
        slump_mm: '150 mm',
        water_cement_ratio: '0.38',
        batch_plant_bay: 'BAY-02 (Schwing Stetter 3.0m³)',
        qc_status: 'approved',
        seal_number: 'SL-88492',
        eway_bill_no: 'EB-241098124802',
        tax_invoice_no: 'INV-RMC-2026-9043',
        status: 'ready_for_exit',
        pgi_status: 'pending'
      },
      {
        delivery_number: '80012942',
        sales_order: 'SO-3001890',
        customer_code: 'CUST-LNT-03',
        customer_name: 'Larsen & Toubro Ltd (Metro Division)',
        destination_site: 'Hyderabad Metro Rail Pier Cap Section 12, Ameerpet',
        concrete_grade: 'M45 Pre-stressed Concrete Design Mix',
        ordered_volume_m3: 6.00,
        batch_volume_m3: 6.00,
        expected_net_weight_kg: 14400.00,
        tolerance_percentage: 1.50,
        vehicle_no: 'TS07UA5511',
        driver_name: 'R. Anjaiah',
        driver_phone: '+91 98490 54321',
        mixer_tare_kg: 13100.00,
        slump_mm: '110 mm',
        water_cement_ratio: '0.36',
        batch_plant_bay: 'BAY-01 (Liebherr 2.25m³)',
        qc_status: 'approved',
        seal_number: 'SL-88495',
        eway_bill_no: 'EB-241098124805',
        tax_invoice_no: 'INV-RMC-2026-9047',
        status: 'ready_for_exit',
        pgi_status: 'pending'
      },
      {
        delivery_number: '80012943',
        sales_order: 'SO-3001899',
        customer_code: 'CUST-PRESTIGE-04',
        customer_name: 'Prestige Estates Projects Ltd',
        destination_site: 'Prestige Beverly Hills - Podium Slab, Kokapet',
        concrete_grade: 'M30 Design Mix (Standard)',
        ordered_volume_m3: 7.50,
        batch_volume_m3: 7.50,
        expected_net_weight_kg: 18000.00,
        tolerance_percentage: 1.50,
        vehicle_no: 'TS09UC7788',
        driver_name: 'B. Srinivas',
        driver_phone: '+91 98490 98765',
        mixer_tare_kg: 13600.00,
        slump_mm: '120 mm',
        water_cement_ratio: '0.44',
        batch_plant_bay: 'BAY-02 (Schwing Stetter 3.0m³)',
        qc_status: 'approved',
        seal_number: 'SL-88499',
        eway_bill_no: 'EB-241098124809',
        tax_invoice_no: 'INV-RMC-2026-9051',
        status: 'ready_for_exit',
        pgi_status: 'pending'
      }
    ];

    for (const d of deliveries) {
      await pool.query(`
        INSERT INTO sap_outbound_deliveries (
          delivery_number, sales_order, customer_code, customer_name,
          destination_site, concrete_grade, ordered_volume_m3, batch_volume_m3,
          expected_net_weight_kg, tolerance_percentage, vehicle_no, driver_name,
          driver_phone, mixer_tare_kg, slump_mm, water_cement_ratio, batch_plant_bay,
          qc_status, seal_number, eway_bill_no, tax_invoice_no, status, pgi_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.delivery_number, d.sales_order, d.customer_code, d.customer_name,
        d.destination_site, d.concrete_grade, d.ordered_volume_m3, d.batch_volume_m3,
        d.expected_net_weight_kg, d.tolerance_percentage, d.vehicle_no, d.driver_name,
        d.driver_phone, d.mixer_tare_kg, d.slump_mm, d.water_cement_ratio, d.batch_plant_bay,
        d.qc_status, d.seal_number, d.eway_bill_no, d.tax_invoice_no, d.status, d.pgi_status
      ]);
    }
    console.log(`✅ Seeded ${deliveries.length} SAP Outbound Deliveries!`);
  }

  // 4. Seed sample completed exit transactions
  const [syncCount] = await pool.query('SELECT COUNT(*) as count FROM sap_exit_sync');
  if (syncCount[0].count === 0) {
    console.log('🌱 Seeding initial SAP Exit Sync records...');
    const exitRecords = [
      {
        id: 'EXSYNC-9001',
        gate_pass_number: 'OGP-2026-00388',
        delivery_number: '80012938',
        sales_order: 'SO-3001876',
        sync_type: 'delivery_ref',
        customer_name: 'Aparna Constructions & Estates Ltd',
        destination_site: 'Aparna Cyber4, Gachibowli',
        concrete_grade: 'M40 Self Compacting Concrete',
        vehicle_no: 'TS07UA8822',
        driver_name: 'G. Mohan Rao',
        seal_number: 'SL-88480',
        tare_weight: 13350.00,
        gross_weight: 30180.00,
        net_weight: 16830.00,
        batch_volume_m3: 7.00,
        tolerance_variance_kg: 30.00,
        tolerance_variance_pct: 0.18,
        qc_slump_mm: '140 mm',
        sap_pgi_doc_number: '4900188921',
        movement_type: '601',
        plant_code: 'PL01',
        barrier_status: 'OPEN',
        status: 'synced',
        notes: 'SAP PGI posted successfully. Barrier Gate Out cleared.',
        payload_json: {
          bapiName: 'BAPI_OUTB_DELIVERY_CONFIRM_DEC',
          delivery: '80012938',
          moveType: '601',
          quantity: 7.00,
          netKg: 16830
        },
        response_json: {
          status: 'SUCCESS',
          sapDocNo: '4900188921',
          pgiStatus: 'POSTED',
          message: 'Post Goods Issue 4900188921 completed in S/4HANA'
        }
      }
    ];

    for (const e of exitRecords) {
      await pool.query(`
        INSERT INTO sap_exit_sync (
          id, gate_pass_number, delivery_number, sales_order, sync_type,
          customer_name, destination_site, concrete_grade, vehicle_no, driver_name,
          seal_number, tare_weight, gross_weight, net_weight, batch_volume_m3,
          tolerance_variance_kg, tolerance_variance_pct, qc_slump_mm,
          sap_pgi_doc_number, movement_type, plant_code, barrier_status,
          status, notes, payload_json, response_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        e.id, e.gate_pass_number, e.delivery_number, e.sales_order, e.sync_type,
        e.customer_name, e.destination_site, e.concrete_grade, e.vehicle_no, e.driver_name,
        e.seal_number, e.tare_weight, e.gross_weight, e.net_weight, e.batch_volume_m3,
        e.tolerance_variance_kg, e.tolerance_variance_pct, e.qc_slump_mm,
        e.sap_pgi_doc_number, e.movement_type, e.plant_code, e.barrier_status,
        e.status, e.notes, JSON.stringify(e.payload_json), JSON.stringify(e.response_json)
      ]);
    }
    console.log(`✅ Seeded ${exitRecords.length} SAP Exit Sync records!`);
  }

  console.log('🎉 SAP Outbound Deliveries & Exit Gate migration complete!');
}

if (process.argv[1]?.includes('run_outbound_sap_migration.js')) {
  runOutboundSapMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
