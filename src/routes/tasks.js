// src/routes/tasks.js
const express = require('express');
const { check, body } = require('express-validator'); // Import body for specific checks
const protect = require('../middleware/auth');
const {
	createTask,
	getTasks,
	getTaskById,
	updateTask,
	deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// Validation rules can be defined separately for clarity
const createTaskValidation = [
	check('description', 'Description is required').not().isEmpty().trim(),
	// *** ADDED: Optional validation for dueDate format ***
	// This check ensures if dueDate is provided, it looks like a date.
	// Mongoose handles the actual casting later. isISO8601() is strict.
	// Use .optional() so it doesn't fail if dueDate is omitted.
	body('dueDate')
		.optional({ checkFalsy: true })
		.isISO8601()
		.withMessage(
			'Due date must be a valid ISO 8601 date (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
		),
	body('status')
		.optional()
		.isIn(['pending', 'in-progress', 'completed'])
		.withMessage('Invalid status value'),
];

const updateTaskValidation = [
	// Use .optional() for update fields
	body('description')
		.optional()
		.not()
		.isEmpty()
		.withMessage('Description cannot be empty if provided')
		.trim(),
	body('status')
		.optional()
		.isIn(['pending', 'in-progress', 'completed'])
		.withMessage('Invalid status value'),
	// *** ADDED: Optional validation for dueDate update ***
	// Allow empty string or null explicitly, otherwise validate format
	body('dueDate')
		.optional({ nullable: true, checkFalsy: true })
		.if((value) => value !== null && value !== '')
		.isISO8601()
		.withMessage('Due date must be a valid ISO 8601 date if provided'),
];

// Apply protect middleware to all task routes
router.use(protect);

// Define routes using controller functions and validation
router
	.route('/')
	.post(createTaskValidation, createTask) // Apply validation middleware before controller
	.get(getTasks);

router
	.route('/:id')
	.get(getTaskById) // ID validation done in controller
	.put(updateTaskValidation, updateTask) // Apply validation for update
	.delete(deleteTask); // ID validation done in controller

module.exports = router;
