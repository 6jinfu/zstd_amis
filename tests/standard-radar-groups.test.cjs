const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app/standard-ui.js'),'utf8');
test('按真实类别绘制多图，不足三项和未知类别保留实际名称与等级',()=>{
  const categories=[{id:'a',name:'专业能力'},{id:'b',name:'通用能力'},{id:'c',name:'知识'}];
  const names=['甲','乙','丙','丁','戊','己','庚'];
  const items=names.map((name,i)=>({name,categoryId:i<3?'a':i<6?'b':'c'}));
  const context={window:{Standards:{},IndicatorDemo:{categories,items:{cap:items}}},UI:{escape:String}};
  vm.createContext(context);vm.runInContext(source,context);
  const values=[...names.map(name=>[name,'L3']),['未收录','L4']];
  const html=context.window.StandardUI.capabilityRadarGroups(values);
  assert.equal((html.match(/<svg /g)||[]).length,2);
  assert.match(html,/专业能力/);assert.match(html,/通用能力/);assert.match(html,/知识/);assert.match(html,/待分类/);
  for(const [name,level] of values){assert.ok(html.includes(name));assert.ok(html.includes(level));}
  const sparse=context.window.StandardUI.capabilityRadarGroups([['庚','L3'],['未收录','L4'],['其他','L2']]);
  assert.equal((sparse.match(/<svg /g)||[]).length,1);
  assert.match(sparse,/能力总览/);
});
