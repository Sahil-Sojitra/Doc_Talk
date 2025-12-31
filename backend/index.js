const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Sample route
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server running" });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});