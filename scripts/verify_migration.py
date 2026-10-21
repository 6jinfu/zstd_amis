#!/usr/bin/env python3
"""Check a restored v2026.10.21-all workspace against its file manifest."""

import hashlib
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent.parent
    manifest = root / "deliverables/migration/v2026.10.21-all/manifest.json"
    entries = json.loads(manifest.read_text(encoding="utf-8"))["files"]
    failures = []
    for entry in entries:
        path = root / entry["path"]
        if not path.is_file():
            failures.append(f"Missing: {entry['path']} ({entry['archive']})")
            continue
        if path.stat().st_size != entry["bytes"]:
            failures.append(f"Size mismatch: {entry['path']}")
            continue
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(block)
        if digest.hexdigest() != entry["sha256"]:
            failures.append(f"SHA-256 mismatch: {entry['path']}")
    if failures:
        print(f"FAILED: {len(failures)} of {len(entries)} files.")
        print("\n".join(failures[:10]))
        return 1
    print(f"OK: {len(entries)} files verified (size and SHA-256).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
