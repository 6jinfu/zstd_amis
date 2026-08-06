#!/usr/bin/env python3
# 人才发展系统原型 · no-cache 开发服务器
# 用法：python3 serve.py   （默认 8765 端口，服务 app/ 目录，禁用浏览器缓存）
import http.server, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
APP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
os.chdir(APP_DIR)

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

print(f'serving {APP_DIR} at http://localhost:{PORT} (no-cache)')
http.server.test(HandlerClass=NoCacheHandler, port=PORT)
