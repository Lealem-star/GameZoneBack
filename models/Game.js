const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mealTime: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner'],
        required: true
    },
    entranceFee: {
        type: Number,
        required: true
    },
    totalCollected: {
        type: Number,
        default: 0 // Total money collected from participants
    },
    systemRevenue: {
        type: Number,
        default: 0 // 30% of total collected
    },
    prize: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prize',
        default: null
    },
    gameControllerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the Game Controller
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        default: null
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing'
    },
    totalRevenue: {
        type: Number,
        default: 0 // Total revenue generated from this game
    }
}, { timestamps: true });

// Virtual populate for participants
// Assumes Participant model has a 'gameId' field referencing Game _id

gameSchema.virtual('participants', {
    ref: 'Participant',
    localField: '_id',
    foreignField: 'gameId',
    justOne: false
});

gameSchema.set('toObject', { virtuals: true });
gameSchema.set('toJSON', { virtuals: true });

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
