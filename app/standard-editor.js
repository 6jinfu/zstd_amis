(function () {
  const S=window.Standards, $=s=>document.querySelector(s);
  const e = UI.escape;
  const uid=()=> 'std-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  let data;
  try { data=S.read(); } catch(err) { showToast('无法读取标准，请检查浏览器存储权限'); return; }
  function persist() { try { S.write(data); return true; } catch(err) { showToast('保存失败，请检查浏览器存储空间与权限'); return false; } }
  const button=(label,attr='',cls='btn btn-secondary')=>`<button type="button" class="${cls}" ${attr}>${label}</button>`;
  const {pick, pickIndicators} = window.StandardUI;
  if($('[data-standard-detail]')) {
    const params=new URLSearchParams(location.search),original=data.standards.find(s=>s.id===(params.get('id')||params.get('copy')));
    if(params.get('id')&&!original){$('.detail-main').innerHTML='<div class="empty-state">该标准不存在，请返回列表。</div>';$('#std-form').onsubmit=ev=>ev.preventDefault();return;}
    let draft=original?S.clone(original):{id:uid(),name:'',category:data.categories[0]||'',description:'',mode:'none',positions:[],groups:[],content:S.emptyContent()};
    if(params.has('copy')&&original){draft.id=uid();draft.name+='（副本）';draft.mode='none';draft.positions=[];draft.groups=[];}
    const context=S.positions.find(p=>p.id===params.get('position'));
    if(context&&!original){draft.name=context.name+'标准';draft.category=context.category;draft.mode='positions';draft.positions=[context.id];}
    let dirty=false;
    function changed(){dirty=true;$('#std-save-state').textContent='有未保存的修改';}
    document.querySelectorAll('[data-std-cancel]').forEach(link=>link.addEventListener('click',()=>{dirty=false;}));
    let activeContentTab='duty';
    function contentTab(name){
      if(!['duty','exp','cap','pow','pot'].includes(name))name='duty';
      activeContentTab=name;
      document.querySelectorAll('[data-content-section]').forEach(s=>s.hidden=s.dataset.contentSection!==name);
    }
    function tab(name){
      if(name==='object')name='scope';
      let section=name;
      if(name.indexOf('content-')===0){contentTab(name.slice(8));section='content';}
      if(section==='content')contentTab(activeContentTab);
      if(!['basic','scope','content'].includes(section))section='basic';
      const activeKey=section==='content'?'content-'+activeContentTab:section;
      document.querySelectorAll('[data-std-section]').forEach(s=>s.hidden=s.dataset.stdSection!==section);
      document.querySelectorAll('[data-std-tab]').forEach(a=>{const active=a.dataset.stdTab===activeKey;a.classList.toggle('active',active);a.setAttribute('aria-current',active?'page':'false');});
    }
    document.querySelectorAll('[data-std-tab]').forEach(a=>a.onclick=()=>tab(a.dataset.stdTab));
    tab(location.hash.slice(1));
    window.addEventListener('hashchange',()=>tab(location.hash.slice(1)));
    $('#std-title').textContent=original&&!params.has('copy')?draft.name:'新建人才标准';
    $('#std-category').innerHTML=data.categories.map(c=>`<option value="${e(c)}">${e(c)}</option>`).join('');
    [['name','std-name'],['category','std-category'],['description','std-description']].forEach(([k,id])=>{const input=$('#'+id);input.value=draft[k]||'';input.addEventListener('input',()=>{draft[k]=input.value;changed();input.removeAttribute('aria-invalid');const err=$('#'+id+'-error');if(err)err.textContent='';});});
    document.querySelectorAll('[name=mode]').forEach(input=>{input.checked=input.value===draft.mode;input.onchange=()=>{draft.mode=input.value;changed();renderScope();};});
    const values=field=>field==='critical'?['是','否']:field==='position'?[...new Set([...S.positions.map(p=>p.name),...S.people.map(p=>p.position)])]:field==='category'?[...new Set(S.positions.map(p=>p.category))]:[...new Set(S.people.map(p=>p.department))];
    function renderScope(){
      $('#std-scope-error').textContent='';
      if(draft.mode==='none')$('#std-scope').innerHTML='<p class="text-sm muted">可先维护标准，后续再关联岗位或人员。</p>';
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
      const items=new Map((demoIndicators[key]||[]).map(item=>[item.name,{id:item.name,name:item.name,note:item.description,categoryId:item.categoryId}]));
      fallbackNames.forEach(name=>{if(!items.has(name))items.set(name,{id:name,name,categoryId:key==='cap'?'general':(demoCategories[key]?.[0]?.id||'')})});
      return [...items.values()];
    }
    const libraries={cap:libraryItems('cap',abilityOptions),pow:libraryItems('pow',['成就导向','技术钻研','创新探索','影响他人','稳定归属','自主独立','掌控权力','协作共赢']),pot:libraryItems('pot',['战略思维','变革推动','学习敏锐','复杂决策','跨界整合','坚韧抗压'])};
    function renderContent(){const c=draft.content;
      $('#std-content-editor').innerHTML=`<div class="std-block" data-content-section="duty"><div class="std-block-head"><h3>职责任务</h3>${button('新增职责','data-add-duty-std')}</div>${c.duty.map((d,i)=>`<div class="std-duty"><div class="std-text-row"><textarea class="input" aria-label="职责 ${i+1}" data-duty-std="${i}" placeholder="填写职责">${e(d.n)}</textarea>${button('移除',`data-remove-duty-std="${i}"`,'btn-text danger')}</div>${d.t.map((t,j)=>`<div class="std-text-row std-task"><textarea class="input" aria-label="职责 ${i+1} 的任务 ${j+1}" data-task-std="${i},${j}" placeholder="填写任务">${e(t)}</textarea>${button('×',`data-remove-task-std="${i},${j}" aria-label="移除任务"`,'btn-text')}</div>`).join('')}${button('添加任务',`data-add-task-std="${i}"`,'btn-text std-task')}</div>`).join('')||'<p class="text-sm muted">尚未配置职责任务</p>'}</div>
      <div class="std-block" data-content-section="exp"><div class="std-block-head"><h3>经历经验</h3>${button('添加经历','data-add-exp-std')}</div>${c.exp.map((t,i)=>`<div class="std-text-row"><textarea class="input" aria-label="经历经验 ${i+1}" data-exp-std="${i}">${e(t)}</textarea>${button('移除',`data-remove-exp-std="${i}"`,'btn-text danger')}</div>`).join('')||'<p class="text-sm muted">尚未配置经历经验</p>'}</div>
      ${[['cap','能力要求','能力'],['pow','动力要求','动力'],['pot','潜力要求','潜力']].map(([key,label,action])=>`<div class="std-block" data-content-section="${key}"><div class="std-block-head"><h3>${label}</h3>${button('选择'+action,`data-pick-content="${key}"`)}</div>${c[key].map((item,i)=>`<span class="std-chip">${e(key==='cap'?item[0]:item)}${key==='cap'?`<select class="select" aria-label="${e(item[0])}要求等级" data-cap-level="${i}">${[1,2,3,4,5].map(n=>`<option ${item[1]==='L'+n?'selected':''}>L${n}</option>`).join('')}</select>`:''}${button('×',`data-remove-content="${key},${i}" aria-label="移除${e(key==='cap'?item[0]:item)}"`,'btn-text')}</span>`).join('')||'<p class="text-sm muted">尚未配置'+label+'</p>'}</div>`).join('')}`;
      contentTab(activeContentTab);
    }
    $('#std-content-editor').oninput=ev=>{const el=ev.target,d=el.dataset,c=draft.content;if(d.dutyStd!==undefined)c.duty[+d.dutyStd].n=el.value;if(d.taskStd){const[i,j]=d.taskStd.split(',').map(Number);c.duty[i].t[j]=el.value;}if(d.expStd!==undefined)c.exp[+d.expStd]=el.value;if(d.capLevel!==undefined)c.cap[+d.capLevel][1]=el.value;changed();};
    $('#std-content-editor').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const d=b.dataset,c=draft.content;
      if(d.pickContent){const key=d.pickContent,labels={cap:'能力',pow:'动力',pot:'潜力'},treeTitles={cap:'能力指标',pow:'动力指标',pot:'潜力指标'};pickIndicators(key==='cap'?'选择关联指标':'选择'+labels[key]+'指标',libraries[key],c[key].map(i=>key==='cap'?i[0]:i),list=>{if(key==='cap'&&list.length>20){showToast('最多选择 20 项能力');return false;}c[key]=list.map(n=>key==='cap'?(c.cap.find(x=>x[0]===n)||[n,'L3']):n);changed();renderContent();},key==='cap'?20:Infinity,{categories:key==='cap'?(window.IndicatorDemo?.categories||[]):(demoCategories[key]||[]),treeTitle:treeTitles[key],nameLabel:labels[key]+'名称'});return;}
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
      [['name','std-name','basic','请输入标准名称']].forEach(([key,id,section,msg])=>{draft[key]=draft[key].trim();if(!draft[key]){$('#'+id+'-error').textContent=msg;$('#'+id).setAttribute('aria-invalid','true');if(!invalid){tab(section);$('#'+id).focus();}invalid=true;}});
      if(invalid)return;
      if(!draft.category){tab('basic');showToast('请选择类别');return;}
      const scopeInvalid=draft.mode==='positions'&&!draft.positions.length || draft.mode==='rules'&&(!draft.groups.length||draft.groups.some(g=>!g.length||g.some(r=>!r.values.length)));
      if(scopeInvalid){tab('scope');$('#std-scope-error').textContent=draft.mode==='positions'?'请选择至少一个岗位，或改为暂不关联。':'每个条件组至少包含一条条件，并选择条件值。';return;}
      const c=draft.content;if(c.duty.some(d=>!d.n.trim()||d.t.some(t=>!t.trim()))||c.exp.some(t=>!t.trim())){tab('content');showToast('请填写空白要求，或移除未使用的条目');return;}
      if(draft.mode!=='positions')draft.positions=[];if(draft.mode!=='rules')draft.groups=[];
      delete draft.object;
      delete draft.objectDescription;
      draft.updated=new Date().toLocaleDateString('sv-SE');
      const index=data.standards.findIndex(s=>s.id===draft.id);if(index<0)data.standards.push(S.clone(draft));else data.standards[index]=S.clone(draft);
      if(!persist())return;dirty=false;$('#std-save-state').textContent='已保存';$('#std-title').textContent=draft.name;history.replaceState(null,'','standard-detail.html?id='+draft.id+location.hash);showToast('人才标准已保存');
    };
    window.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
    $('#std-form').onkeydown=ev=>{if((ev.metaKey||ev.ctrlKey)&&ev.key==='Enter'){$('#std-form').requestSubmit();}};
    renderScope();renderContent();
  }
})();
