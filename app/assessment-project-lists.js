(function () {
  function text(node) { return node ? node.textContent.trim() : ''; }

  document.querySelectorAll('[data-assessment-project-list]').forEach(function (root) {
    var table = root.querySelector('table.t');
    var rows = Array.from(table.querySelectorAll('tbody tr:not(.row-empty)'));
    var form = root.querySelector('[data-project-filter]');
    var tree = root.querySelector('[data-category-tree]');
    var categoryList = tree.querySelector('[data-category-items]');
    var drawer = document.getElementById(root.dataset.categoryDrawer);
    var managerList = drawer.querySelector('[data-category-list]');
    var managerInput = drawer.querySelector('[data-category-new]');
    var checkAll = table.querySelector('[data-check-all]');
    var rowChecks = rows.map(function (row) { return row.querySelector('[data-row-check]'); }).filter(Boolean);
    var selectionActions = Array.from(root.querySelectorAll('[data-selection-action]'));
    var activeCategory = '';

    function matchesFilters(row) {
      var query = (form.querySelector('[data-filter="query"]')?.value || '').trim().toLowerCase();
      var matches = !query || row.textContent.toLowerCase().includes(query);
      form.querySelectorAll('[data-filter]:not([data-filter="query"])').forEach(function (field) {
        var value = field.value;
        if (!matches || value === '') return;
        var key = field.dataset.filter;
        if (key === 'deadlineFrom') matches = (row.dataset.deadline || '') >= value;
        else if (key === 'deadlineTo') matches = (row.dataset.deadline || '') <= value;
        else if (key === 'progressMin') matches = Number(row.dataset.progress || 0) >= Number(value);
        else if (key === 'progressMax') matches = Number(row.dataset.progress || 0) <= Number(value);
        else if (key.endsWith('Query')) matches = (row.dataset[key] || '').toLowerCase().includes(value.trim().toLowerCase());
        else matches = (row.dataset[key] || '') === value;
      });
      return matches && (!activeCategory || row.dataset.cat === activeCategory);
    }

    function applyFilters() {
      rows.forEach(function (row) { row.style.display = matchesFilters(row) ? '' : 'none'; });
      if (checkAll) { checkAll.checked = false; checkAll.indeterminate = false; }
    }

    function categoryCount(name) {
      return rows.filter(function (row) { return row.dataset.cat === name; }).length;
    }

    function renderCategories(selected) {
      categoryList.replaceChildren();
      var all = document.createElement('button');
      all.type = 'button';
      all.className = 'cat-tree-item' + (!selected ? ' active' : '');
      all.innerHTML = '<span>全部</span><span class="cti-count">' + root.dataset.total + '</span>';
      all.dataset.category = '';
      categoryList.appendChild(all);
      managerList.querySelectorAll('.catmgr-row').forEach(function (row) {
        var name = text(row.querySelector('.cmr-name'));
        if (!name) return;
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'cat-tree-item' + (selected === name ? ' active' : '');
        item.dataset.category = name;
        item.innerHTML = '<span></span><span class="cti-count"></span>';
        item.firstElementChild.textContent = name;
        item.lastElementChild.textContent = text(row.querySelector('.cmr-count')).replace(/\s*条$/, '');
        categoryList.appendChild(item);
      });
      activeCategory = selected || '';
      applyFilters();
    }

    categoryList.addEventListener('click', function (event) {
      var item = event.target.closest('[data-category]');
      if (!item) return;
      renderCategories(item.dataset.category);
    });

    form.addEventListener('submit', function (event) { event.preventDefault(); applyFilters(); });
    form.addEventListener('reset', function () { setTimeout(function () { activeCategory = ''; renderCategories(); }, 0); });

    if (checkAll) {
      checkAll.addEventListener('change', function () {
        rowChecks.forEach(function (checkbox) {
          if (checkbox.closest('tr').style.display !== 'none') checkbox.checked = checkAll.checked;
        });
        syncSelection();
      });
    }

    function syncSelection() {
      var selected = rowChecks.filter(function (checkbox) { return checkbox.checked; }).length;
      selectionActions.forEach(function (button) { button.disabled = selected === 0; });
      if (!checkAll) return;
      var visible = rowChecks.filter(function (checkbox) { return checkbox.closest('tr').style.display !== 'none'; });
      var visibleSelected = visible.filter(function (checkbox) { return checkbox.checked; }).length;
      checkAll.checked = visible.length > 0 && visibleSelected === visible.length;
      checkAll.indeterminate = visibleSelected > 0 && visibleSelected < visible.length;
    }
    rowChecks.forEach(function (checkbox) { checkbox.addEventListener('change', syncSelection); });

    drawer.querySelector('[data-category-add]').addEventListener('click', function () {
      var name = managerInput.value.trim();
      var exists = Array.from(managerList.querySelectorAll('.cmr-name')).some(function (node) { return text(node) === name; });
      if (!name) return;
      if (exists) { alert('类别已存在'); return; }
      var row = document.createElement('div');
      row.className = 'catmgr-row';
      row.innerHTML = '<span class="cmr-name"></span><span class="cmr-count">0 条</span><span class="catmgr-ops"><button class="btn-text btn-sm" type="button" data-category-edit>编辑</button><button class="btn-text btn-sm danger" type="button" data-category-delete>删除</button></span>';
      row.querySelector('.cmr-name').textContent = name;
      managerList.appendChild(row);
      managerInput.value = '';
      renderCategories(name);
    });
    managerInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); drawer.querySelector('[data-category-add]').click(); }
    });

    managerList.addEventListener('click', function (event) {
      var remove = event.target.closest('[data-category-delete]');
      var edit = event.target.closest('[data-category-edit]');
      if (remove) {
        var removeRow = remove.closest('.catmgr-row');
        var removeName = text(removeRow.querySelector('.cmr-name'));
        if (categoryCount(removeName)) { alert('该类别下有项目，请先移除或转移后再删除'); return; }
        removeRow.remove();
        renderCategories(activeCategory === removeName ? '' : activeCategory);
        return;
      }
      if (!edit) return;
      var row = edit.closest('.catmgr-row');
      var field = row.querySelector('.cmr-edit-input');
      if (field) {
        var oldName = field.dataset.oldName;
        var newName = field.value.trim();
        var duplicate = Array.from(managerList.querySelectorAll('.cmr-name')).some(function (node) { return text(node) === newName; });
        if (!newName) return;
        if (duplicate) { alert('类别已存在'); return; }
        rows.forEach(function (item) { if (item.dataset.cat === oldName) item.dataset.cat = newName; });
        var nameNode = document.createElement('span');
        nameNode.className = 'cmr-name';
        nameNode.textContent = newName;
        field.replaceWith(nameNode);
        edit.textContent = '编辑';
        renderCategories(activeCategory === oldName ? newName : activeCategory);
        return;
      }
      var nameNode = row.querySelector('.cmr-name');
      var input = document.createElement('input');
      input.className = 'input cmr-edit-input';
      input.value = text(nameNode);
      input.dataset.oldName = input.value;
      nameNode.replaceWith(input);
      edit.textContent = '保存';
      input.focus();
      input.select();
    });

    renderCategories();
    syncSelection();
  });
})();
