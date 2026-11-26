(function () {
  const S = window.Standards, e = UI.escape, $ = selector => document.querySelector(selector);
  const storageKey = 'talent-learning-plan-design-v1';
  const params = new URLSearchParams(location.search);
  const fromPage = params.get('from') || '';
  const initialAi = params.get('ai') === '1';
  const initialCap = params.get('cap') || '';

  let data;
  try {
    data = S.read();
  } catch (error) {
    $('#lp-workspace').innerHTML = '<div class="lp-empty-card"><p>无法读取人才标准，请检查浏览器存储权限。</p></div>';
    return;
  }

  const capStandardsFor = posId => S.associated(data, posId).filter(s => !S.hasDimension || S.hasDimension(s, 'cap'));
  const defaultPositionId = () => {
    const requested = params.get('position');
    if (requested && S.positions.some(p => p.id === requested)) return requested;
    const withCap = S.positions.find(p => capStandardsFor(p.id).length > 0);
    return withCap?.id || S.positions[0]?.id || 'RD-302';
  };

  let positionId = defaultPositionId();
  let position = S.positions.find(item => item.id === positionId) || null;
  let associated = position ? capStandardsFor(positionId) : [];
  let standard = null;
  const pickInitialStandard = (preferId = '') => {
    associated = position ? capStandardsFor(positionId) : [];
    if (preferId && associated.some(s => s.id === preferId)) return associated.find(s => s.id === preferId);
    const remembered = data.selected?.['plan-' + positionId];
    if (remembered && associated.some(s => s.id === remembered)) return associated.find(s => s.id === remembered);
    return associated[0] || null;
  };
  standard = pickInitialStandard(params.get('standard') || '');

  let draft = {groups:[]}, expanded = new Set(), dirty = false, filterCapability = '';
  const uid = (prefix = 'lp') => UI.uid ? UI.uid(prefix) : prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const icon = name => {
    if (name === 'plus') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    if (name === 'sparkle') return '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M8.719 5.497c.02.067.071.118.137.138l3.952 1.17c.194.057.194.333 0 .39l-3.952 1.17a.204.204 0 0 0-.137.138l-1.17 3.951c-.058.195-.333.195-.39 0l-1.17-3.951a.204.204 0 0 0-.138-.138l-3.952-1.17c-.194-.057-.194-.333 0-.39l3.952-1.17a.204.204 0 0 0 .137-.138l1.17-3.95c.058-.196.333-.196.391 0l1.17 3.95Z"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  };
  const button = (text, action, extra = '', cls = 'btn-text') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  const capabilities = () => standard?.content.cap || [];
  const allowedCapNames = () => new Set(capabilities().map(([name]) => name));
  const field = (label, name, value, multiline = false) => `<label>${label}${multiline ? `<textarea class="input" name="${name}">${e(value)}</textarea>` : `<input class="input" name="${name}" value="${e(value)}" maxlength="150">`}</label>`;

  const platformCatalog = [
    {kind:'课程', title:'关键客户经营与价值深耕', hours:'12 课时', tags:['客户洞察','顾问式销售','客户服务','客户导向']},
    {kind:'课程', title:'B2B 解决方案呈现技巧', hours:'8 课时', tags:['顾问式销售','解决方案设计','沟通','跨部门沟通']},
    {kind:'课程', title:'高难度商务谈判与成交策略', hours:'10 课时', tags:['商务谈判','商机管理','商业判断']},
    {kind:'课程', title:'商机漏斗管理与销售预测', hours:'6 课时', tags:['商机管理','销售管理','销售策略制定','数据分析']},
    {kind:'课程', title:'分布式系统架构设计进阶', hours:'24 课时', tags:['系统架构','技术选型','解决方案设计']},
    {kind:'课程', title:'高并发系统性能调优实战', hours:'16 课时', tags:['系统架构','编程能力','技术选型','测试设计']},
    {kind:'课程', title:'机器学习模型工程化与部署', hours:'18 课时', tags:['算法设计','模型工程','特征工程','编程能力']},
    {kind:'课程', title:'业务特征工程与数据建模实战', hours:'14 课时', tags:['特征工程','数据分析','SQL 数据查询','业务理解']},
    {kind:'课程', title:'SQL 业务数据提取与高效查询', hours:'6 课时', tags:['SQL 数据查询','数据分析','数据治理入门']},
    {kind:'课程', title:'跨团队协同与高效沟通实务', hours:'6 课时', tags:['协同推进','跨部门沟通','组织协同','沟通']},
    {kind:'课程', title:'新晋管理者团队目标与绩效辅导', hours:'12 课时', tags:['团队管理','辅导下属','人才发展']},
    {kind:'课程', title:'结构化问题拆解与创新决策', hours:'8 课时', tags:['问题分析','问题解决','创新思维','复杂决策']},
    {kind:'课程', title:'产品规划与全生命周期管理', hours:'12 课时', tags:['产品规划','需求分析','市场洞察','新品导入']},
    {kind:'项目', title:'重点客户突破实战训练营', hours:'2 个月', tags:['客户洞察','顾问式销售','商务谈判','协同推进']},
    {kind:'项目', title:'架构师技术攻坚加速营', hours:'3 个月', tags:['系统架构','技术选型','团队管理','跨部门沟通']},
    {kind:'项目', title:'算法工程化落地专项营', hours:'2 个月', tags:['算法设计','模型工程','特征工程','业务理解']},
    {kind:'项目', title:'高潜骨干跨部门协同工作坊', hours:'6 周', tags:['协同推进','跨部门沟通','团队管理','创新思维']}
  ];

  function resourceCatalog() {
    const seed = positionId === 'SA-201' ? window.STANDARD_POSITION_SEEDS?.sales : positionId === 'RD-301' ? window.STANDARD_POSITION_SEEDS?.algorithm : null;
    const map = new Map();
    platformCatalog.forEach(item => map.set(item.kind + ':' + item.title, {...item}));
    (seed?.courseOptions || []).forEach(title => {
      if (!map.has('课程:' + title)) map.set('课程:' + title, {kind:'课程', title, hours:'8 课时', tags:[]});
    });
    (seed?.projectOptions || []).forEach(title => {
      if (!map.has('项目:' + title)) map.set('项目:' + title, {kind:'项目', title, hours:'2 个月', tags:[]});
    });
    return [...map.values()];
  }

  function normalizeDraft(raw) {
    const names = allowedCapNames();
    const groups = (raw?.groups || raw?.tasks || []).map(g => {
      const groupCaps = (g.capabilities || []).filter(n => names.has(n));
      const activities = (g.activities || []).map(a => {
        const ownCaps = Array.isArray(a.capabilities) ? a.capabilities.filter(n => names.has(n)) : [...groupCaps];
        return {
          id: a.id || uid('act'),
          kind: a.kind || '课程',
          title: a.title || '',
          required: a.required !== false,
          capabilities: ownCaps,
          note: a.note || '',
          source: a.source || (['课程','项目'].includes(a.kind) ? '平台资源' : '手工添加')
        };
      });
      return {id: g.id || uid('group'), title: g.title || '未命名阶段', output: g.output || '', activities};
    });
    return {groups};
  }

  function example() {
    if (!standard) return {groups:[]};
    const names = [...allowedCapNames()];
    if (!names.length) return {groups:[]};
    const pickCaps = (...preferred) => {
      const matched = preferred.filter(n => names.includes(n));
      return matched.length ? matched : names.slice(0, Math.min(2, names.length));
    };
    if (standard.id === 'std-sales') {
      return normalizeDraft({groups:[
        {id:'sales-stage-1', title:'客户理解与需求识别', output:'围绕真实客户开展访谈，梳理业务目标与关键约束。', activities:[
          {kind:'课程', title:'关键客户经营与价值深耕', required:true, capabilities:pickCaps('客户洞察','顾问式销售'), note:'培训平台 · 12 课时', source:'平台资源'},
          {kind:'在岗实践', title:'完成目标客户深度需求访谈', required:true, capabilities:pickCaps('客户洞察'), note:'准备结构化访谈提纲，记录客户业务痛点与决策链，输出需求诊断纪要。', source:'手工添加'}
        ]},
        {id:'sales-stage-2', title:'方案设计与协同推进', output:'结合客户需求制定可落地方案，拉通售前与交付达成一致。', activities:[
          {kind:'课程', title:'B2B 解决方案呈现技巧', required:true, capabilities:pickCaps('顾问式销售','协同推进'), note:'培训平台 · 8 课时', source:'平台资源'},
          {kind:'项目', title:'重点客户突破实战训练营', required:true, capabilities:pickCaps('顾问式销售','商机管理','协同推进'), note:'培训项目 · 2 个月', source:'平台资源'}
        ]},
        {id:'sales-stage-3', title:'商务谈判与复盘沉淀', output:'掌握异议处理节奏并完成签约复盘。', activities:[
          {kind:'课程', title:'高难度商务谈判与成交策略', required:true, capabilities:pickCaps('商务谈判'), note:'培训平台 · 10 课时', source:'平台资源'},
          {kind:'复盘辅导', title:'重点商机谈判复盘与导师点评', required:false, capabilities:pickCaps('商务谈判','商机管理'), note:'梳理谈判关键折中点与风险条款，由销售负责人点评改进。', source:'手工添加'}
        ]}
      ]});
    }
    if (standard.id === 'std-architecture') {
      return normalizeDraft({groups:[
        {id:'arch-stage-1', title:'架构视野与选型方法', output:'建立复杂系统设计与关键技术选型评估框架。', activities:[
          {kind:'课程', title:'分布式系统架构设计进阶', required:true, capabilities:pickCaps('系统架构','技术选型'), note:'培训平台 · 24 课时', source:'平台资源'},
          {kind:'课程', title:'高并发系统性能调优实战', required:true, capabilities:pickCaps('系统架构','技术选型'), note:'培训平台 · 16 课时', source:'平台资源'}
        ]},
        {id:'arch-stage-2', title:'跨团队协同与技术攻坚', output:'主导跨团队架构评审并辅导核心研发骨干。', activities:[
          {kind:'项目', title:'架构师技术攻坚加速营', required:true, capabilities:pickCaps('系统架构','团队管理','跨部门沟通'), note:'培训项目 · 3 个月', source:'平台资源'},
          {kind:'在岗实践', title:'主导一次核心子系统技术选型与跨部门评审', required:true, capabilities:pickCaps('技术选型','跨部门沟通','创新思维'), note:'输出候选方案对比报告、风险预案及跨团队协同排期，完成架构评审归档。', source:'手工添加'}
        ]}
      ]});
    }
    if (standard.id === 'std-algorithm') {
      return normalizeDraft({groups:[
        {id:'algo-stage-1', title:'模型设计与特征工程夯实', output:'提升核心业务场景的特征构建与建模效率。', activities:[
          {kind:'课程', title:'业务特征工程与数据建模实战', required:true, capabilities:pickCaps('特征工程','业务理解'), note:'培训平台 · 14 课时', source:'平台资源'},
          {kind:'课程', title:'机器学习模型工程化与部署', required:true, capabilities:pickCaps('算法设计','模型工程','编程能力'), note:'培训平台 · 18 课时', source:'平台资源'}
        ]},
        {id:'algo-stage-2', title:'业务场景落地与效果验证', output:'完成算法方案线上验证并沉淀迭代指标。', activities:[
          {kind:'项目', title:'算法工程化落地专项营', required:true, capabilities:pickCaps('算法设计','模型工程','业务理解'), note:'培训项目 · 2 个月', source:'平台资源'},
          {kind:'在岗实践', title:'独立完成一项核心推荐/预测模型迭代上线', required:true, capabilities:pickCaps('算法设计','编程能力'), note:'提交离线评测对比、线上灰度指标报告与代码评审记录。', source:'手工添加'}
        ]}
      ]});
    }
    return {groups:[]};
  }

  function setSaveBadge(state) {
    const el = $('#lp-save-state');
    if (!el) return;
    if (!state) { el.hidden = true; el.textContent = ''; el.className = 'lp-save-badge'; return; }
    el.hidden = false;
    el.textContent = state === 'dirty' ? '有未保存修改' : '已保存';
    el.className = 'lp-save-badge ' + (state === 'dirty' ? 'is-dirty' : 'is-saved');
  }

  function changed() {
    dirty = true;
    setSaveBadge('dirty');
  }

  function syncUrl() {
    const next = new URLSearchParams();
    if (positionId) next.set('position', positionId);
    if (standard) next.set('standard', standard.id);
    if (fromPage) next.set('from', fromPage);
    const query = next.toString();
    history.replaceState(null, '', 'learning-plan.html' + (query ? '?' + query : ''));
  }

  function renderHeaderContext() {
    const posSelect = $('#lp-position-select');
    if (posSelect) {
      posSelect.innerHTML = S.positions.map(p => {
        const count = capStandardsFor(p.id).length;
        return `<option value="${e(p.id)}" ${p.id === positionId ? 'selected' : ''}>${e(p.name)}${count ? '' : '（待关联标准）'}</option>`;
      }).join('');
      posSelect.onchange = ev => {
        const nextPosId = ev.target.value;
        const doSwitch = () => {
          positionId = nextPosId;
          position = S.positions.find(item => item.id === positionId) || null;
          standard = pickInitialStandard(standard?.id || '');
          dirty = false;
          filterCapability = '';
          syncUrl();
          load();
          window.LearningPlanAI?.refreshContext?.();
        };
        if (dirty) {
          UI.openDialog({
            title: '切换目标岗位',
            body: '<p>当前学习方案有未保存的修改，切换岗位将放弃未保存内容，是否继续？</p>',
            confirmLabel: '确认切换',
            onConfirm: doSwitch
          });
          ev.target.value = positionId;
        } else doSwitch();
      };
    }

    document.title = position ? `学习方案 · ${position.name} · 人才发展` : '学习方案 · 人才发展';
    const slot = $('#lp-standard-slot'), link = $('#lp-standard-link'), back = $('#lp-back');

    if (back) {
      if (fromPage === 'position') {
        back.hidden = false;
        back.href = `position-detail.html?position=${encodeURIComponent(positionId)}#plan`;
        back.setAttribute('aria-label', '返回岗位详情');
      } else if (fromPage === 'positions') {
        back.hidden = false;
        back.href = 'positions.html';
        back.setAttribute('aria-label', '返回岗位列表');
      } else if (fromPage === 'standards') {
        back.hidden = false;
        back.href = 'standards.html';
        back.setAttribute('aria-label', '返回人才标准列表');
      } else if (fromPage === 'standard' && standard) {
        back.hidden = false;
        back.href = `standard-detail.html?id=${encodeURIComponent(standard.id)}#plan`;
        back.setAttribute('aria-label', '返回人才标准详情');
      } else if (fromPage === 'map') {
        back.hidden = false;
        back.href = 'position-map.html';
        back.setAttribute('aria-label', '返回岗位地图');
      } else {
        back.hidden = true;
      }
    }

    if (!standard) {
      slot.innerHTML = '<span class="lp-std-empty">暂无含能力要求的关联标准</span>';
      link.hidden = true;
    } else if (associated.length <= 1) {
      slot.innerHTML = `<strong class="lp-std-single">${e(standard.name)}</strong>`;
      link.hidden = false;
      link.href = `standard-detail.html?id=${encodeURIComponent(standard.id)}#content-cap`;
    } else {
      slot.innerHTML = `<select class="select lp-std-select" id="lp-standard-select" aria-label="切换人才标准">${associated.map(s => `<option value="${e(s.id)}" ${s.id === standard.id ? 'selected' : ''}>${e(s.name)}</option>`).join('')}</select>`;
      slot.querySelector('select').onchange = ev => {
        const nextId = ev.target.value;
        const applySwitch = () => {
          standard = associated.find(s => s.id === nextId) || standard;
          dirty = false;
          filterCapability = '';
          syncUrl();
          load();
          window.LearningPlanAI?.refreshContext?.();
        };
        if (dirty) {
          UI.openDialog({
            title: '切换采用标准',
            body: '<p>当前学习方案有未保存的修改，切换人才标准将放弃未保存内容，是否继续？</p>',
            confirmLabel: '确认切换',
            onConfirm: applySwitch
          });
          ev.target.value = standard.id;
        } else applySwitch();
      };
      link.hidden = false;
      link.href = `standard-detail.html?id=${encodeURIComponent(standard.id)}#content-cap`;
    }

    const aiCtx = $('#lp-ai-context');
    if (aiCtx) aiCtx.textContent = position && standard ? `${position.name} · ${standard.name}` : (position?.name || '');

    const disabled = !position || !standard;
    $('#lp-save').disabled = disabled;
    $('#lp-preview').disabled = disabled;
    $('#lp-ai-open').disabled = disabled;
  }

  function load() {
    renderHeaderContext();
    if (!position || !standard) {
      draft = {groups:[]};
      setSaveBadge('');
      $('#lp-context-summary').innerHTML = '';
      $('#lp-workspace').innerHTML = `<div class="lp-empty-card">
        <h3>当前岗位尚未关联含“能力要求”的人才标准</h3>
        <p>请先为“${e(position?.name || '当前岗位')}”关联或新建包含能力要求的人才标准，再配置阶段化学习资源。</p>
        <div class="lp-empty-actions">
          <a class="btn btn-primary" href="${position ? 'position-detail.html?position=' + encodeURIComponent(positionId) + '#standard' : 'standards.html'}">前往关联人才标准</a>
          <a class="btn btn-secondary" href="standards.html">进入人才标准列表</a>
        </div>
      </div>`;
      return;
    }
    try {
      const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const saved = all[JSON.stringify([positionId, standard.id])];
      if (saved) draft = normalizeDraft(S.clone(saved));
      else draft = example();
      setSaveBadge(saved ? 'saved' : '');
    } catch (error) {
      $('#lp-workspace').innerHTML = '<div class="lp-empty-card"><p>无法读取学习方案，请检查浏览器存储权限。</p></div>';
      $('#lp-save').disabled = true;
      $('#lp-preview').disabled = true;
      $('#lp-ai-open').disabled = true;
      return;
    }
    expanded = new Set(draft.groups.map(group => group.id));
    render();
  }

  function resourceStats() {
    const counts = new Map();
    capabilities().forEach(([name]) => counts.set(name, {total:0, courses:0, practices:0}));
    draft.groups.forEach(group => {
      group.activities.forEach(act => {
        (act.capabilities || []).forEach(name => {
          if (!counts.has(name)) return;
          const entry = counts.get(name);
          entry.total++;
          if (['课程','项目'].includes(act.kind)) entry.courses++; else entry.practices++;
        });
      });
    });
    return counts;
  }

  function kindClass(kind) {
    if (kind === '课程') return 'is-course';
    if (kind === '项目') return 'is-project';
    return 'is-practice';
  }

  function activityHTML(item, index, group) {
    if (filterCapability && !(item.capabilities || []).includes(filterCapability)) return '';
    const caps = item.capabilities || [];
    const reqBadge = `<span class="lp-req-tag ${item.required !== false ? 'is-req' : ''}">${item.required !== false ? '必修' : '选修'}</span>`;
    return `<li class="lp-activity" data-activity="${index}">
      <div class="lp-act-main">
        <div class="lp-act-header">
          <span class="lp-kind ${kindClass(item.kind)}">${e(item.kind)}</span>
          ${reqBadge}
          <strong>${e(item.title)}</strong>
        </div>
        ${item.note ? `<p class="lp-activity-note">${e(item.note)}</p>` : ''}
        <div class="lp-activity-caps">
          <span class="lp-cap-label">关联能力</span>
          ${caps.length
            ? caps.map(name => `<button type="button" class="lp-cap-chip ${filterCapability === name ? 'is-active' : ''}" data-action="filter-cap" data-cap="${e(name)}" title="按「${e(name)}」筛选">${e(name)}</button>`).join('')
            : '<span class="lp-cap-empty">尚未绑定能力项</span>'}
          <button type="button" class="lp-cap-bind-btn" data-action="bind-capabilities" aria-label="设置${e(item.title)}的关联能力">${caps.length ? '调整' : '＋ 绑定能力'}</button>
        </div>
      </div>
      <div class="lp-activity-ops">
        <button class="lp-move" type="button" data-action="up" aria-label="上移${e(item.title)}" title="上移" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="lp-move" type="button" data-action="down" aria-label="下移${e(item.title)}" title="下移" ${index === group.activities.length - 1 ? 'disabled' : ''}>↓</button>
        ${button('编辑','edit-activity',`aria-label="编辑${e(item.title)}"`)}
        ${button('移除','remove-activity',`aria-label="移除${e(item.title)}"`,'btn-text danger')}
      </div>
    </li>`;
  }

  function groupHTML(group, index) {
    const visibleActivities = group.activities.map((item, i) => activityHTML(item, i, group)).filter(Boolean);
    if (filterCapability && !visibleActivities.length) return '';
    const open = expanded.has(group.id) || !!filterCapability;
    const distinctCaps = [...new Set(group.activities.flatMap(a => a.capabilities || []))];
    return `<li><article class="lp-task ${open ? 'is-open' : ''}" data-group="${e(group.id)}">
      <div class="lp-task-head">
        <button class="lp-task-toggle" type="button" data-action="toggle" aria-expanded="${open}" aria-controls="body-${e(group.id)}">
          <span class="lp-group-number">${index + 1}</span>
          <span class="lp-chevron">${icon('chevron')}</span>
          <strong>${e(group.title)}</strong>
          <span class="lp-group-meta">${group.activities.length} 项资源${distinctCaps.length ? ` · 覆盖 ${distinctCaps.length} 项能力` : ''}</span>
        </button>
        <div class="lp-task-actions">
          <button type="button" class="lp-stage-ai-btn" data-action="ai-group" aria-label="为${e(group.title)}AI配资源">${icon('sparkle')}<span>AI 配资源</span></button>
          <button class="lp-move" type="button" data-action="group-up" aria-label="上移阶段${e(group.title)}" title="上移阶段" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="lp-move" type="button" data-action="group-down" aria-label="下移阶段${e(group.title)}" title="下移阶段" ${index === draft.groups.length - 1 ? 'disabled' : ''}>↓</button>
          ${button('编辑','edit-group',`aria-label="编辑阶段${e(group.title)}"`)}
          ${button('删除','remove-group',`aria-label="删除阶段${e(group.title)}"`,'btn-text danger')}
        </div>
      </div>
      <div class="lp-task-body" id="body-${e(group.id)}" ${open ? '' : 'hidden'}>
        ${group.output ? `<p class="lp-output">${e(group.output)}</p>` : ''}
        ${visibleActivities.length
          ? `<ol class="lp-activities">${visibleActivities.join('')}</ol>`
          : '<div class="lp-group-empty"><span>当前阶段暂无学习资源</span><button type="button" class="btn-text" data-action="ai-group">使用 AI 配资源</button></div>'}
        <div class="lp-group-foot-actions">
          ${button('＋ 关联课程 / 项目','add-resource','','btn btn-secondary btn-sm')}
          ${button('＋ 添加实践活动','add-activity','','btn btn-secondary btn-sm')}
        </div>
      </div>
    </article></li>`;
  }

  function render() {
    if (!position || !standard) return;
    const totalCount = draft.groups.reduce((sum, group) => sum + group.activities.length, 0);
    const stats = resourceStats();
    const caps = capabilities();
    if (filterCapability && !caps.some(([name]) => name === filterCapability)) filterCapability = '';
    const covered = caps.filter(([name]) => (stats.get(name)?.total || 0) > 0).length;
    const uncoveredCount = Math.max(0, caps.length - covered);
    const pct = caps.length ? Math.round((covered / caps.length) * 100) : 0;

    const summaryEl = $('#lp-context-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `<span><b>${draft.groups.length}</b> 个阶段</span><span><b>${totalCount}</b> 项资源</span><span>能力覆盖 <b>${covered} / ${caps.length}</b></span>`;
    }

    const renderedGroups = draft.groups.map(groupHTML).filter(Boolean).join('');
    $('#lp-workspace').innerHTML = `
      <section class="lp-main-card" aria-label="学习阶段与资源">
        <header class="lp-board-head">
          <div class="lp-board-head-left">
            <h2>学习阶段与培养资源</h2>
            ${filterCapability
              ? `<button type="button" class="lp-active-filter-pill" data-action="clear-cap-filter">筛选能力：${e(filterCapability)} <span aria-hidden="true">×</span></button>`
              : `<span class="lp-board-sub">共 ${draft.groups.length} 个阶段 · ${totalCount} 项学习资源</span>`}
          </div>
          <div class="lp-board-head-right">
            <button class="btn btn-secondary" type="button" data-action="add-group">＋ 添加阶段分组</button>
          </div>
        </header>
        <div class="lp-main-body">
          ${renderedGroups
            ? `<ol class="lp-groups">${renderedGroups}</ol>`
            : `<div class="lp-empty">
                <h3>${filterCapability ? `暂无关联“${e(filterCapability)}”的学习资源` : '当前方案尚未配置学习阶段与资源'}</h3>
                <p>${filterCapability ? '可直接调用 AI 围绕该能力匹配课程与训战任务，或清除筛选查看全部阶段。' : '可使用 AI 围绕标准能力要求一键匹配平台课程与在岗实践活动，也可手动创建阶段分组。'}</p>
                <div class="lp-empty-actions">
                  ${filterCapability
                    ? `<button type="button" class="btn btn-primary" data-action="ai-capability" data-cap="${e(filterCapability)}">为“${e(filterCapability)}”AI 配资源</button><button type="button" class="btn btn-secondary" data-action="clear-cap-filter">清除能力筛选</button>`
                    : `<button type="button" class="btn btn-primary" data-action="ai-global">AI 帮建学习资源</button><button type="button" class="btn btn-secondary" data-action="add-group">手动添加阶段分组</button>`}
                </div>
              </div>`}
          ${draft.groups.length && !filterCapability ? `<button class="lp-add-group" type="button" data-action="add-group">${icon('plus')}<span>添加阶段分组</span></button>` : ''}
        </div>
      </section>
      <aside class="lp-sidebar" aria-label="标准能力覆盖统计">
        <div class="lp-cov-head">
          <h3>标准能力覆盖</h3>
          <strong class="lp-cov-ratio">${covered} / ${caps.length}</strong>
        </div>
        <div class="lp-cov-track" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <p class="lp-cov-hint">${caps.length ? (uncoveredCount ? `还有 ${uncoveredCount} 项能力待配资源，点击能力可筛选左侧列表` : '全部标准能力均已关联学习资源，点击能力可筛选查看') : '当前标准暂未配置能力项'}</p>
        ${uncoveredCount ? `<button type="button" class="lp-cov-fill-btn" data-action="ai-uncovered">${icon('sparkle')}<span>AI 补齐 ${uncoveredCount} 项待配能力</span></button>` : ''}
        <ul class="lp-coverage-list">
          ${caps.map(([name, level]) => {
            const info = stats.get(name) || {total:0};
            const active = filterCapability === name;
            return `<li class="${active ? 'is-active' : ''} ${!info.total ? 'is-uncovered' : ''}">
              <button type="button" class="lp-cov-filter" data-action="filter-cap" data-cap="${e(name)}" title="点击筛选关联资源">
                <span class="lp-ability-name">${e(name)}</span>
                <em class="lp-ability-lvl">${e(level || '不分级')}</em>
              </button>
              <span class="lp-cov-right">
                ${info.total
                  ? `<span class="lp-cov-count">${info.total} 项</span>`
                  : `<button type="button" class="lp-cov-ai-btn" data-action="ai-capability" data-cap="${e(name)}">AI配课</button>`}
              </span>
            </li>`;
          }).join('') || '<li class="lp-cov-empty-row">当前标准尚未配置能力项</li>'}
        </ul>
      </aside>`;
  }

  function capabilityCheckboxesHTML(selectedNames = []) {
    const selected = new Set(selectedNames);
    const caps = capabilities();
    if (!caps.length) return '<p class="text-sm muted">当前标准暂无能力项</p>';
    return `<fieldset class="lp-cap-picker-grid"><legend>关联标准能力项（可多选）</legend>${caps.map(([name, level]) => `<label class="lp-cap-check"><input type="checkbox" name="cap" value="${e(name)}" ${selected.has(name) ? 'checked' : ''}><span>${e(name)}</span><small>${e(level || '不分级')}</small></label>`).join('')}</fieldset>`;
  }

  function editGroup(group) {
    const isNew = !group;
    UI.openDialog({
      title: isNew ? '添加阶段分组' : '编辑阶段分组',
      body: `<div class="lp-form">${field('阶段标题（必填）','title',group?.title || '')}${field('阶段目标说明（选填）','output',group?.output || '',true)}</div>`,
      confirmLabel: isNew ? '创建分组' : '更新分组',
      onConfirm(dialog) {
        const title = dialog.querySelector('[name=title]').value.trim();
        if (!title) { dialog.showError('请填写阶段标题'); return false; }
        const values = {title, output: dialog.querySelector('[name=output]').value.trim()};
        if (isNew) { group = {id:uid('group'), ...values, activities:[]}; draft.groups.push(group); expanded.add(group.id); }
        else Object.assign(group, values);
        changed(); render();
      }
    });
  }

  function bindResourceCapabilities(group, index) {
    const item = group.activities[index];
    if (!item) return;
    const caps = capabilities().map(([name, level]) => ({id:name, label:name, description:level ? '标准要求 ' + level : '不分级'}));
    UI.openPicker({
      title: `关联能力项 · ${item.title}`,
      items: caps,
      selectedIds: item.capabilities || [],
      onConfirm(ids) { item.capabilities = ids; changed(); render(); }
    });
  }

  function addResource(group) {
    const rows = resourceCatalog();
    const available = rows.filter(item => !group.activities.some(existing => existing.kind === item.kind && existing.title === item.title));
    const caps = capabilities();
    const defaultCap = filterCapability || (caps[0]?.[0] || '');
    const dialog = UI.openDialog({
      title: `关联平台课程 / 项目 · ${group.title}`,
      confirmLabel: '添加到本阶段',
      body: `<div class="lp-form">
        <label>搜索课程或项目<input type="search" class="input" data-res-search placeholder="输入名称筛选"></label>
        <div class="lp-res-picker-list" data-res-list></div>
        <div class="lp-inline-row">
          <label>学习属性<select class="select" name="required"><option value="true" selected>必修</option><option value="false">选修</option></select></label>
        </div>
        ${capabilityCheckboxesHTML(defaultCap ? [defaultCap] : [])}
      </div>`,
      onConfirm(d) {
        const pickedIdx = [...d.querySelectorAll('input[name="res-item"]:checked')].map(i => Number(i.value));
        if (!pickedIdx.length) { d.showError('请至少选择一项课程或培训项目'); return false; }
        const chosenCaps = [...d.querySelectorAll('input[name="cap"]:checked')].map(i => i.value);
        if (!chosenCaps.length && caps.length) { d.showError('请至少勾选一项要关联的标准能力项'); return false; }
        const required = d.querySelector('[name="required"]').value === 'true';
        pickedIdx.forEach(idx => {
          const base = available[idx];
          const autoMatched = (base.tags || []).filter(t => allowedCapNames().has(t));
          const finalCaps = [...new Set([...chosenCaps, ...autoMatched])];
          group.activities.push({id:uid('act'), kind:base.kind, title:base.title, required, capabilities:finalCaps.length ? finalCaps : chosenCaps, note:base.hours ? `培训平台 · ${base.hours}` : '', source:'平台资源'});
        });
        expanded.add(group.id); changed(); render();
      }
    });
    const searchInput = dialog.querySelector('[data-res-search]'), listHost = dialog.querySelector('[data-res-list]');
    function renderResList() {
      const q = searchInput.value.trim().toLowerCase();
      listHost.innerHTML = available.map((item, idx) => ({item, idx})).filter(({item}) => !q || item.title.toLowerCase().includes(q) || item.kind.includes(q)).map(({item, idx}) => {
        const hintCaps = (item.tags || []).filter(t => allowedCapNames().has(t));
        return `<label class="picker-row"><input type="checkbox" name="res-item" value="${idx}"><span><strong>[${e(item.kind)}]</strong> ${e(item.title)}</span><small>${e([item.hours, hintCaps.length ? '契合：' + hintCaps.join('、') : ''].filter(Boolean).join(' · '))}</small></label>`;
      }).join('') || '<div class="empty-state">没有可添加的匹配资源</div>';
    }
    searchInput.oninput = renderResList;
    renderResList();
  }

  function editActivity(group, index) {
    const item = group.activities[index], isPlatform = item && ['课程','项目'].includes(item.kind);
    const defaultCaps = item ? (item.capabilities || []) : (filterCapability ? [filterCapability] : (capabilities()[0] ? [capabilities()[0][0]] : []));
    UI.openDialog({
      title: item ? '编辑学习资源与能力关联' : '添加实践培养活动',
      confirmLabel: item ? '保存修改' : '添加活动',
      body: `<div class="lp-form">
        ${isPlatform ? `<p class="lp-form-note"><strong>${e(item.kind)}：</strong>${e(item.title)}</p>` : `<label>活动形式<select class="select" name="kind">${['在岗实践','案例研读','复盘辅导','经验分享'].map(kind => `<option ${kind === item?.kind ? 'selected' : ''}>${kind}</option>`).join('')}</select></label>${field('活动名称（必填）','title',item?.title || '')}`}
        <label>学习属性<select class="select" name="required"><option value="true" ${item?.required !== false ? 'selected' : ''}>必修</option><option value="false" ${item?.required === false ? 'selected' : ''}>选修</option></select></label>
        ${field('执行要求 / 完成标准','note',item?.note || '',true)}
        ${capabilityCheckboxesHTML(defaultCaps)}
      </div>`,
      onConfirm(dialog) {
        const title = isPlatform ? item.title : dialog.querySelector('[name=title]').value.trim();
        if (!title) { dialog.showError('请填写活动名称'); return false; }
        const chosenCaps = [...dialog.querySelectorAll('input[name="cap"]:checked')].map(i => i.value);
        if (!chosenCaps.length && capabilities().length) { dialog.showError('请至少关联一项标准能力'); return false; }
        const values = {
          title,
          kind: isPlatform ? item.kind : dialog.querySelector('[name=kind]').value,
          required: dialog.querySelector('[name=required]').value === 'true',
          note: dialog.querySelector('[name=note]').value.trim(),
          capabilities: chosenCaps
        };
        if (item) Object.assign(item, values);
        else group.activities.push({id:uid('act'), ...values, source:'手工添加'});
        expanded.add(group.id); changed(); render();
      }
    });
  }

  $('#lp-ai-open')?.addEventListener('click', () => {
    window.LearningPlanAI?.open?.({});
  });

  document.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton || !draft || !standard) return;
    const group = draft.groups.find(item => item.id === actionButton.closest('[data-group]')?.dataset.group);
    const activityNode = actionButton.closest('[data-activity]'), index = activityNode ? Number(activityNode.dataset.activity) : -1;
    switch (actionButton.dataset.action) {
      case 'add-group': editGroup(); break;
      case 'edit-group': editGroup(group); break;
      case 'toggle': expanded.has(group.id) ? expanded.delete(group.id) : expanded.add(group.id); render(); document.querySelector(`[data-group="${group.id}"] .lp-task-toggle`)?.focus(); break;
      case 'add-resource': addResource(group); break;
      case 'add-activity': editActivity(group, -1); break;
      case 'edit-activity': editActivity(group, index); break;
      case 'bind-capabilities': bindResourceCapabilities(group, index); break;
      case 'filter-cap': filterCapability = filterCapability === actionButton.dataset.cap ? '' : actionButton.dataset.cap; render(); break;
      case 'clear-cap-filter': filterCapability = ''; render(); break;
      case 'ai-global': window.LearningPlanAI?.open?.({}); break;
      case 'ai-uncovered': window.LearningPlanAI?.open?.({uncoveredOnly: true}); break;
      case 'ai-group': if (group) window.LearningPlanAI?.open?.({groupId: group.id, groupTitle: group.title}); break;
      case 'ai-capability': window.LearningPlanAI?.open?.({capability: actionButton.dataset.cap}); break;
      case 'remove-group': UI.openDialog({title:'删除阶段分组', body:`<p>确认删除“${e(group.title)}”及其中的 ${group.activities.length} 项学习资源配置？来源标准和平台资源不受影响。</p>`, confirmLabel:'删除分组', onConfirm() { draft.groups = draft.groups.filter(item => item.id !== group.id); changed(); render(); }}); break;
      case 'remove-activity': UI.openDialog({title:'移除学习资源', body:`<p>从“${e(group.title)}”中移除“${e(group.activities[index].title)}”？</p>`, confirmLabel:'移除', onConfirm() { group.activities.splice(index, 1); changed(); render(); }}); break;
      case 'group-up': case 'group-down': {
        const current = draft.groups.indexOf(group), next = current + (actionButton.dataset.action === 'group-up' ? -1 : 1);
        if (next < 0 || next >= draft.groups.length) return;
        [draft.groups[current], draft.groups[next]] = [draft.groups[next], draft.groups[current]];
        changed(); render(); document.querySelector(`[data-group="${group.id}"] .lp-task-toggle`)?.focus(); break;
      }
      case 'up': case 'down': {
        const next = index + (actionButton.dataset.action === 'up' ? -1 : 1);
        if (next < 0 || next >= group.activities.length) return;
        [group.activities[index], group.activities[next]] = [group.activities[next], group.activities[index]];
        changed(); render(); document.querySelector(`[data-group="${group.id}"] [data-activity="${next}"] [data-action="edit-activity"]`)?.focus(); break;
      }
    }
  });

  $('#lp-save').onclick = () => {
    if (!position || !standard) return;
    try {
      const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
      all[JSON.stringify([positionId, standard.id])] = draft;
      localStorage.setItem(storageKey, JSON.stringify(all));
      data.selected = data.selected || {};
      data.selected['plan-' + positionId] = standard.id;
      S.write(data);
      dirty = false;
      setSaveBadge('saved');
      showToast('学习方案已保存');
    } catch (error) {
      showToast('保存失败，请检查浏览器存储空间与权限');
    }
  };

  $('#lp-preview').onclick = () => {
    if (!position || !standard) return;
    const dialog = UI.openDialog({
      title: '学习方案整体预览',
      body: `<p class="lp-preview-note">${e(position.name)} · ${e(standard.name)}</p><div class="lp-preview-content">${draft.groups.map((group, idx) => `<section class="lp-preview-cap"><h3>阶段 ${idx + 1} · ${e(group.title)}</h3>${group.output ? `<p>${e(group.output)}</p>` : ''}${group.activities.length ? `<ol>${group.activities.map(item => `<li><strong>[${e(item.kind)} · ${item.required !== false ? '必修' : '选修'}] ${e(item.title)}</strong>${item.capabilities?.length ? ` <span>（关联能力：${e(item.capabilities.join('、'))}）</span>` : ''}${item.note ? `<br><small class="muted">${e(item.note)}</small>` : ''}</li>`).join('')}</ol>` : '<p>暂无学习资源</p>'}</section>`).join('') || '<p>尚未创建学习阶段</p>'}</div>`,
      confirmLabel: '关闭',
      cancelLabel: ''
    });
    dialog.classList.add('lp-preview-dialog');
  };

  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  load();

  window.LearningPlanEditor = {
    hasStandard: () => Boolean(position && standard),
    initialLaunch: () => ({ai: initialAi, capability: initialCap}),
    clearInitialAiUrl: syncUrl,
    context: () => {
      const stats = standard ? resourceStats() : new Map();
      const capStats = {};
      stats.forEach((v, k) => { capStats[k] = v.total; });
      return {
        standard: standard ? S.clone(standard) : {id:'', name:'', content:{cap:[]}},
        position: position ? S.clone(position) : {id:'', name:''},
        groups: S.clone(draft.groups),
        capabilityCounts: capStats,
        uncoveredCapabilities: capabilities().map(([n]) => n).filter(n => !(stats.get(n)?.total))
      };
    },
    catalog: resourceCatalog,
    applyGenerated(generatedGroups, targetGroupId = '') {
      const allowed = allowedCapNames();
      if (!draft || !standard || !generatedGroups?.length) return false;
      if (targetGroupId) {
        const target = draft.groups.find(g => g.id === targetGroupId);
        if (!target) return false;
        generatedGroups.flatMap(g => g.activities || []).forEach(act => {
          const cleanCaps = (act.capabilities || []).filter(n => allowed.has(n));
          if (!target.activities.some(ex => ex.kind === act.kind && ex.title === act.title)) {
            target.activities.push({id:uid('act'), kind:act.kind, title:act.title, required:act.required !== false, capabilities:cleanCaps, note:act.note || '', source:act.source || 'AI生成'});
          }
        });
        expanded.add(target.id);
      } else {
        generatedGroups.forEach(g => {
          if (!g.title?.trim()) return;
          const existing = draft.groups.find(item => item.title === g.title.trim());
          const mappedActs = (g.activities || []).map(act => ({
            id:uid('act'), kind:act.kind, title:act.title, required:act.required !== false,
            capabilities:(act.capabilities || []).filter(n => allowed.has(n)), note:act.note || '', source:act.source || 'AI生成'
          }));
          if (existing) {
            mappedActs.forEach(act => {
              if (!existing.activities.some(ex => ex.kind === act.kind && ex.title === act.title)) existing.activities.push(act);
            });
            expanded.add(existing.id);
          } else {
            const added = {id:uid('group'), title:g.title.trim(), output:g.output || '', activities:mappedActs};
            draft.groups.push(added); expanded.add(added.id);
          }
        });
      }
      filterCapability = '';
      changed(); render(); return true;
    },
    append(groups) {
      return this.applyGenerated(groups);
    }
  };
})();
