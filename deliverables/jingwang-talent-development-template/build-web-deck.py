from pathlib import Path
import base64
import json
import re


HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "jingwang-talent-development-deck" / "index.html"
SLIDES = (HERE / "slides.html").read_text(encoding="utf-8").strip()
HTML = SOURCE.read_text(encoding="utf-8")

ids = re.findall(r'data-slide-id="([^"]+)"', SLIDES)
assert len(ids) == len(set(ids)) == 16, ids

start = HTML.index('<section class="slide accent"', HTML.index('<div id="deck">'))
end = HTML.index('\n</div>\n\n\n<div id="nav">', start)
HTML = HTML[:start] + SLIDES + HTML[end:]

notes = [
    ("cover", "封面", "填写演示主题与讲者信息", "平台全景"),
    ("platform-overview", "平台全景", "填写业务链与总体结论", "章节开场"),
    ("section-statement", "章节幕封", "填写本章核心判断", "业务问题"),
    ("business-questions", "业务问题", "填写客户最关心的三个问题", "核心流程"),
    ("business-journey", "核心流程", "填写六步业务过程", "能力结构"),
    ("capability-layers", "能力结构", "填写三层能力或产品结构", "方法对照"),
    ("method-compare", "方法对照", "填写两种方法的分工", "关键数据"),
    ("data-hero", "关键数据", "填写有来源的指标与口径", "案例封面"),
    ("case-cover", "案例封面", "填写真实案例名称与主图", "案例路径"),
    ("case-journey", "案例路径", "填写背景、动作、交付与结果", "案例证据"),
    ("case-evidence", "案例证据", "替换两张真实截图并说明证明点", "案例成效"),
    ("case-results", "案例成效", "填写可核验的成果及统计口径", "规划总览"),
    ("roadmap-overview", "规划总览", "填写三个阶段的目标、交付与依赖", "规划矩阵"),
    ("roadmap-matrix", "规划矩阵", "填写六项未来能力及用户价值", "重点规划"),
    ("roadmap-spotlight", "重点规划", "填写一项能力的目标与里程碑", "收束讨论"),
    ("closing", "收束讨论", "填写结论与三个待讨论事项", "演示结束"),
]
assert [record[0] for record in notes] == ids
speaker_notes = [
    {
        "id": slide_id,
        "title": title,
        "section": "填写提示",
        "purpose": purpose,
        "talk": ["此页为可替换模板。", purpose + "。", "正式演示前删去占位符并核实资料来源。"],
        "transition": transition,
    }
    for slide_id, title, purpose, transition in notes
]
notes_js = "const SPEAKER_NOTES = " + json.dumps(speaker_notes, ensure_ascii=False, indent=2) + ";\nwindow.__SPEAKER_NOTES__ = SPEAKER_NOTES;"
notes_start = HTML.index('const SPEAKER_NOTES = [')
notes_end = HTML.index('window.__SPEAKER_NOTES__ = SPEAKER_NOTES;', notes_start) + len('window.__SPEAKER_NOTES__ = SPEAKER_NOTES;')
HTML = HTML[:notes_start] + notes_js + HTML[notes_end:]
HTML = HTML.replace('景旺电子人才发展 · 设计思路与平台演示', '景旺电子人才发展 · 演示模板')
HTML = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\n', '', HTML)
HTML = re.sub(r'<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\n', '', HTML)
HTML = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?[^\n]+\n', '', HTML)
HTML = HTML.replace('<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>\n<script>lucide.createIcons();</script>\n', '')
motion_path = HERE.parent / "jingwang-talent-development-deck" / "assets" / "motion.min.js"
motion_uri = 'data:text/javascript;base64,' + base64.b64encode(motion_path.read_bytes()).decode('ascii')
HTML = HTML.replace("await import('./assets/motion.min.js')", "await import('" + motion_uri + "')")
HTML = HTML.replace("""} catch(e1) {
  try {
    motion = await import('https://cdn.jsdelivr.net/npm/motion@11.11.17/+esm');
  } catch(e2) {
    console.warn('[motion] local + CDN both failed, disabling animations', e1, e2);
    document.querySelectorAll('[data-anim]').forEach(el=>{el.style.opacity='1';el.style.transform='none'});
  }
}""", """} catch(e) {
  console.warn('[motion] embedded module unavailable, disabling animations', e);
  document.querySelectorAll('[data-anim]').forEach(el=>{el.style.opacity='1';el.style.transform='none'});
}""")
(HERE / "index.html").write_text(HTML, encoding="utf-8")
print(f"Built {HERE / 'index.html'} with {len(ids)} slides and speaker notes")
