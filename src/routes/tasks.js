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

router.get('/', async (req, res, next) => { // Add next parameter
    try {
      const tasks = await Task.find(); // Fetches all tasks for now
      res.json(tasks);
    } catch (err) {
      console.error(err.message); // Keep specific log for now
      next(err); // Pass error to central handler
    }
  });
  

module.exports = router;