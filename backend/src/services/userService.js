const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function createUserWithRelations({ userData, spouseData, kidsData, businessData, jobData }, createdByUser) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check duplicate email
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [userData.email]);
    if (existing.length > 0) {
      await connection.rollback();
      connection.release();
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }

    // Generate a secure temp password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const insertUserSql = `INSERT INTO users (role, email, contact_number, residential_address, password_hash, first_name, last_name, gender, marital_status, dob, anniversary, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [userData.role || 'member', userData.email, userData.contact_number || null, userData.residential_address || null, hashedPassword, userData.first_name || null, userData.last_name || null, userData.gender || null, userData.marital_status || null, userData.dob || null, userData.anniversary || null, userData.status || 'active', createdByUser?.id || null];

    const [userResult] = await connection.execute(insertUserSql, params);
    const newUserId = userResult.insertId;

    // Spouse
    if (spouseData && (spouseData.first_name || spouseData.name)) {
      const sf = spouseData.first_name || (spouseData.name && spouseData.name.split(' ')[0]) || null;
      const sl = spouseData.last_name || (spouseData.name && spouseData.name.split(' ').slice(1).join(' ')) || null;
      await connection.execute('INSERT INTO spouses (user_id, first_name, last_name, dob, marriage_license_location, occupation_type, contact_number, email, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [newUserId, sf, sl, spouseData.dob || null, spouseData.marriage_license_location || null, spouseData.occupation_type || null, spouseData.contact_number || null, spouseData.email || null, spouseData.details || null]);
    }

    // Kids
    if (Array.isArray(kidsData) && kidsData.length > 0) {
      for (const kid of kidsData) {
        const kf = kid.first_name || kid.name || null;
        const kl = kid.last_name || null;
        if (kf) await connection.execute('INSERT INTO kids (user_id, first_name, last_name, dob, relationship, current_status, details) VALUES (?, ?, ?, ?, ?, ?, ?)', [newUserId, kf, kl, kid.dob || null, kid.relationship || null, kid.current_status || null, kid.details || null]);
      }
    }

    // Businesses
    if (Array.isArray(businessData) && businessData.length > 0) {
      for (const biz of businessData) {
        if (biz.business_name) await connection.execute('INSERT INTO businesses (user_id, business_name, dba_name, business_structure, tax_id, industry, business_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [newUserId, biz.business_name, biz.dba_name || null, biz.business_structure || null, biz.tax_id || null, biz.industry || null, biz.business_address || null, biz.description || null]);
      }
    }

    // Jobs
    if (Array.isArray(jobData) && jobData.length > 0) {
      for (const job of jobData) {
        if (job.employer_name) await connection.execute('INSERT INTO jobs (user_id, employer_name, job_title, work_address) VALUES (?, ?, ?, ?)', [newUserId, job.employer_name, job.job_title || null, job.work_address || null]);
      }
    }

    await connection.commit();
    connection.release();

    return { newUserId, tempPassword };
  } catch (err) {
    try { await connection.rollback(); } catch (e) {}
    connection.release();
    throw err;
  }
}

module.exports = { createUserWithRelations };
