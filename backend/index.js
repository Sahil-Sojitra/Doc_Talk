const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const documentRoutes = require('./routes/document');
const authRoutes = require('./routes/auth');
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

app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);

// Centralized error handler (including Multer/file upload errors)
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    if (!err) return next();

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'File too large. Max size is 10MB.' });
        }
        return res.status(400).json({ message: err.message || 'File upload error' });
    }

    // Custom invalid file type error (from fileFilter)
    if (err.code === 'INVALID_FILE_TYPE' || err.message === 'Only PDF files are allowed') {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    return res.status(500).json({ message: err.message || 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});