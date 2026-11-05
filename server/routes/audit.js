import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatAudit = (row) => ({
  id: row.id,
  timestamp: row.timestamp,
  module: row.module,
  action: row.action,
  entityId: row.entity_id,
  entityType: row.entity_type,
  performedBy: typeof row.performed_by === 'string' ? JSON.parse(row.performed_by) : row.performed_by,
  details: row.details,
  severity: row.severity,
  previousState: typeof row.previous_state === 'string' ? JSON.parse(row.previous_state) : row.previous_state,
  newState: typeof row.new_state === 'string' ? JSON.parse(row.new_state) : row.new_state,
  metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
});

// GET /api/audit-logs
router.get('/', async (req, res) => {
  try {
    const { module, severity, limit = 100 } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (module) { query += ' AND module = ?'; params.push(module); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatAudit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/audit-logs
router.post('/', async (req, res) => {
  try {
    const a = req.body;
    const id = a.id || `aud_${Date.now()}`;
    await pool.query(
      `INSERT INTO audit_logs (id, module, action, entity_id, entity_type, performed_by, details, severity, previous_state, new_state, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, a.module || 'system', a.action || 'UPDATE', a.entityId || null, a.entityType || null,
        JSON.stringify(a.performedBy || { id: 'U001', name: 'User', role: 'operator' }),
        a.details || '', a.severity || 'info',
        JSON.stringify(a.previousState || null), JSON.stringify(a.newState || null), JSON.stringify(a.metadata || {})
      ]
    );

    const [created] = await pool.query('SELECT * FROM audit_logs WHERE id = ?', [id]);
    res.status(201).json(formatAudit(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
