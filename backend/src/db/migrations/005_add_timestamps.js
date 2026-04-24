const pool = require('../pool');

async function run() {
  try {
    // Add created_at and updated_at to users if missing
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('created_at','updated_at')");
    const existing = (cols || []).map(r => r.COLUMN_NAME);

    if (!existing.includes('created_at')) {
      await pool.execute("ALTER TABLE users ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
      console.log('added created_at to users');
    } else {
      console.log('created_at already exists on users');
    }

    if (!existing.includes('updated_at')) {
      // Use ON UPDATE CURRENT_TIMESTAMP for updated_at
      await pool.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      console.log('added updated_at to users');
    } else {
      console.log('updated_at already exists on users');
    }

    // Backfill NULLs (if any) to a sensible value
    try {
      await pool.execute("UPDATE users SET created_at = NOW() WHERE created_at IS NULL");
      await pool.execute("UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL");
      console.log('backfilled NULL timestamps on users');
    } catch (e) {
      console.warn('failed to backfill timestamps (non-fatal):', e && e.message ? e.message : e);
    }

  } catch (err) {
    console.error('Migration 005 failed (continuing):', err && err.message ? err.message : err);
  }
}

if (require.main === module) run();

module.exports = run;
