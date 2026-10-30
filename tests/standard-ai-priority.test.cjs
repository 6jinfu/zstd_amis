const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app/standard-ai-assistant.js'),'utf8');
function priorityContext(items,scores={}) {
  const context={rankedCapabilities:items,capabilityScores:scores};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function sortCapabilitiesByScore'),source.indexOf('  function prioritySummary')),context);
  return context;
}
test('评分降序且同分沿用拖拽顺序，名称/等级不变，不修改原排序',()=>{
  const items=[['项目管理','L4'],['需求分析','L3'],['产品规划','L5'],['数据分析','L2']];
  const before=JSON.stringify(items),scores={'项目管理':4,'需求分析':5,'产品规划':5,'数据分析':2};
  const ctx=priorityContext(items,scores),sorted=ctx.sortCapabilitiesByScore(items,scores);
  assert.equal(JSON.stringify(sorted),JSON.stringify([items[1],items[2],items[0],items[3]]));
  assert.equal(JSON.stringify(items),before);
  assert.ok(ctx.priorityAnalysis('compare')[1].includes('同分项沿用'));
});
test('全部同分保持用户优先级，单项和空项排序不丢失',()=>{
  const ctx=priorityContext([]);
  const items=[['协同沟通','L3'],['目标执行','L4'],['问题解决','L2']];
  assert.equal(JSON.stringify(ctx.sortCapabilitiesByScore(items,Object.fromEntries(items.map(([n])=>[n,3])))),JSON.stringify(items));
  assert.equal(ctx.sortCapabilitiesByScore([],{}).length,0);
  assert.equal(ctx.sortCapabilitiesByScore([items[0]],{'协同沟通':1})[0][1],'L3');
});
test('漏评不能推进，全部评分后才确认；重复确认不触发下一阶段',()=>{
  const context={stage:'compare',priorityItems:[['需求分析','L3'],['产品规划','L3']],capabilityScores:{'需求分析':5},comparisonConfirmed:false,S:{clone:structuredClone}};
  const error={textContent:''};let focused=false,calls=[];
  context.messages={querySelector:()=>error,querySelectorAll:()=>[{dataset:{aiScore:'产品规划'},focus:()=>{focused=true;}}]};
  context.runPriorityAnalysis=kind=>{calls.push(kind);context.stage='priority-thinking';};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function confirmPriority()'),source.indexOf("  messages.addEventListener('pointerdown'")),context);
  context.confirmPriority();assert.ok(error.textContent.includes('每一项'));assert.ok(focused);assert.equal(calls.length,0);
  context.capabilityScores['产品规划']=4;context.confirmPriority();assert.deepEqual(calls,['compare']);assert.equal(context.comparisonConfirmed,true);
  context.confirmPriority();assert.equal(calls.length,1);
});
test('重新开始清空评分、顺序、分析阶段及拖拽状态',()=>{
  const context={priorityItems:[1],rankedCapabilities:[1],capabilityScores:{a:5},comparisonConfirmed:true,priorityPhase:'compare',priorityStep:2,draggedCapability:{name:'a'}};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function resetPriority()'),source.indexOf('  function sortCapabilitiesByScore')),context);
  context.resetPriority();assert.equal(context.priorityItems.length,0);assert.equal(context.rankedCapabilities.length,0);assert.equal(Object.keys(context.capabilityScores).length,0);assert.equal(context.comparisonConfirmed,false);assert.equal(context.priorityPhase,'');assert.equal(context.draggedCapability,null);
});
test('新建产品、通用、销售和算法示例分别提供5/7项，沿用岗位候选且不修改源数据',()=>{
  const context={window:{},S:{clone:structuredClone,read:()=>({categories:['通用标准']})},defaultSections:['duty','exp','cap','pow','pot'],generatedSections:['duty','exp','cap','pow','pot'],feedbackHistory:[],focus:'balanced',sourceStandard:()=>null};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../app/standard-seeds.js'),'utf8'),context);
  vm.runInContext(source.slice(source.indexOf('  const productContent'),source.indexOf('  const T=')),context);
  vm.runInContext(source.slice(source.indexOf('  function build()'),source.indexOf('  function flowLayout')),context);
  const original=JSON.stringify(context.window.STANDARD_POSITION_SEEDS);
  for(const [scenario,position] of [['产品经理',null],['个人贡献者',null],['销售经理',{id:'SA-101',name:'销售经理',category:'销售'}],['算法工程师',{id:'RD-301',name:'高级算法工程师',category:'研发'}]]){
    context.selectedPosition=()=>position;context.brief={scenario,management:'未指定',level:'未指定'};
    for(const [detail,count] of [['concise',5],['regular',7]]){
      context.detail=detail;const cap=context.build().content.cap;
      assert.equal(cap.length,count,scenario+detail);assert.equal(new Set(cap.map(([n])=>n)).size,count);
    }
  }
  assert.equal(JSON.stringify(context.window.STANDARD_POSITION_SEEDS),original);
  context.sourceStandard=()=>({content:{duty:[],exp:[],cap:[['既有能力','L2']],pow:[],pot:[]}});
  assert.equal(JSON.stringify(context.build().content.cap),JSON.stringify([['既有能力','L2']]));
  context.generatedSections=['duty'];assert.equal(context.build().content.cap.length,0);
});
