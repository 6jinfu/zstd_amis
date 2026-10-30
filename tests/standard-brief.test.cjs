const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app/standard-ai-assistant.js'),'utf8');
const ctx=vm.createContext({e:value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')});
vm.runInContext(source.slice(source.indexOf('  function interpretBrief'),source.indexOf('  function build()')),ctx);
const interpret=(...args)=>JSON.parse(JSON.stringify(ctx.interpretBrief(...args)));
test('将明确背景、工作和目标拆开，保留用户原始数字与业务含义',()=>{
  const result=interpret('我们是企业培训SaaS平台，给初级销售经理建模。主要负责拓展企业客户、跟进商机，希望提高客户转化率至25%，达成季度销售目标。');
  assert.deepEqual(result.context,['企业培训SaaS平台','初级销售经理']);
  assert.deepEqual(result.actions,['拓展企业客户、跟进商机']);
  assert.deepEqual(result.outcomes,['提高客户转化率至25%','达成季度销售目标']);
});
test('多轮补充保留已知内容，明确改目标只替换目标并去重',()=>{
  const result=interpret('企业培训平台的初级销售经理建模',['主要负责客户分层、跟进商机，希望提高客户转化率','主要负责客户分层、跟进商机','目标改为：达成季度续费目标']);
  assert.deepEqual(result.context,['企业培训平台的初级销售经理']);
  assert.deepEqual(result.actions,['客户分层、跟进商机']);
  assert.deepEqual(result.outcomes,['达成季度续费目标']);
});
test('后续生成使用确认后的理解，不把已替换的旧目标继续带入业务场景',()=>{
  ctx.originalRequest='销售经理建模，希望提高新客转化率';ctx.reviewFeedbackHistory=['主要负责老客续费','目标改为：达成季度续费目标'];ctx.selectedPosition=()=>null;ctx.brief={scenario:'旧场景'};
  ctx.syncBriefScenario();
  assert.ok(ctx.brief.scenario.includes('需要老客续费'));assert.ok(ctx.brief.scenario.includes('期望达成季度续费目标'));assert.equal(ctx.brief.scenario.includes('提高新客转化率'),false);
});
test('缺少的信息保持为空，已选择岗位可作为背景，不虚构行为或业绩目标',()=>{
  const result=interpret('入职三年的产品经理的能力建模');
  assert.equal(result.actions.length,0);assert.equal(result.outcomes.length,0);
  assert.deepEqual(interpret('帮我建立一套人才标准',[],'架构师').context,['架构师']);
  assert.deepEqual(interpret('帮我建立一套人才标准').context,[]);
});
test('兼容明确维度输入、无标点能力描述与否定职责，呈现不使用生硬维度标题',()=>{
  const explicit=interpret('情景：电商促销高峰；动作：协调仓配与客服；结果：降低履约延迟');
  assert.deepEqual(explicit,{context:['电商促销高峰'],actions:['协调仓配与客服'],outcomes:['降低履约延迟']});
  const natural=interpret('产品专员能够独立完成基本产品设计工作，不负责商务谈判');
  assert.deepEqual(natural.context,['产品专员']);assert.deepEqual(natural.actions,['能够独立完成基本产品设计工作','不负责商务谈判']);
  const html=ctx.understandingMarkup(explicit);
  assert.equal((html.match(/<svg /g)||[]).length,3);assert.equal(html.includes('情景：'),false);assert.equal(html.includes('动作：'),false);assert.equal(html.includes('结果：'),false);
});
test('卡片转义用户文本，补充职责与目标不因同时修改管理范围而丢失',()=>{
  const html=ctx.understandingMarkup(interpret('<img src=x onerror=alert(1)>'));
  assert.ok(html.includes('&lt;img'));assert.equal(html.includes('<img'),false);
  const state=vm.createContext({positionSelect:{value:''},inferPosition:()=>null,brief:{level:'未指定',management:'未指定',scenario:'原场景'},generatedSections:['cap'],sourceId:'',selectedPosition:()=>null});
  vm.runInContext(source.slice(source.indexOf('  function applyReviewFeedback'),source.indexOf('  function submitFollowup')),state);
  const value='带团队，主要负责跟进商机，希望达成季度销售目标';state.applyReviewFeedback(value);
  assert.equal(state.brief.management,'带团队');assert.ok(state.brief.scenario.includes(value));
});
