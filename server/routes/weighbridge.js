import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatSession = (row) => ({
  sessionId: row.session_id,
  vehicleRegNo: row.vehicle_reg_no,
  timestamp: row.timestamp,
  tareWeight: row.tare_weight !== null ? Number(row.tare_weight) : null,
  grossWeight: row.gross_weight !== null ? Number(row.gross_weight) : null,
  netWeight: row.net_weight !== null ? Number(row.net_weight) : null,
  driverName: row.driver_name,
  material: row.material,
  destination: row.destination,
  evidence: typeof row.evidence === 'string' ? JSON.parse(row.evidence) : (row.evidence || []),
  status: row.status,
  operatorId: row.operator_id,
  operatorName: row.operator_name
});

// GET /api/weighbridge/sessions
router.get('/sessions', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = 'SELECT * FROM weighbridge_sessions WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatSession));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/weighbridge/sessions/start
router.post('/sessions/start', async (req, res) => {
  try {
    const s = req.body;
    const sessionId = s.sessionId || `WB-${Date.now()}`;
    await pool.query(
      `INSERT INTO weighbridge_sessions (session_id, vehicle_reg_no, tare_weight, gross_weight, net_weight, driver_name, material, destination, evidence, status, operator_id, operator_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId, s.vehicleRegNo, s.tareWeight || null, s.grossWeight || null, s.netWeight || null,
        s.driverName || null, s.material || null, s.destination || null,
        JSON.stringify(s.evidence || []), s.status || 'tare', s.operatorId || 'OP001', s.operatorName || 'Scale Operator'
      ]
    );

    const [created] = await pool.query('SELECT * FROM weighbridge_sessions WHERE session_id = ?', [sessionId]);
    res.status(201).json(formatSession(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/weighbridge/sessions/:id/tare
router.post('/sessions/:id/tare', async (req, res) => {
  try {
    const { tareWeight, evidence } = req.body;
    await pool.query(
      `UPDATE weighbridge_sessions 
       SET tare_weight = ?, status = 'gross', evidence = ?
       WHERE session_id = ?`,
      [tareWeight, JSON.stringify(evidence || []), req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM weighbridge_sessions WHERE session_id = ?', [req.params.id]);
    res.json(formatSession(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/weighbridge/sessions/:id/gross
router.post('/sessions/:id/gross', async (req, res) => {
  try {
    const { grossWeight, evidence, driverName, material, destination } = req.body;
    const [existing] = await pool.query('SELECT * FROM weighbridge_sessions WHERE session_id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Session not found' });

    const tare = Number(existing[0].tare_weight || 0);
    const gross = Number(grossWeight);
    const net = gross - tare;

    await pool.query(
      `UPDATE weighbridge_sessions 
       SET gross_weight = ?, net_weight = ?, status = 'completed', evidence = ?,
           driver_name = COALESCE(?, driver_name),
           material = COALESCE(?, material),
           destination = COALESCE(?, destination)
       WHERE session_id = ?`,
      [gross, net, JSON.stringify(evidence || []), driverName || null, material || null, destination || null, req.params.id]
    );

    // Create weigh slip automatically
    const slipNumber = `WS-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO weigh_slips (slip_number, session_id, vehicle_reg_no, tare_weight, gross_weight, net_weight, material, driver_name, destination, operator_name, evidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slipNumber, req.params.id, existing[0].vehicle_reg_no, tare, gross, net,
        material || existing[0].material || 'RMC Standard Mix',
        driverName || existing[0].driver_name || 'Driver',
        destination || existing[0].destination || 'Customer Site',
        existing[0].operator_name || 'Scale Operator',
        JSON.stringify(evidence || [])
      ]
    );

    const [updated] = await pool.query('SELECT * FROM weighbridge_sessions WHERE session_id = ?', [req.params.id]);
    res.json({
      session: formatSession(updated[0]),
      slipNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/weighbridge/slips/:slipNumber
router.get('/slips/:slipNumber', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM weigh_slips WHERE slip_number = ?', [req.params.slipNumber]);
    if (rows.length === 0) return res.status(404).json({ error: 'Slip not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
