// src/routes/tasks.js

const express = require('express');
const { check, validationResult } = require('express-validator');
const Task = require('../models/Task');
const protect = require('../middleware/auth'); 
// Auth middleware will be added later

const router = express.Router();

// @route   POST api/tasks
// @desc    Create a task
// @access  Private (will be enforced later)
router.post(
  '/',
  [
    protect,
    check('description', 'Description is required').not().isEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newTask = new Task({
        description: req.body.description,
        owner: req.user.id // Will be added with auth
      });

      const task = await newTask.save();
      res.status(201).json(task);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error while creating task');
      next(err);
    }
  }
);

router.get('/', protect, async (req, res, next) => { // Add next parameter
    try {
      const tasks = await Task.find({ owner: req.user.id }); // Fetches all tasks for now
      if (!task) {
        return res.status(404).json({ msg: 'Task not found' });
      }
  
      // Check if the task belongs to the logged-in user
      if (task.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
      res.json(tasks);
    } catch (err) {
      console.error(err.message); // Keep specific log for now
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
      }
      next(err); // Pass error to central handler
    }
  });
  

module.exports = router;