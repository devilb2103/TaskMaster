const express = require('express');
const { check, validationResult } = require('express-validator');
const Task = require('../models/Task');
const protect = require('../middleware/auth');
const {
  createTask, getTasks, getTaskById, updateTask, deleteTask // Import controller functions
} = require('../controllers/taskController');

// Initialize router
const router = express.Router();
// Export the router
router.post('/', [protect, /* validation */], createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', [protect, /* validation */], updateTask);
router.delete('/:id', protect, deleteTask);
module.exports = router;