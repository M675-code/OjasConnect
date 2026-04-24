require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Database Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// --- ROUTE: Get Directory with Filters ---
app.get('/api/directory', async (req, res) => {
    const { search, status, industry } = req.query;
    
    // FIX: Safely combine first & last name. If both are null/blank, fallback to email.
    let query = `
        SELECT u.id, 
               COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'Unknown Member') AS full_name, 
               u.contact_number, u.status, b.business_name, b.industry 
        FROM users u
        LEFT JOIN businesses b ON u.id = b.user_id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        query += ` AND u.status = ?`;
        params.push(status);
    }
    if (industry) {
        query += ` AND b.industry = ?`;
        params.push(industry);
    }
    if (search) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR b.business_name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    try {
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE: Get Full User Profile (Relations) ---
app.get('/api/users/:id', async (req, res) => {
    try {
       // UPDATE: Fetching all the new base fields
        const [user] = await pool.execute('SELECT id, first_name, last_name, gender, marital_status, residential_address, contact_number, email, dob, anniversary, role FROM users WHERE id = ?', [req.params.id]);
        const [spouse] = await pool.execute('SELECT * FROM spouses WHERE user_id = ?', [req.params.id]);
        const [kids] = await pool.execute('SELECT * FROM kids WHERE user_id = ?', [req.params.id]);
        const [businesses] = await pool.execute('SELECT * FROM businesses WHERE user_id = ?', [req.params.id]);
        const [jobs] = await pool.execute('SELECT * FROM jobs WHERE user_id = ?', [req.params.id]); // UPDATE: Fetching Jobs
        
        if (user.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json({
            ...user[0],
            full_name: [user[0].first_name, user[0].last_name].filter(Boolean).join(' ') || user[0].email,
            spouse: spouse[0] || null,
            kids: kids,
            businesses: businesses,
            jobs: jobs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE: User Login ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user by email
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND status = "active"', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid Credentials or Contact Admin' });
        }

        const user = users[0];

        // 2. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials or Contact Admin' });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // 4. Send success response
        res.json({
            message: 'Login Successful',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE: Admin Create User ---
app.post('/api/admin/users', async (req, res) => {
    const { userData, spouseData, kidsData, businessData, jobData } = req.body;
    const defaultPassword = 'password123'; 

    try {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
       // 1. UPDATE: Insert Base User with new fields (gender, marital_status, address)
        const [userResult] = await pool.execute(
            'INSERT INTO users (role, email, contact_number, residential_address, password_hash, first_name, last_name, gender, marital_status, dob, anniversary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userData.role, userData.email, userData.contact_number, userData.residential_address, hashedPassword, userData.first_name, userData.last_name, userData.gender, userData.marital_status, userData.dob || null, userData.anniversary || null]
        );
        const newUserId = userResult.insertId;

        // 2. UPDATE: Insert Spouse with split name, dob, location, etc.
        if (spouseData && spouseData.first_name) {
            await pool.execute(
                'INSERT INTO spouses (user_id, first_name, last_name, dob, marriage_license_location, occupation_type, contact_number, email, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                [newUserId, spouseData.first_name, spouseData.last_name, spouseData.dob || null, spouseData.marriage_license_location, spouseData.occupation_type, spouseData.contact_number, spouseData.email, spouseData.details]
            );
        }

        // 3. UPDATE: Insert Kids with split name, dob, relationship
        if (kidsData && kidsData.length > 0) {
            for (const kid of kidsData) {
                if (kid.first_name) await pool.execute(
                    'INSERT INTO kids (user_id, first_name, last_name, dob, relationship, current_status, details) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                    [newUserId, kid.first_name, kid.last_name, kid.dob || null, kid.relationship, kid.current_status, kid.details]
                );
            }
        }

        // 4. UPDATE: Insert Businesses with DBA, structure, Tax ID, address
        if (businessData && businessData.length > 0) {
            for (const biz of businessData) {
                if (biz.business_name) await pool.execute(
                    'INSERT INTO businesses (user_id, business_name, dba_name, business_structure, tax_id, industry, business_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                    [newUserId, biz.business_name, biz.dba_name, biz.business_structure, biz.tax_id, biz.industry, biz.business_address, biz.description]
                );
            }
        }

        // 5. UPDATE: Insert Jobs
        if (jobData && jobData.length > 0) {
            for (const job of jobData) {
                if (job.employer_name) await pool.execute(
                    'INSERT INTO jobs (user_id, employer_name, job_title, work_address) VALUES (?, ?, ?, ?)', 
                    [newUserId, job.employer_name, job.job_title, job.work_address]
                );
            }
        }

        res.json({ message: 'User completely created and linked successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// --- EVENTS API ---
// ==========================================

// Get all events and the RSVP count
app.get('/api/events', async (req, res) => {
    try {
        const query = `
            SELECT e.*, 
            COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'Admin') as creator_name, 
            (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as rsvp_count 
            FROM events e 
            LEFT JOIN users u ON e.created_by = u.id 
            ORDER BY e.event_date ASC
        `;
        const [events] = await pool.execute(query);
        res.json(events);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Event (Admin/EventManager)
app.post('/api/events', async (req, res) => {
    const { title, description, event_date, created_by } = req.body;
    try {
        await pool.execute('INSERT INTO events (title, description, event_date, created_by) VALUES (?, ?, ?, ?)', [title, description, event_date, created_by]);
        res.json({ message: 'Event created successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// RSVP to an Event
app.post('/api/events/rsvp', async (req, res) => {
    const { event_id, user_id, status } = req.body;
    try {
        await pool.execute('INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?', [event_id, user_id, status, status]);
        res.json({ message: 'RSVP updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));

// ==========================================
// --- ADMIN API ---
// ==========================================

// Create new user (Multi-step data insertion)
app.post('/api/admin/users', async (req, res) => {
    const { userData, spouseData, kidsData, businessData } = req.body;
    
    // Default password for all new users
    const defaultPassword = 'password123'; 

    try {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // 1. Insert User
        const [userResult] = await pool.execute(
            'INSERT INTO users (role, email, password_hash, full_name, dob, anniversary) VALUES (?, ?, ?, ?, ?, ?)',
            [userData.role, userData.email, hashedPassword, userData.full_name, userData.dob || null, userData.anniversary || null]
        );
        const newUserId = userResult.insertId;

        // 2. Insert Spouse (if provided)
        if (spouseData && spouseData.name) {
            await pool.execute(
                'INSERT INTO spouses (user_id, name, occupation_type, details) VALUES (?, ?, ?, ?)',
                [newUserId, spouseData.name, spouseData.occupation_type, spouseData.details]
            );
        }

        // 3. Insert Kids
        if (kidsData && kidsData.length > 0) {
            for (const kid of kidsData) {
                if (kid.name) {
                    await pool.execute(
                        'INSERT INTO kids (user_id, name, current_status, details) VALUES (?, ?, ?, ?)',
                        [newUserId, kid.name, kid.current_status, kid.details]
                    );
                }
            }
        }

        // 4. Insert Businesses
        if (businessData && businessData.length > 0) {
            for (const biz of businessData) {
                if (biz.business_name) {
                    await pool.execute(
                        'INSERT INTO businesses (user_id, business_name, industry, description) VALUES (?, ?, ?, ?)',
                        [newUserId, biz.business_name, biz.industry, biz.description]
                    );
                }
            }
        }

        res.json({ message: 'User completely created and linked successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));