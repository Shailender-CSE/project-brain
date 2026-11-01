import datetime
import io
import os
from pathlib import Path
import re
from typing import Callable, Optional
from dotenv import load_dotenv
import psycopg
from pypdf import PdfReader
import requests
from sentence_transformers import SentenceTransformer

env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

# Reuse existing embedding model (384-dim, BAAI/bge-small-en-v1.5)
MODEL_NAME = "BAAI/bge-small-en-v1.5"
model = SentenceTransformer(MODEL_NAME)

DB_URI = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".py", ".js", ".ts", ".java", ".json"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and remove invalid characters."""
    base = os.path.basename(filename.strip().replace("\\", "/"))
    clean = re.sub(r"[^a-zA-Z0-9_\-\. ]", "_", base)
    clean = clean.lstrip(".")
    return clean or "document"


def extract_document_text(filename: str, file_bytes: bytes) -> str:
    """Extract clean text from supported document types."""
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages).strip()
            if not text:
                raise ValueError("PDF document has no extractable text.")
            return text
        except Exception as e:
            if "no extractable text" in str(e).lower():
                raise
            raise ValueError(f"Failed to read PDF document: {e}")
    else:
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("utf-8", errors="replace")


def chunk_words(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """Split text into chunks of ~300-500 words with small overlap."""
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


def batch_embed_texts(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    """Batch embed text without query prefix using normalize_embeddings=True."""
    if not texts:
        return []
    embeddings = model.encode(texts, batch_size=batch_size, normalize_embeddings=True)
    return [e.tolist() for e in embeddings]


def delete_and_upsert_chunks(prefix: str, chunks: list[dict], progress_callback: Optional[Callable] = None) -> int:
    """
    Run delete (by starts_with(id, prefix)) and upsert in a single atomic database transaction.
    Uses batch embedding generation for performance.
    """
    total = len(chunks)
    if total > 0:
        if progress_callback:
            progress_callback(f"Embedding {total} chunk(s) in batches...", 0, total)

        embed_texts = []
        for c in chunks:
            author_str = c.get("author") or "Unknown"
            date_str = str(c.get("date") or datetime.date.today())
            type_str = c.get("type") or "doc"
            files_list = c.get("files") or []
            files_str = f", Files: {', '.join(files_list)}" if files_list else ""
            embed_texts.append(f"[{type_str}] {c['text']} (Author: {author_str}, Date: {date_str}{files_str})")

        embeddings = batch_embed_texts(embed_texts, batch_size=32)
        for i, c in enumerate(chunks):
            c["embedding"] = embeddings[i]

    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            # 1. Atomic delete using starts_with (prefix-based cleanup)
            cur.execute("DELETE FROM chunks WHERE starts_with(id, %s);", (prefix,))

            # 2. Upsert new chunks
            if total > 0:
                if progress_callback:
                    progress_callback(f"Writing {total} chunk(s) to vector database...", total, total)

                for c in chunks:
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
                            c["embedding"],
                        ),
                    )
            conn.commit()
    return total


def ingest_document_file(filename: str, file_bytes: bytes, author: str = "User", progress_callback: Optional[Callable] = None) -> dict:
    """
    Ingest a document file (.txt, .md, .pdf, .py, .js, .ts, .java, .json).
    Uses chunk id format: upload:<filename>#<n>, type="doc", source_url=filename, files=[].
    Atomic delete with starts_with(id, 'upload:<filename>#') ensures re-uploading shorter files leaves no stale chunks.
    """
    if not file_bytes:
        raise ValueError("File is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds maximum limit of 5 MB ({len(file_bytes) / (1024 * 1024):.2f} MB provided).")

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed_str = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"Invalid file extension '{ext}'. Allowed types: {allowed_str}")

    clean_filename = sanitize_filename(filename)
    if progress_callback:
        progress_callback(f"Extracting text from {clean_filename}...", 0, 1)

    text = extract_document_text(clean_filename, file_bytes)
    if not text.strip():
        raise ValueError("Document contains no extractable text.")

    word_chunks = chunk_words(text, chunk_size=400, overlap=50)
    today = datetime.date.today()

    chunk_objects = []
    for idx, chunk in enumerate(word_chunks):
        chunk_id = f"upload:{clean_filename}#{idx}"
        chunk_objects.append(
            {
                "id": chunk_id,
                "type": "doc",
                "text": chunk,
                "source_url": clean_filename,
                "author": author,
                "date": today,
                "linked_ids": [],
                "files": [],  # explicitly set to empty list per specification
            }
        )

    prefix = f"upload:{clean_filename}#"
    count = delete_and_upsert_chunks(prefix, chunk_objects, progress_callback=progress_callback)
    return {
        "filename": clean_filename,
        "chunks_ingested": count,
        "chunk_ids": [c["id"] for c in chunk_objects],
    }


def parse_github_repo_url(url: str) -> tuple[str, str]:
    """Parse owner and repo from a GitHub URL or owner/repo string."""
    clean = url.strip()
    clean = re.sub(r"^https?://github\.com/", "", clean)
    clean = re.sub(r"^github\.com/", "", clean)
    clean = clean.rstrip("/")
    if clean.endswith(".git"):
        clean = clean[:-4]

    parts = clean.split("/")
    if len(parts) < 2 or not parts[0] or not parts[1]:
        raise ValueError("Invalid GitHub repository URL. Expected format: 'owner/repo' or 'https://github.com/owner/repo'.")

    owner = re.sub(r"[^a-zA-Z0-9_\-]", "", parts[0])
    repo = re.sub(r"[^a-zA-Z0-9_\-\.]", "", parts[1])
    if not owner or not repo:
        raise ValueError("Invalid GitHub repository URL: owner and repo must be non-empty.")
    return owner, repo


def extract_issue_pr_refs(text: str) -> list[str]:
    """Extract referenced numbers like Fixes #N, Closes #N, Resolves #N or plain #N."""
    if not text:
        return []
    # Match keyword references or standalone #N
    refs = re.findall(r"(?:Fixes|Fixed|Closes|Closed|Resolves|Resolved)?\s*#(\d+)", text, re.IGNORECASE)
    return list(set(refs))


def ingest_github_repository(repo_url: str, progress_callback: Optional[Callable] = None) -> dict:
    """
    Ingest a public GitHub repository.
    IDs:
      gh:<owner>:<repo>:commit:<sha10>
      gh:<owner>:<repo>:issue:<n>
      gh:<owner>:<repo>:pr:<n>
      gh:<owner>:<repo>:doc:<name>#<n>
    Caps: up to 100 commits, 50 issues, 50 PRs.
    Handles rate limits gracefully: finishes as 'completed (partial)' if rate limit is reached.
    Resolves linked_ids only to chunks that actually exist after ingestion.
    """
    owner, repo = parse_github_repo_url(repo_url)
    repo_prefix = f"gh:{owner}:{repo}:"
    api_base = f"https://api.github.com/repos/{owner}/{repo}"

    github_token = os.getenv("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ProjectBrain-RAG-Agent",
    }
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"
    else:
        print("[Notice] GITHUB_TOKEN is not set. Requests to GitHub API may hit the 60 req/hr unauthenticated rate limit.")

    if progress_callback:
        progress_callback(f"Connecting to repository {owner}/{repo}...", 0, 1)

    # 1. Verify existence and public accessibility
    try:
        r_repo = requests.get(api_base, headers=headers, timeout=15)
        if r_repo.status_code == 404:
            raise ValueError(f"Repository '{owner}/{repo}' was not found or is private.")
        if r_repo.status_code in (403, 429) and int(r_repo.headers.get("x-ratelimit-remaining", 1)) == 0:
            raise ValueError("GitHub API rate limit exceeded before starting ingestion. Please set GITHUB_TOKEN in your environment.")
        if r_repo.status_code != 200:
            raise ValueError(f"GitHub API error ({r_repo.status_code}): {r_repo.text}")
    except requests.RequestException as e:
        raise ValueError(f"Network error connecting to GitHub: {e}")

    raw_chunks: list[dict] = []
    partial_note = None
    rate_limit_hit = False

    # 2. Fetch README and top-level docs (type="doc")
    if progress_callback:
        progress_callback("Fetching repository README and docs...", 0, 1)
    try:
        r_readme = requests.get(f"{api_base}/readme", headers=headers, timeout=10)
        if r_readme.status_code == 200:
            readme_data = r_readme.json()
            download_url = readme_data.get("download_url")
            if download_url:
                r_content = requests.get(download_url, timeout=10)
                if r_content.status_code == 200:
                    readme_text = r_content.text
                    doc_chunks = chunk_words(readme_text, chunk_size=400, overlap=50)
                    for idx, c_text in enumerate(doc_chunks):
                        raw_chunks.append({
                            "id": f"{repo_prefix}doc:README.md#{idx}",
                            "type": "doc",
                            "text": c_text,
                            "source_url": readme_data.get("html_url") or f"https://github.com/{owner}/{repo}#readme",
                            "author": owner,
                            "date": datetime.date.today(),
                            "raw_refs": [],
                            "files": ["README.md"],
                        })
    except Exception as e:
        print(f"[Warning] Failed fetching README: {e}")

    # 3. Fetch up to 100 commits (type="commit")
    if progress_callback:
        progress_callback("Fetching commit history (up to 100)...", 0, 100)
    try:
        r_commits = requests.get(f"{api_base}/commits?per_page=100", headers=headers, timeout=20)
        if r_commits.status_code in (403, 429):
            rate_limit_hit = True
            partial_note = "GitHub rate limit reached while fetching commits list."
        elif r_commits.status_code == 200:
            commit_list = r_commits.json()[:100]
            total_c = len(commit_list)
            # Concurrency/sequential fetch of details for files and stats (capped at first 25 detail queries or until rate limit)
            for idx, c in enumerate(commit_list, 1):
                sha = c.get("sha", "")
                sha10 = sha[:10]
                commit_meta = c.get("commit", {})
                message = commit_meta.get("message", "").strip()
                author = (c.get("author") or {}).get("login") or (commit_meta.get("author") or {}).get("name") or "Unknown"
                date_str = (commit_meta.get("author") or {}).get("date") or str(datetime.date.today())
                date_val = date_str[:10]
                source_url = c.get("html_url") or f"https://github.com/{owner}/{repo}/commit/{sha}"

                changed_files = []
                stats_line = ""

                # Query detailed commit stats for first 20 commits if rate limit permits
                if idx <= 20 and not rate_limit_hit:
                    try:
                        r_det = requests.get(f"{api_base}/commits/{sha}", headers=headers, timeout=8)
                        if r_det.status_code == 200:
                            det = r_det.json()
                            changed_files = [f.get("filename") for f in det.get("files", []) if f.get("filename")]
                            stats = det.get("stats", {})
                            if stats:
                                stats_line = f"Stats: {len(changed_files)} files changed (+{stats.get('additions', 0)} / -{stats.get('deletions', 0)})"
                        elif r_det.status_code in (403, 429):
                            rate_limit_hit = True
                            partial_note = "GitHub rate limit reached while fetching detailed commit file stats."
                    except Exception:
                        pass

                text_content = f"Commit {sha[:8]} by {author} on {date_val}: {message}"
                if stats_line:
                    text_content += f"\n{stats_line}"

                raw_chunks.append({
                    "id": f"{repo_prefix}commit:{sha10}",
                    "type": "commit",
                    "text": text_content,
                    "source_url": source_url,
                    "author": author,
                    "date": date_val,
                    "raw_refs": extract_issue_pr_refs(message),
                    "files": changed_files,
                })
                if progress_callback and (idx % 25 == 0 or idx == total_c):
                    progress_callback(f"Fetched {idx}/{total_c} commits...", idx, total_c)
    except Exception as e:
        print(f"[Warning] Commits fetch error: {e}")

    # 4. Fetch up to 50 issues and 50 pull requests
    if not rate_limit_hit:
        if progress_callback:
            progress_callback("Fetching issues and pull requests (up to 50 each)...", 0, 100)
        try:
            r_issues = requests.get(f"{api_base}/issues?state=all&per_page=100", headers=headers, timeout=20)
            if r_issues.status_code in (403, 429):
                rate_limit_hit = True
                partial_note = "GitHub rate limit reached while fetching issues/PRs."
            elif r_issues.status_code == 200:
                items = r_issues.json()
                issue_count = 0
                pr_count = 0
                for item in items:
                    is_pr = "pull_request" in item
                    if is_pr and pr_count >= 50:
                        continue
                    if not is_pr and issue_count >= 50:
                        continue

                    num = item.get("number")
                    title = item.get("title", "")
                    body = (item.get("body") or "").strip()
                    if len(body) > 1500:
                        body = body[:1500] + "... [truncated]"

                    labels = [l.get("name") for l in item.get("labels", []) if isinstance(l, dict) and l.get("name")]
                    label_str = f"Labels: {', '.join(labels)}\n" if labels else ""
                    author = (item.get("user") or {}).get("login") or "Unknown"
                    date_val = (item.get("created_at") or str(datetime.date.today()))[:10]
                    html_url = item.get("html_url") or f"https://github.com/{owner}/{repo}/issues/{num}"

                    # Fetch up to 5 comments for discussion context (if not rate-limited)
                    comments_text = ""
                    comments_url = item.get("comments_url")
                    if comments_url and not rate_limit_hit and (item.get("comments") or 0) > 0:
                        try:
                            r_comm = requests.get(f"{comments_url}?per_page=5", headers=headers, timeout=8)
                            if r_comm.status_code == 200:
                                comm_list = r_comm.json()
                                if comm_list:
                                    comm_strs = [f"- {c.get('user', {}).get('login', 'User')}: {c.get('body', '').strip()[:250]}" for c in comm_list]
                                    comments_text = "\nDiscussion:\n" + "\n".join(comm_strs)
                            elif r_comm.status_code in (403, 429):
                                rate_limit_hit = True
                                partial_note = "GitHub rate limit reached while fetching comment discussions."
                        except Exception:
                            pass

                    # Fetch changed files for PR if available
                    pr_files = []
                    if is_pr and not rate_limit_hit:
                        pr_count += 1
                        try:
                            r_pr_files = requests.get(f"{api_base}/pulls/{num}/files?per_page=20", headers=headers, timeout=8)
                            if r_pr_files.status_code == 200:
                                pr_files = [f.get("filename") for f in r_pr_files.json() if f.get("filename")]
                            elif r_pr_files.status_code in (403, 429):
                                rate_limit_hit = True
                                partial_note = "GitHub rate limit reached while fetching PR file changes."
                        except Exception:
                            pass

                        chunk_id = f"{repo_prefix}pr:{num}"
                        full_text = f"Pull Request #{num}: {title}\n{label_str}{body}{comments_text}"
                        c_type = "pr"
                    else:
                        issue_count += 1
                        chunk_id = f"{repo_prefix}issue:{num}"
                        full_text = f"Issue #{num}: {title}\n{label_str}{body}{comments_text}"
                        c_type = "issue"

                    raw_chunks.append({
                        "id": chunk_id,
                        "type": c_type,
                        "text": full_text,
                        "source_url": html_url,
                        "author": author,
                        "date": date_val,
                        "raw_refs": extract_issue_pr_refs(f"{title}\n{body}{comments_text}"),
                        "files": pr_files,
                    })
        except Exception as e:
            print(f"[Warning] Issues/PRs fetch error: {e}")

    if not raw_chunks:
        if rate_limit_hit:
            raise ValueError("GitHub API rate limit exceeded immediately. Please set GITHUB_TOKEN in your environment or wait for rate limit reset.")
        raise ValueError(f"No commits, issues, or pull requests found to index for repository {owner}/{repo}.")

    # 5. Resolve linked_ids ONLY to chunks that actually exist after ingestion; drop unresolved references
    existing_chunk_ids = {c["id"] for c in raw_chunks}
    for c in raw_chunks:
        resolved_linked = []
        for ref_num in c.get("raw_refs", []):
            target_issue = f"{repo_prefix}issue:{ref_num}"
            target_pr = f"{repo_prefix}pr:{ref_num}"
            if target_issue in existing_chunk_ids:
                resolved_linked.append(target_issue)
            if target_pr in existing_chunk_ids:
                resolved_linked.append(target_pr)
        c["linked_ids"] = list(set(resolved_linked))

    # 6. Delete all previous chunks for this repo prefix and upsert new chunks in a single DB transaction
    if progress_callback:
        progress_callback(f"Writing {len(raw_chunks)} items into vector database...", 0, len(raw_chunks))

    total_ingested = delete_and_upsert_chunks(repo_prefix, raw_chunks, progress_callback=progress_callback)

    status_str = "completed (partial)" if partial_note else "completed"
    return {
        "repository": f"{owner}/{repo}",
        "repo_prefix": repo_prefix,
        "status": status_str,
        "partial_note": partial_note,
        "chunks_ingested": total_ingested,
    }


def delete_chunks_by_prefix(prefix: str) -> int:
    """Delete all chunks whose id starts with the given prefix."""
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM chunks WHERE starts_with(id, %s);", (prefix,))
            deleted = cur.rowcount
            conn.commit()
            return deleted
