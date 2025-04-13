const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
	{
		description: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			// Add status field
			type: String,
			required: true,
			enum: ['pending', 'in-progress', 'completed'], // Define allowed values
			default: 'pending',
		},
		owner: {
			// Add owner field
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User', // Reference the User model
		},
		dueDate: {
			// *** ADDED dueDate Field ***
			type: Date,
			// Optional: Add validation, e.g., cannot be in the past (more complex)
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		// Owner will be added later
	},
	{
		timestamps: true, // Optional: Automatically adds createdAt and updatedAt
	}
);

TaskSchema.index({ owner: 1 });
TaskSchema.index({ owner: 1, status: 1 });
TaskSchema.index({ owner: 1, dueDate: 1 }); // Index for sorting/querying by due date

module.exports = mongoose.model('Task', TaskSchema);
