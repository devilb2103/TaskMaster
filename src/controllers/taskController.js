// src/controllers/taskController.js
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// @desc    Create a task
const createTask = async (req, res, next) => {
   // Move logic from POST '/' route handler here...
   // Remember to include validation check
   const errors = validationResult(req);
   if (!errors.isEmpty()) { /* ... */ }
   try {
       const newTask = new Task({
           description: req.body.description,
           status: req.body.status || 'pending', // Example
           owner: req.user.id
       });
       const task = await newTask.save();
       res.status(201).json(task);
   } catch (err) { next(err); }
};

// @desc    Get all tasks for user
const getTasks = async (req, res, next) => {
   // Move logic from GET '/' route handler here...
   try {
       const tasks = await Task.find({ owner: req.user.id });
       res.json(tasks);
   } catch (err) { next(err); }
};

// @desc    Get single task by ID
const getTaskById = async (req, res, next) => { /* ... Move GET /:id logic ... */ };

// @desc    Update a task
const updateTask = async (req, res, next) => { /* ... Move PUT /:id logic ... */ };

// @desc    Delete a task
const deleteTask = async (req, res, next) => { /* ... Move DELETE /:id logic ... */ };

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};