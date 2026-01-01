const mongoose = require ("mongoose");

const DocumentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    storagePath: {
        type: String,
        required: true
    },
    status : {
        type : String,
        enum : ["uploaded", "processed"],
        default : "uploaded"
    },
},{timestamps: true});

module.exports = mongoose.model("Document", DocumentSchema);