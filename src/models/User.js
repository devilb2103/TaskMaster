// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- Added bcryptjs import

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Start: Added in Commit 9 ---
// Mongoose middleware to hash password before saving
UserSchema.pre('save', async function (next) {
  // 'this' refers to the document being saved
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next(); // Skip hashing if password hasn't changed
  }

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10); // 10 rounds is generally recommended
    // Hash the password using the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Proceed with the save operation
  } catch (error) {
    next(error); // Pass any error during hashing to the next middleware
  }
});
// --- End: Added in Commit 9 ---


module.exports = mongoose.model('User', UserSchema);