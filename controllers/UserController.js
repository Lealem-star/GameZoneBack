const User = require('../models/User');

// Create a new user (for game controllers)
exports.createUser = async (req, res) => {
  const { 
    username, 
    password, 
    role = 'gameController', 
    location = '', 
    restaurantName = '', 
    phoneNumber = '',
    packageAmount,
    isUnlimited = true
  } = req.body;

  // Get image path if file was uploaded
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    console.log('📝 Admin creating user:', username, 'Role:', role);
    console.log('🔐 Admin user info - ID:', req.userId, 'Role:', req.userRole);
    console.log('🖼️  Image uploaded:', image);
    console.log('📍 Location:', location, '| 🍽️ Restaurant:', restaurantName, '| 📞 Phone:', phoneNumber);
    console.log('📦 Package:', isUnlimited ? 'Unlimited' : `${packageAmount} amount`);

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('❌ Username already exists:', username);
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Prepare package data
    const isUnlimitedPackage = isUnlimited === true || isUnlimited === 'true';
    const packageAmount_num = isUnlimitedPackage ? 0 : Number(packageAmount) || 0;
    
    const packageData = {
      isUnlimited: isUnlimitedPackage,
      amount: packageAmount_num, // Store the original package amount in birr
      remainingAmount: packageAmount_num // Initialize remaining amount to the full package amount
    };
    
    console.log('💰 Package details - Amount:', packageData.amount, 'ETB | Remaining:', packageData.remainingAmount, 'ETB | Unlimited:', packageData.isUnlimited);

    // Create new user (password will be hashed by the pre-save middleware)
    const newUser = new User({
      username,
      password,
      role,
      image,
      location,
      restaurantName,
      phoneNumber,
      package: packageData
    });

    await newUser.save();
    console.log('✅ User created successfully:', username, 'Role:', role);

    // Return user data without password
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role,
      image: newUser.image,
      location: newUser.location,
      restaurantName: newUser.restaurantName,
      phoneNumber: newUser.phoneNumber,
      package: newUser.package,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      message: 'Game controller created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('💥 Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Get all users (filtered by role if specified)
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    // If role is specified, filter by role
    if (role) {
      query.role = role;
    }

    console.log('📋 Admin fetching users with query:', query);
    console.log('🔐 Admin user info - ID:', req.userId, 'Role:', req.userRole);

    const users = await User.find(query).select('-password'); // Exclude password
    console.log('✅ Users fetched successfully:', users.length, 'users');

    res.status(200).json(users);
  } catch (error) {
    console.error('💥 Error retrieving users:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

// Get a specific user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('👤 Admin fetching user by ID:', id);
    const user = await User.findById(id).select('-password');
    if (!user) {
      console.log('❌ User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('✅ User fetched successfully:', user.username);
    res.status(200).json(user);
  } catch (error) {
    console.error('💥 Error retrieving user:', error);
    res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    console.log('🔄 Admin updating user:', id, 'Updates:', updates);

    // Remove password from updates if it's not being changed
    if (!updates.password) {
      delete updates.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('❌ User not found for update:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User updated successfully:', updatedUser.username);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('💥 Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  // Support both 'id' and 'userId' as route params
  const id = req.params.id || req.params.userId;

  try {
    console.log('🗑️  Admin deleting user:', id);
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      console.log('❌ User not found for deletion:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('✅ User deleted successfully:', deletedUser.username);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('💥 Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
