const Participant = require('../models/Participant');
const Game = require('../models/Game');
const Prize = require('../models/Prize');

// Create a new participant
exports.createParticipant = async (req, res) => {
  const { name, photo, emoji, entranceFee } = req.body;
  const { gameId } = req.params; // get gameId from params

  try {
    // Get the game to find the controller
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const newParticipant = new Participant({
      name,
      photo,
      emoji,
      entranceFee,
      gameId,
      controllerId: game.gameControllerId // Add controller ID from the game
    });
    await newParticipant.save();

    // Recalculate prize amount and update totalCollected
    const updatedGame = await Game.findById(gameId);
    if (updatedGame) {
      const participants = await Participant.find({ gameId });
      const totalCollected = participants.length * updatedGame.entranceFee;
      const systemRevenue = updatedGame.entranceFee * 0.3; // 30% of entrance fee per participant

      // Update the game's totalCollected field
      await Game.findByIdAndUpdate(gameId, { totalCollected });

      // Update prize amount if prize exists
      if (updatedGame.prize) {
        const prizeAmount = totalCollected * 0.7; // 70% for prize
        await Prize.findByIdAndUpdate(updatedGame.prize, { amount: prizeAmount });
      }

      // Update the game controller's package remaining amount
      if (updatedGame.gameControllerId) {
        try {
          const User = require('../models/User');
          const gameController = await User.findById(updatedGame.gameControllerId);

          if (gameController && gameController.package && !gameController.package.isUnlimited && gameController.package.remainingAmount > 0) {
            // Decrease the remaining amount by the system revenue for this participant
            gameController.package.remainingAmount = Math.max(0, gameController.package.remainingAmount - systemRevenue);
            await gameController.save();
            console.log(`Updated game controller ${gameController.username} package: ${gameController.package.remainingAmount} ETB remaining (reduced by ${systemRevenue} ETB for new participant)`);
          }
        } catch (packageError) {
          console.error('Error updating game controller package:', packageError);
          // Don't fail the participant creation if package update fails
        }
      }
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

// Get participants by controller
exports.getParticipantsByController = async (req, res) => {
  const { controllerId } = req.params;

  try {
    const participants = await Participant.find({ controllerId });
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving participants by controller', error });
  }
};
