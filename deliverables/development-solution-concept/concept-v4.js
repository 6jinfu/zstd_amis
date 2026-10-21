const requirements = [
  ['duty', '职责任务', '解决方案销售与商务推进'],
  ['exp', '经历经验', '复杂项目销售经验'],
  ['insight', '能力要求', '客户洞察 L4'],
  ['consult', '能力要求', '顾问式销售 L4'],
  ['negotiate', '能力要求', '商务谈判 L4'],
  ['power', '动力要求', '成就导向'],
  ['potential', '潜力要求', '复杂决策']
].map(([id, group, name]) => ({ id, group, name }));

const seedModules = [
  { id: 1, title: '能力基线诊断', stage: '培养前', goal: '识别客户洞察、顾问式销售和商务谈判的当前水平。', links: ['insight', 'consult', 'negotiate'], tasks: ['前测｜销售能力认证'], evidence: '形成能力基线，作为后续任务调整依据。' },
  { id: 2, title: '客户洞察与解决方案设计', stage: '核心培养', goal: '从客户问题出发，形成可陈述、可评审的解决方案。', links: ['duty', 'insight', 'consult'], tasks: ['课程｜顾问式销售实战', '岗位实践｜重点客户解决方案演练', '导师辅导｜方案呈现点评'], evidence: '提交客户需求分析和方案汇报成果，由导师审核通过。' },
  { id: 3, title: '商务谈判与项目推进', stage: '实战应用', goal: '在真实商机中完成谈判准备、关键节点推进与跨团队协同。', links: ['duty', 'exp', 'negotiate'], tasks: ['课程｜商务谈判与成交', '培训项目｜重点客户突破行动'], evidence: '提交谈判复盘与项目阶段成果，由直属上级确认。' },
  { id: 4, title: '成果验证与后测', stage: '结果确认', goal: '结合项目成果与后测结果，判断是否达到销售经理要求。', links: ['insight', 'consult', 'negotiate', 'exp'], tasks: ['后测｜销售能力认证', '岗位实践｜重点客户项目成果评审'], evidence: '后测达到目标要求，且项目成果通过审核。' }
];
const seedGoal = '能够独立识别重点客户需求，组织解决方案销售，推进复杂商机并完成商务谈判；以项目成果和能力后测验证达成情况。';
const $ = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const storageKey = 'development-solution-concept-v4';
let saved = null;
try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) {}
let modules = Array.isArray(saved?.modules) ? saved.modules : structuredClone(seedModules);
let exclusions = Array.isArray(saved?.exclusions) ? saved.exclusions : [];
let goal = typeof saved?.goal === 'string' ? saved.goal : seedGoal;
let openId = modules.find(m => m.id === 2)?.id ?? modules[0]?.id ?? null;
let editingId = null;
let preferredRequirement = null;
let showDone = false;

function markChanged() { $('save-status').textContent = '有未保存的修改'; }
function linked(id) { return modules.filter(module => module.links.includes(id)); }
function renderGoal() { $('goal-display').textContent = goal; $('overall-goal').value = goal; }
function taskMarkup(task) {
  const [type, ...parts] = task.split('｜');
  return `<li><span class="task-type">${safe(parts.length ? type : '任务')}</span><span>${safe(parts.length ? parts.join('｜') : type)}</span></li>`;
}
function renderModules() {
  $('module-count').textContent = `${modules.length} 个模块`;
  $('module-list').innerHTML = modules.length ? modules.map((module, index) => {
    const open = module.id === openId;
    const names = module.links.map(id => requirements.find(item => item.id === id)?.name).filter(Boolean);
    return `<article class="module-item ${open ? 'is-open' : ''}">
      <button type="button" class="module-summary" data-open="${module.id}" aria-expanded="${open}" aria-controls="detail-${module.id}">
        <span class="module-index">${String(index + 1).padStart(2, '0')}</span>
        <span><span class="module-heading-line"><strong class="module-title">${safe(module.title)}</strong><span class="module-stage">${safe(module.stage)}</span></span><span class="module-summary-text">${safe(module.goal)}</span><span class="module-summary-meta">${module.tasks.length} 项任务　/　${names.length} 项标准要求</span></span>
        <span class="module-chevron" aria-hidden="true">${open ? '⌃' : '⌄'}</span>
      </button>
      <div class="module-detail" id="detail-${module.id}" ${open ? '' : 'hidden'}>
        <div class="detail-rule"></div>
        <div class="module-detail-section"><h3>关联标准要求</h3><p>${safe(names.join('、') || '尚未关联')}</p></div>
        <div class="module-detail-section"><h3>培养任务</h3>${module.tasks.length ? `<ul class="task-list">${module.tasks.map(taskMarkup).join('')}</ul>` : '<p>尚未设置任务</p>'}</div>
        <div class="detail-footer"><div class="module-detail-section"><h3>达成条件</h3><p>${safe(module.evidence || '尚未设置')}</p></div><div class="detail-actions"><button type="button" data-edit="${module.id}">编辑模块</button></div></div>
      </div>
    </article>`;
  }).join('') : '<div class="empty-modules">尚未添加培养模块。先设置一个培养目标和任务。</div>';
}
function requirementRow(item, state) {
  const matched = linked(item.id);
  const names = matched.map(module => module.title).join('、');
  const action = state === 'pending' ? `<button type="button" data-link="${item.id}">关联模块</button>` : state === 'basis' ? `<button type="button" data-restore="${item.id}">调整</button>` : `<button type="button" data-open-module="${matched[0].id}">查看</button>`;
  const detail = state === 'pending' ? `<button type="button" class="quiet-action" data-exclude="${item.id}">设为选人依据</button>` : state === 'basis' ? '选人依据' : names;
  return `<div class="requirement-row ${state === 'pending' ? 'pending' : 'done'}"><div class="requirement-row-name"><strong>${safe(item.name)}</strong>${action}</div><small>${safe(item.group)} · ${state === 'pending' ? '尚未处理' : safe(detail)}</small>${state === 'pending' ? detail : ''}</div>`;
}
function renderRequirements() {
  const pending = requirements.filter(item => !linked(item.id).length && !exclusions.includes(item.id));
  const done = requirements.filter(item => !pending.includes(item));
  $('coverage-summary').textContent = `${done.length} / ${requirements.length} 已处理`;
  $('requirement-list').innerHTML = `<div class="requirement-group"><div class="group-title"><span>待确认</span><strong>${pending.length} 项</strong></div>${pending.length ? pending.map(item => requirementRow(item, 'pending')).join('') : '<p class="no-pending">标准要求均已处理</p>'}</div><div class="requirement-group done-group"><button type="button" class="done-toggle" data-toggle-done aria-expanded="${showDone}"><span>已处理 ${done.length} 项</span><span aria-hidden="true">${showDone ? '⌃' : '⌄'}</span></button><div ${showDone ? '' : 'hidden'}>${done.map(item => requirementRow(item, exclusions.includes(item.id) ? 'basis' : 'linked')).join('')}</div></div>`;
}
function render() { renderGoal(); renderModules(); renderRequirements(); }
function openEditor(id, requirementId = null) {
  editingId = id; preferredRequirement = requirementId;
  const module = modules.find(item => item.id === id);
  $('module-dialog-title').textContent = module ? '编辑培养模块' : '添加培养模块';
  $('delete-module').hidden = !module;
  $('module-name').value = module?.title || '';
  $('module-stage').value = module?.stage || '核心培养';
  $('module-goal').value = module?.goal || '';
  $('module-tasks').value = module?.tasks.join('\n') || '';
  $('module-evidence').value = module?.evidence || '';
  $('requirement-options').innerHTML = requirements.map(item => `<label><input type="checkbox" value="${item.id}" ${module?.links.includes(item.id) || item.id === requirementId ? 'checked' : ''}><span>${safe(item.name)}</span></label>`).join('');
  $('req-error').hidden = true;
  $('module-dialog').showModal();
  $('module-name').focus();
}
$('module-list').addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  const open = event.target.closest('[data-open]');
  if (edit) return openEditor(Number(edit.dataset.edit));
  if (open) { openId = openId === Number(open.dataset.open) ? null : Number(open.dataset.open); renderModules(); }
});
$('requirement-list').addEventListener('click', event => {
  const toggle = event.target.closest('[data-toggle-done]');
  const link = event.target.closest('[data-link]');
  const exclude = event.target.closest('[data-exclude]');
  const restore = event.target.closest('[data-restore]');
  const open = event.target.closest('[data-open-module]');
  if (toggle) { showDone = !showDone; renderRequirements(); return; }
  if (link) return openEditor(null, link.dataset.link);
  if (exclude) { exclusions.push(exclude.dataset.exclude); renderRequirements(); markChanged(); return; }
  if (restore) { exclusions = exclusions.filter(id => id !== restore.dataset.restore); renderRequirements(); markChanged(); return; }
  if (open) { openId = Number(open.dataset.openModule); renderModules(); $('module-list').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
$('edit-goal').onclick = () => { $('overall-goal').value = goal; $('goal-dialog').showModal(); $('overall-goal').focus(); };
$('goal-form').addEventListener('submit', event => { event.preventDefault(); goal = $('overall-goal').value.trim(); $('goal-dialog').close(); renderGoal(); markChanged(); });
$('add-module').onclick = () => openEditor(null);
$('delete-module').onclick = () => {
  modules = modules.filter(module => module.id !== editingId);
  if (openId === editingId) openId = modules[0]?.id ?? null;
  $('module-dialog').close(); render(); markChanged();
};
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('module-form').addEventListener('submit', event => {
  event.preventDefault();
  const links = [...$('requirement-options').querySelectorAll('input:checked')].map(input => input.value);
  if (!links.length) { $('req-error').hidden = false; $('requirement-options input').focus(); return; }
  const module = { id: editingId ?? Math.max(0, ...modules.map(item => item.id)) + 1, title: $('module-name').value.trim(), stage: $('module-stage').value, goal: $('module-goal').value.trim(), links, tasks: $('module-tasks').value.split('\n').map(line => line.trim()).filter(Boolean), evidence: $('module-evidence').value.trim() };
  if (!module.title || !module.goal) return;
  if (editingId === null) modules.push(module); else modules[modules.findIndex(item => item.id === editingId)] = module;
  if (preferredRequirement) exclusions = exclusions.filter(id => id !== preferredRequirement);
  openId = module.id;
  $('module-dialog').close(); render(); markChanged();
});
$('save-plan').onclick = () => { localStorage.setItem(storageKey, JSON.stringify({ modules, exclusions, goal })); $('save-status').textContent = '草稿已保存在此浏览器'; };
render();
