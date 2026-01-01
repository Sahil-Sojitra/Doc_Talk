const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "doctalk/documents",
        resource_type: "raw", // IMPORTANT for PDFs
        format: "pdf"
    }
});

const fileFilter = (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const name = (file.originalname || "").toLowerCase();

    const isPdfMime = mime === "application/pdf" || mime === "application/x-pdf";
    const isPdfByName = name.endsWith(".pdf");
    // edge case for browser support to the different type of pdf
    const isGenericButPdf = mime === "application/octet-stream" && isPdfByName;

    if (isPdfMime || isGenericButPdf) {
        cb(null, true);
        return;
    }

    const err = new Error("Only PDF files are allowed");
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
