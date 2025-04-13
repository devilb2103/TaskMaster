// src/routes/users.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth'); // <-- Import protect middleware

const router = express.Router();

// --- Register Route ---
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }
      user = new User({ name, email, password });
      await user.save();
      // Generate token upon registration as well (good practice)
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        (err, token) => {
          if (err) return next(err);
          res.status(201).json({ token }); // Send token directly on registration
        }
      );
    } catch (err) {
      next(err);
    }
  }
);

// --- Login Route ---
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
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        (err, token) => {
          if (err) return next(err);
          res.status(200).json({ token });
        }
      );
    } catch (err) {
      next(err);
    }
  }
);

// --- Start: GET User Profile Route Added in Commit 20 ---
// @route   GET api/users/me
// @desc    Get current logged-in user's profile
// @access  Private
router.get(
    '/me',
    protect, // Apply the authentication middleware first
    async (req, res) => {
        // If protect middleware succeeds, req.user will contain the user document (minus password)
        // No database call needed here as protect middleware already fetched the user.
        res.json(req.user);
    }
);
// --- End: GET User Profile Route Added in Commit 20 ---


module.exports = router;