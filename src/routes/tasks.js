// src/routes/tasks.js
const express = require('express');
// Import check from express-validator
const { check } = require('express-validator');
const protect = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// --- Validation rules for POST /api/tasks ---
const createTaskValidation = [
  protect, // Apply authentication middleware first
  check('description', 'Task description is required and cannot be empty') // Improved message
    .not().isEmpty()
    .trim(), // Remove leading/trailing whitespace
  check('status', 'Invalid status value. Must be one of: pending, in-progress, completed') // Improved message
    .optional() // Status is optional on creation (defaults in model/controller)
    .isIn(['pending', 'in-progress', 'completed']),
  check('dueDate', 'Due date must be a valid ISO 8601 date (YYYY-MM-DDTHH:mm:ss.sssZ)') // Improved message
    .optional({ checkFalsy: true }) // Allow null or empty string if optional
    .isISO8601().toDate(), // Validate format and convert
];

// --- Validation rules for PUT /api/tasks/:id ---
const updateTaskValidation = [
  protect, // Apply authentication middleware first
  check('description', 'Task description cannot be empty if provided') // Improved message for optional update
    .optional() // Description is optional on update
    .not().isEmpty()
    .trim(),
  check('status', 'Invalid status value. Must be one of: pending, in-progress, completed') // Improved message
    .optional() // Status is optional on update
    .isIn(['pending', 'in-progress', 'completed']),
  check('dueDate', 'Due date must be a valid ISO 8601 date (YYYY-MM-DDTHH:mm:ss.sssZ)') // Improved message
    .optional({ checkFalsy: true })
    .isISO8601().toDate(),
];

// --- Routes ---
// Use the defined validation middleware arrays
router.post('/', createTaskValidation, createTask);

router.get('/', protect, getTasks); // No body validation needed for GET all

router.get('/:id', protect, getTaskById); // No body validation needed for GET by ID

router.put('/:id', updateTaskValidation, updateTask);

router.delete('/:id', protect, deleteTask); // No body validation needed for DELETE

module.exports = router;