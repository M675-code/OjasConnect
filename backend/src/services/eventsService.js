const pool = require('../db/pool');

async function createEvent({ title, description, event_date, created_by, image_url }) {
  const [result] = await pool.execute('INSERT INTO events (title, description, image_url, event_date, created_by) VALUES (?, ?, ?, ?, ?)', [title, description || null, image_url || null, event_date, created_by]);
  return result.insertId;
}

async function deleteEvent(eventId) {
  await pool.execute('DELETE FROM events WHERE id = ?', [eventId]);
}

async function rsvp({ event_id, user_id, status }) {
  await pool.execute('INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?', [event_id, user_id, status, status]);
}

module.exports = { createEvent, rsvp, deleteEvent };
