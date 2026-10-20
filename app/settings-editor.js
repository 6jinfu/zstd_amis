(function () {
  const T = window.TalentSettings, e = UI.escape;
  const tree = document.querySelector('#level-tree'), query = document.querySelector('#level-search');
  let data = T.read(), selected = '', expanded = new Set(data.sequences.map(s => s.id));
  const uid = () => 'node-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const icon = leaf => leaf ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2h7l4 4v12H5z"/><path d="M12 2v5h4"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 5h6l2 2h8l-2 10H2z"/><path d="M2 5V3h6l2 2h7v2"/></svg>';
  function save(message) {
    try { T.write(data); showToast(message); return true; }
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
      else { sequence={id:uid(),name,levels:[]};data.sequences.push(sequence); }
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
      const next={...level,id:level?.id||uid(),name,code,rank};
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
  const dimensionForm=document.querySelector('#dimension-settings');
  dimensionForm.innerHTML=Object.entries(T.dimensions).map(([id,label])=>`<label class="dimension-setting-row"><span>${label}</span><input type="checkbox" name="dimension" value="${id}" ${data.dimensions.includes(id)?'checked':''}><span class="dimension-setting-state">${data.dimensions.includes(id)?'已启用':'未启用'}</span></label>`).join('');
  document.querySelector('#save-dimensions').onclick=()=>{
    const dimensions=[...dimensionForm.querySelectorAll('input:checked')].map(input=>input.value);
    const error=document.querySelector('#dimension-error');
    if(!dimensions.length){error.textContent='请至少启用一个标准维度';return;}
    data.dimensions=dimensions;
    if(save('岗位标准维度已保存')){error.textContent='';document.querySelector('#dimension-save-state').textContent='已保存';dimensionForm.querySelectorAll('input').forEach(input=>input.nextElementSibling.textContent=input.checked?'已启用':'未启用');}
  };
  dimensionForm.onchange=event=>{event.target.nextElementSibling.textContent=event.target.checked?'将启用':'将停用';document.querySelector('#dimension-error').textContent='';document.querySelector('#dimension-save-state').textContent='有未保存的修改';};
  renderTree();
})();
