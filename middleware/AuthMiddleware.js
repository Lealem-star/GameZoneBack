const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Use the same JWT secret as authController.js
const SECRET_KEY = process.env.JWT_SECRET || 'gursha_jwt_secret_key_2024_very_secure_123456789';

// Middleware to authenticate users
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.status(200).json({
      token,
      userId: user._id,
      role: user.role,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  console.log('🔐 Verifying token for request:', req.method, req.path);
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log('❌ No token provided');
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    // Add user object for consistency
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    console.log('Token verified successfully for user:', decoded.id, 'Role:', decoded.role);
    next();
  });
};

// Middleware to check if the user is an admin
exports.isAdmin = (req, res, next) => {
  console.log('Checking admin role. User role:', req.userRole);
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  console.log('Admin role verified successfully');
  next();
};

// Middleware to check if the user is a game controller
exports.isGameController = (req, res, next) => {
  if (req.userRole !== 'gameController') {
    return res.status(403).json({ message: 'Require Game Controller Role!' });
  }
  next();
};

// Middleware to check if game controller's package is depleted
exports.checkPackageStatus = async (req, res, next) => {
  try {
    console.log('📦 Checking package status for user:', req.userId, 'Role:', req.userRole);

    // Skip check for admin users
    if (req.userRole === 'admin') {
      console.log('✅ Admin user, skipping package check');
      return next();
    }

    // Check if user is a game controller with a package
    if (req.userRole === 'gameController') {
      const gameController = await User.findById(req.userId);

      if (!gameController) {
        console.log('❌ Game controller not found:', req.userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('📊 Package info:', {
        isUnlimited: gameController.package?.isUnlimited,
        remainingAmount: gameController.package?.remainingAmount,
        originalAmount: gameController.package?.amount
      });

      // If package is limited and depleted, deny access
      if (gameController.package &&
        !gameController.package.isUnlimited &&
        gameController.package.remainingAmount <= 0) {
        console.log('❌ Package depleted for user:', req.userId);
        return res.status(403).json({
          message: 'Package depleted. Please contact admin to refill your package.',
          packageDepleted: true,
          originalAmount: gameController.package.amount
        });
      }

      console.log('✅ Package check passed for user:', req.userId);
    }

    next();
  } catch (error) {
    console.error('❌ Error checking package status:', error);
    res.status(500).json({ message: 'Error checking package status', error: error.message });
  }
};
