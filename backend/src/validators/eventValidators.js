const { body } = require('express-validator');

const createEventValidator = [
  body('title').notEmpty().withMessage('title is required'),
  body('event_date').notEmpty().withMessage('event_date is required').custom((val) => {
    // Accept ISO strings and datetime-local values (which parse with Date.parse in JS)
    const parsed = Date.parse(val);
    return !isNaN(parsed);
  }).withMessage('event_date must be a valid date')
];

const rsvpValidator = [
  body('event_id').isInt().withMessage('event_id must be an integer'),
  body('user_id').isInt().withMessage('user_id must be an integer'),
  body('status').isIn(['going','maybe','not_going']).withMessage('status must be one of going, maybe, not_going')
];

module.exports = { createEventValidator, rsvpValidator };
