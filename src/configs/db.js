// config/db.js
const mongoose = require('mongoose');
const config = require('./config'); // Import the new config object

const connectDB = async () => {
	try {
		// Use config.mongoURI instead of process.env.MONGO_URI
		await mongoose.connect(config.mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('MongoDB Connected...');
	} catch (err) {
		console.error('MongoDB Connection Error:', err.message);
		process.exit(1);
	}
};

module.exports = connectDB;
