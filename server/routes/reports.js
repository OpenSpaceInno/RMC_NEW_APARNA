import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/reports/generated
router.get('/generated', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM generated_reports ORDER BY generated_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reports/generate
router.post('/generate', async (req, res) => {
  try {
    const r = req.body;
    const id = `rep_${Date.now()}`;
    await pool.query(
      `INSERT INTO generated_reports (id, name, type, format, parameters, generated_by, file_url, file_size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, r.name || 'RMC Plant Operations Report', r.type || 'trip_summary', r.format || 'pdf',
        JSON.stringify(r.parameters || {}), r.generatedBy || 'Operations Lead',
        r.fileUrl || '/reports/generated_sample.pdf', r.fileSize || 1024 * 45, 'completed'
      ]
    );

    const [created] = await pool.query('SELECT * FROM generated_reports WHERE id = ?', [id]);
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
