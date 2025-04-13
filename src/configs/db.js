// config/db.js (Created by Bob - Commit 3)
const mongoose = require('mongoose');
// const config = require('./config'); // Or use process.env directly

const connectDB = async () => {
	try {
		// const mongoURI = config.mongoURI || process.env.MONGO_URI;
		const mongoURI = process.env.MONGO_URI; // Get URI from environment

		if (!mongoURI) {
			console.error('FATAL ERROR: MONGO_URI is not defined.');
			process.exit(1);
		}

		await mongoose.connect(mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			// Mongoose 6 doesn't need these anymore:
			// useCreateIndex: true,
			// useFindAndModify: false
		});
		console.log('MongoDB Connected...');
	} catch (err) {
		console.error('MongoDB Connection Error:', err.message);
		process.exit(1); // Exit process with failure
	}
};

module.exports = connectDB;
