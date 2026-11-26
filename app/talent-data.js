/* Shared talent-center prototype records. Standards and people remain owned by Standards. */
(function () {
  const key = 'talent-center-v1';
  const ids = ['zhangming', 'lihua', 'wangfang', 'zhaolin', 'chenqiang'];
  const employeeIds = ['EMP-1026', 'EMP-1088', 'EMP-2031', 'EMP-3072', 'EMP-1120'];
  const base = [
    {
      sex:'男',education:'硕士',tenure:6,tags:['技术骨干'],classification:'高潜',performance:'A',
      ucResume:{
        work:[
          {start:'2023-04',end:'至今',unit:'集团总部',dept:'研发中心',position:'架构师',manager:'周远航'},
          {start:'2020-07',end:'2023-03',unit:'集团总部',dept:'基础平台部',position:'高级后端工程师',manager:'孙伟'}
        ],
        training:[
          {start:'2025-05-12',end:'2025-06-20',content:'云原生分布式架构高阶训练营',org:'企业大学·技术学院',cert:'首席架构师认证',note:'核心链路架构重构课题结业'},
          {start:'2024-09-02',end:'2024-09-26',content:'研发管理者领导力工作坊',org:'组织发展部',cert:'研发管理结业证书',note:'完成跨团队协同课题答辩'}
        ],
        teaching:[
          {start:'2026-03-18',end:'2026-03-18',content:'高并发核心链路容灾与技术选型',audience:'研发中心骨干工程师（46人）',honor:'金牌内训师',note:'课程满意度 4.9/5.0'},
          {start:'2025-11-08',end:'2025-11-08',content:'微服务治理与架构评审规范',audience:'新晋技术负责人（24人）',honor:'优秀讲师',note:'沉淀架构评审清单'}
        ]
      },
      ucAgreements:[
        {name:'首席架构师外部研修服务协议',start:'2025-06-21',end:'2027-06-20',status:'履行中',note:'外派专项培养 2 年服务期'}
      ]
    },
    {
      sex:'女',education:'博士',tenure:4,tags:['算法研发'],classification:'核心',performance:'A',
      ucResume:{
        work:[
          {start:'2024-03',end:'至今',unit:'集团总部',dept:'研发中心',position:'算法工程师',manager:'张明'},
          {start:'2022-07',end:'2024-02',unit:'智能科技子公司',dept:'智能推荐组',position:'青年算法研究员',manager:'林浩'}
        ],
        training:[
          {start:'2025-08-05',end:'2025-09-12',content:'大模型推理优化与推荐算法实战营',org:'企业大学·AI实验室',cert:'高级算法认证',note:'落地召回排序双塔升级'},
          {start:'2024-04-15',end:'2024-04-30',content:'跨部门技术方案协同训练',org:'研发中心',cert:'结业证书',note:'—'}
        ],
        teaching:[
          {start:'2026-04-10',end:'2026-04-10',content:'特征工程与在线推理性能优化实操',audience:'算法与数据工程团队（32人）',honor:'优秀技术分享奖',note:'—'}
        ]
      },
      ucAgreements:[
        {name:'AI 核心人才专项培养协议',start:'2025-09-15',end:'2027-09-14',status:'履行中',note:'博士核心人才专项资助'}
      ]
    },
    {
      sex:'女',education:'本科',tenure:8,tags:['客户经营'],classification:'核心',performance:'A+',
      ucResume:{
        work:[
          {start:'2023-01',end:'至今',unit:'华东事业部',dept:'销售中心',position:'区域销售总监',manager:'郑凯'},
          {start:'2019-06',end:'2022-12',unit:'华南事业部',dept:'大客户部',position:'战略大客户经理',manager:'刘振'},
          {start:'2018-03',end:'2019-05',unit:'总部营销中心',dept:'渠道拓展部',position:'高级销售主管',manager:'赵敏'}
        ],
        training:[
          {start:'2025-04-10',end:'2025-05-18',content:'战略大客户经营与区域铁军领航项目',org:'企业大学·营销学院',cert:'领航管理者认证',note:'华东大区年度增长标杆'},
          {start:'2023-10-16',end:'2023-10-20',content:'复杂商机政企商务谈判实战',org:'外部高管商学院',cert:'高阶谈判证书',note:'跨区域大单复盘第一名'}
        ],
        teaching:[
          {start:'2026-02-25',end:'2026-02-26',content:'百万级战略大客户破局与商机经营',audience:'全国销售经理训练营（58人）',honor:'年度王牌讲师',note:'沉淀大客户作战地图'},
          {start:'2025-07-19',end:'2025-07-19',content:'区域销售团队目标拆解与辅导',audience:'新晋销售主管（35人）',honor:'优秀内训师',note:'—'}
        ]
      },
      ucAgreements:[
        {name:'高管商学院外部研修服务协议',start:'2023-10-21',end:'2025-10-20',status:'已期满',note:'服务期已正常履行完毕'}
      ]
    },
    {
      sex:'女',education:'硕士',tenure:5,tags:[],classification:'中坚',performance:'B+',
      ucResume:{
        work:[
          {start:'2023-08',end:'至今',unit:'集团总部',dept:'职能中台',position:'财务分析经理',manager:'许静'},
          {start:'2021-07',end:'2023-07',unit:'集团总部',dept:'经营分析部',position:'高级经营分析专员',manager:'许静'}
        ],
        training:[
          {start:'2025-06-03',end:'2025-06-28',content:'业财融合与经营决策建模研修班',org:'企业大学·财经学院',cert:'业财BP认证',note:'输出产研投入产出分析模型'},
          {start:'2024-11-11',end:'2024-11-22',content:'SQL 数据查询与 BI 经营看板实战',org:'数字化赋能中心',cert:'数据分析结业证书',note:'—'}
        ],
        teaching:[
          {start:'2025-12-05',end:'2025-12-05',content:'业务部门预算编制与ROI测算实务',audience:'各业务线PMO与运营骨干（40人）',honor:'优秀分享讲师',note:'—'}
        ]
      },
      ucAgreements:[]
    },
    {
      sex:'男',education:'本科',tenure:3,tags:[],classification:'待发展',performance:'B',
      ucResume:{
        work:[
          {start:'2023-07',end:'至今',unit:'集团总部',dept:'研发中心',position:'测试工程师',manager:'孙伟'}
        ],
        training:[
          {start:'2025-03-10',end:'2025-03-28',content:'自动化测试框架与持续交付实训',org:'研发质量部',cert:'自动化测试认证',note:'补齐接口回归脚本覆盖'}
        ],
        teaching:[]
      },
      ucAgreements:[]
    }
  ];
  const people = Standards.people.map((person,i) => ({...person,...base[i],id:ids[i],employeeId:employeeIds[i]}));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const uid = prefix => {
    if(typeof crypto.randomUUID==='function')return prefix+'-'+crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));
    bytes[6]=(bytes[6]&15)|64;
    bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
    return prefix+'-'+[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  };
  const reviewProjects = [
  {
    "id": "review-annual",
    "name": "2026 年度人才盘点",
    "owner": "李文静",
    "date": "2026-07-30",
    "url": "review-detail.html",
    "people": [
      {
        "id": "zhangming",
        "name": "张明",
        "department": "研发中心",
        "position": "架构师",
        "ability": "88%",
        "performance": "高",
        "classification": "核心人才"
      },
      {
        "id": "lihua",
        "name": "李华",
        "department": "研发中心",
        "position": "高级算法工程师",
        "ability": "76%",
        "performance": "高",
        "classification": "关键人才"
      },
      {
        "id": "wangfang",
        "name": "王芳",
        "department": "销售中心",
        "position": "区域销售总监",
        "ability": "78%",
        "performance": "高",
        "classification": "关键人才"
      },
      {
        "id": "chenqiang",
        "name": "陈强",
        "department": "研发中心",
        "position": "测试工程师",
        "ability": "48%",
        "performance": "低",
        "classification": "重点关注"
      }
    ]
  },
  {
    "id": "review-sales",
    "name": "销售铁军盘点",
    "owner": "张敏",
    "date": "2026-08-15",
    "url": "review-detail.html?case=sales",
    "people": [
      {
        "id": "review-sales-1",
        "name": "周凯",
        "department": "销售中心",
        "position": "大区销售总监",
        "ability": "91%",
        "performance": "高",
        "classification": "核心人才"
      },
      {
        "id": "review-sales-2",
        "name": "林雪",
        "department": "销售中心",
        "position": "战略客户总监",
        "ability": "86%",
        "performance": "高",
        "classification": "核心人才"
      },
      {
        "id": "review-sales-3",
        "name": "王磊",
        "department": "销售中心",
        "position": "区域销售经理",
        "ability": "78%",
        "performance": "高",
        "classification": "关键人才"
      },
      {
        "id": "review-sales-4",
        "name": "赵颖",
        "department": "销售中心",
        "position": "高级渠道经理",
        "ability": "74%",
        "performance": "高",
        "classification": "关键人才"
      },
      {
        "id": "review-sales-5",
        "name": "陈晨",
        "department": "销售中心",
        "position": "高级销售经理",
        "ability": "83%",
        "performance": "中",
        "classification": "骨干人才"
      },
      {
        "id": "review-sales-6",
        "name": "孙杰",
        "department": "销售中心",
        "position": "大客户销售经理",
        "ability": "69%",
        "performance": "中",
        "classification": "稳定贡献"
      },
      {
        "id": "review-sales-7",
        "name": "刘洋",
        "department": "销售中心",
        "position": "销售顾问",
        "ability": "57%",
        "performance": "高",
        "classification": "重点提升"
      },
      {
        "id": "review-sales-8",
        "name": "何静",
        "department": "销售中心",
        "position": "区域销售经理",
        "ability": "64%",
        "performance": "低",
        "classification": "待观察"
      },
      {
        "id": "review-sales-9",
        "name": "蒋峰",
        "department": "销售中心",
        "position": "渠道经理",
        "ability": "52%",
        "performance": "低",
        "classification": "重点关注"
      },
      {
        "id": "review-sales-10",
        "name": "顾婷",
        "department": "销售中心",
        "position": "高级销售顾问",
        "ability": "82%",
        "performance": "低",
        "classification": "能力错配"
      }
    ]
  }
];
  const initial = () => ({
    selections:{}, pools:[], followups:[], actions:[],
    evidence:[
      {id:'ev-zhang',person:'zhangming',name:'架构师能力评估',type:'360评估',date:'2026-07-28',validUntil:'2027-07-28',values:[['系统架构',4.4],['技术选型',4.6],['团队管理',3.2],['跨部门沟通',2.8],['创新思维',4.2]]},
      {id:'ev-zhang-ungraded',person:'zhangming',name:'项目立项规范考核导入',type:'人员能力数据',date:'2026-09-20',importedAt:'2026-09-20T09:00:00Z',abilityImport:{employeeId:'EMP-1026',name:'张明',category:'技能.专业能力.行政簇',ability:'项目立项规范',level:null,score:92,ungraded:true,source:'人才库导入'},values:[['项目立项规范',92]]},
      {id:'ev-li',person:'lihua',name:'算法专业能力评估',type:'能力评估',date:'2026-09-15',validUntil:'2027-09-15',values:[['算法设计',4],['模型工程',3],['特征工程',3],['编程能力',4],['业务理解',3],['跨部门沟通',3],['创新思维',4]]},
      {id:'ev-wang',person:'wangfang',name:'销售管理能力评估',type:'能力评估',date:'2026-09-18',validUntil:'2027-09-18',values:[['客户洞察',4],['顾问式销售',4],['商务谈判',3],['商机管理',4],['协同推进',3]]}
    ],
    reviews: people.map(p => ({id:'review-'+p.id,person:p.id,project:'2026 年度人才盘点',date:'2026-07-30',method:'宫格盘点',classification:p.classification,performance:p.performance}))
  });
  function read() {
    let parsed = null;
    try { const raw = localStorage.getItem(key); if (raw) parsed = JSON.parse(raw); } catch {}
    const data = parsed || initial();
    data.selections ||= {}; data.pools ||= []; data.followups ||= []; data.actions ||= []; data.evidence ||= []; data.reviews ||= [];
    seedProjectPools(data);
    return data;
  }
  function write(data) { localStorage.setItem(key,JSON.stringify(data)); }
  const person = id => people.find(p=>p.id===id);
  const activeMembers = pool => pool.members.filter(m=>!m.exited);
  const poolsFor = (data,id) => data.pools.filter(p=>activeMembers(p).some(m=>m.person===id));
  function evidence(data,id,asOf=today()) { return data.evidence.filter(r=>r.person===id && r.date<=asOf && (!r.validUntil || r.validUntil>=asOf)); }
  function values(data,id) {
    const map=new Map();
    evidence(data,id).forEach(record => record.values.forEach(([name,value]) => {
      const previous=map.get(name)?.record;
      if(!previous||record.date>previous.date||(record.date===previous.date&&(record.importedAt||'')>=(previous.importedAt||'')))map.set(name,{value,record});
    }));
    return map;
  }
  function requirements(standard) {
    const c=standard?.content||{}, result=[];
    const enabled=new Set(typeof Standards?.dimensionsOf==='function'?Standards.dimensionsOf(standard):(Array.isArray(standard?.enabledDimensions)&&standard.enabledDimensions.length?standard.enabledDimensions:['duty','exp','cap','pow','pot']));
    if(enabled.has('duty'))(c.duty||[]).forEach(d=>result.push({kind:'职责任务',name:d.n,detail:(d.t||[]).join('；')}));
    if(enabled.has('exp'))(c.exp||[]).forEach(name=>result.push({kind:'经历经验',name}));
    if(enabled.has('cap'))(c.cap||[]).forEach(([name,level])=>{const graded=/^L(?:10|[1-9])$/.test(level||'');result.push({kind:'能力要求',name,level:graded?level:'不分级',threshold:graded?Number(level.slice(1)):null,ungraded:!graded});});
    [['pow','动力要求'],['pot','潜力要求']].forEach(([dim,kind])=>{if(enabled.has(dim))(c[dim]||[]).forEach(name=>result.push({kind,name}));});
    return result;
  }
  function compare(data,id,standard) {
    const actual=values(data,id);
    return requirements(standard).map(r=>{
      const found=r.kind==='能力要求'?actual.get(r.name):null;
      const known=!!found&&r.threshold!==null&&!found.record?.abilityImport?.ungraded;
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
    const poolsByPosition=new Map();
    data.pools.forEach(pool=>{
      if(!poolsByPosition.has(pool.target))poolsByPosition.set(pool.target,[]);
      poolsByPosition.get(pool.target).push(pool);
    });
    return Standards.positions.filter(p=>p.critical).map(position=>{
      const pools=poolsByPosition.get(position.id)||[],memberIds=new Set(),dueIds=new Set();
      pools.forEach(pool=>activeMembers(pool).forEach(member=>{
        memberIds.add(member.person);
        if(member.nextReview&&member.nextReview<today())dueIds.add(member.person);
      }));
      const people=[...memberIds].filter(id=>!department||person(id)?.department===department),peopleSet=new Set(people);
      const linked=Standards.associated(standards,position.id);
      const due=[...dueIds].filter(id=>peopleSet.has(id));
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
  const sourceProject = pool => reviewProjects.find(project=>project.id===pool.sourceProject);
  const poolPerson = member => member.profile || person(member.person);
  function seedProjectPools(data) {
    const seeds=[['annual-core','核心人才池','review-annual',10,['zhangming','lihua','wangfang']],['annual-focus','重点发展人才池','review-annual',12,['chenqiang']],['sales-core','销售核心人才池','review-sales',8,['review-sales-1','review-sales-2','review-sales-3']],['sales-reserve','区域负责人后备池','review-sales',10,['review-sales-2','review-sales-5']]];
    for(const [id,name,sourceProject,expected,ids] of seeds) {
      if(data.pools.some(pool=>pool.id==='pool-'+id))continue;
      const project=reviewProjects.find(item=>item.id===sourceProject);
      const pool={id:'pool-'+id,name,sourceProject,expected,owner:project.owner,purpose:'',created:project.date,members:ids.map(personId=>({
        id:'pool-'+id+'-'+personId,person:personId,profile:{...project.people.find(p=>p.id===personId)},joined:project.date,
        reason:'依据盘点结果确认入池',confirmedBy:project.owner,sourceProject,source:project.name,exited:null,exitReason:''
      }))};
      data.pools.push(pool);
    }
  }
  function addMembers(data,pool,ids,reason) {
    const project=sourceProject(pool);
    if(!project)throw new Error('请先关联来源盘点项目，再从该项目组建人员');
    const unique=[...new Set(ids)];
    if(unique.some(id=>!project.people.some(p=>p.id===id)))throw new Error('只能加入来源盘点项目内的人员');
    const memberIds=new Set(activeMembers(pool).map(member=>member.person));
    let count=0;
    for(const id of unique) {
      if(memberIds.has(id))continue;
      const profile=project.people.find(p=>p.id===id);
      pool.members.push({id:uid('member'),person:id,profile:{...profile},joined:today(),reason,confirmedBy:'李文静',sourceProject:project.id,source:project.name,exited:null,exitReason:''});
      memberIds.add(id);
      count++;
    }
    return count;
  }
  window.Talent={reviewProjects,sourceProject,poolPerson,key,people,person,today,uid,read,write,evidence,values,requirements,compare,summary,filterPeople,activeMembers,poolsFor,addMembers,latestReview,developmentItems,createDevelopment,confirmStage,reserveRows};
})();
