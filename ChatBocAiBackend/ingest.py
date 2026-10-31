import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg
from sentence_transformers import SentenceTransformer

env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

# Load embedding model (384-dim)
model = SentenceTransformer("BAAI/bge-small-en-v1.5")
DB_URI = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

# 20 Fake Chunks to unblock yourself until M2/M3 deliver real data
FAKE_CHUNKS = [
    {
        "id": "commit_a1b2c3",
        "type": "commit",
        "text": "Refactored JWT token auth handler to fix race condition during token refresh under high load.",
        "source_url": "https://github.com/org/repo/commit/a1b2c3",
        "author": "Alice",
        "date": "2025-03-14",
        "linked_ids": ["issue_101", "pr_202"],
        "files": ["src/auth.py", "src/middleware.py"]
    },
    {
        "id": "issue_101",
        "type": "issue",
        "text": "Bug: Users experiencing intermitten 401 Unauthorized during active sessions when renewing JWT.",
        "source_url": "https://github.com/org/repo/issues/101",
        "author": "Bob",
        "date": "2025-03-12",
        "linked_ids": ["commit_a1b2c3"],
        "files": ["src/auth.py"]
    },
    {
        "id": "commit_d4e5f6",
        "type": "commit",
        "text": "Added Redis connection pooling and retry exponential backoff for database connection drops.",
        "source_url": "https://github.com/org/repo/commit/d4e5f6",
        "author": "Charlie",
        "date": "2025-03-15",
        "linked_ids": ["pr_203"],
        "files": ["src/db.py"]
    }
]

def embed_and_store(chunks):
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            for c in chunks:
                # Combine text with key metadata so dates & authors are searchable
                embed_text = f"[{c['type']}] {c['text']} (Author: {c['author']}, Date: {c['date']})"
                
                # Generate vector embedding (normalized for cosine distance)
                embedding = model.encode(embed_text, normalize_embeddings=True).tolist()
                
                cur.execute("""
                INSERT INTO chunks (id, type, text, source_url, author, date, linked_ids, files, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
                ON CONFLICT (id) DO UPDATE 
                SET text = EXCLUDED.text, embedding = EXCLUDED.embedding;
                """, (
                    c['id'], c['type'], c['text'], c['source_url'], 
                    c['author'], c['date'], c['linked_ids'], c['files'], embedding
                ))
            conn.commit()
            print(f"Successfully embedded and inserted {len(chunks)} chunks into pgvector!")

if __name__ == "__main__":
    embed_and_store(FAKE_CHUNKS)
