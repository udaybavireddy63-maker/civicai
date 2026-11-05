const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Session clearing
router.post('/logout', authController.logout);

// Protected session check
router.get('/me', authenticate, authController.getMe);

module.exports = router;
