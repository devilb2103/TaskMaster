// config/config.js
// Centralized configuration management
require('dotenv').config({
	path: require('path').resolve(__dirname, '../.env'),
}); // Load .env from root

const config = {
	// Server Configuration
	port: process.env.PORT || 3000,
	nodeEnv: process.env.NODE_ENV || 'development',

	// Database Configuration
	mongoURI:
		process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmaster-api-dev', // Provide a default (e.g., for local dev)

	// JWT Configuration
	jwtSecret:
		process.env.JWT_SECRET || 'your_fallback_secret_key_DO_NOT_USE_IN_PROD', // !! Use a strong secret in .env !!
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h', // Default expiration time

	// Add other configurations as needed (e.g., email settings, external API keys)
	// mail: {
	//   host: process.env.MAIL_HOST,
	//   port: process.env.MAIL_PORT || 587,
	//   user: process.env.MAIL_USER,
	//   pass: process.env.MAIL_PASS,
	// }
};

// Validation (Optional but Recommended)
if (!config.mongoURI) {
	console.error(
		'FATAL ERROR: MONGO_URI is not defined in environment variables or config defaults.'
	);
	process.exit(1);
}
if (
	config.nodeEnv !== 'development' &&
	config.jwtSecret === 'your_fallback_secret_key_DO_NOT_USE_IN_PROD'
) {
	console.warn(
		'WARNING: Using default fallback JWT secret in non-development environment. Set JWT_SECRET environment variable!'
	);
} else if (!config.jwtSecret) {
	console.error('FATAL ERROR: JWT_SECRET is not defined.');
	process.exit(1);
}

module.exports = Object.freeze(config); // Freeze to prevent accidental modification
