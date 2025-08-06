// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ObjectId } = require('mongoose').Types;

// Fallback JWT secret for development
const JWT_SECRET = process.env.JWT_SECRET;

// Test endpoint
exports.test = (req, res) => {
  res.status(200).json({ message: 'Auth route is working!' });
};

// Get user devices
exports.getUserDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.status(200).json({
      devices: user.devices,
      message: 'Devices retrieved successfully'
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Error retrieving devices.', error: error.message });
  }
};

// Remove device from user account
exports.removeDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const deviceIndex = user.devices.findIndex(device => device.deviceId === deviceId);
    if (deviceIndex === -1) {
      return res.status(404).json({ message: 'Device not found.' });
    }
    
    user.devices.splice(deviceIndex, 1);
    await user.save();
    
    res.status(200).json({
      message: 'Device removed successfully',
      devices: user.devices
    });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({ message: 'Error removing device.', error: error.message });
  }
};

// Sign Up Function
exports.signup = async (req, res) => {
  const { username, password, role = 'gameController' } = req.body;

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
  const { username, password, deviceInfo } = req.body;
  // deviceInfo should contain deviceId and optionally deviceName

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
    
    // Check package status for game controllers
    if (user.role === 'gameController' && 
        user.package && 
        !user.package.isUnlimited && 
        user.package.remainingAmount <= 0) {
      console.log('Package depleted for user:', username);
      return res.status(403).json({
        message: 'Your package has been depleted. Please contact the admin to refill your package.',
        packageDepleted: true,
        originalAmount: user.package.amount,
        userId: user._id,
        username: user.username
      });
    }

    // Handle device tracking for game controllers
    if (user.role === 'gameController' && deviceInfo && deviceInfo.deviceId) {
      // Check if this device is already registered
      const existingDeviceIndex = user.devices.findIndex(device => device.deviceId === deviceInfo.deviceId);
      
      if (existingDeviceIndex >= 0) {
        // Update existing device's last login time
        user.devices[existingDeviceIndex].lastLogin = new Date();
        if (deviceInfo.deviceName) {
          user.devices[existingDeviceIndex].deviceName = deviceInfo.deviceName;
        }
      } else {
        // This is a new device
        if (user.devices.length >= 2) {
          // Already has 2 devices registered
          return res.status(403).json({
            message: 'You have reached the maximum number of devices (2) for this account. Please log out from another device before logging in with a new one.',
            maxDevicesReached: true
          });
        }
        
        // Add the new device
        user.devices.push({
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName || 'Unknown Device',
          lastLogin: new Date()
        });
      }
      
      // Save the updated user with device information
      await user.save();
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
      message: 'Login successful',
      devices: user.devices.length
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
