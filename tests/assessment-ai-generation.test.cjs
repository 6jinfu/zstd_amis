const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app/assessment-ai-assistant.js'),'utf8');
const dataSource=fs.readFileSync(path.join(__dirname,'../app/assessment-data.js'),'utf8');
function setup(){
  const standard={id:'std-1',name:'管理能力标准',mode:'positions',positions:['P1'],groups:[],content:{cap:[['团队管理','L3'],['系统架构','L4']]}};
  const queue=[],errors=[];
  const context=vm.createContext({window:{},standard,selected:['团队管理','系统架构'],counts:{single:1,multi:0,score:1,essay:0},scenario:'跨部门项目交付',purpose:'',sourceContent:null,scope:null,scopeLabel:'',title:'',generatedCounts:null,questions:[],turns:[],phase:'review',generation:null,generationTimer:0,S:{read:()=>({standards:[standard]}),clone:structuredClone},error:message=>errors.push(message),render:()=>{},updateGeneration:()=>{},setTimeout:callback=>{queue.push(callback);return queue.length;},clearTimeout:()=>{}});
  vm.runInContext(dataSource,context);context.A=context.window.AssessmentDrafts;context.A.resolve=()=>({valid:true,label:'项目负责人'});
  vm.runInContext(source.slice(source.indexOf('  function checkQuestions'),source.indexOf('  function submit()')),context);
  return {context,queue,errors,tick:()=>queue.shift()?.(),flush:()=>{while(queue.length)queue.shift()();}};
}
test('按能力批次推进，检查通过前不交付半成品，重复点击不启动第二次生成',()=>{
  const {context:c,queue,tick,flush}=setup();
  c.generate();assert.equal(c.phase,'generating');assert.equal(c.questions.length,0);assert.equal(c.generation.index,0);
  const turns=c.turns.length;c.generate();assert.equal(queue.length,1);assert.equal(c.turns.length,turns);
  tick();assert.equal(c.generation.index,1);assert.equal(c.generation.questions.length,2);assert.equal(c.questions.length,0);
  tick();assert.equal(c.generation.index,2);assert.equal(c.questions.length,0);assert.equal(c.phase,'generating');
  flush();assert.equal(c.phase,'draft');assert.equal(c.questions.length,4);assert.equal(c.generation,null);
  assert.equal(new Set(c.questions.map(q=>q.id)).size,4);assert.equal(c.turns.at(-1).kind,'generation');assert.equal(c.turns.at(-1).abilities.length,2);
});
test('已开始任务固定本次题数，取消后旧回调不能回填其他会话',()=>{
  const {context:c,tick,flush}=setup();c.generate();c.counts.single=5;tick();assert.equal(c.generation.questions.length,2);
  c.stopGeneration();c.phase='welcome';flush();assert.equal(c.phase,'welcome');assert.equal(c.questions.length,0);assert.equal(c.generation,null);
});
test('题型数量、能力范围、题干与选项不完整时检查失败',()=>{
  const {context:c}=setup(),abilities=['团队管理'],counts={single:1,multi:0,score:0,essay:0};
  const q={id:'q1',ability:'团队管理',type:'single',text:'题干',options:['选项一','选项二']};
  assert.equal(c.checkQuestions([q],abilities,counts).valid,true);
  for(const changes of [{ability:'范围外能力'},{text:' '},{options:[]},{options:['有效',' ']},{options:undefined},{type:'essay'}])assert.equal(c.checkQuestions([{...q,...changes}],abilities,counts).valid,false);
  assert.equal(c.checkQuestions([q,q],abilities,counts).valid,false);
});
test('生成失败回到确认卡，不覆盖已有题本；空能力或零题数不启动',()=>{
  const {context:c,flush,queue,errors}=setup();c.questions=[{id:'original'}];c.A.generate=()=>[];c.generate();flush();
  assert.equal(c.phase,'review');assert.equal(c.questions[0].id,'original');assert.ok(errors.at(-1).includes('生成未完成'));
  c.selected=[];c.generate();assert.equal(queue.length,0);
  c.selected=['团队管理'];c.counts={single:0,multi:0,score:0,essay:0};c.generate();assert.equal(queue.length,0);assert.ok(errors.at(-1).includes('题数'));
});
