/* AI 帮找人才：基于用人描述或人才标准拆解条件，联动评鉴证据、盘点结果与 UC 用户履历推荐人选。 */
(function () {
  const EDU_RANK = { 本科: 1, 硕士: 2, 博士: 3 };
  const REVIEW_RANK = { 高潜: 4, 核心: 3, 中坚: 2, 待发展: 1 };
  const QUICK_PROMPTS = [
    '寻找具备系统架构 L4 及以上、有过核心链路重构或内训授课经验的高潜或核心研发骨干',
    '寻找擅长客户洞察 L4 与商务谈判、具备大客户经营及团队授课带教经历的销售负责人人选',
    '寻找硕士及以上学历、司龄 4 年以上、具备 SQL 数据查询或经营分析经验且无协议限制的骨干人才'
  ];

  const EXPERIENCE_RULES = [
    { key: 'teaching', pattern: /授课|内训|讲师|带教|分享/, label: '具备内训授课或带教经历', mode: 'teaching' },
    { key: 'cert', pattern: /证书|认证/, label: '持有专业培训认证证书', mode: 'cert' },
    { key: 'no-agreement', pattern: /无未到期外派|无协议限制|无服务期限制/, label: '无履行中培训服务期协议', mode: 'noAgreement' },
    { key: 'arch', pattern: /核心链路|分布式|云原生|平台架构|架构重构/, label: '核心链路或分布式架构经历', keywords: ['架构', '核心链路', '分布式', '云原生', '平台'] },
    { key: 'algo', pattern: /大模型|推荐算法|算法研发|推理优化/, label: '算法研发或模型优化经历', keywords: ['算法', '大模型', '推荐', '推理'] },
    { key: 'ka', pattern: /大客户|战略客户|铁军|区域销售|政企/, label: '战略大客户或区域销售管理经历', keywords: ['大客户', '区域销售', '铁军', '商机', '谈判'] },
    { key: 'bp', pattern: /业财|经营分析|预算|ROI/i, label: '业财融合或经营分析经历', keywords: ['业财', '经营', '财务分析', '预算', 'ROI'] }
  ];

  function knownCapabilities(standardsData, talentData) {
    const map = new Map();
    const indicators = typeof window !== 'undefined' && window.IndicatorDemo?.read ? window.IndicatorDemo.read() : [];
    indicators.filter(i => i.dimension === 'cap').forEach(i => map.set(i.name, { name: i.name, ungraded: i.graded === false }));
    (standardsData?.standards || []).forEach(s => (s.content?.cap || []).forEach(([name, level]) => {
      if (!map.has(name)) map.set(name, { name, ungraded: !/^L(?:10|[1-9])$/.test(level || '') });
    }));
    (talentData?.evidence || []).forEach(r => (r.values || []).forEach(([name]) => {
      if (!map.has(name)) map.set(name, { name, ungraded: !!r.abilityImport?.ungraded });
    }));
    return [...map.values()];
  }

  function parseQuery(queryText, options = {}) {
    const text = String(queryText || '').trim();
    const standard = options.standard || null;
    const capabilities = knownCapabilities(options.standardsData, options.talentData);
    const criteria = [];
    const seen = new Set();
    const add = item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        criteria.push(item);
      }
    };

    // 1. 若选择了对标标准，优先载入标准启用维度的核心要求
    if (standard) {
      const enabled = new Set(
        typeof window !== 'undefined' && typeof window.Standards?.dimensionsOf === 'function'
          ? window.Standards.dimensionsOf(standard)
          : (Array.isArray(standard.enabledDimensions) && standard.enabledDimensions.length ? standard.enabledDimensions : ['duty', 'exp', 'cap', 'pow', 'pot'])
      );
      if (enabled.has('cap')) {
        (standard.content?.cap || []).forEach(([name, level]) => {
          const graded = /^L(?:10|[1-9])$/.test(level || '');
          const minLevel = graded ? Number(level.slice(1)) : null;
          add({
            id: 'cap:' + name,
            kind: 'ability',
            ability: name,
            minLevel,
            ungraded: !graded,
            label: graded ? `${name} ≥ L${minLevel}` : `${name}（无等级指标）`
          });
        });
      }
      if (enabled.has('exp')) {
        (standard.content?.exp || []).slice(0, 2).forEach(expText => {
          const clean = String(expText || '').trim();
          if (!clean) return;
          const tokens = (clean.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,6}/g) || [clean]).filter(t => !/年以上|具备|熟悉|负责|主导|经验|经历/.test(t));
          add({
            id: 'exp:' + clean,
            kind: 'experience',
            mode: 'keywords',
            keywords: tokens.length ? tokens : [clean.slice(0, 4)],
            label: '经历：' + (clean.length > 16 ? clean.slice(0, 16) + '…' : clean)
          });
        });
      }
    }

    if (text) {
      // 2. 部门条件
      ['研发中心', '销售中心', '职能中台'].forEach(dept => {
        if (text.includes(dept)) add({ id: 'dept:' + dept, kind: 'department', value: dept, label: '部门：' + dept });
      });
      if (!criteria.some(c => c.kind === 'department')) {
        if (/研发骨干|研发团队|技术负责人|架构师人选/.test(text)) add({ id: 'dept:研发中心', kind: 'department', value: '研发中心', label: '部门：研发中心' });
        else if (/销售负责人|销售团队|营销/.test(text)) add({ id: 'dept:销售中心', kind: 'department', value: '销售中心', label: '部门：销售中心' });
      }

      // 3. 盘点分类条件
      const clsMatched = ['高潜', '核心', '中坚', '待发展'].filter(c => text.includes(c));
      if (!clsMatched.length && /骨干/.test(text)) clsMatched.push('高潜', '核心', '中坚');
      if (clsMatched.length) {
        add({
          id: 'cls:' + clsMatched.join(','),
          kind: 'classification',
          values: clsMatched,
          label: '盘点分类：' + clsMatched.join(' / ')
        });
      }

      // 4. 学历条件
      if (/博士/.test(text)) {
        add({ id: 'edu:博士', kind: 'education', minRank: 3, minName: '博士', label: '学历：博士' });
      } else if (/硕士及以上|硕士以上|研究生|硕士/.test(text)) {
        add({ id: 'edu:硕士', kind: 'education', minRank: 2, minName: '硕士', label: '学历：硕士及以上' });
      } else if (/本科及以上|本科以上/.test(text)) {
        add({ id: 'edu:本科', kind: 'education', minRank: 1, minName: '本科', label: '学历：本科及以上' });
      }

      // 5. 司龄条件
      const tenureMatch = text.match(/司龄\s*(\d+)\s*年/);
      if (tenureMatch) {
        const years = Number(tenureMatch[1]);
        if (years > 0) add({ id: 'tenure:' + years, kind: 'tenure', minYears: years, label: `司龄 ≥ ${years} 年` });
      }

      // 6. 能力指标条件
      capabilities.forEach(cap => {
        const idx = text.indexOf(cap.name);
        if (idx === -1) return;
        const tail = text.slice(idx + cap.name.length, idx + cap.name.length + 14);
        const lvMatch = tail.match(/[LＬ]\s*(10|[1-9])/i) || tail.match(/([1-9]|10)\s*级/);
        const ungraded = cap.ungraded;
        const minLevel = ungraded ? null : (lvMatch ? Number(lvMatch[1]) : 3);
        const existingIdx = criteria.findIndex(item => item.id === 'cap:' + cap.name);
        const nextItem = {
          id: 'cap:' + cap.name,
          kind: 'ability',
          ability: cap.name,
          minLevel,
          ungraded,
          label: ungraded ? `${cap.name}（有考核证据）` : `${cap.name} ≥ L${minLevel}`
        };
        if (existingIdx >= 0) criteria[existingIdx] = nextItem;
        else add(nextItem);
      });

      // 7. UC 履历 / 训战 / 协议条件
      EXPERIENCE_RULES.forEach(rule => {
        if (rule.pattern.test(text)) {
          add({
            id: 'uc:' + rule.key,
            kind: 'experience',
            mode: rule.mode || 'keywords',
            keywords: rule.keywords || [],
            label: rule.label
          });
        }
      });
    }

    return criteria;
  }

  function formatAbilityResult(found) {
    if (!found) return '';
    if (found.record?.abilityImport) {
      if (found.record.abilityImport.ungraded || found.record.abilityImport.level == null) return `${found.value} 分`;
      return `L${found.value}`;
    }
    return `${found.value}/5`;
  }

  function matchResumeCriterion(person, criterion) {
    const resume = person.ucResume || { work: [], training: [], teaching: [] };
    const agreements = person.ucAgreements || [];
    if (criterion.mode === 'teaching') {
      if (resume.teaching?.length) {
        const first = resume.teaching[0];
        return { ok: true, detail: `授课记录：${first.content}${first.honor ? '（' + first.honor + '）' : ''}` };
      }
      return { ok: false, reason: '暂无 UC 授课记录' };
    }
    if (criterion.mode === 'cert') {
      const hit = (resume.training || []).find(t => t.cert && t.cert !== '—');
      if (hit) return { ok: true, detail: `参与记录：${hit.content}（${hit.cert}）` };
      return { ok: false, reason: '暂无培训认证证书记录' };
    }
    if (criterion.mode === 'noAgreement') {
      const active = agreements.find(a => a.status === '履行中');
      if (!active) return { ok: true, detail: '培训协议：无履行中服务期限制' };
      return { ok: false, reason: `存在履行中协议：${active.name}（至 ${active.end}）` };
    }
    const kwList = criterion.keywords || [];
    for (const w of resume.work || []) {
      const hay = `${w.unit} ${w.dept} ${w.position}`;
      if (kwList.some(k => hay.toLowerCase().includes(k.toLowerCase()))) {
        return { ok: true, detail: `工作经历：${w.dept}·${w.position}（${w.start}–${w.end}）` };
      }
    }
    for (const tr of resume.training || []) {
      const hay = `${tr.content} ${tr.org} ${tr.cert} ${tr.note}`;
      if (kwList.some(k => hay.toLowerCase().includes(k.toLowerCase()))) {
        return { ok: true, detail: `参与记录：${tr.content}${tr.cert ? '（' + tr.cert + '）' : ''}` };
      }
    }
    for (const te of resume.teaching || []) {
      const hay = `${te.content} ${te.audience} ${te.honor}`;
      if (kwList.some(k => hay.toLowerCase().includes(k.toLowerCase()))) {
        return { ok: true, detail: `授课记录：${te.content}${te.honor ? '（' + te.honor + '）' : ''}` };
      }
    }
    const tagHit = (person.tags || []).find(tag => kwList.some(k => tag.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(tag.toLowerCase())));
    if (tagHit) return { ok: true, detail: `人员特征：${tagHit}` };
    return { ok: false, reason: `未检索到“${criterion.label.replace(/^经历：/, '')}”相关履历` };
  }

  function evaluateCandidate(person, criteria, talentData, TalentApi) {
    const T = TalentApi || (typeof window !== 'undefined' ? window.Talent : null);
    const actual = T.values(talentData, person.id);
    const review = T.latestReview(talentData, person.id);
    const matched = [];
    const gaps = [];
    const unknown = [];
    let metCount = 0;
    let abilityStrength = 0;

    criteria.forEach(c => {
      if (c.kind === 'ability') {
        const found = actual.get(c.ability);
        if (!found) {
          unknown.push(`${c.ability}（待补充评鉴证据）`);
          return;
        }
        if (c.ungraded || found.record?.abilityImport?.ungraded) {
          metCount++;
          abilityStrength += 3;
          matched.push({ kind: '能力证据', text: `${c.ability} ${formatAbilityResult(found)}（${found.record.name}）` });
          return;
        }
        if (found.value >= c.minLevel) {
          metCount++;
          abilityStrength += Number(found.value) || 0;
          matched.push({ kind: '能力证据', text: `${c.ability} ${formatAbilityResult(found)} ≥ L${c.minLevel}（${found.record.name}）` });
        } else {
          gaps.push(`${c.ability} 实测 ${formatAbilityResult(found)}（低于 L${c.minLevel}）`);
        }
        return;
      }
      if (c.kind === 'experience') {
        const res = matchResumeCriterion(person, c);
        if (res.ok) {
          metCount++;
          matched.push({ kind: 'UC 履历', text: res.detail });
        } else {
          gaps.push(res.reason);
        }
        return;
      }
      if (c.kind === 'classification') {
        const cls = review?.classification || '';
        if (cls && c.values.includes(cls)) {
          metCount++;
          matched.push({ kind: '盘点结果', text: `最近盘点：${cls}（绩效 ${review.performance}）` });
        } else {
          gaps.push(`最近盘点为“${cls || '未盘点'}”，不在 ${c.values.join('/')} 范围`);
        }
        return;
      }
      if (c.kind === 'department') {
        if (person.department === c.value) {
          metCount++;
          matched.push({ kind: '组织归属', text: `现属 ${person.department} · ${person.position}` });
        } else {
          gaps.push(`现属 ${person.department}（非 ${c.value}）`);
        }
        return;
      }
      if (c.kind === 'education') {
        const rank = EDU_RANK[person.education] || 0;
        if (rank >= c.minRank) {
          metCount++;
          matched.push({ kind: '学历背景', text: `${person.education}学历` });
        } else {
          gaps.push(`学历为${person.education}（要求${c.minName}及以上）`);
        }
        return;
      }
      if (c.kind === 'tenure') {
        if ((person.tenure || 0) >= c.minYears) {
          metCount++;
          matched.push({ kind: '司龄资历', text: `司龄 ${person.tenure} 年` });
        } else {
          gaps.push(`司龄 ${person.tenure} 年（不足 ${c.minYears} 年）`);
        }
      }
    });

    // 补充展示候选人已有的代表性履历摘要（即使未设履历条件也便于核对）
    if (!matched.some(m => m.kind === 'UC 履历') && person.ucResume?.work?.length) {
      const latestWork = person.ucResume.work[0];
      const latestTrain = person.ucResume.training?.[0];
      matched.push({
        kind: '履历摘要',
        text: `${latestWork.dept}·${latestWork.position}（${latestWork.start}–${latestWork.end}）${latestTrain ? '；参训：' + latestTrain.content : ''}`
      });
    }

    const activeAgreement = (person.ucAgreements || []).find(a => a.status === '履行中');
    return {
      person,
      metCount,
      totalCount: criteria.length,
      matched,
      gaps,
      unknown,
      latestReview: review,
      agreementNote: activeAgreement ? `履行中协议：${activeAgreement.name}（服务期至 ${activeAgreement.end}）` : '',
      scoreTieBreaker: abilityStrength * 10 + (REVIEW_RANK[review?.classification] || 0)
    };
  }

  function rankCandidates(people, criteria, talentData, TalentApi) {
    return people
      .map(p => evaluateCandidate(p, criteria, talentData, TalentApi))
      .sort((a, b) => (
        b.metCount - a.metCount ||
        a.gaps.length - b.gaps.length ||
        a.unknown.length - b.unknown.length ||
        b.scoreTieBreaker - a.scoreTieBreaker
      ));
  }

  function ensureDrawer() {
    let drawer = document.getElementById('tc-ai-finder-drawer');
    if (drawer) return drawer;
    drawer = document.createElement('aside');
    drawer.id = 'tc-ai-finder-drawer';
    drawer.className = 'drawer tc-ai-drawer';
    drawer.setAttribute('aria-label', 'AI 帮找人才');
    document.body.appendChild(drawer);
    return drawer;
  }

  function open(config = {}) {
    const T = window.Talent;
    const S = window.Standards;
    const e = window.UI.escape;
    const data = config.data || T.read();
    const standardsData = config.standards || S.read();
    const drawer = ensureDrawer();
    const validStandards = (standardsData.standards || []).filter(s => {
      const c = s.content || {};
      return (c.cap?.length || c.exp?.length || c.duty?.length);
    });

    const state = {
      standardId: config.initialStandard || '',
      targetId: config.initialTarget || '',
      query: config.initialQuery || (config.initialStandard ? '' : QUICK_PROMPTS[0]),
      criteria: [],
      picked: new Set()
    };

    function rebuildCriteria() {
      const std = validStandards.find(s => s.id === state.standardId) || null;
      if (std && !state.targetId && std.positions?.length) state.targetId = std.positions[0];
      state.criteria = parseQuery(state.query, { standard: std, standardsData, talentData: data });
    }

    rebuildCriteria();

    function renderDrawer() {
      const results = rankCandidates(T.people, state.criteria, data, T);
      const canCompare = state.picked.size >= 2 && state.picked.size <= 5;
      drawer.innerHTML = `
        <div class="m-head">
          <h3>AI 帮找人才</h3>
          <button type="button" class="icon-close" data-close aria-label="关闭"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
        <div class="m-body tc-ai-body">
          <div class="tc-ai-composer">
            <div class="tc-ai-standard-row">
              <label for="tc-ai-std-select">对标人才标准</label>
              <select class="select" id="tc-ai-std-select">
                <option value="">不限定标准（按用人描述寻访）</option>
                ${validStandards.map(s => `<option value="${e(s.id)}" ${s.id === state.standardId ? 'selected' : ''}>${e(s.name)}</option>`).join('')}
              </select>
            </div>
            <label class="sr-only" for="tc-ai-prompt">用人要求描述</label>
            <textarea class="input tc-ai-textarea" id="tc-ai-prompt" rows="3" maxlength="800" placeholder="描述所需能力等级、项目或训战经历、盘点分类、学历司龄等要求…">${e(state.query)}</textarea>
            <div class="tc-ai-quick-row">
              <div class="tc-ai-samples">
                ${QUICK_PROMPTS.map((sample, idx) => `<button type="button" class="tc-ai-sample-btn" data-ai-sample="${idx}">示例 ${idx + 1}</button>`).join('')}
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="tc-ai-run">解析并寻访</button>
            </div>
          </div>

          <section class="tc-ai-criteria-box" aria-label="已拆解条件">
            <div class="tc-ai-section-bar">
              <strong>拆解条件（${state.criteria.length} 项）</strong>
              ${state.criteria.length ? '<button type="button" class="btn-text btn-sm" id="tc-ai-clear-crit">清空条件</button>' : ''}
            </div>
            ${state.criteria.length
              ? `<div class="tc-ai-pills">${state.criteria.map(c => `<button type="button" class="tc-ai-pill" data-remove-crit="${e(c.id)}" title="点击移除该条件"><span>${e(c.label)}</span><span aria-hidden="true">×</span></button>`).join('')}</div>`
              : '<p class="tc-ai-empty-hint">暂未提取到明确筛选条件，请输入能力名称、履历关键词或选择对标人才标准。</p>'}
          </section>

          <section class="tc-ai-results" aria-label="推荐人选">
            <div class="tc-ai-section-bar">
              <strong>候选人匹配结果（共 ${results.length} 人）</strong>
              <span class="text-sm muted">按满足条件数与有效评鉴证据排序</span>
            </div>
            <div class="tc-ai-card-list">
              ${results.map(item => {
                const p = item.person;
                const checked = state.picked.has(p.id);
                const fullMet = item.totalCount > 0 && item.metCount === item.totalCount;
                const badgeCls = fullMet ? 'tag-success' : item.metCount > 0 ? 'tag-primary' : '';
                const profileHref = `talent-profile.html?person=${encodeURIComponent(p.id)}${state.targetId ? '&target=' + encodeURIComponent(state.targetId) : ''}${state.standardId ? '&standard=' + encodeURIComponent(state.standardId) : ''}`;
                return `
                  <article class="tc-ai-card ${checked ? 'is-selected' : ''}">
                    <div class="tc-ai-card-head">
                      <label class="tc-ai-check">
                        <input type="checkbox" data-ai-pick="${e(p.id)}" ${checked ? 'checked' : ''}>
                        <span class="tc-ai-person-name"><a href="${profileHref}">${e(p.name)}</a></span>
                      </label>
                      <span class="tc-ai-meta">${e(p.department)} · ${e(p.position)} · ${e(p.education)} · 司龄 ${p.tenure} 年</span>
                      <div class="tc-ai-badges">
                        ${item.latestReview ? `<span class="tag">${e(item.latestReview.classification)}</span>` : ''}
                        <span class="tag ${badgeCls}">满足 ${item.metCount} / ${item.totalCount} 项</span>
                      </div>
                    </div>
                    <div class="tc-ai-evidence-list">
                      ${item.matched.map(m => `<div class="tc-ai-ev-row"><span class="tc-ai-ev-kind">${e(m.kind)}</span><span>${e(m.text)}</span></div>`).join('')}
                      ${(item.gaps.length || item.unknown.length) ? `<div class="tc-ai-ev-row is-gap"><span class="tc-ai-ev-kind">待核实/差距</span><span>${e([...item.gaps, ...item.unknown].join('；'))}</span></div>` : ''}
                      ${item.agreementNote ? `<div class="tc-ai-ev-row is-note"><span class="tc-ai-ev-kind">协议提醒</span><span>${e(item.agreementNote)}</span></div>` : ''}
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          </section>
        </div>
        <div class="m-foot tc-ai-foot">
          <span class="text-sm muted">${state.picked.size ? `已选 ${state.picked.size} 人（支持 2–5 人对比）` : '勾选 2–5 位候选人可直接进入人才对比'}</span>
          <div class="tc-actions">
            <button type="button" class="btn btn-secondary" id="tc-ai-sync-list">同步至列表筛选</button>
            <button type="button" class="btn btn-primary" id="tc-ai-compare" ${canCompare ? '' : 'disabled'}>带入人才对比</button>
          </div>
        </div>
      `;
    }

    drawer.onclick = event => {
      const sampleBtn = event.target.closest('[data-ai-sample]');
      if (sampleBtn) {
        state.query = QUICK_PROMPTS[Number(sampleBtn.dataset.aiSample)] || '';
        rebuildCriteria();
        renderDrawer();
        return;
      }
      if (event.target.id === 'tc-ai-run') {
        state.query = drawer.querySelector('#tc-ai-prompt')?.value || '';
        rebuildCriteria();
        renderDrawer();
        return;
      }
      if (event.target.id === 'tc-ai-clear-crit') {
        state.criteria = [];
        renderDrawer();
        return;
      }
      const rmBtn = event.target.closest('[data-remove-crit]');
      if (rmBtn) {
        const id = rmBtn.dataset.removeCrit;
        state.criteria = state.criteria.filter(c => c.id !== id);
        renderDrawer();
        return;
      }
      if (event.target.id === 'tc-ai-compare' && state.picked.size >= 2 && state.picked.size <= 5) {
        const params = new URLSearchParams({ people: [...state.picked].join(',') });
        if (state.targetId) params.set('target', state.targetId);
        if (state.standardId) params.set('standard', state.standardId);
        location.href = 'talent-compare.html?' + params.toString();
        return;
      }
      if (event.target.id === 'tc-ai-sync-list') {
        if (typeof config.onApplyFilter === 'function') {
          const deptCrit = state.criteria.find(c => c.kind === 'department');
          const clsCrit = state.criteria.find(c => c.kind === 'classification');
          config.onApplyFilter({
            department: deptCrit ? deptCrit.value : '',
            classification: clsCrit && clsCrit.values.length === 1 ? clsCrit.values[0] : '',
            target: state.targetId,
            standard: state.standardId,
            pickedIds: [...state.picked]
          });
        }
        window.closeModal?.(drawer);
      }
    };

    drawer.onchange = event => {
      const el = event.target;
      if (el.id === 'tc-ai-std-select') {
        state.standardId = el.value;
        const std = validStandards.find(s => s.id === state.standardId);
        state.targetId = std?.positions?.[0] || '';
        state.query = drawer.querySelector('#tc-ai-prompt')?.value || '';
        rebuildCriteria();
        renderDrawer();
        return;
      }
      if (el.dataset.aiPick) {
        const id = el.dataset.aiPick;
        if (el.checked) state.picked.add(id);
        else state.picked.delete(id);
        renderDrawer();
      }
    };

    renderDrawer();
    window.openModal?.('tc-ai-finder-drawer');
  }

  const api = { open, parseQuery, evaluateCandidate, rankCandidates, QUICK_PROMPTS };
  if (typeof window !== 'undefined') window.TalentAIFinder = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
