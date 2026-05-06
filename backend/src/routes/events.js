const express = require('express');
const { validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const { createEventValidator, rsvpValidator } = require('../validators/eventValidators');
const eventsController = require('../controllers/eventsController');
const eventsService = require('../services/eventsService');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Get events
router.get('/events', eventsController.getEvents);

// Create event (protected, admin or event_manager)
router.post('/events', authMiddleware, allowedRoles('admin','event_manager'), createEventValidator, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  let { title, description, event_date, created_by, image_url } = req.body;

  try {
    // If client sent a data URL (base64), persist it to public/uploads and replace with an absolute URL
    if (typeof image_url === 'string' && image_url.startsWith('data:')) {
      try {
        const match = image_url.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
          const b64 = match[3];
          const buf = Buffer.from(b64, 'base64');
          const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
          fs.mkdirSync(uploadsDir, { recursive: true });
          const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, buf);
          const absoluteUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
          image_url = absoluteUrl;
        }
      } catch (e) {
        console.error('Failed to persist uploaded image', e);
        image_url = null;
      }
    }

    const id = await eventsService.createEvent({ title, description, event_date, created_by: created_by || req.user.id, image_url });
    res.json({ message: 'Event created successfully', id });
  } catch (err) { next(err); }
});

// Delete event (admin only)
router.delete('/events/:id', authMiddleware, allowedRoles('admin'), async (req, res, next) => {
  const eventId = req.params.id;
  if (isNaN(Number(eventId))) return res.status(400).json({ message: 'Invalid event id' });
  try {
    await eventsService.deleteEvent(eventId);
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
});

// RSVP
router.post('/events/rsvp', authMiddleware, rsvpValidator, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { event_id, user_id, status } = req.body;
  try {
    await eventsService.rsvp({ event_id, user_id, status });
    res.json({ message: 'RSVP updated' });
  } catch (err) { next(err); }
});

module.exports = router;
