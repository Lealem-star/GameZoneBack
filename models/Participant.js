const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  photo: {
    type: String, // URL or path to the photo
    required: false
  },
  emoji: {
    type: String, // Emoji character
    default: '😀'
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game' // Reference to the Game model
  },
  controllerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to the Game Controller
  }
}, { timestamps: true });

const Participant = mongoose.model('Participant', participantSchema);
module.exports = Participant;
