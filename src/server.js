// src/server.js
const app = require('./app');
const config = require('./config/config'); // Import the new config object

// Use config.port and config.nodeEnv instead of process.env
const PORT = config.port;

const server = app.listen(PORT, () => {
	console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`); // Use config values
});

process.on('unhandledRejection', (err, promise) => {
	console.error(`Unhandled Rejection: ${err.message}`);
	server.close(() => process.exit(1));
});
