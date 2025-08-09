const Game = require('../models/Game');

// Create a new game
exports.createGame = async (req, res) => {
  const { name, mealTime, entranceFee, prize, gameControllerId } = req.body;

  console.log('🎮 Creating game with data:', { name, mealTime, entranceFee, prize, gameControllerId });

  try {
    // Validate required fields
    if (!name || !mealTime || !entranceFee || !gameControllerId) {
      return res.status(400).json({
        message: 'Missing required fields: name, mealTime, entranceFee, and gameControllerId are required'
      });
    }

    // Validate mealTime enum
    if (!['breakfast', 'lunch', 'dinner'].includes(mealTime)) {
      return res.status(400).json({
        message: 'Invalid mealTime. Must be one of: breakfast, lunch, dinner'
      });
    }

    // Validate entranceFee is a positive number
    if (typeof entranceFee !== 'number' || entranceFee <= 0) {
      return res.status(400).json({
        message: 'entranceFee must be a positive number'
      });
    }

    // Calculate system revenue (30% of entrance fee)
    const systemRevenue = entranceFee * 0.3; // 30% of entrance fee

    // Create the new game with calculated system revenue
    const newGame = new Game({
      name,
      mealTime,
      entranceFee,
      prize,
      gameControllerId,
      systemRevenue, // Store the system revenue in the game record
      winner: null, // Ensure no winner is set for a new game
      status: 'ongoing'
    });
    await newGame.save();

    // Update the game controller's package remaining amount if they have a limited package
    if (gameControllerId) {
      try {
        const User = require('../models/User');
        const gameController = await User.findById(gameControllerId);

        if (gameController && gameController.package && !gameController.package.isUnlimited && gameController.package.remainingAmount > 0) {
          // The system fee is 30% of entrance fee
          // Note: At this point, we don't know how many participants will join
          // The actual deduction will happen when participants join the game
          // For now, we just store the systemRevenue in the game record
          console.log(`Game created with system revenue rate of 30% (${systemRevenue} ETB per participant)`);
        }
      } catch (packageError) {
        console.error('Error checking game controller package:', packageError);
        // Don't fail the game creation if package check fails
      }
    }

    console.log('✅ Game created successfully:', newGame._id);
    res.status(201).json({ message: 'Game created successfully', newGame });
  } catch (error) {
    console.error('❌ Error creating game:', error);
    res.status(500).json({ message: 'Error creating game', error: error.message });
  }
};

// Get all games
exports.getGames = async (req, res) => {
  try {
    const games = await Game.find()
      .populate('gameControllerId')
      .populate('winner')
      .populate('participants');
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving games', error });
  }
};

// Update a game
exports.updateGame = async (req, res) => {
  const { gameId } = req.params;
  const updates = req.body;

  try {
    const updatedGame = await Game.findByIdAndUpdate(gameId, updates, { new: true });
    res.status(200).json(updatedGame);
  } catch (error) {
    res.status(500).json({ message: 'Error updating game', error });
  }
};

// Delete a game
exports.deleteGame = async (req, res) => {
  const { gameId } = req.params;

  try {
    await Game.findByIdAndDelete(gameId);
    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting game', error });
  }
};

// Get a specific game by ID
exports.getGameById = async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await Game.findById(gameId)
      .populate('prize')
      .populate('winner')
      .populate('participants');
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving game', error });
  }
};

// Get all games managed by a specific controller
exports.getGamesByController = async (req, res) => {
  const { id } = req.params;

  // Check if id is null or undefined
  if (!id || id === 'null' || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid controller ID provided' });
  }

  try {
    const games = await Game.find({ gameControllerId: id })
      .populate('prize')
      .populate('winner')
      .populate('participants')
      .sort({ createdAt: -1 });
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving games for controller', error });
  }
};

// Get total revenue for a specific controller
exports.getControllerRevenue = async (req, res) => {
  const { id } = req.params;

  // Check if id is null or undefined
  if (!id || id === 'null' || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid controller ID provided' });
  }

  try {
    const games = await Game.find({ gameControllerId: id });
    const totalRevenue = games.reduce((sum, game) => sum + (game.entranceFee || 0), 0);
    const totalSystemRevenue = games.reduce((sum, game) => sum + (game.systemRevenue || 0), 0);

    // Get today's games for daily revenue calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysGames = await Game.find({
      gameControllerId: id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const dailyRevenue = todaysGames.reduce((sum, game) => sum + (game.entranceFee || 0), 0);
    const dailySystemRevenue = todaysGames.reduce((sum, game) => sum + (game.systemRevenue || 0), 0);

    res.status(200).json({
      totalRevenue,
      dailyRevenue,
      totalSystemRevenue,
      dailySystemRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating revenue for controller', error });
  }
};
