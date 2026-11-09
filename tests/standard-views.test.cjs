const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function fixture(){
  const context=vm.createContext({window:{},localStorage:{getItem:()=>null,setItem:()=>{}}});
  for(const file of ['standard-seeds.js','standards-data.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../app',file),'utf8'),context);
  const S=context.window.Standards,data=S.read();
  data.links={'RD-302':['std-algorithm','std-sales'],'SA-201':['std-algorithm'],'RD-301':['std-algorithm']};
  return {S,data};
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('双视图读取直接关联及岗位额外关联，重复关系只展示一次',()=>{
  const {S,data}=fixture(),standard=data.standards.find(s=>s.id==='std-algorithm');
  assert.deepEqual(plain(S.positionIds(data,standard)),['RD-301','RD-302','SA-201']);
  assert.equal(S.countApplicable(data,standard),3);
  assert.equal(S.applicableObjectLabel(data,standard),'高级算法工程师、架构师、销售经理');
  for(const id of S.positionIds(data,standard))assert.ok(S.associated(data,id).some(s=>s.id===standard.id));
});

test('共同编辑页保存完整岗位列表，移除的旧关联不会从另一视图重新出现',()=>{
  const {S,data}=fixture(),standard=S.clone(data.standards.find(s=>s.id==='std-algorithm'));
  const content=plain(standard.content);
  standard.positions=S.positionIds(data,standard).filter(id=>id!=='RD-302');
  S.setStandard(data,standard);
  assert.deepEqual(plain(S.positionIds(data,standard)),['RD-301','SA-201']);
  assert.ok(!S.associated(data,'RD-302').some(s=>s.id===standard.id));
  assert.ok(S.associated(data,'RD-302').some(s=>s.id==='std-sales'));
  assert.deepEqual(plain(data.standards.find(s=>s.id===standard.id).content),content);
  standard.positions.push('HR-101');
  assert.ok(!S.associated(data,'HR-101').some(s=>s.id===standard.id));
});

test('改为暂不关联后仅保留标准记录，不在任何岗位视图中残留',()=>{
  const {S,data}=fixture(),standard=S.clone(data.standards.find(s=>s.id==='std-algorithm'));
  standard.mode='none';standard.positions=[];standard.groups=[];
  S.setStandard(data,standard);
  assert.ok(data.standards.some(s=>s.id===standard.id));
  for(const p of S.positions)assert.ok(!S.associated(data,p.id).some(s=>s.id===standard.id));
  assert.equal(S.applicableObjectLabel(data,standard),'—');
});

test('条件匹配不推断整岗位关联，普通内容编辑保留已有显式关系',()=>{
  const {S,data}=fixture(),standard=S.clone(data.standards.find(s=>s.id==='std-collaboration'));
  assert.deepEqual(plain(S.positionIds(data,standard)),[]);
  assert.ok(S.match(standard,S.people[0]));
  data.links['SA-301']=[standard.id];
  standard.description='调整说明';
  S.setStandard(data,standard,{preserveRuleLinks:true});
  assert.deepEqual(plain(S.positionIds(data,standard)),['SA-301']);
  assert.ok(S.associated(data,'SA-301').some(s=>s.id===standard.id));
  assert.ok(!S.associated(data,'RD-302').some(s=>s.id===standard.id));
});
