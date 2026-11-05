import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatIncident = (row) => ({
  id: row.id,
  incidentNumber: row.incident_number,
  title: row.title,
  description: row.description,
  type: row.type,
  severity: row.severity,
  status: row.status,
  location: row.location,
  reportedBy: row.reported_by,
  reportedAt: row.reported_at,
  assignedTo: row.assigned_to,
  assignedAt: row.assigned_at,
  investigationNotes: row.investigation_notes,
  resolvedAt: row.resolved_at,
  resolution: row.resolution,
  vehicleRegNo: row.vehicle_reg_no,
  relatedModule: row.related_module,
  tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
  evidence: typeof row.evidence === 'string' ? JSON.parse(row.evidence) : (row.evidence || []),
  comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : (row.comments || []),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/incidents
router.get('/', async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    if (type) { query += ' AND type = ?'; params.push(type); }
    query += ' ORDER BY reported_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatIncident));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/incidents/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json(formatIncident(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/incidents
router.post('/', async (req, res) => {
  try {
    const inc = req.body;
    const id = inc.id || `inc_${Date.now()}`;
    const incidentNumber = inc.incidentNumber || `INC-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO incidents (id, incident_number, title, description, type, severity, status, location, reported_by, reported_at, vehicle_reg_no, related_module, tags, evidence, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, incidentNumber, inc.title, inc.description, inc.type, inc.severity,
        inc.status || 'reported', inc.location || 'Plant Grounds', inc.reportedBy || 'Staff',
        inc.reportedAt || new Date(), inc.vehicleRegNo || null, inc.relatedModule || 'operational',
        JSON.stringify(inc.tags || []), JSON.stringify(inc.evidence || []), JSON.stringify(inc.comments || [])
      ]
    );

    const [created] = await pool.query('SELECT * FROM incidents WHERE id = ?', [id]);
    res.status(201).json(formatIncident(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/incidents/:id
router.put('/:id', async (req, res) => {
  try {
    const inc = req.body;
    const updates = [];
    const params = [];

    const fieldMap = {
      title: 'title',
      description: 'description',
      type: 'type',
      severity: 'severity',
      status: 'status',
      location: 'location',
      assignedTo: 'assigned_to',
      investigationNotes: 'investigation_notes',
      resolution: 'resolution'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (inc[key] !== undefined) {
        updates.push(`${col} = ?`);
        params.push(inc[key]);
      }
    }

    if (inc.status === 'resolved') {
      updates.push('resolved_at = NOW()');
    }
    if (inc.comments) {
      updates.push('comments = ?');
      params.push(JSON.stringify(inc.comments));
    }
    if (inc.evidence) {
      updates.push('evidence = ?');
      params.push(JSON.stringify(inc.evidence));
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      await pool.query(`UPDATE incidents SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updated] = await pool.query('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    res.json(formatIncident(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/incidents/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const { comment, userId, userName } = req.body;
    const [rows] = await pool.query('SELECT comments FROM incidents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const comments = typeof rows[0].comments === 'string' ? JSON.parse(rows[0].comments) : (rows[0].comments || []);
    const newComment = {
      id: `comm_${Date.now()}`,
      userId: userId || 'U001',
      userName: userName || 'Supervisor',
      comment,
      timestamp: new Date().toISOString()
    };
    comments.push(newComment);

    await pool.query('UPDATE incidents SET comments = ? WHERE id = ?', [JSON.stringify(comments), req.params.id]);
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
