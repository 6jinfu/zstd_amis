/* Shared prototype UI. Business data and persistence stay with the caller. */
(function () {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function openDialog({title, body = '', confirmLabel = '确定', onConfirm, cancelLabel = '取消', keepParent = false}) {
    if (!keepParent) document.querySelectorAll('dialog.ui-dialog[open]').forEach(dialog => dialog.close());
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
        return `<div class="ui-picker-tree-node"><div class="ui-picker-tree-row${state.activeCategory === node.id ? ' is-active' : ''}${matches ? '' : ' is-parent-match'}" style="--tree-depth:${depth}" data-indicator-tree-category="${escape(node.id)}" title="${escape(node.name)}"><span data-indicator-tree-toggle-wrap>${treeArrow(isExpanded, hasChildren)}</span><span class="ui-picker-tree-label">${escape(node.name)}</span></div>${children}</div>`;
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
    mountCategoryTrees(dialog);
    return dialog;
  }

  const categoryCloseIcon = "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" stroke=\"currentColor\" class=\"arco-icon arco-icon-close\" stroke-width=\"4\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.8095 8L12.9111 3.11094C12.9798 3.02969 12.922 2.90625 12.8158 2.90625H11.5689C11.4954 2.90625 11.4251 2.93906 11.3767 2.99531L7.99388 7.02812L4.61106 2.99531C4.56419 2.93906 4.49388 2.90625 4.41888 2.90625H3.172C3.06575 2.90625 3.00794 3.02969 3.07669 3.11094L7.17825 8L3.07669 12.8891C3.00794 12.9703 3.06575 13.0938 3.172 13.0938H4.41888C4.49231 13.0938 4.56263 13.0609 4.61106 13.0047L7.99388 8.97188L11.3767 13.0047C11.4236 13.0609 11.4939 13.0938 11.5689 13.0938H12.8158C12.922 13.0938 12.9798 12.9703 12.9111 12.8891L8.8095 8Z\" fill=\"currentColor\" stroke=\"none\"></path></svg>";
  const categoryFileIcon = "<svg class=\"ui-category-icon\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g transform=\"translate(1, 0)\"><g><polygon class=\"svg-path-theme\" points=\"10 5 10 0 10.3571429 0.357142857 14.6428571 4.64285714 15 5 10 5\"></polygon><polygon fill-opacity=\"0.35\" fill=\"#FFFFFF\" points=\"10 5 10 0 10.3571429 0.357142857 14.6428571 4.64285714 15 5 10 5\"></polygon></g><g><path class=\"svg-path-theme\" d=\"M9.0729927,4.9 C9.0729927,5.1 9.17518248,5.3 9.37956204,5.5 C9.58394161,5.7 9.78832117,5.8 9.99270073,5.8 L15,5.8 L15,15.1 C14.8978102,15.6 14.5912409,15.9 14.080292,16 L1.91970803,16 C1.71532847,16 1.51094891,15.9 1.30656934,15.7 C1.10218978,15.5 1,15.3 1,15 L1,0.9 C1,0.7 1.10218978,0.5 1.30656934,0.3 C1.40875912,0.1 1.71532847,0 1.91970803,0 L9.17518248,0 L9.0729927,4.9 Z\"></path><path fill-opacity=\"0.6\" fill=\"#FFFFFF\" d=\"M9.0729927,4.9 C9.0729927,5.1 9.17518248,5.3 9.37956204,5.5 C9.58394161,5.7 9.78832117,5.8 9.99270073,5.8 L15,5.8 L15,15.1 C14.8978102,15.6 14.5912409,15.9 14.080292,16 L1.91970803,16 C1.71532847,16 1.51094891,15.9 1.30656934,15.7 C1.10218978,15.5 1,15.3 1,15 L1,0.9 C1,0.7 1.10218978,0.5 1.30656934,0.3 C1.40875912,0.1 1.71532847,0 1.91970803,0 L9.17518248,0 L9.0729927,4.9 Z\"></path></g></g></g></svg>";
  const categoryFolderIcon = "<svg class=\"ui-category-icon\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g transform=\"translate(0, 0.6667)\"><path class=\"svg-path-theme\" d=\"M5.85786379,-4.42210708e-05 C6.72615267,-4.42210708e-05 7.38956372,0.771092483 7.38956372,1.66640423 C7.38956372,1.83660769 7.47387201,1.95405717 7.55561085,1.98076277 L7.59023118,1.98654153 L12.3731375,2.0030528 C13.2036422,2.0030528 13.8489943,2.69994377 13.9013318,3.54551557 L13.9047619,3.65660567 L13.9047619,5.6174405 L12.1643895,13.9999558 L1.53169993,13.9999558 C0.701228489,13.9999558 0.0557765061,13.3031741 0.00343063161,12.4576109 L0,12.3465213 L0,1.65351838 C0,0.796068101 0.610854848,0.063427704 1.4244611,0.00386296657 L1.53169993,-4.42210708e-05 L5.85786379,-4.42210708e-05 Z\" opacity=\"0.35\" fill-rule=\"nonzero\"></path><g><path class=\"svg-path-theme\" d=\"M14.4712222,4.60606061 L3.27743512,4.60606061 C2.6702452,4.60606061 2.13973892,5.01629874 1.98698486,5.60396004 L0.12988452,12.7484246 C0.108529885,12.8305781 0.0977222154,12.9151164 0.0977222154,13 C0.0977222154,13.5522847 0.545437466,14 1.09772222,14 L12.7225649,14 C13.3297548,14 13.8602611,13.5897619 14.0130151,13.0021006 L15.7616725,6.27482784 C15.7901453,6.16528974 15.8045556,6.05257211 15.8045556,5.93939394 C15.8045556,5.20301427 15.2076019,4.60606061 14.4712222,4.60606061 Z\"></path><path fill-opacity=\"0.3\" fill=\"#FFFFFF\" d=\"M14.4712222,4.60606061 L3.27743512,4.60606061 C2.6702452,4.60606061 2.13973892,5.01629874 1.98698486,5.60396004 L0.12988452,12.7484246 C0.108529885,12.8305781 0.0977222154,12.9151164 0.0977222154,13 C0.0977222154,13.5522847 0.545437466,14 1.09772222,14 L12.7225649,14 C13.3297548,14 13.8602611,13.5897619 14.0130151,13.0021006 L15.7616725,6.27482784 C15.7901453,6.16528974 15.8045556,6.05257211 15.8045556,5.93939394 C15.8045556,5.20301427 15.2076019,4.60606061 14.4712222,4.60606061 Z\"></path></g></g></g></svg>";

  function openCategoryManager({items, onConfirm, allowChildren = false}) {
    let draft = items.map(item => ({...item}));
    let selected = '';
    const collapsed = new Set();
    const dialog = openDialog({title:'管理类别', body:`<button type="button" class="btn btn-primary" data-add-category>新增类别</button><label class="ui-category-search"><input class="input" type="search" placeholder="搜索类别" aria-label="搜索类别">${categorySearchIcon}</label><div class="ui-category-tree" data-category-editor role="tree" aria-label="类别"></div>`});
    dialog.classList.add('ui-category-manager');
    dialog.querySelector('.icon-close').innerHTML = categoryCloseIcon;
    dialog.querySelector('.m-foot').remove();
    const search = dialog.querySelector('.ui-category-search input');
    function publish(next, form) {
      if (onConfirm(next.map(item => ({...item}))) === false) { form.showError('保存失败，请重试'); return false; }
      const renamed = new Map(next.map(item => [item.id, item.name]));
      selected = renamed.get(selected) || selected;
      const collapsedNames = [...collapsed].map(id => renamed.get(id) || id);
      collapsed.clear(); collapsedNames.forEach(id => collapsed.add(id));
      draft = next.map(item => ({...item, id:item.name, parentId:renamed.get(item.parentId) || item.parentId || ''}));
      dialog.showError(''); render();
      return true;
    }
    function edit(item, parent) {
      const form = openDialog({title:item ? '编辑类别' : parent ? '新增子级' : '新增类别', keepParent:true,
        body:`<div class="field"><label for="ui-category-name"><span class="req">*</span> 名称</label><input class="input" id="ui-category-name" maxlength="30" placeholder="请输入名称" value="${escape(item?.name || '')}"></div>`, confirmLabel:'保存', onConfirm(form) {
          const name = form.querySelector('input').value.trim();
          if (!name) { form.showError('请输入类别名称'); return false; }
          if (draft.some(node => node.id !== item?.id && node.name === name)) { form.showError('类别名称不能重复'); return false; }
          const next = item ? draft.map(node => node.id === item.id ? {...node, name} : {...node}) : [...draft, {id:'new-' + Date.now(),name,count:0,parentId:parent?.id || ''}];
          return publish(next, form);
        }});
      form.classList.add('ui-category-form');
      form.querySelector('.icon-close').innerHTML = categoryCloseIcon;
      form.querySelector('input').focus();
    }
    function row(item, depth, children, query) {
      const expanded = !!query || !collapsed.has(item.id);
      const arrow = children.length ? `<button type="button" class="ui-category-toggle" data-category-toggle="${escape(item.id)}" aria-label="${expanded?'收起':'展开'}${escape(item.name)}"><svg viewBox="0 0 48 48" aria-hidden="true" style="transform:rotate(${expanded?0:-90}deg)"><path d="M24.938 34.829a1.2 1.2 0 0 1-1.875 0L9.56 17.949c-.628-.785-.069-1.949.937-1.949h27.007c1.006 0 1.565 1.164.937 1.95L24.937 34.829Z" fill="currentColor"/></svg></button>` : '<span class="ui-category-toggle" aria-hidden="true"></span>';
      const icon = children.length ? categoryFolderIcon : categoryFileIcon;
      return `<div class="ui-category-node${selected===item.id?' is-active':''}" role="treeitem" aria-level="${depth+1}" aria-selected="${selected===item.id}"${children.length?` aria-expanded="${expanded}"`:''} style="--category-depth:${depth}">${arrow}<div class="ui-category-node-title">${icon}<button type="button" class="ui-category-name" data-category-select="${escape(item.id)}" title="${escape(item.name)}">${escape(item.name)}</button><span class="ui-category-ops">${allowChildren&&!depth?`<button type="button" data-category-add-child="${escape(item.id)}">新增子级</button>`:''}<button type="button" data-category-edit="${escape(item.id)}">编辑</button><button type="button" data-category-remove="${escape(item.id)}">删除</button></span></div></div>`;
    }
    function render() {
      const query = search.value.trim().toLowerCase();
      function branch(item,depth,ancestorMatch) {
        const children=draft.filter(child=>child.parentId===item.id);
        const ownMatch=ancestorMatch || item.name.toLowerCase().includes(query);
        const childHtml=children.map(child=>branch(child,depth+1,ownMatch)).join('');
        if (query && !ownMatch && !childHtml) return '';
        return row(item,depth,children,query) + ((!collapsed.has(item.id)||query)?childHtml:'');
      }
      dialog.querySelector('[data-category-editor]').innerHTML = draft.filter(item=>!item.parentId).map(item=>branch(item,0,false)).join('') || '<div class="ui-category-empty">暂无匹配类别</div>';
    }
    search.addEventListener('input', render);
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-add-category]')) { edit(); return; }
      const toggle = event.target.closest('[data-category-toggle]');
      if (toggle) { const id=toggle.dataset.categoryToggle; collapsed.has(id)?collapsed.delete(id):collapsed.add(id); render(); return; }
      const select = event.target.closest('[data-category-select]');
      if (select) { selected=select.dataset.categorySelect; render(); return; }
      const add = event.target.closest('[data-category-add-child]');
      if (add) { edit(null,draft.find(item => item.id === add.dataset.categoryAddChild)); return; }
      const update = event.target.closest('[data-category-edit]');
      if (update) { edit(draft.find(item => item.id === update.dataset.categoryEdit)); return; }
      const remove = event.target.closest('[data-category-remove]');
      if (remove) {
        const item = draft.find(node => node.id === remove.dataset.categoryRemove);
        if (item.count || draft.some(child => child.parentId === item.id)) { dialog.showError('该类别下有内容或子类，请先调整后再删除'); return; }
        const confirmation = openDialog({title:'系统提示',keepParent:true,body:`<p>确定删除【${escape(item.name)}】吗？</p>`,onConfirm(form){ return publish(draft.filter(node => node.id !== item.id),form); }});
        confirmation.classList.add('ui-category-form');
        confirmation.querySelector('.icon-close').innerHTML = categoryCloseIcon;
      }
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

  const scopeTrees = new WeakMap();
  const scopePanelSelector = '.cat-tree-panel,.list-rail,.pm-series-panel,.indicator-picker-tree,.review-person-org';
  const scopeRowSelector = '.cat-tree-item,.pm-series-item,.ui-picker-tree-row,.t-node > label';
  const categorySearchIcon = '<svg width="14" height="14" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true"><path d="M33.072 33.071c6.248-6.248 6.248-16.379 0-22.627-6.249-6.249-16.38-6.249-22.628 0-6.248 6.248-6.248 16.379 0 22.627 6.249 6.248 16.379 6.248 22.628 0Zm0 0 8.485 8.485"/></svg>';
  const scopeCaret = '<svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true" data-scope-caret><path d="M24.938 34.829a1.2 1.2 0 0 1-1.875 0L9.56 17.949c-.628-.785-.069-1.949.937-1.949h27.007c1.006 0 1.565 1.164.937 1.95L24.937 34.829Z" fill="currentColor"/></svg>';

  function mountCategoryTrees(root = document) {
    const panels = [...root.querySelectorAll(scopePanelSelector)];
    if (root.matches?.(scopePanelSelector)) panels.unshift(root);
    panels.forEach(panel => {
      if (panel.id === 'kp-tree') return;
      let state = scopeTrees.get(panel);
      if (!state) {
        state = {query:'',scheduled:false};
        scopeTrees.set(panel,state);
        panel.addEventListener('input', event => {
          if (event.target.matches('[data-scope-search]')) { state.query=event.target.value; filterScopeTree(panel,state.query); }
        });
        state.observer = new MutationObserver(() => {
          if (state.scheduled) return;
          state.scheduled=true;
          queueMicrotask(() => { state.scheduled=false; decorateScopeTree(panel,state); });
        });
        state.observer.observe(panel,{childList:true,subtree:true});
      }
      decorateScopeTree(panel,state);
    });
  }

  function decorateScopeTree(panel,state) {
    panel.classList.add('scope-category');
    const head = panel.querySelector('.ctp-head,.list-rail-head,.pm-series-title,.indicator-picker-tree-title,.section-title');
    if (head) head.classList.add('category-tree-head');
    let input = panel.querySelector('input[type="search"],[data-cap-tree-search]');
    let search;
    if (input) {
      search=input.closest('label,.pm-series-search-wrap,.cap-demo-tree-search,.indicator-picker-tree-search') || input.parentElement;
      search.classList.add('category-tree-search');
      if (!search.querySelector('svg')) search.insertAdjacentHTML('beforeend',categorySearchIcon);
    } else {
      search=document.createElement('label'); search.className='category-tree-search';
      const title=head?.textContent.trim() || '类别';
      search.innerHTML=`<input class="input" type="search" data-scope-search placeholder="搜索${escape(title==='类别'?'类别':title)}" aria-label="搜索${escape(title)}">${categorySearchIcon}`;
      input=search.querySelector('input'); input.value=state.query;
      if (head) head.after(search); else panel.prepend(search);
    }
    let body=panel.querySelector(':scope > .category-tree-body');
    if (!body) {
      const footer=panel.querySelector(':scope > .pm-series-settings');
      const roots=Array.from(panel.children).filter(node => node!==head && node!==search && node!==footer && !node.classList.contains('category-tree-empty'));
      if (roots.length===1) body=roots[0];
      else { body=document.createElement('div'); roots.forEach(node=>body.append(node)); panel.insertBefore(body,footer); }
      body.classList.add('category-tree-body');
    }
    panel.querySelectorAll(scopeRowSelector).forEach(row => {
      if (row.classList.contains('scope-node')) return;
      const branch=row.closest('.std-category-parent-row');
      const depth=Number(row.style.getPropertyValue('--tree-depth') || (row.classList.contains('std-category-child') || row.closest('.t-l2') ? 1 : 0));
      row.classList.add('scope-node'); row.style.setProperty('--scope-depth',depth);
      let arrow=row.querySelector(':scope > .std-category-toggle-slot,:scope > .cap-demo-arrow,:scope > [data-indicator-tree-toggle-wrap]');
      const toggle=branch?.querySelector('.std-category-toggle') || arrow?.querySelector('button') || (arrow?.tagName==='BUTTON'?arrow:null);
      const expanded=row.hasAttribute('aria-expanded') ? row.getAttribute('aria-expanded')==='true' : toggle?.getAttribute('aria-expanded')==='true' || !!toggle?.classList.contains('is-expanded');
      const hasChildren=!!branch || row.hasAttribute('aria-expanded') || !!toggle || !!row.closest('.t-l1')?.nextElementSibling?.classList.contains('t-l2');
      if (branch) {
        branch.classList.add('scope-branch'); row.classList.add('scope-branch-label');
        arrow=toggle;
      } else if (!arrow) {
        arrow=document.createElement('span'); arrow.setAttribute('aria-hidden','true'); row.prepend(arrow);
      }
      arrow.classList.add('category-tree-switcher');
      if (toggle) { toggle.innerHTML=scopeCaret; toggle.classList.add('scope-arrow'); toggle.style.setProperty('--scope-rotation',expanded?'0deg':'-90deg'); }
      if (row.classList.contains('pm-series-item')) row.querySelector(':scope > svg')?.remove();
      const title=document.createElement('span'); title.className='category-tree-node-title';
      Array.from(row.childNodes).forEach(node=>{if(node!==arrow && !node.matches?.('.std-category-toggle-slot'))title.append(node);});
      const name=title.textContent.trim();
      row.dataset.scopeLabel=name;
      if (!row.title) row.title=name;
      const icon=(hasChildren || name==='全部') ? categoryFolderIcon : categoryFileIcon;
      title.insertAdjacentHTML('afterbegin',icon);
      title.querySelector('svg').classList.add('category-tree-icon');
      row.append(title);
    });
    if (input.hasAttribute('data-scope-search')) filterScopeTree(panel,state.query);
  }

  function filterScopeTree(panel,query) {
    const term=query.trim().toLowerCase();
    const rows=[...panel.querySelectorAll('.scope-node')];
    const depths=rows.map(row=>Number(row.style.getPropertyValue('--scope-depth'))||0);
    const shown=rows.map(row=>!term || row.dataset.scopeLabel.toLowerCase().includes(term));
    const own=shown.slice();
    rows.forEach((row,index)=>{
      if (!own[index]) return;
      for (let child=index+1;child<rows.length && depths[child]>depths[index];child++) shown[child]=true;
      let depth=depths[index];
      for (let parent=index-1;parent>=0 && depth>0;parent--) if (depths[parent]<depth) { shown[parent]=true; depth=depths[parent]; }
    });
    rows.forEach((row,index)=>{row.hidden=!shown[index];});
    panel.querySelectorAll('.std-category-group').forEach(group=>{
      group.hidden=![...group.querySelectorAll('.scope-node')].some(row=>!row.hidden);
      group.toggleAttribute('data-scope-search-open',!!term && !group.hidden);
    });
    let empty=panel.querySelector(':scope > .category-tree-empty');
    if (!empty) { empty=document.createElement('div'); empty.className='category-tree-empty'; empty.textContent='暂无匹配项'; panel.append(empty); }
    const any=shown.some(Boolean);
    empty.hidden=any; panel.querySelector(':scope > .category-tree-body').hidden=!any;
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
  window.UI = {escape, openDialog, openPicker, openCategoryManager, bindCategoryManager, mountCategoryTrees, mountResourceEditor};
})();
