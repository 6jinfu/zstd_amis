from pathlib import Path

here = Path(__file__).resolve().parent
source = here.parent / "talent-development-solution-deck" / "index.html"
html = source.read_text(encoding="utf-8")
slides = (here / "slides.html").read_text(encoding="utf-8").strip()
notes = (here / "speaker-notes.js").read_text(encoding="utf-8").strip()

start = html.index('<section class="slide accent"', html.index('<div id="deck">'))
end = html.index("\n</div>\n\n\n<div id=\"nav\">", start)
html = html[:start] + slides + html[end:]

start = html.index("const LEGACY_SPEAKER_NOTES")
end = html.index("window.__SPEAKER_NOTES__ = SPEAKER_NOTES;", start) + len("window.__SPEAKER_NOTES__ = SPEAKER_NOTES;")
html = html[:start] + notes + html[end:]
html = html.replace("<title>海格汽车人才发展方案 · 从岗位建模到人才发展</title>", "<title>景旺电子人才发展 · 设计思路与平台演示</title>")

assert "海格" not in html
assert html.count('data-slide-id=') == 9
(here / "index.html").write_text(html, encoding="utf-8")
