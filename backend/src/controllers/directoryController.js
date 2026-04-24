const pool = require('../db/pool');

async function directory(req, res, next) {
  try {
    const rawSearch = req.query.search;
    const rawStatus = req.query.status;
    const rawIndustry = req.query.industry;
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 20;
    const limit = Number(size) || 20;
    const offset = ((Number(page) || 1) - 1) * limit;
    const rawSort = req.query.sort || 'lastName';

    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
    const status = typeof rawStatus === 'string' ? rawStatus.trim() : '';
    const industry = typeof rawIndustry === 'string' ? rawIndustry.trim() : '';

    // Check if created_at / updated_at columns exist to avoid SQL errors on older schema
    let hasCreated = false;
    let hasUpdated = false;
    try {
      const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('created_at','updated_at')");
      const existing = (cols || []).map(r => r.COLUMN_NAME);
      hasCreated = existing.includes('created_at');
      hasUpdated = existing.includes('updated_at');
    } catch (e) {
      // ignore, we'll just avoid using those columns
    }

    // map sort param to safe SQL ORDER BY clause
    const sortKey = String(rawSort || 'lastName');
    let orderBy = "COALESCE(NULLIF(LOWER(u.last_name), ''), LOWER(u.first_name), LOWER(u.email)) ASC";
    if (sortKey === 'createdAt') {
      orderBy = hasCreated ? 'u.created_at DESC' : 'u.id DESC';
    } else if (sortKey === 'updatedAt') {
      orderBy = hasUpdated ? 'u.updated_at DESC' : 'u.id DESC';
    } else if (sortKey === 'firstName') {
      orderBy = "COALESCE(NULLIF(LOWER(u.first_name), ''), LOWER(u.last_name), LOWER(u.email)) ASC";
    } else if (sortKey === 'lastName') {
      orderBy = "COALESCE(NULLIF(LOWER(u.last_name), ''), LOWER(u.first_name), LOWER(u.email)) ASC";
    }

    // include individual name/email columns so frontend can sort/display reliably
    let selectCols = `u.id, COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), NULLIF(u.email, ''), 'Unknown Member') AS full_name, u.first_name, u.last_name, u.email, u.contact_number, u.status, b.business_name, b.industry`;
    if (hasCreated) selectCols += ', u.created_at';
    if (hasUpdated) selectCols += ', u.updated_at';

    let query = `SELECT ${selectCols} FROM users u LEFT JOIN businesses b ON u.id = b.user_id WHERE 1=1`;
    const params = [];

    if (status) { query += ' AND u.status = ?'; params.push(status); }
    if (industry) { query += ' AND b.industry = ?'; params.push(industry); }
    if (search) { query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR b.business_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

    // append ORDER BY and then embed numeric LIMIT/OFFSET directly to avoid driver prepared-statement LIMIT issues
    query += ` ORDER BY ${orderBy} LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Debug: log query and parameter types (safe for development)
    try {
      const debugParams = params.map(p => ({ type: typeof p, value: String(p) }));
      console.debug('Directory query:', query);
      console.debug('Directory params:', JSON.stringify(debugParams));
    } catch (dbgErr) {
      // ignore debug errors
    }

    const [rows] = await pool.execute(query, params);
    res.json({ page: Number(page), size: limit, data: rows });
  } catch (err) {
    console.error('Directory query error:', err && err.message ? err.message : err);
    next(err);
  }
}

module.exports = { directory };
