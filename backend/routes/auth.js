/**
 * Authentication Routes
 * This file maps URLs to authentication controller functions.
 * Think of this as a "routing table" that tells Express what to do for each HTTP request.
 */

const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../controllers/auth");

/**
 * POST /api/auth/register
 * Purpose: Create a new user account
 * No auth required (anyone can register)
 * Body: { name, email, password }
 */
router.post("/register", register);

/**
 * POST /api/auth/login
 * Purpose: Login and receive JWT token
 * No auth required (login endpoint is public)
 * Body: { email, password }
 * Returns: { token, user }
 */
router.post("/login", login);

/**
 * POST /api/auth/logout
 * Purpose: Notify server of logout (client deletes token)
 * No auth required (logout endpoint is public)
 */
router.post("/logout", logout);

// Export the router so index.js can mount it at /api/auth
module.exports = router;
