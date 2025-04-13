// src/routes/users.js
const express = require('express');
const { check } = require('express-validator'); // Keep validator check definitions here
const protect = require('../middleware/auth');
// Import controller functions
const {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
} = require('../controllers/userController');

const router = express.Router();

// --- Routes now point to controller functions ---

// @route   POST api/users/register
router.post(
  '/register',
  [ // Validation definitions stay with the route
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  registerUser // Use the controller function
);

// @route   POST api/users/login
router.post(
  '/login',
  [ // Validation definitions stay with the route
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  loginUser // Use the controller function
);

// @route   GET api/users/me
router.get(
    '/me',
    protect, // Middleware applied here
    getMe // Use the controller function
);
// --- Start: Added in Commit 38 ---
// @route   POST api/users/logout
// @desc    Logout user (clears client token conceptually)
// @access  Private
router.post(
  '/logout',
  protect, // Requires user to be logged in to log out
  logoutUser // Use the controller function
);
// --- End: Added in Commit 38 ---


module.exports = router;