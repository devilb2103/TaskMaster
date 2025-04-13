// src/routes/users.js
const express = require('express');
const { check } = require('express-validator');
const protect = require('../middleware/auth');
const {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
    updateUserProfile, // <-- Import the new controller function
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


// --- Start: Added in Commit 42 ---
// @route   PUT api/users/me
// @desc    Update current user's profile (name, email)
// @access  Private
router.put(
    '/me',
    protect, // User must be logged in
    // Optional: Add express-validator checks here for name/email format if desired
    updateUserProfile // Use the controller function
);
// --- End: Added in Commit 42 ---

module.exports = router;