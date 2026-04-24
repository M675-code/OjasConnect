const { body } = require('express-validator');

const createEventValidator = [
  body('title').notEmpty().withMessage('title is required'),
  body('event_date').notEmpty().withMessage('event_date is required').isISO8601().withMessage('event_date must be a valid ISO8601 date')
];

const rsvpValidator = [
  body('event_id').isInt().withMessage('event_id must be an integer'),
  body('user_id').isInt().withMessage('user_id must be an integer'),
  body('status').isIn(['going','maybe','not_going']).withMessage('status must be one of going, maybe, not_going')
];

module.exports = { createEventValidator, rsvpValidator };
