// src/server.js
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
	res.send('TaskMaster API Running!');
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
