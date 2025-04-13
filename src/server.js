// src/server.js
// (Should match the state from the previous response for Commit 21)
const app = require('./app');
const config = require('../config/config');

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
	console.log(
		`Server running in ${
			config.nodeEnv || 'development'
		} mode on port ${PORT}`
	);
});

process.on('unhandledRejection', (err, promise) => {
	console.error(`Unhandled Rejection: ${err.message}`);
	server.close(() => process.exit(1));
});
