/**
 * File: tests/tasks.integration.test.js
 * =======================================
 * STATE AFTER BOB'S COMMIT 37: 'refactor: Add pagination to GET /tasks'
 * =======================================
 *
 * History incorporated into this file state:
 * - Commit 32 (Bob): Established basic integration tests for CRUD endpoints.
 * - Commit 37 (Bob): Added/modified tests within 'GET /api/tasks' section
 *                    to verify pagination query parameters ('page', 'limit')
 *                    and the updated response structure.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Import the configured Express app
const User = require('../src/models/User'); // To create test users and get tokens
const Task = require('../src/models/Task'); // To verify DB state or create tasks directly

describe('Task API Integration Tests (/api/tasks)', () => {
	// --- Test Setup ---
	let userOneToken, userOneId;
	let userTwoToken, userTwoId;
	let taskOneId; // To store ID of a task created by userOne for other tests

	// Setup: Create two users, get their tokens, create initial task before each test block
	beforeEach(async () => {
		// Clean database collections
		await User.deleteMany();
		await Task.deleteMany();

		// Create User One
		const userOneData = {
			name: 'User One',
			email: 'userone@test.com',
			password: 'password1',
		};
		await request(app).post('/api/users/register').send(userOneData);
		const loginResOne = await request(app)
			.post('/api/users/login')
			.send({ email: userOneData.email, password: userOneData.password });
		userOneToken = loginResOne.body.token;
		const userOne = await User.findOne({ email: userOneData.email });
		userOneId = userOne._id;

		// Create User Two
		const userTwoData = {
			name: 'User Two',
			email: 'usertwo@test.com',
			password: 'password2',
		};
		await request(app).post('/api/users/register').send(userTwoData);
		const loginResTwo = await request(app)
			.post('/api/users/login')
			.send({ email: userTwoData.email, password: userTwoData.password });
		userTwoToken = loginResTwo.body.token;
		const userTwo = await User.findOne({ email: userTwoData.email });
		userTwoId = userTwo._id;

		// Create one initial task for User One (used in GET /:id, PUT, DELETE tests)
		const taskOne = await Task.create({
			description: 'User One - Initial Task',
			owner: userOneId,
		});
		taskOneId = taskOne._id;
	});
	// --- End Test Setup ---

	// Test POST /api/tasks (Keep tests from Commit 32)
	describe('POST /api/tasks', () => {
		it('should create a task for an authenticated user', async () => {
			const taskData = { description: 'New Task By User One' };
			const res = await request(app)
				.post('/api/tasks')
				.set('Authorization', `Bearer ${userOneToken}`)
				.send(taskData);

			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty('_id');
			expect(res.body.description).toBe(taskData.description);
			expect(res.body.owner).toBe(userOneId.toString());
			const taskInDb = await Task.findById(res.body._id);
			expect(taskInDb).not.toBeNull();
			expect(taskInDb.description).toBe(taskData.description);
		});

		it('should return 401 if user is not authenticated', async () => {
			const taskData = { description: 'Unauthorized Task' };
			const res = await request(app).post('/api/tasks').send(taskData);
			expect(res.statusCode).toEqual(401);
		});

		it('should return 400 if description is missing', async () => {
			const res = await request(app)
				.post('/api/tasks')
				.set('Authorization', `Bearer ${userOneToken}`)
				.send({});
			expect(res.statusCode).toEqual(400);
			expect(res.body.errors[0].msg).toContain(
				'Task description is required and cannot be empty'
			);
		});
	});

	// Test GET /api/tasks (Modify tests, Add pagination tests from Commit 37)
	describe('GET /api/tasks', () => {
		it('should get tasks only for the authenticated user (default pagination)', async () => {
			// Add a second task for user one
			await Task.create({
				description: 'User One - Second Task',
				owner: userOneId,
			});
			// Add a task for user two (should not be returned)
			await Task.create({
				description: 'User Two - Task X',
				owner: userTwoId,
			});

			const res = await request(app)
				.get('/api/tasks') // No query params -> defaults (page 1, limit 10)
				.set('Authorization', `Bearer ${userOneToken}`);

			expect(res.statusCode).toEqual(200);
			// --- Check Pagination Structure (Added/Verified in Commit 37) ---
			expect(res.body).toHaveProperty('tasks');
			expect(res.body).toHaveProperty('currentPage', 1);
			expect(res.body).toHaveProperty('totalPages', 1); // 2 tasks total for user one, default limit 10 -> 1 page
			expect(res.body).toHaveProperty('totalTasks', 2); // Only count user one's tasks
			expect(res.body).toHaveProperty('limit', 10); // Default limit
			// --- End Pagination Structure Check ---

			expect(Array.isArray(res.body.tasks)).toBe(true);
			expect(res.body.tasks.length).toBe(2); // Should get both tasks of User One
			// Check descriptions (order might depend on default sort)
			const descriptions = res.body.tasks.map((t) => t.description);
			expect(descriptions).toContain('User One - Initial Task');
			expect(descriptions).toContain('User One - Second Task');
			// Ensure all returned tasks belong to user one
			expect(
				res.body.tasks.every((t) => t.owner === userOneId.toString())
			).toBe(true);
		});

		// --- Tests Added/Modified in Commit 37 ---
		it('should handle limit and page query parameters for pagination', async () => {
			// Create 15 additional tasks for user one (total 16 for user one)
			const tasksToCreate = [];
			for (let i = 1; i <= 15; i++) {
				// Add some delay or unique property if timestamp-based sorting is very precise
				tasksToCreate.push({
					description: `User One - Pagination Task ${i}`,
					owner: userOneId,
				});
			}
			await Task.insertMany(tasksToCreate);
			// Add a task for user two (should not affect counts/results for user one)
			await Task.create({
				description: 'User Two - Task Y',
				owner: userTwoId,
			});

			// Request Page 2 with Limit 5
			const resPage2 = await request(app)
				.get('/api/tasks?page=2&limit=5')
				.set('Authorization', `Bearer ${userOneToken}`);

			expect(resPage2.statusCode).toEqual(200);
			expect(resPage2.body.tasks.length).toBe(5); // Should get 5 tasks on page 2
			expect(resPage2.body.currentPage).toBe(2);
			expect(resPage2.body.limit).toBe(5);
			expect(resPage2.body.totalTasks).toBe(16); // Total tasks for user one
			expect(resPage2.body.totalPages).toBe(Math.ceil(16 / 5)); // 16 / 5 = 3.2 -> 4 pages

			// Request Page 4 with Limit 5 (should contain the last task)
			const resPage4 = await request(app)
				.get('/api/tasks?page=4&limit=5')
				.set('Authorization', `Bearer ${userOneToken}`);

			expect(resPage4.statusCode).toEqual(200);
			expect(resPage4.body.tasks.length).toBe(1); // Only 1 task remaining on page 4 (16 total, 5*3=15)
			expect(resPage4.body.currentPage).toBe(4);
			expect(resPage4.body.limit).toBe(5);
			expect(resPage4.body.totalTasks).toBe(16);
			expect(resPage4.body.totalPages).toBe(4);

			// Request Page 5 (should be empty)
			const resPage5 = await request(app)
				.get('/api/tasks?page=5&limit=5')
				.set('Authorization', `Bearer ${userOneToken}`);
			expect(resPage5.statusCode).toEqual(200);
			expect(resPage5.body.tasks.length).toBe(0);
			expect(resPage5.body.currentPage).toBe(5);
			expect(resPage5.body.totalPages).toBe(4); // Total pages doesn't change
		});

		it('should handle filtering with pagination', async () => {
			// Add specific tasks for filtering test
			await Task.create({
				description: 'User One - Pending 1',
				owner: userOneId,
				status: 'pending',
			});
			await Task.create({
				description: 'User One - Pending 2',
				owner: userOneId,
				status: 'pending',
			});
			await Task.create({
				description: 'User One - Completed 1',
				owner: userOneId,
				status: 'completed',
			});
			// Note: User One also has the 'Initial Task' with default 'pending' status

			// Get first page of pending tasks, limit 2
			const res = await request(app)
				.get('/api/tasks?status=pending&limit=2&page=1')
				.set('Authorization', `Bearer ${userOneToken}`);

			expect(res.statusCode).toEqual(200);
			expect(res.body.tasks.length).toBe(2); // Should get 2 tasks
			expect(res.body.tasks.every((t) => t.status === 'pending')).toBe(
				true
			); // Verify status
			expect(res.body.totalTasks).toBe(3); // 1 initial + 2 new pending tasks for user one matching filter
			expect(res.body.totalPages).toBe(Math.ceil(3 / 2)); // 3 pending / limit 2 = 1.5 -> 2 pages
			expect(res.body.currentPage).toBe(1);
			expect(res.body.limit).toBe(2);
		});

		it('should handle sorting with pagination', async () => {
			// Add tasks out of order
			await Task.create({
				description: 'User One - Task C',
				owner: userOneId,
			}); // Created after initial
			await Task.create({
				description: 'User One - Task A',
				owner: userOneId,
			}); // Created last

			// Get page 1, limit 2, sorted by description ascending
			const res = await request(app)
				.get('/api/tasks?sortBy=description:asc&limit=2&page=1')
				.set('Authorization', `Bearer ${userOneToken}`);

			expect(res.statusCode).toEqual(200);
			expect(res.body.tasks.length).toBe(2);
			expect(res.body.tasks[0].description).toBe(
				'User One - Initial Task'
			); // I comes before P, T
			expect(res.body.tasks[1].description).toBe('User One - Task A'); // A comes before C
			expect(res.body.totalTasks).toBe(3); // Initial + Task C + Task A
			expect(res.body.currentPage).toBe(1);
			expect(res.body.totalPages).toBe(Math.ceil(3 / 2)); // 2 pages
		});
		// --- End Tests Added/Modified in Commit 37 ---

		it('should return 401 if user is not authenticated', async () => {
			const res = await request(app).get('/api/tasks');
			expect(res.statusCode).toEqual(401);
		});
	});

	// Test GET /api/tasks/:id (Keep tests from Commit 32)
	describe('GET /api/tasks/:id', () => {
		it('should get a specific task by ID if owned by the user', async () => {
			const res = await request(app)
				.get(`/api/tasks/${taskOneId}`)
				.set('Authorization', `Bearer ${userOneToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body._id).toBe(taskOneId.toString());
			expect(res.body.description).toBe('User One - Initial Task');
		});
		it('should return 401 if user tries to get a task they do not own', async () => {
			const res = await request(app)
				.get(`/api/tasks/${taskOneId}`)
				.set('Authorization', `Bearer ${userTwoToken}`);
			expect(res.statusCode).toEqual(401);
		});
		it('should return 404 if task ID is invalid', async () => {
			const res = await request(app)
				.get(`/api/tasks/invalidObjectIdFormat`)
				.set('Authorization', `Bearer ${userOneToken}`);
			expect(res.statusCode).toEqual(404);
		});
		it('should return 404 if task ID does not exist', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.get(`/api/tasks/${nonExistentId}`)
				.set('Authorization', `Bearer ${userOneToken}`);
			expect(res.statusCode).toEqual(404);
		});
		it('should return 401 if user is not authenticated', async () => {
			const res = await request(app).get(`/api/tasks/${taskOneId}`);
			expect(res.statusCode).toEqual(401);
		});
	});

	// Test PUT /api/tasks/:id (Keep tests from Commit 32)
	describe('PUT /api/tasks/:id', () => {
		it('should update a task if owned by the user', async () => {
			const updates = {
				description: 'Updated Task Desc',
				status: 'completed',
			};
			const res = await request(app)
				.put(`/api/tasks/${taskOneId}`)
				.set('Authorization', `Bearer ${userOneToken}`)
				.send(updates);
			expect(res.statusCode).toEqual(200);
			expect(res.body.description).toBe(updates.description);
			expect(res.body.status).toBe(updates.status);
			const updatedTask = await Task.findById(taskOneId);
			expect(updatedTask.description).toBe(updates.description);
			expect(updatedTask.status).toBe(updates.status);
		});
		it('should return 401 if user tries to update a task they do not own', async () => {
			const res = await request(app)
				.put(`/api/tasks/${taskOneId}`)
				.set('Authorization', `Bearer ${userTwoToken}`)
				.send({ description: 'Attempted Update' });
			expect(res.statusCode).toEqual(401);
		});
		it('should return 401 if user is not authenticated', async () => {
			const res = await request(app)
				.put(`/api/tasks/${taskOneId}`)
				.send({ description: 'Unauthorized Update' });
			expect(res.statusCode).toEqual(401);
		});
		it('should return 404 if task ID does not exist', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.put(`/api/tasks/${nonExistentId}`)
				.set('Authorization', `Bearer ${userOneToken}`)
				.send({ description: 'Update Non-Existent' });
			expect(res.statusCode).toEqual(404);
		});
	});

	// Test DELETE /api/tasks/:id (Keep tests from Commit 32)
	describe('DELETE /api/tasks/:id', () => {
		it('should delete a task if owned by the user', async () => {
			const res = await request(app)
				.delete(`/api/tasks/${taskOneId}`)
				.set('Authorization', `Bearer ${userOneToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.msg).toContain('Task removed successfully');
			const deletedTask = await Task.findById(taskOneId);
			expect(deletedTask).toBeNull();
		});
		it('should return 401 if user tries to delete a task they do not own', async () => {
			const res = await request(app)
				.delete(`/api/tasks/${taskOneId}`)
				.set('Authorization', `Bearer ${userTwoToken}`);
			expect(res.statusCode).toEqual(401);
			const taskExists = await Task.findById(taskOneId);
			expect(taskExists).not.toBeNull();
		});
		it('should return 401 if user is not authenticated', async () => {
			const res = await request(app).delete(`/api/tasks/${taskOneId}`);
			expect(res.statusCode).toEqual(401);
		});
		it('should return 404 if task ID does not exist', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.delete(`/api/tasks/${nonExistentId}`)
				.set('Authorization', `Bearer ${userOneToken}`);
			expect(res.statusCode).toEqual(404);
		});
	});
}); // End describe Task API
