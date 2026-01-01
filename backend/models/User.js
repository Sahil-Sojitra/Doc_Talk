/**
 * User Model
 * This defines the structure of a User document in MongoDB.
 * Schema = Rules for what fields exist and what type they are.
 */

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        /**
         * name: User's full name
         * - type: String (text)
         * - required: true (must provide when creating user)
         * - trim: true (removes leading/trailing spaces)
         */
        name: { type: String, required: true, trim: true },

        /**
         * email: User's email address (login credential)
         * - type: String
         * - required: true (must provide)
         * - unique: true (no two users can have same email)
         *   This prevents duplicate accounts
         * - lowercase: true (converts email to lowercase for consistency)
         *   Example: "JOHN@EXAMPLE.COM" → "john@example.com"
         * - trim: true (removes spaces)
         */
        email: {
            type: String,
            required: true,
            unique: true,   // MongoDB creates an index on this field
            lowercase: true,
            trim: true,
        },

        /**
         * password: User's password (HASHED, never plain text!)
         * - type: String (stores bcryptjs hash)
         * - required: true
         * - Note: Always hash passwords before saving
         */
        password: { type: String, required: true },
    },
    {
        /**
         * timestamps: true
         * Automatically adds:
         * - createdAt: When the user was created
         * - updatedAt: When the user was last modified
         * Useful for analytics and debugging
         */
        timestamps: true
    }
);

/**
 * Export the model
 * This creates a collection called "users" in MongoDB
 * Usage: User.create(), User.find(), User.findOne(), etc.
 */
module.exports = mongoose.model("User", UserSchema);
