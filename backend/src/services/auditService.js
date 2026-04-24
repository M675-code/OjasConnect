const pool = require('../db/pool');

async function recordAudit({ action, actor_user_id, target_user_id, details }) {
  try {
    await pool.execute('INSERT INTO audit_logs (action, actor_user_id, target_user_id, details, created_at) VALUES (?, ?, ?, ?, NOW())', [action, actor_user_id || null, target_user_id || null, details || null]);
  } catch (err) {
    console.error('Failed to write audit log', err && err.message ? err.message : err);
  }
}

module.exports = { recordAudit };
