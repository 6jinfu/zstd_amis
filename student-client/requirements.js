(function () {
  const allDimensions = ['duty', 'exp', 'cap', 'pow', 'pot'];
  const labels = { duty: '职责任务', exp: '经历经验', cap: '能力要求', pow: '动力要求', pot: '潜力要求' };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const text = value => value && value !== '-' && value !== '暂无' ? String(value) : '';

  function dimensionsOf(standard) {
    return Array.isArray(standard?.enabledDimensions) && standard.enabledDimensions.length
      ? allDimensions.filter(k => standard.enabledDimensions.includes(k))
      : [...allDimensions];
  }

  function level(value) {
    const cn = ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级', '九级', '十级'].indexOf(value) + 1;
    if (cn) return 'L' + cn;
    return /^(?:10|[1-9])$/.test(String(value)) ? 'L' + value : text(value);
  }

  function fromLegacy(position, definitions = {}) {
    const abilities = position.radars?.length
      ? position.radars.flatMap(group => group.items.map(item => ({ ...item, level: item.required })))
      : position.abilities || [];
    const content = {
      duty: text(position.duty) ? [{ n: position.duty, t: [] }] : [],
      exp: [text(position.education) && '学历要求：' + position.education, text(position.experience)].filter(Boolean),
      cap: abilities.map(item => [item.name, level(item.level)]),
      pow: [],
      pot: []
    };
    const indicators = Object.fromEntries(abilities.map(item => {
      const definition = definitions[item.name] || item;
      return [item.name, { definition: text(definition.definition), description: text(definition.description) }];
    }));
    return { id: 'legacy-' + position.id, name: position.name + '标准', content, indicators };
  }

  function radar(capabilities) {
    const isGraded = val => /^L(?:10|[1-9])$/.test(val || '');
    if (capabilities.some(item => !isGraded(item[1]) && item[1] !== '不分级')) return '';
    const graded = capabilities.filter(item => isGraded(item[1]));
    if (graded.length < 3) return '';
    const maxScale = Math.max(5, ...graded.map(item => Number(item[1].slice(1)))) > 5 ? 10 : 5;
    const rings = maxScale === 10 ? [2, 4, 6, 8, 10] : [1, 2, 3, 4, 5];
    const radius = 96;
    const numbered = graded.length > 8 || graded.some(item => item[0].length > 12);
    const point = (value, index, r = radius) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / graded.length;
      const ratio = value / maxScale;
      return [160 + Math.cos(angle) * r * ratio, 145 + Math.sin(angle) * r * ratio];
    };
    const points = fixed => graded.map((item, index) => point(fixed ?? Number(item[1].slice(1)), index).map(n => n.toFixed(2)).join(',')).join(' ');
    const grids = rings.map(value => `<polygon points="${points(value)}" fill="none" stroke="#e4e8ef"/>`).join('');
    const axes = graded.map((item, index) => {
      const [x, y] = point(maxScale, index);
      const [tx, ty] = point(maxScale, index, radius + 26);
      const anchor = Math.abs(tx - 160) < 8 ? 'middle' : tx < 160 ? 'end' : 'start';
      return `<line x1="160" y1="145" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#e4e8ef"/><text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="${anchor}" dominant-baseline="middle">${numbered ? index + 1 : escape(item[0])}</text>`;
    }).join('');
    const dots = graded.map((item, index) => {
      const [cx, cy] = point(Number(item[1].slice(1)), index);
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="3.5" fill="#0152d9" stroke="#fff" stroke-width="1.5"/>`;
    }).join('');
    return `<svg class="req-radar" viewBox="0 0 320 290" role="img" aria-label="能力要求等级雷达图"><title>能力要求等级，最高L${maxScale}；完整词条和等级见列表</title>${grids}${axes}<polygon points="${points()}" fill="#0152d91a" stroke="#0152d9" stroke-width="2"/>${dots}</svg>`;
  }

  function renderTraits(items, standard) {
    const dict = { ...(typeof window !== 'undefined' ? window.LearnerRequirementsData?.traitDefinitions : null), ...(standard.traits || {}) };
    if (items.some(name => dict[name])) {
      return `<div class="req-trait-grid">${items.map(name => `<article class="req-trait-card"><strong>${escape(name)}</strong>${dict[name] ? `<p>${escape(dict[name])}</p>` : ''}</article>`).join('')}</div>`;
    }
    return `<ul class="req-traits">${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
  }

  function render(standard) {
    const content = standard.content || {};
    const enabled = dimensionsOf(standard);
    return enabled.map(key => {
      const label = labels[key];
      const items = content[key] || [];
      let body = '';
      if (key === 'duty') {
        body = `<div class="req-duty-grid">${items.map(item => `<div class="req-duty"><h3>${escape(item.n)}</h3>${item.t?.length ? `<ul>${item.t.map(task => `<li>${escape(task)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>`;
      } else if (key === 'cap') {
        const svg = radar(items);
        const gradedItems = items.filter(([, lv]) => /^L(?:10|[1-9])$/.test(lv || ''));
        const ungradedCount = items.filter(([, lv]) => lv === '不分级').length;
        const numbered = gradedItems.length > 8 || gradedItems.some(item => item[0].length > 12);
        let gradedIdx = 0;
        const listHtml = items.map(([name, required]) => {
          const indicator = standard.indicators?.[name];
          const ungraded = required === '不分级' || indicator?.graded === false;
          const numPrefix = !ungraded && numbered ? `${++gradedIdx}. ` : '';
          const details = [
            indicator?.definition && `<div><dt>${ungraded ? '指标定义' : '定义'}</dt><dd>${escape(indicator.definition)}</dd></div>`,
            !ungraded && indicator?.description && `<div><dt>分级描述</dt><dd>${escape(indicator.description)}</dd></div>`
          ].filter(Boolean).join('');
          const title = `<span>${numPrefix}${escape(name)}</span><span class="req-level${ungraded ? ' is-ungraded' : ''}">${escape(ungraded ? '不分级' : (required || '未设置等级'))}</span>`;
          return details ? `<details class="req-ability"><summary>${title}</summary><dl>${details}</dl></details>` : `<div class="req-ability req-ability-row">${title}</div>`;
        }).join('');
        body = svg
          ? `<div class="req-cap-layout"><div class="req-radar-panel">${svg}<p class="req-radar-caption">共 ${gradedItems.length} 项分级能力${ungradedCount ? ` · 另含 ${ungradedCount} 项无等级指标` : ''}</p></div><div class="req-cap-list">${listHtml}</div></div>`
          : `<div class="req-cap-list">${listHtml}</div>`;
      } else if (key === 'pow' || key === 'pot') {
        body = renderTraits(items, standard);
      } else {
        body = `<ul class="req-exp-list">${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
      }
      return `<section class="req-section" data-dimension="${key}"><h2>${label}</h2>${items.length ? body : `<p class="req-empty">暂未配置${label}</p>`}</section>`;
    }).join('');
  }

  function selector(standards, selected) {
    const standard = standards.find(item => item.id === selected) || standards[0];
    const description = standard?.description ? `<p class="req-description">${escape(standard.description)}</p>` : '';
    const dimSummary = Array.isArray(standard?.enabledDimensions) && standard.enabledDimensions.length && standard.enabledDimensions.length < 5
      ? `<span class="req-dim-summary">包含维度：${dimensionsOf(standard).map(k => labels[k]).join('、')}</span>`
      : '';
    if (standards.length === 1) return `<div class="req-standard"><span>人才标准</span><strong>${escape(standards[0].name)}</strong>${dimSummary}</div>${description}`;
    return `<div class="req-standard"><label for="learner-standard">人才标准</label><select id="learner-standard" data-requirement-standard>${standards.map(item => `<option value="${escape(item.id)}" ${item.id === selected ? 'selected' : ''}>${escape(item.name)}</option>`).join('')}</select>${dimSummary}</div>${description}`;
  }

  function resourceLink(resource, label) {
    return /^https:\/\//.test(resource.url || '') ? `<a class="standard-resource-link" href="${escape(resource.url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
  }

  function renderCapTags(caps, activeCap) {
    if (!Array.isArray(caps) || !caps.length) return '';
    return `<div class="req-res-caps" aria-label="关联能力">${caps.map(name => `<span class="req-res-cap${activeCap === name ? ' is-active' : ''}">${escape(name)}</span>`).join('')}</div>`;
  }

  function renderPlan(standard, filter = 'all', assetPrefix = '') {
    const plan = standard.learningPlan;
    if (!plan) return '<section class="standard-plan-section"><h2>学习方案</h2><p>该标准尚未配置学习方案</p></section>';

    const filterObj = typeof filter === 'object' && filter !== null ? filter : { type: filter || 'all', capability: '' };
    const typeFilter = filterObj.type || 'all';
    const capFilter = filterObj.capability || '';

    const matchItem = (item, defaultRequired = true) => {
      const req = item.required === undefined ? defaultRequired : !!item.required;
      if (typeFilter === 'required' && !req) return false;
      if (typeFilter === 'optional' && req) return false;
      if (capFilter && !(item.capabilities || []).includes(capFilter)) return false;
      return true;
    };

    const allCourses = plan.courses || [];
    const allProjects = plan.projects || [];
    const allTasks = plan.tasks || [];

    // Collect capabilities from standard.content.cap + resource bindings
    const stdCaps = (standard.content?.cap || []).map(item => item[0]).filter(Boolean);
    const resCaps = [...allCourses, ...allProjects, ...allTasks].flatMap(item => item.capabilities || []);
    const capOptions = [...new Set([...stdCaps, ...resCaps])];
    const coveredSet = new Set(resCaps);

    const courseCard = course => `<article class="standard-course"${capFilter && (course.capabilities || []).includes(capFilter) ? ' data-cap-match="true"' : ''}><img src="${escape(assetPrefix + course.cover)}" alt="" loading="lazy" width="112" height="84"><div class="standard-resource-info"><div class="standard-resource-type"><span class="req-res-badge ${course.required ? 'is-req' : 'is-opt'}">${course.required ? '必修' : '选修'}</span><span>课程 · ${escape(course.teacher)} · ${escape(course.hours)} 学时</span></div><h3>${escape(course.name)}</h3>${renderCapTags(course.capabilities, capFilter)}${resourceLink(course, '进入学习')}</div></article>`;
    const projectCard = project => `<article class="standard-project"><div class="standard-resource-type"><span class="req-res-badge ${project.required === false ? 'is-opt' : 'is-req'}">${project.required === false ? '选修' : '必修'}</span><span>学习项目</span></div><h3>${escape(project.name)}</h3><p>${escape(project.description)}</p>${renderCapTags(project.capabilities, capFilter)}${resourceLink(project, '进入项目')}</article>`;
    const taskCard = task => `<article class="standard-practice"><div class="standard-resource-type"><span class="req-res-badge ${task.required === false ? 'is-opt' : 'is-req'}">${task.required === false ? '选修' : '必修'}</span><span>${escape(task.type || '在岗实践')}</span></div><h3>${escape(task.name)}</h3><ul>${(task.actions || []).map(action => `<li>${escape(action)}</li>`).join('')}</ul><dl><dt>完成标准</dt><dd>${escape(task.criteria)}</dd></dl>${renderCapTags(task.capabilities, capFilter)}</article>`;

    const typeFilterHtml = [['all', '全部'], ['required', '必修'], ['optional', '选修']]
      .map(([value, label]) => `<button type="button" data-plan-filter="${value}" aria-pressed="${typeFilter === value}">${label}</button>`)
      .join('');
    const capFilterHtml = capOptions.length
      ? `<div class="req-cap-filters" role="group" aria-label="按关联能力筛选"><button type="button" class="req-cap-pill" data-plan-cap="" aria-pressed="${!capFilter}">全部能力</button>${capOptions.map(name => `<button type="button" class="req-cap-pill" data-plan-cap="${escape(name)}" aria-pressed="${capFilter === name}">${escape(name)}</button>`).join('')}</div>`
      : '';
    const summaryMeta = `<div class="req-plan-meta"><span>共 ${allCourses.length} 门课程 · ${allProjects.length} 个项目 · ${allTasks.length} 项实践</span>${stdCaps.length ? `<span>覆盖能力 ${stdCaps.filter(c => coveredSet.has(c)).length} / ${stdCaps.length} 项</span>` : ''}</div>`;

    if (Array.isArray(plan.groups) && plan.groups.length) {
      const courseById = new Map(allCourses.map(c => [c.id, c]));
      const projById = new Map(allProjects.map(p => [p.id, p]));
      const taskByName = new Map(allTasks.map(t => [t.name, t]));
      const stageSections = plan.groups.map(group => {
        const courses = (group.courseIds || []).map(id => courseById.get(id)).filter(Boolean).filter(c => matchItem(c, true));
        const projects = (group.projectIds || []).map(id => projById.get(id)).filter(Boolean).filter(p => matchItem(p, true));
        const tasks = (group.taskNames || []).map(n => taskByName.get(n)).filter(Boolean).filter(t => matchItem(t, true));
        const count = courses.length + projects.length + tasks.length;
        if (!count) return '';
        return `<details class="req-plan-stage" open><summary class="req-plan-stage-head"><div class="req-plan-stage-title"><h3>${escape(group.title)}</h3>${group.goal ? `<p>${escape(group.goal)}</p>` : ''}</div><span class="req-plan-stage-count">${count} 项学习内容</span></summary><div class="req-plan-stage-body">${courses.length ? `<div class="standard-course-grid">${courses.map(courseCard).join('')}</div>` : ''}${projects.length ? `<div class="req-stage-sublist">${projects.map(projectCard).join('')}</div>` : ''}${tasks.length ? `<div class="req-stage-sublist">${tasks.map(taskCard).join('')}</div>` : ''}</div></details>`;
      }).filter(Boolean).join('');

      return `<div class="req-plan-header"><h2 class="standard-plan-title">${escape(plan.name)}</h2>${summaryMeta}</div><div class="req-plan-toolbar">${capFilterHtml}<div class="standard-plan-filters" aria-label="课程类型">${typeFilterHtml}</div></div>${stageSections ? `<div class="req-plan-stages">${stageSections}</div>` : `<div class="req-plan-empty"><p>暂无符合当前筛选条件的学习资源</p><button type="button" class="req-reset-btn" data-plan-reset>显示全部资源</button></div>`}`;
    }

    const courses = allCourses.filter(c => matchItem(c, true));
    const projects = allProjects.filter(p => matchItem(p, true));
    const tasks = allTasks.filter(t => matchItem(t, true));
    return `<h2 class="standard-plan-title">${escape(plan.name)}</h2>${capFilterHtml}<section class="standard-plan-section"><h2>课程</h2><div class="standard-plan-filters" aria-label="课程类型">${typeFilterHtml}</div><div class="standard-course-grid">${courses.map(courseCard).join('') || '<p>暂无符合条件的课程</p>'}</div></section><section class="standard-plan-section"><h2>学习项目</h2>${projects.map(projectCard).join('') || '<p>暂无关联项目</p>'}</section><section class="standard-plan-section"><h2>实践任务</h2>${tasks.map(taskCard).join('') || '<p>暂无实践任务</p>'}</section>`;
  }

  window.LearnerRequirements = { fromLegacy, dimensionsOf, render, selector, renderPlan, escape };
})();
