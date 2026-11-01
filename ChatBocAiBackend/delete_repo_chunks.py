#!/usr/bin/env python3
"""
Quick utility script to reset / delete demo chunks from PostgreSQL by repository prefix or filename.
Usage:
    python delete_repo_chunks.py gh_owner_repo
    python delete_repo_chunks.py my_document.md
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

from ingest import delete_chunks_by_prefix

def main():
    if len(sys.argv) < 2:
        print("Usage: python delete_repo_chunks.py <prefix_or_filename>")
        print("Example: python delete_repo_chunks.py gh_facebook_react")
        sys.exit(1)

    prefix = sys.argv[1].strip()
    print(f"Deleting chunks matching prefix '{prefix}'...")
    deleted = delete_chunks_by_prefix(prefix)
    print(f"Done. Successfully deleted {deleted} chunk(s).")

if __name__ == "__main__":
    main()
