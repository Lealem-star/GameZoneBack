const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authMiddleware = require('../middleware/AuthMiddleware');

// User routes
router.post('/users', authMiddleware.verifyToken, userController.createUser); // Create a new user
router.get('/users', authMiddleware.verifyToken, userController.getUsers); // Get all users
router.get('/users/:id', authMiddleware.verifyToken, userController.getUserById); // Get user by ID
router.put('/users/:userId', authMiddleware.verifyToken, userController.updateUser); // Update a user
router.delete('/users/:userId', authMiddleware.verifyToken, userController.deleteUser); // Delete a user

module.exports = router;
