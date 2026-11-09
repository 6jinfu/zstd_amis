const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
function setup(saved,cryptoProvider=crypto) {
  const values=new Map(saved?[['talent-center-v1',JSON.stringify(saved)]]:[]);
  const context={window:{},crypto:cryptoProvider,localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}};
  vm.createContext(context);
  for(const name of ['standard-seeds.js','standards-data.js','talent-data.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../app',name),'utf8'),context);
    if(name==='standards-data.js')context.Standards=context.window.Standards;
  }
  return context.window.Talent;
}

test('两项目的人才池有稳定ID和实际成员，来源与名单一致',()=>{
  const T=setup(),data=T.read(),again=T.read();
  assert.equal(data.pools.length,4);
  assert.deepEqual(data.pools.map(pool=>pool.id),again.pools.map(pool=>pool.id));
  for(const pool of data.pools) {
    const project=T.sourceProject(pool);
    assert.ok(project);
    assert.ok(pool.members.length);
    assert.ok(pool.members.every(member=>project.people.some(p=>p.id===member.person)));
    assert.ok(pool.members.every(member=>member.profile.name&&!member.nextReview));
  }
});

test('可组建名单与两份现有盘点结果代表人员一致，不用项目总人数虚构成员',()=>{
  const T=setup(),source=fs.readFileSync(path.join(__dirname,'../app/review-detail.html'),'utf8');
  const annual=source.match(/id="review-people"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)[1];
  const sales=source.match(/document.querySelector\('#review-people tbody'\).innerHTML='(.*?)';/)[1];
  const parse=html=>[...html.matchAll(/<tr\b[^>]*>(.*?)<\/tr>/g)].map(row=>[...row[1].matchAll(/<td\b[^>]*>(.*?)<\/td>/g)].slice(0,6).map(cell=>cell[1].replace(/<[^>]+>/g,'').trim()));
  for(const [index,html] of [annual,sales].entries()) {
    const actual=T.reviewProjects[index].people.map(p=>[p.name,p.department,p.position,p.ability,p.performance,p.classification]);
    assert.equal(JSON.stringify(actual),JSON.stringify(parse(html)));
  }
});

test('跨项目人员整批拒绝，不产生部分入池',()=>{
  const T=setup(),data=T.read(),pool=data.pools.find(p=>p.id==='pool-sales-core');
  const before=JSON.stringify(pool);
  assert.throws(()=>T.addMembers(data,pool,['review-sales-4','zhangming'],'盘点确认'),/只能加入来源盘点项目/);
  assert.equal(JSON.stringify(pool),before);
});

test('入池去重、退出后再入池保留历史，保存刷新不重复生成项目池',()=>{
  const T=setup(),data=T.read(),pool=data.pools.find(p=>p.id==='pool-annual-core');
  assert.equal(T.addMembers(data,pool,['chenqiang','chenqiang'],'盘点确认'),1);
  assert.equal(T.addMembers(data,pool,['chenqiang'],'盘点确认'),0);
  const first=pool.members.find(m=>m.person==='chenqiang');first.exited=T.today();first.exitReason='调整名单';
  assert.equal(T.addMembers(data,pool,['chenqiang'],'再次确认'),1);
  assert.equal(pool.members.filter(m=>m.person==='chenqiang').length,2);
  assert.equal(T.activeMembers(pool).length,4);
  T.write(data);const restored=T.read();
  assert.equal(restored.pools.length,4);
  assert.equal(T.activeMembers(restored.pools.find(p=>p.id===pool.id)).length,4);
  assert.equal(restored.pools.find(p=>p.id===pool.id).members.find(m=>m.id===first.id).exitReason,'调整名单');
});

test('批量入池混合已有、退出和重复选择时只追加有效新记录',()=>{
  const T=setup(),data=T.read(),pool=data.pools.find(p=>p.id==='pool-annual-core');
  const first=pool.members.find(m=>m.person==='lihua');
  first.exited=T.today();first.exitReason='调整名单';
  const before=JSON.stringify(pool.members);
  assert.equal(T.addMembers(data,pool,[],'空选择'),0);
  assert.equal(JSON.stringify(pool.members),before);
  assert.equal(T.addMembers(data,pool,['zhangming','lihua','chenqiang','lihua','chenqiang'],'再次组建'),2);
  assert.equal(JSON.stringify(pool.members.slice(0,3)),before);
  assert.equal(JSON.stringify(pool.members.slice(3).map(m=>m.person)),JSON.stringify(['lihua','chenqiang']));
  assert.equal(T.activeMembers(pool).length,4);
  assert.equal(T.addMembers(data,pool,['lihua','chenqiang'],'重复提交'),0);
});

test('储备看板保持跨池去重、逾期边界、部门筛选和原始顺序',()=>{
  const T=setup(),data=T.read(),today=T.today();
  const pools=[
    {id:'first',target:'RD-302',members:[
      {person:'zhangming',nextReview:today},
      {person:'wangfang',nextReview:'2000-01-01'},
      {person:'lihua',nextReview:'2000-01-01',exited:today},
      {person:'unknown',nextReview:'2000-01-01'}
    ]},
    {id:'other',target:'SA-201',members:[{person:'lihua',nextReview:'2000-01-01'}]},
    {id:'second',target:'RD-302',members:[
      {person:'zhangming',nextReview:'2000-01-01'},
      {person:'chenqiang',nextReview:'9999-12-31'},
      {person:'wangfang',nextReview:'2000-01-01'}
    ]},
    {id:'empty',target:'RD-205',members:[]},
    {id:'noncritical',target:'RD-102',members:[{person:'lihua',nextReview:'2000-01-01'}]},
    {id:'untargeted',members:[{person:'lihua',nextReview:'2000-01-01'}]}
  ];
  data.pools=pools;
  const standards={standards:[{id:'architecture',mode:'positions',positions:['RD-302']}],links:{},excluded:{}};
  const before=JSON.stringify({data,standards});
  const plain=value=>JSON.parse(JSON.stringify(value));
  const rows=T.reserveRows(data,standards),architecture=rows.find(row=>row.position.id==='RD-302');
  assert.deepEqual(plain(rows.map(row=>row.position.id)),['RD-302','RD-301','RD-205','SA-201','SA-301','SA-110']);
  assert.deepEqual(plain(architecture.pools.map(pool=>pool.id)),['first','second']);
  assert.equal(architecture.pools[0],pools[0]);
  assert.deepEqual(plain(architecture.people),['zhangming','wangfang','unknown','chenqiang']);
  assert.deepEqual(plain(architecture.due),['wangfang','unknown','zhangming']);
  assert.deepEqual(plain(architecture.linked.map(standard=>standard.id)),['architecture']);
  const empty=rows.find(row=>row.position.id==='RD-301');
  assert.deepEqual(plain([empty.pools,empty.people,empty.linked,empty.due]),[[],[],[],[]]);
  assert.deepEqual(plain(rows.find(row=>row.position.id==='RD-205').people),[]);
  assert.deepEqual(plain(rows.find(row=>row.position.id==='SA-201').people),['lihua']);
  for(const [department,people,due] of [
    ['研发中心',['zhangming','chenqiang'],['zhangming']],
    ['销售中心',['wangfang'],['wangfang']],
    ['职能中台',[],[]]
  ]) {
    const row=T.reserveRows(data,standards,department).find(row=>row.position.id==='RD-302');
    assert.deepEqual(plain(row.people),people);
    assert.deepEqual(plain(row.due),due);
    assert.deepEqual(plain(row.pools.map(pool=>pool.id)),['first','second']);
  }
  assert.equal(JSON.stringify({data,standards}),before);
  pools[0].members[1].exited=today;
  pools[2].members[2].exited=today;
  assert.deepEqual(plain(T.reserveRows(data,standards,'销售中心').find(row=>row.position.id==='RD-302').people),[]);
});

test('未记录来源的旧人才池不猜来源，原成员、复评及计划历史完整保留',()=>{
  const legacy={id:'legacy',name:'技术骨干后备池',target:'RD-302',nextReview:'2026-12-31',members:[{id:'m1',person:'zhangming',nextReview:'2026-12-31'}]};
  const saved={pools:[legacy],selections:{},reviews:[],evidence:[],followups:[{id:'f1',poolId:'legacy'}],actions:[{id:'a1',poolId:'legacy'}]};
  const T=setup(saved),data=T.read();
  assert.equal(JSON.stringify(data.pools[0]),JSON.stringify(legacy));
  assert.equal(T.sourceProject(data.pools[0]),undefined);
  assert.throws(()=>T.addMembers(data,data.pools[0],['lihua'],'盘点确认'),/请先关联来源盘点项目/);
  assert.equal(data.followups[0].id,'f1');assert.equal(data.actions[0].id,'a1');
  T.write(data);assert.equal(T.read().pools.length,5);
});


test('局域网HTTP缺少randomUUID时仍可生成UUID并保存新池及成员',()=>{
  const T=setup(undefined,{getRandomValues:array=>crypto.getRandomValues(array)});
  const ids=Array.from({length:1000},()=>T.uid('pool'));
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(ids.every(id=>/^pool-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)));
  const data=T.read(),pool={id:ids[0],name:'销售经理后备人才池',sourceProject:'review-sales',owner:'李文静',expected:10,members:[],created:T.today()};
  data.pools.push(pool);
  assert.equal(T.addMembers(data,pool,['review-sales-4'],'依据来源项目组建'),1);
  T.write(data);
  const saved=T.read().pools.find(p=>p.id===pool.id);
  assert.equal(saved.name,pool.name);
  assert.equal(saved.members[0].person,'review-sales-4');
  assert.match(saved.members[0].id,/^member-[0-9a-f-]{36}$/);
});

test('支持randomUUID时继续使用原生UUID，不调用兼容分支',()=>{
  const T=setup(undefined,{randomUUID:()=> 'e355fcbc-8174-4094-8c27-8c5c839c1f0c',getRandomValues(){throw new Error('不应调用兼容分支');}});
  assert.equal(T.uid('pool'),'pool-e355fcbc-8174-4094-8c27-8c5c839c1f0c');
});
