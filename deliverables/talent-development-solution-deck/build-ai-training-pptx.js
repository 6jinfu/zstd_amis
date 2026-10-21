const path = require('node:path');
const pptxgen = require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const FONT = process.argv.includes('--compat') ? 'Hiragino Sans GB' : 'PingFang SC';
const pptx = new pptxgen();
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';
pptx.author = '时代光华';
pptx.company = '时代光华';
pptx.subject = 'AI 驱动岗位画像、资料盘点与学习内容生成';
pptx.title = 'AI 岗位培训内容运营方案';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

const C = {
  paper: 'FAFAF8', white: 'FFFFFF', ink: '0A0A0A', dark: '171717',
  grey1: 'F0F0EE', grey2: 'D4D4D2', grey3: '737373', grey4: '525252',
  blue: '002FA7', pale: 'E8EDFF', cyan: '00A896', cyanPale: 'E4F5F1', orange: 'F15A24'
};
const W = 13.333, H = 7.5, M = 0.65, TOTAL = 11;

function rect(slide, x, y, w, h, fill, lineColor = fill, width = 0.5, radius = 0) {
  slide.addShape(radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x, y, w, h, rectRadius: radius,
    fill: { color: fill }, line: { color: lineColor, width, transparency: lineColor === fill ? 100 : 0 }
  });
}
function line(slide, x, y, w, h, color = C.grey2, width = 0.6, arrow = false, dash = 'solid') {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h,
    line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined }
  });
}
function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h, fontFace: FONT, fontSize: opts.fontSize || 16,
    color: opts.color || C.ink, bold: opts.bold || false,
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
    charSpacing: 1.1, align: opts.align || 'left', valign: 'mid', fit: null
  });
}
function title(slide, value, x, y, w, h, opts = {}) {
  text(slide, value, x, y, w, h, {
    fontSize: opts.fontSize || 38, color: opts.color || C.ink,
    bold: opts.bold || false, valign: opts.valign || 'top'
  });
}
function chrome(slide, left, page, dark = false) {
  meta(slide, left.toUpperCase(), M, 0.42, 9.4, { color: dark ? 'B8B8B5' : C.grey3 });
  meta(slide, `${String(page).padStart(2, '0')} / ${TOTAL}`, W - 1.65, 0.42, 1, {
    color: dark ? 'B8B8B5' : C.grey3, align: 'right'
  });
}
function kicker(slide, value, color = C.grey3) {
  meta(slide, value, M, 0.96, 9.6, { color });
}
function note(slide, paragraphs, transition) {
  slide.addNotes([...paragraphs, '', `接下来：${transition}`].join('\n\n'));
}
function numberBadge(slide, n, x, y, fill = C.blue, color = C.white) {
  rect(slide, x, y, 0.38, 0.38, fill, fill, 0.5, 0.19);
  text(slide, n, x, y + 0.01, 0.38, 0.32, { fontSize: 10.5, color, bold: true, align: 'center', valign: 'mid' });
}
function pill(slide, value, x, y, w, fill = C.pale, color = C.blue) {
  rect(slide, x, y, w, 0.34, fill, fill, 0.5, 0.17);
  text(slide, value, x + 0.1, y + 0.07, w - 0.2, 0.19, { fontSize: 9.5, color, bold: true, align: 'center', valign: 'mid' });
}

// 01 · Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.blue };
  for (let i = 0; i < 13; i++) line(s, 7.25 + i * 0.46, 0, 0, H, 'FFFFFF', 0.22);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) {
    const active = (r + c) % 4 === 0 || (r === 4 && c > 1 && c < 8);
    rect(s, 8.05 + c * 0.43, 1.05 + r * 0.45, 0.055, 0.055, active ? C.cyan : C.white);
  }
  meta(s, 'AI 岗位培训内容运营方案', M, 0.42, 7.5, { color: 'DCE4FF' });
  meta(s, 'SS · 26.09.02 · 01 / 11', 10.15, 0.42, 2.55, { color: 'DCE4FF', align: 'right' });
  meta(s, '时代光华 · AI FOR LEARNING OPERATIONS', M, 1.12, 6.2, { color: 'DCE4FF' });
  title(s, 'AI 驱动岗位培训\n内容运营', M, 1.72, 6.8, 1.8, { fontSize: 51, color: C.white });
  text(s, '岗位画像 → 资料盘点 → 学习内容生成', M, 4.15, 6.4, 0.42, { fontSize: 19, color: C.white, bold: true });
  line(s, M, 5.3, 12.03, 0, C.white, 0.55);
  text(s, '让 AI 承担整理与生成，让业务专家聚焦判断与确认。', M, 5.58, 9.2, 0.42, { fontSize: 16.5, color: C.white });
  meta(s, '重点场景 · 班组长培训 / 销售人员培训', M, 6.7, 6.2, { color: 'DCE4FF' });
  meta(s, '时代光华 · TALENT DEVELOPMENT', 9.05, 6.7, 3.65, { color: 'DCE4FF', align: 'right' });
  note(s, ['这版方案只聚焦一件事：怎样用 AI 把岗位培训内容运营做得更快、更准、更容易持续更新。', '我们沿着岗位画像、资料盘点和内容生成三步展开，再用班组长与销售两个岗位场景验证。'], '先看当前培训运营最耗人的地方');
}

// 02 · Bottlenecks
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '01 · 业务问题 / 人工运营负担', 2);
  kicker(s, '专属培训不是缺内容，而是缺少把内容组织起来的方法');
  title(s, '三类高频人工工作，\n拖慢岗位培训', M, 1.25, 5.25, 1.18, { fontSize: 35 });
  text(s, '每启动一个岗位，培训团队都要重新理解岗位、翻找资料、拼装内容。', M, 2.65, 5.42, 0.52, { fontSize: 12.9, color: C.grey4 });
  const cards = [
    ['01', '岗位靠访谈', '职责与关键任务分散，\n要靠说明书、经验和\n口头表达重新梳理。', '标准不一致'],
    ['02', '资料靠人找', '制度、案例、课程和\n现场文档分散，版本、\n质量难判断。', '重复整理'],
    ['03', '内容靠人拼', '同一份资料反复加工，\n再分别制作课件、练习、\n话术和测验。', '更新速度慢']
  ];
  cards.forEach((v, i) => {
    const x = 6.15 + i * 2.17;
    rect(s, x, 1.45, 1.96, 4.65, i === 1 ? C.dark : C.white, i === 1 ? C.dark : C.grey2, 0.7);
    meta(s, v[0], x + 0.22, 1.75, 0.5, { color: i === 1 ? C.cyan : C.blue });
    text(s, v[1], x + 0.22, 2.2, 1.52, 0.62, { fontSize: 20, color: i === 1 ? C.white : C.ink, bold: true });
    line(s, x + 0.22, 3.04, 1.52, 0, i === 1 ? '565656' : C.grey2, 0.5);
    text(s, v[2], x + 0.22, 3.34, 1.52, 1.25, { fontSize: 10.8, color: i === 1 ? 'D2D2CF' : C.grey4 });
    pill(s, v[3], x + 0.22, 5.27, 1.52, i === 1 ? C.cyan : C.pale, i === 1 ? C.white : C.blue);
  });
  rect(s, M, 5.55, 4.75, 0.56, C.pale);
  text(s, '目标：AI 完成“读、理、写”，人工只做关键判断。', M + 0.2, 5.71, 4.35, 0.24, { fontSize: 12.2, color: C.blue, bold: true });
  meta(s, '减负不等于无人审核', M, 6.74, 4.8, { color: C.grey3 });
  note(s, ['当前最消耗培训运营的不是发布课程，而是前面的理解、整理和加工。', 'AI 的作用不是替代业务专家，而是先把重复劳动做完，让专家把时间放在岗位重点、案例真实性和发布判断上。'], '用一张图看清三步 AI 流程');
}

// 03 · Workflow
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  chrome(s, '02 · 总体方案 / 三步 AI 流程', 3, true);
  kicker(s, '一套输入，形成可持续更新的岗位学习内容链', 'B8B8B5');
  title(s, '三步 AI 流程，\n一个人工发布闸口', M, 1.23, 5.3, 1.12, { fontSize: 36, color: C.white });
  const steps = [
    ['01', '岗位画像', '明确关键任务、场景、能力与标准', '岗位训练蓝图'],
    ['02', '资料盘点', '识别可用资料、版本、质量与缺口', '岗位知识底座'],
    ['03', '内容生成', '按训练目标生成多形态学习内容', '岗位学习方案']
  ];
  steps.forEach((v, i) => {
    const x = M + i * 3.25;
    rect(s, x, 3.15, 2.88, 2.26, i === 1 ? C.blue : '232323', i === 1 ? C.blue : '565656', 0.7);
    numberBadge(s, v[0], x + 0.22, 3.42, i === 1 ? C.cyan : C.blue);
    text(s, v[1], x + 0.22, 4.0, 2.35, 0.37, { fontSize: 20, color: C.white, bold: true });
    text(s, v[2], x + 0.22, 4.45, 2.4, 0.46, { fontSize: 10.8, color: 'CDCDCA' });
    meta(s, v[3], x + 0.22, 5.07, 2.4, { color: i === 1 ? C.white : C.cyan });
    if (i < 2) line(s, x + 2.88, 4.29, 0.37, 0, C.cyan, 1.1, true);
  });
  rect(s, 10.42, 3.15, 2.26, 2.26, C.paper, C.paper, 0.5);
  meta(s, 'HUMAN GATE', 10.68, 3.48, 1.76, { color: C.blue });
  text(s, '业务专家\n确认发布', 10.68, 3.96, 1.76, 0.82, { fontSize: 21, bold: true });
  text(s, '确认重点、事实、权限与适用范围', 10.68, 4.9, 1.67, 0.38, { fontSize: 9.8, color: C.grey4 });
  line(s, 9.95, 4.29, 0.47, 0, C.cyan, 1.1, true);
  rect(s, M, 5.86, 12.03, 0.56, '242424');
  text(s, '发布后的学习反馈、业务变化与新资料，继续回流到画像和内容更新。', M + 0.22, 6.02, 8.9, 0.24, { fontSize: 12.1, color: C.white });
  meta(s, '不是一次生成，而是一条持续运营链', 9.12, 6.05, 3.32, { color: C.cyan, align: 'right' });
  note(s, ['三步流程先形成岗位训练蓝图，再把分散资料变成岗位知识底座，最后生成岗位学习方案。', '所有内容在发布前都经过业务专家确认。发布后的反馈与新增资料继续回流，支持持续更新。'], '第一步，AI 如何生成可训练的岗位画像');
}

// 04 · Job profile
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '03 · 岗位画像 / 从岗位描述到训练蓝图', 4);
  kicker(s, '画像不是岗位介绍，而是后续资料与内容的共同索引');
  title(s, '把岗位要求翻译成\n“要训练什么”', M, 1.23, 5.3, 1.1, { fontSize: 35 });
  const inputs = [['岗位说明书', '职责与任职要求'], ['业务访谈', '高频场景与难题'], ['流程制度', '关键步骤与红线'], ['绩效案例', '优秀与常见偏差']];
  inputs.forEach((v, i) => {
    const y = 2.78 + i * 0.68;
    meta(s, `0${i + 1}`, M, y + 0.1, 0.38, { color: C.blue });
    text(s, v[0], M + 0.48, y, 1.48, 0.29, { fontSize: 12.8, bold: true });
    text(s, v[1], M + 2.02, y + 0.01, 2.55, 0.27, { fontSize: 10.8, color: C.grey4 });
    line(s, M + 0.48, y + 0.48, 4.05, 0, C.grey2, 0.45);
  });
  rect(s, 5.65, 1.52, 2.15, 4.82, C.blue);
  meta(s, 'AI PROFILE ENGINE', 5.92, 1.87, 1.6, { color: 'DCE4FF', align: 'center' });
  ['提取', '聚类', '校验', '映射'].forEach((v, i) => {
    rect(s, 6.02, 2.69 + i * 0.53, 0.07, 0.07, i % 2 ? C.white : C.cyan);
    text(s, v, 6.2, 2.59 + i * 0.53, 0.98, 0.31, { fontSize: 15.8, color: C.white, bold: true, align: 'center', valign: 'mid' });
  });
  pill(s, '人工校准', 6.05, 5.48, 1.35, C.cyan, C.white);
  const outputs = [
    ['关键任务', '这个岗位必须完成什么'], ['典型场景', '在什么情境下完成'],
    ['能力标准', '做到什么程度算胜任'], ['训练优先级', '先训练哪些高风险或高频任务']
  ];
  outputs.forEach((v, i) => {
    const x = 8.28 + (i % 2) * 2.17, y = 1.77 + Math.floor(i / 2) * 2.15;
    rect(s, x, y, 1.94, 1.8, i === 3 ? C.cyanPale : C.white, i === 3 ? C.cyan : C.grey2, i === 3 ? 1 : 0.65);
    meta(s, `0${i + 1}`, x + 0.18, y + 0.24, 0.35, { color: i === 3 ? C.cyan : C.blue });
    text(s, v[0], x + 0.18, y + 0.65, 1.58, 0.3, { fontSize: 14.2, bold: true });
    text(s, v[1], x + 0.18, y + 1.09, 1.58, 0.46, { fontSize: 10, color: C.grey4 });
  });
  rect(s, 8.28, 6.08, 4.11, 0.46, C.grey1);
  meta(s, '输出同时作为资料标签体系与内容生成提示词骨架', 8.48, 6.19, 3.71, { color: C.blue, align: 'center' });
  note(s, ['岗位画像的关键不是写一段漂亮的岗位介绍，而是形成可以直接驱动训练的结构。', 'AI 从岗位说明书、业务访谈、流程制度与绩效案例中提取关键任务和典型场景，业务专家校准后形成训练优先级。'], '第二步，盘点现有资料是否能支撑这些训练任务');
}

// 05 · Material inventory
{
  const s = pptx.addSlide();
  s.background = { color: C.grey1 };
  chrome(s, '04 · 资料盘点 / 建立岗位知识底座', 5);
  kicker(s, '先把已有资产看清楚，再决定需要生成什么');
  title(s, '让 AI 完成资料的\n识别、归类与体检', M, 1.2, 5.0, 1.05, { fontSize: 35 });
  const sourceLabels = ['制度流程', '产品资料', '课程课件', '案例复盘', '话术工具', '考试题库'];
  sourceLabels.forEach((v, i) => {
    const x = M + (i % 2) * 2.2, y = 2.7 + Math.floor(i / 2) * 0.7;
    rect(s, x, y, 1.92, 0.5, C.white, C.grey2, 0.55);
    text(s, v, x + 0.16, y + 0.13, 1.6, 0.22, { fontSize: 11.6, bold: true });
  });
  line(s, 5.0, 3.7, 0.65, 0, C.blue, 1.1, true);
  rect(s, 5.65, 2.3, 1.72, 2.82, C.dark);
  meta(s, 'AI INVENTORY', 5.88, 2.65, 1.25, { color: C.cyan, align: 'center' });
  text(s, '解析\n去重\n打标\n评质', 6.02, 3.14, 0.98, 1.47, { fontSize: 18, color: C.white, bold: true, align: 'center', valign: 'mid' });
  line(s, 7.37, 3.7, 0.65, 0, C.blue, 1.1, true);
  const rows = [
    ['岗位任务覆盖', '已覆盖 / 部分覆盖 / 缺失', 0.84],
    ['内容有效性', '现行 / 待复核 / 过期', 0.69],
    ['内容质量', '可直接用 / 需改写 / 仅参考', 0.56],
    ['使用权限', '公开 / 内部 / 限定岗位', 0.76]
  ];
  rows.forEach((v, i) => {
    const y = 2.03 + i * 0.89;
    text(s, v[0], 8.03, y, 1.55, 0.28, { fontSize: 12.2, bold: true });
    text(s, v[1], 9.62, y + 0.01, 2.58, 0.25, { fontSize: 10.3, color: C.grey4 });
    rect(s, 8.03, y + 0.39, 4.18, 0.12, C.white);
    rect(s, 8.03, y + 0.39, 4.18 * v[2], 0.12, i === 2 ? C.orange : C.blue);
  });
  rect(s, 8.03, 5.68, 4.18, 0.75, C.pale);
  text(s, '输出：资料目录 + 标签 + 版本 +\n质量等级 + 内容缺口地图', 8.24, 5.82, 3.77, 0.48, { fontSize: 10.8, color: C.blue, bold: true, align: 'center', valign: 'mid' });
  rect(s, M, 5.32, 6.72, 1.11, C.white, C.grey2, 0.6);
  meta(s, '关键原则', M + 0.2, 5.55, 1.05, { color: C.blue });
  text(s, '有资料先复用；资料不足再生成；事实冲突必须交给专家确认。', M + 1.35, 5.48, 5.1, 0.46, { fontSize: 12.2, bold: true });
  note(s, ['资料盘点先解决复用问题。AI 自动解析不同类型的文档，按岗位任务归类，并识别版本、重复、质量和权限。', '最终不是得到一个文件清单，而是得到一张内容缺口地图：哪些任务已有材料，哪些需要改写，哪些必须补充生成。'], '第三步，把缺口和可用资料转成学习内容');
}

// 06 · Content generation
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '05 · 内容生成 / 一源多形态', 6);
  kicker(s, '围绕岗位任务生成，而不是围绕文档做摘要');
  title(s, '一套岗位知识底座，\n生成多种学习内容', M, 1.2, 5.15, 1.08, { fontSize: 35 });
  const left = [
    ['训练目标', '来自岗位画像'], ['事实素材', '来自已确认资料'],
    ['适用人群', '岗位、级别与场景'], ['内容约束', '口径、权限与时长']
  ];
  left.forEach((v, i) => {
    const y = 2.7 + i * 0.68;
    numberBadge(s, `0${i + 1}`, M, y, i === 2 ? C.cyan : C.blue);
    text(s, v[0], M + 0.52, y - 0.01, 1.35, 0.26, { fontSize: 12.4, bold: true });
    text(s, v[1], M + 1.9, y + 0.01, 2.8, 0.25, { fontSize: 10.6, color: C.grey4 });
  });
  line(s, 5.35, 3.8, 0.58, 0, C.cyan, 1.2, true);
  rect(s, 5.93, 2.34, 1.85, 3.03, C.blue);
  meta(s, 'CONTENT FACTORY', 6.15, 2.72, 1.42, { color: 'DCE4FF', align: 'center' });
  text(s, '拆解任务\n组合素材\n适配难度\n生成初稿', 6.18, 3.18, 1.35, 1.48, { fontSize: 16.7, color: C.white, bold: true, align: 'center', valign: 'mid' });
  pill(s, '引用可追溯', 6.18, 4.82, 1.35, C.cyan, C.white);
  line(s, 7.78, 3.8, 0.58, 0, C.cyan, 1.2, true);
  const outputs = [
    ['微课脚本', '讲清概念与步骤'], ['情境案例', '还原岗位判断'], ['练习任务', '在工作中做一次'],
    ['话术 / SOP', '随用随查'], ['测验题', '验证是否掌握'], ['更新包', '新资料触发修订建议']
  ];
  outputs.forEach((v, i) => {
    const x = 8.36 + (i % 2) * 2.08, y = 1.55 + Math.floor(i / 2) * 1.52;
    rect(s, x, y, 1.86, 1.32, i === 4 ? C.cyanPale : C.white, i === 4 ? C.cyan : C.grey2, i === 4 ? 1 : 0.6);
    text(s, v[0], x + 0.17, y + 0.24, 1.5, 0.28, { fontSize: 13.2, bold: true });
    text(s, v[1], x + 0.17, y + 0.7, 1.5, 0.33, { fontSize: 9.7, color: C.grey4 });
  });
  rect(s, M, 6.1, 12.03, 0.48, C.grey1);
  text(s, '每份生成内容都绑定：岗位任务、来源资料、适用场景、审核人和版本。', M + 0.2, 6.23, 8.9, 0.23, { fontSize: 11.8, color: C.grey4 });
  meta(s, '生成得快，也要知道依据是什么', 9.35, 6.26, 3.05, { color: C.blue, align: 'right' });
  note(s, ['内容生成不是把文档总结成一篇文章，而是围绕岗位任务和训练目标重新组织。', '同一套知识底座可以生成微课、案例、练习、话术、测验和后续更新包，并保留来源和版本。'], '先看班组长培训如何落地');
}

// 07 · Frontline supervisor
{
  const s = pptx.addSlide();
  s.background = { color: C.grey1 };
  chrome(s, '06 · 专属场景 / 班组长培训', 7);
  kicker(s, '围绕现场管理任务，形成 30 天上岗训练路径');
  title(s, '班组长：从“会干活”\n到“带好一个班组”', M, 1.18, 5.55, 1.08, { fontSize: 34 });
  text(s, 'AI 把分散的制度、现场案例和优秀班组经验，\n组织成每天可执行的训练任务。', M, 2.46, 5.65, 0.5, { fontSize: 12.6, color: C.grey4 });
  const profile = [['关键任务', '排班交接 / 安全质量 / 异常处置 / 班组辅导'], ['重点资料', '作业标准 / 安全制度 / 质量案例 / 班前会记录'], ['内容形态', '微课 / 情境题 / 班前会卡 / 现场观察表']];
  profile.forEach((v, i) => {
    const y = 3.18 + i * 0.79;
    meta(s, `0${i + 1}`, M, y + 0.1, 0.38, { color: C.blue });
    text(s, v[0], M + 0.48, y, 1.25, 0.3, { fontSize: 12.3, bold: true });
    text(s, v[1], M + 1.75, y + 0.01, 3.65, 0.43, { fontSize: 10.6, color: C.grey4 });
    line(s, M + 0.48, y + 0.56, 4.75, 0, C.grey2, 0.45);
  });
  rect(s, M, 5.84, 5.37, 0.53, C.pale);
  text(s, '运营人员只需确认：岗位重点、案例真实性、现场工具可执行。', M + 0.18, 5.99, 5.01, 0.24, { fontSize: 11.2, color: C.blue, bold: true });
  const phases = [
    ['D01–03', '角色切换', '班组长职责、交接班与现场红线'],
    ['D04–10', '稳住现场', '安全、质量、产能与异常快速处置'],
    ['D11–20', '带好团队', '班前会、反馈、辅导与冲突处理'],
    ['D21–30', '改善闭环', '问题分析、改善提案与成果复盘']
  ];
  phases.forEach((v, i) => {
    const x = 6.45 + (i % 2) * 3.05, y = 1.5 + Math.floor(i / 2) * 2.35;
    rect(s, x, y, 2.78, 2.0, i === 3 ? C.blue : C.white, i === 3 ? C.blue : C.grey2, 0.65);
    meta(s, v[0], x + 0.22, y + 0.28, 1.1, { color: i === 3 ? C.cyan : C.blue });
    text(s, v[1], x + 0.22, y + 0.72, 2.3, 0.34, { fontSize: 16.2, color: i === 3 ? C.white : C.ink, bold: true });
    text(s, v[2], x + 0.22, y + 1.21, 2.32, 0.46, { fontSize: 10.2, color: i === 3 ? 'DCE4FF' : C.grey4 });
  });
  note(s, ['班组长培训以现场任务为主线。AI 先生成岗位画像，再把作业标准、安全制度、质量案例和班前会记录做资料盘点。', '最后生成 30 天训练路径，以及微课、情境题、班前会卡和现场观察表。运营人员重点确认现场是否真实、工具是否可执行。'], '再看销售人员如何形成战训一体内容');
}

// 08 · Sales
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '07 · 专属场景 / 销售人员培训', 8);
  kicker(s, '围绕销售关键动作，形成 21 天战训路径');
  title(s, '销售人员：从“知道产品”\n到“赢下真实机会”', M, 1.18, 6.0, 1.08, { fontSize: 34 });
  text(s, 'AI 将产品、案例、客户异议与优秀话术按销售阶段重组，并持续吸收一线反馈。', M, 2.48, 6.8, 0.42, { fontSize: 12.7, color: C.grey4 });
  const stages = [
    ['01', '识别机会', '行业线索 / 客户画像'], ['02', '发现需求', '访谈问题 / 痛点判断'],
    ['03', '形成方案', '产品价值 / 方案组合'], ['04', '处理异议', '竞品对比 / 常见异议'],
    ['05', '推进成交', '关键人 / 下一步承诺']
  ];
  stages.forEach((v, i) => {
    const x = M + i * 2.42;
    rect(s, x, 3.32, 2.15, 1.48, i === 3 ? C.blue : C.white, i === 3 ? C.blue : C.grey2, 0.65);
    meta(s, v[0], x + 0.17, 3.56, 0.35, { color: i === 3 ? C.cyan : C.blue });
    text(s, v[1], x + 0.17, 3.93, 1.76, 0.3, { fontSize: 14.3, color: i === 3 ? C.white : C.ink, bold: true });
    text(s, v[2], x + 0.17, 4.34, 1.76, 0.27, { fontSize: 9.7, color: i === 3 ? 'DCE4FF' : C.grey4 });
    if (i < 4) line(s, x + 2.15, 4.06, 0.27, 0, C.cyan, 1, true);
  });
  const training = [
    ['D01–05', '知识校准', '产品与行业微课 + 快速测验'],
    ['D06–12', '场景演练', '客户访谈、方案表达与异议陪练'],
    ['D13–21', '实战转化', '真实商机任务 + 经理点评 + 案例沉淀']
  ];
  training.forEach((v, i) => {
    const x = M + i * 4.0;
    rect(s, x, 5.3, 3.7, 1.05, i === 1 ? C.cyanPale : C.grey1, i === 1 ? C.cyan : C.grey1, i === 1 ? 1 : 0.5);
    meta(s, v[0], x + 0.18, 5.53, 0.8, { color: i === 1 ? C.cyan : C.blue });
    text(s, v[1], x + 1.02, 5.45, 1.05, 0.28, { fontSize: 12.6, bold: true });
    text(s, v[2], x + 1.02, 5.81, 2.46, 0.27, { fontSize: 9.7, color: C.grey4 });
  });
  meta(s, '新增产品、竞品变化和成功案例可触发内容更新建议', M, 6.78, 8.0, { color: C.blue });
  note(s, ['销售培训围绕销售阶段组织内容，而不是按资料类型堆课程。', 'AI 把产品资料、行业案例、客户异议与优秀话术重组为 21 天战训路径，并支持新增产品、竞品变化和成功案例触发更新建议。'], '两类场景背后需要同一套人机协同机制');
}

// 09 · Human-AI collaboration
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  chrome(s, '08 · 运营机制 / 人机协同', 9, true);
  kicker(s, 'AI 做重活，业务专家把关关键判断', 'B8B8B5');
  title(s, '不是让 AI 替人负责，\n而是让人只负责重要的事', M, 1.2, 7.1, 1.1, { fontSize: 35, color: C.white });
  const lanes = [
    { label: 'AI', color: C.blue, items: ['读岗位与资料', '抽取和打标', '生成内容初稿', '发现变化并建议更新'] },
    { label: '业务专家', color: C.cyan, items: ['确认关键任务', '核验业务事实', '判断案例与难度', '批准发布与更新'] },
    { label: '培训运营', color: C.white, items: ['选择试点岗位', '组织评审', '配置学习路径', '看数据并持续优化'] }
  ];
  lanes.forEach((lane, row) => {
    const y = 2.82 + row * 1.13;
    rect(s, M, y, 1.55, 0.83, row === 2 ? '2A2A2A' : lane.color, row === 2 ? '686868' : lane.color, 0.6);
    text(s, lane.label, M + 0.18, y + 0.24, 1.19, 0.28, { fontSize: 13.5, color: row === 2 ? C.white : (row === 1 ? C.white : C.white), bold: true, align: 'center' });
    lane.items.forEach((item, i) => {
      const x = 2.55 + i * 2.5;
      rect(s, x, y, 2.18, 0.83, row === 0 ? '232A3E' : row === 1 ? '183B36' : '242424', row === 0 ? '3C568F' : row === 1 ? '2B7467' : '565656', 0.55);
      text(s, item, x + 0.16, y + 0.25, 1.86, 0.28, { fontSize: 11.1, color: C.white, bold: row === 1 });
      if (i < 3) line(s, x + 2.18, y + 0.42, 0.32, 0, row === 1 ? C.cyan : '767676', 0.85, true);
    });
  });
  rect(s, M, 6.3, 12.03, 0.5, '242424');
  meta(s, '四条发布红线', M + 0.18, 6.44, 1.35, { color: C.cyan });
  text(s, '事实有来源 · 内容有版本 · 权限有边界 · 发布有负责人', M + 1.58, 6.38, 7.7, 0.28, { fontSize: 12.1, color: C.white, bold: true });
  meta(s, '过程可追溯', 10.05, 6.45, 2.28, { color: 'B8B8B5', align: 'right' });
  note(s, ['人机协同按照职责拆分。AI 负责读取、整理、生成和提醒更新；业务专家负责关键任务、事实、案例难度和发布判断；培训运营负责试点、评审、配置和优化。', '所有发布内容必须有来源、版本、权限边界和负责人。'], '最后看如何用一个小范围试点验证价值');
}

// 10 · Pilot
{
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  chrome(s, '09 · 试点落地 / 两类岗位并行验证', 10);
  kicker(s, '先跑通闭环，再复制到更多岗位');
  title(s, '8 周完成首轮试点，\n用过程指标验收', M, 1.2, 5.2, 1.05, { fontSize: 35 });
  const weeks = [
    ['W01', '准备', '选岗位、定专家、收资料'], ['W02–03', '画像', '生成并确认训练蓝图'],
    ['W04', '盘点', '建资料库与缺口地图'], ['W05–06', '生成', '生成内容并完成评审'],
    ['W07–08', '投放', '班组长与销售试学复盘']
  ];
  weeks.forEach((v, i) => {
    const x = M + i * 2.42;
    rect(s, x, 2.65, 2.13, 1.42, i === 3 ? C.blue : C.grey1, i === 3 ? C.blue : C.grey1, 0.5);
    meta(s, v[0], x + 0.17, 2.88, 0.76, { color: i === 3 ? C.cyan : C.blue });
    text(s, v[1], x + 0.17, 3.23, 1.76, 0.28, { fontSize: 13.6, color: i === 3 ? C.white : C.ink, bold: true });
    text(s, v[2], x + 0.17, 3.63, 1.76, 0.27, { fontSize: 9.5, color: i === 3 ? 'DCE4FF' : C.grey4 });
    if (i < 4) line(s, x + 2.13, 3.36, 0.29, 0, C.cyan, 0.95, true);
  });
  const metrics = [
    ['01', '画像可用性', '专家一次评审通过率'], ['02', '资料复用率', '生成内容引用既有资料比例'],
    ['03', '运营减负', '人工整理与初稿工时变化'], ['04', '内容时效', '资料变化到更新建议的周期']
  ];
  metrics.forEach((v, i) => {
    const x = M + i * 3.0;
    rect(s, x, 4.65, 2.72, 1.43, C.white, C.grey2, 0.65);
    meta(s, v[0], x + 0.18, 4.91, 0.38, { color: i === 2 ? C.cyan : C.blue });
    text(s, v[1], x + 0.18, 5.27, 2.3, 0.27, { fontSize: 13.5, bold: true });
    text(s, v[2], x + 0.18, 5.65, 2.3, 0.27, { fontSize: 9.7, color: C.grey4 });
  });
  rect(s, M, 6.42, 12.03, 0.38, C.cyanPale);
  meta(s, '首轮只验证闭环与减负，不追求一次覆盖全部岗位和全部历史资料', M + 0.18, 6.5, 11.67, { color: C.cyan, align: 'center' });
  note(s, ['建议用班组长和销售两个岗位并行试点，八周完成从画像到投放的首轮闭环。', '验收重点看画像可用性、资料复用率、人工工时变化和内容更新时效。首轮不追求一次覆盖全部岗位和全部历史资料。'], '用一句话收束这套方案');
}

// 11 · Closing
{
  const s = pptx.addSlide();
  s.background = { color: C.blue };
  meta(s, 'AI 岗位培训内容运营方案', M, 0.42, 7.2, { color: 'DCE4FF' });
  meta(s, '11 / 11', 11.65, 0.42, 1.05, { color: 'DCE4FF', align: 'right' });
  meta(s, '从一次性做课，转向持续运营岗位知识', M, 1.16, 7.2, { color: 'DCE4FF' });
  title(s, '一岗一画像\n一库一盘点\n一需一内容', M, 1.72, 6.35, 2.2, { fontSize: 48, color: C.white });
  const close = [
    ['01', '岗位画像', '明确岗位到底要训练什么'],
    ['02', '资料盘点', '知道什么可复用、什么需补齐'],
    ['03', '内容生成', '按场景快速形成可用学习内容']
  ];
  close.forEach((v, i) => {
    const y = 1.72 + i * 1.32;
    meta(s, v[0], 8.07, y + 0.06, 0.42, { color: C.cyan });
    text(s, v[1], 8.65, y, 1.48, 0.31, { fontSize: 14.8, color: C.white, bold: true });
    text(s, v[2], 10.18, y + 0.01, 2.25, 0.36, { fontSize: 10.2, color: 'DCE4FF' });
    line(s, 8.07, y + 0.67, 4.35, 0, '7790D4', 0.45);
  });
  line(s, M, 5.72, 12.03, 0, C.white, 0.55);
  text(s, 'AI 先做重活，专家负责判断，培训运营从“做内容”转向“运营能力”。', M, 6.0, 10.6, 0.42, { fontSize: 16.2, color: C.white });
  meta(s, '时代光华 · TALENT DEVELOPMENT', 9.05, 6.74, 3.65, { color: 'DCE4FF', align: 'right' });
  note(s, ['这套方案最终形成三个稳定能力：每个岗位有训练画像，每类资料有清晰盘点，每个训练需求都能快速形成内容。', 'AI 先做重活，专家负责判断，培训运营从反复做内容转向持续运营岗位能力。'], '进入试点岗位与资料范围确认');
}

const outName = process.argv.includes('--compat')
  ? 'AI岗位培训内容运营方案_兼容字体版.pptx'
  : 'AI岗位培训内容运营方案_瑞士风版.pptx';

pptx.writeFile({ fileName: path.join(__dirname, outName) });
