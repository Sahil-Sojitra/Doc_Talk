const mongoose = require ("mongoose");

const DocumentSchema = new mongoose.Schema({
    originalName: {
        type: String,
    },
    fileType: {
        type: String,
    },
    storagePath: {
        type: String,
    },
    status : {
        type : String,
        enum : ["uploaded", "processed"],
        default : "uploaded"
    },
},{timestamps: true});

module.exports = mongoose.model("Document", DocumentSchema);