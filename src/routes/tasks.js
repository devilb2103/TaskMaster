/**
 * File: src/routes/tasks.js
 * =========================
 * STATE AFTER BOB'S COMMIT 17: 'feat: Implement GET single task by ID'
 * =========================
 *
 * History incorporated into this file state:
 * - Commit 7 (Bob): Added initial POST / route (without auth/owner)
 * - Commit 10 (Bob): Added initial GET / route (fetches all tasks)
 * - Commit 14 (Bob): Protected POST /, associated task owner.
 * - Commit 16 (Bob): Protected GET /, filtered GET / by task owner.
 * - Commit 17 (Bob): Added GET /:id route, protected it, added ownership check.
 *
 * Note: Assumes 'Task' model has 'owner' field (added Commit 15 - Charlie).
 *       Assumes 'protect' middleware exists (added Commit 13 - Alice).
 *       Assumes centralized error handling via 'next(err)' is used.
 */

// Import required modules
const express = require('express');
const { check, validationResult } = require('express-validator'); // Used since Commit 7
const Task = require('../models/Task'); // Model defined in Commit 5 (Bob), owner added Commit 15 (Charlie)
const protect = require('../middleware/auth'); // Auth middleware from Commit 13 (Alice)

// Initialize router
const router = express.Router();

// --- Route from Commit 7, Modified in Commit 14 ---
// @route   POST api/tasks
// @desc    Create a task
// @access  Private (Enforced since Commit 14)
router.post(
  '/',
  [
    protect, // Apply the 'protect' middleware
    check('description', 'Description is required').not().isEmpty(),
    // Add validation for other fields like 'status' if they exist by now
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // User ID from protect middleware
      const newTask = new Task({
        description: req.body.description,
        // status: req.body.status || 'pending', // Example if status model field exists
        owner: req.user.id // Associate task with logged-in user's ID
      });

      const task = await newTask.save();
      res.status(201).json(task);
    } catch (err) {
      next(err); // Pass errors to central handler
    }
  }
);
// --- End Route from Commit 7 (Modified) ---

// --- Route from Commit 10, Modified in Commit 16 ---
// @route   GET api/tasks
// @desc    Get all tasks for the logged-in user
// @access  Private (Enforced since Commit 16)
router.get('/', protect, async (req, res, next) => { // 'protect' added in Commit 16
  try {
    // Find tasks only for the logged-in user (filter added in Commit 16)
    const tasks = await Task.find({ owner: req.user.id });
    res.json(tasks);
  } catch (err) {
    next(err); // Pass errors to central handler
  }
});
// --- End Route from Commit 10 (Modified) ---

// --- Route added in Commit 17 (Bob) ---
// @route   GET api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => { // Added protect middleware
  try {
    // Find the task by the ID provided in the URL parameters
    const task = await Task.findById(req.params.id);

    // Check if a task with that ID exists
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // IMPORTANT: Check if the found task belongs to the logged-in user
    // Comparing ObjectId (task.owner) with string (req.user.id)
    if (task.owner.toString() !== req.user.id) {
      // If owner doesn't match, user is not authorized to see this task
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // If task exists and user is authorized, return the task
    res.json(task);

  } catch (err) {
    // Handle potential errors, specifically invalid ObjectId format
    // Mongoose throws CastError for invalid IDs, often with kind === 'ObjectId'
    if (err.kind === 'ObjectId') {
      // Treat invalid ID format as 'Not Found'
      return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    // Pass any other errors to the central error handler
    next(err);
  }
});
// --- End Route added in Commit 17 ---


/* --- Placeholder Comment ---
 * More routes will be added below in subsequent commits:
 * - PUT /api/tasks/:id (Commit 18 - Bob)
 * - DELETE /api/tasks/:id (Commit 19 - Bob)
 * --- End Placeholder Comment ---
 */

// Export the router to be mounted in the main application file
module.exports = router;