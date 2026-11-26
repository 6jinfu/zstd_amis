import contextlib
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import socket

parser = argparse.ArgumentParser(description="人才发展学员端本地预览")
parser.add_argument("--port", type=int, default=4181)
args = parser.parse_args()
root = Path(__file__).resolve().parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root))

class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6 if socket.has_ipv6 else socket.AF_INET
    def server_bind(self):
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()

bind_host = "::" if socket.has_ipv6 else "0.0.0.0"
with DualStackServer((bind_host, args.port), handler) as server:
    print(f"Web 端：http://localhost:{args.port}/student.html", flush=True)
    print(f"移动端：http://localhost:{args.port}/mobile/index.html", flush=True)
    print("已开放局域网访问，可将localhost替换为本机局域网IP", flush=True)
    print("按 Ctrl+C 停止服务", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
