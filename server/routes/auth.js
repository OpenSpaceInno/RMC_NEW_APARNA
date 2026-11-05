import express from 'express';
import { pool } from '../db.js';
import { normalizeColor } from './roles.js';
import { signJwt, verifyJwt, verifyPassword } from '../auth-security.js';

const router = express.Router();

export const formatUserWithRole = (userRow, roleRow) => {
  const normColor = normalizeColor(roleRow ? roleRow.color : userRow.role_color);
  return {
    id: userRow.id,
    username: userRow.username,
    name: userRow.name,
    email: userRow.email,
    phone: userRow.phone,
    department: userRow.department,
    shift: userRow.shift,
    status: userRow.status,
    avatar: userRow.avatar,
    lastLogin: userRow.last_login,
    roleId: roleRow ? roleRow.id : userRow.role_id,
    roleName: roleRow ? roleRow.name : userRow.role_name,
    roleColor: normColor,
    role: {
      id: roleRow ? roleRow.id : userRow.role_id,
      name: roleRow ? roleRow.name : userRow.role_name,
      description: roleRow ? roleRow.description : '',
      color: normColor,
      modules: roleRow ? (typeof roleRow.modules === 'string' ? JSON.parse(roleRow.modules) : roleRow.modules) : [],
      permissions: roleRow ? (typeof roleRow.permissions === 'string' ? JSON.parse(roleRow.permissions) : roleRow.permissions) : []
    }
  };
};

/**
 * Authentication Middleware for protecting sensitive routes
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
  }

  const token = authHeader.substring(7);
  const result = verifyJwt(token);

  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid or expired authentication session' });
  }

  req.user = result.payload;
  next();
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, roleId } = req.body;
    const isProd = process.env.NODE_ENV === 'production';

    let userQuery = '';
    let params = [];

    // Support 1-click role demo login in development ONLY
    if (roleId) {
      if (isProd) {
        return res.status(403).json({
          error: '1-Click demo role login is disabled in production environment. Please provide your corporate operator credentials.'
        });
      }
      userQuery = `
        SELECT u.*, r.id as r_id, r.name as r_name, r.description as r_desc, r.color as r_color, r.modules as r_modules, r.permissions as r_perms 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.role_id = ? AND u.status = "active" 
        LIMIT 1
      `;
      params = [roleId];
    } else if (username) {
      userQuery = `
        SELECT u.*, r.id as r_id, r.name as r_name, r.description as r_desc, r.color as r_color, r.modules as r_modules, r.permissions as r_perms 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE (u.username = ? OR u.email = ?) 
        LIMIT 1
      `;
      params = [username, username];
    } else {
      return res.status(400).json({ error: 'Username or roleId is required' });
    }

    const [rows] = await pool.query(userQuery, params);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found or account is inactive' });
    }

    const user = rows[0];

    // Cryptographic Password Verification
    if (!roleId) {
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        await pool.query(
          `INSERT INTO audit_logs (id, module, action, entity_id, entity_type, performed_by, details, severity)
           VALUES (?, 'AUTH', 'LOGIN_FAILED', ?, 'USER', ?, ?, 'warning')`,
          [
            `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            user.id,
            JSON.stringify({ userId: user.id, username: user.username }),
            `Failed authentication attempt for username '${user.username}'`
          ]
        ).catch(() => {});
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'User account has been deactivated. Please contact plant administrator.' });
    }

    // Update last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const roleObj = {
      id: user.r_id || user.role_id,
      name: user.r_name || user.role_name,
      description: user.r_desc,
      color: user.r_color || 'blue',
      modules: user.r_modules,
      permissions: user.r_perms
    };

    const formatted = formatUserWithRole(user, roleObj);

    // Audit log successful login
    await pool.query(
      `INSERT INTO audit_logs (id, module, action, entity_id, entity_type, performed_by, details, severity)
       VALUES (?, 'AUTH', 'USER_LOGIN', ?, 'USER', ?, ?, 'info')`,
      [
        `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        user.id,
        JSON.stringify({ userId: user.id, username: user.username, role: formatted.roleName }),
        `Operator '${user.name}' signed in as '${formatted.roleName}' [Shift: ${user.shift || 'General'}]`
      ]
    ).catch(() => {});

    // Issue Cryptographically Signed HS256 JWT Token (8-Hour Shift Expiry)
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      roleId: formatted.roleId,
      roleName: formatted.roleName,
      department: user.department,
      shift: user.shift
    };

    const token = signJwt(tokenPayload);

    res.json({
      success: true,
      user: formatted,
      token,
      expiresInSeconds: 28800, // 8 Hours
      message: `Welcome back, ${user.name}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'];
    const isProd = process.env.NODE_ENV === 'production';

    let userId = userIdHeader;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verifyResult = verifyJwt(token);

      if (verifyResult.valid && verifyResult.payload) {
        userId = verifyResult.payload.userId;
      } else if (isProd) {
        return res.status(401).json({ error: verifyResult.error || 'Invalid or expired shift session' });
      }
    }

    if (!userId) {
      if (isProd) {
        return res.status(401).json({ error: 'Authentication required. No active session found.' });
      }
      // Development fallback profile
      userId = 'USR-001';
    }

    const [rows] = await pool.query(
      `SELECT u.*, r.id as r_id, r.name as r_name, r.description as r_desc, r.color as r_color, r.modules as r_modules, r.permissions as r_perms 
       FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User session not found' });

    const user = rows[0];
    const roleObj = {
      id: user.r_id || user.role_id,
      name: user.r_name || user.role_name,
      description: user.r_desc,
      color: user.r_color || 'blue',
      modules: user.r_modules,
      permissions: user.r_perms
    };

    const formatted = formatUserWithRole(user, roleObj);
    res.json({
      success: true,
      user: formatted,
      ...formatted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', async (req, res) => {
  try {
    // Prohibit exposing demo user accounts in production environment
    if (process.env.NODE_ENV === 'production') {
      return res.json([]);
    }

    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.name, u.email, u.role_id, u.role_name, u.department, u.shift, u.avatar,
             r.color as role_color, r.description as role_description, r.modules as role_modules
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.status = 'active' AND u.role_id IN ('admin', 'weighbridge_operator')
      ORDER BY u.id ASC
    `);

    const demoUsers = rows.map(r => ({
      id: r.id,
      username: r.username,
      name: r.name,
      email: r.email,
      roleId: r.role_id,
      roleName: r.role_id === 'admin' ? 'Admin / Plant Manager' : 'Weighbridge In-charge / Operator',
      roleColor: r.role_color || (r.role_id === 'admin' ? '#8b5cf6' : '#10b981'),
      roleDescription: r.role_id === 'admin' 
        ? 'Gate Monitor, Weighbridge terminal, and Device Configuration with full administrative control'
        : 'Gate Monitor and Weighbridge live feeds, tare & gross weight capture, and vehicle camera telemetry',
      department: r.department,
      shift: r.shift,
      avatar: r.avatar,
      plantId: r.role_id === 'admin' ? 'all' : 'PL01',
      plantName: r.role_id === 'admin' ? 'All Plants (Global Admin)' : 'Plant 01 • Shamshabad Central',
      moduleCount: r.role_id === 'admin' ? 5 : 2
    }));

    res.json(demoUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
