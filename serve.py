#!/usr/bin/env python3
# 人才发展系统原型 · 开发服务器
# 用法：python3 serve.py   （默认 8766 端口；HTML 不缓存，带版本号的静态资源长缓存）
import http.server, os, re, socket, subprocess, sys
from urllib.parse import parse_qs, urlsplit

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
APP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
os.chdir(APP_DIR)

class PrototypeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        request_url = urlsplit(self.path)
        extension = os.path.splitext(request_url.path)[1].lower()
        is_versioned_asset = bool(parse_qs(request_url.query).get('v')) and extension in {
            '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2'
        }
        if is_versioned_asset:
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        else:
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

print(f'serving {APP_DIR} at http://{get_lan_ip()}:{PORT} (LAN enabled; HTML no-cache, versioned assets cached)')
http.server.test(HandlerClass=PrototypeHandler, port=PORT, bind=HOST)
