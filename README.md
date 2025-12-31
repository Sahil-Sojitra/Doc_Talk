
A MERN-based **RAG (Retrieval-Augmented Generation)** project that aims to let users upload documents and chat with them using **Hugging Face** models (no LangChain).

> Status: Early scaffolding + initial data models are in place. Core RAG pipeline (upload → parse → chunk → embed → retrieve → generate) is not wired yet.

---

## Tech Stack (current)

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose

Planned (not implemented yet): Hugging Face embeddings + LLM inference, vector search (MongoDB Atlas Vector Search / Qdrant / Pinecone).

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

### Stage 3 — Database Models for RAG (Partially Done)

Initial MongoDB/Mongoose schemas exist in `backend/models/`:

- `Document` model
  - stores metadata like name/type/path
  - has a basic `status` (`uploaded` / `processed`)
- `Chunk` model
  - links to `documentId`
  - stores `text`, `index`, and an `embedding` array (placeholder for vector embeddings)
- `Chat` model
  - links to `documentId`
  - stores `question` and `answer`

What’s missing to complete this stage:

- Document ingestion flow that actually creates `Document` + `Chunk` records
- Indexing/embedding generation and storage to a vector DB/search index
- Proper chat history (conversation/user scoping) and citations

### Stage 4 — Backend API Structure (Not Started)

Folders exist but are currently empty:

- `backend/routes/`
- `backend/controllers/`
- `backend/middlewares/`
- `backend/services/`

### Stage 5 — Frontend Bootstrap (Done)

- React app bootstrapped with Vite in `frontend/`.
- Current UI is the default Vite template (counter + logos).

### Stage 6 — Frontend Product Screens (Not Started)

Planned screens (not implemented yet):

- Upload documents
- Document list + processing status
- Chat UI with sources/citations

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

- Backend expects a `.env` file in `backend/` with at least:
  - `MONGODB_URL`
  - `JWT_SECRET` (present, but auth endpoints are not implemented yet)

> Important: Do not commit real secrets in `.env`. If credentials were committed previously, rotate them.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

- Vite dev server will print a local URL (usually `http://localhost:5173`).

---

## Next Milestones (Recommended Order)

### Milestone A — Document Upload + Storage

- Add upload endpoint (Multer)
- Save document metadata (`Document`)
- Store file locally (dev) or cloud storage (prod)

### Milestone B — Parse + Chunk

- Extract text (PDF/DOCX)
- Chunk with overlap
- Store chunks (`Chunk`)

### Milestone C — Embeddings (Hugging Face)

- Pick embedding model (e.g., E5 / MiniLM)
- Generate embeddings for chunks
- Store vectors (Atlas Vector Search or Qdrant)

### Milestone D — Retrieval + Chat (RAG)

- Embed query
- Retrieve top-k chunks
- Build prompt with context
- Call Hugging Face LLM endpoint
- Return answer + citations

---

## Folder Structure

```text
Doc_Talk/
  backend/
    index.js
    models/
      Chat.js
      Chunk.js
      Document.js
    controllers/        (empty)
    routes/             (empty)
    middlewares/        (empty)
    services/           (empty)
  frontend/
    src/
      App.jsx
      main.jsx
```
