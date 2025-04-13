/**
 * File: src/routes/tasks.js
 * =========================
 * STATE AFTER BOB'S COMMIT 18: 'feat: Implement UPDATE task by ID'
 * =========================
 *
 * History incorporated into this file state:
 * - Commit 7 (Bob): Added initial POST / route.
 * - Commit 10 (Bob): Added initial GET / route.
 * - Commit 14 (Bob): Protected POST /, associated task owner.
 * - Commit 16 (Bob): Protected GET /, filtered GET / by task owner.
 * - Commit 17 (Bob): Added GET /:id route, protected, checked ownership.
 * - Commit 18 (Bob): Added PUT /:id route, protected, checked ownership, allows updates.
 *
 * Note: Assumes 'Task' model has necessary fields ('owner', 'description', 'status'/'completed').
 *       Assumes 'protect' middleware exists.
 *       Assumes centralized error handling via 'next(err)' is used.
 */

// Import required modules
const express = require('express');
const { check, validationResult } = require('express-validator');
const Task = require('../models/Task');
const protect = require('../middleware/auth');

// Initialize router
const router = express.Router();

// @route   POST api/tasks
// @desc    Create a task
// @access  Private
router.post(
  '/',
  [
    protect,
    check('description', 'Description is required').not().isEmpty(),
    // Add other necessary validations (e.g., for status if required on create)
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newTask = new Task({
        description: req.body.description,
        status: req.body.status || 'pending', // Example: Use default if not provided
        owner: req.user.id // Associate task with logged-in user's ID
      });

      const task = await newTask.save();
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// @route   GET api/tasks
// @desc    Get all tasks for the logged-in user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    // Find tasks only for the logged-in user
    const tasks = await Task.find({ owner: req.user.id });
    // Add filtering/sorting/pagination logic here later (Commits 26, 27, 37)
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// @route   GET api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check ownership
    if (task.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(task);

  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    next(err);
  }
});

// --- Route added in Commit 18 (Bob) ---
// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [ // Middleware array for PUT request
    protect, // Ensure user is authenticated
    // Optional: Add validation rules for fields being updated
    check('description', 'Description cannot be empty if provided').optional().not().isEmpty(),
    check('status', 'Invalid status provided').optional().isIn(['pending', 'in-progress', 'completed']) // Example status validation
  ],
  async (req, res, next) => {
    // Run validation checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract fields to update from request body
    const { description, status, completed } = req.body; // Adjust based on your Task model fields
    const taskFields = {};
    // Build the update object only with fields that were actually provided
    if (description !== undefined) taskFields.description = description;
    if (status !== undefined) taskFields.status = status;
    if (completed !== undefined) taskFields.completed = completed; // If using 'completed' boolean

    // Prevent updating the owner field
    if (req.body.owner) {
        return res.status(400).json({ msg: 'Cannot transfer task ownership via update.' });
    }

    try {
      // Find the task by ID first to check ownership
      let task = await Task.findById(req.params.id);

      // Check if task exists
      if (!task) {
        return res.status(404).json({ msg: 'Task not found' });
      }

      // Check if the logged-in user owns the task
      if (task.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      // If ownership is verified, proceed with the update
      task = await Task.findByIdAndUpdate(
        req.params.id, // ID of the task to update
        { $set: taskFields }, // Use $set to update only provided fields
        { new: true, runValidators: true } // Options: return the modified document, run schema validators
      );

      // Should not happen if findById found it, but as a safeguard
      if (!task) {
          return res.status(404).json({ msg: 'Task not found after update attempt.'})
      }

      // Return the updated task
      res.json(task);

    } catch (err) {
      // Handle potential errors like invalid ObjectId format
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
      }
      // Handle validation errors from Mongoose during update
      if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: 'Validation failed', errors: err.errors });
      }
      // Pass other errors to the central handler
      next(err);
    }
  }
);
// --- End Route added in Commit 18 ---

/* --- Placeholder Comment ---
 * More routes will be added below in subsequent commits:
 * - DELETE /api/tasks/:id (Commit 19 - Bob)
 * --- End Placeholder Comment ---
 */

// Export the router
module.exports = router;