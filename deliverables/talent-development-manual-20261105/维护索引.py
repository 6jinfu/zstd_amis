"""只读查询本套手册的状态、图号及未同步图片。"""

import argparse
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
mode = parser.add_mutually_exclusive_group()
mode.add_argument("--figure", nargs="+", help="图号或图片文件名，可输入多个")
mode.add_argument("--changed", action="store_true", help="列出与飞书同步基线不同的图片")
args = parser.parse_args()

if args.figure or args.changed:
    items = json.loads((root / "核对记录/配图元数据.json").read_text())
    if args.figure:
        result = [i for i in items if i["figure"] in args.figure or i["file"] in args.figure]
    else:
        result = []
        for item in items:
            path = root / "图片和附件" / item["file"]
            digest = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
            if digest != item.get("cloud_synced_sha256"):
                result.append({"figure": item["figure"], "file": item["file"], "status": "changed" if path.exists() else "missing"})
        known = {i["file"] for i in items}
        result.extend({"file": p.name, "status": "unindexed"} for p in (root / "图片和附件").glob("*.jpg") if p.name not in known)
else:
    result = json.loads((root / "维护状态.json").read_text())

print(json.dumps(result, ensure_ascii=False, indent=2))
