// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware function to protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
          return res.status(401).json({ msg: 'Not authorized, user session invalid' });
      }

      next();

    // --- Start: Modified Error Handling in Commit 23 ---
    } catch (error) {
      console.error('Token verification error:', error.message); // Keep logging for server visibility

      // Check for specific JWT error types
      if (error.name === 'JsonWebTokenError') {
           // Covers invalid signature, malformed token etc.
           return res.status(401).json({ msg: 'Not authorized, token invalid' });
      } else if (error.name === 'TokenExpiredError') {
           // Specific message for expired tokens
           return res.status(401).json({ msg: 'Not authorized, token expired' });
      } else {
          // Fallback for any other unexpected errors during verification
          return res.status(401).json({ msg: 'Not authorized, token failed' });
      }
    // --- End: Modified Error Handling in Commit 23 ---
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token provided' });
  }
};

module.exports = protect;