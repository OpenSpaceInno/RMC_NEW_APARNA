import { pool } from '../db.js';

export async function seedAllData() {
  const connection = await pool.getConnection();
  try {
    console.log('🌱 Checking and seeding initial operational data...');

    // 1. SEED VEHICLES
    const [existingVehicles] = await connection.query('SELECT COUNT(*) as count FROM vehicles');
    if (existingVehicles[0].count === 0) {
      console.log('Seeding vehicles...');
      const vehicles = [
        ['v1', 'MH12AB1234', 'truck', 'Tata', 'Prima 4928.S', 2023, 28, 'ton', 'diesel', 'available', 'Rajesh Kumar', '+91 98765 43210', '2026-03-20', '2026-06-20', '2026-10-15', '2026-07-15', '2026-12-15', 125230, 4.2],
        ['v2', 'MH14CD5678', 'tanker', 'Ashok Leyland', 'Captain 2523', 2022, 20000, 'liters', 'diesel', 'in_transit', 'Suresh Patil', '+91 87654 32109', '2026-03-25', '2026-06-25', '2026-08-10', '2026-05-05', '2026-09-15', 98120, 3.8],
        ['v3', 'MH43EF9012', 'trailer', 'Mahindra', 'Blazo X 46', 2023, 40, 'ton', 'diesel', 'maintenance', 'Vikram Singh', '+91 76543 21098', '2026-04-01', '2026-04-20', '2026-11-20', '2026-08-20', '2027-01-20', 145600, 3.5],
        ['v4', 'KA01JK3456', 'truck', 'BharatBenz', '2823R', 2024, 28, 'ton', 'diesel', 'available', 'Amit Sharma', '+91 65432 10987', '2026-03-10', '2026-06-10', '2027-03-10', '2027-03-10', '2027-03-10', 42300, 4.5]
      ];
      for (const v of vehicles) {
        await connection.query(
          `INSERT IGNORE INTO vehicles (id, registration_no, type, make, model, year, capacity, capacity_unit, fuel_type, status, current_driver, current_driver_phone, last_maintenance, next_maintenance, insurance_expiry, fitness_expiry, permit_expiry, odometer, fuel_efficiency)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          v
        );
      }
    }

    // 2. SEED DRIVERS
    const [existingDrivers] = await connection.query('SELECT COUNT(*) as count FROM drivers');
    if (existingDrivers[0].count === 0) {
      console.log('Seeding drivers...');
      const drivers = [
        ['d1', 'Rajesh Kumar', '+91 98765 43210', 'rajesh.k@example.com', '1988-05-12', 'Plot 45, Hadapsar, Pune', 'EMP-DRV-001', '2022-01-15', 'available', JSON.stringify({ name: 'Sunita Kumar', relation: 'Spouse', phone: '+91 98765 00001' }), JSON.stringify({ number: 'MH12 20100012345', type: 'HMV', issueDate: '2010-06-15', expiryDate: '2028-06-14', issuingAuthority: 'RTO Pune', status: 'valid' }), 'MH12AB1234', 4.8, 342, 45200],
        ['d2', 'Suresh Patil', '+91 87654 32109', 'suresh.p@example.com', '1985-08-24', 'Sector 12, Nigdi, Pimpri', 'EMP-DRV-002', '2021-06-20', 'on_trip', JSON.stringify({ name: 'Rekha Patil', relation: 'Spouse', phone: '+91 87654 00002' }), JSON.stringify({ number: 'MH14 20080056789', type: 'Transport', issueDate: '2008-09-10', expiryDate: '2027-09-09', issuingAuthority: 'RTO Pimpri', status: 'valid' }), 'MH14CD5678', 4.9, 512, 68900],
        ['d3', 'Vikram Singh', '+91 76543 21098', 'vikram.s@example.com', '1992-11-03', 'Katraj, Pune', 'EMP-DRV-003', '2023-03-10', 'on_leave', JSON.stringify({ name: 'Mahesh Singh', relation: 'Brother', phone: '+91 76543 00003' }), JSON.stringify({ number: 'MH12 20150098765', type: 'HMV', issueDate: '2015-12-01', expiryDate: '2026-12-01', issuingAuthority: 'RTO Pune', status: 'valid' }), 'MH43EF9012', 4.6, 189, 24500]
      ];
      for (const d of drivers) {
        await connection.query(
          `INSERT IGNORE INTO drivers (id, name, phone, email, date_of_birth, address, employee_id, date_of_joining, status, emergency_contact, license, assigned_vehicle, rating, total_trips, total_distance)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          d
        );
      }
    }

    // 3. SEED LOADING BAYS
    const [existingBays] = await connection.query('SELECT COUNT(*) as count FROM loading_bays');
    if (existingBays[0].count === 0) {
      console.log('Seeding loading bays...');
      const bays = [
        ['bay-1', 'Bay 1 - High Volume M25/M30', 'available', 60, 'Plant North Bay'],
        ['bay-2', 'Bay 2 - Rapid Mix M35/M40', 'loading', 60, 'Plant Central Bay'],
        ['bay-3', 'Bay 3 - Special Concrete', 'available', 45, 'Plant South Bay'],
        ['bay-4', 'Bay 4 - Dry Lean Concrete (DLC)', 'maintenance', 50, 'Plant Auxiliary Bay']
      ];
      for (const b of bays) {
        await connection.query(
          `INSERT IGNORE INTO loading_bays (id, name, status, capacity, location) VALUES (?, ?, ?, ?, ?)`,
          b
        );
      }
    }

    // 4. SEED TRIPS
    const [existingTrips] = await connection.query('SELECT COUNT(*) as count FROM trips');
    if (existingTrips[0].count === 0) {
      console.log('Seeding trips...');
      const trips = [
        [
          'trip-001', 'TRP-2026-0891', 'v2', 'MH14CD5678', 'd2', 'Suresh Patil', '+91 87654 32109', 'CUST-101', 'Aparna Cyber4 Commercial', '+91 99887 76655', 'M30 Grade RMC', 7.5, 'm³',
          JSON.stringify({ name: 'Aparna RMC Plant #1', address: 'Plot 18, MIDC Hinjawadi, Pune', location: { latitude: 18.5912, longitude: 73.7389 } }),
          JSON.stringify({ name: 'Aparna Cyber4 Tower B', address: 'Survey 42, Gachibowli / Financial Dist', location: { latitude: 18.6150, longitude: 73.7890 } }),
          JSON.stringify([]),
          '2026-10-09 14:00:00', '2026-10-09 14:15:00', '2026-10-09 15:30:00', 'in_transit', 24.5, 16.2, 8.3,
          JSON.stringify({ latitude: 18.6045, longitude: 73.7621, speed: 38, timestamp: new Date().toISOString() }),
          JSON.stringify({ isEnabled: true, trackingInterval: 15, signalStrength: 'strong' }),
          'Pumping grade mix with retarder dosage', 'high'
        ],
        [
          'trip-002', 'TRP-2026-0892', 'v1', 'MH12AB1234', 'd1', 'Rajesh Kumar', '+91 98765 43210', 'CUST-102', 'L&T Metro Project Pier 24', '+91 98220 11223', 'M40 High Early Strength', 8.0, 'm³',
          JSON.stringify({ name: 'Aparna RMC Plant #1', address: 'Plot 18, MIDC Hinjawadi, Pune', location: { latitude: 18.5912, longitude: 73.7389 } }),
          JSON.stringify({ name: 'Metro Corridor Pier 24', address: 'Shivaji Nagar Flyover Site', location: { latitude: 18.5308, longitude: 73.8474 } }),
          JSON.stringify([]),
          '2026-10-09 16:30:00', null, '2026-10-09 17:45:00', 'scheduled', 18.0, 0, 18.0,
          JSON.stringify({ latitude: 18.5912, longitude: 73.7389, speed: 0, timestamp: new Date().toISOString() }),
          JSON.stringify({ isEnabled: true, trackingInterval: 15, signalStrength: 'strong' }),
          'Urgent pour for slab casting', 'urgent'
        ]
      ];
      for (const t of trips) {
        await connection.query(
          `INSERT IGNORE INTO trips (id, trip_number, vehicle_id, vehicle_reg_no, driver_id, driver_name, driver_phone, customer_id, customer_name, customer_contact, material, quantity, unit, origin, destination, waypoints, scheduled_start_time, actual_start_time, estimated_arrival, status, total_distance, distance_covered, distance_remaining, current_location, gps_config, notes, priority)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          t
        );
      }
    }

    // 5. SEED RAW INVENTORY ITEMS
    const [existingInv] = await connection.query('SELECT COUNT(*) as count FROM inventory_items');
    if (existingInv[0].count === 0) {
      console.log('Seeding raw material inventory...');
      const items = [
        ['inv-1', 'OPC 53 Grade Cement', 'CEM-53-ULTR', 'cement', 'tons', 480.0, 150.0, 800.0, 200.0, 300.0, 5800.0, 2784000.0, 'Silo A1 & A2', 'Ultratech Cement Ltd'],
        ['inv-2', 'Crushed M-Sand (Zone II)', 'SAND-MSAND-01', 'sand', 'tons', 620.0, 200.0, 1200.0, 250.0, 400.0, 1450.0, 899000.0, 'Bunker Bay 1', 'Sahyadri Aggregate Quarries'],
        ['inv-3', '10mm Coarse Aggregate', 'AGG-10MM-BL', 'aggregate', 'tons', 540.0, 150.0, 1000.0, 200.0, 350.0, 1200.0, 648000.0, 'Bunker Bay 2', 'Sahyadri Aggregate Quarries'],
        ['inv-4', '20mm Coarse Aggregate', 'AGG-20MM-BL', 'aggregate', 'tons', 710.0, 200.0, 1200.0, 250.0, 400.0, 1150.0, 816500.0, 'Bunker Bay 3', 'Sahyadri Aggregate Quarries'],
        ['inv-5', 'Polycarboxylate Ether (PCE) Superplasticizer', 'ADMIX-PCE-FLOW', 'admixture', 'liters', 3500.0, 1000.0, 6000.0, 1200.0, 2000.0, 120.0, 420000.0, 'Admixture Tank T-1', 'Fosroc Chemicals India']
      ];
      for (const item of items) {
        await connection.query(
          `INSERT IGNORE INTO inventory_items (id, name, sku, category, unit, current_stock, min_stock, max_stock, reorder_level, reorder_quantity, unit_cost, total_value, location, supplier)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item
        );
      }
    }

    // 6. SEED EXIT VERIFICATIONS
    const [existingVerifications] = await connection.query('SELECT COUNT(*) as count FROM exit_verifications');
    if (existingVerifications[0].count === 0) {
      console.log('Seeding exit verifications...');
      const evs = [
        ['ev-001', 'EV-2026-001', 'MH12AB1234', '2026-10-09 13:45:00', 19450, 8500, 17800, 1650, JSON.stringify([]), 'anomaly', 'OP001', 'John Operator', 'Gross weight exceeds batch target by 1.65 tons (>5% tolerance). Escalated to Incident Management.', 'Weight discrepancy exceeds tolerance threshold', 'inc-001'],
        ['ev-002', 'EV-2026-002', 'MH14CD5678', '2026-10-09 14:10:00', 18520, 9200, 18500, 20, JSON.stringify([]), 'verified', 'OP001', 'John Operator', 'Discrepancy +20kg is within 0.1% tolerance. Cleared for customer delivery.', null, null]
      ];
      for (const ev of evs) {
        await connection.query(
          `INSERT IGNORE INTO exit_verifications (id, verification_id, vehicle_reg_no, exit_timestamp, exit_weight, entry_weight, loading_weight, weight_difference, plate_images, status, operator_id, operator_name, remarks, anomaly_reason, incident_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ev
        );
      }
    }

    // 7. SEED INCIDENTS
    const [existingIncidents] = await connection.query('SELECT COUNT(*) as count FROM incidents');
    if (existingIncidents[0].count === 0) {
      console.log('Seeding incidents...');
      const incs = [
        [
          'inc-001', 'INC-2026-0042', 'Weight discrepancy detected on Transit Mixer MH12AB1234',
          'Exit weighbridge recorded 19,450 kg vs target batch load 17,800 kg. Variance of 1.65 tons exceeds safety threshold.',
          'quality', 'high', 'investigating', 'Exit Gate Weighbridge 02', 'John Operator', '2026-10-09 13:50:00',
          'Production QC Lead', '2026-10-09 14:05:00', 'Checking batch dispenser calibration logs for Silo 1', null, null,
          'MH12AB1234', 'exit', JSON.stringify(['weight_anomaly', 'quality_check']), JSON.stringify([]), JSON.stringify([])
        ]
      ];
      for (const inc of incs) {
        await connection.query(
          `INSERT IGNORE INTO incidents (id, incident_number, title, description, type, severity, status, location, reported_by, reported_at, assigned_to, assigned_at, investigation_notes, resolved_at, resolution, vehicle_reg_no, related_module, tags, evidence, comments)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          inc
        );
      }
    }

    // 8. SEED BILLING INVOICES
    const [existingInvoices] = await connection.query('SELECT COUNT(*) as count FROM invoices');
    if (existingInvoices[0].count === 0) {
      console.log('Seeding invoices...');
      const invs = [
        [
          'inv-rec-1', 'INV-2026-1092', 'CUST-101', 'Aparna Cyber4 Commercial Ltd',
          'Financial District, Nanakramguda, Hyderabad / Pune Branch', 'accounts@aparnacyber4.com', '+91 99887 76655', '27AAACA9928P1Z8',
          JSON.stringify(['trip-001']),
          JSON.stringify([
            { id: 'item-1', description: 'M30 Grade Ready Mix Concrete with Superplasticizer', quantity: 7.5, unit: 'm³', unitPrice: 4850, amount: 36375, taxRate: 18, taxAmount: 6547.5, totalAmount: 42922.5 },
            { id: 'item-2', description: 'Concrete Pump Transit Placement Charge', quantity: 1, unit: 'trip', unitPrice: 3500, amount: 3500, taxRate: 18, taxAmount: 630, totalAmount: 4130 }
          ]),
          39875.0, 7177.5, 0, 47052.5, 0, 47052.5, 'sent', '2026-10-09', '2026-10-24', null, 'Delivery against PO #AP-2026-4401', 'Payment due within 15 days of invoice date.'
        ]
      ];
      for (const inv of invs) {
        await connection.query(
          `INSERT IGNORE INTO invoices (id, invoice_number, customer_id, customer_name, customer_address, customer_email, customer_phone, customer_gst, trip_ids, items, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_amount, status, issue_date, due_date, paid_date, notes, terms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          inv
        );
      }
    }

    // 9. SEED FUEL RECORDS
    const [existingFuel] = await connection.query('SELECT COUNT(*) as count FROM fuel_records');
    if (existingFuel[0].count === 0) {
      console.log('Seeding fuel records...');
      const fuelRecords = [
        ['fuel-1', 'v1', 'MH12AB1234', 'd1', 'Rajesh Kumar', 'trip-001', 'TRP-2026-0891', 'diesel', 140.0, 94.50, 13230.0, 125100, 'HP Auto Care - Hinjawadi Phase 1', 'Pune Highway', 'RCPT-HP-9921', '2026-10-08', 'Tank full prior to long distance pour'],
        ['fuel-2', 'v2', 'MH14CD5678', 'd2', 'Suresh Patil', null, null, 'diesel', 160.0, 94.50, 15120.0, 98000, 'Indian Oil Highway Hub', 'Nigdi Pune', 'RCPT-IOC-4412', '2026-10-07', 'Routine batch refueling']
      ];
      for (const fr of fuelRecords) {
        await connection.query(
          `INSERT IGNORE INTO fuel_records (id, vehicle_id, vehicle_reg_no, driver_id, driver_name, trip_id, trip_number, fuel_type, quantity, price_per_unit, total_cost, odometer_reading, fuel_station, location, receipt_number, date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          fr
        );
      }
    }

    // 10. SEED MAINTENANCE TASKS
    const [existingMaint] = await connection.query('SELECT COUNT(*) as count FROM maintenance_tasks');
    if (existingMaint[0].count === 0) {
      console.log('Seeding maintenance tasks...');
      const maintTasks = [
        ['mt-1', 'v3', 'MH43EF9012', 'corrective', 'Mixer Drum Hydraulic Motor Inspection', 'Hydraulic fluid pressure drop reported during rotation test', 'in_progress', 'high', '2026-10-09 09:00:00', null, 18500.0, null, 'Ganesh Autotech Services', JSON.stringify([{ id: 'p1', name: 'Hydraulic Seal Kit', partNumber: 'HYD-SEAL-42', quantity: 2, unitCost: 3500, totalCost: 7000 }]), 'Replacement seal kit ordered', '2026-11-01', 155000]
      ];
      for (const mt of maintTasks) {
        await connection.query(
          `INSERT IGNORE INTO maintenance_tasks (id, vehicle_id, vehicle_reg_no, type, title, description, status, priority, scheduled_date, completed_date, estimated_cost, actual_cost, technician, parts, notes, next_due_date, next_due_odometer)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          mt
        );
      }
    }

    // 11. SEED AUDIT LOGS
    const [existingAudit] = await connection.query('SELECT COUNT(*) as count FROM audit_logs');
    if (existingAudit[0].count === 0) {
      console.log('Seeding audit logs...');
      const logs = [
        ['aud-1', new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' '), 'gate', 'ANPR_READ', 'MH12AB1234', 'vehicle', JSON.stringify({ id: 'SYS', name: 'ANPR Gate Cam 1', role: 'system' }), 'ANPR detected MH12AB1234 with 96% confidence', 'info', null, null, JSON.stringify({ cameraId: 'cam_gate_1' })],
        ['aud-2', new Date(Date.now() - 1800000).toISOString().slice(0, 19).replace('T', ' '), 'exit', 'ANOMALY_DETECTED', 'EV-2026-001', 'verification', JSON.stringify({ id: 'OP001', name: 'John Operator', role: 'operator' }), 'Gross weight 19,450kg exceeded tolerance (+1.65T)', 'critical', null, null, JSON.stringify({ weightDiff: 1650 })]
      ];
      for (const log of logs) {
        await connection.query(
          `INSERT IGNORE INTO audit_logs (id, timestamp, module, action, entity_id, entity_type, performed_by, details, severity, previous_state, new_state, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          log
        );
      }
    }

    console.log('✅ All module database tables seeded successfully!');
  } finally {
    connection.release();
  }
}
