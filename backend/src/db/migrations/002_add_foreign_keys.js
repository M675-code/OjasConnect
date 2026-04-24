// Safer foreign key migration implemented in JavaScript to handle MySQL version differences.
const pool = require('../pool');

async function run() {
  const constraints = [
    { table: 'spouses', name: 'fk_spouses_user', sql: `ALTER TABLE spouses ADD CONSTRAINT fk_spouses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;` },
    { table: 'kids', name: 'fk_kids_user', sql: `ALTER TABLE kids ADD CONSTRAINT fk_kids_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;` },
    { table: 'businesses', name: 'fk_businesses_user', sql: `ALTER TABLE businesses ADD CONSTRAINT fk_businesses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;` },
    { table: 'jobs', name: 'fk_jobs_user', sql: `ALTER TABLE jobs ADD CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;` },
    { table: 'event_rsvps', name: 'fk_event_rsvps_user', sql: `ALTER TABLE event_rsvps ADD CONSTRAINT fk_event_rsvps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;` }
  ];

  for (const c of constraints) {
    try {
      // Check if constraint exists by name on the target table in current database
      const [rows] = await pool.execute(`SELECT COUNT(*) AS cnt FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?`, [c.table, c.name]);
      const exists = rows && rows[0] && (rows[0].cnt || rows[0].COUNT || rows[0].CNT) > 0;
      if (exists) {
        console.log(`Skipping: constraint ${c.name} on table ${c.table} already exists`);
        continue;
      }

      console.log('Running:', c.sql);
      await pool.execute(c.sql);
      console.log('OK');
    } catch (err) {
      console.warn('Failed (continuing):', err && err.message ? err.message : err);
    }
  }

  // Do not exit the process here — the migrate-runner controls process lifecycle
}

if (require.main === module) run();

module.exports = run;
