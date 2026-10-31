from contextlib import asynccontextmanager
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure environment variables are loaded
env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

from answer import ask
from db_setup import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables and pgvector extension if DB is reachable
    try:
        init_db()
    except Exception as e:
        print(f"[Startup] DB initialization note: {e}")
    yield

app = FastAPI(title="Project Brain AI", lifespan=lifespan)

# Enable CORS for frontend integration
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

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
