import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg
from sentence_transformers import SentenceTransformer

env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

MODEL_NAME = "BAAI/bge-small-en-v1.5"
model = SentenceTransformer(MODEL_NAME)

# BGE models require this prefix ONLY for search queries, never for database chunks
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "

DB_URI = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

def embed_query(question: str):
    # Step 1: Add the instruction prefix to the question before embedding
    return model.encode(QUERY_PREFIX + question, normalize_embeddings=True).tolist()

def retrieve(question: str, k: int = 6):
    q = embed_query(question)
    
    # Format the Python list into a pgvector-compatible string format
    vec = "[" + ",".join(map(str, q)) + "]"
    
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            # Step 2 & 3: Vector Search and Retrieval
            cur.execute(
                """
                SELECT id, type, text, source_url, author, date, linked_ids, files,
                       1 - (embedding <=> %s::vector) AS score
                FROM chunks
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (vec, vec, k),
            )
            rows = cur.fetchall()
            
            results = []
            for r in rows:
                results.append({
                    "id": r[0],
                    "type": r[1],
                    "text": r[2],
                    "source_url": r[3],
                    "author": r[4],
                    "date": str(r[5]),
                    "linked_ids": r[6],
                    "files": r[7],
                    "score": float(r[8])
                })
            return results

def fetch_by_ids(ids):
    if not ids:
        return []
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, type, text, source_url, author, date, linked_ids, files "
                "FROM chunks WHERE id = ANY(%s)", (list(ids),))
            return [{"id": r[0], "type": r[1], "text": r[2], "source_url": r[3],
                     "author": r[4], "date": str(r[5]), "linked_ids": r[6],
                     "files": r[7], "score": None} for r in cur.fetchall()]

if __name__ == "__main__":
    test_q = "Why did users get 401 unauthorized errors during JWT refresh?"
    print(f"\nSearching for: '{test_q}'\n")
    for h in retrieve(test_q, k=2):
        print(f"Score: {h['score']:.3f} | ID: {h['id']} | Text: {h['text'][:80]}...")
