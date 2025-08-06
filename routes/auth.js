// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Test Route
router.get('/test', authController.test);

// Sign Up Route
router.post('/signup', authController.signup);

// Sign In Route
router.post('/signin', authController.signin);

// Device Management Routes
router.get('/devices', authMiddleware.verifyToken, authController.getUserDevices);
router.post('/devices/remove', authMiddleware.verifyToken, authController.removeDevice);

module.exports = router;
