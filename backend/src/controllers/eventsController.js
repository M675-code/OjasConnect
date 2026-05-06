// D:\Vs_React_Native\Ojas_Connect\backend\src\controllers\eventsController.js
const pool = require('../db/pool');

async function getEvents(req, res, next) {
  try {
    const query = `SELECT e.*, COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email, 'Admin') as creator_name, (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as rsvp_count, (e.event_date < NOW()) as is_past FROM events e LEFT JOIN users u ON e.created_by = u.id ORDER BY e.event_date ASC`;
    const [events] = await pool.execute(query);
    res.json(events);
  } catch (err) { next(err); }
}

module.exports = { getEvents };