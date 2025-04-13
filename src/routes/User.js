// src/routes/users.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
// bcrypt is NOT needed here, hashing is done in the model

const router = express.Router();

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    // Validation rules remain the same
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  // --- Start: Modified in Commit 9 ---
  // Added 'next' parameter to the function signature
  async (req, res, next) => {
  // --- End: Modified in Commit 9 ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        // User exists check remains the same
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Create new user instance - password will be hashed by the pre-save hook
      user = new User({ name, email, password });

      // Hashing happens automatically within this save() call due to the pre-save hook
      await user.save();

      // Response logic (will be enhanced later with JWT)
      res.status(201).send('User registered');

    // --- Start: Modified in Commit 9 ---
    } catch (err) {
      // Pass any error (duplicate email error from DB, hashing error, etc.)
      // to the central error handling middleware
      next(err);
    // --- End: Modified in Commit 9 ---
    }
  }
);

// Login route and other user routes will be added in subsequent commits

module.exports = router;