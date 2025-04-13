// src/server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('../config/db');

const app = express();
const PORT = process.env.PORT || 3000;
connectDB();

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
	res.send('TaskMaster API Running!');
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

app.use('/api/users', require('../src/routes/users'));
app.use('/api/tasks', require('../src/routes/tasks')); // Mount task routes