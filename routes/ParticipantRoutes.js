const express = require('express');
const router = express.Router();
const participantController = require('../controllers/ParticipantController');

// Participant routes
router.post('/games/:gameId/participants', participantController.createParticipant); // Add a participant to a game
router.get('/games/:gameId/participants', participantController.getParticipants); // Get all participants for a specific game
router.put('/participants/:participantId', participantController.updateParticipant); // Update a participant
router.delete('/participants/:participantId', participantController.deleteParticipant); // Delete a participant
router.get('/participants', participantController.getAllParticipants); // Get all participants
router.get('/participants/controller/:controllerId', participantController.getParticipantsByController); // Get participants by controller

module.exports = router;
