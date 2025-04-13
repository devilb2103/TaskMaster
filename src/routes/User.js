// src/routes/users.js
const express = require('express');
// Import check from express-validator
const { check } = require('express-validator');
const protect = require('../middleware/auth'); // Assuming protect middleware exists
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser, // Assuming logoutUser controller exists
  // updateUserProfile, // Example placeholder if update route exists
} = require('../controllers/userController'); // Assuming controllers exist

const router = express.Router();

// --- Validation rules for POST /api/users/register ---
const registerUserValidation = [
  check('name', 'Name is required and cannot be empty') // Improved message
    .not().isEmpty()
    .trim(),
  check('email', 'Please include a valid email address') // Improved message
    .isEmail()
    .normalizeEmail(), // Sanitize email
  check('password', 'Password is required and must be at least 6 characters long') // Improved message
    .isLength({ min: 6 }),
];

// --- Validation rules for POST /api/users/login ---
const loginUserValidation = [
  check('email', 'Please provide a valid email address') // Improved message
    .isEmail()
    .normalizeEmail(),
  check('password', 'Password is required') // Improved message (just check existence)
    .exists(), // Check if password field is present in the request body
];

// --- Routes ---
// Use the defined validation middleware arrays
router.post('/register', registerUserValidation, registerUser);

router.post('/login', loginUserValidation, loginUser);

router.get('/me', protect, getUserProfile); // No body validation needed

router.post('/logout', protect, logoutUser); // No body validation needed

// Example placeholder for potential update route
// const updateUserValidation = [
//   protect,
//   check('name', 'Name cannot be empty if provided').optional().not().isEmpty().trim(),
//   check('email', 'Please provide a valid email address if updating').optional().isEmail().normalizeEmail(),
// ];
// router.put('/me', updateUserValidation, updateUserProfile);

module.exports = router;