const pool = require('../db/pool');
const crypto = require('crypto');

// POST /api/invite - admin only
async function createInvite(req, res, next) {
  const { email, type = 'invite', user_id = null, expires_in_hours = 48 } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + expires_in_hours * 3600 * 1000);
    await pool.execute('INSERT INTO invites (user_id, email, token, type, expires_at) VALUES (?, ?, ?, ?, ?)', [user_id, email, token, type, expiresAt]);
    // TODO: send email via provider
    res.json({ message: 'Invite created', token });
  } catch (err) { next(err); }
}

// GET /api/invite/verify?token=...
async function verifyInvite(req, res, next) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'token required' });
  try {
    const [rows] = await pool.execute('SELECT * FROM invites WHERE token = ? AND used = 0 AND expires_at > NOW()', [token]);
    if (rows.length === 0) return res.status(404).json({ message: 'Invalid or expired token' });
    res.json({ valid: true, invite: rows[0] });
  } catch (err) { next(err); }
}

module.exports = { createInvite, verifyInvite };