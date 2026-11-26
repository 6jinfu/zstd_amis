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
  const drawer = $('#lp-ai-drawer'), chat = drawer.querySelector('.std-ai-chat'), host = $('#lp-ai-messages'), prompt = $('#lp-ai-prompt'), send = $('#lp-ai-send');

  const examples = [
    '优先补齐尚未配资源的能力，侧重在岗实战与案例拆解',
    '面向新晋升人员，分为基础输入、实战演练两个阶段并配齐资源',
    '针对重点能力匹配平台课程，并生成可验收的在岗实践任务'
  ];

  let phase = 'setup', selectedCaps = [], targetGroupId = '', targetGroupTitle = '', appeal = '', planResult = null, turns = [];

  const getCtx = () => editor.context();
  const say = (role, text) => turns.push({role, text});
  const setError = text => { $('#lp-ai-error').textContent = text || ''; };

  function initSession(options = {}) {
    const ctx = getCtx();
    const allCapNames = (ctx.standard.content.cap || []).map(([n]) => n);
    turns = [];
    appeal = '';
    planResult = null;
    targetGroupId = options.groupId || '';
    targetGroupTitle = options.groupTitle || '';
    if (options.capability && allCapNames.includes(options.capability)) {
      selectedCaps = [options.capability];
    } else if (ctx.uncoveredCapabilities?.length) {
      selectedCaps = [...ctx.uncoveredCapabilities];
    } else {
      selectedCaps = [...allCapNames];
    }
    phase = 'setup';
    prompt.value = '';
    setError('');
    render();
  }

  function open(options = {}) {
    initSession(options);
    if (typeof openOverlay === 'function') openOverlay('lp-ai-drawer');
    setTimeout(() => prompt.focus(), 60);
  }

  function syncComposer() {
    prompt.disabled = phase === 'applied';
    send.disabled = !prompt.value.trim() || phase === 'applied';
    prompt.placeholder = phase === 'setup'
      ? '选填培养对象、阶段安排或侧重方式，也可直接点击上方“开始匹配与生成”'
      : phase === 'ready'
        ? '可继续输入调整要求，例如“给商务谈判再增加一项复盘辅导”'
        : '本次生成资源已应用，可点击左上角新建会话';
  }

  function setupCardHTML() {
    const ctx = getCtx();
    const caps = ctx.standard.content.cap || [];
    const existingGroups = ctx.groups || [];
    return `<section class="lp-ai-card">
      <div class="lp-ai-step-head"><h3>第一步：确认目标能力与归入方式</h3><div class="lp-ai-step-links"><button type="button" class="btn-text" data-plan-ai="select-uncovered">仅选未配课能力</button><button type="button" class="btn-text" data-plan-ai="select-all">全选</button></div></div>
      <fieldset class="lp-ai-capabilities">
        <legend>选择本次需要配资源的能力项（已选 ${selectedCaps.length} / ${caps.length} 项）</legend>
        ${caps.map(([name, level]) => `<label><input type="checkbox" data-ai-cap value="${e(name)}" ${selectedCaps.includes(name) ? 'checked' : ''}><span>${e(name)}</span><span>${e(level || '不分级')}</span></label>`).join('') || '<p>当前标准暂无能力项</p>'}
      </fieldset>
      <div class="lp-ai-placement">
        <label for="lp-ai-target-group">落入阶段方式</label>
        <select class="select" id="lp-ai-target-group">
          <option value="" ${!targetGroupId ? 'selected' : ''}>自动按培养阶段组织分组</option>
          ${existingGroups.map(g => `<option value="${e(g.id)}" ${g.id === targetGroupId ? 'selected' : ''}>归入已有阶段：${e(g.title)}</option>`).join('')}
        </select>
      </div>
      <div class="lp-ai-quick-examples">
        <span>快捷诉求：</span>
        ${examples.map(text => `<button type="button" class="lp-ai-example-chip" data-plan-ai="example" data-prompt="${e(text)}">${e(text)}</button>`).join('')}
      </div>
      <div class="lp-ai-card-actions">
        <button type="button" class="btn btn-primary" data-plan-ai="generate" ${!caps.length ? 'disabled' : ''}>开始匹配平台资源并生成活动</button>
      </div>
    </section>`;
  }

  function readyCardHTML() {
    if (!planResult) return '';
    const {groups, unmatchedCourseCaps} = planResult;
    const totalEnabled = groups.reduce((s, g) => s + g.activities.filter(a => a.enabled !== false).length, 0);
    return `<section class="lp-ai-card">
      <div class="lp-ai-step-head">
        <h3>${phase === 'applied' ? '已应用到学习方案' : '第二步：核对匹配资源与能力关联'}</h3>
        <span class="muted text-sm">已选 ${totalEnabled} 项资源</span>
      </div>
      ${unmatchedCourseCaps.length ? `<div class="lp-ai-notice" role="status">平台暂无与“${e(unmatchedCourseCaps.join('、'))}”直接匹配的现成课程，已自动生成在岗实践/研读活动承接。</div>` : ''}
      ${groups.map((group, gi) => `<section class="lp-ai-ready-group">
        <header><h4>阶段 ${gi + 1} · ${e(group.title)}</h4></header>
        <div class="lp-ai-res-cards">
          ${group.activities.map((act, ai) => `<article class="lp-ai-res-card ${act.enabled === false ? 'is-muted' : ''}">
            <div class="lp-ai-res-top">
              <label class="lp-ai-res-check">
                <input type="checkbox" data-ai-res-toggle="${gi},${ai}" ${act.enabled !== false ? 'checked' : ''} ${phase === 'applied' ? 'disabled' : ''}>
                <span class="lp-ai-res-kind ${['课程','项目'].includes(act.kind) ? 'is-platform' : 'is-ai'}">${e(act.kind)}</span>
                <strong>${e(act.title)}</strong>
              </label>
              ${phase === 'ready' ? `<button type="button" class="lp-ai-req-btn" data-plan-ai="toggle-req" data-pos="${gi},${ai}">${act.required !== false ? '必修' : '选修'}</button>` : `<span class="lp-ai-req-static">${act.required !== false ? '必修' : '选修'}</span>`}
            </div>
            ${act.note ? `<p class="lp-ai-res-note">${e(act.note)}</p>` : ''}
            <div class="lp-ai-cap-chips" aria-label="${e(act.title)}的关联能力">
              ${(act.capabilities || []).map(cap => phase === 'ready'
                ? `<button type="button" data-plan-ai="remove-res-cap" data-pos="${gi},${ai}" data-cap="${e(cap)}" aria-label="移除${e(cap)}">${e(cap)}<span aria-hidden="true">×</span></button>`
                : `<span>${e(cap)}</span>`).join('') || '<span class="lp-ai-unmatched">未绑定能力</span>'}
              ${phase === 'ready' ? `<button type="button" class="lp-ai-add-cap" data-plan-ai="pick-res-cap" data-pos="${gi},${ai}">＋ 关联能力</button>` : ''}
            </div>
          </article>`).join('')}
        </div>
      </section>`).join('')}
      <div class="lp-ai-card-actions">
        ${phase === 'ready' ? `<button type="button" class="btn btn-secondary" data-plan-ai="back-setup">返回调整能力范围</button>` : ''}
        <button type="button" class="btn btn-primary" data-plan-ai="apply" ${phase === 'applied' || !totalEnabled ? 'disabled' : ''}>${phase === 'applied' ? '已添加到方案草稿' : '应用到学习方案'}</button>
      </div>
    </section>`;
  }

  function render(keepScroll = false) {
    const scrollTop = host.scrollTop;
    chat.classList.add('conversation-mode');
    const hasPreview = !!planResult?.groups?.length;
    drawer.classList.toggle('has-preview', hasPreview);
    const bodyCard = phase === 'setup' ? setupCardHTML() : readyCardHTML();
    host.innerHTML = `<div class="lp-ai-thread">${turns.map(turn => `<p class="lp-ai-message ${turn.role}">${e(turn.text)}</p>`).join('')}${bodyCard}</div>`;
    const preview = $('#lp-ai-preview');
    preview.hidden = !hasPreview;
    if (hasPreview) {
      const capSummary = new Map();
      planResult.groups.forEach(g => g.activities.filter(a => a.enabled !== false).forEach(a => (a.capabilities || []).forEach(c => capSummary.set(c, (capSummary.get(c) || 0) + 1))));
      preview.innerHTML = `<h3>本次能力覆盖预览</h3>${selectedCaps.map(name => `<section><h4>${e(name)}</h4><p>${capSummary.get(name) ? `已配 ${capSummary.get(name)} 项资源` : '未勾选资源'}</p></section>`).join('')}`;
    }
    syncComposer();
    host.scrollTop = keepScroll ? scrollTop : host.scrollHeight;
  }

  function runGeneration(customAppeal = '') {
    if (!selectedCaps.length) { setError('请至少勾选一项需要配资源的能力'); return; }
    const ctx = getCtx();
    if (customAppeal) appeal = customAppeal;
    const chosenGroup = (ctx.groups || []).find(g => g.id === targetGroupId);
    targetGroupTitle = chosenGroup ? chosenGroup.title : '';
    say('user', `目标能力：${selectedCaps.join('、')}${targetGroupTitle ? `；归入阶段：${targetGroupTitle}` : ''}${appeal ? `；诉求：${appeal}` : ''}`);
    planResult = generateResourcePlan({
      targetCaps: selectedCaps,
      allCaps: ctx.standard.content.cap || [],
      catalog: editor.catalog(),
      appeal,
      targetGroupTitle
    });
    const matchedCount = planResult.groups.reduce((s, g) => s + g.activities.filter(a => ['课程','项目'].includes(a.kind)).length, 0);
    const genCount = planResult.groups.reduce((s, g) => s + g.activities.filter(a => !['课程','项目'].includes(a.kind)).length, 0);
    say('assistant', `已围绕 ${selectedCaps.length} 项能力匹配 ${matchedCount} 项平台课程/项目，并生成 ${genCount} 项训战实践活动，每条资源均已绑定对应能力项。你可以微调能力标签或勾选保留项后应用到方案。`);
    phase = 'ready';
    setError('');
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
        say('assistant', `已为“${targetCap}”新增 1 项${kind}活动并自动绑定能力标签。`);
        render();
        return;
      }
    }
    appeal = text;
    if (mentionedCaps.length) selectedCaps = mentionedCaps;
    runGeneration(text);
  }

  function submit() {
    const text = prompt.value.trim();
    if (!text || phase === 'applied') return;
    prompt.value = '';
    setError('');
    if (phase === 'setup') runGeneration(text);
    else handleFollowup(text);
  }

  host.addEventListener('change', event => {
    const target = event.target;
    if (target.hasAttribute('data-ai-cap')) {
      selectedCaps = [...host.querySelectorAll('[data-ai-cap]:checked')].map(i => i.value);
      setError('');
      render(true);
    } else if (target.id === 'lp-ai-target-group') {
      targetGroupId = target.value;
    } else if (target.hasAttribute('data-ai-res-toggle')) {
      const [gi, ai] = target.dataset.aiResToggle.split(',').map(Number);
      if (planResult?.groups[gi]?.activities[ai]) {
        planResult.groups[gi].activities[ai].enabled = target.checked;
        render(true);
      }
    }
  });

  drawer.addEventListener('click', event => {
    const control = event.target.closest('[data-plan-ai]');
    if (!control) return;
    setError('');
    const ctx = getCtx();
    const allCapNames = (ctx.standard.content.cap || []).map(([n]) => n);
    switch (control.dataset.planAi) {
      case 'select-all': selectedCaps = [...allCapNames]; render(true); break;
      case 'select-uncovered': selectedCaps = ctx.uncoveredCapabilities?.length ? [...ctx.uncoveredCapabilities] : [...allCapNames]; render(true); break;
      case 'example': prompt.value = control.dataset.prompt; syncComposer(); prompt.focus(); break;
      case 'generate': runGeneration(prompt.value.trim()); prompt.value = ''; break;
      case 'back-setup': phase = 'setup'; render(); break;
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
        if (!filteredGroups.length) { setError('请至少勾选保留一项学习资源'); return; }
        const missingCap = filteredGroups.some(g => g.activities.some(a => !(a.capabilities || []).length));
        if (missingCap) { setError('每项应用的学习资源请至少保留 1 个关联能力标签'); return; }
        if (editor.applyGenerated(filteredGroups, targetGroupId)) {
          phase = 'applied';
          say('assistant', '已将所选学习资源与能力关联关系写入学习方案草稿，核对无误后请点击页面右上角“保存”。');
          render();
          showToast('已添加到学习方案草稿');
        }
        break;
      }
    }
  });

  prompt.addEventListener('input', () => { setError(''); syncComposer(); });
  prompt.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(); } });
  send.onclick = submit;
  $('#lp-ai-new-chat').onclick = () => initSession({});

  window.LearningPlanAI.open = open;
  window.LearningPlanAI.refreshContext = () => initSession({});
  initSession({});
})();
