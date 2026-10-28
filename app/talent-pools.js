(function () {
  const T=window.Talent, e=UI.escape;
  const option=(value,label,selected)=>`<option value="${e(value)}" ${value===selected?'selected':''}>${e(label)}</option>`;
  const field=(label,id,control)=>`<div class="field"><label for="${id}">${label}</label>${control}</div>`;
  const sourceLink=pool=>{const project=T.sourceProject(pool);return project?`<a class="btn-text" href="${e(project.url)}#pool">${e(project.name)}</a>`:'未关联盘点项目';};
  function form(data,pool,onSave,projectId='') {
    const source=pool?.sourceProject||projectId, locked=!!projectId||!!(pool?.sourceProject&&pool.members.length);
    UI.openDialog({title:pool?'编辑人才池':'新建人才池',body:`<div class="tc-form">${field('人才池名称 *','tc-pool-name',`<input class="input" id="tc-pool-name" maxlength="60" value="${e(pool?.name||'')}" placeholder="请输入人才池名称">`)}${field('来源盘点项目 *','tc-pool-source',`<select class="select" id="tc-pool-source" ${locked?'disabled':''}>${option('','请选择盘点项目',source)}${T.reviewProjects.map(project=>option(project.id,project.name,source)).join('')}</select>`)}${field('创建人 *','tc-pool-owner',`<input class="input" id="tc-pool-owner" maxlength="30" value="${e(pool?.owner||T.reviewProjects.find(p=>p.id===source)?.owner||'李文静')}">`)}${field('期望人数 *','tc-pool-expected',`<input class="input" id="tc-pool-expected" type="number" min="1" step="1" value="${e(pool?.expected||10)}">`)}${field('备注','tc-pool-purpose',`<textarea class="input" id="tc-pool-purpose" maxlength="500" placeholder="说明人才池用途">${e(pool?.purpose||'')}</textarea>`)}</div>`,confirmLabel:pool?'保存':'创建人才池',onConfirm(dialog){
      const val=id=>dialog.querySelector('#'+id).value.trim(),name=val('tc-pool-name'),sourceProject=val('tc-pool-source'),owner=val('tc-pool-owner'),expected=Number(val('tc-pool-expected'));
      const project=T.reviewProjects.find(p=>p.id===sourceProject);
      if(!name||!owner||!project){dialog.showError('请填写名称、创建人并选择来源盘点项目');return false;}
      if(!Number.isSafeInteger(expected)||expected<1){dialog.showError('期望人数须为正整数');return false;}
      if(data.pools.some(p=>p.id!==pool?.id&&p.name===name&&p.sourceProject===sourceProject)){dialog.showError('该盘点项目内已存在同名人才池');return false;}
      if(pool?.members.some(m=>!m.exited&&!project.people.some(p=>p.id===m.person))){dialog.showError('现有成员不全在该盘点项目内，请保留原记录并另建对应人才池');return false;}
      const record=pool||{id:T.uid('pool'),members:[],created:T.today()};
      Object.assign(record,{name,sourceProject,owner,expected,purpose:val('tc-pool-purpose')});
      if(!pool)data.pools.push(record);
      return onSave(record);
    }});
  }
  function build(data,pool,onSave) {
    const project=T.sourceProject(pool);
    if(!project){showToast('请先编辑人才池，关联来源盘点项目');return;}
    const chosen=new Set(),existing=new Set(T.activeMembers(pool).map(m=>m.person));
    const layers={ability:['高','中','低'],performance:['高','中','低'],placement:['核心人才','关键人才','重点提升','骨干人才','稳定贡献','关注发展','能力错配','待观察','重点关注']};
    const layerValue=(person,dimension)=>dimension==='ability'?(parseFloat(person.ability)>=80?'高':parseFloat(person.ability)>=60?'中':'低'):dimension==='performance'?person.performance:person.classification;
    const dialog=UI.openDialog({title:'组建人才池',body:`<div class="tc-form"><p>${e(pool.name)} · ${e(project.name)}</p>${field('姓名','tc-pool-person-name','<input class="input" id="tc-pool-person-name" type="search" placeholder="请输入姓名">')}<div class="tc-inline-fields">${field('盘点维度','tc-pool-dimension',`<select class="select" id="tc-pool-dimension">${option('ability','能力','ability')}${option('performance','绩效','ability')}${option('placement','宫格落位','ability')}</select>`)}${field('维度分层','tc-pool-layer','<select class="select" id="tc-pool-layer"></select>')}</div><div class="table-wrap"><table class="t"><thead><tr><th><input type="checkbox" id="tc-pool-all" aria-label="选择当前筛选人员"></th><th>姓名</th><th>部门</th><th>岗位</th><th>能力</th><th>绩效</th><th>当前落位</th></tr></thead><tbody id="tc-pool-candidates"></tbody></table></div><p id="tc-pool-selection" role="status"></p></div>`,confirmLabel:'确认组建',onConfirm(d){
      if(!chosen.size){d.showError('请至少选择一名尚未入池的盘点人员');return false;}
      T.addMembers(data,pool,[...chosen],'依据来源盘点项目结果组建');
      return onSave(pool);
    }});
    dialog.classList.add('tc-pool-build-dialog');
    const name=dialog.querySelector('#tc-pool-person-name'),dimension=dialog.querySelector('#tc-pool-dimension'),layer=dialog.querySelector('#tc-pool-layer');
    function updateLayers(){layer.innerHTML=option('','全部','')+layers[dimension.value].map(value=>option(value,value,'')).join('');}
    const visible=()=>project.people.filter(p=>p.name.includes(name.value.trim())&&(!layer.value||layerValue(p,dimension.value)===layer.value));
    function render() {
      const rows=visible(),available=rows.filter(p=>!existing.has(p.id)),all=dialog.querySelector('#tc-pool-all');
      dialog.querySelector('#tc-pool-candidates').innerHTML=rows.map(p=>`<tr><td><input type="checkbox" data-pool-person="${e(p.id)}" aria-label="选择${e(p.name)}" ${existing.has(p.id)?'checked disabled':chosen.has(p.id)?'checked':''}></td><td>${e(p.name)}</td><td>${e(p.department)}</td><td>${e(p.position)}</td><td>${e(p.ability)}</td><td>${e(p.performance)}</td><td>${e(p.classification)}</td></tr>`).join('')||'<tr><td colspan="7">暂无符合条件的盘点人员</td></tr>';
      all.disabled=!available.length;all.checked=!!available.length&&available.every(p=>chosen.has(p.id));all.indeterminate=!all.checked&&available.some(p=>chosen.has(p.id));
      dialog.querySelector('#tc-pool-selection').textContent=`已在池 ${existing.size} 人，本次选择 ${chosen.size} 人`;
    }
    name.addEventListener('input',render);
    dialog.addEventListener('change',event=>{
      if(event.target===dimension)updateLayers();
      else if(event.target.id==='tc-pool-all')visible().filter(p=>!existing.has(p.id)).forEach(p=>event.target.checked?chosen.add(p.id):chosen.delete(p.id));
      else if(event.target.dataset.poolPerson){const id=event.target.dataset.poolPerson;event.target.checked?chosen.add(id):chosen.delete(id);}
      render();
    });
    updateLayers();render();
  }
  window.TalentPools={form,build,sourceLink};
  document.addEventListener('DOMContentLoaded',()=>{
    const table=document.getElementById('talent-pool-table');if(!table)return;
    const projectId=new URLSearchParams(location.search).get('case')==='sales'?'review-sales':'review-annual';
    let data=T.read();
    function render(){table.tBodies[0].innerHTML=data.pools.filter(pool=>pool.sourceProject===projectId).map(pool=>`<tr data-pool-name="${e(pool.name)}"><td><a class="btn-text" href="talent-pool-detail.html?pool=${e(pool.id)}">${e(pool.name)}</a></td><td>${pool.expected}</td><td>${T.activeMembers(pool).length}</td><td class="ops"><button type="button" class="btn-text btn-sm" data-project-pool-build="${e(pool.id)}">组建</button><a class="btn-text btn-sm" href="talent-pool-detail.html?pool=${e(pool.id)}">查看</a></td></tr>`).join('')||'<tr><td colspan="4">暂无人才池</td></tr>';}
    function save(){try{T.write(data);}catch(error){data=T.read();showToast('保存失败，请检查浏览器存储空间后重试');return false;}render();return true;}
    document.querySelector('[data-project-pool-new]').addEventListener('click',()=>form(data,null,save,projectId));
    table.addEventListener('click',event=>{const button=event.target.closest('[data-project-pool-build]');if(button)build(data,data.pools.find(pool=>pool.id===button.dataset.projectPoolBuild),save);});
    render();
  });
})();
