// src/routes/users.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken'); // <-- Added jsonwebtoken import
const User = require('../models/User');

const router = express.Router();

// --- Register Route (Unchanged from Commit 11) ---
router.post( '/register', /* ... existing code ... */ async (req, res, next) => { /* ... */ });


// --- Login Route (Modified in Commit 12) ---
// @route   POST api/users/login
// @desc    Authenticate user & get JWT token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // --- Start: JWT Generation Added in Commit 12 ---
      // User is valid, create JWT payload
      const payload = {
        user: {
          id: user.id // Include user ID in the payload
          // Can add other non-sensitive info like name/role if needed
        },
      };

      // Sign the token using the secret and set expiration
      jwt.sign(
        payload,
        process.env.JWT_SECRET, // Get secret from environment variables
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }, // Get expiration from env or default
        (err, token) => {
          if (err) {
              // If signing fails, pass error to central handler
              return next(err);
          }
          // Send the token back to the client
          res.status(200).json({ token });
        }
      );
      // --- End: JWT Generation Added in Commit 12 ---

    } catch (err) {
      next(err);
    }
  }
);


module.exports = router;