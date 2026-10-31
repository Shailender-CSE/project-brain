from answer import ask

TESTS = [
    # (question, should_be_found, expected_source_id)
    ("Why did users get 401 errors during JWT refresh?", True, "issue_101"),
    ("What is the weather today?", False, None),
    ("What changed in the JWT token auth handler?"),
    ("How did we fix the database connection drops?"),
    ("Which file was modified to handle token refresh race conditions?"),
    ("What library or mechanism was added for database retries?"),
    ("Is there an issue tracking the JWT session drop?"),
    ("What middleware files are associated with the authentication fix?"),
    ("What is the weather today?"),
    ("Who won the recent cricket match?"),
    ("How do I configure Docker containers on Windows?")
    ("What is the company's vacation policy?"),
    ("Why did we switch from MySQL to PostgreSQL?")
]

passed = 0
for q, should_find, expected in TESTS:
    r = ask(q)
    ids = {s["id"] for s in r["sources"]}
    ok = (r["found"] == should_find) and (expected is None or expected in ids)
    passed += ok
    print("PASS" if ok else "FAIL", "|", q, "| found:", r["found"], "| sources:", ids)
print(f"\n{passed}/{len(TESTS)} passed")