const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document"
    },
    index: Number,
    text: String,
    embedding: [Number]
}, { timestamps: true });

module.exports = mongoose.model("Chunk", ChunkSchema);
