(function () {
  const T = window.TalentSettings, e = UI.escape;
  const tree = document.querySelector('#level-tree'), query = document.querySelector('#level-search');
  let data = T.read(), selected = '', expanded = new Set(data.sequences.map(s => s.id));
  const uid = prefix => UI.uid ? UI.uid(prefix) : prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const icon = leaf => leaf ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2h7l4 4v12H5z"/><path d="M12 2v5h4"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 5h6l2 2h8l-2 10H2z"/><path d="M2 5V3h6l2 2h7v2"/></svg>';
  function save(message) {
    try { T.write(data); if (message) showToast(message); return true; }
    catch (error) { data = T.read(); showToast('保存失败，请检查浏览器存储空间'); return false; }
  }
  function actions(s, level) {
    const id = level?.id || s.id;
    return `<span class="level-tree-actions"><button type="button" class="btn-text" data-add="${e(s.id)}">${level ? '新增同级' : '新增职级'}</button><button type="button" class="btn-text" data-edit="${e(id)}">编辑</button><button type="button" class="btn-text" data-delete="${e(id)}">删除</button></span>`;
  }
  function renderTree() {
    const term = query.value.trim().toLowerCase();
    tree.innerHTML = data.sequences.map(s => {
      const sequenceMatch = s.name.toLowerCase().includes(term);
      const levels = s.levels.filter(l => sequenceMatch || (l.name + l.code).toLowerCase().includes(term)).sort((a,b) => b.rank - a.rank);
      if (!sequenceMatch && !levels.length) return '';
      const open = expanded.has(s.id) || !!term;
      return `<div class="level-tree-group"><div class="level-tree-row${selected === s.id ? ' is-selected' : ''}"><button class="level-tree-toggle" type="button" data-toggle="${e(s.id)}" aria-expanded="${open}" aria-label="${open?'收起':'展开'}${e(s.name)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="${open?'m4 6 4 4 4-4':'m6 4 4 4-4 4'}"/></svg></button><button class="level-tree-label" type="button" data-select="${e(s.id)}" aria-pressed="${selected===s.id}">${icon(false)}<span>${e(s.name)}</span></button>${actions(s)}</div>${open ? `<div class="level-tree-children">${levels.map(l => `<div class="level-tree-row${selected===l.id?' is-selected':''}"><button class="level-tree-label" type="button" data-select="${e(l.id)}" aria-pressed="${selected===l.id}">${icon(true)}<span>${e(l.name)}</span><span class="level-tree-code">${e(l.code)}</span><span class="level-tree-rank">等级序 ${l.rank}</span></button>${actions(s,l)}</div>`).join('') || '<p class="level-tree-empty">暂无职级</p>'}</div>` : ''}</div>`;
    }).join('') || '<div class="empty-state">没有匹配的序列或职级</div>';
  }
  function editSequence(sequence) {
    const dialog = UI.openDialog({title:sequence?'编辑序列':'新增序列',body:`<div class="field"><label for="sequence-name">序列名称</label><input class="input" id="sequence-name" maxlength="40" value="${e(sequence?.name||'')}"></div>`,onConfirm(d) {
      const name=d.querySelector('input').value.trim();
      if (!name) { d.showError('请输入序列名称'); return false; }
      if (data.sequences.some(s=>s!==sequence&&s.name===name)) { d.showError('序列名称已存在'); return false; }
      if (sequence) sequence.name=name;
      else { sequence={id:uid('node'),name,levels:[]};data.sequences.push(sequence); }
      selected=sequence.id;expanded.add(sequence.id);
      if (!save('序列已保存')) return false;
      renderTree();
    }});
    dialog.querySelector('input').focus();
    dialog.querySelector('input').onkeydown = event => { if(event.key==='Enter') {event.preventDefault();dialog.querySelector('[data-confirm]').click();} };
  }
  function editLevel(sequence, level) {
    const dialog=UI.openDialog({title:level?'编辑职级':'新增职级',body:`<div class="field"><label for="level-parent">所属序列</label><select class="select" id="level-parent">${data.sequences.map(s=>`<option value="${e(s.id)}" ${s===sequence?'selected':''}>${e(s.name)}</option>`).join('')}</select></div><div class="field"><label for="level-name">职级名称</label><input class="input" id="level-name" maxlength="40" value="${e(level?.name||'')}"></div><div class="field"><label for="level-code">职级编码</label><input class="input" id="level-code" maxlength="20" value="${e(level?.code||'')}"></div><div class="field"><label for="level-rank">等级序</label><input class="input" type="number" id="level-rank" min="1" max="99" step="1" value="${level?.rank||''}"></div>`,onConfirm(d) {
      const target=data.sequences.find(s=>s.id===d.querySelector('#level-parent').value);
      const name=d.querySelector('#level-name').value.trim(),code=d.querySelector('#level-code').value.trim(),rank=Number(d.querySelector('#level-rank').value);
      if(!name||!code||!Number.isInteger(rank)||rank<1||rank>99){d.showError('请填写名称、编码及 1–99 的整数等级序');return false;}
      if(target.levels.some(l=>l!==level&&(l.code.toLowerCase()===code.toLowerCase()||l.rank===rank))){d.showError('同一序列内，职级编码和等级序不能重复');return false;}
      const next={...level,id:level?.id||uid('node'),name,code,rank};
      if(level)sequence.levels=sequence.levels.filter(l=>l.id!==level.id);
      target.levels.push(next);selected=next.id;expanded.add(target.id);
      if(!save('职级已保存'))return false;
      renderTree();
    }});
    dialog.querySelector('#level-name').focus();
    dialog.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();dialog.querySelector('[data-confirm]').click();}});
  }
  document.querySelector('#add-sequence').onclick=()=>editSequence();
  query.oninput=renderTree;
  tree.onclick=event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.toggle){const id=button.dataset.toggle;expanded.has(id)?expanded.delete(id):expanded.add(id);renderTree();return;}
    if(button.dataset.select){selected=button.dataset.select;renderTree();return;}
    const id=button.dataset.add||button.dataset.edit||button.dataset.delete;
    const sequence=data.sequences.find(s=>s.id===id||s.levels.some(l=>l.id===id));if(!sequence)return;
    const level=sequence.levels.find(l=>l.id===id);
    if(button.dataset.add){editLevel(sequence);return;}
    if(button.dataset.edit){level?editLevel(sequence,level):editSequence(sequence);return;}
    if(button.dataset.delete){
      if(!level&&sequence.levels.length){showToast('请先移除序列下的职级，再删除序列');return;}
      if(level?.positions?.length){showToast('该职级仍关联岗位，请先处理关联关系');return;}
      UI.openDialog({title:'删除'+(level?'职级':'序列'),body:`<p>确认删除“${e(level?.name||sequence.name)}”？</p>`,confirmLabel:'删除',onConfirm(){
        if(level)sequence.levels=sequence.levels.filter(l=>l.id!==id);else data.sequences=data.sequences.filter(s=>s.id!==id);
        if(!save('已删除'))return false;selected='';renderTree();
      }});
    }
  };

  /* 人才标准模板管理 */
  const templateList = document.querySelector('#template-list');
  function renderTemplates() {
    if (!templateList) return;
    templateList.innerHTML = data.templates.map(tpl => {
      const dims = tpl.dimensions.map(k => `<span class="settings-dim-chip">${e(T.dimensions[k] || k)}</span>`).join('');
      const isDefault = !!tpl.isDefault;
      const active = tpl.enabled !== false;
      return `<tr>
        <td><div class="settings-tpl-name"><strong>${e(tpl.name)}</strong>${isDefault ? '<span class="tag tag-primary">默认</span>' : ''}</div></td>
        <td><div class="settings-dim-chips">${dims}</div></td>
        <td class="muted">${e(tpl.description || '—')}</td>
        <td><span class="tag ${active ? 'tag-success' : ''}">${active ? '已启用' : '已停用'}</span></td>
        <td class="ops" style="justify-content:flex-end">
          ${!isDefault && active ? `<button type="button" class="btn-text" data-tpl-default="${e(tpl.id)}">设为默认</button>` : ''}
          <button type="button" class="btn-text" data-tpl-edit="${e(tpl.id)}">编辑</button>
          ${!isDefault ? `<button type="button" class="btn-text" data-tpl-toggle="${e(tpl.id)}">${active ? '停用' : '启用'}</button>` : ''}
          ${!isDefault ? `<button type="button" class="btn-text danger" data-tpl-delete="${e(tpl.id)}">删除</button>` : ''}
        </td>
      </tr>`;
    }).join('');
  }
  function editTemplate(tpl) {
    const selectedDims = new Set(tpl ? tpl.dimensions : Object.keys(T.dimensions));
    const dialog = UI.openDialog({
      title: tpl ? '编辑人才标准模板' : '新增人才标准模板',
      confirmLabel: tpl ? '保存模板' : '创建模板',
      body: `<div class="settings-tpl-form">
        <div class="field"><label for="tpl-name">模板名称 <span class="danger">*</span></label><input class="input" id="tpl-name" maxlength="20" placeholder="例如：高潜盘点标准" value="${e(tpl?.name || '')}"></div>
        <div class="field"><label for="tpl-desc">适用说明</label><input class="input" id="tpl-desc" maxlength="100" placeholder="选填，说明适用场景" value="${e(tpl?.description || '')}"></div>
        <fieldset class="settings-tpl-dims">
          <legend>包含维度 <span class="danger">*</span>（至少勾选 1 项，自由组合）</legend>
          <div class="settings-tpl-dim-grid">
            ${Object.entries(T.dimensions).map(([k, label]) => `<label class="settings-tpl-dim-option"><input type="checkbox" name="tpl-dim" value="${k}" ${selectedDims.has(k) ? 'checked' : ''}><span>${e(label)}</span></label>`).join('')}
          </div>
        </fieldset>
        ${tpl?.isDefault ? '' : `<label class="settings-tpl-default-check"><input type="checkbox" id="tpl-default"><span>设为新建人才标准时的默认模板</span></label>`}
        <p class="text-sm muted">保存后仅对后续新建的人才标准生效，已有标准保持原维度与数据不变。</p>
      </div>`,
      onConfirm(d) {
        const name = d.querySelector('#tpl-name').value.trim();
        const description = d.querySelector('#tpl-desc').value.trim();
        const dims = [...d.querySelectorAll('input[name="tpl-dim"]:checked')].map(i => i.value);
        const makeDefault = !!d.querySelector('#tpl-default')?.checked;
        if (!name || name.length > 20) { d.showError('请输入模板名称（最多 20 个字符）'); return false; }
        if (data.templates.some(item => item !== tpl && item.name === name)) { d.showError('模板名称已存在'); return false; }
        if (!dims.length) { d.showError('请至少勾选 1 个包含维度'); return false; }
        if (makeDefault) data.templates.forEach(item => { item.isDefault = false; });
        if (tpl) {
          tpl.name = name; tpl.description = description; tpl.dimensions = dims;
          if (makeDefault) { tpl.isDefault = true; tpl.enabled = true; }
        } else {
          data.templates.push({ id: uid('tpl'), name, description, dimensions: dims, isDefault: makeDefault, enabled: true });
        }
        if (!save('人才标准模板已保存')) return false;
        renderTemplates();
      }
    });
    dialog.querySelector('#tpl-name').focus();
  }
  document.querySelector('#add-template')?.addEventListener('click', () => editTemplate());
  templateList?.addEventListener('click', event => {
    const btn = event.target.closest('button'); if (!btn) return;
    const id = btn.dataset.tplDefault || btn.dataset.tplEdit || btn.dataset.tplToggle || btn.dataset.tplDelete;
    const tpl = data.templates.find(item => item.id === id); if (!tpl) return;
    if (btn.dataset.tplDefault) {
      data.templates.forEach(item => { item.isDefault = item.id === tpl.id; });
      tpl.enabled = true;
      if (save(`已将“${tpl.name}”设为默认模板`)) renderTemplates();
      return;
    }
    if (btn.dataset.tplEdit) { editTemplate(tpl); return; }
    if (btn.dataset.tplToggle) {
      if (tpl.isDefault) { showToast('默认模板不能停用'); return; }
      tpl.enabled = tpl.enabled === false;
      if (save(tpl.enabled ? '模板已启用' : '模板已停用')) renderTemplates();
      return;
    }
    if (btn.dataset.tplDelete) {
      if (tpl.isDefault) { showToast('默认模板不能删除'); return; }
      UI.openDialog({
        title: '删除人才标准模板',
        body: `<p>确认删除模板“${e(tpl.name)}”？已使用该模板创建的人才标准不受影响。</p>`,
        confirmLabel: '删除',
        onConfirm() {
          data.templates = data.templates.filter(item => item.id !== tpl.id);
          if (!save('模板已删除')) return false;
          renderTemplates();
        }
      });
    }
  });
  renderTemplates();

  /* 能力指标维度自定义 */
  const abilityForm = document.querySelector('#ability-dimensions-form'), abilityFields = document.querySelector('#ability-dimensions-fields');
  function renderAbilityDimensions() {
    abilityFields.innerHTML = data.abilityDimensions.map((name, index) => `<div class="field"><label for="ability-dimension-${index}">维度 ${index+1}</label><input class="input" id="ability-dimension-${index}" value="${e(name)}" maxlength="20" required></div>`).join('');
  }
  renderAbilityDimensions();
  abilityForm.onsubmit = event => {
    event.preventDefault();
    const names = [...abilityFields.querySelectorAll('input')].map(input => input.value.trim()), error = document.querySelector('#ability-dimensions-error');
    if (names.some(name => !name || name.length > 20)) { error.textContent = '每个维度名称必填，最多 20 个字符'; return; }
    if (new Set(names).size !== 3) { error.textContent = '维度名称不能重复'; return; }
    data.abilityDimensions = names;
    if (save('能力指标维度自定义已保存')) { error.textContent = ''; document.querySelector('#ability-dimensions-state').textContent = '已保存'; }
  };
  abilityForm.onreset = () => { setTimeout(() => { data = T.read(); renderAbilityDimensions(); document.querySelector('#ability-dimensions-error').textContent = ''; document.querySelector('#ability-dimensions-state').textContent = ''; }); };
  abilityForm.oninput = () => { document.querySelector('#ability-dimensions-error').textContent = ''; document.querySelector('#ability-dimensions-state').textContent = '有未保存的修改'; };

  /* 学员端功能设置持久化 */
  const learnerState = document.getElementById('learner-save-state');
  let learnerTimer = 0;
  document.querySelectorAll('[data-learner-feature]').forEach(input => {
    const featureKey = input.dataset.learnerFeature;
    input.checked = data.learnerFeatures?.[featureKey] !== false;
    input.addEventListener('change', () => {
      data.learnerFeatures = data.learnerFeatures || {};
      data.learnerFeatures[featureKey] = input.checked;
      if (!save('')) return;
      learnerState.textContent = '已保存';
      learnerState.classList.add('is-saved');
      showToast(input.parentElement.textContent.trim() + (input.checked ? '已显示' : '已隐藏'));
      clearTimeout(learnerTimer);
      learnerTimer = window.setTimeout(() => { learnerState.textContent = '修改后自动保存'; learnerState.classList.remove('is-saved'); }, 1600);
    });
  });

  renderTree();
})();
