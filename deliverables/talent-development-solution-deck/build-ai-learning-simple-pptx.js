const path = require('node:path');
const pptxgen = require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const FONT = 'Hiragino Sans GB';
const pptx = new pptxgen();
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';
pptx.author = '时代光华';
pptx.company = '时代光华';
pptx.subject = '岗位画像、资料盘点、内容推荐与生成';
pptx.title = 'AI 岗位学习内容建设方案（简版）';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

const C = {
  paper: 'FAFAF8', white: 'FFFFFF', ink: '0A0A0A', dark: '171717',
  grey1: 'F0F0EE', grey2: 'D4D4D2', grey3: '737373', grey4: '525252',
  blue: '002FA7', pale: 'E8EDFF', cyan: '00A896', cyanPale: 'E4F5F1', orange: 'F15A24'
};
const W = 13.333, H = 7.5, M = 0.65, TOTAL = 7;

function rect(slide, x, y, w, h, fill, lineColor = fill, width = 0.5, radius = 0) {
  slide.addShape(radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x, y, w, h, fill: { color: fill },
    line: { color: lineColor, width, transparency: lineColor === fill ? 100 : 0 }
  });
}
function line(slide, x, y, w, h, color = C.grey2, width = 0.6, arrow = false, dash = 'solid') {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h, line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined }
  });
}
function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h, fontFace: FONT, fontSize: opts.fontSize || 16,
    color: opts.color || C.ink, bold: opts.bold || false,
    align: opts.align || 'left', valign: opts.valign || 'top',
    margin: opts.margin === undefined ? 0 : opts.margin,
    fit: opts.fit === null ? undefined : (opts.fit || 'shrink'),
    charSpacing: opts.charSpacing || 0, lang: 'zh-CN', isTextBox: true
  });
}
function meta(slide, value, x, y, w, opts = {}) {
  text(slide, value, x, y, w, 0.24, {
    fontSize: 8.5, color: opts.color || C.grey3, bold: true,
    charSpacing: 1.05, align: opts.align || 'left', valign: 'mid', fit: null
  });
}
function title(slide, value, x, y, w, h, opts = {}) {
  text(slide, value, x, y, w, h, { fontSize: opts.fontSize || 38, color: opts.color || C.ink, bold: opts.bold || false });
}
function chrome(slide, left, page, dark = false) {
  meta(slide, left, M, 0.42, 8.8, { color: dark ? 'B8B8B5' : C.grey3 });
  meta(slide, `${String(page).padStart(2, '0')} / ${TOTAL}`, W - 1.65, 0.42, 1, { color: dark ? 'B8B8B5' : C.grey3, align: 'right' });
}
function kicker(slide, value, color = C.grey3) { meta(slide, value, M, 0.96, 9.4, { color }); }
function pill(slide, value, x, y, w, fill = C.pale, color = C.blue) {
  rect(slide, x, y, w, 0.34, fill, fill, 0.5, 0.17);
  text(slide, value, x + 0.08, y + 0.07, w - 0.16, 0.19, { fontSize: 9.5, color, bold: true, align: 'center', valign: 'mid' });
}
function badge(slide, value, x, y, fill = C.blue) {
  rect(slide, x, y, 0.4, 0.4, fill, fill, 0.5, 0.2);
  text(slide, value, x, y + 0.02, 0.4, 0.28, { fontSize: 10.5, color: C.white, bold: true, align: 'center', valign: 'mid' });
}
function placeholder(slide, x, y, w, h, label, hint) {
  rect(slide, x, y, w, h, C.white, 'AEB4BD', 1.0);
  line(slide, x + 0.2, y + 0.2, w - 0.4, h - 0.4, 'C4C8CE', 0.55);
  line(slide, x + 0.2, y + h - 0.2, w - 0.4, -(h - 0.4), 'C4C8CE', 0.55);
  rect(slide, x + 0.28, y + h / 2 - 0.36, w - 0.56, 0.92, C.white);
  pill(slide, '产品截图占位', x + 0.22, y + 0.22, Math.min(1.55, w - 0.44), C.pale, C.blue);
  text(slide, label, x + 0.35, y + h / 2 - 0.28, w - 0.7, 0.38, { fontSize: 15.5, bold: true, align: 'center', valign: 'mid' });
  text(slide, hint, x + 0.35, y + h / 2 + 0.18, w - 0.7, 0.36, { fontSize: 9.8, color: C.grey3, align: 'center', valign: 'mid' });
}
function notes(slide, paragraphs, next) {
  slide.addNotes([...paragraphs, '', `接下来：${next}`].join('\n\n'));
}

// 01 · Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.blue };
  for (let i = 0; i < 11; i++) line(s, 7.8 + i * 0.46, 0, 0, H, 'FFFFFF', 0.22);
  for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) {
    rect(s, 8.45 + c * 0.43, 1.35 + r * 0.48, 0.055, 0.055, (r + c) % 4 === 0 ? C.cyan : C.white);
  }
  meta(s, 'AI 岗位学习内容建设 · 简版', M, 0.42, 7.2, { color: 'DCE4FF' });
  meta(s, '01 / 07', 11.62, 0.42, 1.08, { color: 'DCE4FF', align: 'right' });
  meta(s, '时代光华 · AI FOR LEARNING', M, 1.15, 6.0, { color: 'DCE4FF' });
  title(s, 'AI 驱动岗位学习\n内容建设', M, 1.72, 6.65, 1.75, { fontSize: 48, color: C.white });
  text(s, '岗位画像 → 资料盘点 → 内容推荐与生成', M, 4.25, 6.7, 0.42, { fontSize: 18.5, color: C.white, bold: true });
  line(s, M, 5.38, 12.03, 0, C.white, 0.55);
  text(s, '用平台应用把岗位标准、现有资料与学习内容连接起来。', M, 5.67, 9.5, 0.38, { fontSize: 15.5, color: C.white });
  meta(s, '简版介绍 · 环节拆解 / 平台适配 / 案例简述', M, 6.72, 7.2, { color: 'DCE4FF' });
  notes(s, ['这份简版只讲三个环节：岗位画像、资料盘点、内容推荐与生成。', '每个环节都对应现有平台应用，最后用两个案例快速说明。'], '先看三环节的整体关系');
}

// 02 · Three-step overview
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '01 · 三环节总览', 2);
  kicker(s, '从岗位要求出发，先盘清资料，再形成可用学习内容');
  title(s, '三个环节，形成一条\n岗位学习内容链路', M, 1.2, 6.2, 1.05, { fontSize: 35 });
  const steps = [
    ['01', '岗位画像', '明确关键任务、典型场景与能力要求', '输出：岗位训练蓝图'],
    ['02', '资料盘点', '收集、归类并判断现有资料是否可用', '输出：资料目录与缺口'],
    ['03', '内容推荐与生成', '推荐已有资源，并生成缺失内容', '输出：岗位学习内容']
  ];
  steps.forEach((v, i) => {
    const x = M + i * 4.05;
    rect(s, x, 2.75, 3.68, 2.9, i === 1 ? C.dark : (i === 2 ? C.blue : C.white), i === 0 ? C.grey2 : (i === 1 ? C.dark : C.blue), 0.7);
    badge(s, v[0], x + 0.24, 3.03, i === 1 ? C.cyan : C.blue);
    text(s, v[1], x + 0.24, 3.62, 3.15, 0.38, { fontSize: 20, color: i === 0 ? C.ink : C.white, bold: true });
    text(s, v[2], x + 0.24, 4.18, 3.15, 0.54, { fontSize: 11.2, color: i === 0 ? C.grey4 : 'D5D5D2' });
    meta(s, v[3], x + 0.24, 5.17, 3.12, { color: i === 0 ? C.blue : C.cyan });
    if (i < 2) line(s, x + 3.68, 4.2, 0.37, 0, C.cyan, 1.15, true);
  });
  rect(s, M, 6.12, 11.78, 0.53, C.grey1);
  text(s, '人才盘点结果与学习反馈持续回流，推动岗位画像和内容更新。', M + 0.2, 6.27, 8.4, 0.24, { fontSize: 11.7, color: C.grey4 });
  pill(s, '持续迭代', 10.9, 6.21, 1.28, C.cyanPale, C.cyan);
  notes(s, ['三环节是一条连续链路。岗位画像决定要学什么，资料盘点判断现有内容够不够，第三步完成推荐与生成。', '人才盘点和学习结果继续回流，让画像和内容不断更新。'], '拆解岗位画像及其与人才盘点的关系');
}

// 03 · Job profile and review
{
  const s = pptx.addSlide();
  s.background = { color: C.grey1 };
  chrome(s, '02 · 环节拆解 / 岗位画像', 3);
  kicker(s, '平台应用：人才发展 AI 建模 + 九宫格 / 人才图谱');
  title(s, '01 岗位画像：先建立\n岗位学习的统一标准', M, 1.18, 6.1, 1.0, { fontSize: 34 });
  const flow = [
    ['输入', '岗位说明书、访谈、流程制度'], ['AI 建模', '提取任务、场景与能力要求'], ['确认', '业务专家调整并形成岗位画像']
  ];
  flow.forEach((v, i) => {
    const y = 2.58 + i * 0.88;
    badge(s, `0${i + 1}`, M, y, i === 1 ? C.cyan : C.blue);
    text(s, v[0], M + 0.54, y - 0.01, 1.18, 0.28, { fontSize: 12.8, bold: true });
    text(s, v[1], M + 1.76, y, 3.82, 0.35, { fontSize: 11, color: C.grey4 });
    if (i < 2) line(s, M + 0.2, y + 0.48, 0, 0.4, C.cyan, 0.9, true);
  });
  rect(s, M, 5.43, 5.55, 0.95, C.white, C.grey2, 0.6);
  meta(s, '人才盘点与应用', M + 0.2, 5.65, 1.55, { color: C.blue });
  text(s, '九宫格与人才图谱识别群体及个人差距，反向确定学习重点。', M + 1.73, 5.58, 3.55, 0.46, { fontSize: 11.2, bold: true });
  placeholder(s, 6.55, 1.35, 6.13, 3.0, '人才发展 AI 建模', '替换为岗位画像建模或岗位标准页面');
  placeholder(s, 6.55, 4.62, 2.95, 1.82, '九宫格', '替换为人才盘点结果截图');
  placeholder(s, 9.73, 4.62, 2.95, 1.82, '人才图谱', '替换为人才图谱页面截图');
  notes(s, ['第一个环节使用人才发展 AI 建模。系统读取岗位材料，提取关键任务、典型场景和能力要求，再由业务专家确认。', '九宫格和人才图谱负责识别群体与个人差距，这些差距会成为后续内容推荐的重点。'], '看资料盘点以及内容推荐与生成如何承接');
}

// 04 · Inventory, recommendation, generation
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '03 · 环节拆解 / 资料与内容', 4);
  kicker(s, '平台应用：案例库 + 组织学习 / 个人发展计划 + AI 陪练 / AI 智课');
  title(s, '02–03 盘点已有资料，\n再推荐或生成内容', M, 1.18, 6.2, 1.0, { fontSize: 34 });
  const blocks = [
    ['02', '资料盘点', '案例库收集制度、案例、课程与经验资料，完成归类、标签和缺口识别。', C.dark, C.white],
    ['03A', '资源推荐', '组织学习推荐岗位共性内容；个人发展计划推荐个人差距内容。', C.blue, C.white],
    ['03B', '资源内生', 'AI 陪练生成情境练习；\nAI 智课将资料快速制作成课程。', C.cyanPale, C.ink]
  ];
  blocks.forEach((v, i) => {
    const x = M + i * 4.03;
    rect(s, x, 2.7, 3.66, 2.05, v[3], v[3], 0.5);
    meta(s, v[0], x + 0.22, 2.98, 0.72, { color: i === 2 ? C.cyan : (i === 1 ? C.cyan : 'B8B8B5') });
    text(s, v[1], x + 0.22, 3.36, 3.12, 0.34, { fontSize: 17, color: v[4], bold: true });
    text(s, v[2], x + 0.22, 3.85, 3.12, 0.54, { fontSize: 10.5, color: i === 2 ? C.grey4 : 'D5D5D2' });
    if (i < 2) line(s, x + 3.66, 3.72, 0.37, 0, C.cyan, 1.0, true);
  });
  placeholder(s, M, 5.08, 3.66, 1.42, '案例库', '资源收集、标签与检索页面');
  placeholder(s, 4.68, 5.08, 3.66, 1.42, '内容推荐', '组织学习或个人发展计划页面');
  placeholder(s, 8.71, 5.08, 3.66, 1.42, 'AI 陪练 / AI 智课', '练习或课程生成页面');
  notes(s, ['第二个环节通过案例库盘点已有资料，先收集、归类和识别缺口。', '第三个环节分成推荐和内生。组织学习承接岗位共性推荐，个人发展计划承接个人推荐；缺失内容由 AI 陪练和 AI 智课补齐。'], '用讯飞学习机案例看资料收集与智课制作');
}

// 05 · iFLYTEK case
{
  const s = pptx.addSlide();
  s.background = { color: C.grey1 };
  chrome(s, '04 · 案例简述 / 讯飞学习机', 5);
  kicker(s, '案例库收集与智课课程制作');
  title(s, '讯飞学习机：从案例收集\n到课程快速制作', M, 1.18, 6.1, 1.0, { fontSize: 34 });
  const flow = [
    ['01', '收集', '将业务案例、产品资料与经验内容进入案例库'],
    ['02', '整理', '按主题、场景和适用对象完成标签与筛选'],
    ['03', '制作', '选择可用素材，通过 AI 智课生成课程初稿'],
    ['04', '确认', '业务专家补充与调整后发布使用']
  ];
  flow.forEach((v, i) => {
    const y = 2.58 + i * 0.77;
    badge(s, v[0], M, y, i === 2 ? C.cyan : C.blue);
    text(s, v[1], M + 0.55, y, 1.05, 0.28, { fontSize: 12.7, bold: true });
    text(s, v[2], M + 1.64, y, 4.15, 0.4, { fontSize: 10.7, color: C.grey4 });
  });
  rect(s, M, 5.82, 5.73, 0.56, C.pale);
  text(s, '重点：复用已收集案例，减少课程资料重复整理。', M + 0.2, 5.98, 5.33, 0.24, { fontSize: 11.5, color: C.blue, bold: true });
  placeholder(s, 6.62, 1.5, 2.92, 4.88, '01 案例库截图', '建议放资源收集、分类或案例详情页');
  line(s, 9.54, 3.93, 0.22, 0, C.cyan, 1.1, true);
  placeholder(s, 9.76, 1.5, 2.92, 4.88, '02 AI 智课截图', '建议放课程生成或课程编辑页');
  notes(s, ['讯飞学习机案例重点讲两个动作：案例库收集和 AI 智课制作。', '已有业务案例和产品资料先进入案例库，完成分类与筛选，再选择可用素材生成课程初稿，最后由专家确认。'], '再看欧姆龙课长与部长岗位内容制作');
}

// 06 · Omron case
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '05 · 案例简述 / 欧姆龙课长与部长', 6);
  kicker(s, '围绕管理岗位任务制作学习内容');
  title(s, '欧姆龙：课长 / 部长\n岗位学习内容制作', M, 1.18, 6.0, 1.0, { fontSize: 34 });
  const steps = [
    ['岗位画像', '梳理课长与部长的关键管理任务和典型场景'],
    ['资料盘点', '收集管理制度、内部案例与优秀管理经验'],
    ['内容制作', '形成岗位课程、管理案例与情境练习']
  ];
  steps.forEach((v, i) => {
    const y = 2.67 + i * 0.92;
    meta(s, `0${i + 1}`, M, y + 0.08, 0.38, { color: i === 2 ? C.cyan : C.blue });
    text(s, v[0], M + 0.5, y, 1.35, 0.3, { fontSize: 13.2, bold: true });
    text(s, v[1], M + 1.87, y + 0.01, 3.85, 0.42, { fontSize: 10.8, color: C.grey4 });
    if (i < 2) line(s, M + 0.15, y + 0.48, 0, 0.43, C.cyan, 0.9, true);
  });
  rect(s, M, 5.82, 5.75, 0.56, C.cyanPale);
  text(s, '重点：同一套岗位方法，分别适配课长与部长的管理层级。', M + 0.2, 5.98, 5.35, 0.24, { fontSize: 11.5, color: C.cyan, bold: true });
  placeholder(s, 6.62, 1.5, 2.92, 4.88, '01 岗位画像截图', '建议放课长 / 部长岗位模型页面');
  line(s, 9.54, 3.93, 0.22, 0, C.cyan, 1.1, true);
  placeholder(s, 9.76, 1.5, 2.92, 4.88, '02 课程 / 陪练截图', '建议放岗位课程或管理情境练习');
  notes(s, ['欧姆龙案例按照同一条三环节链路展开。先梳理课长和部长的管理任务，再盘点内部制度、案例和经验，最后制作课程和情境练习。', '两类岗位使用同一套方法，但内容深度和管理场景按层级适配。'], '用一页总结平台如何连接三个环节');
}

// 07 · Closing
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  chrome(s, '06 · 总结 / 平台应用适配', 7, true);
  kicker(s, '一条简单、可复用的岗位学习内容建设路径', 'B8B8B5');
  title(s, '三个环节，连接\n平台应用', M, 1.2, 6.0, 1.0, { fontSize: 35, color: C.white });
  const rows = [
    ['01', '岗位画像', '人才发展 AI 建模', '九宫格 / 人才图谱反馈差距'],
    ['02', '资料盘点', '案例库收集与整理', '形成资料目录与内容缺口'],
    ['03', '内容推荐与生成', '组织学习 / 个人发展计划', 'AI 陪练 / AI 智课补齐内容']
  ];
  rows.forEach((v, i) => {
    const y = 2.75 + i * 1.03;
    badge(s, v[0], M, y, i === 2 ? C.cyan : C.blue);
    text(s, v[1], M + 0.58, y - 0.01, 2.15, 0.31, { fontSize: 14.6, color: C.white, bold: true });
    rect(s, 3.45, y - 0.12, 3.72, 0.65, i === 1 ? '242424' : '222A3E', i === 1 ? '565656' : '3C568F', 0.55);
    text(s, v[2], 3.67, y + 0.07, 3.28, 0.27, { fontSize: 11.5, color: C.white, bold: true });
    line(s, 7.17, y + 0.2, 0.42, 0, C.cyan, 1.0, true);
    rect(s, 7.59, y - 0.12, 4.79, 0.65, i === 2 ? '183B36' : '242424', i === 2 ? '2B7467' : '565656', 0.55);
    text(s, v[3], 7.82, y + 0.07, 4.32, 0.27, { fontSize: 11.2, color: C.white });
  });
  line(s, M, 6.12, 12.03, 0, '6B6B6B', 0.55);
  text(s, '先用岗位画像确定方向，再复用已有资料，最后推荐或生成学习内容。', M, 6.42, 9.5, 0.37, { fontSize: 15.2, color: C.white });
  meta(s, '时代光华 · AI FOR LEARNING', 9.2, 6.8, 3.5, { color: 'B8B8B5', align: 'right' });
  notes(s, ['总结起来，岗位画像由人才发展 AI 建模承接，资料盘点由案例库承接，内容推荐与生成由组织学习、个人发展计划、AI 陪练和 AI 智课承接。', '九宫格和人才图谱把人才差距反馈回来，形成持续更新。'], '进入具体截图与案例材料补充');
}

pptx.writeFile({ fileName: path.join(__dirname, 'AI岗位学习内容建设方案_简版_冬青黑体版.pptx') });
