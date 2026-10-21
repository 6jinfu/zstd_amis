const path = require('node:path');
const pptxgen = require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const useCompatFont = process.argv.includes('--compat');
const FONT = useCompatFont ? 'Hiragino Sans GB' : 'PingFang SC';
const pptx = new pptxgen();
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';
pptx.author = '时代光华';
pptx.company = '时代光华';
pptx.subject = '从组织宏观视角开展企业人才发展';
pptx.title = '海格汽车人才发展方案';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

const C = {
  paper: 'FAFAF8', white: 'FFFFFF', ink: '0A0A0A', dark: '171717',
  grey1: 'F0F0EE', grey2: 'D4D4D2', grey3: '737373', grey4: '525252',
  accent: '002FA7', pale: 'E8EDFF', lightBlue: 'DCE4FF'
};
const W = 13.333, H = 7.5, M = 0.65, TOTAL = 12;

function rect(slide, x, y, w, h, fill, line = fill, width = 0.5, dash = 'solid', transparency = 0) {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h, fill: { color: fill, transparency },
    line: { color: line, width, dashType: dash, transparency: line === fill ? 100 : 0 }
  });
}
function line(slide, x, y, w, h, color = C.grey2, width = 0.6, dash = 'solid', arrow = false) {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h, line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined }
  });
}
function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h, fontFace: FONT, fontSize: opts.fontSize || 16,
    color: opts.color || C.ink, bold: opts.bold || false, italic: opts.italic || false,
    align: opts.align || 'left', valign: opts.valign || 'top',
    margin: opts.margin === undefined ? 0 : opts.margin,
    fit: opts.fit === null ? undefined : (opts.fit || 'shrink'),
    breakLine: false, charSpacing: opts.charSpacing || 0,
    paraSpaceAfterPt: opts.paraSpaceAfterPt || 0, lang: 'zh-CN', isTextBox: true
  });
}
function meta(slide, value, x, y, w, opts = {}) {
  text(slide, value, x, y, w, 0.24, {
    fontSize: 8.5, color: opts.color || C.grey3, bold: true,
    charSpacing: 1.15, align: opts.align || 'left', valign: 'mid', fit: null
  });
}
function title(slide, value, x, y, w, h, opts = {}) {
  text(slide, value, x, y, w, h, {
    fontSize: opts.fontSize || 38, color: opts.color || C.ink,
    bold: false, valign: opts.valign || 'top'
  });
}
function chrome(slide, left, page, dark = false) {
  meta(slide, left.toUpperCase(), M, 0.42, 8.2, { color: dark ? 'B8B8B5' : C.grey3 });
  meta(slide, `${String(page).padStart(2, '0')} / ${TOTAL}`, W - 1.65, 0.42, 1, {
    color: dark ? 'B8B8B5' : C.grey3, align: 'right'
  });
}
function kicker(slide, value, x = M, y = 0.96, w = 8, color = C.grey3) {
  meta(slide, value, x, y, w, { color });
}
function placeholder(slide, x, y, w, h, label, hint = '替换为对应业务页面截图', dark = false) {
  const bg = dark ? '202020' : C.white;
  const border = dark ? '757575' : 'B9B9B6';
  const fg = dark ? C.white : C.ink;
  rect(slide, x, y, w, h, bg, border, 1.2, 'dash');
  line(slide, x + 0.22, y + 0.22, w - 0.44, h - 0.44, border, 0.45);
  line(slide, x + 0.22, y + h - 0.22, w - 0.44, -(h - 0.44), border, 0.45);
  rect(slide, x + 0.34, y + 0.34, Math.min(2.35, w - 0.68), 0.34, dark ? C.accent : C.pale);
  meta(slide, '业务截图占位', x + 0.46, y + 0.43, Math.min(2.1, w - 0.9), { color: dark ? C.white : C.accent });
  text(slide, label, x + 0.55, y + h / 2 - 0.42, w - 1.1, 0.52, { fontSize: 18, color: fg, bold: true, align: 'center', valign: 'mid' });
  text(slide, hint, x + 0.55, y + h / 2 + 0.2, w - 1.1, 0.34, { fontSize: 10.8, color: dark ? 'BDBDBA' : C.grey3, align: 'center', valign: 'mid' });
}
function addNotes(slide, talk, transition) {
  slide.addNotes([...talk, '', `接下来：${transition}`].join('\n\n'));
}

// 01 · Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.accent };
  for (let i = 0; i < 11; i++) line(s, 7.7 + i * 0.48, 0, 0, H, 'FFFFFF', 0.25);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    rect(s, 8.55 + c * 0.48, 1.1 + r * 0.48, 0.05, 0.05, C.white, C.white, 0.5, 'solid', 42 + ((r * 11 + c * 7) % 40));
  }
  meta(s, '海格汽车 · 人才发展方案', M, 0.42, 7, { color: C.lightBlue });
  meta(s, 'SS · 26.08.28 · 01 / 12', 10.55, 0.42, 2.15, { color: C.lightBlue, align: 'right' });
  meta(s, '时代光华人才发展体系', M, 1.15, 5.2, { color: C.lightBlue });
  title(s, '从组织宏观视角\n开展企业人才发展', M, 1.72, 7.05, 2.35, { fontSize: 48, color: C.white });
  line(s, M, 5.58, 12.03, 0, C.white, 0.5);
  text(s, '从组织和关键岗位出发，把标准、盘点、匹配和培养接起来。', M, 5.84, 9.8, 0.45, { fontSize: 17.5, color: C.white });
  meta(s, '组织分析 · 岗位标准 · 人才盘点 · 人岗匹配 · 发展计划', M, 6.72, 7.2, { color: C.lightBlue });
  meta(s, '时代光华 · TALENT DEVELOPMENT', 9.15, 6.72, 3.55, { color: C.lightBlue, align: 'right' });
  addNotes(s,
    ['客户问的是时代光华怎么做人才发展。我们的回答先从组织和关键岗位开始，再进入岗位标准、人才盘点、人岗匹配和发展安排。', '今天不按系统菜单逐个介绍，直接沿着一轮业务工作往下讲。'],
    '先看人才发展为什么要从组织分析开始'
  );
}

// 02 · Global view
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '00 · 全局视图 / BD × OD × TD × LD', 2);
  kicker(s, '从业务战略到组织、人才与学习的一体化链路');
  title(s, '人才发展全局视图', M, 1.18, 5.65, 0.58, { fontSize: 34 });
  text(s, '战略定方向，组织定环境，人才定对象，学习定行动。', 6.55, 1.29, 6.13, 0.34, { fontSize: 12.3, color: C.grey4, align: 'right' });

  const leftX = M, labelW = 1.18, contentX = 2.05, contentW = 10.63;
  const rows = [
    { y: 1.96, h: 1.08, code: 'BD', name: '业务发展', fill: 'E8EDFF', color: C.accent },
    { y: 3.14, h: 1.08, code: 'OD', name: '组织发展', fill: 'E7F1F0', color: '155E63' },
    { y: 4.32, h: 1.28, code: 'TD', name: '人才发展', fill: 'EEF3E8', color: '44652B' },
    { y: 5.7, h: 1.08, code: 'LD', name: '学习发展', fill: 'F6ECE4', color: '8B4A20' }
  ];
  rows.forEach(r => {
    rect(s, leftX, r.y, labelW, r.h, r.fill);
    meta(s, r.code, leftX + 0.18, r.y + 0.2, 0.82, { color: r.color });
    text(s, r.name, leftX + 0.18, r.y + 0.53, 0.82, 0.3, { fontSize: 11.3, color: r.color, bold: true });
  });

  rect(s, contentX, 1.96, contentW, 1.08, C.white, C.grey2, 0.65);
  const bd = [
    ['业务盘点', '看清现状'],
    ['战略规划', '明确方向'],
    ['战略解码', '转为组织任务']
  ];
  bd.forEach((v, i) => {
    const x = contentX + 0.25 + i * 3.45;
    meta(s, `0${i + 1}`, x, 2.18, 0.38, { color: C.accent });
    text(s, v[0], x + 0.48, 2.11, 1.35, 0.3, { fontSize: 13.2, bold: true });
    text(s, v[1], x + 1.8, 2.13, 1.25, 0.26, { fontSize: 10.2, color: C.grey3 });
    if (i < 2) line(s, x + 3.03, 2.48, 0.31, 0, C.accent, 0.9, 'solid', true);
  });
  rect(s, contentX + 0.25, 2.62, 10.13, 0.22, C.pale);
  meta(s, '业务方向向下解码，组织与人才发展反向支撑业务结果', contentX + 0.42, 2.65, 9.79, { color: C.accent, align: 'center' });

  const od = [
    ['组织结构与机制', 'STRUCTURE'],
    ['目标与绩效', 'OBJECT'],
    ['文化与氛围', 'CULTURE']
  ];
  od.forEach((v, i) => {
    const x = contentX + i * 3.58;
    rect(s, x, 3.14, 3.45, 1.08, i === 1 ? C.pale : C.white, i === 1 ? C.accent : C.grey2, i === 1 ? 1.0 : 0.65);
    text(s, v[0], x + 0.22, 3.42, 3.01, 0.28, { fontSize: 13.2, bold: true, align: 'center' });
    meta(s, v[1], x + 0.22, 3.79, 3.01, { color: i === 1 ? C.accent : C.grey3, align: 'center' });
  });

  const tdHeaders = [
    ['DEFINE', '定标准'], ['DISCOVER', '识人才'], ['DRIVE', '促发展']
  ];
  tdHeaders.forEach((v, i) => {
    const x = contentX + i * 3.58;
    rect(s, x, 4.32, 3.45, 0.31, i === 1 ? C.accent : 'EEF3E8');
    meta(s, `${v[0]} · ${v[1]}`, x + 0.15, 4.38, 3.15, { color: i === 1 ? C.white : '44652B', align: 'center' });
  });
  const tdCards = [
    [['组织 / 关键岗位分析', '确定优先范围'], ['岗位标准', '建立统一尺子']],
    [['评鉴工具', '收集能力、动力、潜力'], ['人才盘点', '看清群体与个人']],
    [['人岗匹配', '识别差距'], ['个人 IDP / 组织培养', '把差距变成行动']]
  ];
  tdCards.forEach((col, i) => col.forEach((v, j) => {
    const x = contentX + i * 3.58, y = 4.72 + j * 0.43;
    rect(s, x, y, 3.45, 0.35, C.white, C.grey2, 0.55);
    text(s, v[0], x + 0.15, y + 0.08, 1.86, 0.19, { fontSize: 10.2, bold: true, valign: 'mid' });
    text(s, v[1], x + 1.87, y + 0.08, 1.42, 0.19, { fontSize: 8.5, color: C.grey3, align: 'right', valign: 'mid' });
  }));
  line(s, contentX + 3.45, 4.9, 0.13, 0, C.accent, 1, 'solid', true);
  line(s, contentX + 7.03, 4.9, 0.13, 0, C.accent, 1, 'solid', true);

  const ld = [
    ['CONDUCT · 学', '在线学习'],
    ['CONSTRUCT · 习', 'AI 陪练'],
    ['CONVERT · 变', '行动学习']
  ];
  ld.forEach((v, i) => {
    const x = contentX + i * 3.58;
    meta(s, v[0], x + 0.14, 5.89, 3.15, { color: '8B4A20', align: 'center' });
    rect(s, x, 6.17, 3.45, 0.36, C.white, C.grey2, 0.55);
    text(s, v[1], x + 0.18, 6.25, 3.09, 0.2, { fontSize: 10.8, bold: true, align: 'center', valign: 'mid' });
    if (i < 2) line(s, x + 3.45, 6.35, 0.13, 0, '8B4A20', 0.9, 'solid', true);
  });
  rect(s, contentX, 6.59, contentW, 0.25, 'F6ECE4');
  meta(s, '数字化培训管理 · 承接个人与组织培养任务', contentX + 0.2, 6.62, contentW - 0.4, { color: '8B4A20', align: 'center' });

  line(s, 7.32, 2.86, 0, 0.3, C.accent, 1.05, 'solid', true);
  line(s, 7.32, 4.21, 0, 0.11, C.accent, 1.05, 'solid', true);
  line(s, 7.32, 5.59, 0, 0.11, C.accent, 1.05, 'solid', true);
  addNotes(s,
    ['这是整套人才发展的全局图。业务发展先给出方向，组织发展把战略转成结构、目标和文化环境。', '人才发展再按定标准、识人才、促发展往下走，学习发展把个人和组织的培养任务落到具体行动。', '后面的页面就沿着这条链路，从组织与关键岗位开始展开。'],
    '先看人才发展为什么要从组织分析开始'
  );
}

// 03 · OD source
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '01 · 组织视角 / OD 是人才发展的起点', 3);
  kicker(s, '先看组织，再决定人才工作从哪里开始');
  title(s, '人才发展，先从\n组织问题开始', M, 1.18, 5.7, 1.04, { fontSize: 31 });
  text(s, '组织结构是否合理、哪些岗位最关键，先把这两件事看清楚。', M, 2.3, 5.7, 0.42, { fontSize: 13.8, color: C.grey4 });
  const moves = [
    ['01', '看组织结构', '部门、层级和岗位分布有没有明显问题。'],
    ['02', '诊断关键岗位', '哪些岗位直接影响当前业务，要先做。'],
    ['03', '确定优先范围', '把有限精力放在最需要的人和岗位上。'],
    ['04', '进入人才发展', '再开始建标准、盘点和培养。']
  ];
  moves.forEach((m, i) => {
    const y = 2.86 + i * 0.78;
    meta(s, m[0], M, y + 0.09, 0.42, { color: C.accent });
    text(s, m[1], M + 0.55, y, 1.55, 0.35, { fontSize: 15.5 });
    text(s, m[2], M + 2.15, y, 3.35, 0.38, { fontSize: 11.8, color: C.grey4 });
    line(s, M, y + 0.58, 5.5, 0, C.grey2, 0.45);
  });
  placeholder(s, 6.55, 1.22, 6.13, 4.8, '组织结构分析 / 关键岗位诊断页');
  const bands = [
    ['BD', '业务发展', '业务方向'], ['OD', '组织发展', '组织与关键岗位'],
    ['TD', '人才发展', '标准、盘点与发展'], ['LD', '学习发展', '学习与培养动作']
  ];
  bands.forEach((b, i) => {
    const x = M + i * 3.01;
    rect(s, x, 6.35, 2.84, 0.55, i === 1 ? C.accent : C.grey1);
    meta(s, `${b[0]} · ${b[1]}`, x + 0.14, 6.47, 1.28, { color: i === 1 ? C.white : C.grey4 });
    text(s, b[2], x + 1.42, 6.43, 1.25, 0.23, { fontSize: 9.8, color: i === 1 ? C.white : C.grey3, align: 'right' });
  });
  addNotes(s,
    ['我们先从 OD 开始。系统先看组织结构、岗位分布和关键岗位，帮助业务判断这一轮人才发展先做哪里。', '组织分析不需要讲得很学术。它解决的是两个实际问题：组织上哪里需要调整，哪些岗位最值得优先投入。', '范围确定以后，再进入 TD，开始建岗位标准和盘点人才。'],
    '看完整的一轮人才发展怎么跑'
  );
}

// 03 · Six-step journey
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '02 · 一轮人才发展 / 业务路线', 4);
  kicker(s, '从关键岗位一直做到发展安排');
  title(s, '六步走完一轮人才发展', M, 1.3, 8.8, 0.7, { fontSize: 39 });
  const steps = ['定关键岗位', '建岗位标准', '收人才数据', '做人才盘点', '看人岗差距', '安排培养发展'];
  const sub = ['组织分析', '岗位中心', '评鉴中心', '人才中心', '人才中心', '发展中心'];
  const x0 = 1.03, gap = 2.13, axisY = 4.05;
  line(s, x0, axisY, gap * 5 + 0.4, 0, C.accent, 1.35, 'solid', true);
  steps.forEach((name, i) => {
    const x = x0 + i * gap;
    rect(s, x - 0.07, axisY - 0.07, 0.14, 0.14, C.accent);
    const top = i % 2 === 0;
    meta(s, String(i + 1).padStart(2, '0'), x - 0.6, top ? 3.12 : 4.33, 1.2, { color: C.accent, align: 'center' });
    text(s, name, x - 0.84, top ? 3.42 : 4.62, 1.68, 0.36, { fontSize: 14.2, align: 'center' });
    meta(s, sub[i], x - 0.72, top ? 3.76 : 4.99, 1.44, { color: C.grey3, align: 'center' });
  });
  rect(s, M, 5.9, 12.03, 0.55, C.grey1);
  text(s, '岗位标准给评鉴定尺子，盘点结果给匹配和培养定方向。', M + 0.22, 6.05, 8.9, 0.26, { fontSize: 12.5, color: C.grey4 });
  meta(s, '前一步的结果，下一步直接用', 9.25, 6.07, 3.18, { color: C.accent, align: 'right' });
  addNotes(s,
    ['一轮人才发展可以拆成六步。先从组织分析里找到关键岗位，再建岗位标准。', '标准定下来后，用 360、考试、人才测评和绩效收集人才数据。接着做人才盘点和人岗匹配。', '最后把个人差距变成个人发展安排，把多人共有的差距变成组织培养项目。'],
    '先看岗位标准是怎么建出来的'
  );
}

// 04 · Position standard
{
  const s = pptx.addSlide();
  s.background = { color: C.grey1 };
  chrome(s, '03 · 岗位中心 / 建立统一的人才标准', 5);
  kicker(s, '岗位标准讲清楚，后面才有同一把尺子');
  title(s, '先把岗位标准讲清楚', M, 1.18, 7.2, 0.66, { fontSize: 37 });
  text(s, '岗位标准分成任职和资格两部分，系统先给初稿，业务再确认。', M, 1.96, 6.7, 0.4, { fontSize: 14.3, color: C.grey4 });
  rect(s, M, 2.65, 2.65, 2.2, C.dark);
  meta(s, '任职 · 做什么', M + 0.25, 2.93, 2.1, { color: 'CFCFCC' });
  title(s, '职责\n任务', M + 0.25, 3.38, 1.9, 1.0, { fontSize: 29, color: C.white });
  rect(s, 3.55, 2.65, 2.65, 2.2, C.accent);
  meta(s, '资格 · 凭什么胜任', 3.8, 2.93, 2.15, { color: C.lightBlue });
  title(s, '经历 · 能力\n动力 · 潜力', 3.8, 3.34, 2.15, 1.05, { fontSize: 25, color: C.white });
  const steps = [['读取岗位材料', '说明书、组织资料'], ['生成标准初稿', '内容和等级都可调整'], ['业务确认保存', '成为评鉴和培养依据']];
  steps.forEach((v, i) => {
    const x = M + i * 1.86;
    meta(s, `0${i + 1}`, x, 5.28, 0.4, { color: C.accent });
    text(s, v[0], x + 0.45, 5.18, 1.35, 0.31, { fontSize: 12.3 });
    text(s, v[1], x + 0.45, 5.55, 1.35, 0.45, { fontSize: 9.8, color: C.grey3 });
    if (i < 2) line(s, x + 1.68, 5.36, 0.2, 0, C.accent, 1, 'solid', true);
  });
  placeholder(s, 6.55, 1.18, 6.13, 5.28, '岗位中心 · 岗位标准配置页');
  addNotes(s,
    ['岗位标准是整套人才发展的尺子。我们把它分成任职和资格两部分。任职回答岗位做什么，包含职责和任务；资格回答凭什么胜任，包含经历、能力、动力和潜力。', '系统读取岗位说明书、组织信息和已有指标，先生成一版初稿。业务负责人可以删改内容、调整要求等级，确认后保存。', '这套标准会继续用于评鉴、盘点、人岗匹配和培养。'],
    '标准有了，下一步准备人才数据'
  );
}

// 05 · Data preparation
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '04 · 评鉴中心 / 准备人才数据', 6);
  kicker(s, '盘点结果是否可信，先看数据是否准备好');
  title(s, '盘点前，先把人才\n数据准备好', M, 1.15, 5.75, 1.0, { fontSize: 30 });
  const sources = [
    ['360 评估', '看日常工作中的能力表现'], ['考试', '看相关知识和技能结果'],
    ['人才测评', '看动力、潜力等特征'], ['人员与绩效', '补齐岗位、经历和绩效信息']
  ];
  sources.forEach((v, i) => {
    const y = 2.55 + i * 0.78;
    rect(s, M, y, 2.2, 0.58, i === 2 ? C.accent : C.grey1);
    text(s, v[0], M + 0.18, y + 0.15, 1.85, 0.24, { fontSize: 13.5, color: i === 2 ? C.white : C.ink, bold: true });
    text(s, v[1], 3.08, y + 0.13, 3.0, 0.32, { fontSize: 12.2, color: C.grey4 });
  });
  rect(s, M, 5.92, 5.55, 0.55, C.pale);
  text(s, '系统按项目选人、选工具、带入结果，减少重复导表和手工拼数据。', M + 0.2, 6.07, 5.12, 0.27, { fontSize: 11.5, color: C.accent });
  placeholder(s, 6.55, 1.18, 6.13, 5.28, '评鉴中心 · 项目与评鉴工具页');
  addNotes(s,
    ['岗位标准定下来以后，要把人才数据准备好。能力表现可以来自 360，知识和技能结果可以来自考试，动力和潜力可以来自人才测评。人员信息、岗位经历和绩效一起带进来。', '系统按本次项目选人、选择已完成的评鉴结果，再进入盘点。这样不需要每次重新整理多张表。'],
    '数据准备好以后，用两种方式做人才盘点'
  );
}

// 06 · Two review methods
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  chrome(s, '05 · 人才中心 / 两种人才盘点方法', 7, true);
  kicker(s, '一个看人员落位，一个看群体规律', M, 0.96, 8, 'B8B8B5');
  title(s, '宫格看落位，人才图谱看规律', M, 1.28, 10.8, 0.65, { fontSize: 36, color: C.white });
  const cols = [
    { x: M, ttl: '宫格盘点（常用九宫格）', desc: '用能力和绩效把人员放进宫格，方便业务与 HR 校准名单、讨论用人。', label: '人才盘点 · 宫格结果页' },
    { x: 6.77, ttl: '人才图谱盘点', desc: '把人员、绩效、能力、动力和潜力放在一起，看分布、关系和 A/B/C/D 分组。', label: '人才盘点 · 人才图谱页' }
  ];
  cols.forEach((c, i) => {
    meta(s, `0${i + 1}`, c.x, 2.16, 0.5, { color: C.lightBlue });
    text(s, c.ttl, c.x + 0.58, 2.05, 4.95, 0.4, { fontSize: 17, color: C.white });
    text(s, c.desc, c.x + 0.58, 2.56, 5.2, 0.58, { fontSize: 11.8, color: 'CFCFCC' });
    placeholder(s, c.x, 3.28, 5.9, 3.1, c.label, '替换为盘点结果页截图', true);
  });
  addNotes(s,
    ['平台提供两种盘点方法。宫格盘点常用九宫格，用能力和绩效看每个人落在哪里，适合做名单校准和用人讨论。', '人才图谱把人员、绩效、能力、动力和潜力放在一起，适合看群体分布、变量关系和 A/B/C/D 分组。', '两种方法解决的问题不同，可以按这次盘点的目的来选。'],
    '盘点结果出来后，再看人和目标岗位是否匹配'
  );
}

// 07 · Person-position match
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '06 · 人才中心 × 岗位中心 / 人岗匹配', 8);
  kicker(s, '把岗位要求和人的现状放在一起');
  title(s, '这个人，适不适合\n目标岗位', M, 1.16, 5.75, 1.02, { fontSize: 30 });
  const cards = [
    ['01', '选目标岗位', '读取岗位职责、资格项和要求等级。'],
    ['02', '带入个人结果', '读取最新评鉴、盘点和人才档案数据。'],
    ['03', '看匹配和差距', '雷达和明细一起看；可比较 2–5 人。']
  ];
  cards.forEach((c, i) => {
    const y = 2.35 + i * 1.12;
    rect(s, M, y, 5.25, 0.88, i === 2 ? C.pale : C.grey1);
    title(s, c[0], M + 0.2, y + 0.15, 0.7, 0.45, { fontSize: 22, color: C.accent });
    text(s, c[1], M + 1.0, y + 0.13, 1.55, 0.31, { fontSize: 14.5, bold: true });
    text(s, c[2], M + 2.55, y + 0.13, 2.45, 0.5, { fontSize: 11.5, color: C.grey4 });
  });
  text(s, '业务最后看到的，不只是一个分数。更重要的是：哪里符合，哪里还有差距，接下来该补什么。', M, 5.95, 5.25, 0.55, { fontSize: 12.5, color: C.grey4 });
  placeholder(s, 6.55, 1.18, 6.13, 5.28, '人才中心 · 人岗匹配 / 人才对比页');
  addNotes(s,
    ['人岗匹配把岗位要求和人的现状放到一起。先选目标岗位，系统读取这套岗位标准，再带入个人最新的评鉴和盘点结果。', '页面既看整体匹配，也看每一项差距。业务需要在几名候选人里做选择时，可以把 2 至 5 人放在一起比较。', '最后要回答的是谁更合适、差在哪里、下一步补什么。'],
    '个人差距确认后，直接形成个人发展安排'
  );
}

// 08 · Individual development
{
  const s = pptx.addSlide();
  s.background = { color: C.grey1 };
  chrome(s, '07 · 发展中心 / 个人发展计划', 9);
  kicker(s, '基于人才差距生成个人发展安排');
  title(s, '个人有差距，\n就形成个人发展安排', M, 1.24, 5.65, 0.92, { fontSize: 29 });
  const steps = [
    ['01', '选本期重点', '从岗位差距和盘点结论里选最需要解决的问题。'],
    ['02', '安排发展动作', '课程、项目、岗位实践、经理辅导都可使用。'],
    ['03', '定人和时间', '写清负责人、完成时间和检查方式。'],
    ['04', '跟进结果', '进度和新评估结果继续回到个人档案。']
  ];
  line(s, M + 0.2, 2.5, 0, 3.25, C.accent, 1.4);
  steps.forEach((v, i) => {
    const y = 2.28 + i * 0.9;
    rect(s, M + 0.11, y + 0.16, 0.18, 0.18, C.accent);
    meta(s, v[0], M + 0.48, y + 0.11, 0.45, { color: C.accent });
    text(s, v[1], M + 1.08, y, 1.55, 0.33, { fontSize: 14.3, bold: true });
    text(s, v[2], M + 2.65, y, 3.05, 0.48, { fontSize: 11.4, color: C.grey4 });
  });
  placeholder(s, 6.55, 1.18, 6.13, 5.28, '发展中心 · 个人发展计划（IDP）页');
  addNotes(s,
    ['个人差距确认后，系统形成个人发展安排。先选这段时间最需要解决的问题，再安排课程、项目、岗位实践或经理辅导。', '每项动作都写清负责人、时间和检查方式。员工、经理和 HR 在同一个地方跟进。', '新的评估结果出来以后，继续更新个人档案，下一次匹配和盘点可以直接用。'],
    '多人出现同一问题时，转成组织培养计划'
  );
}

// 09 · Organization development
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '08 · 发展中心 × 培训平台 / 组织培养', 10);
  kicker(s, '共性差距进入岗位学习计划和培训项目');
  title(s, '多人都有同一个问题，\n就做组织培养', M, 1.22, 5.7, 0.92, { fontSize: 29 });
  const flow = [
    ['汇总共性\n差距', '看高频能力差距'], ['定岗位\n培养目标', '明确能力项和目标等级'],
    ['关联学习\n计划', '配置课程、项目和实践'], ['跟前后\n变化', '结果回到人才档案']
  ];
  flow.forEach((v, i) => {
    const x = M + i * 1.48;
    rect(s, x, 2.35, 1.26, 1.64, i === 1 ? C.accent : C.grey1);
    meta(s, `0${i + 1}`, x + 0.16, 2.57, 0.4, { color: i === 1 ? C.white : C.accent });
    text(s, v[0], x + 0.16, 2.91, 0.95, 0.5, { fontSize: 12.8, color: i === 1 ? C.white : C.ink, bold: true });
    text(s, v[1], x + 0.16, 3.48, 0.95, 0.36, { fontSize: 9.1, color: i === 1 ? C.lightBlue : C.grey4 });
    if (i < 3) line(s, x + 1.27, 3.14, 0.21, 0, C.accent, 1, 'solid', true);
  });
  rect(s, M, 4.45, 5.7, 1.18, C.dark);
  meta(s, '组织发展', M + 0.22, 4.68, 1.2, { color: 'BFBFBC' });
  text(s, '岗位下面关联学习计划和培训项目', M + 0.22, 5.04, 3.55, 0.34, { fontSize: 15, color: C.white });
  text(s, '个人发展', M + 3.95, 4.68, 1.25, 0.26, { fontSize: 9.5, color: C.lightBlue, bold: true });
  text(s, '个人差距进入 IDP', M + 3.95, 5.04, 1.4, 0.32, { fontSize: 12.2, color: C.white });
  placeholder(s, 6.55, 1.18, 6.13, 5.28, '发展中心 · 岗位学习计划 / 培训项目页');
  addNotes(s,
    ['如果很多人都有同一个能力问题，就不需要每个人单独做一套。系统先汇总共性差距，再按岗位确定培养目标。', '发展中心把课程、项目和岗位实践关联到岗位学习计划，培训平台负责执行。前测、后测和新的评估结果再回到人才档案。', '这样组织发展和个人发展是两条清楚的路径：共性问题做组织培养，个人问题进个人发展计划。'],
    '最后把所有模块串成一条数据链'
  );
}

// 10 · Data chain
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  chrome(s, '09 · 模块串联 / 前一步结果给下一步使用', 11, true);
  kicker(s, '岗位中心 · 评鉴中心 · 人才中心 · 发展中心', M, 0.96, 8.5, 'B8B8B5');
  title(s, '前一步做完，下一步直接接着用', M, 1.3, 9.8, 0.67, { fontSize: 35, color: C.white });
  const nodes = [
    ['组织分析', '定范围'], ['岗位标准', '定尺子'], ['评鉴结果', '收数据'],
    ['人才盘点', '看群体'], ['人岗匹配', '看个人'], ['发展计划', '排动作'], ['结果更新', '再使用']
  ];
  const x0 = M, gap = 1.76, y = 3.0;
  nodes.forEach((n, i) => {
    const x = x0 + i * gap;
    rect(s, x, y, 1.47, 1.52, i === 5 ? C.accent : '252525', i === 5 ? C.accent : '5E5E5B', 0.8);
    meta(s, String(i + 1).padStart(2, '0'), x + 0.16, y + 0.2, 0.42, { color: i === 5 ? C.white : C.lightBlue });
    text(s, n[0], x + 0.16, y + 0.63, 1.15, 0.34, { fontSize: 13.3, color: C.white, bold: true });
    text(s, n[1], x + 0.16, y + 1.08, 1.15, 0.24, { fontSize: 9.8, color: i === 5 ? C.lightBlue : 'B8B8B5' });
    if (i < nodes.length - 1) line(s, x + 1.48, y + 0.76, gap - 1.5, 0, C.lightBlue, 1, 'solid', true);
  });
  line(s, M, 5.25, 12.03, 0, '4A4A48', 0.7);
  text(s, '岗位标准不用重复建，人才数据不用反复拼，培养结果也不会留在另一个系统里。', M, 5.58, 9.5, 0.44, { fontSize: 14.2, color: 'D0D0CD' });
  meta(s, '一轮做完，下一轮从最新结果继续', 8.72, 6.35, 3.95, { color: C.lightBlue, align: 'right' });
  addNotes(s,
    ['整套方案能串起来，关键是前一步的结果会被下一步直接使用。组织分析确定范围，岗位标准确定判断尺子，评鉴结果进入人才盘点。', '盘点和人岗匹配看清群体与个人差距，发展中心据此安排个人和组织培养。培养后的结果继续更新人才档案。', '这样下一轮不需要从头再收数据。'],
    '收住这套方案最终解决的三个问题'
  );
}

// 11 · Closing
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  rect(s, 0, 0, 6.66, H, C.accent);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    rect(s, 0.62 + c * 0.45, 0.9 + r * 0.45, 0.045, 0.045, C.white, C.white, 0.5, 'solid', 46 + ((r * 13 + c * 5) % 34));
  }
  meta(s, '12 / 12', 0.55, 0.42, 1.2, { color: C.lightBlue });
  meta(s, '海格汽车人才发展', 0.55, 1.35, 3.5, { color: C.lightBlue });
  title(s, '从组织到岗位\n从岗位到人\n再把发展做下去', 0.55, 2.0, 5.3, 2.45, { fontSize: 41, color: C.white });
  text(s, '这就是时代光华开展人才发展的完整路径。', 0.55, 5.6, 4.9, 0.46, { fontSize: 14.3, color: C.lightBlue });
  line(s, 0.55, 6.55, 5.55, 0, C.white, 0.45);
  meta(s, '时代光华 · 人才发展解决方案', 0.55, 6.75, 3.8, { color: C.lightBlue });
  meta(s, '最后解决三件事', 7.18, 0.55, 3.2);
  const outcomes = [
    ['01', '聚焦哪些岗位', '从组织分析和关键岗位诊断开始，先把范围定准。'],
    ['02', '看清哪些人才', '用岗位标准、评鉴和盘点，看清人才现状与差距。'],
    ['03', '安排下一步发展', '个人差距进发展计划，共性差距进组织培养。']
  ];
  outcomes.forEach((v, i) => {
    const y = 1.45 + i * 1.65;
    line(s, 7.18, y, 5.5, 0, i === 2 ? C.accent : C.grey2, i === 2 ? 1.2 : 0.6);
    title(s, v[0], 7.18, y + 0.24, 0.9, 0.7, { fontSize: 29, color: i === 2 ? C.accent : C.ink });
    text(s, v[1], 8.4, y + 0.27, 3.85, 0.36, { fontSize: 17, color: i === 2 ? C.accent : C.ink, bold: true });
    text(s, v[2], 8.4, y + 0.8, 4.1, 0.52, { fontSize: 12.1, color: C.grey4 });
  });
  meta(s, '时代光华 · TALENT DEVELOPMENT', 9.25, 6.8, 3.45, { align: 'right' });
  addNotes(s,
    ['这套方案最后解决三件事。第一，先知道哪些岗位最值得投入。第二，用同一套标准看清哪些人才更合适、差在哪里。第三，把差距变成个人发展安排或组织培养。', '客户如果要继续往下讨论，我们可以从首期组织范围、关键岗位和盘点人群开始。'],
    '进入首期范围和项目安排讨论'
  );
}

const outName = useCompatFont ? '海格汽车人才发展方案_瑞士风版.pptx' : '海格汽车人才发展方案_瑞士风_苹方版.pptx';
pptx.writeFile({ fileName: path.join(__dirname, outName) });
