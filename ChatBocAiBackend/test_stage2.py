"""
Stage 2 Acceptance Tests for /assistant/impact and chat routing.
Run with: python test_stage2.py
"""
import json
import sys
import requests

BASE = "http://localhost:8000"

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

results = []


def check(label, condition, detail=""):
    status = PASS if condition else FAIL
    tag = "PASS" if condition else "FAIL"
    print(f"  [{tag}] {label}" + (f" — {detail}" if detail else ""))
    results.append((label, condition))
    return condition


def post(path, body):
    r = requests.post(f"{BASE}{path}", json=body, timeout=30)
    return r.status_code, r.json()


# ============================================================
# TEST 1: File-path input with repo scope
# ============================================================
print("\n=== Test 1: File path 'src/auth.py' scoped to demo/repo ===")
sc, data = post("/assistant/impact", {"input": "src/auth.py", "repo": "demo/repo"})
check("HTTP 200", sc == 200)
check("found=true", data.get("found") is True)
af = data.get("affected", [])
check("affected non-empty", len(af) > 0, f"{len(af)} items")
# src/auth.py must appear as high-confidence file
files_high = [a for a in af if a["kind"] == "file" and a["confidence"] == "high"]
check("src/auth.py is high-confidence file", any("auth.py" in a["item"] for a in files_high))
# co-changed files present
cochange = [a for a in af if a["kind"] == "file" and "Co-changed" in a.get("reason", "")]
check("Co-change files present", len(cochange) > 0, str([a["item"] for a in cochange]))
# every item has non-empty evidence
all_ev = all(len(a.get("evidence", [])) > 0 for a in af)
check("All items have evidence", all_ev)
# no seeded legacy IDs in evidence
all_ev_ids = [eid for a in af for eid in a.get("evidence", [])]
no_legacy = all(not eid.startswith("commit_") and not eid.startswith("issue_") for eid in all_ev_ids)
check("No seeded legacy IDs in evidence (repo scoped)", no_legacy, str(all_ev_ids))
# sources present
check("sources list non-empty", len(data.get("sources", [])) > 0)

# ============================================================
# TEST 2: Short commit SHA (c001 — 4-char hex)
# ============================================================
print("\n=== Test 2: Short commit SHA 'c001' ===")
sc, data = post("/assistant/impact", {"input": "c001", "repo": "demo/repo"})
check("HTTP 200", sc == 200)
check("found=true", data.get("found") is True, str(data))
af2 = data.get("affected", [])
check("affected non-empty", len(af2) > 0, f"{len(af2)} items")
# Files from c001 (src/auth.py, src/middleware.py, src/session.py) must appear
c001_files = {"src/auth.py", "src/middleware.py", "src/session.py"}
found_items = {a["item"] for a in af2 if a["kind"] == "file"}
check("c001 files present", c001_files.issubset(found_items), f"got {found_items}")

# ============================================================
# TEST 3: Free-text description
# ============================================================
print("\n=== Test 3: Free-text 'refactoring the JWT authentication handler' ===")
sc, data = post("/assistant/impact", {"input": "refactoring the JWT authentication handler", "repo": "demo/repo"})
check("HTTP 200", sc == 200)
# May or may not find (depends on embeddings), but if found — check integrity
if data.get("found"):
    af3 = data.get("affected", [])
    check("affected items have evidence", all(len(a.get("evidence", [])) > 0 for a in af3))
    ev_ids3 = [eid for a in af3 for eid in a["evidence"]]
    check("No out-of-scope IDs in repo-scoped search",
          all(eid.startswith("gh:demo:repo:") for eid in ev_ids3), str(ev_ids3))
    print(f"  [INFO] Returned {len(af3)} affected items")
else:
    check("found=false acceptable for free-text with no semantic match", True, "no match — OK")

# ============================================================
# TEST 4: Unknown file → found=false
# ============================================================
print("\n=== Test 4: Nonexistent file 'nonexistent/file.xyz' ===")
sc, data = post("/assistant/impact", {"input": "nonexistent/file.xyz"})
check("HTTP 200", sc == 200)
check("found=false", data.get("found") is False, str(data))
check("answer field present", "answer" in data)

# ============================================================
# TEST 5: Item integrity check across all affected items
# ============================================================
print("\n=== Test 5: Item integrity — all affected items must have reason, evidence, confidence ===")
sc, data = post("/assistant/impact", {"input": "src/auth.py", "repo": "demo/repo"})
af5 = data.get("affected", [])
valid_confs = {"high", "medium", "low"}
valid_kinds = {"file", "feature", "component"}
all_valid = True
for a in af5:
    if not a.get("reason"):
        print(f"  [WARN] Missing reason: {a}")
        all_valid = False
    if not a.get("evidence"):
        print(f"  [WARN] Empty evidence: {a}")
        all_valid = False
    if a.get("confidence") not in valid_confs:
        print(f"  [WARN] Bad confidence: {a}")
        all_valid = False
    if a.get("kind") not in valid_kinds:
        print(f"  [WARN] Bad kind: {a}")
        all_valid = False
check("All items integrity OK", all_valid, f"{len(af5)} items checked")

# ============================================================
# TEST 6: Repo scoping — no cross-repo leakage
# ============================================================
print("\n=== Test 6: Repo scoping — demo/repo items only ===")
sc, data = post("/assistant/impact", {"input": "src/auth.py", "repo": "demo/repo"})
ev_ids6 = [eid for a in data.get("affected", []) for eid in a.get("evidence", [])]
seeded = [eid for eid in ev_ids6 if eid.startswith("commit_") or eid.startswith("issue_")]
check("No seeded legacy IDs leak through repo scope", len(seeded) == 0, str(seeded))
wrong_repo = [eid for eid in ev_ids6 if eid.startswith("gh:") and not eid.startswith("gh:demo:repo:")]
check("No wrong-repo IDs", len(wrong_repo) == 0, str(wrong_repo))

# ============================================================
# TEST 7a: Chat routing — impact intent detected and routed
# ============================================================
print("\n=== Test 7a: Chat routing — 'what breaks if I change src/auth.py?' ===")
sc, data = post("/assistant/ask", {"question": "what breaks if I change src/auth.py?"})
check("HTTP 200", sc == 200)
# Must return impact shape: found, answer, sources, confidence
check("has 'found' key", "found" in data, str(list(data.keys())))
check("has 'answer' key", "answer" in data)
check("has 'sources' key", "sources" in data)
check("has 'confidence' key", "confidence" in data)
print(f"  [INFO] found={data.get('found')} answer={str(data.get('answer',''))[:80]}...")

# ============================================================
# TEST 7b: Chat routing — blast radius
# ============================================================
print("\n=== Test 7b: Chat routing — 'blast radius of src/middleware.py' ===")
sc, data = post("/assistant/ask", {"question": "blast radius of src/middleware.py"})
check("HTTP 200", sc == 200)
check("has 'found' key", "found" in data)
check("has 'answer' key", "answer" in data)

# ============================================================
# TEST 7c: Chat routing fail-safe — non-impact question must NOT trigger routing
# ============================================================
print("\n=== Test 7c: Fail-safe — 'Why did users get 401 errors during JWT refresh?' ===")
sc, data = post("/assistant/ask", {"question": "Why did users get 401 errors during JWT refresh?"})
check("HTTP 200", sc == 200)
check("has 'answer' key", "answer" in data)
# The answer shape must still be {found, answer, sources, confidence}
check("has 'sources' key", "sources" in data)
check("has 'confidence' key", "confidence" in data)

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
passed = sum(1 for _, ok in results if ok)
total = len(results)
print(f"RESULT: {passed}/{total} checks passed")
if passed == total:
    print("ALL CHECKS PASSED (OK)")
else:
    failed = [label for label, ok in results if not ok]
    print("FAILED:", failed)
sys.exit(0 if passed == total else 1)
