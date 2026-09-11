/* Shared prototype UI. Business data and persistence stay with the caller. */
(function () {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function openDialog({title, body = '', confirmLabel = '确定', onConfirm, cancelLabel = '取消'}) {
    document.querySelectorAll('dialog.ui-dialog[open]').forEach(dialog => dialog.close());
    const trigger = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'ui-dialog';
    dialog.setAttribute('aria-label', title);
    dialog.innerHTML = `<div class="m-head"><h3>${escape(title)}</h3><button type="button" class="icon-close" data-dismiss aria-label="关闭"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="m-body">${body}</div><p class="ui-dialog-error" role="alert"></p><div class="m-foot">${cancelLabel ? `<button type="button" class="btn btn-secondary" data-dismiss>${escape(cancelLabel)}</button>` : ''}<button type="button" class="btn btn-primary" data-confirm>${escape(confirmLabel)}</button></div>`;
    dialog.showError = message => { dialog.querySelector('.ui-dialog-error').textContent = message; };
    dialog.querySelectorAll('[data-dismiss]').forEach(button => button.onclick = () => dialog.close());
    dialog.querySelector('[data-confirm]').onclick = () => {
      dialog.showError('');
      if (onConfirm?.(dialog) !== false) dialog.close();
    };
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right)) dialog.close();
    });
    dialog.addEventListener('close', () => { dialog.remove(); if (trigger?.isConnected) trigger.focus(); }, {once:true});
    document.body.append(dialog);
    dialog.showModal();
    return dialog;
  }

  function openPicker({title, items, selectedIds = [], maxSelected = Infinity, onConfirm, variant = 'simple', categories = [], treeTitle = '指标', nameLabel = '名称'}) {
    if (variant === 'indicator') return openIndicatorPicker({title, items, selectedIds, maxSelected, onConfirm, categories, treeTitle, nameLabel});
    const selected = new Set(selectedIds);
    const dialog = openDialog({title, body: '<label for="ui-picker-search">搜索</label><input type="search" id="ui-picker-search" class="input mt-sm mb-md" placeholder="输入名称"><p class="text-sm muted" data-selection-count></p><div data-picker-results></div>', onConfirm() {
      if (selected.size > maxSelected) { dialog.showError(`最多选择 ${maxSelected} 项`); return false; }
      return onConfirm([...selected]);
    }});
    const search = dialog.querySelector('input[type=search]');
    function render() {
      const query = search.value.trim().toLowerCase();
      dialog.querySelector('[data-selection-count]').textContent = `已选 ${selected.size} 项` + (Number.isFinite(maxSelected) ? ` / 最多 ${maxSelected} 项` : '');
      dialog.querySelector('[data-picker-results]').innerHTML = items.filter(item => item.label.toLowerCase().includes(query)).map(item => `<label class="picker-row"><input type="checkbox" value="${escape(item.id)}" ${selected.has(item.id) ? 'checked' : ''}><span>${escape(item.label)}</span><small>${escape(item.description || '')}</small></label>`).join('') || '<div class="empty-state">没有匹配项</div>';
    }
    search.oninput = render;
    dialog.addEventListener('change', event => {
      if (event.target.type !== 'checkbox') return;
      const input = event.target;
      input.checked ? selected.add(input.value) : selected.delete(input.value);
      dialog.showError('');
      dialog.querySelector('[data-selection-count]').textContent = `已选 ${selected.size} 项` + (Number.isFinite(maxSelected) ? ` / 最多 ${maxSelected} 项` : '');
    });
    render();
    return dialog;
  }

  function treeArrow(expanded, hasChildren) {
    if (!hasChildren) return '<span class="ui-picker-tree-arrow is-empty" aria-hidden="true"></span>';
    return `<button type="button" class="ui-picker-tree-arrow${expanded ? ' is-expanded' : ''}" data-indicator-tree-toggle aria-label="${expanded ? '收起' : '展开'}"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5 8 6l-4 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  }

  function openIndicatorPicker({title, items, selectedIds = [], maxSelected = Infinity, onConfirm, categories = [], treeTitle = '指标', nameLabel = '名称'}) {
    const source = items.map(item => ({
      id: String(item.id),
      label: String(item.label ?? item.name ?? item.id),
      description: String(item.description ?? item.note ?? ''),
      categoryId: String(item.categoryId ?? item.category ?? '')
    }));
    const selected = new Set(selectedIds.map(String));
    const checkedAvailable = new Set();
    const checkedSelected = new Set();
    const expanded = new Set(categories.filter(node => node.children?.length).map(node => node.id));
    const state = {activeCategory:'all', treeQuery:'', query:'', page:0, pageSize:20};
    const body = `<div class="indicator-picker" data-indicator-picker>
      <aside class="indicator-picker-tree">
        <div class="indicator-picker-tree-title">${escape(treeTitle)}</div>
        <label class="indicator-picker-tree-search"><input type="search" data-indicator-tree-search aria-label="搜索${escape(treeTitle)}类别" placeholder="搜索${escape(treeTitle)}类别"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></label>
        <div class="indicator-picker-tree-scroll" data-indicator-tree></div>
      </aside>
      <section class="indicator-picker-stage">
        <div class="indicator-picker-filter"><label for="ui-indicator-search">${escape(nameLabel)}</label><input type="search" id="ui-indicator-search" class="input" data-indicator-search placeholder="请输入"><button type="button" class="btn btn-primary" data-indicator-query>查询</button></div>
        <div class="indicator-picker-transfer-layout">
          <section class="indicator-picker-panel" aria-label="待选指标">
            <div class="indicator-picker-panel-head"><h4>待选区(<span data-indicator-available-count>0</span>)</h4></div>
            <div class="indicator-picker-list-head"><label><input type="checkbox" data-indicator-select-all="available"><span>${escape(nameLabel)}</span></label></div>
            <div class="indicator-picker-list" data-indicator-available></div>
            <div class="indicator-picker-pagination" data-indicator-pagination></div>
          </section>
          <div class="indicator-picker-actions"><button type="button" class="btn btn-secondary" data-indicator-add disabled>移入<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" class="btn btn-secondary" data-indicator-remove disabled><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>移出</button></div>
          <section class="indicator-picker-panel" aria-label="已选指标">
            <div class="indicator-picker-panel-head"><h4>已选择(<span data-indicator-selected-count>0</span>)</h4><button type="button" class="btn-text" data-indicator-remove-all disabled>移除全部</button></div>
            <div class="indicator-picker-list-head"><label><input type="checkbox" data-indicator-select-all="selected"><span>${escape(nameLabel)}</span></label></div>
            <div class="indicator-picker-list" data-indicator-selected></div>
          </section>
        </div>
      </section>
    </div>`;
    const dialog = openDialog({title, body, onConfirm() {
      if (selected.size > maxSelected) { dialog.showError(`最多选择 ${maxSelected} 项`); return false; }
      return onConfirm([...selected]);
    }});
    dialog.classList.add('ui-picker-indicator');
    const picker = dialog.querySelector('[data-indicator-picker]');
    const treeRoot = dialog.querySelector('[data-indicator-tree]');
    const search = dialog.querySelector('[data-indicator-search]');
    const treeSearch = dialog.querySelector('[data-indicator-tree-search]');
    const availableList = dialog.querySelector('[data-indicator-available]');
    const selectedList = dialog.querySelector('[data-indicator-selected]');
    const availableSelectAll = dialog.querySelector('[data-indicator-select-all="available"]');
    const selectedSelectAll = dialog.querySelector('[data-indicator-select-all="selected"]');

    function hasCategory(node, query) {
      return node.name.toLowerCase().includes(query) || (node.children || []).some(child => hasCategory(child, query));
    }
    function itemCategoryIds(node) {
      return [node.id, ...(node.children || []).flatMap(itemCategoryIds)];
    }
    const categoryIds = new Map();
    function indexCategories(nodes) { nodes.forEach(node => { categoryIds.set(node.id, itemCategoryIds(node)); indexCategories(node.children || []); }); }
    indexCategories(categories);
    function renderTreeNodes(nodes, depth = 0, query = '') {
      return nodes.filter(node => !query || hasCategory(node, query)).map(node => {
        const hasChildren = !!node.children?.length;
        const isExpanded = expanded.has(node.id) || !!query;
        const matches = !query || node.name.toLowerCase().includes(query);
        const children = hasChildren && isExpanded ? `<div class="ui-picker-tree-children">${renderTreeNodes(node.children, depth + 1, query)}</div>` : '';
        return `<div class="ui-picker-tree-node"><div class="ui-picker-tree-row${state.activeCategory === node.id ? ' is-active' : ''}${matches ? '' : ' is-parent-match'}" style="--tree-depth:${depth}" data-indicator-tree-category="${escape(node.id)}"><span data-indicator-tree-toggle-wrap>${treeArrow(isExpanded, hasChildren)}</span><span class="ui-picker-tree-label">${escape(node.name)}</span></div>${children}</div>`;
      }).join('');
    }
    function renderTree() {
      const query = state.treeQuery.toLowerCase();
      treeRoot.innerHTML = `<div class="ui-picker-tree-row${state.activeCategory === 'all' ? ' is-active' : ''}" data-indicator-tree-category="all" style="--tree-depth:0"><span data-indicator-tree-toggle-wrap>${treeArrow(true, true)}</span><span class="ui-picker-tree-label">全部</span></div><div class="ui-picker-tree-children">${renderTreeNodes(categories, 1, query)}</div>`;
    }
    function filteredItems() {
      const query = state.query.trim().toLowerCase();
      const allowed = state.activeCategory === 'all' ? null : new Set(categoryIds.get(state.activeCategory) || [state.activeCategory]);
      return source.filter(item => !selected.has(item.id) && (!allowed || allowed.has(item.categoryId)) && (!query || `${item.label} ${item.description}`.toLowerCase().includes(query)));
    }
    function renderRow(item, group) {
      const checked = (group === 'available' ? checkedAvailable : checkedSelected).has(item.id);
      return `<label class="indicator-picker-row"><input type="checkbox" data-indicator-check="${group}" value="${escape(item.id)}" ${checked ? 'checked' : ''}><span title="${escape(item.label)}">${escape(item.label)}</span></label>`;
    }
    function renderEmpty(text) { return `<div class="indicator-picker-empty">${escape(text)}</div>`; }
    function updateSelectAll(input, values, group) {
      const visible = values.map(item => item.id);
      input.checked = visible.length > 0 && visible.every(id => (group === 'available' ? checkedAvailable : checkedSelected).has(id));
      input.indeterminate = visible.some(id => (group === 'available' ? checkedAvailable : checkedSelected).has(id)) && !input.checked;
      input.disabled = !visible.length;
    }
    function renderLists() {
      const allAvailable = filteredItems();
      const totalPages = Math.max(1, Math.ceil(allAvailable.length / state.pageSize));
      state.page = Math.min(state.page, totalPages - 1);
      const pageItems = allAvailable.slice(state.page * state.pageSize, (state.page + 1) * state.pageSize);
      const selectedItems = source.filter(item => selected.has(item.id));
      availableList.innerHTML = pageItems.map(item => renderRow(item, 'available')).join('') || renderEmpty('暂无待选指标');
      selectedList.innerHTML = selectedItems.map(item => renderRow(item, 'selected')).join('') || renderEmpty('暂无数据');
      dialog.querySelector('[data-indicator-available-count]').textContent = allAvailable.length;
      dialog.querySelector('[data-indicator-selected-count]').textContent = selectedItems.length;
      dialog.querySelector('[data-indicator-add]').disabled = ![...checkedAvailable].some(id => pageItems.some(item => item.id === id));
      dialog.querySelector('[data-indicator-remove]').disabled = ![...checkedSelected].some(id => selected.has(id));
      dialog.querySelector('[data-indicator-remove-all]').disabled = !selectedItems.length;
      updateSelectAll(availableSelectAll, pageItems, 'available');
      updateSelectAll(selectedSelectAll, selectedItems, 'selected');
      const pagination = dialog.querySelector('[data-indicator-pagination]');
      pagination.innerHTML = totalPages > 1 ? `<button type="button" class="pg-btn" data-indicator-page="prev" ${state.page === 0 ? 'disabled' : ''}>上一页</button><span>${state.page + 1} / ${totalPages}</span><button type="button" class="pg-btn" data-indicator-page="next" ${state.page === totalPages - 1 ? 'disabled' : ''}>下一页</button>` : `<span>共 ${allAvailable.length} 条</span>`;
    }
    function render() { renderTree(); renderLists(); }
    function setCategory(id) { state.activeCategory = id; state.page = 0; render(); }

    dialog.addEventListener('click', event => {
      const toggle = event.target.closest('[data-indicator-tree-toggle]');
      if (toggle) {
        event.stopPropagation();
        const row = toggle.closest('[data-indicator-tree-row], .ui-picker-tree-row');
        const node = row?.dataset.indicatorTreeCategory;
        if (node && node !== 'all') { expanded.has(node) ? expanded.delete(node) : expanded.add(node); renderTree(); }
        return;
      }
      const category = event.target.closest('[data-indicator-tree-category]');
      if (category) { setCategory(category.dataset.indicatorTreeCategory); return; }
      const add = event.target.closest('[data-indicator-add]');
      if (add) { if (selected.size + checkedAvailable.size > maxSelected) { dialog.showError(`最多选择 ${maxSelected} 项`); return; } checkedAvailable.forEach(id => selected.add(id)); checkedAvailable.clear(); renderLists(); dialog.showError(''); return; }
      const remove = event.target.closest('[data-indicator-remove]');
      if (remove) { checkedSelected.forEach(id => selected.delete(id)); checkedSelected.clear(); renderLists(); dialog.showError(''); return; }
      const removeAll = event.target.closest('[data-indicator-remove-all]');
      if (removeAll) { selected.clear(); checkedSelected.clear(); renderLists(); dialog.showError(''); return; }
      const page = event.target.closest('[data-indicator-page]');
      if (page && !page.disabled) { state.page += page.dataset.indicatorPage === 'next' ? 1 : -1; renderLists(); }
      const queryButton = event.target.closest('[data-indicator-query]');
      if (queryButton) { state.page = 0; renderLists(); }
    });
    dialog.addEventListener('change', event => {
      const input = event.target;
      if (input.matches('[data-indicator-check]')) {
        const bucket = input.dataset.indicatorCheck === 'available' ? checkedAvailable : checkedSelected;
        input.checked ? bucket.add(input.value) : bucket.delete(input.value);
        renderLists();
      }
      if (input === availableSelectAll || input === selectedSelectAll) {
        const group = input === availableSelectAll ? 'available' : 'selected';
        const values = group === 'available' ? filteredItems().slice(state.page * state.pageSize, (state.page + 1) * state.pageSize).map(item => item.id) : source.filter(item => selected.has(item.id)).map(item => item.id);
        const bucket = group === 'available' ? checkedAvailable : checkedSelected;
        values.forEach(id => input.checked ? bucket.add(id) : bucket.delete(id));
        renderLists();
      }
    });
    search.addEventListener('input', () => { state.query = search.value; state.page = 0; renderLists(); });
    treeSearch.addEventListener('input', () => { state.treeQuery = treeSearch.value; renderTree(); });
    render();
    return dialog;
  }

  function openCategoryManager({items, onConfirm}) {
    const draft = items.map(item => ({...item}));
    const dialog = openDialog({title:'管理类别', body:'<div data-category-editor></div><button type="button" class="btn btn-secondary" data-add-category>新增类别</button>', confirmLabel:'保存', onConfirm() {
      const names = draft.map(item => item.name.trim());
      if (names.some(name => !name)) { dialog.showError('请输入类别名称'); return false; }
      if (new Set(names).size !== names.length) { dialog.showError('类别名称不能重复'); return false; }
      return onConfirm(draft.map((item, index) => ({...item, name:names[index]})));
    }});
    function render() {
      dialog.querySelector('[data-category-editor]').innerHTML = draft.map((item, index) => `<div class="ui-category-row"><input class="input" maxlength="30" aria-label="类别名称 ${index + 1}" data-name="${index}" value="${escape(item.name)}"><span class="muted text-sm">${item.count} 条</span><button type="button" class="btn-text danger" data-remove="${index}">删除</button></div>`).join('');
    }
    dialog.addEventListener('input', event => { if (event.target.dataset.name !== undefined) draft[+event.target.dataset.name].name = event.target.value; });
    dialog.addEventListener('click', event => {
      const remove = event.target.closest('[data-remove]');
      if (remove) {
        const index = +remove.dataset.remove;
        if (draft[index].count) { dialog.showError('该类别下有内容，请先调整内容类别'); return; }
        draft.splice(index, 1); render();
      }
      if (event.target.closest('[data-add-category]')) { draft.push({id:'new-' + Date.now(),name:'',count:0}); render(); dialog.querySelector('[data-category-editor]').lastElementChild.querySelector('input').focus(); }
    });
    render();
    return dialog;
  }

  // Adapter for existing static category lists. Event delegation survives tree redraws.
  function bindCategoryManager({root, triggerId, list, table, onChange, categoryCell = 1}) {
    root.querySelectorAll('[data-open]').forEach(button => {
      if (button.dataset.open === triggerId) {
        button.dataset.categoryManager = triggerId;
        button.removeAttribute('data-open');
      }
    });
    root.addEventListener('click', event => {
      if (!event.target.closest('[data-category-manager]')) return;
      const rows = [...table.querySelectorAll('tbody tr[data-cat]')];
      openCategoryManager({
        items:[...list.querySelectorAll('.cmr-name')].map(node => {
          const name = node.textContent.trim();
          return {id:name, name, count:rows.filter(row => row.dataset.cat === name).length};
        }),
        onConfirm(items) {
          const renamed = new Map(items.map(item => [item.id, item.name]));
          rows.forEach(row => {
            const name = renamed.get(row.dataset.cat);
            if (!name) return;
            row.dataset.cat = name;
            if (categoryCell !== null && row.cells[categoryCell]) row.cells[categoryCell].textContent = name;
          });
          list.innerHTML = items.map(item => `<div class="catmgr-row"><span class="cmr-name">${escape(item.name)}</span><span class="cmr-count">${item.count} 条</span></div>`).join('');
          onChange();
        }
      });
    });
  }

  function mountResourceEditor(table, {rows = [], onChange = () => {}} = {}) {
    let resources = rows.map(row => [...row]);
    const tags = {'课程':'tag-primary','项目':'tag-success','前测':'tag-warning','后测':'tag-warning','考试':'tag-warning'};
    function render() {
      table.tBodies[0].innerHTML = resources.map((row,index) => `<tr><td><span class="tag ${tags[row[0]] || 'tag-primary'}">${escape(row[0])}</span></td><td>${escape(row[2])}</td><td class="muted">${escape(row[3])}</td><td class="resource-actions"><button type="button" class="btn-text danger" data-resource-remove="${index}">移除</button></td></tr>`).join('') || '<tr><td colspan="4"><div class="empty-state">尚未添加学习资源</div></td></tr>';
    }
    table.addEventListener('click', event => {
      const button = event.target.closest('[data-resource-remove]');
      if (!button) return;
      resources.splice(+button.dataset.resourceRemove, 1); render(); onChange();
    });
    render();
    return {
      getValue: () => resources.map(row => [...row]),
      add(nextRows) {
        const existing = new Set(resources.map(row => row[0] + ':' + row[2]));
        nextRows.forEach(row => { const key = row[0] + ':' + row[2]; if (!existing.has(key)) {resources.push([...row]); existing.add(key);} });
        render(); onChange();
      }
    };
  }
  window.UI = {escape, openDialog, openPicker, openCategoryManager, bindCategoryManager, mountResourceEditor};
})();
