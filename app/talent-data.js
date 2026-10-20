/* Shared talent-center prototype records. Standards and people remain owned by Standards. */
(function () {
  const key = 'talent-center-v1';
  const ids = ['zhangming', 'lihua', 'wangfang', 'zhaolin', 'chenqiang'];
  const base = [
    {sex:'男',education:'硕士',tenure:6,tags:['技术骨干'],classification:'高潜',performance:'A'},
    {sex:'女',education:'博士',tenure:4,tags:['算法研发'],classification:'核心',performance:'A'},
    {sex:'女',education:'本科',tenure:8,tags:['客户经营'],classification:'核心',performance:'A+'},
    {sex:'女',education:'硕士',tenure:5,tags:[],classification:'中坚',performance:'B+'},
    {sex:'男',education:'本科',tenure:3,tags:[],classification:'待发展',performance:'B'}
  ];
  const people = Standards.people.map((person,i) => ({...person,...base[i],id:ids[i]}));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const uid = prefix => prefix+'-'+crypto.randomUUID();
  const initial = () => ({
    selections:{}, pools:[], followups:[], actions:[],
    evidence:[
      {id:'ev-zhang',person:'zhangming',name:'架构师能力评估',type:'360评估',date:'2026-07-28',validUntil:'2027-07-28',values:[['系统架构',4.4],['技术选型',4.6],['团队管理',3.2],['跨部门沟通',2.8],['创新思维',4.2]]},
      {id:'ev-li',person:'lihua',name:'算法专业能力评估',type:'能力评估',date:'2026-09-15',validUntil:'2027-09-15',values:[['算法设计',4],['模型工程',3],['特征工程',3],['编程能力',4],['业务理解',3],['跨部门沟通',3],['创新思维',4]]},
      {id:'ev-wang',person:'wangfang',name:'销售管理能力评估',type:'能力评估',date:'2026-09-18',validUntil:'2027-09-18',values:[['客户洞察',4],['顾问式销售',4],['商务谈判',3],['商机管理',4],['协同推进',3]]}
    ],
    reviews: people.map(p => ({id:'review-'+p.id,person:p.id,project:'2026 年度人才盘点',date:'2026-07-30',method:'宫格盘点',classification:p.classification,performance:p.performance}))
  });
  function read() { const raw=localStorage.getItem(key); const data=raw ? JSON.parse(raw) : initial(); data.actions ||= []; return data; }
  function write(data) { localStorage.setItem(key,JSON.stringify(data)); }
  const person = id => people.find(p=>p.id===id);
  const activeMembers = pool => pool.members.filter(m=>!m.exited);
  const poolsFor = (data,id) => data.pools.filter(p=>activeMembers(p).some(m=>m.person===id));
  function evidence(data,id,asOf=today()) { return data.evidence.filter(r=>r.person===id && r.date<=asOf && (!r.validUntil || r.validUntil>=asOf)); }
  function values(data,id) {
    const map=new Map();
    evidence(data,id).forEach(record => record.values.forEach(([name,value]) => {
      if(!map.has(name)||value>map.get(name).value)map.set(name,{value,record});
    }));
    return map;
  }
  function requirements(standard) {
    const c=standard?.content||{}, result=[];
    (c.duty||[]).forEach(d=>result.push({kind:'职责任务',name:d.n,detail:(d.t||[]).join('；')}));
    (c.exp||[]).forEach(name=>result.push({kind:'经历经验',name}));
    (c.cap||[]).forEach(([name,level])=>result.push({kind:'能力要求',name,level,threshold:/^L[1-5]$/.test(level)?Number(level.slice(1)):null}));
    [['pow','动力要求'],['pot','潜力要求']].forEach(([key,kind])=>(c[key]||[]).forEach(name=>result.push({kind,name})));
    return result;
  }
  function compare(data,id,standard) {
    const actual=values(data,id);
    return requirements(standard).map(r=>{
      const found=r.kind==='能力要求'?actual.get(r.name):null;
      const known=!!found&&r.threshold!==null;
      return {...r,actual:found,status:known?(found.value>=r.threshold?'已满足':'待发展'):'待补充证据'};
    });
  }
  function summary(rows) { return {total:rows.length,known:rows.filter(r=>r.status!=='待补充证据').length,met:rows.filter(r=>r.status==='已满足').length,gaps:rows.filter(r=>r.status==='待发展').length}; }
  const latestReview = (data,id) => data.reviews.filter(r=>r.person===id&&r.date<=today()).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
  const developmentItems = (data,id,poolId) => (data.actions||[]).filter(a=>(!id||a.person===id)&&(!poolId||a.poolId===poolId));
  function createDevelopment(data,record) {
    if(!person(record.person)||!record.title?.trim()||!record.owner?.trim()||!record.due||record.due<today())throw new Error('请填写培养事项、负责人及不早于今天的完成日期');
    if(!record.mentor?.trim()||!record.goal?.trim()||!record.standardSnapshot||!record.start||record.start<today()||record.stages?.length!==3||record.stages.some(s=>!s.title.trim()||s.due<record.start))throw new Error('请明确导师、培养目标、采用标准及完整的培养阶段');
    if(record.poolId){const pool=poolsFor(data,record.person).find(p=>p.id===record.poolId);if(!pool)throw new Error('该人员已不在所选人才池');if(pool.target!==record.target||pool.standard!==record.standard||JSON.stringify(pool.standardSnapshot?.content)!==JSON.stringify(record.standardSnapshot.content))throw new Error('计划与人才池的目标岗位及标准依据不一致');}
    const item={...record,id:uid('action'),title:record.title.trim(),owner:record.owner.trim(),created:today(),status:record.start>today()?'未开始':'进行中',completed:'',result:''};
    data.actions ||= []; data.actions.push(item); return item;
  }
  function confirmStage(data,id,index,result,reviewer) {
    const plan=(data.actions||[]).find(a=>a.id===id),stage=plan?.stages[index];
    if(!stage||stage.completed)throw new Error('该阶段已完成或不存在');
    if(!result.trim()||!reviewer.trim())throw new Error('请填写成果依据和确认人');
    Object.assign(stage,{completed:today(),result:result.trim(),reviewer:reviewer.trim()});
    if(plan.stages.every(s=>s.completed)){plan.status='已完成';plan.completed=today();}
    return plan;
  }
  function reserveRows(data,standards,department='') {
    return Standards.positions.filter(p=>p.critical).map(position=>{
      const pools=data.pools.filter(pool=>pool.target===position.id),people=[...new Set(pools.flatMap(pool=>activeMembers(pool).map(m=>m.person)))].filter(id=>!department||person(id)?.department===department);
      const linked=Standards.associated(standards,position.id);
      const due=[...new Set(pools.flatMap(pool=>activeMembers(pool).filter(m=>m.nextReview&&m.nextReview<today()).map(m=>m.person)))].filter(id=>people.includes(id));
      return {position,pools,people,linked,due};
    });
  }
  function filterPeople(data,filters) {
    return people.filter(p=>{
      if(filters.query&&!`${p.name} ${p.position}`.includes(filters.query.trim()))return false;
      if(filters.department&&p.department!==filters.department)return false;
      if(filters.classification&&latestReview(data,p.id)?.classification!==filters.classification)return false;
      if(filters.critical&&String(p.critical)!==filters.critical)return false;
      if(filters.tag&&!p.tags.includes(filters.tag))return false;
      if(filters.pool&&!poolsFor(data,p.id).some(pool=>pool.id===filters.pool))return false;
      if(filters.coverage==='missing'&&evidence(data,p.id).length)return false;
      if(filters.coverage==='valid'&&!evidence(data,p.id).length)return false;
      if(filters.inPool==='yes'&&!poolsFor(data,p.id).length)return false;
      if(filters.inPool==='no'&&poolsFor(data,p.id).length)return false;
      if(filters.ability&&!evidence(data,p.id).some(record=>(!filters.since||record.date>=filters.since)&&record.values.some(([name,value])=>name===filters.ability&&value>=Number(filters.level||1))))return false;
      return true;
    });
  }
  function addMembers(data,pool,ids,reason) {
    let count=0;
    [...new Set(ids)].filter(id=>person(id)).forEach(id=>{
      if(activeMembers(pool).some(m=>m.person===id))return;
      const review=latestReview(data,id);
      pool.members.push({id:uid('member'),person:id,joined:today(),reason,confirmedBy:'李文静',source:review?`${review.project} · ${review.date} · ${review.classification}`:'人才库人工选择',nextReview:pool.nextReview,exited:null,exitReason:''});
      count++;
    });
    return count;
  }
  window.Talent={key,people,person,today,uid,read,write,evidence,values,requirements,compare,summary,filterPeople,activeMembers,poolsFor,addMembers,latestReview,developmentItems,createDevelopment,confirmStage,reserveRows};
})();
