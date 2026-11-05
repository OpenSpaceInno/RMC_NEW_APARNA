import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const formatTrip = (row) => ({
  id: row.id,
  tripNumber: row.trip_number,
  vehicleId: row.vehicle_id,
  vehicleRegNo: row.vehicle_reg_no,
  driverId: row.driver_id,
  driverName: row.driver_name,
  driverPhone: row.driver_phone,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerContact: row.customer_contact,
  material: row.material,
  quantity: Number(row.quantity),
  unit: row.unit,
  origin: typeof row.origin === 'string' ? JSON.parse(row.origin) : row.origin,
  destination: typeof row.destination === 'string' ? JSON.parse(row.destination) : row.destination,
  waypoints: typeof row.waypoints === 'string' ? JSON.parse(row.waypoints) : (row.waypoints || []),
  scheduledStartTime: row.scheduled_start_time,
  actualStartTime: row.actual_start_time,
  estimatedArrival: row.estimated_arrival,
  actualArrival: row.actual_arrival,
  completedAt: row.completed_at,
  status: row.status,
  totalDistance: Number(row.total_distance),
  distanceCovered: Number(row.distance_covered),
  distanceRemaining: Number(row.distance_remaining),
  currentLocation: typeof row.current_location === 'string' ? JSON.parse(row.current_location) : row.current_location,
  gpsConfig: typeof row.gps_config === 'string' ? JSON.parse(row.gps_config) : (row.gps_config || { isEnabled: true, trackingInterval: 15 }),
  notes: row.notes,
  priority: row.priority,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/trips
router.get('/', async (req, res) => {
  try {
    const { status, vehicleRegNo } = req.query;
    let query = 'SELECT * FROM trips WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (vehicleRegNo) { query += ' AND vehicle_reg_no = ?'; params.push(vehicleRegNo); }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(formatTrip));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const [events] = await pool.query('SELECT * FROM trip_events WHERE trip_id = ? ORDER BY timestamp DESC', [req.params.id]);
    res.json({
      ...formatTrip(rows[0]),
      events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips
router.post('/', async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || `trip_${Date.now()}`;
    const tripNumber = t.tripNumber || `TRP-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO trips (id, trip_number, vehicle_id, vehicle_reg_no, driver_id, driver_name, driver_phone, customer_id, customer_name, customer_contact, material, quantity, unit, origin, destination, waypoints, scheduled_start_time, actual_start_time, estimated_arrival, status, total_distance, distance_covered, distance_remaining, current_location, gps_config, notes, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tripNumber, t.vehicleId || null, t.vehicleRegNo, t.driverId || null, t.driverName, t.driverPhone,
        t.customerId || 'CUST-001', t.customerName, t.customerContact || null, t.material, t.quantity || 0, t.unit || 'm³',
        JSON.stringify(t.origin || {}), JSON.stringify(t.destination || {}), JSON.stringify(t.waypoints || []),
        t.scheduledStartTime || new Date(), t.actualStartTime || null, t.estimatedArrival || null,
        t.status || 'scheduled', t.totalDistance || 0, t.distanceCovered || 0, t.distanceRemaining || (t.totalDistance || 0),
        JSON.stringify(t.currentLocation || null), JSON.stringify(t.gpsConfig || { isEnabled: true, trackingInterval: 15 }),
        t.notes || null, t.priority || 'normal'
      ]
    );

    const [created] = await pool.query('SELECT * FROM trips WHERE id = ?', [id]);
    res.status(201).json(formatTrip(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/trips/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updates = ['status = ?'];
    const params = [status];
    if (status === 'in_transit') updates.push('actual_start_time = COALESCE(actual_start_time, NOW())');
    if (status === 'completed') updates.push('completed_at = NOW()');

    params.push(req.params.id);
    await pool.query(`UPDATE trips SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
    res.json(formatTrip(updated[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/location (Live GPS telemetry)
router.post('/:id/location', async (req, res) => {
  try {
    const { latitude, longitude, speed, distanceCovered, distanceRemaining } = req.body;
    const locObj = {
      latitude,
      longitude,
      speed: speed || 0,
      timestamp: new Date().toISOString()
    };

    await pool.query(
      `UPDATE trips 
       SET current_location = ?,
           distance_covered = COALESCE(?, distance_covered),
           distance_remaining = COALESCE(?, distance_remaining)
       WHERE id = ?`,
      [JSON.stringify(locObj), distanceCovered, distanceRemaining, req.params.id]
    );

    res.json({ success: true, location: locObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trips WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
