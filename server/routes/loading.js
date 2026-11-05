import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatBay = (row) => ({
  id: row.id,
  name: row.name,
  status: row.status,
  currentSession: typeof row.current_session === 'string' ? JSON.parse(row.current_session) : row.current_session,
  capacity: Number(row.capacity),
  location: row.location,
  updatedAt: row.updated_at
});

// GET /api/loading/bays
router.get('/bays', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM loading_bays ORDER BY id ASC');
    res.json(rows.map(formatBay));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/loading/bays/:id/status
router.put('/bays/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE loading_bays SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM loading_bays WHERE id = ?', [req.params.id]);
    res.json(formatBay(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/loading/sessions/start
router.post('/sessions/start', async (req, res) => {
  try {
    const s = req.body;
    const sessionId = s.sessionId || `LOAD-${Date.now()}`;
    await pool.query(
      `INSERT INTO loading_sessions (session_id, bay_id, vehicle_reg_no, mix_design_id, materials, quality_checks, overall_progress, status, operator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId, s.bayId, s.vehicleRegNo, s.mixDesignId || 'M30-STD',
        JSON.stringify(s.materials || []), JSON.stringify(s.qualityChecks || []),
        0, 'in_progress', s.operatorId || 'OP001'
      ]
    );

    // Update bay currentSession and status
    const sessionObj = {
      sessionId,
      bayId: s.bayId,
      vehicleRegNo: s.vehicleRegNo,
      mixDesignId: s.mixDesignId || 'M30-STD',
      startTime: new Date().toISOString(),
      materials: s.materials || [],
      qualityChecks: s.qualityChecks || [],
      overallProgress: 0,
      status: 'in_progress',
      operatorId: s.operatorId || 'OP001'
    };

    await pool.query('UPDATE loading_bays SET status = "loading", current_session = ? WHERE id = ?', [JSON.stringify(sessionObj), s.bayId]);

    res.status(201).json(sessionObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/loading/sessions/:id/progress
router.put('/sessions/:id/progress', async (req, res) => {
  try {
    const { overallProgress, materials, status } = req.body;
    await pool.query(
      `UPDATE loading_sessions 
       SET overall_progress = COALESCE(?, overall_progress),
           materials = COALESCE(?, materials),
           status = COALESCE(?, status)
       WHERE session_id = ?`,
      [overallProgress, materials ? JSON.stringify(materials) : null, status, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM loading_sessions WHERE session_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });

    // Sync to bay current_session
    const bayId = rows[0].bay_id;
    await pool.query('UPDATE loading_bays SET current_session = ? WHERE id = ?', [JSON.stringify(rows[0]), bayId]);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/loading/sessions/:id/complete
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM loading_sessions WHERE session_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });

    const bayId = rows[0].bay_id;
    await pool.query('UPDATE loading_sessions SET status = "completed", end_time = NOW() WHERE session_id = ?', [req.params.id]);
    await pool.query('UPDATE loading_bays SET status = "available", current_session = NULL WHERE id = ?', [bayId]);

    res.json({ success: true, message: 'Loading completed and bay released' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
