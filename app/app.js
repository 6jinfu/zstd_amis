/* ============================================================
   人才发展系统 · 静态原型共享脚本
   职责：①导航选中态 ②抽屉/弹窗开关 ③mock 数据 ④轻交互
   调交互 → 只改本文件
   ============================================================ */

/* ---------- mock 数据（平台数据=既存；序列/层级/归类=AI 产出）---------- */
const MOCK = {
  // F01 当前生效版组织结构（3 序列 × 3 层级）
  org: {
    versionNo: 'V2',
    versionName: '2026 年组织调整',
    effectiveAt: '2026-06-18',
    operator: '李文静',
    methods: ['岗位评价法', '结构分析法'],
    gridSpec: '3 序列 × 3 层级',
    sequences: ['研发', '销售', '职能'],
    levels: ['初级', '中级', '高级'],
    // 矩阵展示约定：列=序列，行=层级（顶高底低）；页面矩阵已硬编码，此处备用
    groups: [
      [{ name: '研发·初级', positions: 4, headcount: 18 },
       { name: '研发·中级', positions: 7, headcount: 36 },
       { name: '研发·高级', positions: 3, headcount: 9 }],
      [{ name: '销售·初级', positions: 5, headcount: 42 },
       { name: '销售·中级', positions: 6, headcount: 28 },
       { name: '销售·高级', positions: 2, headcount: 6 }],
      [{ name: '职能·初级', positions: 3, headcount: 12 },
       { name: '职能·中级', positions: 4, headcount: 14 },
       { name: '职能·高级', positions: 0, headcount: 0 }],
    ],
  },
  orgHistory: [
    { no: 'V2', name: '2026 年组织调整', operator: '李文静', time: '2026-06-18', methods: '岗位评价法 / 结构分析法', grid: '3×3', status: 'effective' },
    { no: 'V1', name: '初始组织结构', operator: '王志强', time: '2025-12-01', methods: '结构分析法', grid: '3×2', status: 'archived' },
  ],

  // F02 分析项目
  diagnoses: [
    { id: 'keydiag_001', name: '2026 年度关键岗位分析', version: 'V2 · 2026 年组织调整', gran: '岗位族', views: '经济 + 能力', keyCount: 11, status: 'done', owner: '李文静' },
    { id: 'keydiag_002', name: '研发序列关键岗位试点', version: 'V2 · 2026 年组织调整', gran: '具体岗位', views: '经济', keyCount: 4, status: 'running', owner: '王志强' },
    { id: 'keydiag_003', name: '销售铁军关键岗位', version: 'V2 · 2026 年组织调整', gran: '具体岗位', views: '能力', keyCount: 0, status: 'draft', owner: '张敏' },
  ],

  // F04 岗位（is_key 统一口径）
  positions: [
    { code: 'RD-301', name: '高级算法工程师', cat: '研发', group: '研发·高级', isKey: true, coef: '0.92', hasStd: true, hasPlan: true, diagnosed: true },
    { code: 'RD-205', name: '后端开发工程师', cat: '研发', group: '研发·中级', isKey: true, coef: '0.81', hasStd: true, hasPlan: false, diagnosed: true },
    { code: 'SA-110', name: '大客户销售经理', cat: '销售', group: '销售·中级', isKey: true, coef: '0.78', hasStd: false, hasPlan: false, diagnosed: true },
    { code: 'RD-102', name: '前端开发工程师', cat: '研发', group: '研发·初级', isKey: false, coef: '0.54', hasStd: false, hasPlan: false, diagnosed: true },
    { code: 'SA-301', name: '区域销售总监', cat: '销售', group: '销售·高级', isKey: true, coef: '0.88', hasStd: true, hasPlan: true, diagnosed: true },
    { code: 'FN-203', name: '财务分析经理', cat: '职能', group: '职能·中级', isKey: false, coef: '0.46', hasStd: false, hasPlan: false, diagnosed: false },
    { code: 'RD-302', name: '架构师', cat: '研发', group: '研发·高级', isKey: true, coef: '0.95', hasStd: true, hasPlan: true, diagnosed: true },
    { code: 'HR-101', name: '招聘专员', cat: '职能', group: '职能·初级', isKey: false, coef: '0.31', hasStd: false, hasPlan: false, diagnosed: false },
  ],
};

/* ---------- ① 导航：按 body[data-page] 高亮 ---------- */
function initNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll('.sidenav .nav-item').forEach(el => {
    if (el.dataset.page === page) el.classList.add('active');
  });
  document.querySelectorAll('.topbar .nav-main a').forEach(el => {
    if (el.dataset.module === document.body.dataset.module) el.classList.add('active');
  });
}

/* ---------- 导航框架：左侧一级导航 + 顶部当前业务菜单 ---------- */
const PRIMARY_NAV_ICONS = {
  standard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  assess: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h6"/><path d="M9 3h6a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a2 2 0 0 1 2-2Z"/><path d="m8 14 2.5 2.5L16 11"/></svg>',
  develop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M3 19h18"/><path d="m4 9 6-4 6 7 4-4"/></svg>',
  talent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2"/><path d="M16 15a5 5 0 0 1 5 5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>'
};
const NAV_COLLAPSED_KEY = 'talent-development-nav-collapsed';

/* ---------- 本期开发范围：按研发评审结论统一业务菜单 ---------- */
const RELEASE_BUSINESS_NAV = {
  standard: [
    { page: 'org-structure', href: 'org-structure.html', label: '组织结构' },
    { page: 'key-position', href: 'key-position.html', label: '关键岗位分析' },
    { page: 'positions', href: 'positions.html', label: '岗位管理' },
    { page: 'vocabulary', href: 'vocabulary.html', label: '指标库' }
  ],
  assess: [
    { page: 'assess-projects', href: 'assess-projects.html', label: '评鉴工具' },
    { page: 'review-projects', href: 'review-projects.html', label: '人才盘点' }
  ],
  develop: [
    { page: 'position-map', href: 'position-map.html', label: '岗位地图' }
  ],
  talent: [
    { page: 'talent-list', href: 'talent-list.html', label: '人才列表' }
  ]
};

function applyReleaseScope() {
  const pageFile = location.pathname.split('/').pop() || 'index.html';
  const redirects = {
    'assess-results.html': 'assess-projects.html',
    'assess-tools.html': 'assess-projects.html',
    'review-compare.html': 'review-projects.html',
    'level-map.html': 'position-map.html',
    'idp-list.html': 'position-map.html',
    'talent-pool.html': 'talent-list.html',
    'succession-map.html': 'talent-list.html',
    'org-dashboard.html': 'talent-list.html'
  };
  if (redirects[pageFile]) {
    location.replace(redirects[pageFile]);
    return false;
  }

  const module = document.body.dataset.module;
  const sidenav = document.querySelector('.sidenav');
  const config = RELEASE_BUSINESS_NAV[module];
  if (sidenav && config) {
    const sources = Array.from(sidenav.querySelectorAll('.nav-item'));
    sidenav.replaceChildren();
    config.forEach(item => {
      const source = sources.find(node => node.getAttribute('href') === item.href);
      const link = source ? source.cloneNode(true) : document.createElement('a');
      const icon = link.querySelector('svg')?.outerHTML || '';
      link.className = `nav-item${document.body.dataset.page === item.page ? ' active' : ''}`;
      link.dataset.page = item.page;
      link.href = item.href;
      link.innerHTML = `${icon}${item.label}`;
      sidenav.appendChild(link);
    });
  }

  if (pageFile === 'talent-profile.html') {
    document.querySelectorAll('.anchor-nav .a-item').forEach(item => {
      if (!['ability', 'review'].includes(item.dataset.tab)) item.remove();
    });
    document.querySelectorAll('.detail-main > .d-section').forEach(section => {
      if (!['ability', 'review'].includes(section.dataset.section)) section.remove();
    });
  }
  return true;
}

function initShellNavigation() {
  const app = document.querySelector('.app');
  const topbar = app?.querySelector('.topbar');
  const sidenav = app?.querySelector('.sidenav');
  const sourcePrimary = topbar?.querySelector('.nav-main');
  const brand = topbar?.querySelector('.brand');
  const right = topbar?.querySelector('.right');
  if (!app || !topbar || !sidenav || !sourcePrimary || !brand || !right) return;

  // 共享脚本位于页面底部，此处先切入新版 Shell，避免 Chrome 首次绘制旧版骨架。
  app.classList.add('shell-v2');
  let isNavCollapsed = false;
  try { isNavCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === 'true'; } catch (_error) {}
  app.classList.toggle('nav-collapsed', isNavCollapsed);

  const primaryNav = document.createElement('nav');
  primaryNav.className = 'primary-nav';
  primaryNav.id = 'primary-navigation';
  primaryNav.setAttribute('aria-label', '一级导航');
  sourcePrimary.querySelectorAll('a').forEach(source => {
    const item = source.cloneNode(false);
    const label = source.textContent.trim();
    item.className = `primary-item${source.classList.contains('active') ? ' active' : ''}`;
    item.setAttribute('aria-label', label);
    item.title = label;
    item.innerHTML = `${PRIMARY_NAV_ICONS[source.dataset.module] || ''}<span>${label}</span>`;
    primaryNav.appendChild(item);
  });

  const businessNav = document.createElement('nav');
  businessNav.className = 'business-nav';
  businessNav.setAttribute('aria-label', '业务菜单');
  if (sidenav.hasAttribute('data-anchor-tabs')) {
    businessNav.setAttribute('data-anchor-tabs', '');
    if (sidenav.dataset.default) businessNav.dataset.default = sidenav.dataset.default;
  }
  sidenav.querySelectorAll('.nav-item').forEach(source => {
    const item = source.cloneNode(true);
    item.classList.add('business-item');
    businessNav.appendChild(item);
  });

  const mobileBrand = brand.cloneNode(true);
  mobileBrand.classList.add('mobile-brand');
  const mobilePrimary = primaryNav.cloneNode(true);
  mobilePrimary.removeAttribute('id');
  mobilePrimary.className = 'mobile-primary-nav';
  mobilePrimary.setAttribute('aria-label', '一级导航');

  const navToggle = document.createElement('button');
  navToggle.type = 'button';
  navToggle.className = 'nav-collapse-toggle';
  navToggle.setAttribute('aria-controls', primaryNav.id);
  navToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg><span>收起导航</span>';
  function syncNavToggle() {
    const collapsed = app.classList.contains('nav-collapsed');
    navToggle.setAttribute('aria-expanded', String(!collapsed));
    navToggle.setAttribute('aria-label', collapsed ? '展开导航' : '收起导航');
    navToggle.title = collapsed ? '展开导航' : '收起导航';
    navToggle.querySelector('span').textContent = collapsed ? '展开导航' : '收起导航';
  }
  navToggle.addEventListener('click', function () {
    app.classList.toggle('nav-collapsed');
    try { localStorage.setItem(NAV_COLLAPSED_KEY, String(app.classList.contains('nav-collapsed'))); } catch (_error) {}
    syncNavToggle();
  });
  syncNavToggle();

  sidenav.replaceChildren(brand, primaryNav, navToggle);
  sourcePrimary.remove();
  topbar.insertBefore(mobileBrand, right);
  topbar.insertBefore(mobilePrimary, right);
  topbar.insertBefore(businessNav, right);
}

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
        { label: '全部', value: '全部', count: 8 },
        { label: '研发', value: '研发', count: 4 },
        { label: '销售', value: '销售', count: 2 },
        { label: '职能', value: '职能', count: 2 }
      ]
    },
    'idp-list.html': {
      title: '所属部门',
      items: [
        { label: '全部计划', count: 8 },
        { label: '研发中心', count: 4, keywords: ['研发中心'] },
        { label: '销售中心', count: 2, keywords: ['销售中心'] },
        { label: '职能中台', count: 2, keywords: ['职能中台'] }
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
      scopeItem.innerHTML = `<span>${item.label}</span>${item.count == null ? '' : `<span class="cti-count">${item.count}</span>`}`;
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
    var wrap = table.parentElement;
    if (!wrap || wrap.classList.contains('frozen-table-shell')) return;

    var scroll = document.createElement('div');
    scroll.className = 'frozen-table-scroll';
    wrap.insertBefore(scroll, table);
    scroll.appendChild(table);

    var frozen = document.createElement('table');
    frozen.className = 'frozen-action-table';
    frozen.setAttribute('aria-label', '冻结操作列');
    var frozenHead = document.createElement('thead');
    var frozenBody = document.createElement('tbody');
    var rowPairs = [];

    function cloneActionCell(source, fallbackTag) {
      var cell = source ? source.cloneNode(true) : document.createElement(fallbackTag || 'td');
      cell.removeAttribute('id');
      cell.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
      cell.removeAttribute('colspan');
      return cell;
    }

    table.querySelectorAll('thead tr').forEach(function (row) {
      var frozenRow = document.createElement('tr');
      frozenRow.appendChild(cloneActionCell(row.lastElementChild, 'th'));
      frozenHead.appendChild(frozenRow);
      if (row.children.length > 1) row.lastElementChild.classList.add('frozen-source-action');
    });

    table.querySelectorAll('tbody tr').forEach(function (row) {
      var frozenRow = document.createElement('tr');
      frozenRow.className = row.className;
      var sourceCell = row.children.length > 1 ? row.lastElementChild : null;
      frozenRow.appendChild(cloneActionCell(sourceCell, 'td'));
      frozenBody.appendChild(frozenRow);
      if (sourceCell) sourceCell.classList.add('frozen-source-action');
      rowPairs.push([row, frozenRow]);
      row.addEventListener('mouseenter', function () { frozenRow.classList.add('is-hover'); });
      row.addEventListener('mouseleave', function () { frozenRow.classList.remove('is-hover'); });
      frozenRow.addEventListener('mouseenter', function () { row.classList.add('is-hover'); });
      frozenRow.addEventListener('mouseleave', function () { row.classList.remove('is-hover'); });
    });

    frozen.appendChild(frozenHead);
    frozen.appendChild(frozenBody);
    wrap.appendChild(frozen);
    wrap.classList.add('frozen-table-shell');

    function syncRows() {
      rowPairs.forEach(function (pair) {
        pair[1].style.display = pair[0].style.display === 'none' ? 'none' : '';
      });
    }
    syncRows();
    new MutationObserver(syncRows).observe(table.tBodies[0], {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });
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

  document.querySelectorAll('.primary-item.active, .business-item.active, .topbar .nav-main a.active, .sidenav .nav-item.active').forEach(link => {
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
  const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
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
  document.querySelectorAll('.anchor-nav, .sidenav[data-anchor-tabs], .business-nav[data-anchor-tabs]').forEach(nav => {
    const items = Array.from(nav.querySelectorAll('.a-item, .nav-item[data-tab]'));
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
function initHeatmap() {
  document.querySelectorAll('[data-heat]').forEach(function (m) {
    var cells = m.querySelectorAll('.group:not(.empty-cell)');
    var vals = [];
    var heatColors = [
      'var(--primary-50)',
      'var(--primary-100)',
      'var(--primary-200)',
      'var(--primary-300)',
      'var(--primary-400)'
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
    ov.innerHTML = '<div class="ai-gen-card"><div class="ai-gen-header"><div class="ai-gen-orb"></div><div><div class="ai-gen-title">' + opts.title + '</div><div class="ai-gen-sub">' + opts.subtitle + '</div></div></div><div class="ai-gen-chain"></div><div class="ai-gen-results">' + opts.steps.map(rowHtml).join('') + '</div><div class="ai-gen-foot"><span class="ai-gen-spin"></span><span class="ai-foot-txt">' + (opts.footOn || '生成中…') + '</span></div></div>';
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

/* ---------- 启动 ---------- */
function initApp() {
  if (!applyReleaseScope()) return;
  initNav();
  initShellNavigation();
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
  initHeatmap();
  initListFilter();
  initToasts();
  // 品牌标识点击 → 岗位中心
  document.querySelectorAll('.brand').forEach(function (_brand) {
    _brand.setAttribute('role', 'link');
    _brand.setAttribute('aria-label', '进入岗位中心');
    _brand.tabIndex = 0;
    _brand.addEventListener('click', function () { location.href = 'org-structure.html'; });
    _brand.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') location.href = 'org-structure.html';
    });
  });
}

// app.js 在完整页面骨架之后同步执行；不要再等 DOMContentLoaded，避免旧骨架先被绘制。
if (document.body?.querySelector('.app')) {
  initApp();
} else {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
}
