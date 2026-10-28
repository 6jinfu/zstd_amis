(function () {
  const T=window.Talent, P=window.TalentPools, S=window.Standards, main=document.querySelector('[data-talent-center]');
  if(!main)return;
  const e=UI.escape, q=new URLSearchParams(location.search), page=main.dataset.talentCenter;
  let data, standards;
  try { data=T.read(); standards=S.read(); } catch(error) { main.innerHTML='<div class="empty-state">未能读取人才数据，请检查浏览器存储后刷新。</div>'; return; }
  let filters={query:'',department:'',classification:'',critical:'',tag:'',pool:'',ability:'',level:'1',since:'',coverage:'',inPool:'',target:'',standard:'',requirementStatus:''};
  for(const key of Object.keys(filters))if(q.has(key))filters[key]=q.get(key);
  let dashboardMode=q.get('theme')==='reserve'?'reserve':'overview';
  let selected=new Set(), listPage=1, poolQuery='', poolPage=1, activeTab=q.get('section')||'overview';
  let target=q.get('target')||'RD-302', compareStandard=q.get('standard')||'', abilityChart=null;
  const currentPerson=T.person(q.get('person')||'zhangming');
  const b=(text,action,cls='btn btn-secondary',extra='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  const opt=(value,label,chosen)=>`<option value="${e(value)}" ${value===chosen?'selected':''}>${e(label)}</option>`;
  const options=(items,chosen,empty='全部')=>opt('',empty,chosen)+items.map(x=>typeof x==='string'?opt(x,x,chosen):opt(x.id,x.name,chosen)).join('');
  const field=(label,id,control)=>`<div class="field"><label for="${id}">${label}</label>${control}</div>`;
  const input=(id,value='',type='text',extra='')=>`<input class="input" id="${id}" type="${type}" value="${e(value)}" ${extra}>`;
  const select=(id,content,extra='')=>`<select class="select" id="${id}" ${extra}>${content}</select>`;
  const empty=(title,detail='',action='')=>`<div class="tc-empty"><strong>${title}</strong><p>${detail}</p>${action}</div>`;
  const tag=(label)=>`<span class="tag ${label==='已满足'?'tag-success':label==='待发展'?'tag-warning':label==='待补充证据'?'':'tag-primary'}">${e(label)}</span>`;
  const contextQuery=()=>{const context=page==='compare'?{target,standard:compareStandard}:page==='profile'?{target:q.get('target')||data.selections[currentPerson?.id]?.target||'',standard:q.get('standard')||data.selections[currentPerson?.id]?.standard||''}:filters;return new URLSearchParams(Object.fromEntries(['target','standard'].filter(k=>context[k]).map(k=>[k,context[k]]))).toString();};
  const listReturn=()=> 'talent-list.html'+(contextQuery()?'?'+contextQuery():'');
  const linkPerson=id=>`talent-profile.html?person=${encodeURIComponent(id)}${contextQuery()?'&'+contextQuery():''}`;
  const standardLink=s=>s?`<a class="btn-text" href="standard-detail.html?id=${encodeURIComponent(s.id)}">查看标准</a>`:'';
  const back=(href,title,actions='')=>`<div class="detail-bar"><div class="db-left"><a class="back" href="${href}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>返回</a><h1>${e(title)}</h1></div><div class="tc-actions">${actions}</div></div>`;
  const table=(headers,rows,cls='',id='')=>`<div class="table-wrap"><table class="t ${cls}" ${id?`id="${id}"`:''}><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const facts=entries=>`<dl class="tc-facts">${entries.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const section=(title,content,action='')=>`<section class="tc-section"><div class="tc-section-head"><h2>${title}</h2>${action}</div>${content}</section>`;
  const poolById=()=>data.pools.find(p=>p.id===q.get('pool'));
  const standardsFor=position=>S.associated(standards,position);
  const poolNames=id=>T.poolsFor(data,id).map(p=>`<a class="btn-text" href="talent-pool-detail.html?pool=${encodeURIComponent(p.id)}">${e(p.name)}</a>`).join('、')||'<span class="muted">—</span>';
  function save() {
    try { T.write(data); return true; } catch(error) { data=T.read(); showToast('保存失败，请检查浏览器存储空间后重试'); return false; }
  }
  function pager(total,current,prefix) {
    const pages=Math.max(1,Math.ceil(total/10));
    return `<div class="pagination"><div class="pg-info" role="status">共 ${total} 条 · 每页 10 条</div><div class="pg-controls">${b('上一页',prefix+'-prev','pg-btn',current<=1?'disabled':'')}<span>${current} / ${pages}</span>${b('下一页',prefix+'-next','pg-btn',current>=pages?'disabled':'')}</div></div>`;
  }
  function updateSelection() {
    const label=document.getElementById('tc-selected');if(label)label.textContent=selected.size?`已选 ${selected.size} 人`:"";
    const compare=main.querySelector('[data-action=compare]');if(compare)compare.disabled=selected.size<2||selected.size>5;
  }
  function listPeople() {
    const standard=standardsFor(filters.target).find(s=>s.id===filters.standard);
    return T.filterPeople(data,filters).filter(p=>{
      if(!standard||!filters.requirementStatus)return true;
      return T.compare(data,p.id,standard).some(r=>r.status===filters.requirementStatus);
    });
  }
  function list() {
    const people=listPeople(),shown=people.slice((listPage-1)*10,listPage*10),available=filters.target?standardsFor(filters.target):[],standard=available.find(s=>s.id===filters.standard);
    const advanced=['critical','tag','pool','ability','since','inPool','requirementStatus'].filter(key=>filters[key]);
    const params=new URLSearchParams(Object.entries(filters).filter(([key,value])=>value&&(key!=='level'||filters.ability)));
    history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():''));
    main.innerHTML=`<div class="list-workbench list-workbench-tree"><aside class="cat-tree-panel" aria-label="人才范围"><div class="ctp-head"><span class="ctp-title">所属部门</span></div>${['',...new Set(T.people.map(p=>p.department))].map(d=>b(e(d||'全部'),'department','cat-tree-item'+(filters.department===d?' active':''),`data-value="${e(d)}" aria-pressed="${filters.department===d}"`)).join('')}</aside>
      <section class="list-main"><form class="filter-bar tc-list-filters" id="tc-query">${field('姓名 / 岗位','tc-query-text',input('tc-query-text',filters.query,'search','placeholder="请输入姓名或岗位"'))}${field('人才分类','tc-classification',select('tc-classification',options([...new Set(data.reviews.map(r=>r.classification))],filters.classification)))}${field('评鉴覆盖','tc-list-coverage',select('tc-list-coverage',options([{id:'valid',name:'有有效评鉴'},{id:'missing',name:'无有效评鉴'}],filters.coverage)))}${field('目标岗位','tc-list-target',select('tc-list-target',options(S.positions,filters.target,'请选择岗位')))}${field('采用标准','tc-list-standard',select('tc-list-standard',options(available,filters.standard,filters.target?'请选择标准':'先选择目标岗位'),!filters.target?'disabled':''))}<div class="actions"><button class="btn btn-primary" type="submit">查询</button>${b('重置','reset')}${b('更多筛选'+(advanced.length?`（${advanced.length}）`:''),'advanced','btn-text')}</div>${filters.target&&!available.length?'<p class="tc-filter-explanation">该岗位暂无关联标准，请在人才标准中配置后比较岗位要求。</p>':''}</form>
      <div class="tc-list-toolbar"><div class="tc-actions">${b('人才对比','compare','btn btn-secondary',selected.size<2?'disabled':'')}<span class="text-sm muted" id="tc-selected" role="status"></span></div><div class="tc-actions">${standardLink(standard)}${b('导出','export','btn btn-secondary')}</div></div>
      <div class="card">${table(['<input type="checkbox" id="tc-all" aria-label="选择当前页全部人员">','姓名','所属部门','现岗位','最近盘点',...(standard?['已满足','待发展','待补证据']:['最近评鉴']),'操作'],shown.map(p=>{const date=T.evidence(data,p.id).map(r=>r.date).sort().at(-1),review=T.latestReview(data,p.id),summary=standard?T.summary(T.compare(data,p.id,standard)):null;return `<tr><td><input type="checkbox" data-person-check="${p.id}" aria-label="选择${p.name}" ${selected.has(p.id)?'checked':''}></td><td><a class="tc-name-link" href="${linkPerson(p.id)}">${e(p.name)}</a></td><td>${e(p.department)}</td><td>${e(p.position)}</td><td title="${e(review?review.project+' · '+review.date:'暂无盘点记录')}">${review?tag(review.classification):'—'}</td>${summary?`<td class="tc-number">${summary.met}</td><td class="tc-number ${summary.gaps?'tc-warning-text':''}">${summary.gaps}</td><td class="tc-number muted">${summary.total-summary.known}</td>`:`<td class="tc-number">${date||'<span class="muted">—</span>'}</td>`}<td><a class="btn-text" href="${linkPerson(p.id)}">查看</a></td></tr>`;}).join('')||`<tr><td colspan="${standard?9:7}">${empty('暂无符合条件的人才','',b('重置筛选','reset','btn-text'))}</td></tr>`,'native-sticky-table tc-table'+(standard?' tc-target-table':''))}${pager(people.length,listPage,'list')}</div></section></div>`;
    UI.mountCategoryTrees(main);
    const all=document.getElementById('tc-all');all.checked=shown.length>0&&shown.every(p=>selected.has(p.id));all.indeterminate=shown.some(p=>selected.has(p.id))&&!all.checked;all.disabled=!shown.length;
    updateSelection();
  }
  function advanced() {
    const abilities=[...new Set(data.evidence.flatMap(r=>r.values.map(v=>v[0])))];
    UI.openDialog({title:'更多筛选',body:`<div class="tc-form tc-advanced-filters">${field('关键岗位','tc-critical',select('tc-critical',options([{id:'true',name:'是'},{id:'false',name:'否'}],filters.critical)))}${field('业务标签','tc-tag',select('tc-tag',options([...new Set(T.people.flatMap(p=>p.tags))],filters.tag)))}${field('所属人才池','tc-pool-filter',select('tc-pool-filter',options(data.pools,filters.pool)))}${field('是否入池','tc-in-pool',select('tc-in-pool',options([{id:'yes',name:'已入池'},{id:'no',name:'尚未入池'}],filters.inPool)))}${filters.standard?field('要求状态','tc-requirement-status',select('tc-requirement-status',options(['待发展','待补充证据','已满足'],filters.requirementStatus,'全部要求状态'))):''}${field('能力指标','tc-ability',select('tc-ability',options(abilities,filters.ability)))}<div class="tc-inline-fields">${field('最低等级','tc-level',select('tc-level',[1,2,3,4,5].map(n=>opt(String(n),'L'+n,filters.level)).join('')))}${field('评鉴起始日期','tc-since',input('tc-since',filters.since,'date'))}</div></div>`,confirmLabel:'应用筛选',onConfirm(d){
      if(d.querySelector('#tc-since').value&&!d.querySelector('#tc-ability').value){d.showError('选择能力指标后，再设置评鉴起始日期');return false;}
      Object.assign(filters,{critical:d.querySelector('#tc-critical').value,tag:d.querySelector('#tc-tag').value,pool:d.querySelector('#tc-pool-filter').value,inPool:d.querySelector('#tc-in-pool').value,requirementStatus:d.querySelector('#tc-requirement-status')?.value||'',ability:d.querySelector('#tc-ability').value,level:d.querySelector('#tc-level').value,since:d.querySelector('#tc-since').value});selected.clear();listPage=1;list();
    }});
  }
  function poolForm(pool) {
    P.form(data,pool,record=>{if(!save())return false;render();return true;});
  }
  function addToPool(ids) {
    if(!ids.length){showToast('请先选择人员');return;}
    const available=data.pools.filter(pool=>{const project=T.sourceProject(pool);return project&&ids.every(id=>project.people.some(p=>p.id===id));});
    if(!available.length){showToast('所选人员没有共同的来源盘点项目人才池，请从盘点项目组建');return;}
    UI.openDialog({title:'加入人才池',body:`<div class="tc-form">${field('人才池 *','tc-add-pool',select('tc-add-pool',options(available,'','请选择')))}</div>`,confirmLabel:'确认入池',onConfirm(dialog){
      const pool=available.find(p=>p.id===dialog.querySelector('select').value);if(!pool){dialog.showError('请选择人才池');return false;}
      const count=T.addMembers(data,pool,ids,'依据来源盘点项目结果确认入池');if(!save())return false;selected.clear();render();showToast(`已加入 ${count} 人，已在池人员自动跳过`);return true;
    }});
  }
  function pools() {
    const rows=data.pools.filter(p=>`${p.name} ${p.owner}`.includes(poolQuery));poolPage=Math.min(poolPage,Math.max(1,Math.ceil(rows.length/10)));
    main.innerHTML=`<div class="list-workbench tc-pool-workbench"><section class="list-main"><form class="filter-bar" id="tc-pool-query">${field('名称 / 创建人','tc-pool-search',input('tc-pool-search',poolQuery,'search','placeholder="请输入"'))}<div class="actions"><button type="submit" class="btn btn-primary">查询</button>${b('重置','pool-reset')}</div></form><div class="flex between center mb-md"><div class="tc-actions">${b('新建人才池','new-pool','btn btn-primary')}</div></div><div class="card">${table(['人才池名称','来源盘点项目','创建人','期望人数','实际人数','操作'],rows.slice((poolPage-1)*10,poolPage*10).map(p=>`<tr><td><a class="tc-name-link" href="talent-pool-detail.html?pool=${e(p.id)}">${e(p.name)}</a></td><td>${P.sourceLink(p)}</td><td>${e(p.owner)}</td><td>${e(p.expected||'—')}</td><td>${T.activeMembers(p).length}</td><td>${b('组建','build-pool','btn-text',`data-id="${e(p.id)}"`)}<a class="btn-text" href="talent-pool-detail.html?pool=${e(p.id)}">查看</a>${b('编辑','edit-pool','btn-text',`data-id="${e(p.id)}"`)}</td></tr>`).join('')||`<tr><td colspan="6">${empty(data.pools.length?'暂无符合条件的人才池':'暂无人才池')}</td></tr>`,'native-sticky-table')}${pager(rows.length,poolPage,'pool')}</div></section></div>`;
  }
  function stats(rows) {
    const s=T.summary(rows);return `<div class="tc-stats"><div class="tc-stat"><span>标准要求</span><strong>${s.total}<small> 项</small></strong></div><div class="tc-stat"><span>已满足</span><strong>${s.met}<small> 项</small></strong></div><div class="tc-stat"><span>待发展</span><strong>${s.gaps}<small> 项</small></strong></div><div class="tc-stat"><span>待补充证据</span><strong>${s.total-s.known}<small> 项</small></strong></div></div>`;
  }
  function requirementTable(rows) {return table(['类型','标准要求','有效证据','状态','操作'],rows.map(r=>`<tr><td>${r.kind}</td><td>${e(r.name)}${r.level?` · ${e(r.level)}`:''}${r.detail?`<span class="tc-sub">${e(r.detail)}</span>`:''}</td><td>${r.actual?`${r.actual.value}/5<span class="tc-sub">${e(r.actual.record.name)} · ${e(r.actual.record.date)}</span>`:'<span class="muted">暂无可比证据</span>'}</td><td>${tag(r.status)}</td><td>${r.status==='已满足'?'—':b(r.status==='待发展'?'安排培养':'记录证据需求',r.status==='待发展'?'plan-gap':'evidence-need','btn-text',`data-goal="${e(r.name+(r.level?' · '+r.level:''))}"`)}</td></tr>`).join(''),'tc-requirements');}
  function evidenceDialog(id) {
    const r=data.evidence.find(x=>x.id===id);if(!r)return;
    UI.openDialog({title:r.name,body:`<p class="tc-context">${e(T.person(r.person)?.name||'')} · ${e(r.type)} · ${e(r.date)}<br>有效至 ${e(r.validUntil||'未设置')}</p>${table(['能力指标','结果（5级量表）'],r.values.map(([n,v])=>`<tr><td>${e(n)}</td><td>${v}/5</td></tr>`).join(''))}`,confirmLabel:'关闭',cancelLabel:''});
  }
  function followup(person,poolId,requirement='') {
    UI.openDialog({title:'记录发展跟进',body:`<div class="tc-form"><p class="tc-chosen">${e(T.person(person).name)}</p>${field('记录类型','tc-follow-type',select('tc-follow-type',options(['发展沟通','培养跟进','复评记录','证据补充'],requirement?'证据补充':'发展沟通','请选择')))}${field('记录日期 *','tc-follow-date',input('tc-follow-date',T.today(),'date'))}${field('跟进内容 *','tc-follow-note',`<textarea class="input" id="tc-follow-note" maxlength="1500" placeholder="记录沟通、培养进展或复评依据">${e(requirement?'需补充“'+requirement+'”的有效证据，请核对来源并安排评鉴。':'')}</textarea>`)}${field('下次跟进日期','tc-follow-next',input('tc-follow-next','','date'))}</div>`,confirmLabel:'保存记录',onConfirm(d){const note=d.querySelector('textarea').value.trim(),date=d.querySelector('#tc-follow-date').value,next=d.querySelector('#tc-follow-next').value,kind=d.querySelector('#tc-follow-type').value;if(!note||!date||!kind){d.showError('请填写记录类型、日期和跟进内容');return false;}if(date>T.today()||next&&next<date){d.showError('记录日期不能晚于今天，下次跟进不能早于记录日期');return false;}data.followups.push({id:T.uid('follow'),person,poolId:poolId||'',kind,date,note,next,owner:'李文静'});if(poolId&&next){const member=data.pools.find(p=>p.id===poolId)?.members.find(m=>m.person===person&&!m.exited);if(member)member.nextReview=next;}if(!save())return false;render();}});
  }
  function historyRows(records) {return records.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<article class="tc-history"><time>${e(r.date)}</time><div><strong>${e(r.kind)}</strong><p>${e(r.note)}</p><span class="tc-sub">${e(r.owner)}${r.next?' · 下次跟进 '+e(r.next):''}${r.poolId?' · '+e(data.pools.find(p=>p.id===r.poolId)?.name||'人才池'):''}</span></div></article>`).join('');}
  function planTable(person,poolId) {
    const plans=T.developmentItems(data,person,poolId);
    return plans.length?table([...(poolId?['培养对象']:[]),'培养目标','导师 / 负责人','培养周期','阶段进度','操作'],plans.map(plan=>{const done=plan.stages.filter(r=>r.completed).length;return `<tr>${poolId?`<td><a class="btn-text" href="${linkPerson(plan.person)}&section=development">${e(T.person(plan.person).name)}</a></td>`:''}<td>${e(plan.title)}<span class="tc-sub">${e(plan.goal)}</span></td><td>${e(plan.mentor)}<span class="tc-sub">${e(plan.owner)}</span></td><td class="tc-plan-date">${e(plan.start)}<span class="tc-sub">至 ${e(plan.due)}</span></td><td><span class="tc-number">${done} / ${plan.stages.length}</span><span class="tc-sub">${done===plan.stages.length?'已完成':plan.due<T.today()?'已逾期':plan.start>T.today()?'未开始':'进行中'}</span></td><td>${b('查看计划','view-plan','btn-text',`data-id="${e(plan.id)}"`)}</td></tr>`;}).join(''),'tc-plan-table'):empty('暂无个人发展计划');
  }
  function planForm(person,poolId,requirement) {
    const p=T.person(person),pools=T.poolsFor(data,person),selectedPool=pools.find(p=>p.id===poolId),chosen=data.selections[person]||{};
    let basis=selectedPool?.standardSnapshot||standards.standards.find(s=>s.id===(document.getElementById('tc-profile-standard')?.value||q.get('standard')||chosen.standard)),position=selectedPool?.target||q.get('target')||chosen.target||'';
    if(!basis){showToast('请先明确目标岗位和采用标准，再建立个人发展计划');return;}
    const dateAfter=(start,days)=>{const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
    UI.openDialog({title:'建立个人发展计划（IDP）',body:`<div class="tc-form"><p class="tc-chosen">${e(p.name)} · ${e(basis.name)}</p>${field('计划名称 *','tc-plan-title',input('tc-plan-title',p.name+'个人发展计划','text','maxlength="80"'))}${field('培养目标 *','tc-plan-goal',`<textarea class="input" id="tc-plan-goal" maxlength="500" placeholder="明确要改进的要求及预期成果">${e(requirement||'')}</textarea>`)}${field('所属人才池','tc-plan-pool',select('tc-plan-pool',options(pools.filter(pool=>pool.standard===basis.id&&pool.target===position&&JSON.stringify(pool.standardSnapshot?.content)===JSON.stringify(basis.content)),poolId||'','不关联人才池')))}<div class="tc-inline-fields">${field('导师 *','tc-plan-mentor',input('tc-plan-mentor','','text','maxlength="30" placeholder="填写导师姓名"'))}${field('培养负责人 *','tc-plan-owner',input('tc-plan-owner',selectedPool?.owner||'李文静','text','maxlength="30"'))}</div>${field('开始日期 *','tc-plan-start',input('tc-plan-start',T.today(),'date'))}<div class="tc-stage-form"><h4>90 天培养安排</h4>${[30,60,90].map((day,i)=>field('第 '+day+' 天 · 阶段目标 *','tc-plan-stage-'+i,`<textarea class="input" id="tc-plan-stage-${i}" maxlength="500" placeholder="填写实践、带教或复评安排及验证方式"></textarea>`)).join('')}</div></div>`,confirmLabel:'保存计划',onConfirm(d){
      const val=id=>d.querySelector('#'+id).value.trim(),start=val('tc-plan-start'),stages=[30,60,90].map((days,i)=>({days,title:val('tc-plan-stage-'+i),due:dateAfter(start||T.today(),days),completed:'',result:'',reviewer:''}));
      if(!start||start<T.today()||!val('tc-plan-goal')||!val('tc-plan-mentor')||stages.some(s=>!s.title)){d.showError('请填写培养目标、导师和三个阶段安排；开始日期不得早于今天');return false;}
      try{T.createDevelopment(data,{person,poolId:val('tc-plan-pool'),title:val('tc-plan-title'),goal:val('tc-plan-goal'),owner:val('tc-plan-owner'),mentor:val('tc-plan-mentor'),start,due:stages[2].due,target:position,standard:basis.id,standardSnapshot:S.clone(basis),stages});}catch(error){d.showError(error.message);return false;}
      if(!save())return false;activeTab=page==='profile'?'development':'plans';render();showToast('个人发展计划已保存');
    }});
  }
  function planDetail(id) {
    const plan=data.actions.find(a=>a.id===id);if(!plan)return;
    UI.openDialog({title:plan.title,body:`<div class="tc-plan-detail">${facts([['培养对象',e(T.person(plan.person).name)],['导师',e(plan.mentor)],['培养负责人',e(plan.owner)],['采用标准',e(plan.standardSnapshot.name)],['开始日期',e(plan.start)],['结束日期',e(plan.due)]])}<p class="tc-description tc-plan-goal">${e(plan.goal)}</p>${plan.stages.map((stage,i)=>`<section class="tc-plan-stage"><div class="tc-section-head"><h2>第 ${stage.days} 天</h2><span class="text-sm ${stage.completed?'muted':stage.due<T.today()?'danger':'muted'}">${stage.completed?'已完成 · '+e(stage.completed):'计划完成 '+e(stage.due)}</span></div><p class="tc-description">${e(stage.title)}</p>${stage.completed?`<p class="tc-sub">完成说明：${e(stage.result)}<br>确认人：${e(stage.reviewer)}</p>`:page==='pool-detail'?'':b('确认阶段完成','complete-stage','btn btn-secondary',`data-id="${e(id)}" data-stage="${i}"`)}</section>`).join('')}</div>`,confirmLabel:'关闭',cancelLabel:''});
  }
  function completeStage(id,index) {
    const plan=data.actions.find(a=>a.id===id),stage=plan?.stages[index];if(!stage||stage.completed)return;
    UI.openDialog({title:'确认阶段完成',body:`<div class="tc-form"><p class="tc-chosen">${e(T.person(plan.person).name)} · 第 ${stage.days} 天</p><p class="tc-description">${e(stage.title)}</p>${field('完成说明与成果依据 *','tc-stage-result','<textarea class="input" id="tc-stage-result" maxlength="1500" placeholder="记录成果、验证方式及导师反馈"></textarea>')}<p class="tc-context">确认人：李文静。完成培养阶段不会修改评鉴分数或标准达标状态。</p></div>`,confirmLabel:'确认完成',onConfirm(d){const result=d.querySelector('textarea').value.trim();if(!result){d.showError('请填写完成说明与成果依据');return false;}try{T.confirmStage(data,id,index,result,'李文静');}catch(error){d.showError(error.message);return false;}if(!save())return false;render();showToast('阶段完成记录已保存');}});
  }
  function detailTabs(tabs,contents) {
    return `<div class="detail-layout tc-detail"><nav class="anchor-nav" aria-label="详情分区">${tabs.map(([id,label])=>`<button type="button" class="a-item ${activeTab===id?'active':''}" data-tc-tab="${id}" aria-current="${activeTab===id?'page':'false'}">${label}</button>`).join('')}</nav><div class="detail-main">${tabs.map(([id,label])=>`<section data-tc-panel="${id}" ${activeTab!==id?'hidden':''} aria-label="${label}">${contents[id]}</section>`).join('')}</div></div>`;
  }
  function profile() {
    if(abilityChart){abilityChart.dispose();abilityChart=null;}
    if(!currentPerson){main.innerHTML=empty('未找到该人才','请从人才库重新选择','<a class="btn btn-primary" href="talent-list.html">返回人才库</a>');return;}
    const p=currentPerson,latest=T.latestReview(data,p.id),records=data.evidence.filter(r=>r.person===p.id),reviews=data.reviews.filter(r=>r.person===p.id),followups=data.followups.filter(r=>r.person===p.id),membership=T.poolsFor(data,p.id);
    const current=S.forPerson(standards,p),saved=q.get('standard')?{target:q.get('target')||'',standard:q.get('standard')}:data.selections[p.id]||{standard:standards.selected?.['talent-'+p.id]||''},position=saved.target||'',available=position?standardsFor(position):current,standard=available.find(s=>s.id===saved.standard),rows=standard?T.compare(data,p.id,standard):[];
    const overview=section('基本信息',facts([['姓名',e(p.name)],['部门',e(p.department)],['现岗位',e(p.position)],['学历',e(p.education)],['司龄',p.tenure+' 年'],['业务标签',p.tags.map(e).join('、')||'—']]))+section('盘点与评鉴',facts([['最近盘点',latest?`${tag(latest.classification)}<span class="tc-sub">${e(latest.project)} · ${e(latest.date)}</span>`:'暂无盘点记录'],['有效评鉴',T.evidence(data,p.id).length+' 项'],['所属人才池',poolNames(p.id)]]))+section('最近跟进',followups.length?historyRows(followups.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2)):empty('暂无跟进记录'),b('记录跟进','follow-person','btn-text'));
    const actual=[...T.values(data,p.id)];
    const ability=`<div class="tc-section-head"><h2>标准与差距</h2>${standardLink(standard)}</div><div class="tc-selector"><label for="tc-profile-target">比较目标</label>${select('tc-profile-target',options(S.positions,position,'当前适用标准'))}<label for="tc-profile-standard">采用标准</label>${select('tc-profile-standard',options(available,standard?.id||'','请选择标准'))}</div>${actual.length?`<div class="tc-ability"><div class="tc-ability-chart" id="tc-ability-chart" role="img" aria-label="${e(p.name)}实际能力雷达图"></div><div class="tc-ability-list">${actual.map(([name,result])=>`<div class="tc-ability-row"><span>${e(name)}</span><strong>${result.value}/5</strong></div>`).join('')}</div></div>`:''}${standard?(rows.length?stats(rows)+requirementTable(rows):empty('该标准暂无要求')):empty(available.length?'请选择比较标准':'暂无适用标准')}`;
    const evaluation=section('评鉴记录',records.length?table(['评鉴名称','类型','完成日期','有效至','操作'],records.map(r=>`<tr><td>${e(r.name)}</td><td>${e(r.type)}</td><td>${r.date}</td><td>${r.validUntil||'—'}</td><td>${b('查看依据','evidence','btn-text',`data-id="${r.id}"`)}</td></tr>`).join('')):empty('暂无评鉴记录'))+section('盘点记录',table(['盘点项目','方法','结束时间','人才分类','绩效'],reviews.map(r=>`<tr><td>${e(r.project)}</td><td>${r.method}</td><td>${r.date}</td><td>${tag(r.classification)}</td><td>${e(r.performance)}</td></tr>`).join('')));
    const development=section('所属人才池',membership.length?table(['人才池','来源盘点项目','创建人'],membership.map(pool=>`<tr><td><a class="btn-text" href="talent-pool-detail.html?pool=${e(pool.id)}">${e(pool.name)}</a></td><td>${P.sourceLink(pool)}</td><td>${e(pool.owner)}</td></tr>`).join('')):empty('暂无所属人才池'))+section('个人发展计划（IDP）',planTable(p.id),b('建立计划','new-person-plan','btn btn-primary'))+section('跟进记录',followups.length?historyRows(followups):empty('暂无跟进记录'),b('记录跟进','follow-person','btn-text'));
    main.innerHTML=back(listReturn(),p.name,b('加入人才池','add-person','btn btn-primary')+b('导出档案','print-profile'))+detailTabs([['overview','概览'],['ability','标准与差距'],['evaluation','评鉴与盘点'],['development','发展记录']],{overview,ability,evaluation,development});
    if(activeTab==='ability')requestAnimationFrame(drawAbility);
  }
  function drawAbility() {
    const host=document.getElementById('tc-ability-chart');
    if(!host||!host.getBoundingClientRect().width||!window.echarts)return;
    if(abilityChart){abilityChart.resize();return;}
    const actual=[...T.values(data,currentPerson.id)];
    if(actual.length<3)return;
    const chosen=document.getElementById('tc-profile-standard')?.value, standard=standards.standards.find(s=>s.id===chosen), requirements=new Map(standard?.content.cap||[]);
    const series=[{name:'实际能力',value:actual.map(([,r])=>r.value),areaStyle:{opacity:0.08}}];
    if(actual.every(([name])=>/^L[1-5]$/.test(requirements.get(name)||'')))series.push({name:'标准要求',value:actual.map(([name])=>Number(requirements.get(name).slice(1))),lineStyle:{type:'dashed'},areaStyle:{opacity:0}});
    abilityChart=echarts.init(host);
    abilityChart.setOption({animation:false,color:['#0152D9','#94A3B8'],tooltip:{trigger:'item'},legend:{bottom:0,textStyle:{fontSize:12}},radar:{indicator:actual.map(([name])=>({name,max:5})),radius:'60%',center:['50%','46%'],splitNumber:5,axisName:{color:'#595959',fontSize:12},splitArea:{show:false}},series:[{type:'radar',symbolSize:4,data:series}]});
  }
  window.addEventListener('resize',()=>abilityChart?.resize());
  function comparePage() {
    const people=[...new Set((q.get('people')||'').split(','))].map(T.person).filter(Boolean);
    if(people.length<2||people.length>5){main.innerHTML=back(listReturn(),'人才对比')+empty('请选择 2 至 5 人进行对比','从人才库勾选人员后进入','<a class="btn btn-primary" href="talent-list.html">返回人才库</a>');return;}
    const available=standardsFor(target),standard=available.find(s=>s.id===compareStandard),requirements=standard?T.requirements(standard):[];
    main.innerHTML=back(listReturn(),'人才对比',b('加入人才池','add-compared','btn btn-primary')+b('导出','export-compare'))+`<div class="filter-bar tc-compare-filter"><label for="tc-compare-target">目标岗位</label>${select('tc-compare-target',options(S.positions,target,'请选择岗位'))}<label for="tc-compare-standard">采用标准</label>${select('tc-compare-standard',options(available,compareStandard,'请选择标准'))}${standardLink(standard)}</div>`+
    table(['比较维度',...people.map(p=>`<a class="btn-text" href="${linkPerson(p.id)}">${e(p.name)}</a><span class="tc-sub">${e(p.department)} · ${e(p.position)}</span>`)],
      `<tr><td>最新盘点</td>${people.map(p=>{const r=T.latestReview(data,p.id);return `<td>${r?tag(r.classification):'—'}<span class="tc-sub">${r?e(r.project)+' · '+e(r.date):'暂无盘点记录'}</span></td>`;}).join('')}</tr>`+
      (standard?`<tr><td>有效证据覆盖</td>${people.map(p=>{const s=T.summary(T.compare(data,p.id,standard));return `<td>${s.known} / ${s.total}<span class="tc-sub">已评估要求满足 ${s.known?`${s.met} / ${s.known}`:'未评估'}</span></td>`;}).join('')}</tr>`+requirements.map((r,i)=>`<tr><td>${e(r.name)}${r.level?' · '+e(r.level):''}<span class="tc-sub">${r.kind}</span></td>${people.map(p=>{const row=T.compare(data,p.id,standard)[i];return `<td>${tag(row.status)}${row.actual?`<span class="tc-sub">${row.actual.value}/5 · ${e(row.actual.record.date)}</span>`:''}</td>`;}).join('')}</tr>`).join(''):'<tr><td colspan="'+(people.length+1)+'">'+empty(available.length?'请选择共同标准':'该岗位暂无关联标准','选择标准后显示逐项差距')+'</td></tr>'),'tc-compare-table');
  }
  function poolDetail() {
    const pool=poolById();if(!pool){main.innerHTML=empty('未找到该人才池','可返回人才池重新选择','<a class="btn btn-primary" href="talent-pool.html">返回人才池</a>');return;}
    if(!['info','overview','history'].includes(activeTab))activeTab='overview';
    const members=T.activeMembers(pool),exited=pool.members.filter(m=>m.exited),followups=data.followups.filter(r=>r.poolId===pool.id);
    const nameCell=member=>{const p=T.poolPerson(member);return T.person(member.person)?`<a class="btn-text" href="${linkPerson(p.id)}">${e(p.name)}</a>`:e(p?.name||member.person);};
    const overview=section('在池成员',table(['姓名','部门','岗位','盘点人才分类','入池时间','操作'],members.map(m=>{const p=T.poolPerson(m),review=T.sourceProject(pool)?.people.find(item=>item.id===m.person);return `<tr><td>${nameCell(m)}</td><td>${e(p?.department||'—')}</td><td>${e(p?.position||'—')}</td><td>${e(review?.classification||m.profile?.classification||'—')}</td><td>${e(m.joined||'—')}</td><td>${b('退出','exit-member','btn-text',`data-id="${e(m.id)}"`)}</td></tr>`;}).join('')||`<tr><td colspan="6">${empty('暂无在池成员')}</td></tr>`,'tc-members'),b('组建人才池','pool-add','btn btn-primary'));
    const info=section('基本信息',facts([['人才池名称',e(pool.name)],['来源盘点项目',P.sourceLink(pool)],['创建人',e(pool.owner)],['期望人数',e(pool.expected||'—')],['实际人数',members.length+' 人']]))+section('备注',`<p class="tc-description">${e(pool.purpose||'—')}</p>`);
    const history=section('退出记录',exited.length?table(['姓名','入池时间','退出时间','退出原因'],exited.map(m=>`<tr><td>${nameCell(m)}</td><td>${e(m.joined)}</td><td>${e(m.exited)}</td><td>${e(m.exitReason)}</td></tr>`).join('')):empty('暂无退出记录'))+(followups.length?section('历史跟进',historyRows(followups)):'')+(T.developmentItems(data,null,pool.id).length?section('历史个人发展计划',planTable(null,pool.id)):'');
    main.innerHTML=back('talent-pool.html',pool.name,b('编辑','edit-current-pool')+b('导出成员','export-pool'))+detailTabs([['info','基本信息'],['overview','在池成员'],['history','历史记录']],{info,overview,history});
  }

  function dashboard() {
    const department=filters.department,people=T.people.filter(p=>!department||p.department===department),valid=people.filter(p=>T.evidence(data,p.id).length),members=people.filter(p=>T.poolsFor(data,p.id).length),plans=data.actions.filter(a=>people.some(p=>p.id===a.person));
    const link=f=>'talent-list.html?'+new URLSearchParams({department,...f}).toString(),percent=people.length?Math.round(valid.length/people.length*100):0;
    const reserve=T.reserveRows(data,standards,department),reservePeople=new Set(reserve.flatMap(r=>r.people)),reserveDue=new Set(reserve.flatMap(r=>r.due)),covered=reserve.filter(r=>r.people.length),openPlans=plans.filter(p=>p.status!=='已完成'),overduePlans=openPlans.filter(p=>p.stages.some(s=>!s.completed&&s.due<T.today()));
    const dueMembers=data.pools.flatMap(pool=>T.activeMembers(pool).filter(m=>people.some(p=>p.id===m.person)&&m.nextReview&&m.nextReview<T.today()).map(m=>({pool,member:m}))),duePeople=new Set(dueMembers.map(r=>r.member.person));
    const metric=(label,value,href)=>`<div class="tc-overview-metric"><span>${label}</span>${href?`<a href="${href}">${value}</a>`:`<strong>${value}</strong>`}</div>`;
    const heading=(title,sub='')=>`<div class="tc-chart-heading"><h2>${title}</h2>${sub?`<span>${sub}</span>`:''}</div>`;
    const dept=[...new Set(people.map(p=>p.department))].map(name=>{const group=people.filter(p=>p.department===name);return {name,count:group.length,valid:group.filter(p=>T.evidence(data,p.id).length).length};}),max=Math.max(1,...dept.map(d=>d.count));
    const org=`<section class="tc-analysis-panel">${heading('组织人才分布')}<div class="tc-chart-legend"><span><i class="tc-key-blue"></i>有有效评鉴</span><span><i class="tc-key-light"></i>待补充评鉴</span></div><div class="tc-bar-chart">${dept.map(d=>`<a class="tc-bar-row" href="${link({department:d.name})}" aria-label="${e(d.name)} ${d.count} 人，有有效评鉴 ${d.valid} 人"><span class="tc-bar-name">${e(d.name)}</span><span class="tc-bar-track"><span class="tc-bar-segment tc-key-blue" style="width:${d.valid/max*100}%">${d.valid||''}</span><span class="tc-bar-segment tc-key-light" style="width:${(d.count-d.valid)/max*100}%">${d.count-d.valid||''}</span></span><strong>${d.count}<small> 人</small></strong></a>`).join('')||empty('当前范围暂无人才')}<div class="tc-chart-axis"><span>0</span><span>${max} 人</span></div></div></section>`;
    const categories=['高潜','核心','中坚','待发展'],tones=['#0152D9','#668FE0','#AEC4ED','#E8BA73'],counts=categories.map(c=>people.filter(p=>T.latestReview(data,p.id)?.classification===c).length),unknown=people.length-counts.reduce((a,b)=>a+b,0);
    const classification=`<section class="tc-analysis-panel">${heading('最近盘点分类')}<div class="tc-classification-chart"><div class="tc-classification-total"><strong>${people.length}</strong><span>人</span></div><div class="tc-classification-bar">${categories.map((c,i)=>counts[i]?`<a href="${link({classification:c})}" style="width:${counts[i]/Math.max(people.length,1)*100}%;background:${tones[i]}" aria-label="${c} ${counts[i]} 人"><span>${counts[i]}</span></a>`:'').join('')}${unknown?`<span style="width:${unknown/people.length*100}%;background:#EDF0F5">${unknown}</span>`:''}</div><div class="tc-classification-legend">${categories.map((c,i)=>`<a href="${link({classification:c})}"><i style="background:${tones[i]}"></i><span>${c}</span><strong>${counts[i]}<small> 人</small></strong></a>`).join('')}${unknown?`<span class="muted">无盘点记录 ${unknown} 人</span>`:''}</div></div></section>`;
    const priority=`<section class="tc-work-panel">${heading('待处理事项')}<div class="tc-work-grid"><a href="${link({coverage:'missing'})}"><span>补充评鉴</span><strong>${people.length-valid.length}<small> 人</small></strong></a><button type="button" data-action="board-mode" data-value="reserve"><span>人才池复评</span><strong>${duePeople.size}<small> 人</small></strong><p>${dueMembers.length} 条在池记录超过复评日期</p></button><a href="#tc-idp-work"><span>IDP 阶段逾期</span><strong>${overduePlans.length}<small> 项计划</small></strong></a></div></section>`;
    const planWork=section('个人发展计划跟进',openPlans.length?table(['人员','培养目标','导师','下一阶段','操作'],openPlans.map(plan=>{const next=plan.stages.find(s=>!s.completed);return `<tr><td><a class="tc-name-link" href="${linkPerson(plan.person)}&section=development">${e(T.person(plan.person).name)}</a></td><td>${e(plan.goal)}</td><td>${e(plan.mentor)}</td><td class="${next?.due<T.today()?'tc-warning-text':''}">${next?'第 '+next.days+' 天 · '+e(next.due):'已完成'}</td><td>${b('查看计划','view-plan','btn-text',`data-id="${e(plan.id)}"`)}</td></tr>`;}).join(''),'tc-board-table'):empty('暂无进行中的个人发展计划'));
    const reserveContent=`<div class="tc-overview-strip">${metric('关键岗位',reserve.length)}${metric('岗位后备覆盖',Math.round(covered.length/Math.max(reserve.length,1)*100)+'%')}${metric('后备人员',reservePeople.size)}${metric('待复评后备',reserveDue.size)}</div><section class="tc-reserve-panel">${heading('关键岗位储备')}${table(['目标岗位','储备厚度','人才池 / 采用标准','证据准备情况','操作'],reserve.map(r=>`<tr><td>${e(r.position.name)}</td><td><div class="tc-thickness"><span style="width:${Math.min(r.people.length/Math.max(1,...reserve.map(x=>x.people.length))*100,100)}%"></span></div><strong class="tc-number">${r.people.length} 人</strong></td><td>${r.pools.length?r.pools.map(pool=>`<a class="btn-text" href="talent-pool-detail.html?pool=${e(pool.id)}">${e(pool.name)}</a><span class="tc-sub">${e(pool.standardSnapshot?.name||'未采用标准')}</span>`).join(''):r.linked.length?'<span class="muted">尚未建立目标人才池</span>':'<span class="muted">暂无关联标准</span>'}</td><td>${r.pools.length?r.pools.map(pool=>{const cohort=T.activeMembers(pool).filter(m=>r.people.includes(m.person));const incomplete=cohort.filter(m=>{const n=T.summary(T.compare(data,m.person,pool.standardSnapshot));return !n.total||n.known<n.total;}).length;const due=cohort.filter(m=>m.nextReview&&m.nextReview<T.today()).length;return `<span class="tc-sub">${e(pool.name)}：${incomplete} 人需补证据${due?' · '+due+' 人待复评':''}</span>`;}).join(''):'—'}</td><td><a class="btn-text" href="${link({target:r.position.id,standard:r.linked.length===1?r.linked[0].id:''})}">查找后备</a></td></tr>`).join(''),'tc-board-table')}</section>`;
    main.innerHTML=`<div class="tc-board-header"><div class="tc-board-tabs" role="tablist" aria-label="人才看板主题">${b('人才概览','board-mode','tc-board-tab'+(dashboardMode==='overview'?' active':''),'role="tab" aria-selected="'+(dashboardMode==='overview')+'" data-value="overview"')}${b('岗位储备','board-mode','tc-board-tab'+(dashboardMode==='reserve'?' active':''),'role="tab" aria-selected="'+(dashboardMode==='reserve')+'" data-value="reserve"')}</div><div class="tc-board-scope"><label for="tc-dashboard-dept">组织范围</label>${select('tc-dashboard-dept',options([...new Set(T.people.map(p=>p.department))],department))}<span>截至 ${T.today()}</span></div></div><div class="tc-board-body">${dashboardMode==='reserve'?reserveContent:`<div class="tc-overview-strip">${metric('人才总数',people.length,link({}))}${metric('有效评鉴覆盖',percent+'%',link({coverage:'valid'}))}${metric('在池人员',members.length,link({inPool:'yes'}))}${metric('未完成 IDP',openPlans.length)}</div><div class="tc-overview-analysis">${org}${classification}</div>${priority}<div id="tc-idp-work" class="tc-board-idp">${planWork}</div>`}</div>`;
  }
  function exportCSV(name,rows) {
    const csv='\uFEFF'+rows.map(row=>row.map(v=>{let text=String(v??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function render() { ({list,profile,compare:comparePage,pools,'pool-detail':poolDetail,dashboard}[page]||list)();if(typeof syncListWorkbenchHeights==='function')requestAnimationFrame(syncListWorkbenchHeights); }
  main.addEventListener('submit',event=>{
    event.preventDefault();
    if(event.target.id==='tc-query'){filters.query=document.getElementById('tc-query-text').value;filters.classification=document.getElementById('tc-classification').value;filters.coverage=document.getElementById('tc-list-coverage').value;selected.clear();listPage=1;list();}
    if(event.target.id==='tc-pool-query'){poolQuery=document.getElementById('tc-pool-search').value.trim();poolPage=1;pools();}
  });
  main.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.personCheck){const id=el.dataset.personCheck;el.checked?selected.add(id):selected.delete(id);list();main.querySelector('[data-person-check="'+id+'"]')?.focus();return;}
    if(el.id==='tc-all'){listPeople().slice((listPage-1)*10,listPage*10).forEach(p=>el.checked?selected.add(p.id):selected.delete(p.id));list();document.getElementById('tc-all').focus();return;}
    if(el.id==='tc-profile-target'||el.id==='tc-profile-standard'){
      data.selections[currentPerson.id]={target:document.getElementById('tc-profile-target').value,standard:el.id==='tc-profile-target'?'':el.value};if(save()){q.delete('standard');q.delete('target');profile();}return;
    }
    if(el.id==='tc-compare-target'){target=el.value;compareStandard='';comparePage();}
    if(el.id==='tc-compare-standard'){compareStandard=el.value;comparePage();}
    if(['tc-list-target','tc-list-standard','tc-list-coverage'].includes(el.id)){filters.query=document.getElementById('tc-query-text').value;filters.classification=document.getElementById('tc-classification').value;filters.coverage=document.getElementById('tc-list-coverage').value;if(el.id==='tc-list-target'){filters.target=el.value;filters.standard='';filters.requirementStatus='';}if(el.id==='tc-list-standard'){filters.standard=el.value;filters.requirementStatus='';}selected.clear();listPage=1;list();return;}
    if(el.id==='tc-dashboard-dept'){filters.department=el.value;dashboard();}
  });
  main.addEventListener('click',event=>{
    const tab=event.target.closest('[data-tc-tab]');if(tab){activeTab=tab.dataset.tcTab;main.querySelectorAll('[data-tc-tab]').forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-current',t===tab?'page':'false');});main.querySelectorAll('[data-tc-panel]').forEach(p=>p.hidden=p.dataset.tcPanel!==activeTab);if(activeTab==='ability')requestAnimationFrame(drawAbility);return;}
    const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,id=button.dataset.id;
    if(action==='board-mode'){dashboardMode=button.dataset.value;dashboard();return;}
    if(action==='department'){filters.department=button.dataset.value;selected.clear();listPage=1;list();}
    if(action==='reset'){for(const key of Object.keys(filters))filters[key]='';filters.level='1';selected.clear();listPage=1;list();}
    if(action==='advanced')advanced();
    if(action==='compare'&&selected.size>=2&&selected.size<=5)location.href='talent-compare.html?people='+[...selected].join(',')+(contextQuery()?'&'+contextQuery():'');
    if(action==='add-person')addToPool([currentPerson.id]);
    if(action==='add-compared')addToPool([...new Set(q.get('people').split(','))].filter(T.person));
    if(action==='new-pool')poolForm();
    if(action==='build-pool')P.build(data,data.pools.find(pool=>pool.id===id),()=>{if(!save())return false;render();return true;});
    if(action==='edit-pool')poolForm(data.pools.find(p=>p.id===id));
    if(action==='edit-current-pool')poolForm(poolById());
    if(action==='pool-reset'){poolQuery='';poolPage=1;pools();}
    if(action==='pool-add')P.build(data,poolById(),()=>{if(!save())return false;poolDetail();return true;});
    if(action==='exit-member'){const pool=poolById(),member=pool.members.find(m=>m.id===id);UI.openDialog({title:'退出人才池',body:`<div class="tc-form"><p>${e(T.poolPerson(member)?.name||member.person)}退出“${e(pool.name)}”后保留历史记录，可再次添加。</p>${field('退出原因 *','tc-exit-reason','<textarea class="input" id="tc-exit-reason" maxlength="500"></textarea>')}</div>`,confirmLabel:'确认退出',onConfirm(d){const reason=d.querySelector('textarea').value.trim();if(!reason){d.showError('请填写退出原因');return false;}member.exited=T.today();member.exitReason=reason;if(!save())return false;poolDetail();}});}
    if(action==='new-person-plan')planForm(currentPerson.id);
    if(action==='evidence-need')followup(currentPerson.id,'',button.dataset.goal);
    if(action==='plan-gap')planForm(currentPerson.id,'',button.dataset.goal);
    if(action==='new-member-plan')planForm(id,poolById().id);
    if(action==='view-plan'){planDetail(id);return;}
    if(action==='complete-stage'){completeStage(id,Number(button.dataset.stage));return;}
    if(action==='follow-person')followup(currentPerson.id);
    if(action==='follow-member')followup(id,poolById().id);
    if(action==='evidence')evidenceDialog(id);
    if(action==='print-profile')window.print();
    if(action==='list-prev'){listPage--;list();}if(action==='list-next'){listPage++;list();}
    if(action==='pool-prev'){poolPage--;pools();}if(action==='pool-next'){poolPage++;pools();}
    if(action==='export'){const basis=standardsFor(filters.target).find(s=>s.id===filters.standard);exportCSV('人才库_'+T.today(),[['姓名','部门','岗位','人才分类','盘点来源','业务标签','所属人才池',...(basis?['目标岗位','采用标准','已满足','待发展','待补证据']:[])],...listPeople().map(p=>{const review=T.latestReview(data,p.id),n=basis?T.summary(T.compare(data,p.id,basis)):null;return[p.name,p.department,p.position,review?.classification||'',review?review.project+' · '+review.date:'',p.tags.join('、'),T.poolsFor(data,p.id).map(x=>x.name).join('、'),...(n?[S.positions.find(x=>x.id===filters.target)?.name||'',basis.name,n.met,n.gaps,n.total-n.known]:[])];})]);}
    if(action==='export-pool'){const pool=poolById();exportCSV(pool.name,[['姓名','部门','岗位','来源盘点项目','人才分类','入池日期'],...T.activeMembers(pool).map(m=>{const p=T.poolPerson(m),review=T.sourceProject(pool)?.people.find(item=>item.id===m.person);return[p?.name||m.person,p?.department||'',p?.position||'',T.sourceProject(pool)?.name||'',review?.classification||m.profile?.classification||'',m.joined];})]);}
    if(action==='export-compare'){const people=q.get('people').split(',').map(T.person).filter(Boolean),standard=standardsFor(target).find(s=>s.id===compareStandard);if(!standard){showToast('请先选择采用标准');return;}exportCSV('人才对比_'+standard.name,[['标准',standard.name,'标准日期',standard.updated],['要求',...people.map(p=>p.name)],...T.requirements(standard).map((r,i)=>[r.name+' '+(r.level||''),...people.map(p=>{const row=T.compare(data,p.id,standard)[i];return row.status+(row.actual?' '+row.actual.value+'/5 · '+row.actual.record.date:'');})])]);}
  });
  document.addEventListener('click',event=>{if(main.contains(event.target))return;const button=event.target.closest('[data-action=complete-stage]');if(button)completeStage(button.dataset.id,Number(button.dataset.stage));});
  render();
})();
