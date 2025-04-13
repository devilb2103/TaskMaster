/**
 * File: src/models/Task.js
 * =========================
 * STATE AFTER BOB'S COMMIT 41: 'perf: Add database indexes for common queries'
 * =========================
 *
 * History incorporated into this file state:
 * - Commit 5 (Bob): Initial Task model definition (description, completed).
 * - Commit 15 (Charlie): Added 'owner' field.
 * - Commit 22 (Charlie): Replaced 'completed' with 'status' enum.
 * - Commit 31 (Charlie): Added optional 'dueDate' field.
 * - Commit 41 (Bob): Added specific database indexes using `TaskSchema.index()`
 *                    to optimize common query patterns (fetching by owner,
 *                    filtering by status, sorting by creation date).
 *
 * Note: Assumes `timestamps: true` is used for automatic `createdAt`/`updatedAt`.
 */

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed'], // Defined values for status
    default: 'pending', // Default status when a task is created
  },
  dueDate: {
      type: Date,
      required: false // Assuming due date is optional
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Link to the User collection
    required: true, // A task must have an owner
    ref: 'User', // Reference to the User model (for population if needed)
  },
  // createdAt and updatedAt are handled by timestamps option below
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

// --- Indexes Added/Defined in Commit 41 ---

// Index on 'owner' field alone. Crucial for efficiently fetching all tasks
// for a specific user (e.g., Task.find({ owner: userId })).
TaskSchema.index({ owner: 1 });

// Compound index on 'owner' and 'status'. Optimizes queries that filter
// a user's tasks by their status (e.g., Task.find({ owner: userId, status: 'pending' })).
// The order (owner first) is important if owner is the primary filter.
TaskSchema.index({ owner: 1, status: 1 });

// Compound index on 'owner' and 'createdAt' (descending). Optimizes fetching
// a user's tasks sorted by creation date, which is a common default sort order.
// Use -1 for descending order.
TaskSchema.index({ owner: 1, createdAt: -1 });

// Optional: Add other indexes based on common query patterns.
// For example, if sorting/filtering by due date is frequent for a specific user:
// TaskSchema.index({ owner: 1, dueDate: 1 }); // 1 for ascending sort/filter

// --- End Indexes Added/Defined in Commit 41 ---


// Create and export the Task model based on the schema
module.exports = mongoose.model('Task', TaskSchema);