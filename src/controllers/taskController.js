// src/controllers/taskController.js
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
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
};

// @desc    Get all tasks for user (with filtering)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const filter = { owner: req.user.id }; // Base filter: user's tasks

    // Add status filtering
    if (req.query.status) {
      // Basic validation: ensure status is one of the allowed values
      const allowedStatuses = ['pending', 'in-progress', 'completed'];
      if (allowedStatuses.includes(req.query.status)) {
           filter.status = req.query.status; // Add status to filter if valid
      } else {
          // Optional: return error for invalid status query
          // return res.status(400).json({ msg: 'Invalid status value for filtering' });
          // Or just ignore invalid status and return all user tasks
      }
    }

    // Find tasks only for the logged-in user, applying the filter
    const tasks = await Task.find(filter);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
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
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { description, status } = req.body;
  const taskFields = {};
  if (description !== undefined) taskFields.description = description;
  if (status !== undefined) taskFields.status = status;

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

    res.json(task);
  } catch (err) {
     if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
     }
     next(err);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    if (task.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await task.remove();

    res.json({ msg: 'Task removed successfully' });
  } catch (err) {
     if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
     }
     next(err);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};