const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const storage = new Map();
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-09-30T12:00:00+08:00'])); }
}
const context = vm.createContext({
  Date: FixedDate, crypto: { randomUUID },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
});
context.window = context;
for (const file of ['standard-seeds.js', 'standards-data.js', 'talent-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'app', file), 'utf8'), context);
}
const T = context.Talent, S = context.Standards, data = T.read();
const standard = S.read().standards.find(s => s.id === 'std-architecture');
let checks = 0;
function check(name, test) { test(); checks++; console.log('PASS ' + name); }
check('旧存储兼容，不丢池成员与评鉴', () => {
  const legacy=T.read();delete legacy.actions;T.write(legacy);
  const restored=T.read();assert.equal(restored.actions.length,0);assert.equal(restored.evidence.length,3);
});
check('分类采用最近有效盘点来源，排除未来记录', () => {
  data.reviews.push({person:'zhangming',date:'2026-09-29',classification:'中坚',project:'补充盘点'}, {person:'zhangming',date:'2026-10-01',classification:'核心'});
  assert.equal(T.latestReview(data,'zhangming').project,'补充盘点');
  assert.ok(T.filterPeople(data,{classification:'中坚'}).some(p=>p.id==='zhangming'));
});
const pool={id:'p1',target:'RD-302',standard:standard.id,standardSnapshot:S.clone(standard),nextReview:'2026-09-29',members:[]};
data.pools.push(pool);T.addMembers(data,pool,['zhangming','lihua'],'测试入池');
check('岗位后备厚度跨池去重，退出和部门范围生效', () => {
  const second={...pool,id:'p2',members:[]};data.pools.push(second);T.addMembers(data,second,['zhangming'],'重复后备');
  second.members.push({person:'wangfang',nextReview:'2026-09-29',exited:'2026-09-30'});
  const row=T.reserveRows(data,S.read()).find(r=>r.position.id==='RD-302');
  assert.equal(row.people.length,2);assert.equal(row.due.length,2);
  assert.equal(T.reserveRows(data,S.read(),'销售中心').find(r=>r.position.id==='RD-302').people.length,0);
});
function record(){return {person:'zhangming',poolId:'p1',target:'RD-302',standard:standard.id,standardSnapshot:S.clone(standard),title:'协作发展',goal:'提升跨部门协作',mentor:'演示导师',owner:'负责人',start:'2026-09-30',due:'2026-12-29',stages:[30,60,90].map((days,i)=>({days,title:'阶段'+i,due:['2026-10-30','2026-11-29','2026-12-29'][i],completed:''}))};}
check('IDP 必须有导师、阶段和一致的池依据', () => {
  assert.throws(()=>T.createDevelopment(data,{...record(),mentor:''}),/导师/);
  assert.throws(()=>T.createDevelopment(data,{...record(),stages:[]}),/阶段/);
  assert.throws(()=>T.createDevelopment(data,{...record(),person:'wangfang'}),/不在/);
  assert.throws(()=>T.createDevelopment(data,{...record(),target:'RD-303'}),/不一致/);
});
check('阶段确认必填且不能重复，培养不更改评鉴', () => {
  const before=JSON.stringify(data.evidence),plan=T.createDevelopment(data,record());
  assert.throws(()=>T.confirmStage(data,plan.id,0,'','负责人'),/成果/);
  T.confirmStage(data,plan.id,0,'复盘材料','负责人');
  assert.equal(plan.status,'进行中');
  assert.throws(()=>T.confirmStage(data,plan.id,0,'重复','负责人'),/已完成/);
  T.confirmStage(data,plan.id,1,'实践材料','负责人');T.confirmStage(data,plan.id,2,'导师复核','负责人');
  assert.equal(plan.status,'已完成');assert.equal(plan.completed,'2026-09-30');assert.equal(JSON.stringify(data.evidence),before);
  assert.equal(T.values(data,'zhangming').get('跨部门沟通').value,2.8);
  T.write(data);assert.equal(T.developmentItems(T.read(),'zhangming','p1')[0].stages.filter(s=>s.completed).length,3);
});
console.log(`${checks} additional business-rule checks passed`);
