const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  status: { // Add status field
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed'], // Define allowed values
    default: 'pending',
  },
  owner: { // Add owner field
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Reference the User model
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Owner will be added later
});

module.exports = mongoose.model('Task', TaskSchema);