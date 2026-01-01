A MERN-based **RAG (Retrieval-Augmented Generation)** project that aims to let users upload documents and chat with them using **Hugging Face** models (no LangChain).

> Status: Early scaffolding + initial data models are in place. Core RAG pipeline (upload → parse → chunk → embed → retrieve → generate) is not wired yet.

---

## Tech Stack (current)

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **File Storage:** Cloudinary (via Multer)
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs

Planned (not implemented yet): Hugging Face embeddings + LLM inference, vector search (MongoDB Atlas Vector Search).

---

## Development Progress (So Far)

### Stage 1 — Repository & App Scaffolding (Done)

- Backend and frontend folders created:
  - `backend/` (Express server)
  - `frontend/` (React Vite app)
- Backend dev workflow prepared (`nodemon` is installed and `npm run dev` is available).

### Stage 2 — Backend Server Bootstrap (Done)

- Express server initialized in `backend/index.js`.
- Middleware configured:
  - JSON body parsing
  - CORS
  - static assets (`public/`)
- Health check endpoint is live:
  - `GET /api/health` → `{ status: "OK", message: "Server running" }`
- MongoDB connection via `mongoose.connect(process.env.MONGODB_URL)`.
- Centralized Error Handling: Custom middleware to handle Multer errors, validation errors, and 500s with consistent JSON responses.

### Stage 3 — Database Models & Authentication (Done)

Initial MongoDB/Mongoose schemas exist in `backend/models/`:

- `User` model: Handles user registration and login data.
- `Document` model: Stores metadata (name, type, Cloudinary path) and is scoped to an `owner` (User).
- `Chunk` model: Links to `documentId` for future RAG processing.
- `Chat` model: Stores conversation history.

### Stage 4 — Backend API Implementation (Done)

The backend follows a modular architecture:

- **Routes:** Defined in `backend/routes/` (e.g., `auth.js`, `document.js`).
- **Controllers:** Business logic in `backend/controllers/` (e.g., `auth.js`, `document.js`).
- **Middlewares:**
  - `auth.js`: Protects routes using JWT.
  - `multer.js`: Handles file uploads to Cloudinary with PDF-only validation and 10MB limit.
- **Config:**
  - `cloudinary.js`: Cloudinary account configuration.

### Stage 5 — File Upload System (Done)

- Integrated **Multer** with **Cloudinary Storage**.
- Supports single and multiple PDF uploads.
- Automatic validation for file type (PDF only) and size (10MB).
- Files are stored in Cloudinary under the `doctalk/documents` folder.

### Stage 6 — Frontend Bootstrap (Done)

- React app bootstrapped with Vite in `frontend/`.
- Current UI is the default Vite template.

---

## Way of Development

The project follows a **Modular and Scalable Architecture**:

1.  **Separation of Concerns**: Logic is divided into Routes (entry points), Controllers (logic), Models (data structure), and Middlewares (security/processing).
2.  **Security First**: All document-related APIs are protected by JWT authentication. Documents are scoped to the user who uploaded them.
3.  **Robust Error Handling**: A centralized error middleware ensures that the API always returns helpful JSON error messages (e.g., "File too large", "Only PDF allowed") instead of crashing or returning HTML.
4.  **Cloud-Native Storage**: Using Cloudinary for file storage ensures the app is scalable and doesn't rely on local server disk space.

---

## How to Run (Development)

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

- Server runs on `http://localhost:3000`
- Health endpoint: `http://localhost:3000/api/health`

**Environment variables**

- Backend expects a `.env` file in `backend/` with:
  - `MONGODB_URL`: Your MongoDB connection string.
  - `JWT_SECRET`: Secret key for signing tokens.
  - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
  - `CLOUDINARY_API_KEY`: Your Cloudinary API key.
  - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret.

> Important: Do not commit real secrets in `.env`. If credentials were committed previously, rotate them.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

- Vite dev server will print a local URL (usually `http://localhost:5173`).

---

## Technical Deep Dive: How it Works

This section explains the internal mechanics of the project for developers who want to understand the "under the hood" logic.

### 1. System Architecture & Data Flow

When a user interacts with the API (e.g., uploading a document), the request follows this path:

1.  **Entry Point (`index.js`)**: The request hits the Express server.
2.  **Routing (`routes/`)**: Express directs the request to the correct route file based on the URL.
3.  **Middleware Layer (`middlewares/`)**:
    - **Auth Check**: The `auth.js` middleware verifies the JWT token. If invalid, the request stops here.
    - **File Processing**: The `multer.js` middleware intercepts the file, validates it, and streams it to Cloudinary.
4.  **Controller Layer (`controllers/`)**: The business logic runs. It takes the data from the middleware (like the Cloudinary URL) and interacts with the database.
5.  **Database Layer (`models/`)**: Mongoose schemas ensure the data is structured correctly before being saved to MongoDB.
6.  **Response**: The controller sends a JSON response back to the user.

---

### 2. Detailed Logic Breakdown

#### A. Secure Authentication (`auth.js`)

- **Why?**: To ensure that each user has their own private space for documents and chats.
- **How?**:
  - We use **Bcrypt.js** to "salt and hash" passwords. We never store plain-text passwords.
  - We use **JWT (JSON Web Tokens)** for stateless sessions. Once a user logs in, they get a "passport" (the token) that they must show for every secure request.
  - The `auth` middleware extracts this token from the `Authorization: Bearer <token>` header, verifies it, and attaches the user's ID to the `req` object so the rest of the app knows who is making the request.

#### B. Intelligent File Upload (`multer.js` & `cloudinary.js`)

- **Why?**: To handle file uploads safely without filling up the server's hard drive.
- **How?**:
  - **Cloudinary Integration**: Instead of saving files on the server, we stream them directly to Cloudinary. This makes the app "serverless-ready" and scalable.
  - **Multi-Step Validation**:
    1.  **MIME Type**: Checks if the file claims to be a PDF (`application/pdf`).
    2.  **Extension**: Checks if the filename ends in `.pdf`.
    3.  **Size**: Rejects any file larger than 10MB to prevent abuse.
  - **Flexible Uploads**: We use `upload.any()` combined with a custom normalization logic in the controller. This allows the API to handle both single and multiple file uploads seamlessly, regardless of the field name used in the request.

#### C. User-Scoped Data Management (`document.js`)

- **Why?**: To prevent "Data Leakage" where User A could accidentally see User B's files.
- **How?**:
  - Every document saved in the database has an `owner` field pointing to a User ID.
  - **Strict Filtering**: Every database query (Find, Delete, Update) automatically includes the `owner: req.user.id` filter. This means even if a hacker knows a Document ID, they cannot access it unless they are logged in as the owner.

#### D. Centralized Error Handling (`index.js`)

- **Why?**: To provide a professional and consistent experience for the frontend developer.
- **How?**:
  - Instead of having `res.status(500).json(...)` scattered everywhere, we use a single "Error Middleware" at the bottom of `index.js`.
  - This middleware detects the _type_ of error (e.g., a Multer error vs. a Database error) and returns a clean, human-readable message like `"File too large"` or `"Only PDF files are allowed"`.

---

## API Reference (Current Endpoints)

### Authentication

| Method | Endpoint             | Description                                        |
| :----- | :------------------- | :------------------------------------------------- |
| `POST` | `/api/auth/register` | Create a new account.                              |
| `POST` | `/api/auth/login`    | Login and receive a JWT token.                     |
| `POST` | `/api/auth/logout`   | Informational logout (client should delete token). |

### Documents (Requires Auth Token)

| Method   | Endpoint                | Description                                |
| :------- | :---------------------- | :----------------------------------------- |
| `POST`   | `/api/documents/upload` | Upload one or more PDF files.              |
| `GET`    | `/api/documents/`       | Get a list of all your uploaded documents. |
| `GET`    | `/api/documents/:id`    | Get details of a specific document.        |
| `DELETE` | `/api/documents/:id`    | Delete a document from the database.       |

---

## Way of Building (Development Philosophy)

1. **Modular Design**: We separate code into `routes`, `controllers`, and `middlewares`. This makes the codebase easy to test and maintain. If we want to change the storage from Cloudinary to AWS S3, we only need to update the `multer` config, not the whole app.
2. **Fail-Fast Middleware**: Validation happens at the middleware level. If a file is too large or a user is not logged in, the request is rejected before it even hits the heavy business logic.
3. **Centralized Error Handling**: Instead of `try-catch` blocks everywhere returning different error formats, we use a single error-handling middleware in `index.js` to ensure the frontend always receives a consistent JSON response.
4. **Environment-Driven Config**: All sensitive data and configuration (DB URLs, API Keys) are managed via `.env` files, keeping the code portable and secure.

---

## Way of Building (Development Philosophy)

1. **Modular Design**: We separate code into `routes`, `controllers`, and `middlewares`. This makes the codebase easy to test and maintain. If we want to change the storage from Cloudinary to AWS S3, we only need to update the `multer` config, not the whole app.
2. **Fail-Fast Middleware**: Validation happens at the middleware level. If a file is too large or a user is not logged in, the request is rejected before it even hits the heavy business logic.
3. **Centralized Error Handling**: Instead of `try-catch` blocks everywhere returning different error formats, we use a single error-handling middleware in `index.js` to ensure the frontend always receives a consistent JSON response.
4. **Environment-Driven Config**: All sensitive data and configuration (DB URLs, API Keys) are managed via `.env` files, keeping the code portable and secure.

---

## Folder Structure

```text
Doc_Talk/
  backend/
    index.js            # Server entry point & error handling
    config/             # External service configs (Cloudinary, DB)
    controllers/        # Business logic (Auth, Document management)
    middlewares/        # Security (Auth) & Processing (Multer)
    models/             # Mongoose Schemas (User, Document, Chat, Chunk)
    routes/             # API Endpoints
  frontend/
    src/                # React components and logic
```
