// tests/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('User Model Test', () => {
	it('should create & save user successfully', async () => {
		const userData = {
			name: 'Test User',
			email: 'test@example.com',
			password: 'password123',
		};
		const validUser = new User(userData);
		const savedUser = await validUser.save();

		expect(savedUser._id).toBeDefined();
		expect(savedUser.name).toBe(userData.name);
		expect(savedUser.email).toBe(userData.email);
		expect(savedUser.password).not.toBe(userData.password); // Password should be hashed
		expect(savedUser.password.length).toBeGreaterThan(
			userData.password.length
		);
		expect(savedUser.createdAt).toBeDefined();
	});

	it('should fail for user without required fields (e.g., email)', async () => {
		const userWithoutEmail = new User({
			name: 'Test',
			password: 'password123',
		});
		let err;
		try {
			await userWithoutEmail.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
		expect(err.errors.email).toBeDefined();
	});

	it('should fail for user with invalid email format', async () => {
		const userData = {
			name: 'Test User',
			email: 'invalid-email',
			password: 'password123',
		};
		const invalidUser = new User(userData);
		let err;
		try {
			await invalidUser.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
		expect(err.errors.email).toBeDefined();
	});

	it('should enforce unique email constraint', async () => {
		const userData = {
			name: 'Unique Tester',
			email: 'unique@example.com',
			password: 'password123',
		};
		await new User(userData).save(); // Save the first user

		const duplicateUser = new User(userData); // Try to save another with the same email
		let err;
		try {
			await duplicateUser.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeDefined();
		// Mongoose duplicate key error code is 11000
		expect(err.code).toBe(11000);
	});

	it('should hash password before saving', async () => {
		const plainPassword = 'mySecretPassword';
		const user = new User({
			name: 'Hasher',
			email: 'hasher@example.com',
			password: plainPassword,
		});
		const savedUser = await user.save();
		expect(savedUser.password).not.toBe(plainPassword);
		// Bcrypt hash typically starts with $2a$, $2b$, or $2y$
		expect(savedUser.password).toMatch(/^\$2[aby]\$/);
	});

	it('matchPassword method should return true for correct password', async () => {
		const plainPassword = 'correctPassword';
		const user = new User({
			name: 'Matcher',
			email: 'matcher@example.com',
			password: plainPassword,
		});
		const savedUser = await user.save();

		const isMatch = await savedUser.matchPassword(plainPassword);
		expect(isMatch).toBe(true);
	});

	it('matchPassword method should return false for incorrect password', async () => {
		const plainPassword = 'correctPassword';
		const user = new User({
			name: 'Mismatcher',
			email: 'mismatcher@example.com',
			password: plainPassword,
		});
		const savedUser = await user.save();

		const isMatch = await savedUser.matchPassword('wrongPassword');
		expect(isMatch).toBe(false);
	});

	it('should require password length >= 6', async () => {
		const shortPasswordUser = new User({
			name: 'Shorty',
			email: 'shorty@example.com',
			password: '123',
		});
		let err;
		try {
			await shortPasswordUser.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
		expect(err.errors.password).toBeDefined();
		expect(err.errors.password.message).toContain('6 or more characters');
	});
});
