const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userService = require('../services/userService');
const auditService = require('../services/auditService');

async function login(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND status = "active"', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'Invalid Credentials' });
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid Credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login Successful', token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

async function createAdminUser(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userData, spouseData, kidsData, businessData, jobData } = req.body;
    const result = await userService.createUserWithRelations({ userData, spouseData, kidsData, businessData, jobData }, req.user);
    res.json({ message: 'User created and linked successfully', userId: result.newUserId, tempPassword: result.tempPassword });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ message: err.message });
    next(err);
  }
}

async function getUserProfile(req, res, next) {
  const userId = req.params.id;
  if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user id' });
  try {
    const [users] = await pool.execute('SELECT id, first_name, last_name, gender, marital_status, residential_address, contact_number, email, dob, anniversary, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];
    const [spouse] = await pool.execute('SELECT * FROM spouses WHERE user_id = ?', [userId]);
    const [kids] = await pool.execute('SELECT * FROM kids WHERE user_id = ?', [userId]);
    const [businesses] = await pool.execute('SELECT * FROM businesses WHERE user_id = ?', [userId]);
    const [jobs] = await pool.execute('SELECT * FROM jobs WHERE user_id = ?', [userId]);
    res.json({ ...user, full_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email, spouse: spouse[0] || null, kids, businesses, jobs });
  } catch (err) { next(err); }
}

async function directory(req, res, next) {
  const { search, status, industry, page = 1, size = 20, sort = 'name' } = req.query;
  const limit = parseInt(size, 10) || 20;
  const offset = ((parseInt(page, 10) || 1) - 1) * limit;

  // map sort param to safe SQL ORDER BY clause
  let orderBy = 'u.last_name ASC, u.first_name ASC';
  const sortKey = String(sort || 'lastName');
  if (sortKey === 'createdAt') {
    orderBy = 'u.created_at DESC';
  } else if (sortKey === 'updatedAt') {
    orderBy = 'u.updated_at DESC';
  } else if (sortKey === 'firstName') {
    // sort by first_name primarily, fallback to last_name or email
    orderBy = "COALESCE(NULLIF(LOWER(u.first_name), ''), LOWER(u.last_name), LOWER(u.email)) ASC";
  } else if (sortKey === 'lastName') {
    orderBy = "COALESCE(NULLIF(LOWER(u.last_name), ''), LOWER(u.first_name), LOWER(u.email)) ASC";
  }

  let query = `SELECT u.id, COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), NULLIF(u.email, ''), 'Unknown Member') AS full_name, u.first_name, u.last_name, u.email, u.contact_number, u.status, b.business_name, b.industry, u.created_at, u.updated_at FROM users u LEFT JOIN businesses b ON u.id = b.user_id WHERE 1=1`;
  const params = [];
  if (status) { query += ' AND u.status = ?'; params.push(status); }
  if (industry) { query += ' AND b.industry = ?'; params.push(industry); }
  if (search) { query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR b.business_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

  // append ORDER BY and pagination
  query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const [rows] = await pool.execute(query, params);
    res.json({ page: parseInt(page, 10), size: limit, data: rows });
  } catch (err) { next(err); }
}

async function adminListUsers(req, res, next) {
  const { page = 1, size = 50 } = req.query;
  const limit = Math.min(parseInt(size, 10) || 50, 200);
  const offset = ((parseInt(page, 10) || 1) - 1) * limit;
  try {
    const [rows] = await pool.execute('SELECT id, first_name, last_name, email, contact_number, status, role, dob, marital_status FROM users ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ page: parseInt(page, 10), size: limit, data: rows });
  } catch (err) { next(err); }
}

async function adminUpdateUser(req, res, next) {
  const userId = req.params.id;
  if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user id' });
  const allowed = ['first_name','last_name','email','contact_number','residential_address','gender','marital_status','role','status','dob','anniversary'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, k)) {
      updates.push(`${k} = ?`);
      params.push(req.body[k]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ message: 'No updatable fields provided' });

  try {
    // Check email uniqueness if email provided
    if (req.body.email) {
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [req.body.email, userId]);
      if (existing.length > 0) return res.status(409).json({ message: 'Email already in use by another user' });
    }

    params.push(userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(sql, params);
    // return updated profile
    const [users] = await pool.execute('SELECT id, first_name, last_name, email, contact_number, residential_address, gender, marital_status, role, status, dob, anniversary FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found after update' });
    res.json({ message: 'User updated', user: users[0] });
  } catch (err) { next(err); }
}

async function adminSoftDeleteUser(req, res, next) {
  const userId = req.params.id;
  if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user id' });
  try {
    // support modes via query param: ?mode=suspend will set status='suspended'
    const mode = (req.query.mode || '').toLowerCase();
    const targetStatus = mode === 'suspend' ? 'suspended' : 'inactive';
    const reason = (req.body && req.body.reason) ? String(req.body.reason).trim() : null;

    // Determine allowed enum values for users.status so we can pick a safe fallback
    let chosenStatus = targetStatus;
    try {
      const [cols] = await pool.execute("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'");
      if (cols && cols.length) {
        const colType = cols[0].COLUMN_TYPE || '';
        const matches = [...colType.matchAll(/'([^']+)'/g)].map(m => m[1]);
        if (!matches.includes(chosenStatus)) {
          // Prefer 'inactive' if present, otherwise fall back to legacy 'past' or the first available
          if (matches.includes('inactive')) chosenStatus = 'inactive';
          else if (matches.includes('active')) chosenStatus = 'active';
          else chosenStatus = matches[0] || targetStatus;
        }
      }
    } catch (e) {
      // unable to read schema - continue with original targetStatus
    }

    // Try updating status + deleted_at where possible
    try {
      await pool.execute('UPDATE users SET status = ?, deleted_at = NOW() WHERE id = ?', [chosenStatus, userId]);
    } catch (err) {
      const msg = String(err && err.message || '').toLowerCase();
      // If enum truncation occurred (trying to set an unsupported value) then try a safer status
      if (msg.includes("data truncated for column 'status'") || msg.includes('data truncated') || msg.includes('incorrect')) {
        // As a last resort try to update status only with the chosenStatus (which we've attempted to pick safely)
        try {
          await pool.execute('UPDATE users SET status = ? WHERE id = ?', [chosenStatus, userId]);
        } catch (e2) {
          // If deleted_at column is the problem or other issues, attempt fallback flows
          if (String(e2 && e2.message || '').toLowerCase().includes("unknown column 'deleted_at'")) {
            // Try setting status only using original target if chosenStatus didn't work
            try { await pool.execute('UPDATE users SET status = ? WHERE id = ?', [targetStatus, userId]); } catch(e3) { /* swallow - will be handled below */ }
          }
        }
      } else if (msg.includes("unknown column 'deleted_at'")) {
        // deleted_at column not present - fallback to updating status only
        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [chosenStatus, userId]);
      } else {
        throw err;
      }
    }

    // record audit with mode information and reason if provided
    try {
      const detailsObj = { by: req.user?.id, mode: chosenStatus };
      if (reason) detailsObj.reason = reason;
      await auditService.recordAudit({ action: 'user_soft_delete', actor_user_id: req.user?.id, target_user_id: Number(userId), details: JSON.stringify(detailsObj) });
    } catch (e) {}

    res.json({ message: `User marked as ${chosenStatus}` });
  } catch (err) { next(err); }
}

async function adminHardDeleteUser(req, res, next) {
  const userId = req.params.id;
  if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user id' });
  try {
    // permanently delete user and rely on FK cascade to remove related rows
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    try {
      await auditService.recordAudit({ action: 'user_hard_delete', actor_user_id: req.user?.id, target_user_id: Number(userId), details: JSON.stringify({ by: req.user?.id }) });
    } catch (e) {}
    res.json({ message: 'User permanently deleted' });
  } catch (err) { next(err); }
}

async function adminRestoreUser(req, res, next) {
  const userId = req.params.id;
  if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user id' });
  try {
    const reason = (req.body && req.body.reason) ? String(req.body.reason).trim() : null;

    // Determine allowed enum values and pick safe 'active' alternative if needed
    let chosenActive = 'active';
    try {
      const [cols] = await pool.execute("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'");
      if (cols && cols.length) {
        const colType = cols[0].COLUMN_TYPE || '';
        const matches = [...colType.matchAll(/'([^']+)'/g)].map(m => m[1]);
        if (!matches.includes(chosenActive)) {
          // if 'active' not present, fall back to first sensible value
          if (matches.includes('active')) chosenActive = 'active';
          else if (matches.includes('past')) chosenActive = 'past';
          else chosenActive = matches[0] || 'active';
        }
      }
    } catch (e) {}

    try {
      await pool.execute('UPDATE users SET status = ?, deleted_at = NULL WHERE id = ?', [chosenActive, userId]);
    } catch (err) {
      const msg = String(err && err.message || '').toLowerCase();
      if (msg.includes("unknown column 'deleted_at'")) {
        // deleted_at missing - just set status
        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [chosenActive, userId]);
      } else {
        try { await pool.execute('UPDATE users SET deleted_at = NULL WHERE id = ?', [userId]); } catch(e){}
      }
    }

    // record audit with reason if provided
    try {
      const detailsObj = { by: req.user?.id };
      if (reason) detailsObj.reason = reason;
      await auditService.recordAudit({ action: 'user_restore', actor_user_id: req.user?.id, target_user_id: Number(userId), details: JSON.stringify(detailsObj) });
    } catch(e){}

    res.json({ message: 'User restored to active' });
  } catch (err) { next(err); }
}

module.exports = { login, createAdminUser, getUserProfile, directory, adminListUsers, adminUpdateUser, adminSoftDeleteUser, adminHardDeleteUser, adminRestoreUser };
