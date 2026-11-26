const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

function loadManagementContext() {
  const storage = new Map();
  const context = {
    window: {},
    crypto: crypto.webcrypto || crypto,
    localStorage: {
      getItem: k => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v))
    },
    UI: { escape: v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])), uid: p => p + '-1' }
  };
  vm.createContext(context);
  const files = [
    'talent-settings-data.js',
    'indicator-data.js',
    'standard-seeds.js',
    'standards-data.js',
    'standard-ui.js',
    'assessment-data.js',
    'talent-data.js',
    'review-score-import.js',
    'talent-ability-import.js',
    'learning-plan-ai.js',
    'talent-ai-finder.js'
  ];
  for (const name of files) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../app', name), 'utf8'), context);
    Object.assign(context, context.window);
  }
  return context;
}

test('无等级能力指标：词条识别、雷达过滤、360出题与人员能力导入校验', () => {
  const ctx = loadManagementContext();
  assert.equal(ctx.IndicatorDemo.isGraded('SQL 数据查询'), false);
  assert.equal(ctx.IndicatorDemo.isGraded('项目立项规范'), false);
  assert.equal(ctx.IndicatorDemo.isGraded('系统架构'), true);
  assert.ok(ctx.IndicatorDemo.definitionOf('项目立项规范').includes('立项'));

  // 雷达图仅绘制分级能力，无等级能力单独列出
  const radarHtml = ctx.StandardUI.capabilityRadar([
    ['系统架构', 'L4'],
    ['技术选型', 'L4'],
    ['团队管理', 'L3'],
    ['项目立项规范', '']
  ], '测试雷达');
  assert.ok(radarHtml.includes('<svg'));
  assert.equal((radarHtml.match(/class="std-radar-axis"/g) || []).length, 3);
  assert.ok(radarHtml.includes('项目立项规范') && radarHtml.includes('不分级'));

  // 360 评估对无等级能力基于指标定义生成题目，不拼空等级
  const qs = ctx.AssessmentDrafts.generate(['项目立项规范'], { single: 1, multi: 0, score: 1, essay: 0 }, '季度复盘');
  assert.equal(qs.length, 2);
  assert.ok(qs.every(q => q.ability === '项目立项规范' && !q.text.includes('undefined') && !/L\d/.test(q.text)));

  // 人员能力导入：无等级能力禁止填等级、必须填得分
  const people = [{ id: 'p1', employeeId: '0001', name: '张明' }];
  const badGraded = ctx.TalentAbilityImport.validate([{ number: 2, cells: ['0001', '张明', '技能.专业能力.技术簇', 'SQL 数据查询', '3', '85'] }], people);
  assert.equal(badGraded.errors.length, 1);
  const badNoScore = ctx.TalentAbilityImport.validate([{ number: 2, cells: ['0001', '张明', '技能.专业能力.技术簇', 'SQL 数据查询', '', ''] }], people);
  assert.equal(badNoScore.errors.length, 1);
  const validUngraded = ctx.TalentAbilityImport.validate([{ number: 2, cells: ['0001', '张明', '技能.专业能力.技术簇', 'SQL 数据查询', '', '88.5'] }], people);
  assert.equal(validUngraded.errors.length, 0);
  assert.equal(validUngraded.records[0].ungraded, true);
  assert.equal(validUngraded.records[0].level, null);
  assert.equal(validUngraded.records[0].score, 88.5);
});

test('人才标准模板：自由维度组合、快照独立、无能力模板拦截下游', () => {
  const ctx = loadManagementContext();
  const settings = ctx.TalentSettings.read();
  assert.equal(settings.templates.length, 3);
  assert.deepEqual(Array.from(ctx.TalentSettings.defaultTemplate(settings).dimensions), ['duty', 'exp', 'cap', 'pow', 'pot']);

  // 仅含能力、动力、潜力的标准只输出启用维度要求
  const competencyStd = {
    id: 'std-comp',
    name: '素质标准',
    templateId: 'tpl-competency',
    enabledDimensions: ['cap', 'pow', 'pot'],
    content: {
      duty: [{ n: '旧职责', t: ['旧任务'] }],
      exp: ['旧经历'],
      cap: [['系统架构', 'L4'], ['项目立项规范', '']],
      pow: ['成就导向'],
      pot: ['战略思维']
    }
  };
  const reqs = ctx.Talent.requirements(competencyStd);
  assert.ok(!reqs.some(r => r.kind === '职责任务' || r.kind === '经历经验'));
  assert.equal(reqs.filter(r => r.kind === '能力要求').length, 2);

  // 无等级能力在人才档案对比中保留实测分且不计算等级差距
  const tData = ctx.Talent.read();
  const cmp = ctx.Talent.compare(tData, 'zhangming', competencyStd);
  const sysArch = cmp.find(r => r.name === '系统架构');
  const norm = cmp.find(r => r.name === '项目立项规范');
  assert.equal(sysArch.status, '已满足');
  assert.equal(norm.ungraded, true);
  assert.equal(norm.actual.value, 92);
  assert.equal(norm.status, '待补充证据');

  // 不含能力维度的标准在 360 评估中被准确拦截
  const dutyOnlyStd = { id: 'std-duty', name: '职责标准', mode: 'positions', positions: ['RD-302'], enabledDimensions: ['duty', 'exp'], content: { duty: [{ n: '架构评审', t: ['评审方案'] }], exp: ['5年经验'], cap: [] } };
  const resolved = ctx.AssessmentDrafts.resolve(dutyOnlyStd);
  assert.equal(resolved.valid, false);
  assert.ok(resolved.message.includes('未启用“能力要求”'));
});

test('AI 帮建学习资源：匹配平台课程并标记无现成课程的能力，每项资源绑定关联能力', () => {
  const ctx = loadManagementContext();
  const catalog = [
    { kind: '课程', title: '分布式系统架构演进实战', hours: '3 学时', tags: ['系统架构'] },
    { kind: '项目', title: '核心技术骨干架构训练营', hours: '30 天', tags: ['系统架构', '技术选型'] }
  ];
  const plan = ctx.LearningPlanAI.generateResourcePlan({
    targetCaps: ['系统架构', '项目立项规范'],
    allCaps: [['系统架构', 'L4'], ['项目立项规范', '']],
    catalog,
    appeal: ''
  });
  assert.deepEqual(Array.from(plan.unmatchedCourseCaps), ['项目立项规范']);
  const allActs = plan.groups.flatMap(g => g.activities);
  assert.ok(allActs.some(a => a.kind === '课程' && a.capabilities.includes('系统架构')));
  assert.ok(allActs.some(a => a.kind !== '课程' && a.capabilities.includes('项目立项规范')));
  assert.ok(allActs.every(a => Array.isArray(a.capabilities) && a.capabilities.length >= 1));
});

test('AI 帮找人才：联动评鉴证据、盘点分类与 UC 用户履历精准排序', () => {
  const ctx = loadManagementContext();
  const tData = ctx.Talent.read();
  const sData = ctx.Standards.read();
  const criteria = ctx.TalentAIFinder.parseQuery(
    '寻找具备系统架构 L4 及以上、有过核心链路重构或内训授课经验的高潜或核心研发骨干',
    { standardsData: sData, talentData: tData }
  );
  assert.ok(criteria.some(c => c.kind === 'ability' && c.ability === '系统架构' && c.minLevel === 4));
  assert.ok(criteria.some(c => c.kind === 'experience'));
  assert.ok(criteria.some(c => c.kind === 'classification'));

  const ranked = ctx.TalentAIFinder.rankCandidates(ctx.Talent.people, criteria, tData, ctx.Talent);
  assert.equal(ranked[0].person.id, 'zhangming');
  assert.equal(ranked[0].metCount, ranked[0].totalCount);
  assert.ok(ranked[0].matched.some(m => m.kind === 'UC 履历' && m.text.includes('授课记录')));
  assert.ok(ranked[0].agreementNote.includes('首席架构师外部研修服务协议'));
});
