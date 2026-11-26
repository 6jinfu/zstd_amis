(function () {
  const S=window.Standards, $=s=>document.querySelector(s);
  const e = UI.escape;
  const uid=()=> UI.uid ? UI.uid('std') : 'std-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const planStorageKey = 'talent-learning-plan-design-v1';
  let data;
  try { data=S.read(); } catch(err) { showToast('无法读取标准，请检查浏览器存储权限'); return; }
  function persist() { try { S.write(data); return true; } catch(err) { showToast('保存失败，请检查浏览器存储空间与权限'); return false; } }
  const button=(label,attr='',cls='btn btn-secondary')=>`<button type="button" class="${cls}" ${attr}>${label}</button>`;
  const {pick, pickIndicators} = window.StandardUI;
  const isCapGraded = (name, level) => {
    if (level === '') return false;
    return window.IndicatorDemo?.isGraded ? window.IndicatorDemo.isGraded(name) : true;
  };
  if($('[data-standard-detail]')) {
    const params=new URLSearchParams(location.search),original=data.standards.find(s=>s.id===(params.get('id')||params.get('copy')));
    if(params.get('id')&&!original){$('.detail-main').innerHTML='<div class="empty-state">该标准不存在，请返回列表。</div>';$('#std-form').onsubmit=ev=>ev.preventDefault();return;}
    const defaultTpl = TalentSettings.defaultTemplate();
    let draft=original?S.clone(original):{id:uid(),name:'',category:data.categories[0]||'',templateId:defaultTpl.id,templateName:defaultTpl.name,enabledDimensions:[...defaultTpl.dimensions],description:'',mode:'none',positions:[],groups:[],content:S.emptyContent()};
    if(original){draft.enabledDimensions=S.dimensionsOf(original);draft.templateName=original.templateName||'完整人才标准';}
    if(params.has('copy')&&original){draft.id=uid();draft.name+='（副本）';draft.mode='none';draft.positions=[];draft.groups=[];}
    if(!original||params.has('copy'))draft.code=S.nextCode(data);
    const context=S.positions.find(p=>p.id===params.get('position'));
    if(original&&!params.has('copy')&&draft.mode!=='rules'){
      draft.positions=S.positionIds(data,original);
      if(draft.positions.length)draft.mode='positions';
    }
    if(context&&!original){const category=({研发:'研发序列',销售:'销售序列',职能:'通用标准'})[context.category];draft.name=context.name+'标准';if(data.categories.includes(category))draft.category=category;draft.mode='positions';draft.positions=[context.id];}
    if(context)document.querySelectorAll('[data-std-cancel]').forEach(link=>{link.href='position-detail.html?position='+encodeURIComponent(context.id)+'#standard';});
    let aiImported=false;
    if(params.has('ai')){
      try {
        const aiDraft=JSON.parse(sessionStorage.getItem('talent-standard-ai-draft-v1')||'null');
        if(aiDraft){
          if(original&&aiDraft.targetId===original.id&&['replace','merge'].includes(aiDraft.updateStrategy)){
            draft.content=TalentSettings.mergeContent(draft.content,aiDraft.content,aiDraft.generatedSections,aiDraft.updateStrategy);
          }else if(!original){
            draft={...draft,...aiDraft,id:draft.id,content:S.clone(aiDraft.content||S.emptyContent())};
            if(Array.isArray(aiDraft.enabledDimensions)&&aiDraft.enabledDimensions.length)draft.enabledDimensions=[...aiDraft.enabledDimensions];
            else if(Array.isArray(aiDraft.generatedSections)&&aiDraft.generatedSections.length)draft.enabledDimensions=[...aiDraft.generatedSections];
          }
          else throw new Error('AI draft target does not match');
          aiImported=true;sessionStorage.removeItem('talent-standard-ai-draft-v1');
        }
      } catch(err) { sessionStorage.removeItem('talent-standard-ai-draft-v1'); }
    }
    let dirty=false,scopeModeChanged=false;
    function changed(){dirty=true;$('#std-save-state').textContent='有未保存的修改';}
    document.querySelectorAll('[data-std-cancel]').forEach(link=>link.addEventListener('click',()=>{dirty=false;}));
    function savedPlanCount(posId, stdId) {
      try {
        const plans = JSON.parse(localStorage.getItem(planStorageKey) || '{}');
        const entry = plans[JSON.stringify([posId, stdId])];
        if (entry?.groups) return entry.groups.reduce((sum, g) => sum + (g.activities?.length || 0), 0);
      } catch {}
      return data.plans?.[posId]?.length || 0;
    }
    function renderPlanEntries(){
      const host=$('#std-plan-positions');
      if(!host)return;
      if(!S.hasDimension(draft,'cap')){
        host.innerHTML='<div class="empty-state">当前标准模板未包含“能力要求”维度，无需配置基于能力的学习方案。</div>';
        return;
      }
      const saved=data.standards.find(s=>s.id===draft.id);
      if(!saved){host.innerHTML='<div class="empty-state">先保存人才标准，再为适用岗位配置学习方案。</div>';return;}
      const positions=S.positions.filter(p=>S.associated(data,p.id).some(s=>s.id===saved.id));
      if(!positions.length){
        host.innerHTML='<div class="empty-state">暂无关联岗位。可先在<a href="#scope">应用范围</a>中指定岗位，或从岗位详情关联这条标准。</div>';
        return;
      }
      host.innerHTML=positions.map(p=>{
        const count=savedPlanCount(p.id, saved.id);
        const selected=data.selected['plan-'+p.id]===saved.id;
        const note=(count?`已配置 ${count} 项学习资源`:'待配置学习方案')+(selected?' · 当前采用本标准':'');
        const basePlanUrl = `learning-plan.html?position=${encodeURIComponent(p.id)}&amp;standard=${encodeURIComponent(saved.id)}&amp;from=standard`;
        return `<div class="std-link-row"><div><b>${e(p.name)}</b><p>${e(p.category)} · ${e(p.id)} · ${note}</p></div><div class="flex gap-sm"><a class="btn btn-primary" href="${basePlanUrl}&amp;ai=1">AI 帮建学习资源</a><a class="btn btn-secondary" href="${basePlanUrl}">配置学习方案</a></div></div>`;
      }).join('');
    }
    let availableSections = S.dimensionsOf(draft);
    let activeContentTab = availableSections[0] || 'cap';
    function syncDimensionTabs(){
      availableSections = S.dimensionsOf(draft);
      document.querySelectorAll('[data-std-tab^="content-"]').forEach(link=>{link.hidden=!availableSections.includes(link.dataset.stdTab.slice(8));});
      const planTab = document.querySelector('[data-std-tab="plan"]');
      if (planTab) planTab.hidden = !availableSections.includes('cap');
      if (!availableSections.includes(activeContentTab)) activeContentTab = availableSections[0] || 'cap';
      const dimsNote = $('#std-template-dims');
      if (dimsNote) dimsNote.textContent = '包含维度：' + availableSections.map(k => TalentSettings.dimensions[k]).join('、');
    }
    syncDimensionTabs();
    function contentTab(name){
      if(!availableSections.includes(name))name=availableSections[0];
      activeContentTab=name;
      document.querySelectorAll('[data-content-section]').forEach(s=>s.hidden=s.dataset.contentSection!==name);
    }
    function tab(name){
      if(name==='object')name='scope';
      let section=name;
      if(name.indexOf('content-')===0){contentTab(name.slice(8));section='content';}
      if(section==='content')contentTab(activeContentTab);
      if(section==='plan'&&!availableSections.includes('cap'))section='basic';
      if(!['basic','scope','content','plan'].includes(section))section='basic';
      if(section==='plan')renderPlanEntries();
      const activeKey=section==='content'?'content-'+activeContentTab:section;
      document.querySelectorAll('[data-std-section]').forEach(s=>s.hidden=s.dataset.stdSection!==section);
      document.querySelectorAll('[data-std-tab]').forEach(a=>{const active=a.dataset.stdTab===activeKey;a.classList.toggle('active',active);a.setAttribute('aria-current',active?'page':'false');});
    }
    document.querySelectorAll('[data-std-tab]').forEach(a=>a.onclick=()=>tab(a.dataset.stdTab));
    tab(location.hash.slice(1));
    window.addEventListener('hashchange',()=>tab(location.hash.slice(1)));
    $('#std-title').textContent=original&&!params.has('copy')?draft.name:'新建人才标准';
    $('#std-category').innerHTML=data.categories.map(c=>`<option value="${e(c)}">${e(c)}</option>`).join('');

    /* 标准模板下拉与快照隔离 */
    const tplSelect = $('#std-template');
    if (tplSelect) {
      const enabledTpls = TalentSettings.templates(undefined, {onlyEnabled:true});
      const currentDimsKey = JSON.stringify(S.dimensionsOf(draft));
      const matchedTpl = enabledTpls.find(t => (draft.templateId && t.id === draft.templateId && JSON.stringify(S.dimensionsOf({enabledDimensions:t.dimensions})) === currentDimsKey))
        || enabledTpls.find(t => JSON.stringify(S.dimensionsOf({enabledDimensions:t.dimensions})) === currentDimsKey);
      let tplOptions = enabledTpls.map(t => `<option value="${e(t.id)}" ${matchedTpl?.id === t.id ? 'selected' : ''}>${e(t.name)}</option>`).join('');
      if (!matchedTpl) {
        tplOptions = `<option value="__snapshot__" selected>${e((draft.templateName || '已保存模板') + '（保持原维度）')}</option>` + tplOptions;
      } else {
        draft.templateId = matchedTpl.id;
        draft.templateName = matchedTpl.name;
      }
      tplSelect.innerHTML = tplOptions;
      let lastTplValue = tplSelect.value;
      tplSelect.addEventListener('change', () => {
        const chosen = enabledTpls.find(t => t.id === tplSelect.value);
        if (!chosen) { lastTplValue = tplSelect.value; return; }
        const nextDims = S.dimensionsOf({enabledDimensions:chosen.dimensions});
        const removedWithData = S.dimensionsOf(draft).filter(k => !nextDims.includes(k) && draft.content[k]?.length);
        const applyTpl = () => {
          removedWithData.forEach(k => { draft.content[k] = []; });
          draft.templateId = chosen.id;
          draft.templateName = chosen.name;
          draft.enabledDimensions = nextDims;
          lastTplValue = tplSelect.value;
          syncDimensionTabs();
          renderContent();
          changed();
        };
        if (removedWithData.length) {
          const labels = removedWithData.map(k => TalentSettings.dimensions[k]).join('、');
          const d = UI.openDialog({
            title: '切换标准模板',
            body: `<p>切换为“${e(chosen.name)}”后，将不再启用并清空当前已填写的“${e(labels)}”内容，是否继续？</p>`,
            confirmLabel: '确认切换',
            onConfirm() { applyTpl(); }
          });
          d.addEventListener('close', () => { if (tplSelect.value !== lastTplValue || draft.templateId !== chosen.id) tplSelect.value = lastTplValue; }, {once:true});
        } else applyTpl();
      });
    }

    [['code','std-code'],['name','std-name'],['category','std-category'],['description','std-description']].forEach(([k,id])=>{const input=$('#'+id);input.value=draft[k]||'';input.addEventListener('input',()=>{draft[k]=input.value;if(k==='name')renderCapabilityChart();changed();input.removeAttribute('aria-invalid');const err=$('#'+id+'-error');if(err)err.textContent='';});});
    document.querySelectorAll('[name=mode]').forEach(input=>{input.checked=input.value===draft.mode;input.onchange=()=>{draft.mode=input.value;scopeModeChanged=true;changed();renderScope();};});
    if(aiImported){dirty=true;$('#std-save-state').textContent='AI 生成内容待确认';}
    const values=field=>field==='critical'?['是','否']:field==='position'?[...new Set([...S.positions.map(p=>p.name),...S.people.map(p=>p.position)])]:field==='category'?[...new Set(S.positions.map(p=>p.category))]:[...new Set(S.people.map(p=>p.department))];
    function renderScope(){
      $('#std-scope-error').textContent='';
      if(draft.mode==='none')$('#std-scope').innerHTML='';
      if(draft.mode==='positions')$('#std-scope').innerHTML=button('选择岗位','id="std-pick-positions"')+`<div class="mt-md">${draft.positions.map(id=>{const p=S.positions.find(p=>p.id===id);return `<div class="std-link-row"><div><b>${e(p?.name||id)}</b><p>${e(p?.category||'')} · ${e(id)}</p></div>${button('移除',`data-remove-position="${e(id)}"`,'btn-text danger')}</div>`;}).join('')||'<p class="text-sm muted">尚未选择岗位</p>'}</div>`;
      if(draft.mode==='rules')$('#std-scope').innerHTML=draft.groups.map((group,gi)=>`${gi?'<div class="std-or">或满足以下条件</div>':''}<div class="std-rule-group"><div class="std-rule-head"><b class="text-sm">条件组 ${gi+1} · 全部满足</b>${button('删除组',`data-remove-group="${gi}"`,'btn-text danger')}</div>${group.map((r,ri)=>`<div class="std-rule"><select class="select" aria-label="条件字段 ${gi+1}-${ri+1}" data-rule-field="${gi},${ri}">${Object.entries(S.fields).map(([k,label])=>`<option value="${k}" ${k===r.field?'selected':''}>${label}</option>`).join('')}</select><span class="text-sm muted">属于</span>${button(e(r.values.join('、')||'选择条件值'),`data-rule-values="${gi},${ri}"`,'btn btn-secondary std-values')}${button('×',`data-remove-rule="${gi},${ri}" aria-label="删除条件 ${gi+1}-${ri+1}"`,'btn-text')}</div>`).join('')}${button('添加条件',`data-add-rule="${gi}"`,'btn btn-ghost')}</div>`).join('')+button('添加另一组条件','id="std-add-group"','btn btn-secondary mt-md');
    }
    $('#std-scope').onclick=ev=>{
      const b=ev.target.closest('button');if(!b)return;
      if(b.id==='std-pick-positions'){pick('选择岗位',S.positions.map(p=>({...p,note:p.category+' · '+p.id})),draft.positions,ids=>{draft.positions=ids;changed();renderScope();});return;}
      if(b.dataset.ruleValues){const [g,r]=b.dataset.ruleValues.split(',').map(Number),rule=draft.groups[g][r];pick('选择'+S.fields[rule.field],values(rule.field).map(v=>({id:v,name:v})),rule.values,list=>{rule.values=list;changed();renderScope();});return;}
      if(b.dataset.removePosition)draft.positions=draft.positions.filter(id=>id!==b.dataset.removePosition);
      if(b.id==='std-add-group')draft.groups.push([{field:'department',values:[]}]);
      if(b.dataset.addRule!==undefined)draft.groups[Number(b.dataset.addRule)].push({field:'position',values:[]});
      if(b.dataset.removeGroup!==undefined)draft.groups.splice(Number(b.dataset.removeGroup),1);
      if(b.dataset.removeRule){const [g,r]=b.dataset.removeRule.split(',').map(Number);draft.groups[g].splice(r,1);}
      changed();renderScope();
    };
    $('#std-scope').onchange=ev=>{if(ev.target.dataset.ruleField){const [g,r]=ev.target.dataset.ruleField.split(',').map(Number);draft.groups[g][r]={field:ev.target.value,values:[]};changed();renderScope();}};
    const abilityOptions=[...new Set([...Object.values(window.STANDARD_POSITION_SEEDS).flatMap(s=>s.abilityOptions.map(a=>a[0])),...data.standards.flatMap(s=>s.content.cap.map(c=>c[0]))])];
    const demoIndicators=window.IndicatorDemo?.items||{};
    const demoCategories=window.IndicatorDemo?.traitCategories||{};
    function libraryItems(key, fallbackNames) {
      const items=new Map((demoIndicators[key]||[]).map(item=>[item.name,{id:item.name,name:item.name,note:(key==='cap'&&item.graded===false?'无等级 · ':'')+(item.description||''),categoryId:item.categoryId}]));
      fallbackNames.forEach(name=>{if(!items.has(name))items.set(name,{id:name,name,categoryId:key==='cap'?'general':(demoCategories[key]?.[0]?.id||'')})});
      return [...items.values()];
    }
    const libraries={cap:libraryItems('cap',abilityOptions),pow:libraryItems('pow',['成就导向','技术钻研','创新探索','影响他人','稳定归属','自主独立','掌控权力','协作共赢']),pot:libraryItems('pot',['战略思维','变革推动','学习敏锐','复杂决策','跨界整合','坚韧抗压'])};
    function capabilityEditor(){
      const items=draft.content.cap;
      if(!items.length)return '<div class="std-cap-empty">尚未配置能力要求，请先选择能力并设置要求等级。</div>';
      return `<div class="std-cap-layout"><div class="std-cap-visual" data-std-cap-chart></div><div class="std-cap-requirements"><div class="std-cap-list-head"><span>能力项</span><span>要求等级 · ${items.length} 项</span></div><div class="std-cap-items">${items.map(([name,level],i)=>{
        const graded=isCapGraded(name,level);
        return `<div class="std-cap-row"><label ${graded?`for="std-cap-level-${i}"`:''}>${e(name)}</label>${graded?`<select class="select" id="std-cap-level-${i}" aria-label="${e(name)}要求等级" data-cap-level="${i}">${Array.from({length:10},(_,n)=>n+1).map(n=>`<option ${level==='L'+n?'selected':''}>L${n}</option>`).join('')}</select>`:'<span class="std-cap-ungraded">不分级</span>'}${button('×',`data-remove-content="cap,${i}" aria-label="移除${e(name)}"`,'btn-text')}</div>`;
      }).join('')}</div></div></div>`;
    }
    function renderCapabilityChart(){
      const host=$('[data-std-cap-chart]');if(!host)return;
      const items=draft.content.cap;
      host.innerHTML=window.StandardUI.capabilityRadarGroups(items);
    }
    function renderContent(){const c=draft.content;
      $('#std-content-editor').innerHTML=`<div class="std-block" data-content-section="duty"><div class="std-block-head"><h3>职责任务</h3>${button('新增职责','data-add-duty-std')}</div>${c.duty.map((d,i)=>`<div class="std-duty"><div class="std-text-row"><textarea class="input" aria-label="职责 ${i+1}" data-duty-std="${i}" placeholder="填写职责">${e(d.n)}</textarea>${button('移除',`data-remove-duty-std="${i}"`,'btn-text danger')}</div>${d.t.map((t,j)=>`<div class="std-text-row std-task"><textarea class="input" aria-label="职责 ${i+1} 的任务 ${j+1}" data-task-std="${i},${j}" placeholder="填写任务">${e(t)}</textarea>${button('×',`data-remove-task-std="${i},${j}" aria-label="移除任务"`,'btn-text')}</div>`).join('')}${button('添加任务',`data-add-task-std="${i}"`,'btn-text std-task')}</div>`).join('')||'<p class="text-sm muted">尚未配置职责任务</p>'}</div>
      <div class="std-block" data-content-section="exp"><div class="std-block-head"><h3>经历经验</h3>${button('添加经历','data-add-exp-std')}</div>${c.exp.map((t,i)=>`<div class="std-text-row"><textarea class="input" aria-label="经历经验 ${i+1}" data-exp-std="${i}">${e(t)}</textarea>${button('移除',`data-remove-exp-std="${i}"`,'btn-text danger')}</div>`).join('')||'<p class="text-sm muted">尚未配置经历经验</p>'}</div>
      ${[['cap','能力要求','能力'],['pow','动力要求','动力'],['pot','潜力要求','潜力']].map(([key,label,action])=>`<div class="std-block" data-content-section="${key}"><div class="std-block-head"><h3>${label}</h3>${button('选择'+action,`data-pick-content="${key}"`)}</div>${key==='cap'?capabilityEditor():c[key].map((item,i)=>`<span class="std-chip">${e(item)}${button('×',`data-remove-content="${key},${i}" aria-label="移除${e(item)}"`,'btn-text')}</span>`).join('')||'<p class="text-sm muted">尚未配置'+label+'</p>'}</div>`).join('')}`;
      renderCapabilityChart();
      contentTab(activeContentTab);
    }
    $('#std-content-editor').oninput=ev=>{const el=ev.target,d=el.dataset,c=draft.content;if(d.dutyStd!==undefined)c.duty[+d.dutyStd].n=el.value;if(d.taskStd){const[i,j]=d.taskStd.split(',').map(Number);c.duty[i].t[j]=el.value;}if(d.expStd!==undefined)c.exp[+d.expStd]=el.value;if(d.capLevel!==undefined){c.cap[+d.capLevel][1]=el.value;renderCapabilityChart();}changed();};
    $('#std-content-editor').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const d=b.dataset,c=draft.content;
      if(d.pickContent){const key=d.pickContent,labels={cap:'能力',pow:'动力',pot:'潜力'},treeTitles={cap:'能力指标',pow:'动力指标',pot:'潜力指标'};pickIndicators(key==='cap'?'选择关联指标':'选择'+labels[key]+'指标',libraries[key],c[key].map(i=>key==='cap'?i[0]:i),list=>{if(key==='cap'&&list.length>20){showToast('最多选择 20 项能力');return false;}c[key]=list.map(n=>{if(key!=='cap')return n;const existing=c.cap.find(x=>x[0]===n);if(existing)return existing;return [n,window.IndicatorDemo?.isGraded&&!window.IndicatorDemo.isGraded(n)?'':'L3'];});changed();renderContent();},key==='cap'?20:Infinity,{categories:key==='cap'?(window.IndicatorDemo?.categories||[]):(demoCategories[key]||[]),treeTitle:treeTitles[key],nameLabel:labels[key]+'名称'});return;}
      if('addDutyStd'in d)c.duty.push({n:'',t:[]});
      if('removeDutyStd'in d)c.duty.splice(+d.removeDutyStd,1);
      if('addTaskStd'in d)c.duty[+d.addTaskStd].t.push('');
      if('removeTaskStd'in d){const[i,j]=d.removeTaskStd.split(',').map(Number);c.duty[i].t.splice(j,1);}
      if('addExpStd'in d)c.exp.push('');
      if('removeExpStd'in d)c.exp.splice(+d.removeExpStd,1);
      if(d.removeContent){const[k,i]=d.removeContent.split(',');c[k].splice(+i,1);}
      changed();renderContent();
    };
    $('#std-form').onsubmit=ev=>{ev.preventDefault();let invalid=false;
      [['code','std-code','basic','请输入标准编号'],['name','std-name','basic','请输入标准名称']].forEach(([key,id,section,msg])=>{draft[key]=draft[key].trim();if(!draft[key]){$('#'+id+'-error').textContent=msg;$('#'+id).setAttribute('aria-invalid','true');if(!invalid){tab(section);$('#'+id).focus();}invalid=true;}});
      if(draft.code.length>20||data.standards.some(item=>item.id!==draft.id&&item.code===draft.code)){tab('basic');$('#std-code-error').textContent=draft.code.length>20?'标准编号最多 20 个字符':'标准编号已存在';$('#std-code').focus();return;}
      if(invalid)return;
      if(!draft.category){tab('basic');showToast('请选择类别');return;}
      const scopeInvalid=draft.mode==='positions'&&!draft.positions.length || draft.mode==='rules'&&(!draft.groups.length||draft.groups.some(g=>!g.length||g.some(r=>!r.values.length)));
      if(scopeInvalid){tab('scope');$('#std-scope-error').textContent=draft.mode==='positions'?'请选择至少一个岗位，或改为暂不关联。':'每个条件组至少包含一条条件，并选择条件值。';return;}
      const c=draft.content;
      S.allDimensions.forEach(k=>{if(!availableSections.includes(k))c[k]=[];});
      if(availableSections.includes('cap')&&c.cap.length>20){tab('content-cap');showToast('最多保留 20 项能力，请移除多余条目后保存');return;}
      if((availableSections.includes('duty')&&c.duty.some(d=>!d.n.trim()||d.t.some(t=>!t.trim())))||(availableSections.includes('exp')&&c.exp.some(t=>!t.trim()))){tab('content');showToast('请填写空白要求，或移除未使用的条目');return;}
      if(draft.mode!=='positions')draft.positions=[];if(draft.mode!=='rules')draft.groups=[];
      delete draft.object;
      delete draft.objectDescription;
      draft.enabledDimensions=[...availableSections];
      draft.updated=new Date().toLocaleDateString('sv-SE');
      S.setStandard(data,draft,{preserveRuleLinks:original?.mode==='rules'&&draft.mode==='rules'&&!scopeModeChanged});
      if(!persist())return;dirty=false;$('#std-save-state').textContent='已保存';$('#std-title').textContent=draft.name;history.replaceState(null,'','standard-detail.html?id='+encodeURIComponent(draft.id)+(context?'&position='+encodeURIComponent(context.id):'')+location.hash);renderPlanEntries();showToast(context&&!S.associated(data,context.id).some(s=>s.id===draft.id)?'已保存，可在人才标准视图查看':'人才标准已保存');
    };
    window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
    $('#std-form').onkeydown=ev=>{if((ev.metaKey||ev.ctrlKey)&&ev.key==='Enter'){$('#std-form').requestSubmit();}};
    renderScope();renderContent();
  }
})();
