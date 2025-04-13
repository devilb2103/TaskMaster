// tests/routes/users.test.js
const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('User API Routes', () => {
	const userData = {
		name: 'Auth Tester',
		email: 'auth@example.com',
		password: 'password123',
	};
	let token; // To store token after login

	// Clean users before each test in this suite
	beforeEach(async () => {
		await User.deleteMany({});
	});

	// --- POST /api/users/register ---
	describe('POST /api/users/register', () => {
		it('should register a new user successfully', async () => {
			const res = await request(app)
				.post('/api/users/register')
				.send(userData);

			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty('token'); // Registration returns token upon success

			// Verify user exists in DB and password is hashed
			const userInDb = await User.findOne({ email: userData.email });
			expect(userInDb).not.toBeNull();
			expect(userInDb.name).toBe(userData.name);
			expect(userInDb.password).not.toBe(userData.password);
		});

		it('should return 400 if email already exists', async () => {
			// Register user first
			await request(app).post('/api/users/register').send(userData);

			// Attempt to register again with same email
			const res = await request(app)
				.post('/api/users/register')
				.send(userData);

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain('Duplicate field value entered'); // Based on improved errorHandler
		});

		it('should return 400 for invalid input data (e.g., short password)', async () => {
			const invalidData = { ...userData, password: '123' };
			const res = await request(app)
				.post('/api/users/register')
				.send(invalidData);

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain('6 or more characters'); // Based on improved errorHandler or validator response
		});

		it('should return 400 if name is missing', async () => {
			const invalidData = {
				email: 'noname@example.com',
				password: 'password123',
			};
			const res = await request(app)
				.post('/api/users/register')
				.send(invalidData);
			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain('Name is required');
		});
	});

	// --- POST /api/users/login ---
	describe('POST /api/users/login', () => {
		// Register user before login tests
		beforeEach(async () => {
			await request(app).post('/api/users/register').send(userData);
		});

		it('should login user successfully with correct credentials', async () => {
			const res = await request(app)
				.post('/api/users/login')
				.send({ email: userData.email, password: userData.password });

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('token');
			token = res.body.token; // Save token for next test
		});

		it('should return 401 for incorrect password', async () => {
			const res = await request(app)
				.post('/api/users/login')
				.send({ email: userData.email, password: 'wrongpassword' });

			expect(res.statusCode).toEqual(401); // Use 401 for auth failures
			expect(res.body).not.toHaveProperty('token');
			expect(res.body.error).toContain('Invalid Credentials');
		});

		it('should return 401 for non-existent email', async () => {
			const res = await request(app)
				.post('/api/users/login')
				.send({
					email: 'nosuchuser@example.com',
					password: 'password123',
				});

			expect(res.statusCode).toEqual(401);
			expect(res.body).not.toHaveProperty('token');
			expect(res.body.error).toContain('Invalid Credentials');
		});

		it('should return 400 if email or password missing', async () => {
			const res = await request(app)
				.post('/api/users/login')
				.send({ email: userData.email }); // Missing password
			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain('Password is required');
		});
	});

	// --- GET /api/users/me ---
	describe('GET /api/users/me', () => {
		// Need to register and login first to get a token
		beforeEach(async () => {
			await request(app).post('/api/users/register').send(userData);
			const loginRes = await request(app)
				.post('/api/users/login')
				.send({ email: userData.email, password: userData.password });
			token = loginRes.body.token;
		});

		it('should get current user profile with valid token', async () => {
			const res = await request(app)
				.get('/api/users/me')
				.set('Authorization', `Bearer ${token}`); // Attach token

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('email', userData.email);
			expect(res.body).toHaveProperty('name', userData.name);
			expect(res.body).not.toHaveProperty('password'); // Ensure password is not sent
		});

		it('should return 401 if no token is provided', async () => {
			const res = await request(app).get('/api/users/me');
			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toContain('No token');
		});

		it('should return 401 if token is invalid or expired', async () => {
			const invalidToken = 'Bearer invalid.token.string';
			const res = await request(app)
				.get('/api/users/me')
				.set('Authorization', invalidToken);
			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toContain('Invalid token'); // Or "token failed" etc.
		});
	});
});
