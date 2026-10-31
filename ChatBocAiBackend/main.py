from contextlib import asynccontextmanager
import datetime
import os
from pathlib import Path
import uuid
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg

# Ensure environment variables are loaded
env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

from answer import ask
from db_setup import init_db
from ingest import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE,
    ingest_document,
    ingest_github_repo,
    delete_chunks_by_prefix,
    DB_URI,
)

# In-memory background task registry
task_registry: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables and pgvector extension if DB is reachable
    try:
        init_db()
    except Exception as e:
        print(f"[Startup] DB initialization note: {e}")
    yield


app = FastAPI(title="Project Brain AI", lifespan=lifespan)

# CORS: Allow only frontend origins from env variable, defaulting to local dev URL
frontend_origin_env = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in frontend_origin_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str


class RepoRequest(BaseModel):
    repo_url: str


class DeleteRepoRequest(BaseModel):
    repo_prefix: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/assistant/ask")
@app.post("/ask")
def ask_endpoint(body: Question):
    q = body.question.strip()
    if not q:
        return {"found": False, "answer": "Please enter a question.", "sources": [], "confidence": "none"}
    try:
        return ask(q)
    except Exception as e:
        print("ERROR:", e)  # log it, but never crash the demo
        return {
            "found": False,
            "answer": "Something went wrong. Please try again.",
            "sources": [],
            "confidence": "none",
        }


def _run_document_task(task_id: str, filename: str, file_bytes: bytes):
    def update_progress(msg: str, cur: int, total: int):
        if task_id in task_registry:
            task_registry[task_id]["progress"] = msg

    try:
        result = ingest_document(filename, file_bytes, progress_callback=update_progress)
        if task_id in task_registry:
            task_registry[task_id]["status"] = "completed"
            task_registry[task_id]["progress"] = f"Successfully indexed {result['chunks_ingested']} chunk(s) from {filename}."
            task_registry[task_id]["chunks_ingested"] = result["chunks_ingested"]
            task_registry[task_id]["completed_at"] = str(datetime.datetime.now())
    except Exception as e:
        if task_id in task_registry:
            task_registry[task_id]["status"] = "failed"
            task_registry[task_id]["error"] = str(e)
            task_registry[task_id]["progress"] = f"Failed: {e}"
            task_registry[task_id]["completed_at"] = str(datetime.datetime.now())


def _run_repo_task(task_id: str, repo_url: str):
    def update_progress(msg: str, cur: int, total: int):
        if task_id in task_registry:
            task_registry[task_id]["progress"] = msg

    try:
        result = ingest_github_repo(repo_url, progress_callback=update_progress)
        if task_id in task_registry:
            task_registry[task_id]["status"] = "completed"
            task_registry[task_id]["progress"] = f"Indexed {result['chunks_ingested']} items from {result['repository']}."
            task_registry[task_id]["chunks_ingested"] = result["chunks_ingested"]
            task_registry[task_id]["completed_at"] = str(datetime.datetime.now())
    except Exception as e:
        if task_id in task_registry:
            task_registry[task_id]["status"] = "failed"
            task_registry[task_id]["error"] = str(e)
            task_registry[task_id]["progress"] = f"Failed: {e}"
            task_registry[task_id]["completed_at"] = str(datetime.datetime.now())


@app.post("/api/knowledge/upload")
async def upload_document_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Only {allowed} files are supported.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 5 MB ({len(content) / (1024 * 1024):.2f} MB).",
        )

    task_id = str(uuid.uuid4())
    task_registry[task_id] = {
        "task_id": task_id,
        "type": "document",
        "target": file.filename,
        "status": "processing",
        "progress": f"Queued {file.filename} for indexing...",
        "chunks_ingested": 0,
        "error": None,
        "started_at": str(datetime.datetime.now()),
    }

    background_tasks.add_task(_run_document_task, task_id, file.filename, content)
    return {"task_id": task_id, "status": "processing", "message": f"Upload received for {file.filename}."}


@app.post("/api/knowledge/repository")
def connect_repository_endpoint(body: RepoRequest, background_tasks: BackgroundTasks):
    url = body.repo_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Repository URL or owner/repo is required.")

    task_id = str(uuid.uuid4())
    task_registry[task_id] = {
        "task_id": task_id,
        "type": "repository",
        "target": url,
        "status": "processing",
        "progress": "Starting repository ingestion...",
        "chunks_ingested": 0,
        "error": None,
        "started_at": str(datetime.datetime.now()),
    }

    background_tasks.add_task(_run_repo_task, task_id, url)
    return {"task_id": task_id, "status": "processing", "message": "Repository ingestion started."}


@app.get("/api/knowledge/status/{task_id}")
def get_task_status(task_id: str):
    task = task_registry.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


@app.delete("/api/knowledge/repository")
def delete_repository_endpoint(body: DeleteRepoRequest):
    prefix = body.repo_prefix.strip()
    if not prefix:
        raise HTTPException(status_code=400, detail="Repository prefix or identifier is required.")
    deleted = delete_chunks_by_prefix(prefix)
    return {"status": "ok", "deleted_chunks": deleted}


@app.get("/api/knowledge/sources")
def get_sources_endpoint():
    """Return live indexed knowledge sources grouped by documents and repositories."""
    docs = {}
    repos = {}

    try:
        with psycopg.connect(DB_URI) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, type, source_url, author, date, files
                    FROM chunks
                    ORDER BY date DESC;
                    """
                )
                rows = cur.fetchall()

                for r in rows:
                    cid, ctype, source_url, author, date_val, files = r
                    date_str = str(date_val) if date_val else ""

                    if ctype == "document":
                        doc_name = (files and files[0]) or source_url or cid.split("#")[0]
                        if doc_name not in docs:
                            docs[doc_name] = {
                                "id": doc_name,
                                "name": doc_name,
                                "source": "Uploaded Document",
                                "chunks": 0,
                                "updated": date_str,
                                "author": author or "User",
                                "score": 95,
                            }
                        docs[doc_name]["chunks"] += 1

                    elif ctype in ("commit", "issue", "pr"):
                        # Extract repo name from id e.g. gh_owner_repo_commit_sha
                        parts = cid.split("_")
                        if len(parts) >= 4 and parts[0] == "gh":
                            owner, repo_name = parts[1], parts[2]
                            full_repo = f"{owner}/{repo_name}"
                        else:
                            full_repo = "Imported Repository"

                        if full_repo not in repos:
                            repos[full_repo] = {
                                "id": f"gh_{full_repo.replace('/', '_')}",
                                "name": full_repo,
                                "subtitle": "Public GitHub Repository",
                                "status": "Synced",
                                "lastSynced": date_str or "Just now",
                                "commits": 0,
                                "prs": 0,
                                "issues": 0,
                                "iconColor": "teal",
                            }
                        if ctype == "commit":
                            repos[full_repo]["commits"] += 1
                        elif ctype == "pr":
                            repos[full_repo]["prs"] += 1
                        elif ctype == "issue":
                            repos[full_repo]["issues"] += 1
    except Exception as e:
        print("Error fetching sources:", e)

    return {
        "documents": list(docs.values()),
        "repositories": list(repos.values()),
        "total_documents": len(docs),
        "total_repositories": len(repos),
    }
