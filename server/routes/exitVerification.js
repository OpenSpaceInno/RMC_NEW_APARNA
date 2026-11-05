import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatVerification = (row) => ({
  id: row.id,
  verificationId: row.verification_id,
  vehicleRegNo: row.vehicle_reg_no,
  exitTimestamp: row.exit_timestamp,
  exitWeight: Number(row.exit_weight),
  entryWeight: row.entry_weight !== null ? Number(row.entry_weight) : undefined,
  loadingWeight: row.loading_weight !== null ? Number(row.loading_weight) : undefined,
  weightDifference: Number(row.weight_difference),
  plateImages: typeof row.plate_images === 'string' ? JSON.parse(row.plate_images) : (row.plate_images || []),
  status: row.status,
  operatorId: row.operator_id,
  operatorName: row.operator_name,
  remarks: row.remarks,
  anomalyReason: row.anomaly_reason,
  incidentId: row.incident_id,
  createdAt: row.created_at
});

// GET /api/exit-verifications
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = 'SELECT * FROM exit_verifications WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY exit_timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatVerification));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/exit-verifications
router.post('/', async (req, res) => {
  try {
    const ev = req.body;
    const id = ev.id || `ev_${Date.now()}`;
    const verificationId = ev.verificationId || `EV-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO exit_verifications (id, verification_id, vehicle_reg_no, exit_timestamp, exit_weight, entry_weight, loading_weight, weight_difference, plate_images, status, operator_id, operator_name, remarks, anomaly_reason, incident_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, verificationId, ev.vehicleRegNo, ev.exitTimestamp || new Date(),
        ev.exitWeight, ev.entryWeight || null, ev.loadingWeight || null, ev.weightDifference || 0,
        JSON.stringify(ev.plateImages || []), ev.status || 'pending',
        ev.operatorId || 'OP001', ev.operatorName || 'Exit Operator',
        ev.remarks || null, ev.anomalyReason || null, ev.incidentId || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM exit_verifications WHERE id = ?', [id]);
    res.status(201).json(formatVerification(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
