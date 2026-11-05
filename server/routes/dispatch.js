import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatDispatch = (row) => ({
  id: row.id,
  vehicleRegNo: row.vehicle_reg_no,
  timestamp: row.timestamp,
  material: row.material,
  quantity: Number(row.quantity),
  unit: row.unit,
  customer: row.customer,
  documentation: typeof row.documentation === 'string' ? JSON.parse(row.documentation) : (row.documentation || []),
  route: typeof row.route === 'string' ? JSON.parse(row.route) : row.route,
  plateImages: typeof row.plate_images === 'string' ? JSON.parse(row.plate_images) : (row.plate_images || []),
  status: row.status,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at
});

// GET /api/dispatch/pending
router.get('/pending', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dispatches WHERE status = "pending" ORDER BY timestamp DESC');
    res.json(rows.map(formatDispatch));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dispatch
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM dispatches WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY timestamp DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatDispatch));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dispatch
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `disp_${Date.now()}`;
    await pool.query(
      `INSERT INTO dispatches (id, vehicle_reg_no, material, quantity, unit, customer, documentation, route, plate_images, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, d.vehicleRegNo, d.material, d.quantity || 0, d.unit || 'm³', d.customer,
        JSON.stringify(d.documentation || []), JSON.stringify(d.route || null),
        JSON.stringify(d.plateImages || []), d.status || 'pending'
      ]
    );
    const [created] = await pool.query('SELECT * FROM dispatches WHERE id = ?', [id]);
    res.status(201).json(formatDispatch(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dispatch/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const { approvedBy, route } = req.body;
    await pool.query(
      `UPDATE dispatches 
       SET status = 'approved', approved_by = ?, approved_at = NOW(), route = COALESCE(?, route)
       WHERE id = ?`,
      [approvedBy || 'Operations Lead', route ? JSON.stringify(route) : null, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM dispatches WHERE id = ?', [req.params.id]);
    res.json(formatDispatch(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dispatch/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const { reason, rejectedBy } = req.body;
    await pool.query(
      `UPDATE dispatches 
       SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [reason || 'Quality or weight tolerance issue', rejectedBy || 'Supervisor', req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM dispatches WHERE id = ?', [req.params.id]);
    res.json(formatDispatch(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
