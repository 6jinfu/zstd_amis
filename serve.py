#!/usr/bin/env python3
# 人才发展系统原型 · 开发服务器
# 用法：python3 serve.py   （默认 8766 端口；本地预览不缓存）
from functools import partial
import http.server
from pathlib import Path
import re
import socket
import subprocess
import sys

from scripts.asset_versions import sync_assets

class PrototypeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Mutable source files must never be served as immutable, even with an old ?v= URL.
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

HOST = '0.0.0.0'

def get_lan_ip():
    try:
        network_info = subprocess.check_output(['/sbin/ifconfig'], text=True)
        for block in re.split(r'(?m)(?=^[a-zA-Z0-9]+:)', network_info):
            interface = block.split(':', 1)[0]
            address = re.search(r'(?m)^\s+inet (\d+\.\d+\.\d+\.\d+) ', block)
            if interface.startswith('en') and 'status: active' in block and address:
                return address.group(1)
    except (OSError, subprocess.SubprocessError):
        pass

    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(('8.8.8.8', 80))
        return probe.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        probe.close()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    app_dir = Path(__file__).resolve().parent / 'app'
    references, pages = sync_assets(app_dir, write=True)
    print(f'assets: {references} references checked; {pages} pages updated', flush=True)
    print(f'serving {app_dir} at http://{get_lan_ip()}:{port} (LAN enabled; cache disabled)', flush=True)
    http.server.test(HandlerClass=partial(PrototypeHandler, directory=str(app_dir)), port=port, bind=HOST)
