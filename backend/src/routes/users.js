const express = require('express');
const { loginValidator, adminCreateValidator } = require('../validators/userValidators');
const { login, createAdminUser, getUserProfile } = require('../controllers/usersController');
const { directory } = require('../controllers/directoryController');
const { validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const invitesController = require('../controllers/invitesController');

const router = express.Router();

// Login
router.post('/login', loginValidator, login);

// Directory (public)
router.get('/directory', directory);

// Get user profile
router.get('/users/:id', getUserProfile);

// Admin create user (protected)
router.post('/admin/users', authMiddleware, allowedRoles('admin'), adminCreateValidator, createAdminUser);

// Admin CRUD for users
router.get('/admin/users', authMiddleware, allowedRoles('admin'), require('..//controllers/usersController').adminListUsers);
router.put('/admin/users/:id', authMiddleware, allowedRoles('admin'), require('..//controllers/usersController').adminUpdateUser);
router.delete('/admin/users/:id', authMiddleware, allowedRoles('admin'), require('..//controllers/usersController').adminSoftDeleteUser);
router.post('/admin/users/:id/restore', authMiddleware, allowedRoles('admin'), require('..//controllers/usersController').adminRestoreUser);
// Hard delete (permanent) - use with caution
router.delete('/admin/users/:id/hard', authMiddleware, allowedRoles('admin'), require('..//controllers/usersController').adminHardDeleteUser);

// Invite endpoints (admin)
router.post('/invite', authMiddleware, allowedRoles('admin'), invitesController.createInvite);
router.get('/invite/verify', invitesController.verifyInvite);

module.exports = router;
