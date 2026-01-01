# Backend Code Flow Documentation

This document explains the overall flow and logic of the Doc_Talk backend system. It covers how requests move through the application, how authentication works, how files are processed, and where each piece of code fits.

---

## 1. Project Architecture Overview

```
USER REQUEST
    ↓
index.js (Express Server Entry Point)
    ↓
middleware/auth.js (Verify User Identity)
    ↓
middleware/multer.js (Process File Upload)
    ↓
controllers/ (Business Logic)
    ↓
models/ (Database Operations)
    ↓
config/ (External Services like Cloudinary)
    ↓
RESPONSE SENT TO USER
```

---

## 2. File Structure & Responsibilities

### `index.js` - The Main Server File

**What it does:**

- Initializes the Express server
- Sets up global middleware (CORS, body parser, etc.)
- Connects to MongoDB
- Mounts all API routes
- Catches and handles errors globally

**Key Sections:**

1. **Global Middleware**: Prepares all requests (parsing JSON, enabling CORS)
2. **Database Connection**: Connects to MongoDB using Mongoose
3. **Route Mounting**: Tells Express which URLs go to which controller files
4. **Error Handling**: Catches errors from any route and returns clean JSON

---

### `config/cloudinary.js` - External Service Configuration

**What it does:**

- Configures the Cloudinary account
- Loads API credentials from environment variables
- Exports the configured Cloudinary object for use throughout the app

**Why separate from index.js:**

- Keeps configuration isolated and reusable
- Makes it easy to swap Cloudinary for AWS S3 or other storage services

---

### `middlewares/` - Request Filters & Processors

#### `auth.js` - Authentication Middleware

**What it does:**

- Checks if the user has a valid JWT token
- Extracts the token from the `Authorization: Bearer <token>` header
- Verifies the token signature using `JWT_SECRET`
- Attaches user information to `req.user` so controllers can access it

**How it protects routes:**

```javascript
router.post("/upload", auth, uploadDocument);
//                     ^^^^
//                     When a request comes in, auth() runs FIRST
//                     If auth fails, uploadDocument never runs
```

**Example Flow:**

1. Client sends: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
2. `auth.js` extracts the token after `Bearer `
3. `auth.js` calls `jwt.verify(token, JWT_SECRET)`
4. If valid: Sets `req.user = { id: "123", email: "user@example.com" }`
5. If invalid: Returns `401 Unauthorized` to the client

#### `multer.js` - File Upload Middleware

**What it does:**

- Intercepts file uploads
- Validates that files are PDFs using multiple checks
- Stores files in memory (RAM) temporarily
- Limits file size to 10MB

**File Validation Process:**

1. **Check MIME Type**: Is it `application/pdf`?
2. **Check Extension**: Does filename end in `.pdf`?
3. **Check Edge Cases**: Is it a generic binary but ends in `.pdf`?
4. **Accept or Reject**: If all checks fail, send error

**Why Memory Storage:**

- We extract text immediately after upload (don't need disk)
- Faster processing (no disk I/O)
- File stays in `req.file.buffer` for the controller to use

---

### `routes/` - API Endpoints Definition

#### `auth.js` - Authentication Endpoints

```
POST /api/auth/register  → Create new account
POST /api/auth/login     → Get JWT token
POST /api/auth/logout    → (Client deletes token)
```

#### `document.js` - Document Endpoints

```
POST /api/documents/upload  → Upload PDF (requires auth)
GET  /api/documents/        → List your documents (requires auth)
GET  /api/documents/:id     → Get one document (requires auth)
DELETE /api/documents/:id   → Delete document (requires auth)
```

**Route Structure Example:**

```javascript
router.post(
  "/upload",
  auth, // Step 1: Verify user
  upload.any(), // Step 2: Process file
  uploadDocument // Step 3: Business logic
);
```

---

### `controllers/` - Business Logic

#### `auth.js` - Authentication Logic

**Register Flow:**

1. Validate input (name, email, password provided?)
2. Check if email already exists in DB
3. Hash password with bcryptjs (10 salt rounds)
4. Create User document in MongoDB
5. Generate JWT token (valid for 7 days)
6. Return token to client

**Login Flow:**

1. Find user by email in MongoDB
2. Use `bcryptjs.compare()` to check password
3. If password matches, generate JWT token
4. Return token to client

**Why bcryptjs?**

- Never store plain-text passwords
- Hashing is one-way (can't reverse it)
- If database is breached, passwords are safe

#### `document.js` - Document Management Logic

**Upload Flow:**

1. Check if files are provided (from multer)
2. Loop through each file
3. **Extract text from PDF:**
   - Use `pdf-parse` library
   - Extract text page-by-page
   - Clean junk characters (special symbols, extra spaces)
4. **Upload to Cloudinary:**
   - Stream file buffer to Cloudinary
   - Get back secure HTTPS URL
5. **Save to MongoDB:**
   - Create Document record with:
     - owner: req.user.id (the logged-in user)
     - storagePath: Cloudinary URL
     - extractedText: pages array with cleaned text
     - status: "processed"
6. Return saved documents to client

**Scoped Queries (User Data Privacy):**

```javascript
// Every query filters by owner!
Document.find({ owner: req.user.id });
//              ^^^^^^^^^^^^^^^^^^^
//              Only return THIS user's documents
```

---

### `models/` - Database Schemas

#### `User.js`

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Why unique email?** Prevents duplicate accounts

#### `Document.js`

```javascript
{
  _id: ObjectId,
  owner: ObjectId (references User),
  originalName: String,
  fileType: String ("pdf"),
  storagePath: String (Cloudinary URL),
  status: String ("uploaded" or "processed"),
  extractedText: {
    pages: [
      { page: 1, content: "Page 1 text..." },
      { page: 2, content: "Page 2 text..." }
    ]
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Why owner field?** Ensures each user sees only their documents

#### `Chat.js` (Future)

Will store conversation history between user and AI

#### `Chunk.js` (Future)

Will store split text chunks for RAG (Retrieval-Augmented Generation)

---

## 3. Complete Request Flow Examples

### Example 1: User Registration

```
1. Client sends POST /api/auth/register
   Body: { name: "John", email: "john@example.com", password: "pass123" }

2. index.js routes to routes/auth.js

3. routes/auth.js forwards to controllers/auth.js -> register()

4. register() in controllers/auth.js:
   a. Validates input
   b. Checks if email exists in User model
   c. Hashes password with bcryptjs
   d. Creates User in MongoDB
   e. Generates JWT token

5. Returns to client: { token: "eyJ...", user: { id, name, email } }

6. Client stores token and uses it for future requests
```

### Example 2: File Upload

```
1. Client sends POST /api/documents/upload
   Authorization: Bearer eyJ...
   Body: form-data with file field

2. index.js → routes/document.js

3. routes/document.js applies middlewares in order:
   a. auth middleware → Verifies token → Sets req.user
   b. upload.any() → Multer validates PDF → Stores in req.file.buffer
   c. uploadDocument controller → Business logic

4. uploadDocument in controllers/document.js:
   a. Reads file from req.file.buffer (it's already in RAM!)
   b. Uses pdf-parse to extract text page-by-page
   c. Cleans text (removes special characters)
   d. Uploads buffer to Cloudinary using cloudinary.uploader.upload_stream()
   e. Gets back { secure_url: "https://res.cloudinary.com/..." }
   f. Creates Document in MongoDB with:
      - owner: req.user.id (the authenticated user)
      - extractedText: pages array
      - storagePath: Cloudinary URL
      - status: "processed"
   g. Returns saved document to client

5. Client receives: { documents: [...], count: 1, message: "Success" }
```

### Example 3: Unauthorized Access Attempt

```
1. Client sends POST /api/documents/upload WITHOUT Authorization header

2. routes/document.js applies auth middleware FIRST

3. auth middleware finds no token in header → Returns 401 Unauthorized

4. uploadDocument NEVER RUNS

5. Client receives: { message: "Authentication required" }
```

---

## 4. Security Features Explained

### Authentication (JWT)

- **Stateless**: Server doesn't store session info
- **Token-based**: Client carries proof of identity in every request
- **Expiration**: Tokens expire after 7 days for security

### Password Security (Bcryptjs)

- Passwords are hashed before storage
- Each hash is unique (even for same password) because of "salt"
- Can't reverse the hash to get the password

### User Scoping

- Every database query filters by `owner: req.user.id`
- User A cannot access User B's documents even if they know the ID
- Example: User A tries to delete User B's document:
  ```javascript
  Document.findOneAndDelete({
    _id: documentId, // The document ID
    owner: req.user.id, // MUST match the authenticated user
  });
  // If owner doesn't match, returns null (not found)
  ```

### File Upload Validation

1. **Type Check**: Only PDFs allowed
2. **Size Check**: Max 10MB to prevent abuse
3. **Cloud Storage**: Files aren't stored on our server (scalable)

---

## 5. Error Handling Flow

```
Request → Any middleware or controller throws error
           ↓
           Error bubbles up to index.js
           ↓
           Centralized error handler in index.js catches it
           ↓
           Checks error type:
           - MulterError? → Return 413 or 400
           - Invalid file type? → Return 400
           - Other error? → Return 500
           ↓
           Client receives consistent JSON error response
```

**Why centralized error handling?**

- Prevents HTML error pages from being sent
- Ensures all errors return JSON
- Easy to modify error messages in one place
- Professional error messages like "File too large" vs generic 500

---

## 6. Environment Variables (.env)

```env
MONGODB_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Why separate file?**

- Credentials are never in code
- Different values for dev/prod
- Can be rotated without code changes

---

## 7. Key Concepts

| Concept           | Why it exists                                  | Example                    |
| ----------------- | ---------------------------------------------- | -------------------------- |
| **Middleware**    | Process requests before they reach controllers | auth.js, multer.js         |
| **Routes**        | Define API endpoints                           | POST /api/documents/upload |
| **Controllers**   | Contain business logic                         | uploadDocument, register   |
| **Models**        | Define database structure                      | User, Document             |
| **Config**        | External service setup                         | cloudinary.js              |
| **Error Handler** | Catch and format errors                        | Centralized in index.js    |

---

## 8. Next Steps (Future Development)

When you add RAG (Chat with Documents), the flow will be:

```
User asks question
    ↓
Convert question to vector (embedding)
    ↓
Search extracted text for relevant pages
    ↓
Send relevant text + question to AI
    ↓
AI generates answer
    ↓
Stream response word-by-word to user
```

This is why we extract and store text page-by-page!

---

## Summary

The backend works by:

1. **Receiving** requests at `/api/*` endpoints
2. **Validating** user identity (auth middleware)
3. **Processing** files (multer middleware)
4. **Executing** business logic (controllers)
5. **Storing** data (MongoDB models)
6. **Handling** errors consistently (global error handler)
7. **Returning** JSON responses

Each layer is independent and can be modified without affecting others!
