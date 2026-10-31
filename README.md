# Project Brain 🧠

> An AI-powered RAG (Retrieval-Augmented Generation) assistant that explains *why* code was written by searching through commit history, issue discussions, and project knowledge using pgvector and Google Gemini.

---

## 🏗 Repository Structure

```
project-brain/
├── docker-compose.yml          # Unified multi-container orchestration
├── .env.example                # Template for environment variables
├── ChatBocAiBackend/           # Python FastAPI AI RAG Microservice
│   ├── main.py                 # FastAPI application & endpoints (/assistant/ask)
│   ├── answer.py               # RAG pipeline & Gemini 3.8 Flash LLM integration
│   ├── retrieve.py             # Vector similarity search with sentence-transformers
│   ├── db_setup.py             # PostgreSQL + pgvector schema & HNSW index setup
│   ├── ingest.py               # Document & chunk embeddings ingestion
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Backend container configuration
│   └── .dockerignore
└── frontend/                   # React + Vite Modern UI
    ├── src/                    # UI Components, pages & API services
    │   ├── pages/Assistant.jsx # Chat UI for asking project questions
    │   └── services/           # assistantService.js and api.js
    ├── package.json            # Frontend dependencies
    ├── vite.config.js          # Vite configuration (0.0.0.0 host binding)
    ├── Dockerfile              # Frontend container configuration
    └── .dockerignore
```

---

## 🚀 1-Command Quickstart (Docker Compose)

Spin up the entire stack (PostgreSQL with `pgvector`, FastAPI backend, and React frontend) with a single command:

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```
Ensure your `GEMINI_API_KEY` is set in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Start the Stack
```bash
docker compose up --build
```

That's it! All three services will initialize automatically.

---

## 🌐 Service Access & URLs

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) or [http://localhost:3000](http://localhost:3000) | Interactive project knowledge & chat interface |
| **FastAPI Backend** | [http://localhost:8000](http://localhost:8000) | Microservice handling RAG queries |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for testing endpoints |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Returns `{"status": "ok"}` |
| **PostgreSQL + pgvector** | `localhost:5432` | User: `postgres`, Password: `postgres` |

---

## ⚡ Seed Initial Knowledge (Optional)

To populate the vector database with demo project chunks (commits, issues, PRs):

**Inside Docker:**
```bash
docker compose exec backend python ingest.py
```

**Or Locally:**
```bash
cd ChatBocAiBackend
python ingest.py
```

---

## 🛠 Local Development (Without Docker)

If you prefer to run services individually on your host machine:

### 1. Database (PostgreSQL with pgvector)
Ensure PostgreSQL is running locally on port `5432` with the `vector` extension installed, or run only the DB in Docker:
```bash
docker run -d --name project-brain-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres pgvector/pgvector:pg16
```

### 2. Backend Service
```bash
cd ChatBocAiBackend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python db_setup.py   # Initialize tables and vector indexes
python ingest.py     # Seed sample chunks
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Service
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 API Integration Overview

- **Endpoint**: `POST /assistant/ask` (also aliased to `POST /ask`)
- **Request Body**:
  ```json
  {
    "question": "Why did users get 401 errors during JWT refresh?"
  }
  ```
- **Response Format**:
  ```json
  {
    "found": true,
    "answer": "Users experienced intermittent 401 errors during JWT refresh due to a race condition [issue_101]...",
    "sources": [
      {
        "id": "issue_101",
        "type": "issue",
        "url": "https://github.com/org/repo/issues/101",
        "snippet": "Bug: Users experiencing intermittent 401...",
        "score": 0.82
      }
    ],
    "confidence": "high"
  }
  ```
- **CORS Support**: FastAPI `CORSMiddleware` is configured to allow cross-origin requests from any origin (`allow_origins=["*"]`), ensuring seamless communication between the frontend and backend.
