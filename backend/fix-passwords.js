require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function fixPasswords() {
    try {
        if (process.env.FIX_PASSWORDS_CONFIRM !== 'YES') {
            console.error('Aborting: To run this dangerous script, set FIX_PASSWORDS_CONFIRM=YES in your environment.');
            process.exit(1);
        }

        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // 1. Generate a fresh hash for a secure random password
        const newPassword = process.env.FIX_PASSWORDS_NEW || 'password123';
        const newHash = await bcrypt.hash(newPassword, 10);
        console.log('New hash generated for:', newPassword);

        // 2. Update all users in the database with this new hash
        const [result] = await pool.execute('UPDATE users SET password_hash = ?', [newHash]);
        console.log(`Success! Updated ${result.affectedRows} users.\nNOTE: This script is dangerous; ensure you undo or rotate secrets after running.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixPasswords();