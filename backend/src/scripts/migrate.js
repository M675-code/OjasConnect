require('dotenv').config();
const pool = require('../db/pool');

async function runMigrations() {
  const statements = [
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`,
    `CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_industry ON businesses (industry);`,
    // Prefix index for long varchar fields if needed
    `CREATE INDEX IF NOT EXISTS idx_users_first_name ON users (first_name(50));`,
    `CREATE INDEX IF NOT EXISTS idx_users_last_name ON users (last_name(50));`,

    // Foreign keys (may fail if already present)
    `ALTER TABLE spouses ADD CONSTRAINT fk_spouses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE kids ADD CONSTRAINT fk_kids_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE businesses ADD CONSTRAINT fk_businesses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE jobs ADD CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE event_rsvps ADD CONSTRAINT fk_event_rsvps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;`
  ];

  for (const stmt of statements) {
    try {
      console.log('Running:', stmt);
      await pool.execute(stmt);
      console.log('Success');
    } catch (err) {
      // Log and continue - many DBs will error if something already exists
      console.warn('Migration statement failed (continuing):', err.message);
    }
  }

  console.log('Migrations finished');
  process.exit(0);
}

runMigrations();
