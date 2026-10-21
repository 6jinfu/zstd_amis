from pathlib import Path
import base64
import json
import re


HERE = Path(__file__).resolve().parent
SKILL = Path('/Users/jeff/.codex/skills/guizang-ppt-skill')
template = (SKILL / 'assets/template.html').read_text(encoding='utf-8')
slides = (HERE / 'slides.html').read_text(encoding='utf-8').strip()
ids = re.findall(r'data-slide-id="([^"]+)"', slides)
assert len(ids) == len(set(ids)) == 11, ids

# 配色沿用此前《景旺电子人才发展 · 介绍与演示》的瑞士风色板。
theme = {
    '--ink:#0a0a0b;': '--ink:#0a0a0a;',
    '--ink-rgb:10,10,11;': '--ink-rgb:10,10,10;',
    '--paper:#f1efea;': '--paper:#fafaf8;',
    '--paper-rgb:241,239,234;': '--paper-rgb:250,250,248;',
    '--paper-tint:#e8e5de;': '--paper-tint:#f0f0ee;',
    '--ink-tint:#18181a;': '--ink-tint:#18181a;',
}
for old, new in theme.items():
    assert old in template, old
    template = template.replace(old, new, 1)

css = """
  /* 景旺客户交流稿：保留 guizang 翻页与讲者功能，视觉收敛为纸面排版。 */
  :root{--serif-zh:"Songti SC","STSong",serif;--sans-zh:"PingFang SC","Hiragino Sans GB",sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
  canvas.bg{display:none!important}
  .slide.dark,.slide.hero.dark{background:#002fa7;color:#fff}
  .slide.dark.black{background:#0a0a0a}
  .slide.light.grey{background:#f0f0ee}
  .slide.dark::before,.slide.hero.dark::before,.slide.hero.dark::after{background:none;backdrop-filter:none}
  .slide.hero.light{background:var(--paper)}
  .slide.light .jd-label,.slide.light .jd-nb,.slide.light .jd-list-row span,.slide.light .jd-chain span,.slide.light .jd-five span,.slide.light .jd-three span,.slide.light .jd-steps span{color:#002fa7;opacity:1}
  .jd-label{font-family:var(--sans-zh);font-size:max(14px,.87vw);font-weight:600;letter-spacing:.1em;opacity:.64;margin:4vh 0 1.8vh}
  .jd-title{font-family:var(--serif-zh);font-size:min(4.2vw,7.4vh);line-height:1.18;letter-spacing:-.015em;font-weight:500}
  .jd-cover{font-family:var(--serif-zh);font-size:min(6.1vw,10.8vh);line-height:1.12;letter-spacing:-.015em;font-weight:500}
  .jd-subtitle{font-family:var(--serif-zh);font-size:min(2.15vw,3.8vh);line-height:1.26;font-weight:500}
  .jd-lead{font-family:var(--serif-zh);font-size:min(1.8vw,3.25vh);line-height:1.58;font-weight:400}
  .jd-body{font-family:var(--sans-zh);font-size:min(1.21vw,2.2vh);line-height:1.68;opacity:.8}
  .jd-small{font-size:min(1.05vw,1.9vh);line-height:1.6}
  .jd-nb{display:block;font-family:var(--serif-en);font-size:min(3.4vw,6vh);font-weight:400;line-height:1;margin-bottom:2.6vh}
  .jd-column{border-top:1px solid currentColor;padding-top:2.4vh}
  .jd-column .jd-body{max-width:32vw;margin-top:3vh}
  .jd-list{display:grid;grid-auto-rows:minmax(9vh,auto);align-content:start}
  .jd-list-row{display:grid;grid-template-columns:4vw 23vw 1fr;gap:1.4vw;align-items:center;border-top:1px solid currentColor}
  .jd-list-row:last-child{border-bottom:1px solid currentColor}
  .jd-list-row span{font-family:var(--serif-en);font-size:1.35vw;opacity:.55}
  .jd-list-row strong{font-family:var(--serif-zh);font-size:1.75vw;font-weight:500}
  .jd-list-row p{font-size:1.17vw;line-height:1.5;opacity:.78}
  .jd-chain{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:3vh 3vw;flex:1;max-height:50vh}
  .jd-chain>div{border-top:1px solid currentColor;padding-top:2vh;display:flex;flex-direction:column}
  .jd-chain span{font-family:var(--serif-en);font-size:1.3vw;opacity:.52}
  .jd-chain strong{font-family:var(--serif-zh);font-weight:500;font-size:1.75vw;margin-top:2.4vh}
  .jd-chain p{font-size:1.08vw;line-height:1.5;margin-top:1.4vh;opacity:.66}
  .jd-aside{border-top:1px solid currentColor;padding-top:2vh}
  .jd-aside strong{font-family:var(--serif-zh);font-size:1.55vw;font-weight:500}
  .jd-aside p{font-size:1.12vw;line-height:1.65;margin-top:1.5vh;opacity:.77}
  .jd-five{display:grid;grid-template-rows:repeat(5,1fr);max-height:51vh}
  .jd-five>div{display:grid;grid-template-columns:3.3vw 13vw 1fr;gap:1.3vw;align-items:center;border-top:1px solid currentColor}
  .jd-five>div:last-child{border-bottom:1px solid currentColor}
  .jd-five span{font-family:var(--serif-en);font-size:1.15vw;opacity:.52}
  .jd-five strong{font-family:var(--serif-zh);font-size:1.55vw;font-weight:500}
  .jd-five p{font-size:1.06vw;opacity:.75}
  .jd-duo{display:grid;grid-template-columns:1fr 1fr;gap:6vw}
  .jd-duo>div{border-top:1px solid currentColor;padding-top:2vh}
  .jd-question{font-family:var(--serif-zh);font-size:1.65vw;line-height:1.4;margin:4vh 0 2.3vh}
  .jd-duo .jd-body{max-width:36vw}
  .jd-three{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5vw}
  .jd-three>div{border-top:1px solid currentColor;padding-top:2vh}
  .jd-three span{font-family:var(--serif-en);font-size:1.3vw;opacity:.55}
  .jd-three h3{font-family:var(--serif-zh);font-size:1.85vw;font-weight:500;line-height:1.25;margin-top:3.4vh}
  .jd-three p{font-size:1.16vw;line-height:1.7;opacity:.78;margin-top:3vh}
  .jd-steps{display:grid;grid-template-rows:repeat(3,1fr);max-height:51vh}
  .jd-steps>div{display:grid;grid-template-columns:3.5vw 12vw 1fr;gap:1vw;align-items:center;border-top:1px solid currentColor}
  .jd-steps>div:last-child{border-bottom:1px solid currentColor}
  .jd-steps span{font-family:var(--serif-en);font-size:1.2vw;opacity:.55}
  .jd-steps strong{font-family:var(--serif-zh);font-size:1.62vw;font-weight:500}
  .jd-steps p{font-size:1.12vw;line-height:1.48;opacity:.78}
  .jd-demo{display:grid;grid-template-columns:repeat(3,1fr);gap:3.4vw;max-width:88vw}
  .jd-demo>div{border-top:1px solid currentColor;padding-top:2.1vh}
  .jd-demo span{font-family:var(--serif-en);font-size:1.25vw;opacity:.58}
  .jd-demo strong{font-family:var(--serif-zh);font-size:1.55vw;font-weight:500;display:block;margin-top:2vh}
  .jd-demo p{font-size:1.08vw;opacity:.7;margin-top:1.5vh}
"""
template = template.replace('</style>', css + '\n</style>', 1)
template = template.replace('[必填] 替换为 PPT 标题 · Deck Title', '景旺电子人才发展平台介绍')
template = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\n', '', template)
template = re.sub(r'<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\n', '', template)
template = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?[^\n]+\n', '', template)
template = template.replace('<!-- SLIDES_HERE -->', slides)

records = [
    ('cover','从人才标准走向人才发展','开场',.3,'说明先看平台全景，再看实际业务流程',['今天先简要介绍平台覆盖的工作，再进入现场操作。','演示以建立人才标准为主线，并看结果如何继续使用。'],'先说明今天的介绍顺序'),
    ('meeting-order','先看全局，再走一遍具体流程','介绍顺序',.35,'呼应客户希望先了解整体能力再看重点场景',['客户希望先有完整认识，再挑一项具体需求看如何操作。','PPT 讲业务关系，按钮和细节留到平台中展示。'],'先把平台范围说明白'),
    ('platform-map','人才发展平台覆盖哪些工作','平台全景',.55,'说明五个工作域及其关系',['人才标准、评鉴、发展、人才和系统设置组成一套工作环境。','这里不逐个讲菜单，只看哪些业务有承接。'],'进入实际业务顺序'),
    ('business-chain','从岗位要求到人才发展','业务主线',.55,'解释前后环节如何连接',['从组织岗位开始，建立标准后再做能力评价和人才盘点。','结果回到人才档案、岗位地图和学习方案，不停在评估报告里。'],'先看链条起点：人才标准'),
    ('standard','标准是后续工作的共同依据','人才标准',.55,'讲清标准的内容和适用范围',['标准可以独立维护，按岗位或人员条件确定适用范围。','能力指标会被评估与人才查看复用，具体内容由业务人员确认。'],'有了标准，接着看人的现状'),
    ('assessment','评估与盘点回答两个不同的问题','评鉴与盘点',.55,'区分个人能力评价与群体盘点',['360 评估汇集不同评价关系的反馈。','宫格盘点结合能力与绩效，业务和 HR 可以校准结果并留下过程。'],'结果形成后如何继续使用'),
    ('development','结果回到人，也回到岗位','结果应用',.5,'说明档案、岗位地图和学习方案',['人才档案放在一起看岗位要求、能力与盘点结果。','岗位地图给出发展方向，学习方案关联课程、项目及前后测；课程内容今天不展开。'],'下面说沿这条链的深化方向'),
    ('future-standard','人才标准支持 AI 帮建与整理','持续深化',.4,'讲标准建构中的 AI 应用',['AI 可以整理岗位材料，辅助形成标准草稿。','最终标准及适用范围由业务人员审核采用。'],'评鉴端也会增加方法'),
    ('future-assessment','评鉴手段继续丰富','持续深化',.45,'说明问卷、人才测评和考试规划',['评鉴中心会增加 AI 创建评估问卷。','还会纳入更多内置人才测评产品与考试，让人才识别有更多依据。'],'评鉴结果最终需要被人才中心使用'),
    ('future-talent','人才结果还要方便持续使用','持续深化',.45,'说明人才池、看板和档案规划',['人才池用于沉淀和跟踪重点人才。','人才看板提供组织视角，人才档案继续汇集个人结果与发展信息。'],'现在进入平台验证主线'),
    ('demo','现场建立一套标准，再看结果怎样使用','平台演示',.25,'切换到 10–15 分钟操作演示',['先建立标准，重点看内容和适用范围。','再看评鉴盘点结果，以及它们如何进入人才档案和发展安排。'],'切换到人才发展平台'),
]
assert [r[0] for r in records] == ids
third_cues = {
    'cover':'本次不展开课程资源和部署模式，留在后续交流。',
    'meeting-order':'AI 功能放在具体业务场景中介绍。',
    'platform-map':'系统设置属于支撑能力，现场简要带过。',
    'business-chain':'注意说清每一步的结果如何用于下一步。',
    'standard':'现场重点看能力要求与适用范围，不逐项念字段。',
    'assessment':'建议使用已结束的盘点项目展示结果和校准。',
    'development':'学习内容及课程资源本次只点到为止。',
    'future-standard':'具体材料范围与生成内容在实施中核对。',
    'future-assessment':'评鉴方法应与企业指标和人才场景对应。',
    'future-talent':'强调结果可持续查找和使用，而非一次项目结束就停留在报表里。',
    'demo':'优先走通标准建立，时间允许再展开盘点细节。',
}
notes = [{'id':i,'title':t,'section':sec,'minutes':mins,'purpose':purpose,'talk':talk+[third_cues[i]],'transition':transition} for i,t,sec,mins,purpose,talk,transition in records]
notes_js = 'const SPEAKER_NOTES = ' + json.dumps(notes,ensure_ascii=False,indent=2) + ';\nwindow.__SPEAKER_NOTES__ = SPEAKER_NOTES;'
start = template.index('const SPEAKER_NOTES = [')
end = template.index('window.__SPEAKER_NOTES__ = SPEAKER_NOTES;',start) + len('window.__SPEAKER_NOTES__ = SPEAKER_NOTES;')
template = template[:start] + notes_js + template[end:]
template = template.replace('<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>\n<script>lucide.createIcons();</script>\n','')
motion = (HERE.parent / 'jingwang-talent-development-deck/assets/motion.min.js').read_bytes()
data_uri = 'data:text/javascript;base64,' + base64.b64encode(motion).decode('ascii')
template = template.replace("await import('./assets/motion.min.js')", "await import('" + data_uri + "')")
template = template.replace("""} catch(e1) {
  try {
    motion = await import('https://cdn.jsdelivr.net/npm/motion@11.11.17/+esm');
  } catch(e2) {
    console.warn('[motion] local + CDN both failed, disabling animations', e1, e2);
    document.querySelectorAll('[data-anim]').forEach(el=>{el.style.opacity='1';el.style.transform='none'});
  }
}""", """} catch(e) {
  console.warn('[motion] embedded module unavailable', e);
  document.querySelectorAll('[data-anim]').forEach(el=>{el.style.opacity='1';el.style.transform='none'});
}""")
(HERE / 'index.html').write_text(template,encoding='utf-8')
print(f'Built {len(ids)} slides: {HERE / "index.html"}')
