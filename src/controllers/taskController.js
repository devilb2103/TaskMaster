// src/controllers/taskController.js
const Task = require('../models/Task');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose'); // Needed for ObjectId validation if done here

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// Let the central error handler format this based on its logic
		// Consider creating a custom error class for validation if needed
		return res.status(400).json({
			success: false,
			error: errors
				.array()
				.map((e) => e.msg)
				.join(', '),
		});
	}

	try {
		// Extract fields, including the new dueDate
		const { description, status, dueDate } = req.body;

		const taskData = {
			description,
			owner: req.user.id,
		};

		// Only set status if provided, otherwise rely on model default
		if (status) {
			taskData.status = status;
		}

		// *** ADDED: Handle dueDate ***
		if (dueDate) {
			// Basic validation: ensure it's a valid date string if provided
			if (isNaN(Date.parse(dueDate))) {
				return res
					.status(400)
					.json({
						success: false,
						error: 'Invalid due date format provided',
					});
			}
			taskData.dueDate = dueDate; // Mongoose will cast string to Date if valid
		}

		const task = await Task.create(taskData); // Use create for simplicity
		res.status(201).json({ success: true, data: task });
	} catch (err) {
		next(err); // Pass to central error handler
	}
};

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
	try {
		const filter = { owner: req.user.id };
		if (req.query.status) {
			filter.status = req.query.status;
		}
		// *** ADDED: Filtering by due date might be added later ***
		// Example: if (req.query.dueBefore) { filter.dueDate = { $lte: new Date(req.query.dueBefore) }; }

		const sort = {};
		if (req.query.sortBy) {
			const parts = req.query.sortBy.split(':');
			// *** ADDED: Allow sorting by dueDate ***
			if (
				['createdAt', 'status', 'description', 'dueDate'].includes(
					parts[0]
				)
			) {
				sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
			}
		} else {
			sort.createdAt = -1; // Default sort
		}

		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const skip = (page - 1) * limit;

		const tasks = await Task.find(filter)
			.sort(sort)
			.limit(limit)
			.skip(skip);

		const totalTasks = await Task.countDocuments(filter);

		res.json({
			success: true,
			count: tasks.length, // Count on current page
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalTasks / limit),
				totalTasks,
			},
			data: tasks,
		});
	} catch (err) {
		next(err);
	}
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
	try {
		// Basic validation for ObjectId format before hitting DB (optional)
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res
				.status(404)
				.json({
					success: false,
					error: `Task not found (invalid ID format)`,
				});
		}

		const task = await Task.findById(req.params.id);

		if (!task) {
			return res
				.status(404)
				.json({
					success: false,
					error: `Task not found with id ${req.params.id}`,
				});
		}

		// Check ownership
		if (task.owner.toString() !== req.user.id) {
			return res
				.status(401)
				.json({
					success: false,
					error: 'Not authorized to access this task',
				});
		}

		res.json({ success: true, data: task });
	} catch (err) {
		// Catch potential CastErrors not caught by initial check (though less likely now)
		next(err);
	}
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			error: errors
				.array()
				.map((e) => e.msg)
				.join(', '),
		});
	}

	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res
				.status(404)
				.json({
					success: false,
					error: `Task not found (invalid ID format)`,
				});
		}

		let task = await Task.findById(req.params.id);

		if (!task) {
			return res
				.status(404)
				.json({
					success: false,
					error: `Task not found with id ${req.params.id}`,
				});
		}

		// Check ownership
		if (task.owner.toString() !== req.user.id) {
			return res
				.status(401)
				.json({
					success: false,
					error: 'Not authorized to update this task',
				});
		}

		// Prepare fields to update from request body
		const { description, status, dueDate } = req.body;
		const fieldsToUpdate = {};
		if (description !== undefined) fieldsToUpdate.description = description;
		if (status !== undefined) fieldsToUpdate.status = status; // Rely on schema enum validation

		// *** ADDED: Handle dueDate update ***
		if (dueDate !== undefined) {
			// Allow setting dueDate to null/empty string to clear it
			if (dueDate === null || dueDate === '') {
				fieldsToUpdate.dueDate = null;
			} else if (isNaN(Date.parse(dueDate))) {
				// If a non-empty value is provided, validate it
				return res
					.status(400)
					.json({
						success: false,
						error: 'Invalid due date format provided for update',
					});
			} else {
				fieldsToUpdate.dueDate = dueDate;
			}
		}

		// Prevent updating owner or createdAt/updatedAt directly
		delete fieldsToUpdate.owner;
		delete fieldsToUpdate.createdAt;
		delete fieldsToUpdate.updatedAt;

		// Check if there's anything actually to update
		if (Object.keys(fieldsToUpdate).length === 0) {
			return res
				.status(400)
				.json({
					success: false,
					error: 'No valid fields provided for update',
				});
		}

		// Perform the update
		task = await Task.findByIdAndUpdate(
			req.params.id,
			{ $set: fieldsToUpdate },
			{ new: true, runValidators: true } // Return updated doc, run schema validators
		);

		res.json({ success: true, data: task });
	} catch (err) {
		next(err);
	}
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res
				.status(404)
				.json({
					success: false,
					error: `Task not found (invalid ID format)`,
				});
		}

		const task = await Task.findById(req.params.id);

		if (!task) {
			return res
				.status(404)
				.json({
					success: false,
					error: `Task not found with id ${req.params.id}`,
				});
		}

		// Check ownership
		if (task.owner.toString() !== req.user.id) {
			return res
				.status(401)
				.json({
					success: false,
					error: 'Not authorized to delete this task',
				});
		}

		await task.remove(); // Or Task.findByIdAndDelete(req.params.id);

		res.json({
			success: true,
			message: 'Task removed successfully',
			data: {},
		}); // Standardize response
	} catch (err) {
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
