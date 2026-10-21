const reqs = [
  ['duty','职责任务','解决方案销售与商务推进'],['exp','经历经验','复杂项目销售经验'],
  ['insight','能力要求','客户洞察 L4'],['consult','能力要求','顾问式销售 L4'],
  ['negotiate','能力要求','商务谈判 L4'],['power','动力要求','成就导向'],
  ['potential','潜力要求','复杂决策']
].map(([id,group,name])=>({id,group,name}));
const seed = [
  {id:1,title:'能力基线诊断',stage:'培养前',goal:'识别客户洞察、顾问式销售和商务谈判的当前水平。',links:['insight','consult','negotiate'],tasks:['前测｜销售能力认证'],evidence:'形成可追溯的能力基线，作为后续任务调整依据。'},
  {id:2,title:'客户洞察与解决方案设计',stage:'核心培养',goal:'从客户问题出发，形成可陈述、可评审的解决方案。',links:['duty','insight','consult'],tasks:['课程｜顾问式销售实战','岗位实践｜重点客户解决方案演练','导师辅导｜方案呈现点评'],evidence:'提交客户需求分析和方案汇报成果，由导师审核通过。'},
  {id:3,title:'商务谈判与项目推进',stage:'实战应用',goal:'在真实商机中完成谈判准备、关键节点推进与跨团队协同。',links:['duty','exp','negotiate'],tasks:['课程｜商务谈判与成交','培训项目｜重点客户突破行动'],evidence:'提交谈判复盘与项目阶段成果，由直属上级确认。'},
  {id:4,title:'成果验证与后测',stage:'结果确认',goal:'结合项目成果与后测结果，判断是否达到销售经理要求。',links:['insight','consult','negotiate','exp'],tasks:['后测｜销售能力认证','岗位实践｜重点客户项目成果评审'],evidence:'后测达到目标要求，且项目成果通过审核。'}
];
const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='development-solution-concept-v3';
let saved=null;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null')}catch(_){}
let modules=Array.isArray(saved?.modules)?saved.modules:structuredClone(seed);
let exclusions=Array.isArray(saved?.exclusions)?saved.exclusions:[];
let openId=modules[0]?.id??null,editingId=null,preferredReq=null;
if(typeof saved?.goal==='string')$('overall-goal').value=saved.goal;
const linked=id=>modules.filter(m=>m.links.includes(id));
const changed=()=>$('save-status').textContent='有未保存的修改';

function renderModules(){
  $('module-list').innerHTML=modules.length?modules.map((m,i)=>{
    const expanded=openId===m.id,names=m.links.map(id=>reqs.find(r=>r.id===id)?.name).filter(Boolean);
    return `<article class="module-item"><button type="button" class="module-summary" data-open="${m.id}" aria-expanded="${expanded}" aria-controls="module-detail-${m.id}"><span class="module-number">${i+1}</span><span class="module-main"><span class="module-title-line"><strong>${safe(m.title)}</strong><em>${safe(m.stage)}</em></span><p>${safe(m.goal)}</p><span class="module-meta"><span>关联标准 ${names.length} 项</span><span>培养任务 ${m.tasks.length} 项</span></span></span><span class="module-chevron" aria-hidden="true">${expanded?'⌃':'⌄'}</span></button><div id="module-detail-${m.id}" class="module-detail" ${expanded?'':'hidden'}><div class="module-detail-grid"><div><h3>对应标准要求</h3><p>${safe(names.join('、')||'尚未关联')}</p></div><div><h3>达成条件</h3><p>${safe(m.evidence||'尚未设置')}</p></div></div><div class="module-detail-grid"><div><h3>培养任务</h3>${m.tasks.length?`<ul>${m.tasks.map(t=>`<li>${safe(t.replace('｜',' · '))}</li>`).join('')}</ul>`:'<p>尚未设置</p>'}</div><div class="module-detail-actions"><button type="button" class="plain-action" data-edit="${m.id}">编辑模块</button><button type="button" class="plain-action danger" data-delete="${m.id}">删除</button></div></div></div></article>`
  }).join(''):'<div class="empty-modules">还没有培养模块。添加模块后，可关联标准要求并安排任务。</div>';
}
function renderCoverage(){
  const pending=reqs.filter(r=>!linked(r.id).length&&!exclusions.includes(r.id));
  $('coverage-summary').textContent=`已处理 ${reqs.length-pending.length} / ${reqs.length} 项`;
  $('coverage-body').innerHTML=reqs.map(r=>{
    const ms=linked(r.id),excluded=exclusions.includes(r.id);
    const state=ms.length?'<span class="linked">已编排</span>':excluded?'<span class="basis">选人依据</span>':'<span class="pending">待处理</span>';
    const names=ms.length?ms.map(m=>m.title).join('、'):excluded?'不进入培养任务':'尚未关联模块';
    const action=ms.length?`<button type="button" class="plain-action" data-edit="${ms[0].id}">查看模块</button>`:excluded?`<button type="button" class="plain-action" data-restore="${r.id}">改为培养要求</button>`:`<button type="button" class="plain-action" data-link="${r.id}">关联模块</button><button type="button" class="plain-action secondary-action" data-exclude="${r.id}">设为选人依据</button>`;
    return `<tr><td><strong>${safe(r.name)}</strong><span class="coverage-group">${safe(r.group)}</span></td><td>${state}</td><td>${safe(names)}</td><td class="align-right">${action}</td></tr>`
  }).join('');
}
function render(){renderModules();renderCoverage()}
function editor(id,requirement=null){
  editingId=id;preferredReq=requirement;const m=modules.find(x=>x.id===id);
  $('dialog-title').textContent=m?'编辑培养模块':'添加培养模块';
  $('module-name').value=m?.title||'';$('module-stage').value=m?.stage||'核心培养';
  $('module-goal').value=m?.goal||'';$('module-tasks').value=m?.tasks.join('\n')||'';
  $('module-evidence').value=m?.evidence||'';
  $('requirement-options').innerHTML=reqs.map(r=>`<label><input type="checkbox" value="${r.id}" ${(m?.links.includes(r.id)||r.id===requirement)?'checked':''}><span>${safe(r.name)}</span></label>`).join('');
  $('req-error').hidden=true;$('module-dialog').showModal();$('module-name').focus();
}
$('module-list').addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]'),open=e.target.closest('[data-open]');
  if(edit)return editor(Number(edit.dataset.edit));
  if(del){let id=Number(del.dataset.delete);modules=modules.filter(m=>m.id!==id);if(openId===id)openId=modules[0]?.id??null;render();changed();return}
  if(open){openId=openId===Number(open.dataset.open)?null:Number(open.dataset.open);renderModules()}
});
$('coverage-body').addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit]'),link=e.target.closest('[data-link]'),exclude=e.target.closest('[data-exclude]'),restore=e.target.closest('[data-restore]');
  if(edit)return editor(Number(edit.dataset.edit));if(link)return editor(null,link.dataset.link);
  if(exclude){exclusions.push(exclude.dataset.exclude);renderCoverage();changed()}
  if(restore){exclusions=exclusions.filter(id=>id!==restore.dataset.restore);renderCoverage();changed()}
});
$('add-module').onclick=()=>editor(null);
$('close-dialog').onclick=()=>$('module-dialog').close();
$('cancel-dialog').onclick=()=>$('module-dialog').close();
$('module-form').addEventListener('submit',e=>{
  e.preventDefault();const links=[...$('requirement-options').querySelectorAll('input:checked')].map(x=>x.value);
  if(!links.length){$('req-error').hidden=false;$('requirement-options input').focus();return}
  const m={id:editingId??Math.max(0,...modules.map(x=>x.id))+1,title:$('module-name').value.trim(),stage:$('module-stage').value,goal:$('module-goal').value.trim(),links,tasks:$('module-tasks').value.split('\n').map(x=>x.trim()).filter(Boolean),evidence:$('module-evidence').value.trim()};
  if(!m.title||!m.goal)return;
  if(editingId===null)modules.push(m);else modules[modules.findIndex(x=>x.id===editingId)]=m;
  if(preferredReq)exclusions=exclusions.filter(id=>id!==preferredReq);
  openId=m.id;$('module-dialog').close();render();changed();
});
$('overall-goal').addEventListener('input',changed);
$('save-plan').onclick=()=>{localStorage.setItem(storageKey,JSON.stringify({modules,exclusions,goal:$('overall-goal').value}));$('save-status').textContent='草稿已保存在此浏览器中'};
render();
