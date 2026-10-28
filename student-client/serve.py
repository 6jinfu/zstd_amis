from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(description="人才发展学员端本地预览")
parser.add_argument("--port", type=int, default=4181)
args = parser.parse_args()
root = Path(__file__).resolve().parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
with ThreadingHTTPServer(("0.0.0.0", args.port), handler) as server:
    print(f"Web 端：http://127.0.0.1:{args.port}/student.html", flush=True)
    print(f"移动端：http://127.0.0.1:{args.port}/mobile/index.html", flush=True)
    print("已开放局域网访问，可将127.0.0.1替换为本机局域网IP", flush=True)
    print("按 Ctrl+C 停止服务", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
