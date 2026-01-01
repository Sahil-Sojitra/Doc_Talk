/**
 * Document Routes
 * This file maps URLs to document controller functions.
 * All routes are PROTECTED with auth middleware (must provide valid JWT token).
 */

const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer");   // File validation middleware
const auth = require("../middlewares/auth");       // Authentication middleware

const {
    uploadDocument,
    getDocuments,
    getDocumentById,
    deleteDocument
} = require("../controllers/document");

/**
 * POST /api/documents/upload
 * Purpose: Upload PDF file(s)
 * Auth: Required (user must be logged in)
 * Middleware chain:
 *   1. auth → Verify JWT token, attach req.user
 *   2. upload.any() → Validate file(s), store in req.file.buffer
 *   3. uploadDocument → Extract text, upload to Cloudinary, save to DB
 * Body: form-data with file field
 */
router.post(
    "/upload",
    auth,              // Step 1: Check token
    upload.any(),      // Step 2: Validate and process file
    uploadDocument     // Step 3: Business logic (extract, upload, save)
);

/**
 * GET /api/documents/
 * Purpose: Get list of all documents uploaded by the authenticated user
 * Auth: Required
 * Query: Only returns documents where owner === req.user.id
 * Returns: { documents: [...] }
 */
router.get("/", auth, getDocuments);

/**
 * GET /api/documents/:id
 * Purpose: Get a specific document by ID
 * Auth: Required
 * Params: :id = MongoDB document ID
 * Security: Only returns document if owner === req.user.id
 * Returns: { document: {...} }
 */
router.get("/:id", auth, getDocumentById);

/**
 * DELETE /api/documents/:id
 * Purpose: Delete a document
 * Auth: Required
 * Params: :id = MongoDB document ID
 * Security: Can only delete if owner === req.user.id
 * Returns: { message: "Document deleted successfully" }
 */
router.delete("/:id", auth, deleteDocument);

// Export the router so index.js can mount it at /api/documents
module.exports = router;
