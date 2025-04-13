// tests/routes/tasks.test.js
const request = require('supertest');
const app = require('../../src/app'); // Import the configured app
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Task = require('../../src/models/Task');

describe('Task API Routes', () => {
	let token;
	let userId;
	let otherUserId;
	let taskId;

	// Setup: Create two users, log in one, create a task for them
	beforeEach(async () => {
		// User 1 (will be logged in)
		const user1 = await User.create({
			name: 'Task API User',
			email: 'taskapi@example.com',
			password: 'password123',
		});
		userId = user1._id;

		// User 2 (for ownership tests)
		const user2 = await User.create({
			name: 'Other User',
			email: 'other@example.com',
			password: 'password456',
		});
		otherUserId = user2._id;

		// Login User 1
		const loginRes = await request(app)
			.post('/api/users/login')
			.send({ email: 'taskapi@example.com', password: 'password123' });
		token = loginRes.body.token;

		// Create a task for User 1
		const task = await Task.create({
			description: 'Initial Test Task',
			owner: userId,
		});
		taskId = task._id;
	});

	// --- POST /api/tasks ---
	describe('POST /api/tasks', () => {
		it('should create a task for authenticated user', async () => {
			const res = await request(app)
				.post('/api/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send({ description: 'New task via API' });

			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty('description', 'New task via API');
			expect(res.body).toHaveProperty('owner', userId.toString());
			expect(res.body).toHaveProperty('status', 'pending');
		});

		it('should return 401 if not authenticated', async () => {
			const res = await request(app)
				.post('/api/tasks')
				.send({ description: 'Unauthorized task' });
			expect(res.statusCode).toEqual(401);
		});

		it('should return 400 if description is missing', async () => {
			const res = await request(app)
				.post('/api/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send({}); // Missing description
			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain('Description is required');
		});
	});

	// --- GET /api/tasks ---
	describe('GET /api/tasks', () => {
		it('should get tasks for authenticated user', async () => {
			// Create another task for the user to test retrieval of multiple tasks
			await Task.create({
				description: 'Second Task',
				owner: userId,
				status: 'in-progress',
			});
			// Create a task for the other user (should not be returned)
			await Task.create({
				description: 'Other User Task',
				owner: otherUserId,
			});

			const res = await request(app)
				.get('/api/tasks')
				.set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.tasks)).toBe(true); // Assuming pagination response structure
			expect(res.body.tasks.length).toBe(2); // Only tasks for logged-in user
			expect(res.body.tasks[0].owner.toString()).toEqual(
				userId.toString()
			);
			expect(res.body.tasks[1].owner.toString()).toEqual(
				userId.toString()
			);
		});

		it('should filter tasks by status', async () => {
			await Task.create({
				description: 'Completed Task',
				owner: userId,
				status: 'completed',
			});

			const res = await request(app)
				.get('/api/tasks?status=completed') // Filter by status
				.set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toEqual(200);
			expect(res.body.tasks.length).toBe(1);
			expect(res.body.tasks[0].status).toBe('completed');
		});

		// Add tests for sorting and pagination here...

		it('should return 401 if not authenticated', async () => {
			const res = await request(app).get('/api/tasks');
			expect(res.statusCode).toEqual(401);
		});
	});

	// --- GET /api/tasks/:id ---
	describe('GET /api/tasks/:id', () => {
		it('should get a specific task by ID for authenticated user', async () => {
			const res = await request(app)
				.get(`/api/tasks/${taskId}`)
				.set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('_id', taskId.toString());
			expect(res.body).toHaveProperty('description', 'Initial Test Task');
		});

		it('should return 404 for non-existent task ID', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.get(`/api/tasks/${nonExistentId}`)
				.set('Authorization', `Bearer ${token}`);
			expect(res.statusCode).toEqual(404);
		});

		it('should return 404 for invalid ObjectId format', async () => {
			const res = await request(app)
				.get(`/api/tasks/invalidIdFormat`)
				.set('Authorization', `Bearer ${token}`);
			expect(res.statusCode).toEqual(404); // Or 500 if errorHandler doesn't handle CastError well
			expect(res.body.error).toMatch(
				/Resource not found|Cast to ObjectId failed/
			); // Adjust based on errorHandler
		});

		it("should return 401 if user tries to get another user's task", async () => {
			const otherTask = await Task.create({
				description: 'Other Task',
				owner: otherUserId,
			});
			const res = await request(app)
				.get(`/api/tasks/${otherTask._id}`)
				.set('Authorization', `Bearer ${token}`); // Logged in as User 1
			expect(res.statusCode).toEqual(401); // Or 404 depending on implementation
		});

		it('should return 401 if not authenticated', async () => {
			const res = await request(app).get(`/api/tasks/${taskId}`);
			expect(res.statusCode).toEqual(401);
		});
	});

	// --- PUT /api/tasks/:id ---
	describe('PUT /api/tasks/:id', () => {
		it('should update a task for authenticated user', async () => {
			const updates = {
				description: 'Updated Task Description',
				status: 'completed',
			};
			const res = await request(app)
				.put(`/api/tasks/${taskId}`)
				.set('Authorization', `Bearer ${token}`)
				.send(updates);

			expect(res.statusCode).toEqual(200);
			expect(res.body.description).toBe(updates.description);
			expect(res.body.status).toBe(updates.status);

			// Verify in DB
			const updatedTask = await Task.findById(taskId);
			expect(updatedTask.description).toBe(updates.description);
			expect(updatedTask.status).toBe(updates.status);
		});

		it("should return 401 if user tries to update another user's task", async () => {
			const otherTask = await Task.create({
				description: 'Other Task to Update',
				owner: otherUserId,
			});
			const res = await request(app)
				.put(`/api/tasks/${otherTask._id}`)
				.set('Authorization', `Bearer ${token}`) // Logged in as User 1
				.send({ description: 'Attempted Update' });
			expect(res.statusCode).toEqual(401); // Or 404
		});

		it('should return 404 for non-existent task ID', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.put(`/api/tasks/${nonExistentId}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ description: 'Update non-existent' });
			expect(res.statusCode).toEqual(404);
		});

		it('should return 401 if not authenticated', async () => {
			const res = await request(app)
				.put(`/api/tasks/${taskId}`)
				.send({ description: 'Unauthorized update' });
			expect(res.statusCode).toEqual(401);
		});
	});

	// --- DELETE /api/tasks/:id ---
	describe('DELETE /api/tasks/:id', () => {
		it('should delete a task for authenticated user', async () => {
			const res = await request(app)
				.delete(`/api/tasks/${taskId}`)
				.set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toEqual({
				success: true,
				message: 'Task removed successfully',
			}); // Adjust message based on controller

			// Verify task is deleted from DB
			const deletedTask = await Task.findById(taskId);
			expect(deletedTask).toBeNull();
		});

		it("should return 401 if user tries to delete another user's task", async () => {
			const otherTask = await Task.create({
				description: 'Other Task to Delete',
				owner: otherUserId,
			});
			const res = await request(app)
				.delete(`/api/tasks/${otherTask._id}`)
				.set('Authorization', `Bearer ${token}`); // Logged in as User 1
			expect(res.statusCode).toEqual(401); // Or 404
		});

		it('should return 404 for non-existent task ID', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.delete(`/api/tasks/${nonExistentId}`)
				.set('Authorization', `Bearer ${token}`);
			expect(res.statusCode).toEqual(404);
		});

		it('should return 401 if not authenticated', async () => {
			const res = await request(app).delete(`/api/tasks/${taskId}`);
			expect(res.statusCode).toEqual(401);
		});
	});
});
