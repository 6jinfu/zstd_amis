const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const storage = new Map();
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-09-29T12:00:00+08:00'])); }
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
check('共享人员身份与缺失结果', () => {
  assert.equal(T.people.length, 5);
  assert.equal(T.person('lihua').name, '李华');
  assert.equal(T.person('missing'), undefined);
  assert.equal(T.values(data, 'zhaolin').size, 0);
  assert.ok(T.compare(data, 'zhaolin', standard).every(r => r.status === '待补充证据'));
});
check('能力不足与未评估分离', () => {
  const rows = T.compare(data, 'zhangming', standard), s = T.summary(rows);
  assert.equal(s.known, 5); assert.equal(s.met, 4); assert.equal(s.gaps, 1);
  assert.equal(rows.find(r => r.name === '跨部门沟通').status, '待发展');
  assert.equal(rows.find(r => r.kind === '职责任务').status, '待补充证据');
});
check('过期、未来结果排除；有效结果取最高值', () => {
  data.evidence.push(
    {id:'expired',person:'zhangming',date:'2026-01-01',validUntil:'2026-09-28',values:[['跨部门沟通',5]]},
    {id:'future',person:'zhangming',date:'2026-09-30',validUntil:'2027-09-30',values:[['跨部门沟通',5]]},
    {id:'recent',person:'zhangming',date:'2026-09-29',validUntil:'2027-09-29',values:[['跨部门沟通',2]]}
  );
  assert.equal(T.values(data,'zhangming').get('跨部门沟通').value, 2.8);
  assert.equal(T.values(data,'zhangming').get('跨部门沟通').record.id, 'ev-zhang');
});
check('起始日期与分数必须在同一有效记录满足', () => {
  assert.equal(T.filterPeople(data,{ability:'跨部门沟通',level:'3'}).map(p=>p.id).join(','), 'lihua');
  assert.equal(T.filterPeople(data,{ability:'跨部门沟通',level:'2.5',since:'2026-09-20'}).length, 0);
  assert.equal(T.filterPeople(data,{department:'职能中台',coverage:'missing'}).map(p=>p.id).join(','), 'zhaolin');
});
check('非标准等级不得生成达标结论', () => {
  const custom = {content:{cap:[['系统架构','专家']]}};
  assert.equal(T.compare(data,'zhangming',custom)[0].status, '待补充证据');
});
check('同池去重、退出后重入保留历史与来源', () => {
  const pool={id:'p1',name:'测试池',nextReview:'2026-12-31',standardSnapshot:S.clone(standard),members:[]};
  data.pools.push(pool);
  assert.equal(T.addMembers(data,pool,['zhangming','zhangming','missing'],'首次入池'),1);
  assert.equal(T.addMembers(data,pool,['zhangming'],'重复入池'),0);
  pool.members[0].exited='2026-09-29'; pool.members[0].exitReason='调整安排';
  assert.equal(T.addMembers(data,pool,['zhangming'],'再次入池'),1);
  assert.equal(pool.members.length,2); assert.equal(T.activeMembers(pool).length,1);
  assert.equal(pool.members[0].reason,'首次入池');
  assert.ok(pool.members[1].source.includes('年度人才盘点'));
  assert.notEqual(pool.members[0].id,pool.members[1].id);
  standard.content.cap[0][1]='L1';
  assert.equal(pool.standardSnapshot.content.cap[0][1],'L4');
});
check('跨池统计按人员去重，保存重读不丢记录', () => {
  const second={id:'p2',name:'另一个池',nextReview:'2026-12-31',members:[]};
  data.pools.push(second); T.addMembers(data,second,['zhangming'],'其他方向');
  assert.equal(T.filterPeople(data,{inPool:'yes'}).length,1);
  T.write(data); const restored=T.read();
  assert.equal(restored.pools[0].members.length,2);
  assert.equal(restored.pools[0].members[0].exitReason,'调整安排');
  assert.equal(T.poolsFor(restored,'zhangming').length,2);
});
console.log(`${checks} business-rule checks passed`);
