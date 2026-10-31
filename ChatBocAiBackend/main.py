import asyncio
from contextlib import asynccontextmanager
import datetime
import os
from pathlib import Path
import threading
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
from knowledge_ingest import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE,
    ingest_document_file,
    ingest_github_repository,
    delete_chunks_by_prefix,
    DB_URI,
)

# In-memory background task registry (Single-worker uvicorn required for consistent state)
task_registry: dict[str, dict] = {}

# Enforce only one indexing job at a time
indexing_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables and pgvector extension if DB is reachable
    try:
        init_db()
    except Exception as e:
        print(f"[Startup] DB initialization note: {e}")
    yield


app = FastAPI(title="Project Brain AI", lifespan=lifespan)

# CORS: allow origins from FRONTEND_ORIGIN (comma-separated, parse with split(",")), default http://localhost:5173
frontend_origin_env = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
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


class DeletePrefixRequest(BaseModel):
    prefix: str


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
        print("ERROR:", e)  # log error, never crash demo
        return {
            "found": False,
            "answer": "Something went wrong. Please try again.",
            "sources": [],
            "confidence": "none",
        }


def _run_document_indexing(task_id: str, filename: str, file_bytes: bytes):
    def update_progress(msg: str, cur: int, total: int):
        if task_id in task_registry:
            task_registry[task_id]["progress"] = msg

    acquired = indexing_lock.acquire(blocking=False)
    if not acquired:
        task_registry[task_id]["status"] = "failed"
        task_registry[task_id]["error"] = "Another indexing job is currently running. Please wait for it to complete."
        task_registry[task_id]["progress"] = "Failed: Concurrency limit (one indexing job at a time)."
        task_registry[task_id]["completed_at"] = str(datetime.datetime.now())
        return

    try:
        result = ingest_document_file(filename, file_bytes, progress_callback=update_progress)
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
    finally:
        indexing_lock.release()


def _run_repo_indexing(task_id: str, repo_url: str):
    def update_progress(msg: str, cur: int, total: int):
        if task_id in task_registry:
            task_registry[task_id]["progress"] = msg

    acquired = indexing_lock.acquire(blocking=False)
    if not acquired:
        task_registry[task_id]["status"] = "failed"
        task_registry[task_id]["error"] = "Another indexing job is currently running. Please wait for it to complete."
        task_registry[task_id]["progress"] = "Failed: Concurrency limit (one indexing job at a time)."
        task_registry[task_id]["completed_at"] = str(datetime.datetime.now())
        return

    try:
        result = ingest_github_repository(repo_url, progress_callback=update_progress)
        if task_id in task_registry:
            status_val = result.get("status", "completed")
            task_registry[task_id]["status"] = status_val
            progress_msg = f"Indexed {result['chunks_ingested']} items from {result['repository']}."
            if result.get("partial_note"):
                progress_msg += f" Note: {result['partial_note']}"
            task_registry[task_id]["progress"] = progress_msg
            task_registry[task_id]["chunks_ingested"] = result["chunks_ingested"]
            task_registry[task_id]["completed_at"] = str(datetime.datetime.now())
    except Exception as e:
        if task_id in task_registry:
            task_registry[task_id]["status"] = "failed"
            task_registry[task_id]["error"] = str(e)
            task_registry[task_id]["progress"] = f"Failed: {e}"
            task_registry[task_id]["completed_at"] = str(datetime.datetime.now())
    finally:
        indexing_lock.release()


@app.post("/api/knowledge/upload")
async def upload_document_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Only {allowed} files are supported.",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

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

    background_tasks.add_task(_run_document_indexing, task_id, file.filename, content)
    return {"task_id": task_id, "status": "processing", "message": f"Upload queued for {file.filename}."}


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
        "progress": "Connecting to GitHub repository...",
        "chunks_ingested": 0,
        "error": None,
        "started_at": str(datetime.datetime.now()),
    }

    background_tasks.add_task(_run_repo_indexing, task_id, url)
    return {"task_id": task_id, "status": "processing", "message": "Repository ingestion started."}


@app.get("/api/knowledge/status/{task_id}")
def get_task_status(task_id: str):
    task = task_registry.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


@app.delete("/api/knowledge/reset")
def reset_chunks_endpoint(body: DeletePrefixRequest):
    prefix = body.prefix.strip()
    if not prefix:
        raise HTTPException(status_code=400, detail="Prefix is required (e.g. 'gh:owner:repo:' or 'upload:filename#').")
    deleted = delete_chunks_by_prefix(prefix)
    return {"status": "ok", "deleted_chunks": deleted}


@app.get("/api/knowledge/sources")
def get_sources_endpoint():
    """
    List indexed documents and repositories using the delimiter prefixes:
    upload:<filename>#<n> and gh:<owner>:<repo>:...
    """
    docs: dict[str, dict] = {}
    repos: dict[str, dict] = {}

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

                    if cid.startswith("upload:"):
                        # upload:<filename>#<n>
                        doc_key = cid.split("#")[0].replace("upload:", "")
                        if doc_key not in docs:
                            docs[doc_key] = {
                                "id": f"upload:{doc_key}#",
                                "name": doc_key,
                                "source": "Uploaded Document",
                                "chunks": 0,
                                "updated": date_str,
                                "author": author or "User",
                                "score": 95,
                            }
                        docs[doc_key]["chunks"] += 1

                    elif cid.startswith("gh:"):
                        # gh:<owner>:<repo>:<type>:...
                        parts = cid.split(":")
                        if len(parts) >= 4:
                            owner, repo_name = parts[1], parts[2]
                            repo_key = f"{owner}/{repo_name}"
                            repo_prefix = f"gh:{owner}:{repo_name}:"
                        else:
                            repo_key = "Imported Repository"
                            repo_prefix = "gh:"

                        if repo_key not in repos:
                            repos[repo_key] = {
                                "id": repo_prefix,
                                "name": repo_key,
                                "subtitle": "Public GitHub Repository",
                                "status": "Synced",
                                "lastSynced": date_str or "Just now",
                                "commits": 0,
                                "prs": 0,
                                "issues": 0,
                                "docs": 0,
                                "iconColor": "teal",
                            }

                        item_type = parts[3] if len(parts) >= 4 else ctype
                        if item_type == "commit":
                            repos[repo_key]["commits"] += 1
                        elif item_type == "pr":
                            repos[repo_key]["prs"] += 1
                        elif item_type == "issue":
                            repos[repo_key]["issues"] += 1
                        elif item_type == "doc":
                            repos[repo_key]["docs"] += 1

                    elif ctype == "document":
                        # Legacy document fallback
                        doc_name = (files and files[0]) or source_url or cid.split("#")[0]
                        if doc_name not in docs:
                            docs[doc_name] = {
                                "id": f"upload:{doc_name}#",
                                "name": doc_name,
                                "source": "Uploaded Document",
                                "chunks": 0,
                                "updated": date_str,
                                "author": author or "User",
                                "score": 95,
                            }
                        docs[doc_name]["chunks"] += 1
    except Exception as e:
        print("Error fetching sources:", e)

    return {
        "documents": list(docs.values()),
        "repositories": list(repos.values()),
        "total_documents": len(docs),
        "total_repositories": len(repos),
    }
