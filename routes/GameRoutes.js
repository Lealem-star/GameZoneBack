const express = require('express');
const router = express.Router();
const gameController = require('../controllers/GameController');

// Game routes
router.post('/games', gameController.createGame); // Create a new game
router.get('/games', gameController.getGames); // Get all games
router.put('/games/:gameId', gameController.updateGame); // Update a game
router.delete('/games/:gameId', gameController.deleteGame); // Delete a game
router.get('/games/:gameId', gameController.getGameById); // Get a specific game by ID
// Route to get games by controller ID
router.get('/games/controller/:id', gameController.getGamesByController);

module.exports = router;
