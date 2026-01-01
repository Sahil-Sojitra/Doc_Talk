const express = require("express");
const router = express.Router();

const upload = require("../middlewares/multer");
const {
    uploadDocument,
    getDocuments,
    getDocumentById,
    deleteDocument
} = require("../controllers/document");

// Helper to make sure req.file is populated even if the client uses a different field name
const ensureSingleFile = (req, res, next) => {
    if (req.file) return next();
    if (Array.isArray(req.files) && req.files.length > 0) {
        req.file = req.files[0];
    }
    next();
};

router.post(
    "/upload",
    upload.any(),
    ensureSingleFile,
    uploadDocument
);


router.get("/", getDocuments);


router.get("/:id", getDocumentById);


router.delete("/:id", deleteDocument);

module.exports = router;
