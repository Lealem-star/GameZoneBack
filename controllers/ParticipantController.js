const Participant = require('../models/Participant');
const Game = require('../models/Game');
const Prize = require('../models/Prize');

// Create a new participant
exports.createParticipant = async (req, res) => {
  const { name, photo, entranceFee } = req.body;
  const { gameId } = req.params; // get gameId from params

  try {
    const newParticipant = new Participant({ name, photo, entranceFee, gameId });
    await newParticipant.save();

    // Recalculate prize amount
    const game = await Game.findById(gameId);
    if (game && game.prize) {
      const participants = await Participant.find({ gameId });
      const totalCollected = participants.length * game.entranceFee;
      const prizeAmount = totalCollected * 0.7; // 30% for system
      await Prize.findByIdAndUpdate(game.prize, { amount: prizeAmount });
    }

    res.status(201).json({ message: 'Participant added successfully', newParticipant });
  } catch (error) {
    res.status(500).json({ message: 'Error adding participant', error });
  }
};

// Get all participants for a specific game
exports.getParticipants = async (req, res) => {
  const { gameId } = req.params;

  try {
    const participants = await Participant.find({ gameId });
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving participants', error });
  }
};

// Update a participant
exports.updateParticipant = async (req, res) => {
  const { participantId } = req.params;
  const updates = req.body;

  try {
    const updatedParticipant = await Participant.findByIdAndUpdate(participantId, updates, { new: true });
    res.status(200).json(updatedParticipant);
  } catch (error) {
    res.status(500).json({ message: 'Error updating participant', error });
  }
};

// Delete a participant
exports.deleteParticipant = async (req, res) => {
  const { participantId } = req.params;

  try {
    await Participant.findByIdAndDelete(participantId);
    res.status(200).json({ message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting participant', error });
  }
};

// Get all participants
exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find({});
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving all participants', error });
  }
};
