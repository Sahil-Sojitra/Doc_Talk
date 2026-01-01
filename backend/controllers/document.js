/**
 * Document Controller
 * This file handles all document-related business logic:
 * - PDF upload and validation
 * - Text extraction from PDFs
 * - Storage to Cloudinary
 * - Database operations (create, read, delete)
 * 
 * All functions require user authentication (via auth middleware)
 */

const Document = require("../models/Document");
const pdf = require("pdf-parse");
const axios = require("axios");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Helper Function: cleanText
 * Purpose: Remove junk characters from extracted PDF text
 * 
 * Why clean?
 * - PDFs often contain encoding artifacts, special characters, form feeds
 * - Cleaning improves text quality for AI processing
 * 
 * Operations:
 * 1. /[^\x20-\x7E\n]/g: Remove non-ASCII characters (keep space, A-Z, 0-9, newline)
 * 2. /\s+/g: Replace multiple spaces with single space
 * 3. trim(): Remove leading/trailing whitespace
 * 
 * Example:
 * Input: "Hello  world\x00\x01"  (with null bytes and extra spaces)
 * Output: "Hello world"
 */
const cleanText = (text) => {
    return text
        .replace(/[^\x20-\x7E\n]/g, "")  // Remove non-ASCII characters
        .replace(/\s+/g, " ")             // Collapse multiple spaces to one
        .trim();                          // Remove leading/trailing spaces
};

/**
 * Upload Document Function
 * Purpose: Upload PDF file(s), extract text, store on Cloudinary, save metadata to MongoDB
 * 
 * Request: POST /api/documents/upload (form-data with file field)
 * Auth: Required (via auth middleware)
 * 
 * Complete Pipeline:
 * 1. Validate file(s) received (multer middleware already validated type/size)
 * 2. Extract text page-by-page from PDF
 * 3. Upload file buffer to Cloudinary
 * 4. Save document metadata + extracted text to MongoDB
 * 5. Return document details to client
 * 
 * Returns: { message, count, documents: [...] }
 */
exports.uploadDocument = async (req, res, next) => {
    try {
        // --- Step 1: Normalize Files Array ---
        // Multer can attach files as:
        // - req.files = array (multiple files)
        // - req.file = object (single file)
        // We normalize to always have an array
        const files = req.files || (req.file ? [req.file] : []);
        
        if (files.length === 0) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Array to store processed documents
        const processedDocuments = [];

        // --- Step 2: Process Each File ---
        for (const file of files) {
            // --- Step 2a: Extract Text Page-by-Page ---
            // pdf-parse library provides pagerender callback for each page
            const pages = [];
            
            const options = {
                // pagerender: Called for each page in the PDF
                pagerender: async (pageData) => {
                    // Get all text items on this page
                    const textContent = await pageData.getTextContent();
                    
                    // Track Y position to detect line breaks
                    // (Items with same Y = same line)
                    let lastY, text = '';
                    
                    // Loop through each text item
                    for (let item of textContent.items) {
                        // If on same line (or first item), append to current line
                        if (lastY == item.transform[5] || !lastY) {
                            text += item.str;
                        } else {
                            // Different Y position = new line
                            text += '\n' + item.str;
                        }
                        // Remember Y position for next item
                        lastY = item.transform[5];
                    }
                    
                    // Store cleaned page content
                    pages.push({ 
                        page: pages.length + 1,           // 1-indexed page number
                        content: cleanText(text)          // Remove junk characters
                    });
                    return text;
                }
            };

            // Parse PDF and extract text via pagerender callback
            await pdf(file.buffer, options);

            // --- Step 2b: Upload File Buffer to Cloudinary ---
            // Cloudinary uploader.upload_stream expects a stream, not a buffer
            // We use upload_stream to avoid disk I/O (files stay in memory)
            const uploadPromise = () => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { 
                            folder: "doctalk/documents",    // Folder in Cloudinary
                            resource_type: "raw"           // Type: raw file (not image/video)
                        },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    // Send file buffer to stream
                    stream.end(file.buffer);
                });
            };

            const cloudinaryResult = await uploadPromise();

            // --- Step 2c: Save Document to MongoDB ---
            // Create document record with:
            // - owner: User ID (for user scoping)
            // - metadata: filename, type, storage URL
            // - status: "processed" (text extraction completed)
            // - extractedText: Array of pages with cleaned content
            const doc = await Document.create({
                owner: req.user.id,                      // User who owns this document
                originalName: file.originalname,         // Original filename
                fileType: "pdf",
                storagePath: cloudinaryResult.secure_url,  // HTTPS URL from Cloudinary
                status: "processed",                     // Text successfully extracted
                extractedText: { pages }                 // Page-by-page text content
            });

            processedDocuments.push(doc);
        }

        // --- Step 3: Return Success Response ---
        res.status(201).json({
            message: "Document(s) uploaded and processed successfully",
            count: processedDocuments.length,
            documents: processedDocuments
        });
        console.log("Processed Documents:", processedDocuments);
    } catch (err) {
        // Pass error to global error handler middleware
        next(err);
    }
};


/**
 * Get Documents Function
 * Purpose: Retrieve all documents owned by the authenticated user
 * 
 * Request: GET /api/documents/
 * Auth: Required (user ID from req.user)
 * 
 * Security: USER SCOPING
 * Only returns documents where owner === req.user.id
 * This ensures User A cannot see User B's documents
 * 
 * Returns: { documents: [...] }
 */
exports.getDocuments = async (req, res) => {
    try {
        // --- Query with User Scoping ---
        // Key security feature: filter by owner
        // This is why we added owner field to Document schema
        const documents = await Document.find({ owner: req.user.id })
            .sort({ createdAt: -1 });  // Most recent first
        
        res.status(200).json({ documents });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};


/**
 * Get Document By ID Function
 * Purpose: Retrieve a single document by ID
 * 
 * Request: GET /api/documents/:id
 * Auth: Required
 * Params: :id = MongoDB document _id
 * 
 * Security: USER SCOPING + ID CHECK
 * Query checks BOTH:
 * 1. _id matches the requested ID
 * 2. owner matches the current user
 * 
 * This prevents User A from accessing User B's documents
 * Even if User A knows the document ID
 * 
 * Returns: { document: {...} }
 * Or: 404 if document not found or not owned by user
 */
exports.getDocumentById = async (req, res) => {
    try {
        // --- Query with Security Checks ---
        // _id: Matches requested document
        // owner: Matches authenticated user
        // If either fails, findOne returns null
        const document = await Document.findOne({ 
            _id: req.params.id, 
            owner: req.user.id 
        });
        
        if (!document) {
            // 404 = Not Found
            // Don't reveal whether document exists but user can't access it
            return res.status(404).json({ message: "Document not found" });
        }
        
        res.status(200).json({ document });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};


/**
 * Delete Document Function
 * Purpose: Permanently delete a document
 * 
 * Request: DELETE /api/documents/:id
 * Auth: Required
 * Params: :id = MongoDB document _id
 * 
 * Security: USER SCOPING
 * Only the owner can delete a document
 * Query requires BOTH _id AND owner to match
 * 
 * What happens:
 * 1. Find document by ID and owner
 * 2. If found AND owned by user, delete it
 * 3. Document removed from MongoDB
 * 4. File remains in Cloudinary (can add cleanup later)
 * 
 * Returns: { message: "Document deleted successfully" }
 * Or: 404 if document not found or not owned by user
 */
exports.deleteDocument = async (req, res) => {
    try {
        // --- Find and Delete in One Operation ---
        // findOneAndDelete queries first, then deletes
        // Returns the deleted document object (or null if not found)
        const document = await Document.findOneAndDelete({ 
            _id: req.params.id, 
            owner: req.user.id 
        });
        
        if (!document) {
            // 404 = Not Found
            // User either doesn't have document or it doesn't exist
            return res.status(404).json({ message: "Document not found" });
        }
        
        // 200 = OK (request succeeded)
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};