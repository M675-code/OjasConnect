const express = require('express');
const { validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const { createEventValidator, rsvpValidator } = require('../validators/eventValidators');
const eventsController = require('../controllers/eventsController');
const eventsService = require('../services/eventsService');

const router = express.Router();

// Get events
router.get('/events', eventsController.getEvents);

// Create event (protected, admin or event_manager)
router.post('/events', authMiddleware, allowedRoles('admin','event_manager'), createEventValidator, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description, event_date, created_by } = req.body;
  try {
    const id = await eventsService.createEvent({ title, description, event_date, created_by: created_by || req.user.id });
    res.json({ message: 'Event created successfully', id });
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
