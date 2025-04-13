// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../../config/config'); // Import the new config object

const protect = async (req, res, next) => {
	let token;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		try {
			token = req.headers.authorization.split(' ')[1];

			// Use config.jwtSecret instead of process.env.JWT_SECRET
			const decoded = jwt.verify(token, config.jwtSecret);

			req.user = await User.findById(decoded.user.id).select('-password');

			if (!req.user) {
				return res
					.status(401)
					.json({
						success: false,
						error: 'Not authorized, user not found',
					});
			}
			next();
		} catch (error) {
			console.error('Token verification failed:', error.message);
			// ... (keep existing specific error handling for TokenExpiredError etc.) ...
			if (error.name === 'JsonWebTokenError') {
				return res
					.status(401)
					.json({
						success: false,
						error: 'Not authorized, invalid token',
					});
			} else if (error.name === 'TokenExpiredError') {
				return res
					.status(401)
					.json({
						success: false,
						error: 'Not authorized, token expired',
					});
			} else {
				return res
					.status(401)
					.json({
						success: false,
						error: 'Not authorized, token failed',
					});
			}
		}
	}

	if (!token) {
		res.status(401).json({
			success: false,
			error: 'Not authorized, no token',
		});
	}
};

module.exports = protect;
