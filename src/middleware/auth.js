// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Need User model to find user from token payload

// Middleware function to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from the 'Bearer <token>' string
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Token is valid, find the user associated with the token's ID
      // Attach the user document (excluding the password) to the request object
      // This makes user info available in subsequent route handlers
      req.user = await User.findById(decoded.user.id).select('-password');

      // Double-check if user still exists (they might have been deleted after token was issued)
      if (!req.user) {
          return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      // User is authenticated, proceed to the next middleware or route handler
      next();

    } catch (error) {
      // Handle different JWT errors
      console.error('Token verification error:', error.message);
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ msg: 'Not authorized, token invalid' });
      } else if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ msg: 'Not authorized, token expired' });
      } else {
          // General failure
          return res.status(401).json({ msg: 'Not authorized, token failed' });
      }
    }
  }

  // If the token is missing from the header entirely
  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token provided' });
  }
};

module.exports = protect;