from functools import partial
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import unittest

from scripts.asset_versions import sync_assets
from serve import PrototypeHandler


class AssetVersionsTest(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.app = Path(self.temp.name)
        (self.app / "main.css").write_text("body { color: red; }")
        self.page = self.app / "index.html"
        self.page.write_text('<link rel="stylesheet" href="main.css?v=reused">')

    def test_stale_reference_fails_without_changing_page(self):
        original = self.page.read_text()
        with self.assertRaisesRegex(ValueError, "Stale asset references"):
            sync_assets(self.app)
        self.assertEqual(self.page.read_text(), original)

    def test_content_change_requires_a_new_version(self):
        sync_assets(self.app, write=True)
        first = self.page.read_text()
        self.assertEqual(sync_assets(self.app), (1, 0))
        (self.app / "main.css").write_text("body { color: blue; }")
        with self.assertRaisesRegex(ValueError, "Stale asset references"):
            sync_assets(self.app)
        sync_assets(self.app, write=True)
        self.assertNotEqual(self.page.read_text(), first)
        self.assertEqual(sync_assets(self.app, write=True), (1, 0))

    def test_missing_asset_prevents_partial_updates(self):
        missing = self.app / "missing.html"
        missing.write_text('<script src="absent.js"></script>')
        original = self.page.read_text()
        with self.assertRaisesRegex(ValueError, "missing local asset absent.js"):
            sync_assets(self.app, write=True)
        self.assertEqual(self.page.read_text(), original)

    def test_nested_and_root_references_preserve_other_url_parts(self):
        nested = self.app / "nested"
        nested.mkdir()
        page = nested / "frame.html"
        page.write_text('<link href="../main.css?theme=light&amp;v=old#font">'
                        '<link href="/main.css">'
                        '<script src="https://example.com/widget.js?v=vendor"></script>')
        sync_assets(self.app, write=True)
        content = page.read_text()
        self.assertIn("../main.css?theme=light&amp;v=sha256-", content)
        self.assertIn('#font"', content)
        self.assertIn('/main.css?v=sha256-', content)
        self.assertIn('https://example.com/widget.js?v=vendor', content)
        self.assertEqual(sync_assets(self.app), (3, 0))


class PreviewCacheTest(unittest.TestCase):
    def test_old_version_urls_never_receive_immutable_cache_headers(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "index.html").write_text("<h1>Preview</h1>")
            (root / "main.css").write_text("body { color: red; }")
            (root / "main.js").write_text("console.info('preview');")
            server = ThreadingHTTPServer(("127.0.0.1", 0), partial(PrototypeHandler, directory=folder))
            worker = Thread(target=server.serve_forever, daemon=True)
            worker.start()
            def request(path):
                connection = HTTPConnection("127.0.0.1", server.server_port, timeout=5)
                try:
                    connection.request("GET", path)
                    response = connection.getresponse()
                    return response.status, response.headers, response.read()
                finally:
                    connection.close()

            try:
                for path in ["/", "/main.css?v=reused", "/main.js?v=sha256-stale"]:
                    with self.subTest(path=path):
                        status, headers, _ = request(path)
                        self.assertEqual(status, 200)
                        self.assertIn("no-store", headers["Cache-Control"])
                        self.assertNotIn("immutable", headers["Cache-Control"])
                (root / "main.css").write_text("body { color: blue; }")
                _, _, content = request("/main.css?v=reused")
                self.assertIn(b"blue", content)
            finally:
                server.shutdown()
                server.server_close()
                worker.join()


if __name__ == "__main__":
    unittest.main()
