// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fallback JWT secret for development
const JWT_SECRET = process.env.JWT_SECRET;

// Sign Up Function
exports.signup = async (req, res) => {
  const { username, password, role = 'controller' } = req.body;

  try {
    console.log('Signup attempt for username:', username);

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists:', username);
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Create new user (password will be hashed by the pre-save middleware)
    const newUser = new User({ username, password, role });
    await newUser.save();

    console.log('User created successfully:', username, 'Role:', role);

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user.', error: error.message });
  }
};

// Sign In Function
exports.signin = async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Signin attempt for username:', username);

    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    console.log('User found, comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    console.log('Password match, generating token...');
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', username, 'Role:', user.role);

    res.status(200).json({
      token,
      userId: user._id,
      role: user.role,
      username: user.username,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Error signing in.', error: error.message });
  }
};

// Test endpoint to check if server is running
exports.test = async (req, res) => {
  res.status(200).json({
    message: 'Auth server is running!',
    timestamp: new Date().toISOString()
  });
};
