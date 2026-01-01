const Document = require("../models/Document");

exports.uploadDocument = async (req, res, next) => {
    try {
        // Normalize files: supports single & multiple upload
        const files = req.files || (req.file ? [req.file] : []);
        if (files.length === 0) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Prepare documents for DB
        const documentsData = files.map(file => ({
            owner: req.user.id,
            originalName: file.originalname,
            fileType: "pdf",
            storagePath: file.path, // Cloudinary URL
            status: "uploaded"
        }));

        // Save all documents at once
        const savedDocuments = await Document.insertMany(documentsData);

        res.status(201).json({
            message: "Document(s) uploaded successfully",
            count: savedDocuments.length,
            documents: savedDocuments
        });
    } catch (err) {
        next(err);
    }
};


exports.getDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ documents });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};


exports.getDocumentById = async (req, res) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, owner: req.user.id });
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }
        res.status(200).json({ document });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};


exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};