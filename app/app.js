/* ============================================================
   人才发展系统 · 静态原型共享脚本
   职责：页面布局、抽屉/弹窗、原型数据与轻交互；导航由 navigation.js 维护。
   调交互 → 只改本文件
   ============================================================ */

function initPageLayout() {
  const main = document.querySelector('main.content');
  if (!main) return;
  document.body.classList.toggle('layout-wizard', Boolean(main.querySelector('[data-wizard]')));
  document.body.classList.toggle('layout-detail', Boolean(main.querySelector('.detail-layout')));
  document.body.classList.toggle('layout-dashboard', Boolean(main.querySelector('.kpi-row, .dash-grid, .matrix')));
  document.body.classList.toggle('layout-data', Boolean(main.querySelector('.filter-bar, table.t')));
  document.body.classList.toggle('layout-progress', Boolean(main.querySelector('.progress-stages')));
}

/* ---------- 列表工作台：左侧仅放范围树，右侧依次放筛选 / 操作 / 表格 ---------- */
function initListWorkbenches() {
  document.querySelectorAll('.cat-layout, .review-layout').forEach(function (layout) {
    layout.classList.add('list-workbench', 'list-workbench-tree');
  });

  var scopeConfigs = {
    'positions.html': {
      title: '岗位类别',
      selectIndex: 0,
      items: [
        { label: '全部', value: '全部', count: 9 },
        { label: '研发', value: '研发', count: 4 },
        { label: '销售', value: '销售', count: 3 },
        { label: '职能', value: '职能', count: 2 }
      ]
    },
    'talent-list.html': {
      title: '所属部门',
      hideSelectIndex: 0,
      items: [
        { label: '全部', value: '全部', count: 5 },
        { label: '研发中心', count: 3, keywords: ['架构师', '算法工程师', '测试工程师'] },
        { label: '销售中心', count: 1, keywords: ['区域销售总监'] },
        { label: '职能中台', count: 1, keywords: ['财务分析经理'] }
      ]
    }
  };

  document.querySelectorAll('main[data-list-mode="filters"]').forEach(function (main) {
    var filter = Array.from(main.children).find(function (node) { return node.classList.contains('filter-bar'); });
    var tableCard = Array.from(main.children).find(function (node) {
      return node.classList.contains('card') && node.querySelector('table.t');
    });
    if (!filter || !tableCard) return;

    var workbench = document.createElement('div');
    workbench.className = 'list-workbench list-workbench-filter';
    var rail = document.createElement('aside');
    rail.className = 'list-rail';
    var pageFile = location.pathname.split('/').pop();
    var scopeConfig = scopeConfigs[pageFile] || { title: '数据范围', items: [{ label: '全部' }] };
    rail.setAttribute('aria-label', scopeConfig.title);
    var railHead = document.createElement('div');
    railHead.className = 'list-rail-head';
    railHead.textContent = scopeConfig.title;
    var listMain = document.createElement('section');
    listMain.className = 'list-main';

    var segment = main.querySelector(':scope > .flex .segment');
    var segmentRow = segment && segment.parentElement;
    if (segment) {
      rail.appendChild(segment);
    }
    rail.appendChild(railHead);

    var scopeState = { item: scopeConfig.items[0] };
    var scopeList = document.createElement('div');
    scopeList.className = 'list-scope-tree';
    scopeConfig.items.forEach(function (item, index) {
      var scopeItem = document.createElement('button');
      scopeItem.type = 'button';
      scopeItem.className = `cat-tree-item list-scope-item${index === 0 ? ' active' : ''}`;
      scopeItem.innerHTML = `<span>${item.label}</span>`;
      scopeList.appendChild(scopeItem);
      scopeItem.addEventListener('click', function () {
        scopeList.querySelectorAll('.list-scope-item').forEach(function (node) { node.classList.remove('active'); });
        scopeItem.classList.add('active');
        scopeState.item = item;
        var scopeSelect = scopeConfig.selectIndex == null ? null : filter.querySelectorAll('select')[scopeConfig.selectIndex];
        if (scopeSelect) scopeSelect.value = item.value || '全部';
        listMain.querySelectorAll('table.t tbody tr:not(.row-empty)').forEach(function (row) { row.style.display = ''; });
        filter.querySelector('.actions button')?.click();
      });
    });
    rail.appendChild(scopeList);

    var hiddenSelectIndex = scopeConfig.hideSelectIndex == null ? scopeConfig.selectIndex : scopeConfig.hideSelectIndex;
    var scopedSelect = hiddenSelectIndex == null ? null : filter.querySelectorAll('select')[hiddenSelectIndex];
    if (scopedSelect) scopedSelect.closest('.field')?.classList.add('scope-field-hidden');

    var breadcrumb = main.querySelector(':scope > .breadcrumb');
    main.insertBefore(workbench, breadcrumb ? breadcrumb.nextSibling : main.firstChild);
    workbench.appendChild(rail);
    workbench.appendChild(listMain);
    listMain.appendChild(filter);

    Array.from(main.children).forEach(function (node) {
      if (node === breadcrumb || node === workbench || node === filter || node === segmentRow) return;
      listMain.appendChild(node);
    });

    if (scopeConfig.selectIndex == null) {
      var table = listMain.querySelector('table.t');
      var queryButtons = filter.querySelectorAll('.actions button');
      var applyScope = function () {
        if (!table) return;
        var item = scopeState.item || {};
        table.querySelectorAll('tbody tr:not(.row-empty)').forEach(function (row) {
          if (row.style.display === 'none') return;
          var text = row.textContent;
          var hasKeyword = !item.keywords || item.keywords.some(function (keyword) { return text.includes(keyword); });
          var hasExcluded = item.excludeKeywords && item.excludeKeywords.some(function (keyword) { return text.includes(keyword); });
          row.style.display = hasKeyword && !hasExcluded ? '' : 'none';
        });
      };
      queryButtons.forEach(function (button) {
        button.addEventListener('click', function () { setTimeout(applyScope, 0); });
      });
    }

    if (segmentRow && !segmentRow.children.length) segmentRow.remove();
    document.body.classList.add('layout-list');
  });

  if (document.querySelector('.list-workbench')) {
    document.body.classList.add('layout-list');
    requestAnimationFrame(syncListWorkbenchHeights);
    window.addEventListener('resize', syncListWorkbenchHeights);
  }
}

function syncListWorkbenchHeights() {
  var compact = window.matchMedia('(max-width: 820px)').matches;
  document.querySelectorAll('.list-workbench').forEach(function (workbench) {
    if (compact) {
      workbench.style.removeProperty('--list-workbench-height');
      return;
    }
    var rect = workbench.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var top = rect.top;
    var height = Math.max(520, window.innerHeight - top - 24);
    workbench.style.setProperty('--list-workbench-height', `${height}px`);
  });
}

/* ---------- 列表宽表：数据区横向滚动 + 右侧冻结操作列 ---------- */
function initFrozenListTables() {
  document.querySelectorAll('.list-workbench .table-wrap > table.t').forEach(function (table) {
    table.classList.add('native-sticky-table');
  });
}

/* ---------- ② 抽屉 / 弹窗开关 ---------- */
// 用法：触发元素加 data-open="drawerId" / data-close / data-closest
let activeOverlayTrigger = null;

function initOverlays() {
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) { activeOverlayTrigger = opener; openOverlay(opener.dataset.open); return; }
    const closer = e.target.closest('[data-close]');
    if (closer) { closeAllOverlays(); return; }
    // 点遮罩空白关闭
    if (e.target.classList.contains('overlay') || e.target.classList.contains('modal')) {
      closeAllOverlays();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAllOverlays(); return; }
    if (e.key !== 'Tab') return;
    const current = document.querySelector('.drawer.show, .modal.show');
    if (!current) return;
    const focusable = [...current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);
    if (!focusable.length) { e.preventDefault(); current.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
function openOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  el.removeAttribute('aria-hidden');
  el.inert = false;
  document.body.classList.add('overlay-open');
  let ov = document.getElementById('overlay');
  if (!ov) { ov = document.createElement('div'); ov.id = 'overlay'; ov.className = 'overlay'; document.body.appendChild(ov); }
  ov.classList.add('show');
  requestAnimationFrame(() => {
    const first = el.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]');
    (first || el).focus();
  });
}
function closeAllOverlays() {
  document.querySelectorAll('.drawer.show, .modal.show').forEach(el => {
    el.classList.remove('show');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;
  });
  document.getElementById('overlay')?.classList.remove('show');
  document.body.classList.remove('overlay-open');
  activeOverlayTrigger?.focus();
  activeOverlayTrigger = null;
}

/* ---------- ③ 全站语义与键盘可用性 ---------- */
function initAccessibility() {
  const main = document.querySelector('main.content, main');
  if (main) {
    if (!main.id) main.id = 'main-content';
    if (!document.querySelector('.skip-link')) {
      const skipLink = document.createElement('a');
      skipLink.className = 'skip-link';
      skipLink.href = `#${main.id}`;
      skipLink.textContent = '跳到主要内容';
      document.body.prepend(skipLink);
    }
  }

  document.querySelectorAll('.primary-item.active, .business-item.active').forEach(link => {
    link.setAttribute('aria-current', 'page');
  });

  document.querySelectorAll('.business-item[style*="not-allowed"]').forEach(link => {
    link.setAttribute('aria-disabled', 'true');
    link.tabIndex = -1;
  });

  document.querySelectorAll('.field').forEach((field, index) => {
    const label = field.querySelector(':scope > label');
    const control = field.querySelector('input, select, textarea');
    if (!label || !control) return;
    if (!control.id) control.id = `field-control-${index + 1}`;
    if (!label.htmlFor) label.htmlFor = control.id;
  });

  document.querySelectorAll('input, select, textarea').forEach((control, index) => {
    if (control.getAttribute('aria-label') || control.labels?.length) return;
    let label = '';
    const explicit = control.closest('.field')?.querySelector('label');
    if (explicit) label = explicit.textContent.trim();
    if (!label && control.closest('.pg-jumper')) label = '前往页码';
    if (!label && control.placeholder) label = control.placeholder.trim();
    if (!label && (control.type === 'checkbox' || control.type === 'radio')) {
      const context = control.closest('label, tr, .t-node, .tree-node, .checkbox, .radio');
      const contextText = context?.textContent.replace(/\s+/g, ' ').trim();
      label = contextText ? `选择${contextText}` : '选择此项';
    }
    if (!label && control.tagName === 'SELECT') label = '选择条件';
    if (!label && control.type === 'date') label = '选择日期';
    if (!label && control.type === 'number') label = '输入数值';
    if (!label) label = `输入内容 ${index + 1}`;
    control.setAttribute('aria-label', label);
  });

  document.querySelectorAll('.drawer, .modal').forEach((el, index) => {
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;
    const title = el.querySelector('h3');
    if (title) {
      if (!title.id) title.id = `overlay-title-${index + 1}`;
      el.setAttribute('aria-labelledby', title.id);
    }
  });

  document.querySelectorAll('button.icon-close').forEach(btn => {
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', '关闭');
    btn.querySelector('svg')?.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('button.icon-btn').forEach(btn => {
    if (btn.getAttribute('aria-label')) return;
    if (btn.title) btn.setAttribute('aria-label', btn.title);
    else if (btn.closest('.topbar')) btn.setAttribute('aria-label', '查看通知');
    else btn.setAttribute('aria-label', '更多操作');
  });

  document.querySelectorAll('button:not([type])').forEach(button => {
    button.type = 'button';
  });

  document.querySelectorAll('.cat-tree-item, [data-toast]:not(a):not(button)').forEach(el => {
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        el.click();
      }
    });
  });

  document.querySelectorAll('.pm-tabs').forEach(group => {
    group.setAttribute('role', 'tablist');
    group.querySelectorAll('.pm-tab').forEach(tab => {
      tab.setAttribute('role', 'tab');
      tab.tabIndex = 0;
      tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
      const activate = () => {
        group.querySelectorAll('.pm-tab').forEach(item => {
          item.classList.remove('active');
          item.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      };
      tab.addEventListener('click', activate);
      tab.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
      });
    });
  });
}

/* ---------- ④ 轻交互：Segment 切换、Tab、复用小工具 ---------- */
function initSegments() {
  document.querySelectorAll('.segment').forEach(seg => {
    seg.setAttribute('role', 'group');
    const apply = () => {
      const active = seg.querySelector('button.active');
      seg.querySelectorAll('button').forEach(button => {
        button.setAttribute('aria-pressed', button === active ? 'true' : 'false');
      });
      const target = seg.dataset.target;
      if (active && target && active.dataset.filter) applyViewFilter(target, active.dataset.filter);
    };
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      apply();
    });
    apply(); // 初始默认视图（F04 默认关键）
  });
}
// F04 双视图：全部 / 关键（按按钮 data-filter 过滤行）
function applyViewFilter(tableId, filter) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.dataset.view = filter;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(r => {
    if (filter === 'all') { r.style.display = ''; return; }
    r.style.display = r.dataset.key === 'true' ? '' : 'none';
  });
}

/* ---------- 表格行内「标记关键」联动（F02 抽屉 / F04 编辑）占位 ---------- */
function initKeyToggle() {
  document.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-key-toggle]');
    if (!cb) return;
    const row = cb.closest('tr');
    if (row) row.dataset.key = cb.checked;
  });
}

/* ---------- ⑤ 步骤条向导（F01 / F02 复用）---------- */
// 容器加 data-wizard；步骤项 .step；面板 .step-panel[data-panel]；底部 [data-step-prev]/[data-step-next]/[data-step-submit]
function initSteps() {
  document.querySelectorAll('[data-wizard]').forEach(wiz => {
    // 步骤/面板/连线带 hidden 属性时视为"暂不开放"，自动跳过并重新编号
    const steps = [...wiz.querySelectorAll('.steps .step')].filter(s => !s.hidden);
    const panels = [...wiz.querySelectorAll('.step-panel')].filter(p => !p.hidden);
    const total = steps.length;
    let cur = Number(wiz.dataset.start || 1);
    const btnPrev = wiz.querySelector('[data-step-prev]');
    const btnNext = wiz.querySelector('[data-step-next]');
    const btnSubmit = wiz.querySelector('[data-step-submit]');
    const lines = [...wiz.querySelectorAll('.steps .line')].filter(ln => !ln.hidden);
    steps.forEach((step, index) => {
      step.setAttribute('role', 'button');
      step.tabIndex = 0;
      step.setAttribute('aria-label', `第 ${index + 1} 步：${step.textContent.trim()}`);
      step.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          step.click();
        }
      });
    });
    function render() {
      steps.forEach((s, i) => {
        const n = i + 1;
        const idxEl = s.querySelector('.idx');
        if (idxEl) idxEl.textContent = n;
        s.classList.toggle('active', n === cur);
        s.classList.toggle('done', n < cur);
        if (n === cur) s.setAttribute('aria-current', 'step');
        else s.removeAttribute('aria-current');
      });
      lines.forEach((ln, i) => ln.classList.toggle('done', (i + 1) < cur));
      panels.forEach((p, i) => {
        const visible = (i + 1) === cur;
        p.classList.toggle('show', visible);
        p.hidden = !visible;
        p.inert = !visible;
      });
      if (btnPrev) btnPrev.style.visibility = cur === 1 ? 'hidden' : 'visible';
      if (btnNext) btnNext.style.display = (cur === total) ? 'none' : '';
      if (btnSubmit) btnSubmit.style.display = (cur === total) ? '' : 'none';
      wiz.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    steps.forEach((s, i) => s.addEventListener('click', () => {
      if (wiz.hasAttribute('data-free-navigation') || i + 1 <= cur + 1) {
        cur = i + 1;
        render();
      }
    }));
    if (btnNext) btnNext.addEventListener('click', () => { if (cur < total) { cur++; render(); } });
    if (btnPrev) btnPrev.addEventListener('click', () => { if (cur > 1) { cur--; render(); } });
    render();
  });
}

/* ---------- ⑥ Tab 切换 ---------- */
// 容器 [data-tabs]；按钮 .tab-btn[data-tab]；面板 .tab-panel[data-tab]
function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const tabs = group.querySelectorAll('.tab-btn');
    const panels = group.querySelectorAll('.tab-panel');
    const tabList = group.querySelector('.tab-btns');
    if (tabList) tabList.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      const panel = Array.from(panels).find(item => item.dataset.tab === tab.dataset.tab);
      tab.setAttribute('role', 'tab');
      if (!tab.id) tab.id = `tab-${index + 1}-${tab.dataset.tab || 'item'}`;
      if (panel) {
        if (!panel.id) panel.id = `panel-${index + 1}-${tab.dataset.tab || 'item'}`;
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });
    const render = activeTab => {
      tabs.forEach(tab => {
        const active = tab === activeTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => {
        const visible = panel.dataset.tab === activeTab.dataset.tab;
        panel.classList.toggle('show', visible);
        panel.hidden = !visible;
        panel.inert = !visible;
      });
    };
    const initial = Array.from(tabs).find(tab => tab.classList.contains('active')) || tabs[0];
    if (initial) render(initial);
    tabs.forEach(t => t.addEventListener('click', () => {
      render(t);
      requestAnimationFrame(syncListWorkbenchHeights);
    }));
    tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else nextIndex = (index - 1 + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      render(nextTab);
      nextTab.focus();
      requestAnimationFrame(syncListWorkbenchHeights);
    }));
  });
}

/* ---------- ⑦ 页面内分区切换 ---------- */
function initAnchorTabs() {
  document.querySelectorAll('.anchor-nav, .business-nav[data-anchor-tabs]').forEach(nav => {
    if (nav.querySelector('[data-std-tab], [data-tc-tab]')) return;
    const items = Array.from(nav.querySelectorAll('.a-item, .business-item[data-tab]'));
    if (!items.length) return;
    const main = document.querySelector('.detail-main');
    const panels = main ? Array.from(main.querySelectorAll(':scope > .d-section')) : [];
    function activate(id) {
      const ok = items.some(i => i.dataset.tab === id);
      const target = ok ? id : (nav.dataset.default || (items[0] && items[0].dataset.tab));
      items.forEach(i => {
        const active = i.dataset.tab === target;
        i.classList.toggle('active', active);
        if (active) i.setAttribute('aria-current', 'page');
        else i.removeAttribute('aria-current');
      });
      panels.forEach(p => {
        const visible = p.dataset.section === target;
        p.classList.toggle('active', visible);
        p.hidden = !visible;
        p.inert = !visible;
      });
    }
    items.forEach(it => it.addEventListener('click', e => {
      e.preventDefault();
      activate(it.dataset.tab);
      if (history.replaceState) history.replaceState(null, '', '#' + it.dataset.tab);
      // 切分区回到内容顶部：避免 sticky 菜单因分区高度变化而上下跳动
      const scroller = document.querySelector('.content');
      if (scroller) scroller.scrollTop = 0;
    }));
    activate((location.hash || '').replace('#', ''));
  });
}

/* ---------- ⑧ 气泡图：融球动效（内层浮动 + 入场弹出）---------- */
function initBubbles() {
  var bubs = document.querySelectorAll('.chart-svg .bub');
  if (!bubs.length) return;
  var svgNS = 'http://www.w3.org/2000/svg';
  bubs.forEach(function (b, i) {
    var inner = document.createElementNS(svgNS, 'g');
    inner.setAttribute('class', 'bub-inner');
    while (b.firstChild) inner.appendChild(b.firstChild);
    b.appendChild(inner);
    inner.style.animationDuration = (4 + Math.random() * 2.5).toFixed(2) + 's';
    inner.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
    setTimeout(function () { b.classList.add('is-in'); }, 80 + i * 70);
  });
}

/* ---------- ⑨ 组织结构矩阵：按人数热力 ---------- */
const ORG_GRID_DRAFT_KEY = 'talent-org-grid-draft-v1';
const ORG_GRID_ACTIVE_KEY = 'talent-org-grid-active-v1';

function normalizeOrgGridConfig(config) {
  config = config || {};
  return {
    sequenceCount: Math.min(5, Math.max(1, Number(config.sequenceCount || config.sequence_count) || 5)),
    levelCount: Math.min(5, Math.max(1, Number(config.levelCount || config.level_count) || 5))
  };
}

function readOrgGridConfig(scope) {
  var key = scope === 'active' ? ORG_GRID_ACTIVE_KEY : ORG_GRID_DRAFT_KEY;
  try { return normalizeOrgGridConfig(JSON.parse(localStorage.getItem(key) || 'null')); }
  catch (_error) { return normalizeOrgGridConfig(); }
}

function writeOrgGridConfig(scope, config) {
  var value = normalizeOrgGridConfig(config);
  var key = scope === 'active' ? ORG_GRID_ACTIVE_KEY : ORG_GRID_DRAFT_KEY;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_error) {}
  return value;
}

window.readOrgGridConfig = readOrgGridConfig;
window.writeOrgGridConfig = writeOrgGridConfig;

function orgGridLabels(type, count) {
  if (type === 'sequence') return [
    { name: '研发', sub: '技术序列', code: 'RD' },
    { name: '销售', sub: '市场序列', code: 'SA' },
    { name: '职能', sub: '支持序列', code: 'FN' },
    { name: '产品', sub: '产品序列', code: 'PD' },
    { name: '运营', sub: '运营序列', code: 'OP' }
  ].slice(0, count);
  var sets = {
    1: [['统一层级', '统一归类']],
    2: [['初级', '独立执行'], ['高级', '专家 / 决策']],
    3: [['初级', '独立执行'], ['中级', '带组 / 资深'], ['高级', '专家 / 决策']],
    4: [['初级', '独立执行'], ['中级', '熟练贡献'], ['高级', '带组 / 资深'], ['专家', '专业决策']],
    5: [['基础', '支持执行'], ['初级', '独立执行'], ['中级', '熟练贡献'], ['高级', '带组 / 资深'], ['专家', '专业决策']]
  };
  return sets[count].map(function (item, index) { return { name: item[0], sub: item[1], order: index + 1 }; });
}

function orgGridCells(config) {
  var total = config.sequenceCount * config.levelCount;
  var seeds = [
    { jobs: 3, people: 9 }, { jobs: 2, people: 6 }, { jobs: 7, people: 36 }, { jobs: 6, people: 28 },
    { jobs: 4, people: 14 }, { jobs: 4, people: 18 }, { jobs: 5, people: 42 }, { jobs: 3, people: 12 }
  ];
  if (total === 1) return [{ jobs: 34, people: 165 }];
  var result = new Array(total).fill(null);
  if (config.sequenceCount === 3 && config.levelCount === 3) {
    [seeds[0], seeds[1], null, seeds[2], seeds[3], seeds[4], seeds[5], seeds[6], seeds[7]].forEach(function (item, index) { result[index] = item; });
    return result;
  }
  if (total < seeds.length) {
    seeds.forEach(function (seed, index) {
      var target = Math.round(index * (total - 1) / Math.max(1, seeds.length - 1));
      if (!result[target]) result[target] = { jobs: 0, people: 0 };
      result[target].jobs += seed.jobs; result[target].people += seed.people;
    });
    return result;
  }
  // 原型示例：34 个岗位、165 人；按岗位明细汇总，非真实企业数据。
  // 行从专家到基础，列为研发、销售、职能、产品、运营。
  var profile = [
    [[['技术架构师', 2, 4.8]], null, null, [['产品专家', 1, 4.7]], null],
    [[['技术负责人', 4, 4.4], ['高级算法工程师', 5, 4.2]], [['区域销售总监', 5, 4.3]], [['人力资源经理', 4, 4.1]], [['高级产品经理', 6, 4.2]], [['运营经理', 4, 4.1]]],
    [[['后端开发工程师', 10, 3.6], ['前端开发工程师', 6, 3.5], ['测试工程师', 4, 3.2]], [['大客户销售经理', 8, 3.7], ['渠道经理', 6, 3.5]], [['人力资源专员', 5, 3.3], ['财务分析师', 3, 3.6]], [['产品经理', 7, 3.6], ['交互设计师', 4, 3.4]], [['产品运营', 4, 3.4], ['客户成功专员', 3, 3.3]]],
    [[['初级开发工程师', 8, 2.7], ['初级测试工程师', 7, 2.5]], [['销售代表', 7, 2.8], ['渠道专员', 4, 2.6]], [['招聘专员', 4, 2.7], ['行政专员', 3, 2.4]], [['助理产品经理', 8, 2.8]], [['内容运营专员', 6, 2.6]]],
    [[['研发助理', 7, 1.9]], [['销售助理', 6, 1.8], ['商务助理', 3, 1.9]], [['财务助理', 6, 1.8]], [['产品研究助理', 3, 1.9]], [['运营助理', 1, 1.8], ['客服助理', 1, 1.7]]]
  ];
  profile.forEach(function (row, rowIndex) {
    row.forEach(function (positions, columnIndex) {
      if (!positions) return;
      var targetRow = Math.floor(rowIndex * config.levelCount / 5);
      var targetColumn = Math.floor(columnIndex * config.sequenceCount / 5);
      var target = targetRow * config.sequenceCount + targetColumn;
      if (!result[target]) result[target] = { jobs: 0, people: 0, positions: [] };
      result[target].jobs += positions.length;
      result[target].people += positions.reduce(function (sum, position) { return sum + position[1]; }, 0);
      result[target].positions = result[target].positions.concat(positions);
    });
  });
  return result;
}

function renderOrgMatrix(matrix) {
  var scope = matrix.dataset.orgMatrix === 'active' ? 'active' : 'draft';
  var config = readOrgGridConfig(scope);
  var sequences = orgGridLabels('sequence', config.sequenceCount);
  var levels = orgGridLabels('level', config.levelCount);
  var cells = orgGridCells(config);
  var cellIndex = 0;
  matrix.innerHTML = '';
  matrix.style.gridTemplateColumns = '120px repeat(' + config.sequenceCount + ', minmax(148px, 1fr))';
  matrix.style.minWidth = (120 + config.sequenceCount * 148 + config.sequenceCount * 4) + 'px';
  levels.slice().reverse().forEach(function (level) {
    var rowHead = document.createElement('div');
    rowHead.className = 'row-head';
    rowHead.innerHTML = '<div class="rh"></div>';
    rowHead.querySelector('.rh').textContent = level.name;
    matrix.appendChild(rowHead);
    sequences.forEach(function (sequence) {
      var seed = cells[cellIndex++];
      if (!seed) {
        var empty = document.createElement('div'); empty.className = 'group empty-cell';
        empty.innerHTML = '<div class="g-name">暂无岗位</div>';
        matrix.appendChild(empty); return;
      }
      var group = document.createElement(matrix.dataset.orgMatrixInteractive === 'false' ? 'div' : 'button');
      group.className = 'group';
      if (group.tagName === 'BUTTON') {
        group.type = 'button'; group.dataset.open = 'drawer-cell';
        if (config.sequenceCount === 5 && config.levelCount === 5) {
          group.addEventListener('click', function () { renderOrgCellDetail(seed, sequence, level); });
        }
      }
      group.innerHTML = '<div><div class="g-name"></div><div class="g-stats"><span><b></b> 岗位</span><span><b></b> 人</span></div></div>';
      group.querySelector('.g-name').textContent = sequence.name + '·' + level.name;
      group.querySelectorAll('.g-stats b')[0].textContent = seed.jobs;
      group.querySelectorAll('.g-stats b')[1].textContent = seed.people;
      matrix.appendChild(group);
    });
  });
  var corner = document.createElement('div'); corner.className = 'corner-cell'; corner.innerHTML = '<div class="ax">业务分权 ↑<br>业务分工 →</div>'; matrix.appendChild(corner);
  sequences.forEach(function (sequence) {
    var head = document.createElement('div'); head.className = 'col-head';
    head.innerHTML = '<span></span>';
    head.querySelector('span').textContent = sequence.name;
    matrix.appendChild(head);
  });
  document.querySelectorAll('[data-org-grid-version="' + scope + '"]').forEach(function (node) {
    node.textContent = config.sequenceCount + '×' + config.levelCount;
  });
  var prefix = '[data-org-grid-scope="' + scope + '"] ';
  document.querySelectorAll(prefix + '[data-org-kpi-sequence]').forEach(function (node) { node.textContent = config.sequenceCount; });
  document.querySelectorAll(prefix + '[data-org-kpi-level]').forEach(function (node) { node.textContent = config.levelCount; });
  document.querySelectorAll(prefix + '[data-org-kpi-group]').forEach(function (node) { node.textContent = cells.filter(Boolean).length; });
}

function renderOrgCellDetail(seed, sequence, level) {
  var drawer = document.getElementById('drawer-cell');
  if (!drawer) return;
  drawer.querySelector('.m-head h3').textContent = sequence.name + '·' + level.name;
  drawer.querySelector('.m-head .text-sm').textContent = seed.jobs + ' 岗位 · ' + seed.people + ' 人';
  drawer.querySelector('thead').innerHTML = '<tr><th>岗位</th><th>人数</th><th>AI 序列</th><th>AI 层级</th><th>岗评总分</th><th>操作</th></tr>';
  var tbody = drawer.querySelector('tbody');
  tbody.innerHTML = '';
  seed.positions.forEach(function (position) {
    var row = document.createElement('tr');
    [position[0], position[1], sequence.name, level.name, position[2].toFixed(1) + ' / 5'].forEach(function (value) {
      var cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell);
    });
    var actions = document.createElement('td'); actions.className = 'ops';
    var evidence = document.createElement('button');
    evidence.type = 'button'; evidence.className = 'btn-text btn-sm';
    evidence.dataset.open = 'drawer-evidence'; evidence.textContent = '查看依据';
    evidence.addEventListener('click', function () {
      var target = document.getElementById('drawer-evidence');
      target.querySelector('.m-head h3').textContent = '归类依据 · ' + position[0];
      var body = target.querySelector('.m-body');
      body.innerHTML = '<div class="table-wrap"><table class="t"><thead><tr><th>方法</th><th>分析结果</th><th>主要依据</th></tr></thead><tbody><tr><td>岗位评价法</td><td data-score></td><td>任务复杂性、专业要求、影响范围与责任程度</td></tr><tr><td>结构分析法</td><td data-structure></td><td>岗位职责、组织位置及上下游协作关系</td></tr></tbody></table></div><div class="flex between mt-md"><b>建议归属</b><b data-assignment></b></div><p class="text-sm mt-md" data-reason></p>';
      body.querySelector('[data-score]').textContent = position[2].toFixed(1) + ' / 5';
      body.querySelector('[data-structure]').textContent = sequence.name + '序列';
      body.querySelector('[data-assignment]').textContent = sequence.name + ' · ' + level.name;
      body.querySelector('[data-reason]').textContent = position[0] + '承担' + sequence.name + '相关职责，责任范围为' + level.sub + '，归入' + sequence.name + '·' + level.name + '岗位族。';
    });
    actions.appendChild(evidence);
    if (document.getElementById('drawer-calib') && position[0] === '测试工程师') {
      var calibrate = document.createElement('button');
      calibrate.type = 'button'; calibrate.className = 'btn-text btn-sm';
      calibrate.dataset.open = 'drawer-calib'; calibrate.textContent = '建议校准'; actions.appendChild(calibrate);
    }
    row.appendChild(actions); tbody.appendChild(row);
  });
}

function initOrgGridConfiguration() {
  var configurator = document.querySelector('[data-org-grid-config]');
  if (configurator) {
    var active = readOrgGridConfig('active');
    var config = writeOrgGridConfig('draft', active);
    var sequenceInputs = configurator.querySelectorAll('[name="org-sequence-count"]');
    var levelInputs = configurator.querySelectorAll('[name="org-level-count"]');
    var preview = configurator.querySelector('[data-org-grid-mini]');
    var copy = configurator.querySelector('[data-org-grid-copy]');
    function render() {
      sequenceInputs.forEach(function (input) { input.checked = Number(input.value) === config.sequenceCount; });
      levelInputs.forEach(function (input) { input.checked = Number(input.value) === config.levelCount; });
      preview.style.gridTemplateColumns = 'repeat(' + config.sequenceCount + ', 1fr)';
      preview.innerHTML = new Array(config.sequenceCount * config.levelCount).fill('<span></span>').join('');
      copy.textContent = config.sequenceCount + ' 项业务分工 × ' + config.levelCount + ' 级业务分权，共 ' + (config.sequenceCount * config.levelCount) + ' 宫格';
      document.querySelectorAll('[data-org-grid-summary]').forEach(function (node) { node.textContent = config.sequenceCount + ' 项业务分工 × ' + config.levelCount + ' 级业务分权（' + (config.sequenceCount * config.levelCount) + ' 宫格）'; });
    }
    configurator.addEventListener('change', function (event) {
      if (event.target.name === 'org-sequence-count') config.sequenceCount = Number(event.target.value);
      if (event.target.name === 'org-level-count') config.levelCount = Number(event.target.value);
      config = writeOrgGridConfig('draft', config); render();
    });
    render();
  }
  document.querySelectorAll('[data-org-matrix]').forEach(renderOrgMatrix);
  var draft = readOrgGridConfig('draft');
  document.querySelectorAll('[data-org-sequence-options]').forEach(function (select) {
    select.innerHTML = orgGridLabels('sequence', draft.sequenceCount).map(function (item) { return '<option>' + item.name + '</option>'; }).join('');
  });
  document.querySelectorAll('[data-org-level-options]').forEach(function (select) {
    select.innerHTML = orgGridLabels('level', draft.levelCount).slice().reverse().map(function (item) { return '<option>' + item.name + '</option>'; }).join('');
  });
}

function initHeatmap() {
  document.querySelectorAll('[data-heat]').forEach(function (m) {
    var cells = m.querySelectorAll('.group:not(.empty-cell)');
    var vals = [];
    var heatColors = [
      '#F0F6FF',
      '#DCEAFF',
      '#B8D5FF',
      '#85B7FF',
      '#4D91FF'
    ];
    cells.forEach(function (c) {
      var n = 0;
      c.querySelectorAll('.g-stats span').forEach(function (s) { if (s.textContent.indexOf('人') >= 0) { var b = s.querySelector('b'); if (b) n = +b.textContent || 0; } });
      c._hc = n; vals.push(n);
    });
    var max = Math.max.apply(null, vals);
    if (!max) return;
    cells.forEach(function (c) {
      var level = Math.min(heatColors.length - 1, Math.max(0, Math.ceil((c._hc / max) * heatColors.length) - 1));
      c.style.background = heatColors[level];
      c.dataset.heatLevel = level + 1;
    });
  });
}

/* ---------- ⑩ 列表过滤（通用，data-filter-bar 驱动）---------- */
function initListFilter() {
  document.querySelectorAll('[data-filter-bar]').forEach(function (bar) {
    var container = bar.closest('.tab-panel, main, .review-main');
    if (!container) return;
    var tbl = container.querySelector('table.t');
    if (!tbl) return;
    var inp = bar.querySelector('input');
    var sels = bar.querySelectorAll('select');
    var btns = bar.querySelectorAll('.actions button');
    function run() {
      var q = (inp && inp.value || '').trim().toLowerCase();
      var selVals = [];
      sels.forEach(function (s) { if (s.value && s.value !== '全部') selVals.push(s.value.toLowerCase()); });
      var any = false;
      tbl.querySelectorAll('tbody tr').forEach(function (tr) {
        if (tr.classList.contains('row-empty')) return;
        var text = tr.textContent.toLowerCase();
        var match = !q || text.indexOf(q) >= 0;
        selVals.forEach(function (v) { if (match && text.indexOf(v) < 0) match = false; });
        if (match) any = true;
        tr.style.display = match ? '' : 'none';
      });
      var e = tbl.querySelector('tr.row-empty'); if (e) e.style.display = any ? 'none' : '';
    }
    if (btns[0]) btns[0].addEventListener('click', run);
    if (btns[1]) btns[1].addEventListener('click', function () { if (inp) inp.value = ''; sels.forEach(function (s) { s.selectedIndex = 0; }); run(); });
  });
}

/* ---------- Toast 轻提示 ---------- */
// 用法：元素加 data-toast="文案" 点击即弹；代码可直接调 showToast(msg)
function showToast(msg) {
  const dialog = document.querySelector('dialog.ui-dialog[open]');
  if (dialog) { dialog.showError(msg); return; }
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="M12 16v-4M12 8h.01"/></svg><span></span>';
  el.querySelector('span').textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(() => el.remove(), 300); }, 2200);
}
function initToasts() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toast]');
    if (!t) return;
    e.preventDefault();
    showToast(t.dataset.toast);
  });
}

/* ---------- AI 生成过渡（通用：岗位标准 / 学习方案 复用）---------- */
// showAiGen({ trigger, title, subtitle, footOn, footDone, toast, steps:[{node,label,icon,content,typed}], onDone })
function showAiGen(opts) {
  opts = opts || {};
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function typeInto(el, text, ms) {
    el.textContent = ''; var c = document.createElement('span'); c.className = 'ai-caret'; el.appendChild(c);
    return (async function () {
      for (var i = 0; i < text.length; i++) { el.insertBefore(document.createTextNode(text[i]), c); await sleep(ms || 24); }
      await sleep(280);
    })();
  }
  function rowHtml(step) {
    return '<div class="ai-res"><div class="r-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' + step.icon + '</svg></div><div class="r-body"><div class="r-label">' + step.label + '</div><div class="ai-skel"><div class="sk w80"></div><div class="sk w55"></div></div><div class="r-content">' + step.content + '</div></div></div>';
  }
  (async function () {
    if (opts.trigger) { opts.trigger.disabled = true; opts.trigger.style.opacity = .6; }
    var ov = document.createElement('div'); ov.className = 'ai-gen-overlay';
    ov.innerHTML = '<div class="ai-gen-card"><div class="ai-gen-header"><div class="ai-gen-orb"></div><div><div class="ai-gen-title">' + opts.title + '</div></div></div><div class="ai-gen-chain"></div><div class="ai-gen-results">' + opts.steps.map(rowHtml).join('') + '</div><div class="ai-gen-foot"><span class="ai-gen-spin"></span><span class="ai-foot-txt">' + (opts.footOn || '生成中…') + '</span></div></div>';
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('show'); });
    await sleep(450);
    var chain = ov.querySelector('.ai-gen-chain'), results = ov.querySelector('.ai-gen-results');
    for (var i = 0; i < opts.steps.length; i++) {
      var node = document.createElement('div'); node.className = 'ai-node in active';
      node.innerHTML = '<div class="nd-col"><span class="ln"></span><span class="nd"></span></div><div class="nd-t">' + opts.steps[i].node + '</div>';
      chain.appendChild(node);
      await sleep(620);
      node.classList.remove('active'); node.classList.add('done');
      var row = results.children[i]; row.classList.add('done');
      if (opts.steps[i].typed) { var tgt = row.querySelector('.ai-type-target'); if (tgt) await typeInto(tgt, opts.steps[i].typed, 26); }
      await sleep(360);
    }
    ov.querySelector('.ai-foot-txt').textContent = opts.footDone || '完成';
    ov.querySelector('.ai-gen-foot').classList.add('done');
    ov.querySelector('.ai-gen-spin').style.display = 'none';
    if (opts.onDone) opts.onDone();
    await sleep(780);
    ov.classList.remove('show');
    await sleep(320); ov.remove();
    if (opts.trigger) { opts.trigger.disabled = false; opts.trigger.style.opacity = ''; }
    if (opts.toast && window.showToast) showToast(opts.toast);
  })();
}

/* ---------- 异步分析任务：关闭弹窗后继续后台运行 ---------- */
const ANALYSIS_TASK_KEY = 'talent-development-active-analysis-v3';
let analysisTaskTimer = null;

function readAnalysisTask() {
  try {
    var task = JSON.parse(localStorage.getItem(ANALYSIS_TASK_KEY) || 'null');
    if (!task || !task.startedAt || !task.resultHref) return null;
    return task;
  } catch (_error) { return null; }
}

function writeAnalysisTask(task) {
  try { localStorage.setItem(ANALYSIS_TASK_KEY, JSON.stringify(task)); } catch (_error) {}
}

function analysisTaskProgress(task) {
  var elapsed = Math.max(0, Date.now() - Number(task.startedAt));
  var duration = Math.max(5000, Number(task.duration) || 12000);
  return Math.min(100, Math.round(elapsed / duration * 100));
}

function analysisTaskStages(task) {
  return task.type === 'key'
    ? ['读取组织版本', '计算岗位得分', '合成关键系数', '校验分析结果']
    : ['读取组织数据', '执行分析方法', '归类岗位族', '校验分析结果'];
}

function closeAnalysisTaskModal() {
  var modal = document.querySelector('.async-task-modal');
  if (!modal) return;
  if (analysisTaskTimer) clearInterval(analysisTaskTimer);
  analysisTaskTimer = null;
  modal.classList.remove('show');
  document.body.classList.remove('overlay-open');
  setTimeout(function () { modal.remove(); }, 220);
}

function saveAnalysisTaskInBackground(task) {
  closeAnalysisTaskModal();
  if (task.returnHref) setTimeout(function () { location.href = task.returnHref; }, 260);
}

function openAnalysisResult(task, box) {
  if (analysisTaskProgress(task) < 100) return;
  if (analysisTaskTimer) clearInterval(analysisTaskTimer);
  box.innerHTML = '<div class="async-task-result-loading" role="status" aria-live="polite"><span class="async-task-result-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5M8 13h8M8 17h6"/></svg></span><h2>正在装载分析结果</h2></div>';
  try { localStorage.removeItem(ANALYSIS_TASK_KEY); } catch (_error) {}
  setTimeout(function () { location.href = task.resultHref; }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 250 : 1300);
}

function openAnalysisTaskModal(task) {
  document.querySelector('.async-task-modal')?.remove();
  var modal = document.createElement('div');
  modal.className = 'async-task-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', task.title + '进度');
  modal.innerHTML = '<div class="async-task-box"><div class="async-task-head"><div><h2></h2></div><button class="async-task-close" type="button" data-async-close aria-label="关闭进度弹窗"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="async-task-body"><div class="async-task-status"><span class="tag tag-running">分析中</span><strong data-task-progress>0%</strong></div><div class="async-task-progress"><i></i></div><div class="async-task-stage-list"></div></div><div class="async-task-foot"><div class="async-task-actions"><button class="btn btn-secondary" type="button" data-task-background>暂时关闭，返回分析页</button><button class="btn btn-primary" type="button" data-task-result data-async-result disabled>完成后查看结果</button></div></div></div>';
  document.body.appendChild(modal);
  modal.querySelector('h2').textContent = task.title;
  var stageList = modal.querySelector('.async-task-stage-list');
  analysisTaskStages(task).forEach(function (label) {
    var row = document.createElement('div'); row.className = 'async-task-stage'; row.innerHTML = '<span></span>'; row.lastChild.textContent = label; stageList.appendChild(row);
  });
  function refresh() {
    var progress = analysisTaskProgress(task);
    var stages = modal.querySelectorAll('.async-task-stage');
    var activeIndex = Math.min(stages.length - 1, Math.floor(progress / 25));
    modal.querySelector('[data-task-progress]').textContent = progress + '%';
    modal.querySelector('.async-task-progress > i').style.width = progress + '%';
    stages.forEach(function (stage, index) { stage.classList.toggle('done', progress >= 100 || index < activeIndex); stage.classList.toggle('active', progress < 100 && index === activeIndex); });
    var tag = modal.querySelector('.async-task-status .tag');
    var result = modal.querySelector('[data-task-result]');
    if (progress >= 100) {
      tag.className = 'tag tag-effective'; tag.textContent = '已完成';
      result.disabled = false;
    }
  }
  modal.addEventListener('click', function (event) { if (event.target === modal) closeAnalysisTaskModal(); });
  document.body.classList.add('overlay-open');
  requestAnimationFrame(function () { modal.classList.add('show'); modal.querySelector('.async-task-close').focus(); });
  refresh();
  if (analysisTaskTimer) clearInterval(analysisTaskTimer);
  analysisTaskTimer = setInterval(refresh, 500);
}

function startAnalysisTask(options) {
  var task = {
    type: options.type === 'key' ? 'key' : 'org',
    title: options.title,
    subtitle: options.subtitle || '',
    resultHref: options.resultHref,
    returnHref: options.returnHref || '',
    startedAt: Date.now(),
    duration: options.duration || 12000,
    gridConfig: options.gridConfig ? normalizeOrgGridConfig(options.gridConfig) : null
  };
  if (task.type === 'org') {
    try { localStorage.removeItem('talent-org-analysis-ready-v5'); } catch (_error) {}
  }
  writeAnalysisTask(task);
  openAnalysisTaskModal(task);
  return task;
}
window.startAnalysisTask = startAnalysisTask;

function initAnalysisTasks() {
  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-async-close]')) {
      event.preventDefault(); closeAnalysisTaskModal(); return;
    }
    if (event.target.closest('[data-async-result]')) {
      var resultTask = readAnalysisTask();
      var resultBox = document.querySelector('.async-task-box');
      if (resultTask && resultBox) openAnalysisResult(resultTask, resultBox);
      return;
    }
    if (event.target.closest('[data-task-background]')) {
      var backgroundTask = readAnalysisTask();
      if (backgroundTask) saveAnalysisTaskInBackground(backgroundTask);
      return;
    }
    var trigger = event.target.closest('[data-open-analysis-task]');
    if (!trigger) return;
    event.preventDefault();
    var current = readAnalysisTask();
    if (!current || current.type !== trigger.dataset.taskType) {
      current = {
        type: trigger.dataset.taskType === 'key' ? 'key' : 'org',
        title: trigger.dataset.taskTitle || '后台分析任务',
        subtitle: trigger.dataset.taskSubtitle || '',
        resultHref: trigger.dataset.resultHref,
        returnHref: trigger.dataset.returnHref || '',
        startedAt: Date.now() - 6500,
        duration: 12000
      };
      writeAnalysisTask(current);
    }
    openAnalysisTaskModal(current);
  });
}

function normalizeTalentStandardNaming() {
  if (document.title) document.title = document.title.replace(/岗位中心|标准管理/g, '人才标准');
  document.querySelectorAll('.breadcrumb').forEach(function (breadcrumb) {
    breadcrumb.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) node.nodeValue = node.nodeValue.replace(/岗位中心|标准管理/g, '人才标准');
    });
  });
}

/* ---------- 启动 ---------- */
function initApp() {
  normalizeTalentStandardNaming();
  initListWorkbenches();
  initFrozenListTables();
  initPageLayout();
  initOverlays();
  initAccessibility();
  initSegments();
  initKeyToggle();
  initSteps();
  initTabs();
  initAnchorTabs();
  initBubbles();
  if (document.body.dataset.page === 'org-structure' && new URLSearchParams(location.search).get('effective') === '1') {
    writeOrgGridConfig('active', readOrgGridConfig('draft'));
    try { localStorage.setItem('talent-org-analysis-ready-v5', 'true'); } catch (_error) {}
  }
  initOrgGridConfiguration();
  initHeatmap();
  initListFilter();
  initToasts();
  initAnalysisTasks();
  window.UI?.mountCategoryTrees(document);
  // 品牌标识点击 → 人才标准
  document.querySelectorAll('.brand').forEach(function (_brand) {
    _brand.setAttribute('role', 'link');
    _brand.setAttribute('aria-label', '进入人才标准');
    _brand.tabIndex = 0;
    _brand.addEventListener('click', function () { location.href = 'standards.html'; });
    _brand.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') location.href = 'standards.html';
    });
  });
}

// 底部脚本立即初始化；head defer 脚本在文档解析完成后初始化。
if (document.body?.querySelector('.app')) {
  initApp();
} else {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
}
