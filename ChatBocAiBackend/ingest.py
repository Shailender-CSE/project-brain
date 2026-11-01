import datetime
import io
import os
from pathlib import Path
import re
from dotenv import load_dotenv
import psycopg
from pypdf import PdfReader
import requests
from sentence_transformers import SentenceTransformer

env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

# Load embedding model (384-dim)
model = SentenceTransformer("BAAI/bge-small-en-v1.5")
DB_URI = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".py", ".js", ".ts", ".java", ".json"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Legacy demo chunks to keep test fixtures working
FAKE_CHUNKS = [
    {
        "id": "commit_a1b2c3",
        "type": "commit",
        "text": "Refactored JWT token auth handler to fix race condition during token refresh under high load.",
        "source_url": "https://github.com/org/repo/commit/a1b2c3",
        "author": "Alice",
        "date": "2025-03-14",
        "linked_ids": ["issue_101", "pr_202"],
        "files": ["src/auth.py", "src/middleware.py"],
    },
    {
        "id": "issue_101",
        "type": "issue",
        "text": "Bug: Users experiencing intermitten 401 Unauthorized during active sessions when renewing JWT.",
        "source_url": "https://github.com/org/repo/issues/101",
        "author": "Bob",
        "date": "2025-03-12",
        "linked_ids": ["commit_a1b2c3"],
        "files": ["src/auth.py"],
    },
    {
        "id": "commit_d4e5f6",
        "type": "commit",
        "text": "Added Redis connection pooling and retry exponential backoff for database connection drops.",
        "source_url": "https://github.com/org/repo/commit/d4e5f6",
        "author": "Charlie",
        "date": "2025-03-15",
        "linked_ids": ["pr_203"],
        "files": ["src/db.py"],
    },
]


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and invalid characters."""
    base = os.path.basename(filename.strip().replace("\\", "/"))
    clean = re.sub(r"[^a-zA-Z0-9_\-\. ]", "_", base)
    clean = clean.lstrip(".")
    return clean or "document"


def extract_text(filename: str, file_bytes: bytes) -> str:
    """Extract clean text content from supported file types."""
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages).strip()
            if not text:
                raise ValueError("PDF contains no extractable text.")
            return text
        except Exception as e:
            raise ValueError(f"Failed to read PDF document: {e}")
    else:
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("utf-8", errors="replace")


def chunk_words(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """Split text into chunks of ~300-500 words with overlap."""
    words = text.split()
    if not words:
        return []
    if len(words) <= chunk_size:
        return [" ".join(words)]

    chunks = []
    step = max(1, chunk_size - overlap)
    for i in range(0, len(words), step):
        chunk = words[i : i + chunk_size]
        if chunk:
            chunks.append(" ".join(chunk))
        if i + chunk_size >= len(words):
            break
    return chunks


def upsert_chunks(chunks: list[dict], progress_callback=None) -> int:
    """Embed chunks (without query prefix) and upsert into pgvector chunks table."""
    if not chunks:
        return 0

    total = len(chunks)
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            for idx, c in enumerate(chunks, 1):
                if progress_callback:
                    progress_callback(f"Embedding chunks ({idx}/{total})...", idx, total)

                # Combine text with metadata for richer cosine similarity
                author_str = c.get("author") or "Unknown"
                date_str = str(c.get("date") or datetime.date.today())
                type_str = c.get("type") or "document"
                files_list = c.get("files") or []
                files_str = f", Files: {', '.join(files_list)}" if files_list else ""
                embed_text = f"[{type_str}] {c['text']} (Author: {author_str}, Date: {date_str}{files_str})"

                # Vector embedding: normalize_embeddings=True, WITHOUT BGE query prefix
                embedding = model.encode(embed_text, normalize_embeddings=True).tolist()

                cur.execute(
                    """
                    INSERT INTO chunks (id, type, text, source_url, author, date, linked_ids, files, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
                    ON CONFLICT (id) DO UPDATE 
                    SET type = EXCLUDED.type,
                        text = EXCLUDED.text,
                        source_url = EXCLUDED.source_url,
                        author = EXCLUDED.author,
                        date = EXCLUDED.date,
                        linked_ids = EXCLUDED.linked_ids,
                        files = EXCLUDED.files,
                        embedding = EXCLUDED.embedding;
                    """,
                    (
                        c["id"],
                        c["type"],
                        c["text"],
                        c.get("source_url", ""),
                        c.get("author", "User"),
                        c.get("date", datetime.date.today()),
                        c.get("linked_ids", []),
                        c.get("files", []),
                        embedding,
                    ),
                )
            conn.commit()
    return total


def ingest_document(filename: str, file_bytes: bytes, author: str = "User", progress_callback=None) -> dict:
    """Validate, chunk, embed and upsert an uploaded document."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed_str = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"Invalid file extension '{ext}'. Allowed types: {allowed_str}")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds maximum limit of 5 MB ({len(file_bytes) / (1024 * 1024):.2f} MB provided).")

    clean_filename = sanitize_filename(filename)
    if progress_callback:
        progress_callback(f"Extracting text from {clean_filename}...", 0, 1)

    text = extract_text(clean_filename, file_bytes)
    if not text.strip():
        raise ValueError("Document contains no text content.")

    word_chunks = chunk_words(text, chunk_size=400, overlap=50)
    today = datetime.date.today()

    chunk_objects = []
    for idx, chunk in enumerate(word_chunks):
        chunk_id = f"{clean_filename}#{idx}"
        chunk_objects.append(
            {
                "id": chunk_id,
                "type": "document",
                "text": chunk,
                "source_url": clean_filename,
                "author": author,
                "date": today,
                "linked_ids": [],
                "files": [clean_filename],
            }
        )

    count = upsert_chunks(chunk_objects, progress_callback=progress_callback)
    return {
        "filename": clean_filename,
        "chunks_ingested": count,
        "chunk_ids": [c["id"] for c in chunk_objects],
    }


def parse_github_url(url: str) -> tuple[str, str]:
    """Parse owner and repo from a GitHub URL or owner/repo string."""
    clean = url.strip()
    clean = re.sub(r"^https?://github\.com/", "", clean)
    clean = re.sub(r"^github\.com/", "", clean)
    clean = clean.rstrip("/")
    if clean.endswith(".git"):
        clean = clean[:-4]

    parts = clean.split("/")
    if len(parts) < 2 or not parts[0] or not parts[1]:
        raise ValueError("Invalid GitHub repository URL. Format must be 'owner/repo' or 'https://github.com/owner/repo'.")

    owner = re.sub(r"[^a-zA-Z0-9_\-]", "", parts[0])
    repo = re.sub(r"[^a-zA-Z0-9_\-\.]", "", parts[1])
    return owner, repo


def parse_issue_refs(text: str, owner: str, repo: str) -> list[str]:
    """Extract linked issue/PR references like Fixes #101 or #101."""
    if not text:
        return []
    matches = re.findall(r"#(\d+)", text)
    linked = []
    for m in set(matches):
        linked.append(f"gh_{owner}_{repo}_issue_{m}")
        linked.append(f"gh_{owner}_{repo}_pr_{m}")
    return linked


def ingest_github_repo(repo_url: str, progress_callback=None) -> dict:
    """Ingest up to 100 commits, 50 issues, and 50 PRs from a public GitHub repository."""
    owner, repo = parse_github_url(repo_url)
    repo_prefix = f"gh_{owner}_{repo}"
    api_base = f"https://api.github.com/repos/{owner}/{repo}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Project-Brain-RAG-Demo",
    }
    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    if progress_callback:
        progress_callback(f"Connecting to repository {owner}/{repo}...", 0, 1)

    # 1. Verify repo exists and is public
    try:
        r_repo = requests.get(api_base, headers=headers, timeout=15)
        if r_repo.status_code == 404:
            raise ValueError(f"Repository '{owner}/{repo}' was not found or is private.")
        if r_repo.status_code in (403, 429):
            raise ValueError("GitHub API rate limit exceeded. Provide a GITHUB_TOKEN in .env or wait before retrying.")
        if r_repo.status_code != 200:
            raise ValueError(f"GitHub API error ({r_repo.status_code}): {r_repo.text}")
    except requests.RequestException as e:
        raise ValueError(f"Network error connecting to GitHub: {e}")

    all_chunks = []

    # 2. Fetch up to 100 commits
    if progress_callback:
        progress_callback("Fetching commits (up to 100)...", 0, 100)

    try:
        r_commits = requests.get(f"{api_base}/commits?per_page=100", headers=headers, timeout=20)
        if r_commits.status_code == 200:
            commits = r_commits.json()[:100]
            for idx, c in enumerate(commits, 1):
                sha = c.get("sha", "")
                commit_info = c.get("commit", {})
                message = commit_info.get("message", "")
                author = (
                    (c.get("author") or {}).get("login")
                    or (commit_info.get("author") or {}).get("name")
                    or "Unknown"
                )
                date_raw = (commit_info.get("author") or {}).get("date") or str(datetime.date.today())
                date_str = date_raw[:10]
                html_url = c.get("html_url") or f"https://github.com/{owner}/{repo}/commit/{sha}"

                linked = parse_issue_refs(message, owner, repo)
                chunk_id = f"{repo_prefix}_commit_{sha[:10]}"

                summary = f"Commit {sha[:8]} by {author} on {date_str}: {message.strip()}"
                all_chunks.append(
                    {
                        "id": chunk_id,
                        "type": "commit",
                        "text": summary,
                        "source_url": html_url,
                        "author": author,
                        "date": date_str,
                        "linked_ids": linked,
                        "files": [],
                    }
                )
                if progress_callback and idx % 20 == 0:
                    progress_callback(f"Processed {idx}/{len(commits)} commits...", idx, len(commits))
    except Exception as e:
        print(f"Warning fetching commits: {e}")

    # 3. Fetch up to 50 issues and 50 PRs
    if progress_callback:
        progress_callback("Fetching issues and pull requests (up to 50 each)...", 0, 100)

    try:
        r_issues = requests.get(f"{api_base}/issues?state=all&per_page=100", headers=headers, timeout=20)
        if r_issues.status_code == 200:
            items = r_issues.json()
            issue_count = 0
            pr_count = 0
            for item in items:
                is_pr = "pull_request" in item
                if is_pr and pr_count >= 50:
                    continue
                if not is_pr and issue_count >= 50:
                    continue

                number = item.get("number")
                title = item.get("title", "")
                body = (item.get("body") or "").strip()
                # Truncate overly long bodies to ~1500 chars to fit RAG chunk norms
                if len(body) > 1500:
                    body = body[:1500] + "... [truncated]"

                author = (item.get("user") or {}).get("login") or "Unknown"
                date_str = (item.get("created_at") or str(datetime.date.today()))[:10]
                html_url = item.get("html_url") or f"https://github.com/{owner}/{repo}/issues/{number}"

                linked = parse_issue_refs(f"{title}\n{body}", owner, repo)

                if is_pr:
                    pr_count += 1
                    chunk_id = f"{repo_prefix}_pr_{number}"
                    text = f"Pull Request #{number}: {title}\n{body}"
                    c_type = "pr"
                else:
                    issue_count += 1
                    chunk_id = f"{repo_prefix}_issue_{number}"
                    text = f"Issue #{number}: {title}\n{body}"
                    c_type = "issue"

                all_chunks.append(
                    {
                        "id": chunk_id,
                        "type": c_type,
                        "text": text,
                        "source_url": html_url,
                        "author": author,
                        "date": date_str,
                        "linked_ids": linked,
                        "files": [],
                    }
                )
    except Exception as e:
        print(f"Warning fetching issues/PRs: {e}")

    if not all_chunks:
        raise ValueError(f"No commits, issues, or PRs found to ingest for repository {owner}/{repo}.")

    # 4. Upsert all chunks into database
    total_ingested = upsert_chunks(all_chunks, progress_callback=progress_callback)
    if progress_callback:
        progress_callback(f"Completed indexing {owner}/{repo} ({total_ingested} items)!", total_ingested, total_ingested)

    return {
        "repository": f"{owner}/{repo}",
        "repo_prefix": repo_prefix,
        "total_chunks": total_ingested,
        "chunks_ingested": total_ingested,
    }


def delete_chunks_by_prefix(prefix: str) -> int:
    """Delete all chunks whose ID matches the given prefix (used for demo resets)."""
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM chunks WHERE id LIKE %s OR source_url LIKE %s", (f"{prefix}%", f"%{prefix}%"))
            deleted = cur.rowcount
            conn.commit()
            return deleted


def embed_and_store(chunks):
    """Legacy helper function."""
    return upsert_chunks(chunks)


if __name__ == "__main__":
    embed_and_store(FAKE_CHUNKS)
