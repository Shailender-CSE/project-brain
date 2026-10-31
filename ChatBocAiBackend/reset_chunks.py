#!/usr/bin/env python3
"""
Reset utility to delete all chunks for a given repo prefix or upload prefix.
Usage:
    python reset_chunks.py gh:owner:repo:
    python reset_chunks.py upload:filename#
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

from knowledge_ingest import delete_chunks_by_prefix

def main():
    if len(sys.argv) < 2:
        print("Usage: python reset_chunks.py <prefix>")
        print("Example: python reset_chunks.py gh:octocat:Hello-World:")
        print("Example: python reset_chunks.py upload:my_doc.md#")
        sys.exit(1)

    prefix = sys.argv[1].strip()
    print(f"Deleting chunks starting with prefix: '{prefix}'...")
    deleted = delete_chunks_by_prefix(prefix)
    print(f"Successfully deleted {deleted} chunk(s).")

if __name__ == "__main__":
    main()
