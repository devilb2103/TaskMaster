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
// --- Start: Added in Commit 42 ---
// @desc    Update user profile (name, email)
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = async (req, res, next) => {
    // Validation (optional, could be done in the route definition too)
    // Example: check('name', 'Name is required if provided').optional().not().isEmpty();

    try {
        // Get user from the protect middleware
        const user = await User.findById(req.user.id);

        if (!user) {
            // Should ideally not happen if protect middleware worked, but good check
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields if they are provided in the request body
        user.name = req.body.name || user.name;

        // Handle email update carefully - check for duplicates
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            // Ensure the found email doesn't belong to the current user making the request
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                return res.status(400).json({ errors: [{ msg: 'Email already in use by another account' }] });
            }
            user.email = req.body.email;
        }

        // Note: Password updates are typically handled in a separate dedicated route
        // for security reasons (e.g., requiring current password).

        const updatedUser = await user.save(); // runValidators might be implicitly true or add { runValidators: true } option

        // Send back updated user profile (excluding password)
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt, // Include other relevant fields if needed
        });

    } catch (err) {
        next(err); // Pass errors (like validation errors from save) to central handler
    }
};
// --- End: Added in Commit 42 ---


module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
    updateUserProfile, // <-- Export the new function
};