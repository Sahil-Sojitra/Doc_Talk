const Document = require("../models/Document");

exports.uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Save document info to DB
        const doc = await Document.create({
            originalName: req.file.originalname,
            fileType: "pdf",
            storagePath: req.file.path, // Cloudinary URL
            status: "uploaded"
        });
        // Respond with success
        res.status(201).json({
            message: "Document uploaded successfully",
            document: doc
        });
    } catch (err) {
        next(err);
    }
};


exports.getDocuments = async (req, res) => { };
exports.getDocumentById = async (req, res) => { };
exports.deleteDocument = async (req, res) => { };