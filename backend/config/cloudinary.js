/**
 * Cloudinary Configuration File
 * This file configures the Cloudinary service for file storage.
 * Cloudinary is a cloud-based service that stores files (PDFs, images, etc.)
 * so we don't need to store them on our own server.
 */

const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
    // The cloud name identifies your Cloudinary account
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    
    // API key is used to authenticate requests
    api_key: process.env.CLOUDINARY_API_KEY,
    
    // API secret is used to sign requests (keep this secure!)
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Export the configured Cloudinary object for use in other files
module.exports = cloudinary;
