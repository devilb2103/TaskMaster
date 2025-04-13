/**
 * File: src/controllers/taskController.js
 * =======================================
 * STATE AFTER BOB'S COMMIT 37: 'refactor: Add pagination to GET /tasks'
 * =======================================
 *
 * History incorporated into this file state:
 * - Commit 24 (Bob): Extracted controller logic from routes.
 * - Commits 26, 27 (Charlie): Added filtering by status and sorting logic (assumed present).
 * - Commit 37 (Bob): Modified 'getTasks' to handle 'page'/'limit' query params for pagination.
 *                    Updated response structure for paginated results.
 */

// Import required modules
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// @desc    Create a task
// @route   POST /api/tasks (Logic for this route)
// @access  Private
const createTask = async (req, res, next) => {
  // Validation result from middleware run in routes/tasks.js
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // User ID is attached by 'protect' middleware in routes/tasks.js
    const newTask = new Task({
      description: req.body.description,
      status: req.body.status || 'pending', // Assuming status field exists
      owner: req.user.id, // Associate task with logged-in user's ID
      dueDate: req.body.dueDate || null // Assuming dueDate field exists (Commit 31)
    });

    const task = await newTask.save();
    res.status(201).json(task); // Respond with the created task
  } catch (err) {
    next(err); // Pass errors to the central handler
  }
};

// --- Function Modified in Commit 37 ---
// @desc    Get all tasks for the logged-in user (with filtering, sorting, pagination)
// @route   GET /api/tasks (Logic for this route)
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    // --- Filtering Logic (Assumed from Commit 26 - Charlie) ---
    const filter = { owner: req.user.id }; // Base filter: user's tasks
    if (req.query.status) {
      // Add validation for status if needed
      filter.status = req.query.status; // Add status to filter
    }
    // Add other potential filters here
    // --- End Filtering Logic ---

    // --- Sorting Logic (Assumed from Commit 27 - Charlie) ---
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':'); // e.g., 'createdAt:desc' or 'dueDate:asc'
      const allowedSortFields = ['createdAt', 'updatedAt', 'description', 'status', 'dueDate']; // Define valid sort fields
      if (allowedSortFields.includes(parts[0])) {
         sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; // Mongoose sort syntax (-1 desc, 1 asc)
      } else {
          // Optional: return error or ignore invalid sort field
          console.log(`Ignoring invalid sort field: ${parts[0]}`);
      }
    }
    // Apply default sort if no valid sort provided or none at all
    if (Object.keys(sort).length === 0) {
        sort.createdAt = -1; // Default sort: newest first
    }
    // --- End Sorting Logic ---

    // --- Pagination Logic Added/Refined in Commit 37 ---
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const defaultLimit = 10;
    const effectiveLimit = (limit && limit > 0) ? limit : defaultLimit; // Use default if invalid or missing
    // Optional: set a max limit
    // const maxLimit = 50;
    // const finalLimit = Math.min(effectiveLimit, maxLimit);
    const finalLimit = effectiveLimit;

    const currentPage = (page && page > 0) ? page : 1; // Default to page 1 if invalid or missing
    const skip = (currentPage - 1) * finalLimit; // Calculate documents to skip
    // --- End Pagination Logic ---

    // Execute query with filter, sort, skip, and limit
    const tasksQuery = Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(finalLimit); // Apply limit

    // Get the tasks for the current page AND the total count matching the filter
    // Use Promise.all for concurrent execution
    const [tasks, totalTasks] = await Promise.all([
        tasksQuery.exec(), // Execute the main query
        Task.countDocuments(filter) // Count documents matching the filter only
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalTasks / finalLimit);

    // Respond with tasks and pagination metadata
    res.json({
      tasks, // The array of tasks for the current page
      currentPage: currentPage,
      totalPages: totalPages,
      totalTasks: totalTasks,
      limit: finalLimit // Send back the limit that was actually used
    });

  } catch (err) {
    next(err); // Pass errors to the central handler
  }
};
// --- End Function Modified in Commit 37 ---

// @desc    Get single task by ID
// @route   GET /api/tasks/:id (Logic for this route)
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
// @route   PUT /api/tasks/:id (Logic for this route)
// @access  Private
const updateTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { description, status, completed, dueDate } = req.body; // Adjust based on model
  const taskFields = {};
  if (description !== undefined) taskFields.description = description;
  if (status !== undefined) taskFields.status = status;
  if (completed !== undefined) taskFields.completed = completed; // If using 'completed' boolean
  if (dueDate !== undefined) taskFields.dueDate = dueDate; // If using 'dueDate'
  if (req.body.owner) {
      return res.status(400).json({ msg: 'Cannot transfer task ownership via update.' });
  }
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
      { new: true, runValidators: true } // Options: return updated doc, run validators
    );
    if (!task) {
        return res.status(404).json({ msg: 'Task not found after update attempt.'})
    }
    res.json(task);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id (Logic for this route)
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
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task removed successfully' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found (invalid ID format)' });
    }
    next(err);
  }
};

// Export all controller functions
module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};