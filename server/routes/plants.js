import express from 'express';
import { pool } from '../db.js';
import { getRequestUser, isSuperAdminUser } from '../auth-security.js';
import ftpService from '../ftp-service.js';

const router = express.Router();

// Fallback seed plants in case DB table is being initialized
let memoryPlants = [
  {
    id: 'PL01',
    code: 'PLANT_001',
    name: 'Plant 01 • Shamshabad Central',
    location: 'Plot 42, Hardware Park, Shamshabad',
    city: 'Hyderabad',
    capacityPerHour: 120,
    contactPerson: 'K. V. Rao',
    contactPhone: '+91 98490 12345',
    contactEmail: 'shamshabad.plant@aparna-rmc.com',
    status: 'active',
    userCount: 8,
    activeSessions: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PL02',
    code: 'PLANT_002',
    name: 'Plant 02 • Miyapur Metro',
    location: 'Sy. No. 108, IDA Bollaram Rd, Miyapur',
    city: 'Hyderabad',
    capacityPerHour: 90,
    contactPerson: 'S. N. Reddy',
    contactPhone: '+91 98490 23456',
    contactEmail: 'miyapur.plant@aparna-rmc.com',
    status: 'active',
    userCount: 5,
    activeSessions: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PL03',
    code: 'PLANT_003',
    name: 'Plant 03 • Gachibowli Tech Zone',
    location: 'Nanakramguda Financial District',
    city: 'Hyderabad',
    capacityPerHour: 150,
    contactPerson: 'P. Srinivas',
    contactPhone: '+91 98490 34567',
    contactEmail: 'gachibowli.plant@aparna-rmc.com',
    status: 'active',
    userCount: 6,
    activeSessions: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PL04',
    code: 'PLANT_004',
    name: 'Plant 04 • Medchal Industrial',
    location: 'Phase-II IDA, Medchal Highway',
    city: 'Hyderabad',
    capacityPerHour: 60,
    contactPerson: 'V. Raman',
    contactPhone: '+91 98490 45678',
    contactEmail: 'medchal.plant@aparna-rmc.com',
    status: 'maintenance',
    userCount: 3,
    activeSessions: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper to format a database row
const formatPlantRow = (r, userCount = 0) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  location: r.location,
  city: r.city || 'Hyderabad',
  capacityPerHour: Number(r.capacity_per_hour || 120),
  contactPerson: r.contact_person,
  contactPhone: r.contact_phone,
  contactEmail: r.contact_email,
  status: r.status || 'active',
  userCount: Number(r.user_count !== undefined ? r.user_count : userCount),
  activeSessions: Number(r.active_sessions || 0),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

// Ensure plants table exists in MySQL
let tableInitialized = false;
async function ensurePlantsTable() {
  if (tableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plants (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        location VARCHAR(255) NOT NULL,
        city VARCHAR(64) DEFAULT 'Hyderabad',
        capacity_per_hour INT DEFAULT 120,
        contact_person VARCHAR(128),
        contact_phone VARCHAR(32),
        contact_email VARCHAR(128),
        status VARCHAR(32) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_plants_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Ensure users table has plant_id & plant_name columns
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN plant_id VARCHAR(64) DEFAULT 'PL01'`);
    } catch (e) {}
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN plant_name VARCHAR(128) DEFAULT 'Plant 01 • Shamshabad Central'`);
    } catch (e) {}

    // Check if initial plants exist; if not seed them
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM plants');
    if (existing[0]?.cnt === 0) {
      for (const p of memoryPlants) {
        await pool.query(
          `INSERT INTO plants (id, code, name, location, city, capacity_per_hour, contact_person, contact_phone, contact_email, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.code, p.name, p.location, p.city, p.capacityPerHour, p.contactPerson, p.contactPhone, p.contactEmail, p.status]
        );
      }
    }
    tableInitialized = true;
  } catch (err) {
    console.warn('Note: Using memory fallback for plants table initialization:', err.message);
  }
}

// GET /api/plants
router.get('/', async (req, res) => {
  await ensurePlantsTable();
  try {
    const { status, search } = req.query;
    let query = `
      SELECT p.*, COUNT(u.id) as user_count 
      FROM plants p 
      LEFT JOIN users u ON (u.plant_id = p.id OR u.plant_id = 'all')
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.location LIKE ? OR p.city LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' GROUP BY p.id ORDER BY p.code ASC';

    const [rows] = await pool.query(query, params);
    if (rows && rows.length > 0) {
      return res.json(rows.map(r => formatPlantRow(r)));
    }
    
    // Return memoryPlants fallback if DB empty
    let filtered = memoryPlants;
    if (status && status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        p.location.toLowerCase().includes(q)
      );
    }
    res.json(filtered);
  } catch (error) {
    res.json(memoryPlants);
  }
});

// GET /api/plants/:id
router.get('/:id', async (req, res) => {
  await ensurePlantsTable();
  try {
    const [rows] = await pool.query(
      `SELECT p.*, COUNT(u.id) as user_count 
       FROM plants p 
       LEFT JOIN users u ON u.plant_id = p.id 
       WHERE p.id = ? 
       GROUP BY p.id`,
      [req.params.id]
    );

    if (rows.length > 0) {
      return res.json(formatPlantRow(rows[0]));
    }

    const found = memoryPlants.find(p => p.id === req.params.id);
    if (found) return res.json(found);

    res.status(404).json({ error: 'Plant not found' });
  } catch (error) {
    const found = memoryPlants.find(p => p.id === req.params.id);
    if (found) return res.json(found);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/plants
router.post('/', async (req, res) => {
  await ensurePlantsTable();
  try {
    const caller = await getRequestUser(req);
    if (caller && !isSuperAdminUser(caller)) {
      return res.status(403).json({ error: 'Only Super Admin can create new plants.' });
    }

    const p = req.body;
    const id = p.id || `PL${String(Math.floor(10 + Math.random() * 90))}`;
    const code = (p.code || `PLANT_${String(Math.floor(100 + Math.random() * 900))}`).trim();
    const name = p.name || 'New Ready Mix Concrete Plant';
    const location = p.location || 'Industrial Area';
    const city = p.city || 'Hyderabad';
    const capacityPerHour = Number(p.capacityPerHour || 120);
    const contactPerson = p.contactPerson || null;
    const contactPhone = p.contactPhone || null;
    const contactEmail = p.contactEmail || null;
    const status = p.status || 'active';

    const newPlantObj = {
      id,
      code,
      name,
      location,
      city,
      capacityPerHour,
      contactPerson,
      contactPhone,
      contactEmail,
      status,
      userCount: 0,
      activeSessions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await pool.query(
        `INSERT INTO plants (id, code, name, location, city, capacity_per_hour, contact_person, contact_phone, contact_email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, code, name, location, city, capacityPerHour, contactPerson, contactPhone, contactEmail, status]
      );
    } catch (dbErr) {
      console.warn('DB insert plant fallback:', dbErr.message);
    }

    memoryPlants.push(newPlantObj);

    // Automatically create FTP folders: /<Plant Name>/Entry Gate and /<Plant Name>/Exit Gate
    let ftpFolders = null;
    try {
      ftpFolders = await ftpService.ensurePlantFolders(newPlantObj);
    } catch (ftpErr) {
      console.warn(`FTP folder creation warning for plant ${name}:`, ftpErr.message);
    }

    res.status(201).json({ ...newPlantObj, ftpFolders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/plants/:id
router.put('/:id', async (req, res) => {
  await ensurePlantsTable();
  try {
    const caller = await getRequestUser(req);
    if (caller && !isSuperAdminUser(caller)) {
      return res.status(403).json({ error: 'Only Super Admin can update plants.' });
    }
    const id = req.params.id;
    const p = req.body;

    try {
      await pool.query(
        `UPDATE plants 
         SET name = COALESCE(?, name),
             location = COALESCE(?, location),
             city = COALESCE(?, city),
             capacity_per_hour = COALESCE(?, capacity_per_hour),
             contact_person = COALESCE(?, contact_person),
             contact_phone = COALESCE(?, contact_phone),
             contact_email = COALESCE(?, contact_email),
             status = COALESCE(?, status)
         WHERE id = ?`,
        [p.name, p.location, p.city, p.capacityPerHour, p.contactPerson, p.contactPhone, p.contactEmail, p.status, id]
      );
    } catch (dbErr) {
      console.warn('DB update plant fallback:', dbErr.message);
    }

    if (p.name) {
      ftpService.ensurePlantFolders({ id, name: p.name, code: p.code || id }).catch((ftpErr) => {
        console.warn(`FTP folder sync warning on plant update ${id}:`, ftpErr.message);
      });
    }

    const idx = memoryPlants.findIndex(item => item.id === id);
    if (idx !== -1) {
      memoryPlants[idx] = {
        ...memoryPlants[idx],
        ...p,
        capacityPerHour: p.capacityPerHour !== undefined ? Number(p.capacityPerHour) : memoryPlants[idx].capacityPerHour,
        updatedAt: new Date().toISOString()
      };
      return res.json(memoryPlants[idx]);
    }

    res.json({ id, ...p });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/plants/:id
router.delete('/:id', async (req, res) => {
  await ensurePlantsTable();
  try {
    const caller = await getRequestUser(req);
    if (caller && !isSuperAdminUser(caller)) {
      return res.status(403).json({ error: 'Only Super Admin can delete plants.' });
    }
    const id = req.params.id;
    try {
      await pool.query('DELETE FROM plants WHERE id = ?', [id]);
    } catch (dbErr) {
      console.warn('DB delete plant fallback:', dbErr.message);
    }

    memoryPlants = memoryPlants.filter(p => p.id !== id);
    res.json({ success: true, message: `Plant ${id} removed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
