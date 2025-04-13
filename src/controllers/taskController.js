// src/controllers/taskController.js
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  // ... (no changes in this commit)
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
  } catch (err) { next(err); }
};

// @desc    Get all tasks for user (with filtering and sorting)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const filter = { owner: req.user.id };

    // Status filtering logic (from commit 26)
    if (req.query.status) {
      const allowedStatuses = ['pending', 'in-progress', 'completed'];
      if (allowedStatuses.includes(req.query.status)) {
           filter.status = req.query.status;
      }
    }

    // Sorting logic
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':'); // e.g., 'createdAt:desc' or 'status:asc'
        const allowedSortFields = ['createdAt', 'status', 'description']; // Define fields allowed for sorting
        if(allowedSortFields.includes(parts[0])){
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; // Mongoose sort syntax (1 for asc, -1 for desc)
        } else {
            // Optional: Ignore invalid sort field or return error
        }
    } else {
        sort.createdAt = -1; // Default sort: newest first
    }

    // Apply filter and sort
    const tasks = await Task.find(filter).sort(sort);

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  // ... (no changes in this commit)
  try {
    const task = await Task.findById(req.params.id);
    if (!task) { return res.status(404).json({ msg: 'Task not found' }); }
    if (task.owner.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
    res.json(task);
  } catch (err) {
    if (err.kind === 'ObjectId') { return res.status(404).json({ msg: 'Task not found (invalid ID format)' }); }
    next(err);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  // ... (no changes in this commit)
  const errors = validationResult(req);
  if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
  const { description, status } = req.body;
  const taskFields = {};
  if (description !== undefined) taskFields.description = description;
  if (status !== undefined) taskFields.status = status;
  try {
    let task = await Task.findById(req.params.id);
    if (!task) { return res.status(404).json({ msg: 'Task not found' }); }
    if (task.owner.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
    task = await Task.findByIdAndUpdate(req.params.id, { $set: taskFields }, { new: true, runValidators: true });
    res.json(task);
  } catch (err) {
     if (err.kind === 'ObjectId') { return res.status(404).json({ msg: 'Task not found (invalid ID format)' }); }
     next(err);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  // ... (no changes in this commit)
   try {
    const task = await Task.findById(req.params.id);
    if (!task) { return res.status(404).json({ msg: 'Task not found' }); }
    if (task.owner.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
    await task.remove();
    res.json({ msg: 'Task removed successfully' });
  } catch (err) {
     if (err.kind === 'ObjectId') { return res.status(404).json({ msg: 'Task not found (invalid ID format)' }); }
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