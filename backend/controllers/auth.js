/**
 * Authentication Controller
 * This file contains the logic for user registration and login.
 * It handles:
 * - Creating new user accounts
 * - Validating credentials
 * - Generating JWT tokens
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Helper Function: signToken
 * Purpose: Generate a JWT token for a user
 * 
 * How it works:
 * 1. Takes a user object
 * 2. Encodes user ID and email into the token
 * 3. Signs it with JWT_SECRET (so only the server can create/verify it)
 * 4. Sets expiration to 7 days
 * 
 * Returns: A string token that the client stores and sends in Authorization header
 */
const signToken = (user) => jwt.sign(
    { id: user._id, email: user.email },              // Data to encode
    process.env.JWT_SECRET || "changeme",            // Secret key
    { expiresIn: "7d" }                               // Token expires in 7 days
);

/**
 * Register Function
 * Purpose: Create a new user account
 * 
 * Request: POST /api/auth/register
 * Body: { name: "John", email: "john@example.com", password: "pass123" }
 * 
 * Steps:
 * 1. Validate input (all fields provided?)
 * 2. Check if email already exists (prevent duplicates)
 * 3. Hash password with bcryptjs
 * 4. Save user to MongoDB
 * 5. Generate JWT token
 * 6. Return token to client
 */
exports.register = async (req, res) => {
    try {
        // --- Step 1: Extract and Validate Input ---
        const { name, email, password } = req.body;
        
        // Check if all required fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // --- Step 2: Check for Existing User ---
        // 409 = Conflict (resource already exists)
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "User already exists" });
        }

        // --- Step 3: Hash Password ---
        // bcryptjs.hash(password, saltRounds)
        // saltRounds = 10 means the password is hashed 2^10 = 1024 times
        // More rounds = more secure but slower
        const hashed = await bcrypt.hash(password, 10);

        // --- Step 4: Create User in Database ---
        // Password is NEVER stored in plain text
        const user = await User.create({ name, email, password: hashed });

        // --- Step 5: Generate JWT Token ---
        // Token will be used by client for future authenticated requests
        const token = signToken(user);

        // --- Step 6: Return Success Response ---
        // 201 = Created (new resource was created)
        res.status(201).json({
            message: "User registered",
            token,  // Client stores this
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};

/**
 * Login Function
 * Purpose: Authenticate a user and return a JWT token
 * 
 * Request: POST /api/auth/login
 * Body: { email: "john@example.com", password: "pass123" }
 * 
 * Steps:
 * 1. Validate input
 * 2. Find user by email
 * 3. Compare provided password with stored hash
 * 4. If match, generate token
 * 5. Return token to client
 */
exports.login = async (req, res) => {
    try {
        // --- Step 1: Extract and Validate Input ---
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // --- Step 2: Find User by Email ---
        // 401 = Unauthorized (credentials are invalid)
        const user = await User.findOne({ email });
        if (!user) {
            // Don't say "user not found" (security best practice)
            // Instead, say "Invalid credentials" to avoid revealing which emails exist
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // --- Step 3: Verify Password ---
        // bcryptjs.compare(plainPassword, hashedPassword)
        // Cannot reverse the hash to check if password is correct
        // Instead, we hash the provided password and compare hashes
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            // Wrong password
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // --- Step 4: Generate JWT Token ---
        // Password is correct, so generate token for this user
        const token = signToken(user);

        // --- Step 5: Return Success Response ---
        // 200 = OK (request succeeded)
        res.status(200).json({
            message: "Login successful",
            token,  // Client stores this and uses it for authenticated requests
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};


/**
 * Logout Function
 * Purpose: Inform client that logout is successful
 * 
 * Why is logout simple?
 * - JWTs are STATELESS: The server doesn't store token lists
 * - To logout, client just deletes the token from localStorage
 * - Without the token, client can't make authenticated requests
 * - Server will reject requests without valid token via auth middleware
 */
exports.logout = async (req, res) => {
    // Client responsibility: Delete token from localStorage/sessionStorage
    res.status(200).json({ message: "Logout successful. Please delete the token on client side." });
}
