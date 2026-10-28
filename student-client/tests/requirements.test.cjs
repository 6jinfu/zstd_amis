const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'requirements.js'), 'utf8'), context);
const R = context.window.LearnerRequirements;

test('管理端五类字段保留任务层级和能力等级，展示不修改来源', () => {
  const standard = {content:{duty:[{n:'客户经营',t:['识别需求','跟进交付']}],exp:['三年相关经验'],cap:[['客户洞察','L4']],pow:['成就导向'],pot:['学习敏锐']}};
  const before = JSON.stringify(standard);
  const html = R.render(standard);
  for (const value of ['职责任务','经历经验','能力要求','动力要求','潜力要求','客户经营','识别需求','跟进交付','L4','成就导向','学习敏锐']) assert.ok(html.includes(value),value);
  assert.equal(JSON.stringify(standard),before);
});

test('12个旧Web岗位逐个映射，不借用其他岗位的指标', () => {
  const source = fs.readFileSync(path.join(root,'student.html'),'utf8');
  const start = source.indexOf('const positionNodes=');
  const nodes = vm.runInNewContext(source.slice(start,source.indexOf('const rankNodes=',start)) + ';positionNodes;');
  assert.equal(nodes.length,12);
  for (const node of nodes) {
    const before = JSON.stringify(node);
    const standard = R.fromLegacy({...node,id:node.code});
    assert.equal(standard.content.cap.length,node.radars?.length ? node.radars.reduce((sum,g)=>sum+g.items.length,0) : node.abilities.length);
    assert.equal(standard.content.duty[0]?.n,node.duty || undefined);
    assert.equal(standard.content.pow.length,0);
    assert.equal(standard.content.pot.length,0);
    assert.equal(JSON.stringify(node),before);
  }
});

test('旧中文/数字等级明确转换，未知等级不补成L3', () => {
  const standard = R.fromLegacy({id:'a',name:'岗位',abilities:[{name:'A',level:'四级'},{name:'B',level:2},{name:'C',level:'专家级'}]});
  assert.equal(JSON.stringify(standard.content.cap),JSON.stringify([['A','L4'],['B','L2'],['C','专家级']]));
  assert.ok(!R.render(standard).includes('<svg'));
});

test('实际H5产品经理快照只采用要求等级，不采用个人结果或前后测', () => {
  const fixtures = JSON.parse(fs.readFileSync(path.join(root,'mobile/data.json'),'utf8'));
  const key = Object.keys(fixtures).find(key=>key.includes('positionSkillsRadarData.do')&&key.includes('fcd0836e5f5e4697a75a0041ea3b5973'));
  const groups = fixtures[key].bizResult;
  const standard = R.fromLegacy({id:'product',name:'产品经理',radars:groups.map(group=>({items:group.skillsRadarList.map(item=>({name:item.skillName,required:item.skillRequiredLevel}))}))});
  assert.equal(standard.content.cap.length,14);
  assert.ok(standard.content.cap.some(([name,level])=>name==='产品市场分析能力'&&level==='L3'));
  assert.ok(!/前测|后测|个人能力/.test(R.render(standard)));
});

test('空内容不画虚构雷达，文本作为内容转义', () => {
  const html = R.render({content:{duty:[{n:'<script>alert(1)</script>',t:[]}],cap:[]}});
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<svg'));
  assert.ok(html.includes('暂未配置动力要求'));
});

test('多套标准保留各自标识与选择，不自动合并要求', () => {
  const standards = [{id:'a',name:'标准A',content:{cap:[['沟通','L3']]}},{id:'b',name:'标准B',description:'专项要求',content:{cap:[['沟通','L4']]}}];
  const selector = R.selector(standards,'b');
  assert.ok(selector.includes('value="b" selected'));
  assert.ok(selector.includes('专项要求'));
  assert.ok(!R.render(standards[0]).includes('L4'));
  assert.ok(!R.render(standards[1]).includes('L3'));
});

test('岗位演示数据覆盖全部节点，五类内容完整且没有测试占位', () => {
  vm.runInContext(fs.readFileSync(path.join(root,'requirements-data.js'),'utf8'),context);
  const data = context.window.LearnerRequirementsData;
  const provenance = JSON.parse(fs.readFileSync(path.join(root,'mobile/provenance.json'),'utf8'));
  let count = 0;
  const ids = new Set();
  provenance.positions.forEach((position,index) => {
    const standards = data.forPosition(position.id);
    assert.equal(standards,data.forPosition(String(index+1).padStart(2,'0')));
    for (const standard of standards) {
      count++;
      assert.ok(!ids.has(standard.id));
      ids.add(standard.id);
      assert.ok(!/测试数据|请忽略|待补充|占位/.test(JSON.stringify(standard)));
      for (const key of ['duty','exp','cap','pow','pot']) assert.ok(standard.content[key].length,position.name+' '+key);
      assert.ok(standard.content.duty.every(item=>item.n&&item.t.length));
      assert.ok(standard.content.cap.length<=20);
      assert.ok(standard.content.cap.every(([name,level])=>name&&/^L[1-5]$/.test(level)));
    }
  });
  assert.equal(count,14);
  assert.equal(data.forPosition('08').length,2);
  assert.equal(data.forPosition('03').length,2);
  assert.equal(data.forPosition('unrelated'),null);
});

test('整套标准的学习方案独立，课程筛选不混入其他方案', () => {
  const [core,growth] = context.window.LearnerRequirementsData.forPosition('08');
  const before = JSON.stringify([core,growth]);
  const corePlan = R.renderPlan(core), growthPlan = R.renderPlan(growth);
  assert.ok(corePlan.includes('完成用户访谈与需求改进提案'));
  assert.ok(corePlan.includes('进入项目'));
  assert.ok(!growthPlan.includes('完成用户访谈与需求改进提案'));
  assert.ok(growthPlan.includes('完成转化漏斗分析与增长实验'));
  assert.ok(growthPlan.includes('暂无关联项目'));
  const optional = R.renderPlan(growth,'optional','../');
  assert.equal((optional.match(/class="standard-course"/g)||[]).length,1);
  assert.ok(optional.includes('内容营销，实现新零售突破的关键环节'));
  assert.ok(!optional.includes('大数据在数字化营销场景的应用'));
  assert.ok(optional.includes('src="../mobile/assets/'));
  assert.equal(JSON.stringify([core,growth]),before);
  assert.ok(R.renderPlan({}).includes('该标准尚未配置学习方案'));
});

test('14套标准方案有对应资源与实践内容，本地封面存在', () => {
  const data = context.window.LearnerRequirementsData;
  for(let i=1;i<=12;i++) for(const standard of data.forPosition(String(i).padStart(2,'0'))) {
    const plan = standard.learningPlan;
    assert.ok(plan.name && plan.courses.length && plan.tasks.length,standard.name);
    assert.equal(new Set(plan.courses.map(item=>item.id)).size,plan.courses.length);
    for(const course of plan.courses) {
      assert.ok(fs.existsSync(path.join(root,course.cover)),course.cover);
      assert.match(course.url,/^https:\/\/v4\.21tb\.com\/courseCenter\//);
    }
    assert.ok(plan.tasks.every(task=>task.name&&task.actions.length&&task.criteria));
  }
});

test('学习方案文本转义且不渲染非HTTPS资源操作', () => {
  const html = R.renderPlan({learningPlan:{name:'<img>',courses:[{name:'<script>',cover:'assets/a.png',url:'javascript:alert(1)'}],tasks:[],projects:[]}});
  assert.ok(html.includes('&lt;img&gt;'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('href="javascript:'));
});
