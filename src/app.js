// src/app.js
// (Should match the state from the previous response for Commit 21)
require('dotenv').config();
const express = require('express');
const morgan = require('morgan'); // Assuming Commit 30 happened
const connectDB = require('../config/db');
const errorHandler = require('./middleware/errorHandler');
const config = require('../config/config'); // Assuming Commit 43 or similar config setup

// Connect to Database
connectDB();

const app = express();

// Middlewares
if (config.nodeEnv === 'development') {
	app.use(morgan('dev'));
}
app.use(express.json());

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));

// Test/Root Route
app.get('/', (req, res) => {
	res.send('TaskMaster API is running...');
});

// Central Error Handler
app.use(errorHandler);

module.exports = app; // Export app for testing and server.js
