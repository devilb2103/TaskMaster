// src/routes/users.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// @route   POST api/users/register
// @desc    Register user
// @access  Public
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
  async (req, res) => {
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

      user = new User({ name, email, password }); // WARNING: Plain text password

      await user.save();
      res.status(201).send('User registered'); // Token sending will be added later
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error during registration');
    }
  }
);

module.exports = router;