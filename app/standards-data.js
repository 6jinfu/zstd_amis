/* 标准共享数据：静态原型使用本机浏览器保存；岗位与人员来自现有列表。 */
(function () {
  const key = 'talent-standards-v1';
  const positions = [
    ['RD-302','架构师','研发',true], ['RD-301','高级算法工程师','研发',true],
    ['RD-205','后端开发工程师','研发',true], ['SA-201','销售经理','销售',true],
    ['SA-301','区域销售总监','销售',true], ['SA-110','大客户销售经理','销售',true],
    ['RD-102','前端开发工程师','研发',false], ['FN-203','财务分析经理','职能',false],
    ['HR-101','招聘专员','职能',false]
  ].map(([id,name,category,critical]) => ({id,name,category,critical}));
  const people = [
    ['张明','架构师','研发中心',true], ['李华','算法工程师','研发中心',true],
    ['王芳','区域销售总监','销售中心',true], ['赵琳','财务分析经理','职能中台',false],
    ['陈强','测试工程师','研发中心',false]
  ].map(([name,position,department,critical]) => ({name,position,department,critical,category:positions.find(p=>p.name===position)?.category || null}));
  const modes = {positions:'指定岗位', rules:'按条件匹配', none:'暂不关联'};
  const fields = {position:'现岗位',department:'部门',category:'岗位类别',critical:'关键岗位'};
  const legacyCategoryMap = {研发:'研发序列',销售:'销售序列',职能:'通用标准',运营:'专项标准'};
  const defaultCategoryTree = () => [
    {name:'通用标准'},
    {name:'岗位序列标准',children:['产品序列','研发序列','销售序列','专业序列']},
    {name:'职级标准'},
    {name:'专项标准'}
  ];
  const flattenCategoryTree = tree => tree.flatMap(node=>[node.name,...(node.children||[])]);
  const clone = x => JSON.parse(JSON.stringify(x));
  const emptyContent = () => ({duty:[],exp:[],cap:[],pow:[],pot:[]});
  function initial() {
    const seeds = window.STANDARD_POSITION_SEEDS;
    const categoryTree = defaultCategoryTree();
    const categoryMap = {研发:'研发序列',销售:'销售序列',职能:'通用标准',运营:'专项标准'};
    const from = (id,s) => ({id,name:s.name+'标准',category:categoryMap[s.category]||'通用标准',description:'',mode:'positions',positions:[s.code],groups:[],content:clone(s.standard),updated:'2026-09-07'});
    return {categories:flattenCategoryTree(categoryTree),categoryTree,standards:[
      from('std-algorithm',seeds.algorithm), from('std-sales',seeds.sales),
      {id:'std-architecture',name:'架构师标准',category:'研发序列',description:'承担系统架构设计、技术选型与跨团队技术协作。',mode:'positions',positions:['RD-302'],groups:[],updated:'2026-09-07',content:{duty:[{n:'负责系统架构与技术方案',t:['完成架构设计与技术选型','推进跨团队技术协作']}],exp:[],cap:[['系统架构','L4'],['技术选型','L4'],['团队管理','L3'],['跨部门沟通','L3'],['创新思维','L3']],pow:[],pot:[]}},
      {id:'std-collaboration',name:'研发协作能力标准',category:'通用标准',description:'用于演示跨岗位的共同能力要求。',mode:'rules',positions:[],groups:[[{field:'department',values:['研发中心']},{field:'critical',values:['是']}]],updated:'2026-09-07',content:{duty:[{n:'参与技术协作与知识共享',t:['清晰同步问题、风险及处理进展']}],exp:[],cap:[['跨部门沟通','L4'],['创新思维','L3']],pow:[],pot:[]}},
      {id:'std-chip',name:'芯片前端设计标准',category:'专项标准',description:'参考芯片设计资料建立的标准示例，标准内容待配置。',mode:'none',positions:[],groups:[],content:emptyContent(),updated:'2026-09-07'},
      {id:'std-advertising',name:'亚马逊广告专业标准',category:'专业序列',description:'参考广告专业序列资料建立的标准示例，标准内容待配置。',mode:'none',positions:[],groups:[],content:emptyContent(),updated:'2026-09-07'}
    ],links:{},excluded:{},selected:{}};
  }
  function read() {
    const raw=localStorage.getItem(key), data=raw ? JSON.parse(raw) : initial();
    let migrated=false;
    (data.standards||[]).forEach(s=>{if(legacyCategoryMap[s.category]){s.category=legacyCategoryMap[s.category];migrated=true;}if(s.id==='std-collaboration'&&s.category==='研发序列'){s.category='通用标准';migrated=true;}});
    const currentCategories=Array.isArray(data.categories)?data.categories:[];
    let tree=Array.isArray(data.categoryTree)&&data.categoryTree.length?data.categoryTree:defaultCategoryTree();
    if(currentCategories.some(name=>legacyCategoryMap[name])){
      const extras=currentCategories.filter(name=>!legacyCategoryMap[name]&&!flattenCategoryTree(tree).includes(name));
      tree=defaultCategoryTree().concat(extras.map(name=>({name})));
      migrated=true;
    }
    const categories=[...new Set([...flattenCategoryTree(tree),...currentCategories.filter(name=>!legacyCategoryMap[name])])];
    if(JSON.stringify(data.categoryTree)!==JSON.stringify(tree)||JSON.stringify(data.categories)!==JSON.stringify(categories)){data.categoryTree=tree;data.categories=categories;migrated=true;}
    if(migrated)localStorage.setItem(key,JSON.stringify(data));
    (data.standards||[]).forEach(s=>{ delete s.object; delete s.objectDescription; });
    return data;
  }
  function write(data) { localStorage.setItem(key,JSON.stringify(data)); }
  function match(s,person) {
    if(s.mode==='none') return false;
    if(s.mode==='positions') return s.positions.some(id=>positions.find(p=>p.id===id)?.name===person.position);
    if(!s.groups.length) return false;
    let unknown=false;
    for(const group of s.groups) {
      if(!group.length) continue;
      let fail=false,missing=false;
      for(const rule of group) {
        const value=person[rule.field];
        if(value===undefined || value===null || value==='') missing=true;
        else if(!rule.values.includes(rule.field==='critical' ? (value?'是':'否') : value)) fail=true;
      }
      if(!fail&&!missing) return true;
      if(!fail&&missing) unknown=true;
    }
    return unknown ? null : false;
  }
  function summary(s) {
    if(s.mode==='none') return '暂未关联岗位或人员';
    if(s.mode==='positions') return s.positions.map(id=>positions.find(p=>p.id===id)?.name || id).join('、') || '未选择岗位';
    return s.groups.map(g=>g.map(r=>fields[r.field]+'：'+(r.values.join('、')||'未选择')).join(' 且 ')).join('；或 ');
  }
  function countApplicable(data,s) {
    if(s.mode==='rules') return people.filter(person=>match(s,person)===true).length;
    const direct=new Set([...(s.positions||[]), ...Object.keys(data.links||{}).filter(id=>(data.links[id]||[]).includes(s.id))]);
    return direct.size;
  }
  function applicableObjectLabel(data,s) {
    if(s.mode==='none') return '—';
    if(s.mode==='rules') return summary(s);
    const ids=[...(s.positions||[]), ...Object.keys(data.links||{}).filter(id=>(data.links[id]||[]).includes(s.id))];
    return [...new Set(ids)].map(id=>positions.find(p=>p.id===id)?.name || id).join('、') || '—';
  }
  function associated(data,id) { return data.standards.filter(s=>(s.mode==='positions'&&s.positions.includes(id)) || (data.links[id]||[]).includes(s.id)); }
  function forPerson(data,person) {
    const p=positions.find(p=>p.name===person.position);
    return data.standards.filter(s=>match(s,person)===true || (p&&(data.links[p.id]||[]).includes(s.id)));
  }
  window.Standards={key,positions,people,modes,fields,clone,emptyContent,read,write,match,summary,countApplicable,applicableObjectLabel,associated,forPerson};
})();
