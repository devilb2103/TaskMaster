/**
 * File: src/routes/tasks.js
 * =========================
 * STATE AFTER BOB'S COMMIT 19: 'feat: Implement DELETE task by ID'
 * =========================
 *
 * History incorporated into this file state:
 * - Commit 7 (Bob): Added initial POST / route.
 * - Commit 10 (Bob): Added initial GET / route.
 * - Commit 14 (Bob): Protected POST /, associated task owner.
 * - Commit 16 (Bob): Protected GET /, filtered GET / by task owner.
 * - Commit 17 (Bob): Added GET /:id route, protected, checked ownership.
 * - Commit 18 (Bob): Added PUT /:id route, protected, checked ownership, allows updates.
 * - Commit 19 (Bob): Added DELETE /:id route, protected, checked ownership.
 *
 * Note: Assumes 'Task' model has 'owner' field.
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
    // Add other necessary validations
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const newTask = new Task({
        description: req.body.description,
        status: req.body.status || 'pending',
        owner: req.user.id
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
    const tasks = await Task.find({ owner: req.user.id });
    // Add filtering/sorting/pagination logic here later
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

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [
    protect,
    check('description', 'Description cannot be empty if provided').optional().not().isEmpty(),
    check('status', 'Invalid status provided').optional().isIn(['pending', 'in-progress', 'completed'])
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { description, status, completed } = req.body;
    const taskFields = {};
    if (description !== undefined) taskFields.description = description;
    if (status !== undefined) taskFields.status = status;
    if (completed !== undefined) taskFields.completed = completed;
    if (req.body.owner) {
        return res.status(400).json({ msg: 'Cannot transfer task ownership via update.' });
    }

    try {
      let task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ msg: 'Task not found' });
      }
      if (task.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
      task = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: taskFields },
        { new: true, runValidators: true }
      );
      if (!task) { // Should theoretically not happen if findById worked
          return res.status(404).json({ msg: 'Task not found after update attempt.'})
      }
      res.json(task);
    } catch (err) {
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: 'Validation failed', errors: err.errors });
      }
      next(err);
    }
  }
);


// --- Route added in Commit 19 (Bob) ---
// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    // Find the task first to ensure it exists and to check ownership
    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if the logged-in user owns the task
    if (task.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // If checks pass, delete the task
    // Option 1: Using the document instance (if you needed the task object for something else)
    // await task.remove();
    // Option 2: Finding and deleting directly by ID (slightly more efficient if task object not needed)
    await Task.findByIdAndDelete(req.params.id);

    // Send success response
    res.json({ msg: 'Task removed successfully' });

  } catch (err) {
    // Handle potential errors like invalid ObjectId format
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    // Pass other errors to the central handler
    next(err);
  }
});
// --- End Route added in Commit 19 ---


/* --- Placeholder Comment ---
 * Further routes or modifications might be added below.
 * Task routes are now complete for basic CRUD operations.
 * --- End Placeholder Comment ---
 */

// Export the router
module.exports = router;