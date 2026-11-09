(function () {
  const S = window.Standards, e = UI.escape, $ = selector => document.querySelector(selector);
  const storageKey = 'talent-learning-plan-design-v1';
  const params = new URLSearchParams(location.search), positionId = params.get('position');
  let data;
  try { data = S.read(); } catch (error) { $('#lp-workspace').innerHTML = '<p class="lp-empty">无法读取人才标准，请检查浏览器存储权限。</p>'; return; }
  const position = S.positions.find(item => item.id === positionId);
  const standard = S.associated(data, positionId).find(item => item.id === params.get('standard'));
  let draft, expanded = new Set(), dirty = false;
  const uid = () => 'group-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${name === 'plus' ? '<path d="M12 5v14M5 12h14"/>' : '<path d="m9 6 6 6-6 6"/>'}</svg>`;
  const button = (text, action, extra = '') => `<button type="button" class="btn-text" data-action="${action}" ${extra}>${text}</button>`;
  const capabilities = () => standard?.content.cap || [];
  const field = (label, name, value, multiline = false) => `<label>${label}${multiline ? `<textarea class="input" name="${name}">${e(value)}</textarea>` : `<input class="input" name="${name}" value="${e(value)}" maxlength="150">`}</label>`;

  function example() {
    if (standard.id !== 'std-sales') return {groups:[]};
    const activity = (kind, title, note = '') => ({kind, title, note});
    const groups = [
      {id:'sales-customer-interview',title:'客户理解与需求识别',capabilities:['客户洞察'],output:'围绕真实客户开展访谈，梳理业务问题与关键约束。',activities:[activity('课程','关键客户经营'),activity('在岗实践','访谈一位目标客户','准备访谈提纲，记录客户原话，梳理业务目标与关键约束。'),activity('复盘反馈','与主管复盘需求判断','说明判断依据，识别遗漏信息并修订需求记录。')]},
      {id:'sales-opportunity-insight',title:'方案设计与价值呈现',capabilities:['客户洞察','顾问式销售','协同推进'],output:'结合客户需求设计方案，并与相关团队协同完善。',activities:[activity('课程','解决方案呈现技巧'),activity('项目','重点客户突破行动'),activity('经验分享','分享一次需求到方案的转化案例','解释方案取舍，并记录售前、交付团队的反馈。')]},
      {id:'sales-negotiation',title:'商务谈判与成交',capabilities:['商务谈判'],output:'',activities:[activity('课程','商务谈判与成交'),activity('在岗实践','开展一次谈判情境演练','模拟客户异议，与同伴交换角色练习。')]}
    ];
    const names = new Set(capabilities().map(([name]) => name));
    groups.forEach(group => { group.capabilities = group.capabilities.filter(name => names.has(name)); });
    return {groups};
  }
  function changed() { dirty = true; $('#lp-save-state').textContent = '未保存'; }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')[JSON.stringify([positionId,standard.id])];
      if (saved) { const {tasks,...rest} = S.clone(saved); draft = {...rest,groups:rest.groups || tasks || []}; }
      else draft = example();
      $('#lp-save-state').textContent = saved ? '已保存' : '';
    } catch (error) {
      $('#lp-workspace').innerHTML = '<p class="lp-empty">无法读取方案，请检查浏览器存储权限。</p>';
      $('#lp-save').disabled = true; $('#lp-preview').disabled = true; $('#lp-ai-open').disabled = true; return;
    }
    expanded = new Set(draft.groups.slice(0,1).map(group => group.id));
    $('#lp-standard-link').href = 'standard-detail.html?id=' + encodeURIComponent(standard.id) + '#content-cap';
    $('#lp-standard-link').textContent = standard.name;
    $('#lp-back').href = 'standard-detail.html?id=' + encodeURIComponent(standard.id) + '#plan';
    render();
  }
  function activityHTML(item, index, group) {
    return `<li class="lp-activity" data-activity="${index}"><div class="lp-activity-head"><div class="lp-activity-title"><span class="lp-kind">${e(item.kind)}</span><strong>${e(item.title)}</strong></div><div class="lp-activity-ops"><button class="lp-move" data-action="up" aria-label="上移${e(item.title)}" ${index === 0 ? 'disabled' : ''}>↑</button><button class="lp-move" data-action="down" aria-label="下移${e(item.title)}" ${index === group.activities.length - 1 ? 'disabled' : ''}>↓</button>${button('编辑','edit-activity',`aria-label="编辑${e(item.title)}"`)}${button('移除','remove-activity',`aria-label="移除${e(item.title)}"`)}</div></div>${item.note ? `<p>${e(item.note)}</p>` : ''}</li>`;
  }
  function groupHTML(group, index) {
    const open = expanded.has(group.id);
    return `<li><article class="lp-task" data-group="${e(group.id)}"><div class="lp-task-head"><button class="lp-task-toggle" data-action="toggle" aria-expanded="${open}" aria-controls="body-${e(group.id)}"><span class="lp-group-number">${index + 1}</span>${icon('chevron')}<strong>${e(group.title)}</strong></button><div class="lp-task-actions"><button class="lp-move" data-action="group-up" aria-label="上移分组${e(group.title)}" ${index === 0 ? 'disabled' : ''}>↑</button><button class="lp-move" data-action="group-down" aria-label="下移分组${e(group.title)}" ${index === draft.groups.length - 1 ? 'disabled' : ''}>↓</button>${button('编辑','edit-group',`aria-label="编辑分组${e(group.title)}"`)}${button('删除','remove-group',`aria-label="删除分组${e(group.title)}"`)}</div></div><div class="lp-group-capabilities"><span>关联能力</span>${group.capabilities.length ? group.capabilities.map(name => `<b>${e(name)}</b>`).join('') : '<span>尚未选择</span>'}${button('选择能力项','select-capabilities',`aria-label="选择${e(group.title)}的能力项"`)}</div><div class="lp-task-body" id="body-${e(group.id)}" ${open ? '' : 'hidden'}>${group.output ? `<p class="lp-output">${e(group.output)}</p>` : ''}<div class="lp-route-heading"><h3>关联资源与活动</h3><span>${group.activities.length} 项</span></div>${group.activities.length ? `<ol class="lp-activities">${group.activities.map((item,i) => activityHTML(item,i,group)).join('')}</ol>` : '<p class="lp-group-empty">暂无资源</p>'}<div class="lp-actions">${button('＋ 关联课程 / 项目','add-resource')}${button('＋ 添加活动','add-activity')}</div></div>${open ? '' : `<div class="lp-task-summary">${group.activities.length} 项内容</div>`}</article></li>`;
  }
  function render() {
    const count = draft.groups.reduce((sum,group) => sum + group.activities.length,0);
    const groupCounts = new Map();
    draft.groups.forEach(group => {
      new Set(group.capabilities).forEach(name => groupCounts.set(name,(groupCounts.get(name) || 0) + 1));
    });
    const covered = capabilities().filter(([name]) => groupCounts.has(name)).length;
    $('#lp-workspace').innerHTML = `<section class="lp-main" aria-label="学习分组">${draft.groups.length ? `<div class="lp-section-head"><span>${draft.groups.length} 个分组 · ${count} 项内容</span></div>` : ''}${draft.groups.length ? `<ol class="lp-groups">${draft.groups.map(groupHTML).join('')}</ol>` : '<div class="lp-empty">暂无分组</div>'}${draft.groups.length ? `<button class="lp-add-group" data-action="add-group">${icon('plus')}添加分组</button>` : ''}</section><aside class="lp-sidebar"><section><h3>标准能力</h3><p>${covered} / ${capabilities().length} 项已关联</p><ul class="lp-coverage-list">${capabilities().map(([name,level]) => `<li><span class="lp-ability-name">${e(name)}${level ? ' · ' + e(level) : ''}</span><span>${groupCounts.has(name) ? groupCounts.get(name) + ' 个分组' : '未关联'}</span></li>`).join('') || '<li>当前标准尚未配置能力项。</li>'}</ul></section></aside>`;
  }
  function editGroup(group) {
    const isNew = !group;
    UI.openDialog({title:isNew ? '添加分组' : '编辑分组',body:`<div class="lp-form">${field('分组标题（必填）','title',group?.title || '')}${field('分组说明（选填）','output',group?.output || '',true)}</div>`,confirmLabel:isNew ? '创建分组' : '更新分组',onConfirm(dialog) {
      const title = dialog.querySelector('[name=title]').value.trim();
      if (!title) { dialog.showError('填写分组标题。'); return false; }
      const values = {title,output:dialog.querySelector('[name=output]').value.trim()};
      if (isNew) { group = {id:uid(),...values,capabilities:[],activities:[]}; draft.groups.push(group); expanded.add(group.id); }
      else Object.assign(group,values);
      changed(); render();
    }});
  }
  function selectCapabilities(group) {
    const items = capabilities().map(([name,level]) => ({id:name,label:name,description:level ? '标准要求 ' + level : ''}));
    group.capabilities.filter(name => !items.some(item => item.id === name)).forEach(name => items.push({id:name,label:name,description:'已不在当前标准中'}));
    UI.openPicker({title:'选择关联能力项',items,selectedIds:group.capabilities,onConfirm(ids) { group.capabilities = ids; changed(); render(); }});
  }
  function addResource(group) {
    const rows = resourceCatalog();
    const available = rows.filter(item => !group.activities.some(existing => existing.kind === item.kind && existing.title === item.title));
    UI.openPicker({title:'选择课程 / 项目',items:available.map((item,i) => ({id:String(i),label:item.title,description:item.kind + ' · 培训平台示例资源'})),onConfirm(ids) {
      ids.forEach(id => group.activities.push({...available[Number(id)],note:''}));
      if (ids.length) { expanded.add(group.id); changed(); render(); }
    }});
  }
  function resourceCatalog() {
    const seed = positionId === 'SA-201' ? window.STANDARD_POSITION_SEEDS.sales : positionId === 'RD-301' ? window.STANDARD_POSITION_SEEDS.algorithm : null;
    return [...(seed?.courseOptions || ['分布式系统设计','高并发架构实战','领导力基础','数据治理入门']).map(title => ({kind:'课程',title})),...(seed?.projectOptions || ['架构师加速营','技术管理训练营','跨部门攻坚项目']).map(title => ({kind:'项目',title}))];
  }
  function editActivity(group,index) {
    const item = group.activities[index], resource = item && ['课程','项目'].includes(item.kind);
    UI.openDialog({title:item ? '编辑学习活动' : '添加学习活动',body:`<div class="lp-form">${resource ? `<p class="lp-form-note">${e(item.kind)}：${e(item.title)}</p>` : `<label>活动方式<select class="select" name="kind">${['案例研读','在岗实践','复盘反馈','经验分享'].map(kind => `<option ${kind === item?.kind ? 'selected' : ''}>${kind}</option>`).join('')}</select></label>${field('活动名称（必填）','title',item?.title || '')}`}${field('活动安排','note',item?.note || '',true)}</div>`,confirmLabel:item ? '更新活动' : '添加活动',onConfirm(dialog) {
      const title = resource ? item.title : dialog.querySelector('[name=title]').value.trim();
      if (!title) { dialog.showError('填写活动名称。'); return false; }
      const values = {title,kind:resource ? item.kind : dialog.querySelector('[name=kind]').value,note:dialog.querySelector('[name=note]').value.trim()};
      if (item) Object.assign(item,values); else group.activities.push(values);
      expanded.add(group.id); changed(); render();
    }});
  }
  document.addEventListener('click',event => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton || !draft) return;
    const group = draft.groups.find(item => item.id === actionButton.closest('[data-group]')?.dataset.group);
    const activityNode = actionButton.closest('[data-activity]'), index = activityNode ? Number(activityNode.dataset.activity) : -1;
    switch (actionButton.dataset.action) {
      case 'add-group': editGroup(); break;
      case 'edit-group': editGroup(group); break;
      case 'select-capabilities': selectCapabilities(group); break;
      case 'toggle': expanded.has(group.id) ? expanded.delete(group.id) : expanded.add(group.id); render(); document.querySelector(`[data-group="${group.id}"] .lp-task-toggle`)?.focus(); break;
      case 'add-resource': addResource(group); break;
      case 'add-activity': editActivity(group,-1); break;
      case 'edit-activity': editActivity(group,index); break;
      case 'remove-group': UI.openDialog({title:'删除分组',body:`<p>删除“${e(group.title)}”及其中的资源关联与活动安排？来源标准和平台资源会保留。</p>`,confirmLabel:'删除分组',onConfirm() { draft.groups = draft.groups.filter(item => item.id !== group.id); changed(); render(); }}); break;
      case 'remove-activity': UI.openDialog({title:'移除学习内容',body:`<p>从“${e(group.title)}”中移除“${e(group.activities[index].title)}”？</p>`,confirmLabel:'移除内容',onConfirm() { group.activities.splice(index,1); changed(); render(); }}); break;
      case 'group-up': case 'group-down': {
        const current = draft.groups.indexOf(group), next = current + (actionButton.dataset.action === 'group-up' ? -1 : 1);
        if (next < 0 || next >= draft.groups.length) return;
        [draft.groups[current],draft.groups[next]] = [draft.groups[next],draft.groups[current]];
        changed(); render(); document.querySelector(`[data-group="${group.id}"] .lp-task-toggle`)?.focus(); break;
      }
      case 'up': case 'down': {
        const next = index + (actionButton.dataset.action === 'up' ? -1 : 1);
        if (next < 0 || next >= group.activities.length) return;
        [group.activities[index],group.activities[next]] = [group.activities[next],group.activities[index]];
        changed(); render(); document.querySelector(`[data-group="${group.id}"] [data-activity="${next}"] [data-action="edit-activity"]`)?.focus(); break;
      }
    }
  });
  $('#lp-save').onclick = () => {
    try {
      const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
      all[JSON.stringify([positionId,standard.id])] = draft;
      localStorage.setItem(storageKey,JSON.stringify(all));
      dirty = false; $('#lp-save-state').textContent = '已保存'; showToast('已保存');
    } catch (error) { showToast('保存失败，请检查浏览器存储空间与权限'); }
  };
  $('#lp-preview').onclick = () => {
    const dialog = UI.openDialog({title:'学习方案整体预览',body:`<p class="lp-preview-note">${e(position.name)} · ${e(standard.name)}</p><div class="lp-preview-content">${draft.groups.map((group,index) => `<section class="lp-preview-cap"><h3>${index + 1}. ${e(group.title)}</h3><p>关联能力：${e(group.capabilities.join('、') || '尚未选择')}</p>${group.output ? `<p>${e(group.output)}</p>` : ''}<div class="lp-preview-flow">${group.activities.map(item => `<span>${e(item.kind)} · ${e(item.title)}</span>`).join('') || '<p>尚未关联资源或活动</p>'}</div></section>`).join('') || '<p>尚未创建学习分组</p>'}</div>`,confirmLabel:'关闭',cancelLabel:''});
    dialog.classList.add('lp-preview-dialog');
  };
  if (!position || !standard) {
    $('#lp-workspace').innerHTML = '<div class="lp-empty">未找到当前岗位关联的人才标准，请从标准的学习方案入口重新进入。</div>';
    $('#lp-save').disabled = true; $('#lp-preview').disabled = true; $('#lp-ai-open').disabled = true; $('#lp-standard-link').hidden = true;
    document.querySelector('[data-action=add-group]').disabled = true;
    return;
  }
  $('#lp-position').textContent = position.name;
  window.addEventListener('beforeunload',event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  load();
  window.LearningPlanEditor = {
    context:() => ({standard:S.clone(standard),position:S.clone(position)}),
    catalog:resourceCatalog,
    append(groups) {
      const allowed = new Set(capabilities().map(([name]) => name));
      if (!draft || !groups.length || groups.some(group => !group.title.trim() || group.capabilities.some(name => !allowed.has(name)))) return false;
      const added = S.clone(groups).map(group => ({id:uid(),title:group.title,output:group.output || '',capabilities:group.capabilities,activities:group.activities}));
      draft.groups.push(...added); added.forEach(group => expanded.add(group.id)); changed(); render(); return true;
    }
  };
})();
