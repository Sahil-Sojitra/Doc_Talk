/**
 * Authentication Middleware
 * This middleware checks if the user has a valid JWT token.
 * It runs BEFORE the controller, so it's like a "guard" that protects routes.
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token signature using JWT_SECRET
 * 3. Attach user info to req.user for controllers to use
 * 4. If token is invalid or missing, reject the request
 */

const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
    // --- Step 1: Extract Authorization Header ---
    // Header format: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
    const header = req.headers.authorization || "";
    
    // --- Step 2: Extract Token ---
    // Check if header starts with "Bearer ", then extract everything after it
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    // --- Step 3: If no token, reject ---
    // 401 = Unauthorized (missing or invalid credentials)
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    // --- Step 4: Verify Token ---
    // jwt.verify() checks if:
    // a) Token signature is valid (wasn't tampered with)
    // b) Token hasn't expired
    // c) Token was signed with the correct secret
    try {
        // If verification succeeds, payload contains the original data
        const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme");
        
        // --- Step 5: Attach User Info to Request ---
        // Now controllers can access the user via req.user
        // Example: req.user.id, req.user.email
        req.user = { id: payload.id, email: payload.email };
        
        // --- Step 6: Pass Control to Next Middleware/Controller ---
        // next() means "the token is valid, continue to the next function"
        next();
    } catch (err) {
        // If token is invalid or expired, jwt.verify() throws an error
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
