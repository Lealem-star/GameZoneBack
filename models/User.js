const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Validator function to limit the number of devices per user
function arrayLimit(val) {
  return val.length <= 2; // Limit to 2 devices per user
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'gameController'], // Combined enum values
    required: true,
    default: 'gameController' // Default role set to 'gameController'
  },
  image: {
    type: String, // Store the file path or URL
    default: null
  },
  location: {
    type: String,
    default: ''
  },
  restaurantName: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  package: {
    amount: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    isUnlimited: {
      type: Boolean,
      default: true
    },
    remainingAmount: {
      type: Number,
      default: 0
    }
  },
  devices: {
    type: [{
      deviceId: {
        type: String,
        required: true
      },
      deviceName: {
        type: String,
        default: 'Unknown Device'
      },
      lastLogin: {
        type: Date,
        default: Date.now
      }
    }],
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 2 devices']
  }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
