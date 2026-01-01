/**
 * Chat Model (Future Use)
 * This will store conversation history between users and the AI.
 * Currently a placeholder - will be fully implemented during RAG integration.
 */

const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    /**
     * documentId: Which document this conversation is about
     * References the Document model
     */
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document"
    },

    /**
     * question: What the user asked
     * Example: "What is the main topic of this document?"
     */
    question: String,

    /**
     * answer: AI's response
     * Example: "This document discusses machine learning fundamentals..."
     */
    answer: String
},
{
    // Auto-add createdAt and updatedAt fields
    timestamps: true
});

/**
 * Export the Chat model
 * Future usage:
 * - Chat.create({ documentId, question, answer })
 * - Chat.find({ documentId: id }) // Get all chats for a document
 */
module.exports = mongoose.model("Chat", ChatSchema);
