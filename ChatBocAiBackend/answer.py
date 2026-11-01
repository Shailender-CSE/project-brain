import os
import re
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# Load environment variables from local .env or root
env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

from retrieve import retrieve, fetch_by_ids

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please set it in your .env file or environment.")
        _client = genai.Client(api_key=api_key)
    return _client

THRESHOLD = 0.55      # TUNE using your off-topic scores
NOT_FOUND = "I couldn't find this in the project history."

# ---- LLM call: swap this one function if you change provider ----

MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]

def llm(prompt: str) -> str:
    client = get_client()
    for model_name in MODELS:
        for attempt in range(2):
            try:
                print(f"gemini calling {model_name}...")
                resp = client.models.generate_content(model=model_name, contents=prompt)
                print(f"gemini {model_name} returned")
                if resp and resp.text:
                    return resp.text
            except Exception as e:
                print(f"LLM error with {model_name} (attempt {attempt+1}): {e}")
                time.sleep(1)
    raise RuntimeError("LLM failed with all fallback models")

# ------------------------------------------------------------------

def build_context(chunks):
    return "\n\n".join(f"[{c['id']}] ({c['type']}, {c['date']}) {c['text']}" for c in chunks)

def ask(question: str):
    hits = retrieve(question, k=6)

    # Safe response: nothing relevant found
    if not hits or hits[0]["score"] < THRESHOLD:
        return {"found": False, "answer": NOT_FOUND, "sources": [], "confidence": "none"}

    # Keep only reasonably relevant hits
    hits = [h for h in hits if h["score"] >= THRESHOLD - 0.1]

    # Pull in linked items (e.g. the issue behind a commit)
    have = {h["id"] for h in hits}
    linked = {i for h in hits for i in (h["linked_ids"] or [])} - have
    chunks = hits + fetch_by_ids(linked)

    prompt = f"""You are Project Brain, an assistant that explains why code was written.
Answer ONLY using the sources below. After each claim, cite the source id in square brackets, like [issue_101].
If the sources do not contain the answer, reply exactly: "{NOT_FOUND}"
Do not use outside knowledge. Keep the answer under 120 words.

SOURCES:
{build_context(chunks)}

QUESTION: {question}"""

    text = llm(prompt).strip()

    # Verify citations: every [id] must be a real retrieved chunk
    valid = {c["id"] for c in chunks}
    cited = set(re.findall(r"\[([^\[\]]+)\]", text))
    fake = cited - valid
    if fake:
        for f in fake:
            text = text.replace(f"[{f}]", "")   # strip invented citations

    if NOT_FOUND in text:
        return {"found": False, "answer": NOT_FOUND, "sources": [], "confidence": "none"}

    sources = [{"id": c["id"], "type": c["type"], "url": c["source_url"],
                "snippet": c["text"][:200], "score": c["score"]}
               for c in chunks if c["id"] in cited & valid]

    top = hits[0]["score"]
    confidence = "high" if top >= 0.7 else "medium"
    return {"found": True, "answer": text, "sources": sources, "confidence": confidence}

if __name__ == "__main__":
    import json
    for q in ["Why did users get 401 unauthorized errors during JWT refresh?",
              "What is the weather today?"]:
        print("\nQ:", q)
        print(json.dumps(ask(q), indent=2, default=str))
