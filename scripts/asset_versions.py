"""Keep local HTML script and stylesheet references tied to their file contents."""

import argparse
import hashlib
import html
from pathlib import Path
import re
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit, urlunsplit


TAG = re.compile(r"<(?:script|link)\b[^>]*>", re.IGNORECASE)
URL = re.compile(r"\b(?:src|href)\s*=\s*([\"'])([^\"']+)\1", re.IGNORECASE)


def sync_assets(app_dir, write=False):
    app_dir = Path(app_dir).resolve()
    versions = {}
    updates = []
    errors = []
    references = 0

    for page in sorted(app_dir.rglob("*.html")):
        source = page.read_text(encoding="utf-8")

        def update_tag(tag):
            def update_url(match):
                nonlocal references
                original = match[2]
                url = urlsplit(html.unescape(original))
                if url.scheme or url.netloc or Path(url.path).suffix not in {".css", ".js"}:
                    return match[0]
                references += 1
                asset = (app_dir / unquote(url.path).lstrip("/") if url.path.startswith("/")
                         else page.parent / unquote(url.path)).resolve()
                if not asset.is_relative_to(app_dir) or not asset.is_file():
                    errors.append(f"{page.relative_to(app_dir)}: missing local asset {url.path}")
                    return match[0]
                if asset not in versions:
                    versions[asset] = "sha256-" + hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
                query = [(key, value) for key, value in parse_qsl(url.query, keep_blank_values=True)
                         if key != "v"]
                query.append(("v", versions[asset]))
                versioned = urlunsplit(("", "", url.path, urlencode(query), url.fragment))
                replacement = html.escape(versioned, quote=False)
                return match[0][:match.start(2) - match.start()] + replacement + match[1]

            return URL.sub(update_url, tag[0])

        updated = TAG.sub(update_tag, source)
        if updated != source:
            updates.append((page, updated))

    if errors:
        raise ValueError("\n".join(errors))
    if updates and not write:
        raise ValueError("Stale asset references; run python3 scripts/asset_versions.py --write:\n"
                         + "\n".join(str(page.relative_to(app_dir)) for page, _ in updates))
    for page, updated in updates:
        page.write_text(updated, encoding="utf-8")
    return references, len(updates)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Update references instead of checking only")
    args = parser.parse_args()
    try:
        references, pages = sync_assets(Path(__file__).resolve().parents[1] / "app", args.write)
    except ValueError as error:
        parser.exit(1, f"{error}\n")
    print(f"Checked {references} local asset references; updated {pages} pages.")
