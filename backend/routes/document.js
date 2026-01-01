const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer");
const auth = require("../middlewares/auth");

const {
    uploadDocument,
    getDocuments,
    getDocumentById,
    deleteDocument
} = require("../controllers/document");


router.post(
    "/upload",
    auth,
    upload.any(), // accept up to 10 files at once
    uploadDocument
);


router.get("/", auth, getDocuments);


router.get("/:id", auth, getDocumentById);


router.delete("/:id", auth, deleteDocument);

module.exports = router;
