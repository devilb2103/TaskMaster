// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
	console.error('ERROR:', err.stack); // Log the error stack trace

	const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if status code wasn't set
	res.status(statusCode);

	res.json({
		message: err.message,
		// Optionally include stack trace in development environment only
		stack: process.env.NODE_ENV === 'production' ? null : err.stack,
	});
};

module.exports = errorHandler;
