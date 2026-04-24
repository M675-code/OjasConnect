const pool = require('../pool');

async function run() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      action VARCHAR(100) NOT NULL,
      actor_user_id BIGINT NULL,
      target_user_id BIGINT NULL,
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // Update users.status enum to the recommended set for social/business network
    `ALTER TABLE users MODIFY status ENUM('active','inactive','suspended','invited','deleted') DEFAULT 'active';`,

    // Add deleted_at column if not exists (MySQL 8+ supports IF NOT EXISTS)
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL;`
  ];

  for (const s of statements) {
    try {
      console.log('Running:', s.replace(/\n/g, ' '));
      await pool.execute(s);
      console.log('OK');
    } catch (err) {
      console.warn('Failed (continuing):', err && err.message ? err.message : err);
    }
  }
}

if (require.main === module) run();

module.exports = run;
