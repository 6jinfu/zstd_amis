const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app/review-layering.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('  function abilityBand'),source.indexOf("  document.addEventListener('DOMContentLoaded'")),context);
const people=[
  {name:'张明',department:'研发中心',position:'架构师',ability:88,performance:'高',classification:'核心人才'},
  {name:'李华',department:'研发中心',position:'高级算法工程师',ability:76,performance:'高',classification:'关键人才'},
  {name:'王芳',department:'销售中心',position:'区域销售总监',ability:78,performance:'高',classification:'关键人才'},
  {name:'陈强',department:'研发中心',position:'测试工程师',ability:48,performance:'低',classification:'重点关注'}
];
const select=(filters={})=>people.filter(person=>context.matchesPerson(person,{name:'',department:'',field:'ability',value:'',...filters})).map(person=>person.name);
test('能力分层精确使用60/80边界，缺失得分不作为低分',()=>{
  for(const [score,band] of [[80,'high'],[79.9,'mid'],[60,'mid'],[59.9,'low'],[0,'low'],[NaN,''],[undefined,''],[null,'']])assert.equal(context.abilityBand(score),band);
});
test('切换字段可按能力、绩效、分类、岗位精确筛选，空条件返回全部',()=>{
  assert.deepEqual(select(),['张明','李华','王芳','陈强']);
  assert.deepEqual(select({value:'high'}),['张明']);
  assert.deepEqual(select({value:'mid'}),['李华','王芳']);
  assert.deepEqual(select({field:'performance',value:'低'}),['陈强']);
  assert.deepEqual(select({field:'classification',value:'关键人才'}),['李华','王芳']);
  assert.deepEqual(select({field:'position',value:'架构师'}),['张明']);
});
test('姓名、部门与字段条件取交集，无结果返回空集且不改写盘点得分或落位',()=>{
  const before=JSON.stringify(people);
  assert.deepEqual(select({department:'销售中心',value:'mid'}),['王芳']);
  assert.deepEqual(select({name:' 华 ',department:'研发中心',field:'performance',value:'高'}),['李华']);
  assert.deepEqual(select({department:'销售中心',value:'high'}),[]);
  assert.deepEqual(select({name:'不存在'}),[]);
  assert.equal(JSON.stringify(people),before);
});
