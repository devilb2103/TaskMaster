// src/server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('../config/db');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
connectDB();

app.use(express.json()); // Middleware to parse JSON bodies

app.use('/api/users', require('../src/routes/users'));
app.use('/api/tasks', require('../src/routes/tasks'));

app.get('/', (req, res) => {
	res.send('TaskMaster API Running!');
});

app.use('/api/users', require('../src/routes/users'));
app.use('/api/tasks', require('../src/routes/tasks')); // Mount task routes

app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
