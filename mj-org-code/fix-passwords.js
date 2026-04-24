require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function fixPasswords() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // 1. Generate a fresh hash for 'password123'
        const newHash = await bcrypt.hash('password123', 10);
        console.log('New hash generated:', newHash);

        // 2. Update all users in the database with this new hash
        const [result] = await pool.execute('UPDATE users SET password_hash = ?', [newHash]);
        
        console.log(`Success! Updated ${result.affectedRows} users. Your password is now guaranteed to be 'password123'.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixPasswords();