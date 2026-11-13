// Server-Side Authentication & Cryptographic Security Utility
// Aparna RMC Gate-to-Exit Enterprise Operations System
// Implements standard HS256 JWT signing/verification and timing-safe password verification

import crypto from 'crypto';
import { pool } from './db.js';

const JWT_DEFAULT_SECRET = process.env.JWT_SECRET || 'aparna_rmc_gate_secure_plant_jwt_secret_2026';
const SHIFT_EXPIRY_SECONDS = 8 * 3600; // 8 hours (Standard Indian industrial shift)

/**
 * Base64 URL encode
 * @param {string|Buffer} input 
 * @returns {string}
 */
function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Base64 URL decode
 * @param {string} str 
 * @returns {Buffer}
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Generate a cryptographically signed HS256 JWT
 * @param {object} payload 
 * @param {string} [secret] 
 * @param {number} [expiresInSeconds] 
 * @returns {string} Signed JWT token
 */
export function signJwt(payload, secret = JWT_DEFAULT_SECRET, expiresInSeconds = SHIFT_EXPIRY_SECONDS) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', secret).update(dataToSign).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify an incoming JWT token
 * @param {string} token 
 * @param {string} [secret] 
 * @returns {{ valid: boolean, payload?: object, error?: string }}
 */
export function verifyJwt(token, secret = JWT_DEFAULT_SECRET) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing or invalid format' };
  }

  // Handle legacy rmc_token format if in development mode
  if (token.startsWith('rmc_token_') || token.startsWith('demo_token_')) {
    if (process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Legacy unverified tokens are prohibited in production environment' };
    }
    const parts = token.split('_');
    return {
      valid: true,
      payload: {
        userId: parts[2] || parts[1] || 'USR-001',
        legacy: true
      }
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWT structure' };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest();
    const actualSignature = base64UrlDecode(encodedSignature);

    if (expectedSignature.length !== actualSignature.length || !crypto.timingSafeEqual(expectedSignature, actualSignature)) {
      return { valid: false, error: 'Invalid cryptographic signature' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Session token expired. Shift duration exceeded.' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: `Token validation error: ${err.message}` };
  }
}

/**
 * Hash a plain password using PBKDF2 with a random salt
 * @param {string} password 
 * @returns {string} Salted hash in format pbkdf2$iterations$salt$hash
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Cryptographically verify password against stored hash or legacy credentials
 * @param {string} inputPassword 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export function verifyPassword(inputPassword, storedHash) {
  if (!inputPassword || !storedHash) return false;

  // 1. PBKDF2 Format Check
  if (storedHash.startsWith('pbkdf2$')) {
    const [, iterStr, salt, originalHash] = storedHash.split('$');
    const iterations = parseInt(iterStr, 10);
    const hash = crypto.pbkdf2Sync(inputPassword, salt, iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  }

  // 2. Production strictness: Demo passwords prohibited in production mode
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    // In production, only cryptographically verified hashes are accepted
    if (storedHash === inputPassword || inputPassword === 'admin123' || inputPassword === 'password123') {
      console.warn('⚠️ Rejected plain-text or default demo password login attempt in production mode');
      return false;
    }
  }

  // 3. Development / Test fallback comparison (backward compatibility with seeded tables)
  if (!isProd) {
    if (storedHash === inputPassword || inputPassword === 'admin123' || inputPassword === 'password123') {
      return true;
    }
  }

  return false;
}

export function isSuperAdminUser(u) {
  if (!u) return false;
  const roleId = u.role_id || u.roleId;
  const plantId = u.plant_id || u.plantId;
  return roleId === 'super_admin' || (roleId === 'admin' && (!plantId || plantId === 'all'));
}

/**
 * Resolve the authenticated user from Bearer JWT or x-user-id header (in dev).
 * Returns null if unauthenticated.
 */
export async function getRequestUser(req) {
  try {
    const authHeader = req.headers.authorization;
    const isProd = process.env.NODE_ENV === 'production';
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = verifyJwt(token);
      if (result.valid && result.payload?.userId && !result.payload?.legacy) {
        userId = result.payload.userId;
      }
    }

    if (!userId && !isProd) {
      userId = req.headers['x-user-id'] || null;
    }

    if (!userId) return null;

    const [rows] = await pool.query(
      'SELECT id, username, name, role_id, plant_id, plant_name, status FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

