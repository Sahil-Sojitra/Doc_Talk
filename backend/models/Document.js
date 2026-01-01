/**
 * Document Model
 * This defines the structure of a Document in MongoDB.
 * A Document represents an uploaded PDF file with extracted text and metadata.
 */

const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
    /**
     * owner: Reference to the User who uploaded this document
     * - type: ObjectId (MongoDB ID of a User)
     * - ref: "User" (points to User model)
     * - required: true (every document must have an owner)
     * 
     * Why separate owner field?
     * This implements USER SCOPING: each user sees only their own documents
     * Query example: Document.find({ owner: userId })
     */
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    /**
     * originalName: The filename the user uploaded
     * Example: "contract.pdf", "lecture_notes.pdf"
     */
    originalName: {
        type: String,
        required: true
    },

    /**
     * fileType: Type of file (always "pdf" currently)
     * Future: Could support "docx", "txt", etc.
     */
    fileType: {
        type: String,
        required: true
    },

    /**
     * storagePath: URL where file is stored on Cloudinary
     * Example: "https://res.cloudinary.com/ddaq3oivq/raw/upload/v1767269012/doctalk/documents/abc123.pdf"
     * This is a public URL that anyone can download from
     */
    storagePath: {
        type: String,
        required: true
    },

    /**
     * status: Processing status of the document
     * - "uploaded": File uploaded but text not extracted yet
     * - "processed": Text has been extracted and stored
     * 
     * enum: Only allows these two values (prevents typos like "procesed")
     * default: "uploaded" (new documents start in this state)
     */
    status: {
        type: String,
        enum: ["uploaded", "processed"],
        default: "uploaded"
    },

    /**
     * extractedText: Cleaned text extracted from the PDF
     * Structure: { pages: [ { page: 1, content: "..." }, ... ] }
     * 
     * Why page-by-page?
     * For RAG (Retrieval-Augmented Generation):
     * - When user asks a question, system finds relevant pages
     * - Can tell user "Answer found on page 5"
     * - Improves citation accuracy
     * 
     * Example:
     * {
     *   pages: [
     *     { page: 1, content: "Introduction to Machine Learning..." },
     *     { page: 2, content: "Chapter 1: Basic Concepts..." },
     *     { page: 3, content: "Chapter 2: Neural Networks..." }
     *   ]
     * }
     */
    extractedText: {
        pages: [
            {
                page: Number,      // Page number (1-indexed)
                content: String    // Cleaned text from that page
            }
        ]
    }
},
{
    /**
     * timestamps: true
     * Automatically adds:
     * - createdAt: When document was uploaded
     * - updatedAt: When document was last modified
     */
    timestamps: true
});

/**
 * Export the Document model
 * Creates a "documents" collection in MongoDB
 * Usage examples:
 * - Document.create({ owner, originalName, ... })
 * - Document.find({ owner: userId })
 * - Document.findById(documentId)
 * - Document.findOneAndDelete({ _id: docId, owner: userId })
 */
module.exports = mongoose.model("Document", DocumentSchema);