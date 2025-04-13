// src/controllers/userController.js
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// bcryptjs is used implicitly via user.matchPassword and the pre-save hook

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res, next) => {
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
        await user.save(); // Hashing happens via pre-save hook

        // Generate token upon registration
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
            (err, token) => {
                if (err) return next(err); // Pass error to central handler
                res.status(201).json({ token });
            }
        );
    } catch (err) {
        next(err); // Pass errors (e.g., duplicate key) to central handler
    }
};


// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] }); // Use 401 for auth failure
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] }); // Use 401
        }

        // User is valid, create JWT payload
        const payload = { user: { id: user.id } };

        // Sign the token
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
};


// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is attached by the protect middleware in the route definition
    // It already excludes the password due to .select('-password') in the middleware
    res.json(req.user);
};

// --- Start: Added in Commit 38 ---
// @desc    Logout user (Conceptual)
// @route   POST /api/users/logout
// @access  Private
const logoutUser = (req, res) => {
    // For stateless JWT, the primary action is client-side (deleting the token).
    // This endpoint confirms the intention and allows for potential future logic
    // like adding the token to a blacklist if implementing stateful sessions.
    res.status(200).json({ message: 'Logout successful. Please clear token client-side.' });
};
// --- End: Added in Commit 38 ---


module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser, // <-- Export the new function
};