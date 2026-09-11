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
      rowChecks.forEach(function (checkbox) { checkbox.checked = false; });
      syncSelection();
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

    root.querySelectorAll('[data-open]').forEach(function (trigger) {
      if (trigger.dataset.open !== drawer.id) return;
      trigger.removeAttribute('data-open');
      trigger.addEventListener('click', function () {
        UI.openCategoryManager({
          items: Array.from(managerList.querySelectorAll('.catmgr-row')).map(function (row) {
            var name = text(row.querySelector('.cmr-name'));
            return {id:name, name:name, count:categoryCount(name)};
          }),
          onConfirm: function (items) {
            var renamed = new Map(items.map(function (item) { return [item.id, item.name]; }));
            rows.forEach(function (row) {
              if (renamed.has(row.dataset.cat)) row.dataset.cat = renamed.get(row.dataset.cat);
            });
            managerList.innerHTML = items.map(function (item) {
              return '<div class="catmgr-row"><span class="cmr-name">' + UI.escape(item.name) + '</span><span class="cmr-count">' + item.count + ' 条</span></div>';
            }).join('');
            renderCategories(renamed.get(activeCategory) || '');
          }
        });
      });
    });

    renderCategories();
    syncSelection();
  });
})();
