(function () {
  const clean = text => text.trim().replace(/^[“「"]|[”」"。]$/g,'').trim();
  function parseTitles(text) {
    let source = text.trim();
    const explicit = /分为|分成|分组[为是叫：:]|阶段[为是叫：:]|顺序改为/.test(source);
    source = source.split(/分别(?:为|是)|依次(?:为|是)/).pop();
    source = source.replace(/^.*?(?:分为|分成|分组(?:名称)?[为是叫：:]|阶段(?:名称)?[为是叫：:]|顺序改为)\s*/,'');
    source = source.replace(/^[一二两三四五六七八九十\d]+个(?:阶段|分组)[：:，,\s]*/,'').replace(/[，,\s]*(?:共|一共)?[一二两三四五六七八九十\d]+个(?:阶段|分组)[。]?$/,'');
    const names = source.split(/[、，,；;\n→]+/).map(name => clean(name.replace(/^\s*(?:第[一二两三四五六七八九十\d]+(?:阶段|组)|\d+[.、])\s*[:：]?\s*/,''))).filter(Boolean);
    if ((!explicit && names.length < 2) || !names.length || names.some(name => name.length > 80 || /关联|帮我|请帮|改为|增加|新增|删除|个阶段|个分组/.test(name))) return [];
    return [...new Set(names)];
  }
  function abilityNames(text,names) {
    if (/^(?:关联|选择)?(?:全部|所有)(?:能力|能力项)?[。！!]?/.test(text.trim()) || /(?:关联|选择)(?:全部|所有)(?:的)?能力/.test(text)) return [...names];
    return names.filter(name => text.includes(name));
  }
  function targetGroup(text,groups) {
    const named = groups.map((group,index) => ({title:group.title,index})).filter(group => text.includes(group.title)).sort((a,b) => b.title.length - a.title.length)[0];
    if (named) return named.index;
    const match = text.match(/第([一二两三四五六七八九十\d]+)(?:个)?(?:阶段|分组|组)/);
    const numbers = {'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10};
    const index = match ? (numbers[match[1]] || Number(match[1])) - 1 : -1;
    return index >= 0 && index < groups.length ? index : -1;
  }
  function unmatchedAbilities(text,names) {
    const parts = text.split(/[、，,；;]+/).map(clean).filter(Boolean);
    return parts.length > 1 ? parts.filter(part => !names.some(name => part.includes(name))) : [];
  }
  function autoAssociate(groups,abilities) {
    const names = abilities.map(([name]) => name);
    const rules = [
      [/基础|准备|入门|认知|知识|学习|拓展|认识|理解/,/知识|理解|设计|洞察|分析|选型|特征|查询|规范/],
      [/实践|实战|交付|项目|攻坚|演练|落地|应用|推进/,/工程|编程|开发|系统|管理|销售|谈判|推进|协同|设计|查询/],
      [/复盘|分享|沉淀|总结|研讨|案例/,/理解|分析|洞察|管理|协同|沟通|创新|辅导|规范/]
    ];
    return groups.map(group => ({...group,capabilities:group.confirmed
      ? group.capabilities.filter(name => names.includes(name))
      : names.filter(name => group.title.includes(name) || rules.some(([titlePattern,abilityPattern]) => titlePattern.test(group.title) && abilityPattern.test(name)))}));
  }

  function matchPlatformResources(capName, catalog = []) {
    return catalog.filter(item => {
      if ((item.tags || []).includes(capName)) return true;
      const keywords = capName.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z]{2,}/g) || [capName];
      return keywords.some(kw => kw.length >= 2 && item.title.toLowerCase().includes(kw.toLowerCase()));
    });
  }

  function buildPracticeActivity(capName, level, appeal = '', definition = '') {
    const levelDesc = level ? `目标 ${level} 要求` : '掌握要求';
    const defHint = definition ? `（${definition.replace(/[。；;]+$/,'')}）` : '';
    const isCase = /案例|研讨|分析|洞察|设计|选型/.test(capName + ' ' + appeal);
    if (isCase) {
      return {
        kind: '案例研读',
        title: `围绕“${capName}”开展真实业务案例拆解与方案推演`,
        required: true,
        capabilities: [capName],
        note: `结合岗位${levelDesc}${defHint}，选取 1–2 个典型业务场景梳理关键决策点，输出改进方案并完成同行评审。`,
        source: 'AI生成'
      };
    }
    return {
      kind: '在岗实践',
      title: `在真实工作任务中完成一次“${capName}”实战应用与复盘`,
      required: true,
      capabilities: [capName],
      note: `对照${levelDesc}${defHint}制定行动清单，在业务任务中落地执行，提交过程记录与主管复盘反馈。`,
      source: 'AI生成'
    };
  }

  function generateResourcePlan({targetCaps = [], allCaps = [], catalog = [], appeal = '', targetGroupTitle = ''}) {
    const capMap = new Map(allCaps.map(([name, level]) => [name, level || '']));
    const matchedCourses = new Map(), matchedProjects = new Map(), practiceItems = [], unmatchedCourseCaps = [];
    targetCaps.forEach(capName => {
      const hits = matchPlatformResources(capName, catalog);
      const courses = hits.filter(h => h.kind === '课程');
      const projects = hits.filter(h => h.kind === '项目');
      if (!courses.length) unmatchedCourseCaps.push(capName);
      courses.slice(0, 2).forEach(course => {
        const key = course.title;
        if (!matchedCourses.has(key)) {
          matchedCourses.set(key, {kind:'课程', title:course.title, required:true, capabilities:[capName], note:course.hours ? `培训平台 · ${course.hours}` : '培训平台匹配课程', source:'平台资源', enabled:true});
        } else if (!matchedCourses.get(key).capabilities.includes(capName)) {
          matchedCourses.get(key).capabilities.push(capName);
        }
      });
      projects.slice(0, 1).forEach(proj => {
        const key = proj.title;
        if (!matchedProjects.has(key)) {
          matchedProjects.set(key, {kind:'项目', title:proj.title, required:true, capabilities:[capName], note:proj.hours ? `培训项目 · ${proj.hours}` : '培训平台匹配项目', source:'平台资源', enabled:true});
        } else if (!matchedProjects.get(key).capabilities.includes(capName)) {
          matchedProjects.get(key).capabilities.push(capName);
        }
      });
      const def = typeof window !== 'undefined' ? (window.IndicatorDemo?.definitionOf?.(capName) || '') : '';
      practiceItems.push({...buildPracticeActivity(capName, capMap.get(capName), appeal, def), enabled:true});
    });

    const requestedTitles = parseTitles(appeal);
    let groups = [];
    if (targetGroupTitle) {
      groups = [{
        title: targetGroupTitle,
        output: appeal && !requestedTitles.length ? appeal : '',
        activities: [...matchedCourses.values(), ...matchedProjects.values(), ...practiceItems]
      }];
    } else if (requestedTitles.length >= 2) {
      const allActs = [...matchedCourses.values(), ...matchedProjects.values(), ...practiceItems];
      groups = requestedTitles.map((title, idx) => ({
        title,
        output: '',
        activities: allActs.filter((_, actIdx) => actIdx % requestedTitles.length === idx)
      }));
      if (groups.some(g => !g.activities.length) && allActs.length) {
        groups[0].activities = [...matchedCourses.values()];
        if (groups[1]) groups[1].activities = [...matchedProjects.values(), ...practiceItems];
      }
    } else {
      const courseActs = [...matchedCourses.values()];
      const actionActs = [...matchedProjects.values(), ...practiceItems];
      if (courseActs.length) {
        groups.push({title:'理论与方法输入', output:'匹配平台既有课程夯实核心方法与知识框架。', activities:courseActs});
      }
      if (actionActs.length) {
        groups.push({title:'实战演练与复盘转化', output:'结合训战项目与在岗实践任务促成能力落地转化。', activities:actionActs});
      }
    }
    return {groups, unmatchedCourseCaps};
  }

  window.LearningPlanAI = {parseTitles, abilityNames, targetGroup, unmatchedAbilities, autoAssociate, generateResourcePlan};
  if (typeof document === 'undefined') return;
  const editor = window.LearningPlanEditor;
  if (!editor) return;
  const e = UI.escape, $ = selector => document.querySelector(selector);
  const drawer = $('#lp-ai-drawer'), bodyHost = $('#lp-ai-body');
  if (!drawer || !bodyHost) return;

  const examples = [
    '优先补齐待配能力，侧重在岗实战与案例拆解',
    '面向新晋升人员，分为基础输入、实战演练两个阶段并配齐资源',
    '针对核心能力匹配平台课程，并生成可验收的在岗实践任务'
  ];

  const sparkleSvg = '<svg aria-hidden="true" viewBox="0 0 14 14"><path d="M8.719 5.497c.02.067.071.118.137.138l3.952 1.17c.194.057.194.333 0 .39l-3.952 1.17a.204.204 0 0 0-.137.138l-1.17 3.951c-.058.195-.333.195-.39 0l-1.17-3.951a.204.204 0 0 0-.138-.138l-3.952-1.17c-.194-.057-.194-.333 0-.39l3.952-1.17a.204.204 0 0 0 .137-.138l1.17-3.95c.058-.196.333-.196.391 0l1.17 3.95Z"/><path d="M3.515 3.148a.07.07 0 0 0 .047.047l1.359.402c.067.02.067.115 0 .135l-1.359.402a.07.07 0 0 0-.047.047l-.402 1.358c-.02.067-.114.067-.134 0l-.402-1.358a.07.07 0 0 0-.048-.047l-1.358-.402c-.067-.02-.067-.115 0-.135l1.358-.402a.07.07 0 0 0 .048-.047l.402-1.358c.02-.067.114-.067.134 0l.402 1.358Z" opacity=".55"/></svg>';
  const sendSvg = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="16" fill="currentColor"/><path d="M16 9.6 10.8 15a.75.75 0 1 0 1.08 1.04l3.37-3.5V22a.75.75 0 0 0 1.5 0v-9.46l3.37 3.5A.75.75 0 1 0 21.2 15L16 9.6Z" fill="#fff"/></svg>';
  const aiAvatar = '<span class="lp-ai-avatar" aria-hidden="true"><img src="vendor/ai-assistant/ai-mark-a.859a3c0a.svg" alt=""><img src="vendor/ai-assistant/ai-mark-b.adf436fe.svg" alt=""></span>';

  let phase = 'setup', selectedCaps = [], targetGroupId = '', targetGroupTitle = '', appeal = '', draftInput = '', errorMsg = '', planResult = null, turns = [], sessionKey = '';

  const getCtx = () => editor.context();
  const say = (role, text) => turns.push({role, text});
  const currentKey = ctx => `${ctx.position?.id || ''}:${ctx.standard?.id || ''}`;

  function initSession(options = {}) {
    const ctx = getCtx();
    sessionKey = currentKey(ctx);
    const allCapNames = (ctx.standard.content.cap || []).map(([n]) => n);
    turns = [];
    appeal = '';
    draftInput = '';
    errorMsg = '';
    planResult = null;
    targetGroupId = options.groupId || '';
    targetGroupTitle = options.groupTitle || '';
    if (options.capability && allCapNames.includes(options.capability)) {
      selectedCaps = [options.capability];
    } else if (options.uncoveredOnly && ctx.uncoveredCapabilities?.length) {
      selectedCaps = [...ctx.uncoveredCapabilities];
    } else if (ctx.uncoveredCapabilities?.length) {
      selectedCaps = [...ctx.uncoveredCapabilities];
    } else {
      selectedCaps = [...allCapNames];
    }
    phase = 'setup';
    render();
  }

  function open(options = {}) {
    const ctx = getCtx();
    const hasSpecificTarget = Boolean(options.capability || options.groupId || options.uncoveredOnly);
    if (hasSpecificTarget || sessionKey !== currentKey(ctx) || (!planResult && phase !== 'setup')) {
      initSession(options);
    } else {
      render(true);
    }
    if (typeof openOverlay === 'function') openOverlay('lp-ai-drawer');
    setTimeout(() => drawer.querySelector('#lp-ai-prompt')?.focus(), 60);
  }

  function kindClass(kind) {
    if (kind === '课程') return 'is-course';
    if (kind === '项目') return 'is-project';
    return 'is-practice';
  }

  function setupViewHTML(ctx) {
    const caps = ctx.standard.content.cap || [];
    const existingGroups = ctx.groups || [];
    const counts = ctx.capabilityCounts || {};
    const uncoveredCount = ctx.uncoveredCapabilities?.length || 0;
    const chosenGroup = existingGroups.find(g => g.id === targetGroupId);
    return `<div class="lp-ai-setup-scroll">
      <div class="lp-ai-setup-container">
        <div class="lp-ai-hero">
          <h2>围绕岗位标准能力，匹配课程并生成培养活动</h2>
          <p>自动检索培训平台课程与训练项目；暂无现成匹配课程的能力项，将按能力等级要求自动生成在岗实践或案例研读任务，并逐项绑定关联能力。</p>
        </div>

        <section class="lp-ai-config-card" aria-label="配课范围设置">
          <div class="lp-ai-config-head">
            <div>
              <strong>选择本次配课的能力项</strong>
              <span class="lp-ai-count-pill">已选 ${selectedCaps.length} / ${caps.length}</span>
            </div>
            <div class="lp-ai-quick-selects">
              ${uncoveredCount ? `<button type="button" class="btn-text" data-plan-ai="select-uncovered">仅选待配能力（${uncoveredCount}）</button>` : ''}
              <button type="button" class="btn-text" data-plan-ai="select-all">全选</button>
              <button type="button" class="btn-text" data-plan-ai="select-none">清空</button>
            </div>
          </div>

          <div class="lp-ai-cap-grid" role="group" aria-label="标准能力项">
            ${caps.map(([name, level]) => {
              const checked = selectedCaps.includes(name);
              const resCount = counts[name] || 0;
              return `<label class="lp-ai-cap-item ${checked ? 'is-checked' : ''}">
                <input type="checkbox" data-ai-cap value="${e(name)}" ${checked ? 'checked' : ''}>
                <span class="lp-ai-cap-name">${e(name)}</span>
                <span class="lp-ai-cap-badges">
                  <em>${e(level || '不分级')}</em>
                  <i class="${resCount ? 'is-covered' : 'is-gap'}">${resCount ? `已配 ${resCount}` : '待配'}</i>
                </span>
              </label>`;
            }).join('') || '<p class="muted">当前标准暂无能力项</p>'}
          </div>

          <div class="lp-ai-stage-row">
            <label for="lp-ai-target-group">阶段归入方式</label>
            <select class="select lp-ai-stage-select" id="lp-ai-target-group">
              <option value="" ${!targetGroupId ? 'selected' : ''}>自动按培养阶段组织（理论输入 ＋ 实战转化）</option>
              ${existingGroups.map(g => `<option value="${e(g.id)}" ${g.id === targetGroupId ? 'selected' : ''}>归入已有阶段：${e(g.title)}</option>`).join('')}
            </select>
          </div>
        </section>

        <section class="lp-ai-composer-section" aria-label="补充诉求与生成">
          <div class="lp-ai-example-bar">
            <span>常用诉求：</span>
            ${examples.map(text => `<button type="button" class="lp-ai-example-chip" data-plan-ai="example" data-prompt="${e(text)}">${e(text)}</button>`).join('')}
          </div>
          <div class="lp-ai-input-shell">
            <label class="sr-only" for="lp-ai-prompt">补充培养诉求或阶段安排</label>
            <textarea id="lp-ai-prompt" rows="2" maxlength="3000" placeholder="选填：输入培养对象、自定义阶段名称（如“分为基础认知、项目实战”）或活动侧重；留空也可直接开始生成">${e(draftInput)}</textarea>
            <div class="lp-ai-input-footer">
              <span class="lp-ai-selection-hint">已勾选 <b>${selectedCaps.length}</b> 项能力${chosenGroup ? ` · 归入「${e(chosenGroup.title)}」` : ''}</span>
              <button type="button" class="btn btn-primary lp-ai-generate-btn" data-plan-ai="generate" ${!caps.length ? 'disabled' : ''}>${sparkleSvg}<span>开始匹配并生成资源</span></button>
            </div>
          </div>
          <p class="lp-ai-error" id="lp-ai-error" role="alert">${e(errorMsg)}</p>
        </section>
      </div>
    </div>`;
  }

  function workbenchViewHTML(ctx) {
    const {groups, unmatchedCourseCaps} = planResult || {groups:[], unmatchedCourseCaps:[]};
    const allActs = groups.flatMap(g => g.activities);
    const enabledActs = allActs.filter(a => a.enabled !== false);
    const platformCount = enabledActs.filter(a => ['课程','项目'].includes(a.kind)).length;
    const practiceCount = enabledActs.filter(a => !['课程','项目'].includes(a.kind)).length;
    const capSummary = new Map();
    enabledActs.forEach(a => (a.capabilities || []).forEach(c => capSummary.set(c, (capSummary.get(c) || 0) + 1)));
    const coveredSelected = selectedCaps.filter(c => (capSummary.get(c) || 0) > 0).length;

    return `<div class="lp-ai-workbench">
      <section class="lp-ai-thread-col" aria-label="生成记录与对话微调">
        <header class="lp-ai-pane-head">
          <strong>生成说明与对话微调</strong>
          ${phase === 'ready' ? '<button type="button" class="btn-text" data-plan-ai="back-setup">重选能力范围</button>' : ''}
        </header>
        <div class="lp-ai-thread-scroll" id="lp-ai-thread-scroll">
          <div class="lp-ai-turns">
            ${turns.map(turn => turn.role === 'user'
              ? `<div class="lp-ai-turn is-user"><div class="lp-ai-user-bubble">${e(turn.text)}</div></div>`
              : `<div class="lp-ai-turn is-ai">${aiAvatar}<div class="lp-ai-ai-bubble">${e(turn.text)}</div></div>`).join('')}
          </div>

          ${unmatchedCourseCaps.length ? `<div class="lp-ai-fallback-notice" role="status">
            <strong>无现成课程自动承接说明</strong>
            <p>培训平台暂无与「${e(unmatchedCourseCaps.join('、'))}」直接匹配的现成课程，已结合能力等级与指标定义自动生成在岗实践/案例研读活动承接。</p>
          </div>` : ''}

          <section class="lp-ai-cov-card" aria-label="本次能力覆盖核对">
            <header><strong>目标能力覆盖核对</strong><span>${coveredSelected} / ${selectedCaps.length} 已覆盖</span></header>
            <ul>
              ${selectedCaps.map(name => {
                const count = capSummary.get(name) || 0;
                return `<li class="${count ? 'is-ok' : 'is-warn'}"><span>${e(name)}</span><b>${count ? `${count} 项资源` : '未勾选资源'}</b></li>`;
              }).join('')}
            </ul>
          </section>
        </div>

        <div class="lp-ai-followup-dock">
          ${phase === 'ready' ? `<div class="lp-ai-followup-chips">
            <button type="button" data-plan-ai="quick-followup" data-prompt="给${e(selectedCaps[0] || '核心能力')}再增加一项复盘辅导">＋ 补充复盘辅导</button>
            <button type="button" data-plan-ai="quick-followup" data-prompt="给${e(selectedCaps[0] || '核心能力')}再增加一项案例研读">＋ 补充案例研读</button>
          </div>` : ''}
          <div class="lp-ai-followup-box">
            <label class="sr-only" for="lp-ai-prompt">输入微调要求</label>
            <textarea id="lp-ai-prompt" rows="2" maxlength="3000" ${phase === 'applied' ? 'disabled' : ''} placeholder="${phase === 'applied' ? '当前草稿已应用到学习方案，可点击“继续配课”开启新一轮' : '继续输入调整要求，如“给系统架构增加一项案例研读”'}">${e(draftInput)}</textarea>
            <button type="button" class="std-ai-send" id="lp-ai-send" aria-label="发送" title="发送" ${!draftInput.trim() || phase === 'applied' ? 'disabled' : ''}>${sendSvg}</button>
          </div>
        </div>
      </section>

      <section class="lp-ai-canvas-col" aria-label="方案资源草稿画布">
        <header class="lp-ai-pane-head lp-ai-canvas-head">
          <div class="lp-ai-canvas-title">
            <strong>方案资源草稿</strong>
            <span class="lp-ai-state-pill ${phase === 'applied' ? 'is-done' : ''}">${phase === 'applied' ? '已写入学习方案' : '可勾选保留项并微调能力标签'}</span>
          </div>
          <span class="lp-ai-canvas-count">已选 <b>${enabledActs.length}</b> / ${allActs.length} 项资源</span>
        </header>

        <div class="lp-ai-canvas-scroll" id="lp-ai-canvas-scroll">
          <div class="lp-ai-metrics">
            <div><b>${groups.length}</b><span>培养阶段</span></div>
            <div><b>${platformCount}</b><span>平台课程 / 项目</span></div>
            <div><b>${practiceCount}</b><span>AI 训战活动</span></div>
            <div><b>${coveredSelected} / ${selectedCaps.length}</b><span>覆盖目标能力</span></div>
          </div>

          <div class="lp-ai-stage-list">
            ${groups.map((group, gi) => `<section class="lp-ai-stage-card">
              <header class="lp-ai-stage-head">
                <div>
                  <span class="lp-ai-stage-badge">阶段 ${gi + 1}</span>
                  <h4>${e(group.title)}</h4>
                </div>
                <span>${group.activities.filter(a => a.enabled !== false).length} 项已选</span>
              </header>
              ${group.output ? `<p class="lp-ai-stage-desc">${e(group.output)}</p>` : ''}
              <div class="lp-ai-res-cards">
                ${group.activities.map((act, ai) => `<article class="lp-ai-res-card ${act.enabled === false ? 'is-muted' : ''}">
                  <div class="lp-ai-res-top">
                    <label class="lp-ai-res-check">
                      <input type="checkbox" data-ai-res-toggle="${gi},${ai}" ${act.enabled !== false ? 'checked' : ''} ${phase === 'applied' ? 'disabled' : ''}>
                      <span class="lp-kind ${kindClass(act.kind)}">${e(act.kind)}</span>
                      <span class="lp-ai-source-tag">${e(act.source || (['课程','项目'].includes(act.kind) ? '平台资源' : 'AI生成'))}</span>
                      <strong>${e(act.title)}</strong>
                    </label>
                    ${phase === 'ready'
                      ? `<button type="button" class="lp-ai-req-btn ${act.required !== false ? 'is-req' : ''}" data-plan-ai="toggle-req" data-pos="${gi},${ai}" title="点击切换必修/选修">${act.required !== false ? '必修' : '选修'}</button>`
                      : `<span class="lp-ai-req-static ${act.required !== false ? 'is-req' : ''}">${act.required !== false ? '必修' : '选修'}</span>`}
                  </div>
                  ${act.note ? `<p class="lp-ai-res-note">${e(act.note)}</p>` : ''}
                  <div class="lp-ai-cap-chips" aria-label="${e(act.title)}的关联能力">
                    <small>关联能力</small>
                    ${(act.capabilities || []).map(cap => phase === 'ready'
                      ? `<button type="button" data-plan-ai="remove-res-cap" data-pos="${gi},${ai}" data-cap="${e(cap)}" aria-label="移除${e(cap)}">${e(cap)}<span aria-hidden="true">×</span></button>`
                      : `<span>${e(cap)}</span>`).join('') || '<span class="lp-ai-unmatched">请至少保留 1 项关联能力</span>'}
                    ${phase === 'ready' ? `<button type="button" class="lp-ai-add-cap" data-plan-ai="pick-res-cap" data-pos="${gi},${ai}">＋ 关联能力</button>` : ''}
                  </div>
                </article>`).join('')}
              </div>
            </section>`).join('')}
          </div>
        </div>

        <footer class="lp-ai-canvas-foot">
          <div class="lp-ai-foot-left">
            ${errorMsg
              ? `<p class="lp-ai-error" id="lp-ai-error" role="alert">${e(errorMsg)}</p>`
              : `<span class="lp-ai-foot-note">${phase === 'applied' ? '已并入当前页面草稿，关闭抽屉后点击右上角“保存方案”即可持久化。' : '确认勾选与能力绑定无误后，一键并入当前学习方案草稿。'}</span>`}
          </div>
          <div class="lp-ai-foot-actions">
            ${phase === 'ready'
              ? `<button type="button" class="btn btn-secondary" data-plan-ai="regenerate">重新生成</button>
                 <button type="button" class="btn btn-primary" data-plan-ai="apply" ${!enabledActs.length ? 'disabled' : ''}>应用到学习方案（${enabledActs.length} 项）</button>`
              : `<button type="button" class="btn btn-secondary" data-plan-ai="new-session">继续配课</button>
                 <button type="button" class="btn btn-primary" data-close>完成并查看方案</button>`}
          </div>
        </footer>
      </section>
    </div>`;
  }

  function render(keepScroll = false) {
    const prevCanvasScroll = $('#lp-ai-canvas-scroll')?.scrollTop || 0;
    const prevThreadScroll = $('#lp-ai-thread-scroll')?.scrollTop || 0;
    const prevSetupScroll = bodyHost.querySelector('.lp-ai-setup-scroll')?.scrollTop || 0;
    const ctx = getCtx();
    const aiCtx = $('#lp-ai-context');
    if (aiCtx) aiCtx.textContent = ctx.position?.name && ctx.standard?.name ? `${ctx.position.name} · ${ctx.standard.name}` : '';

    bodyHost.innerHTML = phase === 'setup' ? setupViewHTML(ctx) : workbenchViewHTML(ctx);

    if (phase === 'setup' && keepScroll) {
      const sc = bodyHost.querySelector('.lp-ai-setup-scroll');
      if (sc) sc.scrollTop = prevSetupScroll;
    } else if (phase !== 'setup') {
      const cs = $('#lp-ai-canvas-scroll'), ts = $('#lp-ai-thread-scroll');
      if (cs && keepScroll) cs.scrollTop = prevCanvasScroll;
      if (ts) ts.scrollTop = keepScroll ? prevThreadScroll : ts.scrollHeight;
    }
  }

  function runGeneration(customAppeal = '') {
    if (!selectedCaps.length) {
      errorMsg = '请至少勾选一项需要配资源的能力项';
      render(true);
      return;
    }
    const ctx = getCtx();
    if (customAppeal) appeal = customAppeal;
    const chosenGroup = (ctx.groups || []).find(g => g.id === targetGroupId);
    targetGroupTitle = chosenGroup ? chosenGroup.title : '';
    say('user', `目标能力：${selectedCaps.join('、')}${targetGroupTitle ? `；归入阶段：${targetGroupTitle}` : ''}${appeal ? `；补充诉求：${appeal}` : ''}`);
    planResult = generateResourcePlan({
      targetCaps: selectedCaps,
      allCaps: ctx.standard.content.cap || [],
      catalog: editor.catalog(),
      appeal,
      targetGroupTitle
    });
    const matchedCount = planResult.groups.reduce((s, g) => s + g.activities.filter(a => ['课程','项目'].includes(a.kind)).length, 0);
    const genCount = planResult.groups.reduce((s, g) => s + g.activities.filter(a => !['课程','项目'].includes(a.kind)).length, 0);
    say('assistant', `已围绕 ${selectedCaps.length} 项能力检索匹配 ${matchedCount} 项平台课程/培训项目，并生成 ${genCount} 项训战实践活动。右侧画布可直接勾选条目、切换必修/选修或增删关联能力。`);
    phase = 'ready';
    draftInput = '';
    errorMsg = '';
    render();
  }

  function handleFollowup(text) {
    const ctx = getCtx();
    const allCapNames = (ctx.standard.content.cap || []).map(([n]) => n);
    say('user', text);
    const mentionedCaps = abilityNames(text, allCapNames);
    if (phase === 'ready' && planResult && /(?:增加|补充|新增|再加|补一)/.test(text)) {
      const targetCap = mentionedCaps[0] || selectedCaps[0] || allCapNames[0];
      const kind = /复盘|辅导/.test(text) ? '复盘辅导' : /案例|研读/.test(text) ? '案例研读' : /分享/.test(text) ? '经验分享' : '在岗实践';
      const targetGrp = planResult.groups[planResult.groups.length - 1] || planResult.groups[0];
      if (targetGrp && targetCap) {
        targetGrp.activities.push({
          kind,
          title: `围绕“${targetCap}”开展专项${kind}任务`,
          required: !/选修/.test(text),
          capabilities: mentionedCaps.length ? mentionedCaps : [targetCap],
          note: text,
          source: 'AI生成',
          enabled: true
        });
        if (!selectedCaps.includes(targetCap)) selectedCaps.push(targetCap);
        say('assistant', `已在「${targetGrp.title}」中新增 1 项${kind}活动并自动绑定「${(mentionedCaps.length ? mentionedCaps : [targetCap]).join('、')}」。`);
        draftInput = '';
        errorMsg = '';
        render();
        return;
      }
    }
    if (mentionedCaps.length) selectedCaps = mentionedCaps;
    draftInput = '';
    runGeneration(text);
  }

  function submitPrompt() {
    const promptEl = drawer.querySelector('#lp-ai-prompt');
    const text = (promptEl ? promptEl.value : draftInput).trim();
    if (phase === 'applied') return;
    if (phase === 'setup') {
      runGeneration(text);
    } else if (text) {
      handleFollowup(text);
    }
  }

  bodyHost.addEventListener('change', event => {
    const target = event.target;
    if (target.hasAttribute('data-ai-cap')) {
      selectedCaps = [...bodyHost.querySelectorAll('[data-ai-cap]:checked')].map(i => i.value);
      errorMsg = '';
      render(true);
    } else if (target.id === 'lp-ai-target-group') {
      targetGroupId = target.value;
      const ctx = getCtx();
      targetGroupTitle = (ctx.groups || []).find(g => g.id === targetGroupId)?.title || '';
      render(true);
    } else if (target.hasAttribute('data-ai-res-toggle')) {
      const [gi, ai] = target.dataset.aiResToggle.split(',').map(Number);
      if (planResult?.groups[gi]?.activities[ai]) {
        planResult.groups[gi].activities[ai].enabled = target.checked;
        errorMsg = '';
        render(true);
      }
    }
  });

  bodyHost.addEventListener('input', event => {
    if (event.target.id === 'lp-ai-prompt') {
      draftInput = event.target.value;
      errorMsg = '';
      const sendBtn = drawer.querySelector('#lp-ai-send');
      if (sendBtn) sendBtn.disabled = !draftInput.trim() || phase === 'applied';
    }
  });

  bodyHost.addEventListener('keydown', event => {
    if (event.target.id === 'lp-ai-prompt' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submitPrompt();
    }
  });

  drawer.addEventListener('click', event => {
    if (event.target.closest('#lp-ai-send')) {
      submitPrompt();
      return;
    }
    const control = event.target.closest('[data-plan-ai]');
    if (!control) return;
    errorMsg = '';
    const ctx = getCtx();
    const allCapNames = (ctx.standard.content.cap || []).map(([n]) => n);
    switch (control.dataset.planAi) {
      case 'select-all': selectedCaps = [...allCapNames]; render(true); break;
      case 'select-none': selectedCaps = []; render(true); break;
      case 'select-uncovered': selectedCaps = ctx.uncoveredCapabilities?.length ? [...ctx.uncoveredCapabilities] : [...allCapNames]; render(true); break;
      case 'example': {
        draftInput = control.dataset.prompt || '';
        render(true);
        const p = drawer.querySelector('#lp-ai-prompt');
        if (p) { p.focus(); p.setSelectionRange(p.value.length, p.value.length); }
        break;
      }
      case 'quick-followup': {
        const text = control.dataset.prompt || '';
        if (text && phase === 'ready') handleFollowup(text);
        break;
      }
      case 'generate': submitPrompt(); break;
      case 'regenerate': runGeneration(appeal); break;
      case 'back-setup': phase = 'setup'; render(); break;
      case 'new-session': initSession({}); break;
      case 'toggle-req': {
        const [gi, ai] = control.dataset.pos.split(',').map(Number);
        const act = planResult?.groups[gi]?.activities[ai];
        if (act) { act.required = act.required === false; render(true); }
        break;
      }
      case 'remove-res-cap': {
        const [gi, ai] = control.dataset.pos.split(',').map(Number);
        const act = planResult?.groups[gi]?.activities[ai];
        if (act) { act.capabilities = (act.capabilities || []).filter(c => c !== control.dataset.cap); render(true); }
        break;
      }
      case 'pick-res-cap': {
        const [gi, ai] = control.dataset.pos.split(',').map(Number);
        const act = planResult?.groups[gi]?.activities[ai];
        if (!act) break;
        const items = (ctx.standard.content.cap || []).map(([name, level]) => ({id:name, label:name, description:level ? '标准要求 ' + level : '不分级'}));
        UI.openPicker({
          title: `调整关联能力 · ${act.title}`,
          items,
          selectedIds: act.capabilities || [],
          keepParent: true,
          onConfirm(ids) { act.capabilities = ids; render(true); }
        });
        break;
      }
      case 'apply': {
        if (!planResult) break;
        const filteredGroups = planResult.groups.map(g => ({
          title: g.title,
          output: g.output || '',
          activities: g.activities.filter(a => a.enabled !== false)
        })).filter(g => g.activities.length);
        if (!filteredGroups.length) { errorMsg = '请至少勾选保留一项学习资源'; render(true); return; }
        const missingCap = filteredGroups.some(g => g.activities.some(a => !(a.capabilities || []).length));
        if (missingCap) { errorMsg = '每项应用的学习资源请至少保留 1 个关联能力标签'; render(true); return; }
        if (editor.applyGenerated(filteredGroups, targetGroupId)) {
          phase = 'applied';
          say('assistant', '已将所选学习资源与能力绑定关系写入当前学习方案草稿。关闭抽屉核对无误后，请点击页面右上角“保存方案”。');
          render(true);
          showToast('已添加到学习方案草稿');
        }
        break;
      }
    }
  });

  $('#lp-ai-new-chat').onclick = () => initSession({});

  window.LearningPlanAI.open = open;
  window.LearningPlanAI.refreshContext = () => initSession({});
  initSession({});

  const launch = editor.initialLaunch?.();
  if (launch?.ai && editor.hasStandard?.()) {
    editor.clearInitialAiUrl?.();
    setTimeout(() => open(launch.capability ? {capability: launch.capability} : {}), 40);
  }
})();
