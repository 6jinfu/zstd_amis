/* 岗位、人才与学习方案从同一标准记录读取要求。 */
(function () {
  const S=window.Standards,U=window.StandardUI,$=s=>document.querySelector(s),e=U.escape;
  let data=S.read();
  function save(){try{S.write(data);return true;}catch(err){showToast('保存失败，请检查浏览器存储权限');return false;}}
  const isPosition=!!$('#position-standard-links');
  const positionId = isPosition ? window.POSITION_DEMO.code : new URLSearchParams(location.search).get('position') || 'RD-302';
  if(isPosition){
    const p=S.positions.find(p=>p.id===positionId);
    $('#position-new-standard').href='standard-detail.html?position='+encodeURIComponent(positionId);
    function render(){
      const linked=S.associated(data,positionId);
      $('#position-standard-links').innerHTML=linked.map(s=>{const url='standard-detail.html?id='+encodeURIComponent(s.id)+'&position='+encodeURIComponent(positionId);return `<div class="std-link-row"><div><a class="std-table-name" href="${url}">${e(s.name)}</a><p>${e(S.applicableObjectLabel(data,s))}</p></div><a class="btn-text" href="${url}">编辑标准</a><a class="btn-text" href="${url}#plan">学习方案</a><button class="btn-text danger" data-unlink="${e(s.id)}">解除关联</button></div>`;}).join('')||'<div class="empty-state">尚未关联标准</div>';
    }
    $('#position-link-standard').onclick=()=>{const selected=S.associated(data,positionId).map(s=>s.id);U.pick('关联人才标准',data.standards.filter(s=>!selected.includes(s.id)).map(s=>({id:s.id,name:s.name,note:S.modes[s.mode]||'暂未关联'})),[],ids=>{data.links[positionId]=[...new Set([...(data.links[positionId]||[]),...ids])];if(save()){render();renderPlanReference();showToast('已关联标准');}});};
    $('#position-standard-links').onclick=ev=>{const b=ev.target.closest('[data-unlink]');if(!b)return;const s=data.standards.find(s=>s.id===b.dataset.unlink);U.dialog('解除关联',`<p>解除“${e(s.name)}”与本岗位的关联？标准内容会保留。</p>`,'解除关联',()=>{s.positions=s.positions.filter(id=>id!==positionId);if(s.mode==='positions'&&!s.positions.length)s.mode='none';data.links[positionId]=(data.links[positionId]||[]).filter(id=>id!==s.id);if(data.selected['plan-'+positionId]===s.id)delete data.selected['plan-'+positionId];if(!save())return false;render();renderPlanReference();});};
    if(p){const tag=$('.detail-bar .tag');if(tag)tag.hidden=!p.critical;const check=$('[data-section=info] input[type=checkbox]');if(check)check.checked=p.critical;}
    render();
  }
  function reference(host,key,options,onchange,immediate = true,preferred = ''){
    const candidates=options();let chosen=data.selected[key];
    // First use can adopt the sole candidate. An explicit empty selection remains empty.
    if(!Object.prototype.hasOwnProperty.call(data.selected,key)&&candidates.length===1)chosen=candidates[0].id;
    if(preferred)chosen=candidates.some(s=>s.id===preferred)?preferred:'';
    if(!candidates.some(s=>s.id===chosen))chosen='';
    host.innerHTML=`${preferred?'<label>来源人才标准</label>':`<label for="${key}">采用人才标准</label>`}<div class="flex gap-sm">${preferred?`<span>${e(candidates.find(s=>s.id===chosen)?.name||'未找到来源标准')}</span>`:`<select class="select" id="${key}"><option value="">${candidates.length?'请选择人才标准':'暂无可用人才标准'}</option>${candidates.map(s=>`<option value="${e(s.id)}" ${s.id===chosen?'selected':''}>${e(s.name)}</option>`).join('')}</select>`}<a class="btn-text" data-view-reference>查看标准</a></div><p data-reference-note></p>`;
    const select=host.querySelector('select');
    function update(){const s=candidates.find(s=>s.id===(preferred?chosen:select.value));const link=host.querySelector('a');link.hidden=!s;if(s)link.href='standard-detail.html?id='+encodeURIComponent(s.id)+'#content';host.querySelector('p').textContent=s?`应用范围：${S.summary(s)}`:preferred?'请从人才标准的学习方案入口重新进入。':'请选择人才标准查看要求。';onchange(s);}
    if(select)select.onchange=()=>{if(immediate){data.selected[key]=select.value;if(!save())return;}update();};update();return chosen;
  }
  let selectedPlan=null;
  const planHost=isPosition?$('[data-section=plan]'):location.pathname.endsWith('learning-plan.html')?$('.content .card'):null;
  let planReference;
  if(planHost){planReference=planHost.querySelector('[data-plan-reference]');if(!planReference){planReference=document.createElement('div');planReference.className='std-reference';planHost.prepend(planReference);}}
  function renderPlanReference(){
    if(!planReference)return;
    reference(planReference,'plan-'+positionId,()=>S.associated(data,positionId),s=>{
      selectedPlan=s;
      let list=planReference.querySelector('[data-plan-requirements]');if(!list){list=document.createElement('p');list.dataset.planRequirements='';planReference.appendChild(list);}
      list.textContent=s?'能力要求：'+(s.content.cap.map(c=>c.join(' ')).join('、')||'尚未配置'):'';
      const b=$('#ai-course-btn');if(b)b.disabled=!s||!s.content.cap.length;
    }, false, isPosition?'':new URLSearchParams(location.search).get('standard')||'');
  }
  if(planHost){
    const table = $('#plan-table');
    const initialRows = [...table.tBodies[0].rows].filter(row => row.cells.length === 4).map(row => [row.cells[0].textContent.trim(), '', row.cells[1].textContent.trim(), row.cells[2].textContent.trim()]);
    const position = S.positions.find(item => item.id === positionId);
    const demo = isPosition ? window.POSITION_DEMO : positionId === 'SA-201' ? window.STANDARD_POSITION_SEEDS.sales : null;
    const rows = data.plans?.[positionId] ?? (demo ? demo.plan : positionId === 'RD-302' ? initialRows : []);
    const editor = UI.mountResourceEditor(table, {rows});
    if (!isPosition && position) {
      document.title = '学习方案 · ' + position.name + ' · 发展中心';
      $('.breadcrumb .cur').textContent = '学习方案 · ' + position.name;
      const sourceId = new URLSearchParams(location.search).get('standard');
      if (sourceId && S.associated(data, positionId).some(s => s.id === sourceId)) {
        const sourceUrl = 'standard-detail.html?id=' + encodeURIComponent(sourceId) + '#plan';
        $('.breadcrumb a').href = sourceUrl;
        $('.breadcrumb a').textContent = '人才标准';
        $('.detail-bar .back').href = sourceUrl;
        $('.detail-foot a').href = sourceUrl;
      }
    }
    const catalog = {
      '课程': demo?.courseOptions || ['分布式系统设计','高并发架构实战','领导力基础','数据治理入门'],
      '项目': demo?.projectOptions || ['架构师加速营','技术管理训练营','跨部门攻坚项目'],
      '前测': demo?.examOptions || ['系统架构认证','PMP 项目管理'],
      '后测': demo?.examOptions || ['系统架构认证','PMP 项目管理']
    };
    document.querySelectorAll('[data-picker]').forEach(button => {
      button.addEventListener('click', () => {
        const menu=button.closest('.plan-project-menu');if(menu){menu.open=false;menu.querySelector('summary').focus();}
        const kind = button.dataset.picker;
        UI.openPicker({title:'添加' + kind, items:catalog[kind].map(name => ({id:name,label:name})), onConfirm(ids) {
          editor.add(ids.map(name => [kind, '', name, '培训平台']));
        }});
      });
    });
    const projectMenu=planHost.querySelector('.plan-project-menu');
    if(projectMenu){
      document.addEventListener('click',event=>{if(!projectMenu.contains(event.target)||event.target.closest('a'))projectMenu.open=false;});
      projectMenu.addEventListener('keydown',event=>{if(event.key==='Escape'){projectMenu.open=false;projectMenu.querySelector('summary').focus();}});
      projectMenu.addEventListener('focusout',event=>{if(!projectMenu.contains(event.relatedTarget))projectMenu.open=false;});
    }
    const b = $('#ai-course-btn');
    b.onclick=()=>{
      if(!selectedPlan)return;
      const names=selectedPlan.content.cap.map(c=>c[0]);
      const resources=[
        {terms:['算法设计','模型工程','特征工程','编程能力'],rows:window.STANDARD_POSITION_SEEDS.algorithm.plan},
        {terms:['客户洞察','顾问式销售','商务谈判','商机管理','协同推进'],rows:window.STANDARD_POSITION_SEEDS.sales.plan},
        {terms:['系统架构','技术选型','团队管理'],rows:[['课程','tag-primary','分布式系统设计','培训平台 · 24 课时'],['课程','tag-primary','高并发架构实战','培训平台 · 16 课时'],['项目','tag-success','架构师加速营（第 3 期）','培训项目 · 3 个月']]},
        {terms:['跨部门沟通','创新思维'],rows:[['课程','tag-primary','领导力基础','培训平台'],['项目','tag-success','跨部门攻坚项目','培训项目']]}
      ].filter(r=>r.terms.some(n=>names.includes(n))).flatMap(r=>r.rows);
      const unique=[...new Map(resources.map(r=>[r[0]+'-'+r[2],r])).values()];
      if(!unique.length){showToast('暂无匹配的学习资源，可手动关联');return;}
      U.pick('推荐学习资源',unique.map((r,i)=>({id:String(i),name:r[2],note:r[0]})),unique.map((r,i)=>String(i)),ids=>{
        editor.add(ids.map(id => unique[+id]));
      });
    };
    const saveButton = $(isPosition ? '#save-btn' : '#save-lp');
    saveButton.addEventListener('click', () => {
      if(!isPosition&&new URLSearchParams(location.search).get('standard')&&!selectedPlan){showToast('未找到来源标准，请从人才标准重新进入');return;}
      data.plans = data.plans || {};
      data.plans[positionId] = editor.getValue();
      data.selected['plan-' + positionId] = selectedPlan?.id || '';
      if (save()) showToast('已保存');
    });
    renderPlanReference();
  }
  if(location.pathname.endsWith('talent-profile.html')){
    const section=$('[data-section=ability]'),host=document.createElement('div');host.className='std-reference';section.prepend(host);
    const person=S.people.find(p=>p.name==='张明');
    reference(host,'talent-zhangming',()=>S.forPerson(data,person),s=>{
      const requirements=new Map(s?.content.cap||[]),rows=[...section.querySelectorAll('.gauge-row')];
      rows.forEach(row=>{const name=row.querySelector('.g-name').textContent,level=requirements.get(name),marker=row.querySelector('.g-std');marker.hidden=!level;if(level){marker.style.left=(parseFloat(level.slice(1))/5*100)+'%';marker.title='标准要求 '+level;}});
      const std=section.querySelector('polygon.std');std.style.display='none';
      // Keep the polygon only when all five axes have comparable standard requirements.
      const axis=rows.map(r=>r.querySelector('.g-name').textContent);if(axis.every(n=>requirements.has(n))){std.style.display='';std.setAttribute('points',axis.map((n,i)=>{const angle=(-90+i*72)*Math.PI/180,r=parseFloat(requirements.get(n).slice(1))/5*70;return (100+Math.cos(angle)*r).toFixed(1)+','+(100+Math.sin(angle)*r).toFixed(1);}).join(' '));}
      section.querySelector('.ability-source-note span').textContent=s?'标准要求来自“'+s.name+'”；实际能力来自评估结果。':'尚未选择标准，仅展示已有实际能力。';
      section.querySelectorAll('.ability-legend span').forEach(span=>{if(span.textContent.includes('岗位要求'))span.lastChild.textContent='标准要求';});
      const title=section.querySelector('.flex.between.center .text-sm');if(title)title.textContent='标准要求与实际能力';
      const extra=host.querySelector('[data-extra-cap]');if(extra)extra.remove();const uncovered=(s?.content.cap||[]).filter(c=>!axis.includes(c[0]));if(uncovered.length){const p=document.createElement('p');p.dataset.extraCap='';p.textContent='暂无实际结果：'+uncovered.map(c=>c.join(' ')).join('、');host.appendChild(p);}
    });
  }
})();
