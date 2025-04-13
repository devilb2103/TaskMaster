// tests/models/Task.test.js
const mongoose = require('mongoose');
const Task = require('../../models/Task');
const User = require('../../models/User'); // Needed for owner ref

describe('Task Model Test', () => {
	let testUserId;

	// Create a dummy user before running task tests to satisfy 'owner' requirement
	beforeAll(async () => {
		const testUser = new User({
			name: 'Task Tester',
			email: 'tasktest@example.com',
			password: 'password123',
		});
		const savedUser = await testUser.save();
		testUserId = savedUser._id;
	});

	it('should create & save a task successfully', async () => {
		const taskData = {
			description: 'Test task description',
			owner: testUserId,
		};
		const validTask = new Task(taskData);
		const savedTask = await validTask.save();

		// Object Id should be defined when successfully saved to MongoDB.
		expect(savedTask._id).toBeDefined();
		expect(savedTask.description).toBe(taskData.description);
		expect(savedTask.status).toBe('pending'); // Default status
		expect(savedTask.owner).toEqual(testUserId);
		expect(savedTask.createdAt).toBeDefined();
	});

	it('should fail to create task without required description field', async () => {
		const taskWithoutDesc = new Task({ owner: testUserId });
		let err;
		try {
			await taskWithoutDesc.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
		expect(err.errors.description).toBeDefined();
	});

	it('should fail to create task without required owner field', async () => {
		const taskWithoutOwner = new Task({
			description: 'Task missing owner',
		});
		let err;
		try {
			await taskWithoutOwner.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
		expect(err.errors.owner).toBeDefined();
	});

	it('should have status enum validation', async () => {
		const taskWithInvalidStatus = new Task({
			description: 'Invalid status task',
			owner: testUserId,
			status: 'invalid-enum-value',
		});
		let err;
		try {
			await taskWithInvalidStatus.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
		expect(err.errors.status).toBeDefined();
		expect(err.errors.status.message).toContain(
			'is not a valid enum value'
		);
	});

	// Add more tests if there are other validations or methods on the Task model
});
