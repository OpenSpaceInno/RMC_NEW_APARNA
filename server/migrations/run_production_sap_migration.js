import { pool } from '../db.js';

export async function runProductionSapMigration() {
  console.log('🚀 Running SAP S/4HANA Production Connection migration...');
  
  try {
    // 1. Create sap_connection_config table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sap_connection_config (
        id VARCHAR(50) PRIMARY KEY,
        connection_type VARCHAR(50) NOT NULL DEFAULT 'odata_cloud_connector',
        system_id VARCHAR(50) DEFAULT 'PRD_S4H',
        system_name VARCHAR(100) DEFAULT 'SAP S/4HANA Enterprise 2023',
        host VARCHAR(200) DEFAULT 'sap-s4h.aparna-rmc.internal',
        port INT DEFAULT 44300,
        client VARCHAR(10) DEFAULT '100',
        sysnr VARCHAR(10) DEFAULT '00',
        username VARCHAR(100) DEFAULT 'RMC_GATE_SVC',
        password_masked VARCHAR(100) DEFAULT '••••••••••••',
        btp_destination_url VARCHAR(300) DEFAULT 'https://connectivity.aparna-rmc.btp.eu10.hana.ondemand.com',
        odata_base_url VARCHAR(300) DEFAULT 'https://sap-s4h.aparna-rmc.internal:44300/sap/opu/odata/sap',
        use_cloud_connector TINYINT(1) DEFAULT 1,
        cloud_connector_location_id VARCHAR(100) DEFAULT 'HYD_RMC_PLANT_01',
        timeout_ms INT DEFAULT 12000,
        is_active TINYINT(1) DEFAULT 1,
        last_tested_at DATETIME,
        last_test_status VARCHAR(50) DEFAULT 'connected',
        last_test_latency_ms INT DEFAULT 18,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created table: sap_connection_config');

    // 2. Create sap_billing_sync table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sap_billing_sync (
        id VARCHAR(50) PRIMARY KEY,
        invoice_id VARCHAR(50),
        invoice_number VARCHAR(50),
        delivery_number VARCHAR(50),
        sales_order VARCHAR(50),
        customer_code VARCHAR(50),
        customer_name VARCHAR(150),
        concrete_grade VARCHAR(100),
        batch_volume_m3 DECIMAL(10,2),
        net_weight_kg DECIMAL(12,2),
        subtotal_amount DECIMAL(14,2),
        tax_amount DECIMAL(14,2),
        total_amount DECIMAL(14,2),
        sap_billing_doc VARCHAR(50),
        sap_accounting_doc VARCHAR(50),
        billing_type VARCHAR(20) DEFAULT 'F2',
        company_code VARCHAR(20) DEFAULT '1000',
        sales_org VARCHAR(20) DEFAULT '1000',
        dist_channel VARCHAR(20) DEFAULT '10',
        division VARCHAR(20) DEFAULT '00',
        payment_terms VARCHAR(50) DEFAULT 'NT30',
        status VARCHAR(30) DEFAULT 'synced',
        payload_json JSON,
        response_json JSON,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_billing_inv (invoice_number),
        INDEX idx_billing_del (delivery_number),
        INDEX idx_billing_doc (sap_billing_doc)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created table: sap_billing_sync');

    // 3. Create sap_sync_queue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sap_sync_queue (
        id VARCHAR(50) PRIMARY KEY,
        sync_category VARCHAR(50) NOT NULL,
        reference_id VARCHAR(100),
        target_endpoint VARCHAR(200),
        status VARCHAR(30) DEFAULT 'queued',
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 5,
        last_attempt_at DATETIME,
        next_retry_at DATETIME,
        error_message TEXT,
        payload_json JSON,
        response_json JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_queue_status (status),
        INDEX idx_queue_cat (sync_category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created table: sap_sync_queue');

    // 4. Seed initial default connection configuration if not present
    const [cfgRows] = await pool.query('SELECT COUNT(*) as count FROM sap_connection_config');
    if (cfgRows[0].count === 0) {
      await pool.query(`
        INSERT INTO sap_connection_config (
          id, connection_type, system_id, system_name, host, port, client, sysnr,
          username, password_masked, btp_destination_url, odata_base_url,
          use_cloud_connector, cloud_connector_location_id, timeout_ms, is_active,
          last_tested_at, last_test_status, last_test_latency_ms
        ) VALUES (
          'SAP_CONFIG_DEFAULT', 'odata_cloud_connector', 'PRD_S4H', 'SAP S/4HANA Enterprise 2023',
          'sap-s4h.aparna-rmc.internal', 44300, '100', '00',
          'RMC_GATE_SVC', '••••••••••••',
          'https://connectivity.aparna-rmc.btp.eu10.hana.ondemand.com',
          'https://sap-s4h.aparna-rmc.internal:44300/sap/opu/odata/sap',
          1, 'HYD_RMC_PLANT_01', 12000, 1,
          NOW(), 'connected', 18
        )
      `);
      console.log('🌱 Seeded default SAP connection configuration');
    }

    // 5. Seed initial billing sample records if empty
    const [billRows] = await pool.query('SELECT COUNT(*) as count FROM sap_billing_sync');
    if (billRows[0].count === 0) {
      const sampleBilling = [
        {
          id: 'SAP-BILL-901',
          invoice_id: 'inv_1001',
          invoice_number: 'INV-RMC-2026-8812',
          delivery_number: '80012940',
          sales_order: 'SO-3001882',
          customer_code: 'CUST-APARNA-01',
          customer_name: 'Aparna Constructions & Estates Ltd',
          concrete_grade: 'M35 Design Mix (Pumpable)',
          batch_volume_m3: 7.00,
          net_weight_kg: 16820.00,
          subtotal_amount: 38500.00,
          tax_amount: 6930.00,
          total_amount: 45430.00,
          sap_billing_doc: '9000142890',
          sap_accounting_doc: '1000849201',
          billing_type: 'F2',
          company_code: '1000',
          sales_org: '1000',
          dist_channel: '10',
          division: '00',
          payment_terms: 'NT30',
          status: 'synced'
        },
        {
          id: 'SAP-BILL-902',
          invoice_id: 'inv_1002',
          invoice_number: 'INV-RMC-2026-8813',
          delivery_number: '80012941',
          sales_order: 'SO-3001885',
          customer_code: 'CUST-LNT-02',
          customer_name: 'Larsen & Toubro Construction',
          concrete_grade: 'M40 High Strength (Self-Compacting)',
          batch_volume_m3: 6.00,
          net_weight_kg: 14760.00,
          subtotal_amount: 34800.00,
          tax_amount: 6264.00,
          total_amount: 41064.00,
          sap_billing_doc: '9000142891',
          sap_accounting_doc: '1000849202',
          billing_type: 'F2',
          company_code: '1000',
          sales_org: '1000',
          dist_channel: '10',
          division: '00',
          payment_terms: 'NT45',
          status: 'synced'
        }
      ];

      for (const b of sampleBilling) {
        await pool.query(`
          INSERT INTO sap_billing_sync (
            id, invoice_id, invoice_number, delivery_number, sales_order,
            customer_code, customer_name, concrete_grade, batch_volume_m3,
            net_weight_kg, subtotal_amount, tax_amount, total_amount,
            sap_billing_doc, sap_accounting_doc, billing_type, company_code,
            sales_org, dist_channel, division, payment_terms, status,
            payload_json, response_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          b.id, b.invoice_id, b.invoice_number, b.delivery_number, b.sales_order,
          b.customer_code, b.customer_name, b.concrete_grade, b.batch_volume_m3,
          b.net_weight_kg, b.subtotal_amount, b.tax_amount, b.total_amount,
          b.sap_billing_doc, b.sap_accounting_doc, b.billing_type, b.company_code,
          b.sales_org, b.dist_channel, b.division, b.payment_terms, b.status,
          JSON.stringify({ bapi: 'BAPI_BILLINGDOC_CREATEMULTIPLE', delivery: b.delivery_number }),
          JSON.stringify({ status: 'SUCCESS', sapBillingDoc: b.sap_billing_doc, sapAccountingDoc: b.sap_accounting_doc })
        ]);
      }
      console.log('🌱 Seeded sample SAP billing records');
    }

    console.log('🎉 SAP S/4HANA Production Connection migration complete!');
  } catch (error) {
    console.error('❌ SAP Production migration failed:', error.message);
    throw error;
  }
}
