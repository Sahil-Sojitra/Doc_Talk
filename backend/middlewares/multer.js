/**
 * Multer Middleware Configuration
 * Multer is a library that handles file uploads in Express.
 * This file configures HOW files are handled:
 * - WHERE they are stored (memory, disk, or cloud)
 * - WHAT TYPE of files are allowed (only PDFs in our case)
 * - HOW BIG they can be (max 10MB)
 */

const multer = require("multer");

// --- Storage Configuration ---
// memoryStorage() keeps the file in RAM instead of writing to disk.
// This allows us to process the file immediately without disk I/O.
// The file is accessed via req.file.buffer or req.files[].buffer
const storage = multer.memoryStorage();

// --- File Filter Function ---
// This function runs for EVERY file upload.
// It decides whether to accept or reject the file based on type.
const fileFilter = (req, file, cb) => {
    // Get the file's MIME type (e.g., "application/pdf") and convert to lowercase
    const mime = (file.mimetype || "").toLowerCase();
    
    // Get the original filename and convert to lowercase
    const name = (file.originalname || "").toLowerCase();

    // Check 1: Does the MIME type indicate a PDF?
    // Some systems send "application/pdf", others send "application/x-pdf"
    const isPdfMime = mime === "application/pdf" || mime === "application/x-pdf";
    
    // Check 2: Does the filename end with .pdf extension?
    const isPdfByName = name.endsWith(".pdf");
    
    // Check 3: Edge case for some browsers that send PDFs as generic binary
    // If MIME is unknown BUT filename ends in .pdf, it's probably a PDF
    const isGenericButPdf = mime === "application/octet-stream" && isPdfByName;

    // Accept file if ANY of the checks pass
    if (isPdfMime || isGenericButPdf || isPdfByName) {
        cb(null, true); // cb(null, true) = "Accept this file"
        return;
    }

    // Reject file with a custom error
    const err = new Error("Only PDF files are allowed");
    err.code = "INVALID_FILE_TYPE"; // Custom error code for our error handler
    cb(err, false); // cb(err, false) = "Reject this file with an error"
};

// --- Export Multer Middleware ---
// This middleware is used in routes like: router.post('/upload', upload.any(), controller)
module.exports = multer({
    storage,           // Use memory storage
    fileFilter,        // Use our custom filter
    limits: {
        fileSize: 10 * 1024 * 1024 // Max 10MB per file
    }
});
