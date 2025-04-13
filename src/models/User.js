// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // bcryptjs was already imported for pre-save hook

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

// Mongoose middleware to hash password before saving (from Commit 9)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- Start: Added in Commit 11 ---
// Method to compare entered password with the hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // 'this.password' refers to the hashed password stored for this user document
  return await bcrypt.compare(enteredPassword, this.password);
};
// --- End: Added in Commit 11 ---

module.exports = mongoose.model('User', UserSchema);