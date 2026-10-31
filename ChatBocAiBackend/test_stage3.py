"""
Stage 3 Acceptance Tests: /assistant/knowledge-risk and /assistant/repo-stats
Run with: python test_stage3.py
"""
import json
import sys
import requests
import psycopg

BASE = "http://localhost:8000"
DB_URI = "postgresql://postgres:postgres@localhost:5432/postgres"

results = []


def check(label, condition, detail=""):
    tag = "PASS" if condition else "FAIL"
    print(f"  [{tag}] {label}" + (f" -- {detail}" if detail else ""))
    results.append((label, condition))
    return condition


def get(path, params=None):
    r = requests.get(f"{BASE}{path}", params=params, timeout=15)
    return r.status_code, r.json()


def sql(query, params=()):
    conn = psycopg.connect(DB_URI)
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()
    return rows


# ============================================================
# TEST 1: Manual SQL cross-checks for 3 files (demo/repo scope)
# ============================================================
print("\n=== Test 1: Manual SQL cross-checks vs endpoint (demo/repo) ===")

# SQL truth for demo/repo (commits <=30 files, non-bot, non-null authors)
sql_results = sql("""
WITH valid AS (
    SELECT id, unnest(files) AS file, lower(trim(author)) AS author_clean, date
    FROM chunks
    WHERE type = 'commit'
      AND starts_with(id, 'gh:demo:repo:')
      AND array_length(files, 1) <= 30
      AND author IS NOT NULL
      AND lower(author) NOT SIMILAR TO %(pat)s
)
SELECT
    file,
    min(author_clean)              AS sole_author,
    count(*)                       AS commit_count,
    array_agg(DISTINCT author_clean) AS all_authors
FROM valid
GROUP BY file
ORDER BY file;
""", {"pat": "%(bot|dependabot|renovate|github-actions)%"})

# Build a dict keyed by file name
sql_map = {r[0]: {"sole_author": r[1], "commit_count": int(r[2]), "authors": r[3]} for r in sql_results}

print(f"\n  [INFO] SQL truth (demo/repo, all files, sole and multi-author):")
for f, d in sql_map.items():
    print(f"         {f}: authors={d['authors']}, commits={d['commit_count']}")

# Hit the endpoint
sc, data = get("/assistant/knowledge-risk", {"repo": "demo/repo"})
check("HTTP 200", sc == 200, str(sc))
check("found=true", data.get("found") is True, str(data.get("found")))

endpoint_files = {f["file"]: f for f in data.get("files", [])}

# SQL says these files have exactly 1 author in demo/repo:
# src/logger.py -> bob, 1 commit
# src/cache.py  -> charlie, 1 commit
# (src/auth.py, src/middleware.py, src/session.py all have 2 authors -> excluded)

cross_check_targets = [
    ("src/logger.py", "bob", 1),
    ("src/cache.py",  "charlie", 1),
]

for file, expected_author, expected_commits in cross_check_targets:
    sql_truth = sql_map.get(file, {})
    in_endpoint = file in endpoint_files
    ep_data = endpoint_files.get(file, {})
    print(f"\n  -- Cross-check: {file} --")
    print(f"     SQL:      authors={sql_truth.get('authors')}, commits={sql_truth.get('commit_count')}")
    print(f"     Endpoint: sole_author={ep_data.get('sole_author')}, commits={ep_data.get('commits')}")
    check(f"{file}: appears in endpoint (sole author confirmed)", in_endpoint)
    if in_endpoint:
        check(f"{file}: sole_author matches SQL", ep_data.get("sole_author") == expected_author,
              f"got '{ep_data.get('sole_author')}' expected '{expected_author}'")
        check(f"{file}: commit count matches SQL", ep_data.get("commits") == expected_commits,
              f"got {ep_data.get('commits')} expected {expected_commits}")

# Verify multi-author files are NOT in endpoint (SQL shows 2 authors)
multi_author = ["src/auth.py", "src/middleware.py", "src/session.py"]
for file in multi_author:
    check(f"Multi-author file NOT in endpoint: {file}", file not in endpoint_files)

# ============================================================
# TEST 2: Multi-author files never appear
# ============================================================
print("\n=== Test 2: All endpoint files have exactly 1 author string ===")
for file, fd in endpoint_files.items():
    check(f"{file}: sole_author is a non-empty string", isinstance(fd.get("sole_author"), str) and fd["sole_author"] != "")

# ============================================================
# TEST 3: Bot / generated files do not appear
# ============================================================
print("\n=== Test 3: No bot or generated files in results ===")
# Seed a bogus generated file check via patterns
GENERATED_SUFFIXES = (".min.js", ".min.css", ".map", ".lock", ".pyc", ".snap")
GENERATED_SEGMENTS = {"dist", "build", "node_modules", "vendor", ".next", "out",
                      "coverage", "__pycache__", ".venv"}
GENERATED_EXACT = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock",
                   "go.sum", "cargo.lock", "composer.lock", "gemfile.lock"}

def is_generated(path):
    import os
    p = path.replace("\\", "/")
    segs = [s for s in p.split("/") if s]
    bn = segs[-1].lower() if segs else path.lower()
    if bn in GENERATED_EXACT:
        return True
    for suf in GENERATED_SUFFIXES:
        if bn.endswith(suf):
            return True
    for seg in segs:
        if seg.lower() in GENERATED_SEGMENTS:
            return True
    return False

sc2, data2 = get("/assistant/knowledge-risk")  # no repo — all data
all_files_no_repo = data2.get("files", [])
generated_found = [f["file"] for f in all_files_no_repo if is_generated(f["file"])]
check("No generated files in results (no-repo)", len(generated_found) == 0, str(generated_found))

# ============================================================
# TEST 4: Repo scoping correct
# ============================================================
print("\n=== Test 4: Repo scoping -- demo/repo excludes seeded legacy chunks ===")
sc3, data3 = get("/assistant/knowledge-risk", {"repo": "demo/repo"})
ev_ids = [eid for f in data3.get("files", []) for eid in f.get("evidence", [])]
seeded_leak = [eid for eid in ev_ids if not eid.startswith("gh:demo:repo:")]
check("No non-demo evidence IDs when repo=demo/repo", len(seeded_leak) == 0, str(seeded_leak))

print("\n=== Test 4b: No-repo query includes seeded data without errors ===")
sc4, data4 = get("/assistant/knowledge-risk")
check("HTTP 200 (no repo param)", sc4 == 200)
check("found field present", "found" in data4)
# src/db.py from seeded chunk commit_d4e5f6 (Charlie, 1 commit) should appear
all_no_repo_files = {f["file"] for f in data4.get("files", [])}
check("src/db.py present in no-repo results (seeded chunk)", "src/db.py" in all_no_repo_files,
      f"got {all_no_repo_files}")

# ============================================================
# TEST 5: Bogus repo returns found:false
# ============================================================
print("\n=== Test 5: Nonexistent repo returns found:false ===")
sc5, data5 = get("/assistant/knowledge-risk", {"repo": "nobody/nonexistent-repo-xyz"})
check("HTTP 200", sc5 == 200)
check("found=false for unknown repo", data5.get("found") is False, str(data5))

# ============================================================
# TEST 6: history_window + note always present in successful response
# ============================================================
print("\n=== Test 6: history_window and note always present ===")
sc6, data6 = get("/assistant/knowledge-risk", {"repo": "demo/repo"})
check("history_window present", "history_window" in data6, str(list(data6.keys())))
check("history_window.commits_analyzed is int", isinstance(data6.get("history_window", {}).get("commits_analyzed"), int))
check("history_window.first_date present", data6.get("history_window", {}).get("first_date") is not None)
check("history_window.last_date present", data6.get("history_window", {}).get("last_date") is not None)
check("note present", "note" in data6 and data6["note"])
check("bus_factor_note present", "bus_factor_note" in data6 and data6["bus_factor_note"])

# ============================================================
# TEST 6b: repo-stats endpoint
# ============================================================
print("\n=== Test 6b: /assistant/repo-stats (demo/repo) ===")
sc7, data7 = get("/assistant/repo-stats", {"repo": "demo/repo"})
check("HTTP 200", sc7 == 200)
check("found=true", data7.get("found") is True, str(data7))
check("counts.commits > 0", data7.get("counts", {}).get("commits", 0) > 0)
check("date_range present", "date_range" in data7)
check("distinct_authors is int", isinstance(data7.get("distinct_authors"), int))
check("top_authors list", isinstance(data7.get("top_authors"), list))
print(f"  [INFO] repo-stats: {json.dumps(data7, indent=4)}")

print("\n=== Test 6c: /assistant/repo-stats bogus repo returns found:false ===")
sc8, data8 = get("/assistant/repo-stats", {"repo": "nobody/nonexistent-xyz"})
check("HTTP 200", sc8 == 200)
check("found=false", data8.get("found") is False, str(data8))

# ============================================================
# TEST 7: Existing endpoints unchanged (test_stage2 subset)
# ============================================================
print("\n=== Test 7: Regression -- /assistant/impact and /assistant/ask unchanged ===")

import requests as req

# Impact
r = req.post(f"{BASE}/assistant/impact", json={"input": "src/auth.py", "repo": "demo/repo"}, timeout=15)
check("POST /assistant/impact HTTP 200", r.status_code == 200)
d = r.json()
check("/assistant/impact still has found+affected+sources", all(k in d for k in ["found", "affected", "sources"]))

# Ask shape unchanged
r2 = req.post(f"{BASE}/assistant/ask", json={"question": "What is the weather today?"}, timeout=15)
check("POST /assistant/ask HTTP 200", r2.status_code == 200)
d2 = r2.json()
check("/assistant/ask shape: found+answer+sources+confidence", all(k in d2 for k in ["found", "answer", "sources", "confidence"]))

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
passed = sum(1 for _, ok in results if ok)
total = len(results)
print(f"RESULT: {passed}/{total} checks passed")
if passed < total:
    failed = [label for label, ok in results if not ok]
    print("FAILED:", failed)
sys.exit(0 if passed == total else 1)
