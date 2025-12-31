const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document"
    },
    question: String,
    answer: String
}, { timestamps: true });

module.exports = mongoose.model("Chat", ChatSchema);
