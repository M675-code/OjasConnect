const pool = require('../pool');

async function run() {
  try {
    // 1) Ensure audit_logs table exists
    const createAudit = `CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      action VARCHAR(100) NOT NULL,
      actor_user_id BIGINT NULL,
      target_user_id BIGINT NULL,
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    await pool.execute(createAudit);
    console.log('audit_logs ensured');

    // 2) Ensure deleted_at column exists
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deleted_at'");
    if (!cols || cols.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL");
      console.log('added deleted_at column to users');
    } else {
      console.log('deleted_at column already exists');
    }

    // 3) Safely ensure 'inactive' exists and migrate legacy 'past' -> 'inactive'
    const [rows] = await pool.execute("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'");
    if (rows && rows[0] && rows[0].COLUMN_TYPE) {
      const colType = rows[0].COLUMN_TYPE; // e.g. "enum('active','past')"
      const matches = colType.match(/enum\((.*)\)/i);
      if (matches && matches[1]) {
        const vals = matches[1].split(',').map(s => s.trim().replace(/^'+|'+$/g, ''));
        const hasInactive = vals.includes('inactive');
        const hasPast = vals.includes('past');

        if (!hasInactive) {
          // add inactive to enum
          const newVals = [...vals, 'inactive'].map(v => `'${v}'`).join(',');
          const alter = `ALTER TABLE users MODIFY status ENUM(${newVals}) DEFAULT 'active'`;
          await pool.execute(alter);
          console.log('status enum updated to include inactive');
        } else {
          console.log('status enum already contains inactive');
        }

        // migrate existing rows with 'past' -> 'inactive'
        if (hasPast) {
          try {
            const [res] = await pool.execute("UPDATE users SET status = 'inactive' WHERE status = 'past'");
            console.log('migrated', res.affectedRows, "rows from 'past' to 'inactive'");
          } catch (e) {
            console.warn('failed to migrate past -> inactive', e && e.message ? e.message : e);
          }

          // Now attempt to remove 'past' from the enum (rebuild enum without 'past')
          try {
            const finalRows = await pool.execute("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'");
            const finalType = finalRows[0] && finalRows[0][0] ? finalRows[0][0].COLUMN_TYPE : (finalRows[0] && finalRows[0].COLUMN_TYPE ? finalRows[0].COLUMN_TYPE : null);
            const finalMatch = finalType && finalType.match(/enum\((.*)\)/i);
            const finalVals = finalMatch && finalMatch[1] ? finalMatch[1].split(',').map(s => s.trim().replace(/^'+|'+$/g, '')) : vals.concat('inactive');
            const cleaned = finalVals.filter(v => v !== 'past');
            if (cleaned.length !== finalVals.length) {
              const cleanedEnum = cleaned.map(v => `'${v}'`).join(',');
              const alter2 = `ALTER TABLE users MODIFY status ENUM(${cleanedEnum}) DEFAULT 'active'`;
              await pool.execute(alter2);
              console.log("removed 'past' from users.status enum");
            }
          } catch (e) {
            console.warn('unable to remove past from enum (safe to ignore if duplicate attempts):', e && e.message ? e.message : e);
          }
        }
      } else {
        console.warn('Could not parse users.status column type:', colType);
      }
    }

  } catch (err) {
    console.error('Migration 004 failed (continuing):', err && err.message ? err.message : err);
  }
}

if (require.main === module) run();

module.exports = run;
