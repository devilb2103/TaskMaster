// tests/setup.js
// Configures the in-memory MongoDB server for Jest tests

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Runs once before all tests
beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create(); // Start in-memory server
	const mongoUri = mongoServer.getUri(); // Get its connection string

	mongoose.set('strictQuery', true);

	// Connect Mongoose to the in-memory database
	await mongoose.connect(mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	console.log(`MongoDB Memory Server started at ${mongoUri}`);
});

// Runs before each test -> Clears all collections
beforeEach(async () => {
	const collections = mongoose.connection.collections;
	for (const key in collections) {
		const collection = collections[key];
		await collection.deleteMany({}); // Clear data, keep schemas/indexes
	}
});

// Runs once after all tests
afterAll(async () => {
	if (mongoServer) {
		await mongoose.connection.dropDatabase(); // Drop the test database
		await mongoose.connection.close(); // Disconnect mongoose
		await mongoServer.stop(); // Stop the in-memory server
		console.log('MongoDB Memory Server stopped.');
	}
});
