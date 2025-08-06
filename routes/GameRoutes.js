const express = require('express');
const router = express.Router();
const gameController = require('../controllers/GameController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Game routes
router.post('/games', authMiddleware.verifyToken, authMiddleware.checkPackageStatus, gameController.createGame); // Create a new game
router.get('/games', authMiddleware.verifyToken, gameController.getGames); // Get all games
router.put('/games/:gameId', authMiddleware.verifyToken, authMiddleware.checkPackageStatus, gameController.updateGame); // Update a game
router.delete('/games/:gameId', authMiddleware.verifyToken, gameController.deleteGame); // Delete a game
router.get('/games/:gameId', authMiddleware.verifyToken, gameController.getGameById); // Get a specific game by ID
// Route to get games by controller ID
router.get('/games/controller/:id', authMiddleware.verifyToken, gameController.getGamesByController);

module.exports = router;
