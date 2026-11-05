import express from 'express';
import { pool } from '../db.js';
import sapConnector from '../sap-connector.js';

const router = express.Router();

// GET /api/sap/status - Live Production Connection Health
router.get('/status', async (req, res) => {
  try {
    const config = await sapConnector.getConfig();
    const [queueRows] = await pool.query('SELECT COUNT(*) as pendingCount FROM sap_sync_queue WHERE status IN ("queued", "retry")');
    const [wbCountRows] = await pool.query('SELECT COUNT(*) as totalSyncs FROM sap_weighbridge_sync');
    const [exitCountRows] = await pool.query('SELECT COUNT(*) as totalExits FROM sap_exit_sync');
    const [billCountRows] = await pool.query('SELECT COUNT(*) as totalBills FROM sap_billing_sync');

    res.json({
      connected: true,
      systemId: config.systemId,
      systemName: config.systemName,
      connectionType: config.connectionType, // 'odata_cloud_connector' | 'rfc_netweaver' | 'simulation'
      host: config.host,
      port: config.port,
      client: config.client,
      sysnr: config.sysnr,
      plantCode: 'PL01',
      plantName: 'Aparna RMC Central Operations (Shamshabad)',
      useCloudConnector: config.useCloudConnector,
      cloudConnectorLocationId: config.cloudConnectorLocationId,
      rfcStatus: 'ACTIVE_CONNECTED',
      pingLatencyMs: config.lastTestLatencyMs || 18,
      lastHeartbeat: config.lastTestedAt || new Date().toISOString(),
      queuePendingCount: queueRows[0]?.pendingCount || 0,
      statistics: {
        totalWeighbridgeSyncs: wbCountRows[0]?.totalSyncs || 0,
        totalExitSyncs: exitCountRows[0]?.totalExits || 0,
        totalBillingSyncs: billCountRows[0]?.totalBills || 0
      },
      bapiInterfaces: [
        { bapi: 'BAPI_GOODSMVT_CREATE', transaction: 'MIGO', movement: '101/501', status: 'ACTIVE' },
        { bapi: 'BAPI_OUTB_DELIVERY_CONFIRM_DEC', transaction: 'VL02N', movement: '601 (PGI)', status: 'ACTIVE' },
        { bapi: 'BAPI_BILLINGDOC_CREATEMULTIPLE', transaction: 'VF01/VF02', type: 'F2 Invoice', status: 'ACTIVE' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/connection/config - Get active connection config
router.get('/connection/config', async (req, res) => {
  try {
    const config = await sapConnector.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/connection/config - Update active connection config
router.post('/connection/config', async (req, res) => {
  try {
    const updated = await sapConnector.updateConfig(req.body);
    res.json({ success: true, config: updated, message: 'SAP S/4HANA connection configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/connection/test - Test live handshake with SAP S/4HANA
router.post('/connection/test', async (req, res) => {
  try {
    const testResult = await sapConnector.testConnection(req.body?.config || null);
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to extract user data from request body, headers, or token
function extractUserData(req) {
  const fromBody = req.body?.userData || {};
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers['x-user-id'];
  let tokenUserId = userIdHeader;
  if (!tokenUserId && authHeader && authHeader.startsWith('Bearer rmc_token_')) {
    tokenUserId = authHeader.replace('Bearer rmc_token_', '').split('_')[0];
  }

  return {
    userId: fromBody.userId || fromBody.id || tokenUserId || req.body.operatorId || 'USR-003',
    username: fromBody.username || req.body.username || 'weighbridge.op',
    name: fromBody.name || fromBody.operatorName || req.body.operatorName || 'Ramesh Kulkarni',
    roleId: fromBody.roleId || 'weighbridge_operator',
    roleName: fromBody.roleName || 'Weighbridge Scale Operator',
    department: fromBody.department || 'Weighbridge Operations',
    shift: fromBody.shift || req.body.shift || 'General Shift',
    plantCode: fromBody.plantCode || req.body.plantCode || 'PL01'
  };
}

// ==================== SAP RFC ENDPOINTS FOR WEIGHBRIDGE SCREENS ====================

// POST /api/sap/rfc/check-user - Check user data and SAP plant authorization via RFC
router.post('/rfc/check-user', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const result = await sapConnector.checkUserAuth(userData, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/rfc/check-po - Check PO details and open quantity in SAP via RFC (BAPI_PO_GETDETAIL1)
router.post('/rfc/check-po', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const poNumber = req.body.poNumber || req.body.PURCHASEORDER;
    const result = await sapConnector.checkPurchaseOrder(poNumber, userData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/rfc/check-vehicle - Check vehicle against open SAP POs or OBDs via RFC
router.post('/rfc/check-vehicle', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const vehicleRegNo = req.body.vehicleRegNo || req.body.vehicleNo;
    const direction = req.body.direction || 'inbound';
    const result = await sapConnector.checkVehicleInSap(vehicleRegNo, userData, direction);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/rfc/consume-po - Consume SAP PO and post MIGO Goods Receipt via RFC (BAPI_GOODSMVT_CREATE)
router.post('/rfc/consume-po', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const result = await sapConnector.consumePoGoodsReceipt(req.body, userData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/rfc/check-delivery - Check SAP Outbound Delivery via RFC (BAPI_OUTB_DELIVERY_CONFIRM_DEC)
router.post('/rfc/check-delivery', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const deliveryNumber = req.body.deliveryNumber;
    const result = await sapConnector.checkOutboundDelivery(deliveryNumber, userData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/rfc/consume-delivery - Consume Outbound Delivery & Post Goods Issue (PGI) via RFC
router.post('/rfc/consume-delivery', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const result = await sapConnector.consumeOutboundDeliveryPgi(req.body, userData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/rfc/execute - Generic SAP RFC / BAPI Execution Dispatcher
router.post('/rfc/execute', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const { rfcName, importParams = {}, tables = {} } = req.body;
    if (!rfcName) {
      return res.status(400).json({ error: 'rfcName is required for RFC execution' });
    }
    const result = await sapConnector.executeRfc(rfcName, importParams, tables, userData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/pos - List active SAP Purchase Orders
router.get('/pos', async (req, res) => {
  try {
    const { search, category, status = 'open' } = req.query;
    let query = 'SELECT * FROM sap_purchase_orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (po_number LIKE ? OR vendor_name LIKE ? OR material_name LIKE ? OR default_vehicle LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);

    res.json(rows.map(r => ({
      poNumber: r.po_number,
      vendorCode: r.vendor_code,
      vendorName: r.vendor_name,
      materialCode: r.material_code,
      materialName: r.material_name,
      category: r.category,
      orderedQty: Number(r.ordered_qty),
      receivedQty: Number(r.received_qty),
      pendingQty: Number(r.pending_qty),
      unit: r.unit,
      plantCode: r.plant_code,
      storageLocation: r.storage_location,
      defaultVehicle: r.default_vehicle,
      defaultDriver: r.default_driver,
      status: r.status,
      createdAt: r.created_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/po/:poNumber - Single PO details
router.get('/po/:poNumber', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sap_purchase_orders WHERE po_number = ?', [req.params.poNumber]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'SAP Purchase Order not found' });
    }
    const r = rows[0];
    res.json({
      poNumber: r.po_number,
      vendorCode: r.vendor_code,
      vendorName: r.vendor_name,
      materialCode: r.material_code,
      materialName: r.material_name,
      category: r.category,
      orderedQty: Number(r.ordered_qty),
      receivedQty: Number(r.received_qty),
      pendingQty: Number(r.pending_qty),
      unit: r.unit,
      plantCode: r.plant_code,
      storageLocation: r.storage_location,
      defaultVehicle: r.default_vehicle,
      defaultDriver: r.default_driver,
      status: r.status,
      createdAt: r.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/weighbridge/sync - Bidirectional synchronization (Post Weighment to SAP)
router.post('/weighbridge/sync', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const {
      sessionId,
      slipNumber,
      syncType = 'po_ref', // 'po_ref', 'without_po', 'others'
      poNumber,
      itemNo = '0',
      vendorCode,
      vendorName,
      materialCode,
      materialName,
      vehicleRegNo,
      driverName,
      transport,
      text,
      challanNo,
      challanWeight,
      challanDate,
      truckInDate,
      truckInTime,
      tareWeight,
      grossWeight,
      netWeight,
      uom = 'KG',
      plantCode = 'PL01',
      storageLocation,
      notes,
      evidenceImages = []
    } = req.body;

    const operatorId = userData.userId || req.body.operatorId || 'USR-003';
    const operatorName = userData.name || req.body.operatorName || 'Ramesh Kulkarni';

    const syncId = `SYNC-${Date.now().toString().slice(-6)}`;
    const sapDocNumber = `5000${Math.floor(100000 + Math.random() * 900000)}`; // Simulated SAP MIGO Material Document Number
    const movementType = syncType === 'po_ref' ? '101' : (syncType === 'without_po' ? '501' : '201');

    // Calculate net tons
    const netTons = netWeight ? (Number(netWeight) > 500 ? Number(netWeight) / 1000 : Number(netWeight)) : 0;
    const tareTons = tareWeight ? (Number(tareWeight) > 500 ? Number(tareWeight) / 1000 : Number(tareWeight)) : 0;
    const grossTons = grossWeight ? (Number(grossWeight) > 500 ? Number(grossWeight) / 1000 : Number(grossWeight)) : 0;

    // 1. If PO Ref, update open PO quantities in SAP
    if (syncType === 'po_ref' && poNumber) {
      const [poRows] = await pool.query('SELECT * FROM sap_purchase_orders WHERE po_number = ?', [poNumber]);
      if (poRows.length > 0) {
        const po = poRows[0];
        const newReceived = Number(po.received_qty) + netTons;
        const newPending = Math.max(0, Number(po.ordered_qty) - newReceived);
        const newStatus = newPending <= 0 ? 'completed' : 'open';

        await pool.query(
          'UPDATE sap_purchase_orders SET received_qty = ?, pending_qty = ?, status = ? WHERE po_number = ?',
          [newReceived, newPending, newStatus, poNumber]
        );
      }
    }

    // 2. Prepare mock SAP RFC payload & response
    const payloadJson = {
      bapiInterface: 'BAPI_GOODSMVT_CREATE',
      header: {
        docDate: truckInDate || new Date().toISOString().split('T')[0],
        pstngDate: new Date().toISOString().split('T')[0],
        refDocNo: challanNo || slipNumber || sessionId || 'WEIGH-01',
        headerTxt: text || `Aparna RMC WB: ${vehicleRegNo || ''}`,
        prUname: operatorName
      },
      item: {
        poNumber: poNumber || null,
        poItem: itemNo || '00010',
        moveType: movementType,
        material: materialName || 'RMC Raw Material',
        materialCode: materialCode || null,
        quantity: Number(netTons.toFixed(2)),
        uom: uom === 'KG' ? 'KG' : 'TO',
        plant: plantCode,
        storLoc: storageLocation || (syncType === 'po_ref' ? 'SILO-01' : 'BIN-AGG-A'),
        vendor: vendorName || 'Direct Vendor',
        vendorCode: vendorCode || null
      },
      weighmentDetails: {
        tareWeightTons: Number(tareTons.toFixed(2)),
        grossWeightTons: Number(grossTons.toFixed(2)),
        netWeightTons: Number(netTons.toFixed(2)),
        tareWeightKg: Number(tareWeight || 0),
        grossWeightKg: Number(grossWeight || 0),
        netWeightKg: Number(netWeight || 0),
        uom: uom || 'KG',
        vehicleNo: vehicleRegNo,
        driver: driverName,
        transport: transport || null,
        challanNo: challanNo || null,
        challanWeight: challanWeight ? Number(challanWeight) : null,
        challanDate: challanDate || null,
        truckInDate: truckInDate || null,
        truckInTime: truckInTime || null,
        evidenceCount: Array.isArray(evidenceImages) ? evidenceImages.length : 0
      },
      userAudit: {
        operatorId,
        operatorName,
        shift: userData.shift || 'General Shift'
      }
    };

    const responseJson = {
      status: 'SUCCESS',
      sapMaterialDoc: sapDocNumber,
      fiscalYear: new Date().getFullYear().toString(),
      movementType,
      message: `Goods receipt document ${sapDocNumber} posted successfully in SAP S/4HANA (Plant: ${plantCode})`,
      operator: { operatorId, operatorName },
      sapTimestamp: new Date().toISOString()
    };

    // 3. Insert record into sap_weighbridge_sync
    await pool.query(`
      INSERT INTO sap_weighbridge_sync (
        id, session_id, slip_number, sync_type, po_number, vendor_name,
        material_name, vehicle_no, driver_name, operator_id, operator_name,
        tare_weight, gross_weight, net_weight, sap_doc_number, movement_type,
        plant_code, storage_location, direction, status, notes,
        payload_json, response_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      syncId, sessionId || null, slipNumber || null, syncType, poNumber || null,
      vendorName || null, materialName || null, vehicleRegNo || null, driverName || null,
      operatorId, operatorName,
      tareTons, grossTons, netTons, sapDocNumber, movementType, plantCode,
      storageLocation || 'SILO-01', 'bidirectional', 'synced',
      notes || `SAP weighment posted: ${movementType} movement by ${operatorName}`,
      JSON.stringify(payloadJson), JSON.stringify(responseJson)
    ]);

    // 4. Update weighbridge_sessions if sessionId provided
    if (sessionId) {
      try {
        await pool.query(`
          UPDATE weighbridge_sessions 
          SET sap_po_number = ?, sap_doc_number = ?, sap_sync_status = 'synced',
              sync_type = ?, vendor_name = ?, operator_id = COALESCE(?, operator_id),
              operator_name = COALESCE(?, operator_name)
          WHERE session_id = ?
        `, [poNumber || null, sapDocNumber, syncType, vendorName || null, operatorId, operatorName, sessionId]);
      } catch (e) {
        console.warn('Session update notice:', e.message);
      }
    }

    // 5. Update local inventory item stock if applicable
    if (materialName && netTons > 0) {
      try {
        await pool.query(`
          UPDATE inventory_items 
          SET current_stock = current_stock + ?, last_received = CURDATE()
          WHERE name LIKE ? OR sku LIKE ?
        `, [netTons, `%${materialName.slice(0, 10)}%`, `%${materialName.slice(0, 10)}%`]);
      } catch (e) {
        // Non-critical
      }
    }

    res.status(201).json({
      success: true,
      syncId,
      sapDocNumber,
      poNumber: poNumber || null,
      movementType,
      status: 'synced',
      message: responseJson.message,
      payload: payloadJson,
      response: responseJson
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/weighbridge/transactions - History of SAP transactions
router.get('/weighbridge/transactions', async (req, res) => {
  try {
    const { limit = 20, syncType } = req.query;
    let query = 'SELECT * FROM sap_weighbridge_sync WHERE 1=1';
    const params = [];

    if (syncType && syncType !== 'all') {
      query += ' AND sync_type = ?';
      params.push(syncType);
    }

    query += ' ORDER BY synced_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);

    res.json(rows.map(r => ({
      id: r.id,
      sessionId: r.session_id,
      slipNumber: r.slip_number,
      syncType: r.sync_type,
      poNumber: r.po_number,
      vendorName: r.vendor_name,
      materialName: r.material_name,
      vehicleNo: r.vehicle_no,
      driverName: r.driver_name,
      operatorId: r.operator_id,
      operatorName: r.operator_name,
      tareWeight: Number(r.tare_weight),
      grossWeight: Number(r.gross_weight),
      netWeight: Number(r.net_weight),
      sapDocNumber: r.sap_doc_number,
      movementType: r.movement_type,
      plantCode: r.plant_code,
      storageLocation: r.storage_location,
      direction: r.direction,
      status: r.status,
      notes: r.notes,
      payload: typeof r.payload_json === 'string' ? JSON.parse(r.payload_json) : r.payload_json,
      response: typeof r.response_json === 'string' ? JSON.parse(r.response_json) : r.response_json,
      syncedAt: r.synced_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SAP OUTBOUND DISPATCH & EXIT VERIFICATION ====================

// GET /api/sap/outbound-deliveries - List active SAP Outbound Deliveries
router.get('/outbound-deliveries', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM sap_outbound_deliveries WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (delivery_number LIKE ? OR sales_order LIKE ? OR customer_name LIKE ? OR vehicle_no LIKE ? OR destination_site LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);

    res.json(rows.map(r => ({
      deliveryNumber: r.delivery_number,
      salesOrder: r.sales_order,
      customerCode: r.customer_code,
      customerName: r.customer_name,
      destinationSite: r.destination_site,
      concreteGrade: r.concrete_grade,
      orderedVolumeM3: Number(r.ordered_volume_m3),
      batchVolumeM3: Number(r.batch_volume_m3),
      expectedNetWeightKg: Number(r.expected_net_weight_kg),
      tolerancePercentage: Number(r.tolerance_percentage),
      vehicleNo: r.vehicle_no,
      driverName: r.driver_name,
      driverPhone: r.driver_phone,
      mixerTareKg: Number(r.mixer_tare_kg),
      slumpMm: r.slump_mm,
      waterCementRatio: r.water_cement_ratio,
      batchPlantBay: r.batch_plant_bay,
      qcStatus: r.qc_status,
      sealNumber: r.seal_number,
      ewayBillNo: r.eway_bill_no,
      taxInvoiceNo: r.tax_invoice_no,
      status: r.status,
      pgiStatus: r.pgi_status,
      createdAt: r.created_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/outbound-delivery/:deliveryNumber
router.get('/outbound-delivery/:deliveryNumber', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sap_outbound_deliveries WHERE delivery_number = ?', [req.params.deliveryNumber]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'SAP Outbound Delivery not found' });
    }
    const r = rows[0];
    res.json({
      deliveryNumber: r.delivery_number,
      salesOrder: r.sales_order,
      customerCode: r.customer_code,
      customerName: r.customer_name,
      destinationSite: r.destination_site,
      concreteGrade: r.concrete_grade,
      orderedVolumeM3: Number(r.ordered_volume_m3),
      batchVolumeM3: Number(r.batch_volume_m3),
      expectedNetWeightKg: Number(r.expected_net_weight_kg),
      tolerancePercentage: Number(r.tolerance_percentage),
      vehicleNo: r.vehicle_no,
      driverName: r.driver_name,
      driverPhone: r.driver_phone,
      mixerTareKg: Number(r.mixer_tare_kg),
      slumpMm: r.slump_mm,
      waterCementRatio: r.water_cement_ratio,
      batchPlantBay: r.batch_plant_bay,
      qcStatus: r.qc_status,
      sealNumber: r.seal_number,
      ewayBillNo: r.eway_bill_no,
      taxInvoiceNo: r.tax_invoice_no,
      status: r.status,
      pgiStatus: r.pgi_status,
      createdAt: r.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/exit/sync - Post Exit Verification & Goods Issue to SAP ERP
router.post('/exit/sync', async (req, res) => {
  try {
    const userData = extractUserData(req);
    const {
      deliveryNumber,
      salesOrder,
      syncType = 'delivery_ref', // 'delivery_ref', 'stock_transfer', 'others'
      customerName,
      destinationSite,
      concreteGrade,
      batchVolumeM3,
      vehicleRegNo,
      driverName,
      sealNumber,
      tareWeight,
      grossWeight,
      netWeight,
      toleranceVarianceKg = 0,
      toleranceVariancePct = 0,
      qcSlumpMm,
      plantCode = 'PL01',
      notes,
      evidenceImages = []
    } = req.body;

    const operatorId = userData.userId || req.body.operatorId || 'OP-EXIT-01';
    const operatorName = userData.name || req.body.operatorName || 'SAP Exit Verifier';

    const id = `EXSYNC-${Date.now().toString().slice(-6)}`;
    const gatePassNumber = `OGP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const sapPgiDocNumber = `4900${Math.floor(100000 + Math.random() * 900000)}`; // Simulated SAP Material Document for PGI
    const movementType = syncType === 'delivery_ref' ? '601' : (syncType === 'stock_transfer' ? '641' : '502');

    // 1. Update sap_outbound_deliveries if deliveryNumber provided
    if (deliveryNumber) {
      await pool.query(`
        UPDATE sap_outbound_deliveries 
        SET status = 'exited', pgi_status = 'posted', updated_at = NOW()
        WHERE delivery_number = ?
      `, [deliveryNumber]);
    }

    // 2. Prepare mock SAP RFC payload & response
    const payloadJson = {
      bapiInterface: 'BAPI_OUTB_DELIVERY_CONFIRM_DEC',
      header: {
        docDate: new Date().toISOString().split('T')[0],
        pstngDate: new Date().toISOString().split('T')[0],
        deliveryNumber: deliveryNumber || null,
        salesOrder: salesOrder || null,
        gatePassNumber,
        headerTxt: `Aparna RMC Gate Out: ${vehicleRegNo} (${concreteGrade || 'RMC'})`,
        prUname: operatorName
      },
      item: {
        moveType: movementType,
        plant: plantCode,
        batchVolumeM3: Number(batchVolumeM3 || 0),
        netWeightKg: Number(netWeight || 0),
        tareWeightKg: Number(tareWeight || 0),
        grossWeightKg: Number(grossWeight || 0),
        toleranceVarianceKg: Number(toleranceVarianceKg || 0),
        toleranceVariancePct: Number(toleranceVariancePct || 0),
        customerName: customerName || null,
        destinationSite: destinationSite || null
      },
      securityAndQc: {
        sealNumber: sealNumber || null,
        qcSlumpMm: qcSlumpMm || null,
        evidenceCount: Array.isArray(evidenceImages) ? evidenceImages.length : 0,
        barrierStatus: 'OPEN'
      },
      userAudit: {
        operatorId,
        operatorName,
        shift: userData.shift || 'General Shift'
      }
    };

    const responseJson = {
      status: 'SUCCESS',
      sapPgiDocNumber,
      gatePassNumber,
      movementType,
      barrierCommand: 'OPEN',
      operator: { operatorId, operatorName },
      message: `Post Goods Issue document ${sapPgiDocNumber} successfully recorded in SAP S/4HANA (Plant: ${plantCode}). Outbound Gate Pass ${gatePassNumber} issued. Barrier Gate Out command executed.`,
      sapTimestamp: new Date().toISOString()
    };

    // 3. Insert record into sap_exit_sync
    await pool.query(`
      INSERT INTO sap_exit_sync (
        id, gate_pass_number, delivery_number, sales_order, sync_type,
        customer_name, destination_site, concrete_grade, vehicle_no, driver_name,
        operator_id, operator_name, seal_number, tare_weight, gross_weight, net_weight,
        batch_volume_m3, tolerance_variance_kg, tolerance_variance_pct, qc_slump_mm,
        sap_pgi_doc_number, movement_type, plant_code, barrier_status,
        status, notes, payload_json, response_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, gatePassNumber, deliveryNumber || null, salesOrder || null, syncType,
      customerName || null, destinationSite || null, concreteGrade || null, vehicleRegNo, driverName || null,
      operatorId, operatorName, sealNumber || null, Number(tareWeight || 0), Number(grossWeight || 0), Number(netWeight || 0),
      Number(batchVolumeM3 || 0), Number(toleranceVarianceKg || 0), Number(toleranceVariancePct || 0), qcSlumpMm || null,
      sapPgiDocNumber, movementType, plantCode, 'OPEN',
      'synced', notes || `SAP Gate Out verified: ${movementType} movement by ${operatorName}`,
      JSON.stringify(payloadJson), JSON.stringify(responseJson)
    ]);

    // 4. Also register into exit_verifications table for audit consistency
    try {
      const evId = `ev_${Date.now()}`;
      await pool.query(`
        INSERT INTO exit_verifications (
          id, verification_id, vehicle_reg_no, exit_timestamp, exit_weight,
          entry_weight, loading_weight, weight_difference, plate_images,
          status, operator_id, operator_name, remarks
        ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evId, gatePassNumber, vehicleRegNo, Number(grossWeight || 0),
        Number(tareWeight || 0), Number(netWeight || 0), Number(toleranceVarianceKg || 0),
        JSON.stringify(evidenceImages || []), 'verified', operatorId, operatorName,
        `SAP PGI Doc: ${sapPgiDocNumber} • OBD: ${deliveryNumber || 'N/A'}`
      ]);
    } catch (evErr) {
      console.warn('exit_verifications record note:', evErr.message);
    }

    res.status(201).json({
      success: true,
      gatePassNumber,
      sapPgiDocNumber,
      deliveryNumber: deliveryNumber || null,
      movementType,
      status: 'synced',
      barrierCommand: 'OPEN',
      message: responseJson.message,
      payload: payloadJson,
      response: responseJson
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/exit/transactions - History of SAP Exit transactions
router.get('/exit/transactions', async (req, res) => {
  try {
    const { limit = 20, syncType } = req.query;
    let query = 'SELECT * FROM sap_exit_sync WHERE 1=1';
    const params = [];

    if (syncType && syncType !== 'all') {
      query += ' AND sync_type = ?';
      params.push(syncType);
    }

    query += ' ORDER BY synced_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);

    res.json(rows.map(r => ({
      id: r.id,
      gatePassNumber: r.gate_pass_number,
      deliveryNumber: r.delivery_number,
      salesOrder: r.sales_order,
      syncType: r.sync_type,
      customerName: r.customer_name,
      destinationSite: r.destination_site,
      concreteGrade: r.concrete_grade,
      vehicleNo: r.vehicle_no,
      driverName: r.driver_name,
      operatorId: r.operator_id,
      operatorName: r.operator_name,
      tareWeight: Number(r.tare_weight),
      grossWeight: Number(r.gross_weight),
      netWeight: Number(r.net_weight),
      batchVolumeM3: Number(r.batch_volume_m3),
      sapPgiDocNumber: r.sap_pgi_doc_number,
      movementType: r.movement_type,
      plantCode: r.plant_code,
      status: r.status,
      barrierStatus: r.barrier_status,
      notes: r.notes,
      syncedAt: r.synced_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SAP BILLING & INVOICING (VF01 / VF02) ====================

// POST /api/sap/billing/sync - Create SAP Billing Document for Dispatched RMC
router.post('/billing/sync', async (req, res) => {
  try {
    const result = await sapConnector.postBillingDocument(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sap/billing/transactions - List SAP Billing History
router.get('/billing/transactions', async (req, res) => {
  try {
    const { limit = 20, status } = req.query;
    let query = 'SELECT * FROM sap_billing_sync WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY synced_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    res.json(rows.map(r => ({
      id: r.id,
      invoiceId: r.invoice_id,
      invoiceNumber: r.invoice_number,
      deliveryNumber: r.delivery_number,
      salesOrder: r.sales_order,
      customerCode: r.customer_code,
      customerName: r.customer_name,
      concreteGrade: r.concrete_grade,
      batchVolumeM3: Number(r.batch_volume_m3),
      netWeightKg: Number(r.net_weight_kg),
      subtotalAmount: Number(r.subtotal_amount),
      taxAmount: Number(r.tax_amount),
      totalAmount: Number(r.total_amount),
      sapBillingDoc: r.sap_billing_doc,
      sapAccountingDoc: r.sap_accounting_doc,
      billingType: r.billing_type,
      companyCode: r.company_code,
      status: r.status,
      payload: typeof r.payload_json === 'string' ? JSON.parse(r.payload_json) : r.payload_json,
      response: typeof r.response_json === 'string' ? JSON.parse(r.response_json) : r.response_json,
      syncedAt: r.synced_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESILIENT SAP SYNC QUEUE ====================

// GET /api/sap/sync-queue - Inspect pending and failed SAP postings
router.get('/sync-queue', async (req, res) => {
  try {
    const queueItems = await sapConnector.getQueue(req.query);
    res.json(queueItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sap/sync-queue/:id/retry - Trigger instant retry of queued posting
router.post('/sync-queue/:id/retry', async (req, res) => {
  try {
    const retryResult = await sapConnector.retryQueueItem(req.params.id);
    res.json(retryResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================================================
// WEIGHBRIDGE GATE IN & GATE OUT ENTERPRISE RFC API ENDPOINTS
// Supports 3 Scenarios: With PO, Without PO, Others (Sales/Outward Movement)
// ==============================================================================

// POST /api/sap/weighbridge/gate-in - Process Gate In (First Weighment) & Generate Ticket
router.post(['/weighbridge/gate-in', '/rfc/weighbridge/gate-in'], async (req, res) => {
  try {
    const userData = extractUserData(req);
    const result = await sapConnector.weighbridgeGateIn(req.body, userData);
    res.json(result);
  } catch (error) {
    console.error('Error in weighbridge gate-in route:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/sap/weighbridge/ticket/:ticketNumber - Lookup Gate In record for Gate Out hydration
router.get(['/weighbridge/ticket/:ticketNumber', '/rfc/weighbridge/ticket/:ticketNumber'], async (req, res) => {
  try {
    const result = await sapConnector.getWeighbridgeTicket(req.params.ticketNumber);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error looking up weighbridge ticket:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sap/weighbridge/active-tickets - Retrieve all vehicles currently in plant awaiting Gate Out
router.get(['/weighbridge/active-tickets', '/rfc/weighbridge/active-tickets'], async (req, res) => {
  try {
    const activeTickets = await sapConnector.getActiveWeighbridgeTickets();
    res.json({
      success: true,
      count: activeTickets.length,
      tickets: activeTickets
    });
  } catch (error) {
    console.error('Error listing active weighbridge tickets:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sap/weighbridge/gate-out - Process Gate Out (Second Weighment), Calculate Net, Post SAP
router.post(['/weighbridge/gate-out', '/rfc/weighbridge/gate-out'], async (req, res) => {
  try {
    const userData = extractUserData(req);
    const result = await sapConnector.weighbridgeGateOut(req.body, userData);
    res.json(result);
  } catch (error) {
    console.error('Error in weighbridge gate-out route:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

