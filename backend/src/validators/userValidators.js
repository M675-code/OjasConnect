const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const adminCreateValidator = [
  body('userData').exists().withMessage('userData is required'),
  body('userData.email').isEmail().withMessage('Valid email required'),
  body('userData.role').notEmpty().withMessage('role is required'),
  body('userData.first_name').optional().isString(),
  body('userData.last_name').optional().isString()
];

module.exports = { loginValidator, adminCreateValidator };
