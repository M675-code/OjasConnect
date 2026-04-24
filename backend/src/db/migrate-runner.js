// Runner will execute .sql and .js files in migrations directory in lexical order
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function run() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql') || f.endsWith('.js')).sort();
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    console.log('Running migration:', file);
    try {
      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(full, 'utf8');
        await pool.query(sql);
        console.log('Migration succeeded:', file);
      } else if (file.endsWith('.js')) {
        // require the migration and run its exported function if any
        const mig = require(full);
        if (typeof mig === 'function') await mig();
        console.log('Migration executed:', file);
      }
    } catch (err) {
      console.error('Migration failed:', file, err && err.message ? err.message : err);
    }
  }
}

if (require.main === module) run();

module.exports = run;
