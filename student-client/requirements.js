(function () {
  const labels = {duty:'职责任务', exp:'经历经验', cap:'能力要求', pow:'动力要求', pot:'潜力要求'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const text = value => value && value !== '-' && value !== '暂无' ? String(value) : '';
  function level(value) {
    const number = ['一级','二级','三级','四级','五级'].indexOf(value) + 1;
    if (number) return 'L' + number;
    return /^[1-5]$/.test(String(value)) ? 'L' + value : text(value);
  }
  function fromLegacy(position, definitions = {}) {
    const abilities = position.radars?.length
      ? position.radars.flatMap(group => group.items.map(item => ({...item, level:item.required})))
      : position.abilities || [];
    const content = {
      duty: text(position.duty) ? [{n:position.duty, t:[]}] : [],
      exp: [text(position.education) && '学历要求：' + position.education, text(position.experience)].filter(Boolean),
      cap: abilities.map(item => [item.name, level(item.level)]),
      pow: [], pot: []
    };
    const indicators = Object.fromEntries(abilities.map(item => {
      const definition = definitions[item.name] || item;
      return [item.name, {definition:text(definition.definition), description:text(definition.description)}];
    }));
    return {id:'legacy-' + position.id, name:position.name + '标准', content, indicators};
  }
  function radar(capabilities) {
    if (capabilities.length < 3 || capabilities.some(item => !/^L[1-5]$/.test(item[1]))) return '';
    const numbered = capabilities.length > 8 || capabilities.some(item => item[0].length > 12);
    const point = (value, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / capabilities.length;
      return [160 + Math.cos(angle) * value * 19, 145 + Math.sin(angle) * value * 19];
    };
    const points = value => capabilities.map((item,index) => point(value ?? Number(item[1].slice(1)), index).map(n => n.toFixed(2)).join(',')).join(' ');
    const grids = [1,2,3,4,5].map(value => `<polygon points="${points(value)}" fill="none" stroke="#e4e8ef"/>`).join('');
    const axes = capabilities.map((item,index) => {
      const [x,y] = point(5,index), [tx,ty] = point(6.5,index);
      const anchor = Math.abs(tx-160) < 8 ? 'middle' : tx < 160 ? 'end' : 'start';
      return `<line x1="160" y1="145" x2="${x}" y2="${y}" stroke="#e4e8ef"/><text x="${tx}" y="${ty}" text-anchor="${anchor}" dominant-baseline="middle">${numbered ? index+1 : escape(item[0])}</text>`;
    }).join('');
    return `<svg class="req-radar" viewBox="0 0 320 290" role="img" aria-label="能力要求等级雷达图"><title>能力要求等级，最高L5；完整词条和等级见下方列表</title>${grids}${axes}<polygon points="${points()}" fill="#0152d91a" stroke="#0152d9" stroke-width="2"/></svg>`;
  }
  function render(standard) {
    const content = standard.content || {};
    return Object.entries(labels).map(([key,label]) => {
      const items = content[key] || [];
      const numbered = key === 'cap' && (items.length > 8 || items.some(item => item[0].length > 12));
      let body = '';
      if (key === 'duty') body = items.map(item => `<div class="req-duty"><h3>${escape(item.n)}</h3>${item.t?.length ? `<ul>${item.t.map(task => `<li>${escape(task)}</li>`).join('')}</ul>` : ''}</div>`).join('');
      else if (key === 'cap') body = radar(items) + items.map(([name,required],index) => {
        const indicator = standard.indicators?.[name];
        const details = [indicator?.definition && `<div><dt>定义</dt><dd>${escape(indicator.definition)}</dd></div>`, indicator?.description && `<div><dt>分级描述</dt><dd>${escape(indicator.description)}</dd></div>`].filter(Boolean).join('');
        const title = `<span>${numbered ? index+1 + '. ' : ''}${escape(name)}</span><span class="req-level">${escape(required || '未设置等级')}</span>`;
        return details ? `<details class="req-ability"><summary>${title}</summary><dl>${details}</dl></details>` : `<div class="req-ability req-ability-row">${title}</div>`;
      }).join('');
      else body = `<ul class="${key === 'pow' || key === 'pot' ? 'req-traits' : ''}">${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
      return `<section class="req-section"><h2>${label}</h2>${items.length ? body : `<p class="req-empty">暂未配置${label}</p>`}</section>`;
    }).join('');
  }
  function selector(standards, selected) {
    const standard = standards.find(item => item.id === selected) || standards[0];
    const description = standard?.description ? `<p class="req-description">${escape(standard.description)}</p>` : '';
    if (standards.length === 1) return `<div class="req-standard"><span>人才标准</span><strong>${escape(standards[0].name)}</strong></div>${description}`;
    return `<div class="req-standard"><label for="learner-standard">人才标准</label><select id="learner-standard" data-requirement-standard>${standards.map(item => `<option value="${escape(item.id)}" ${item.id === selected ? 'selected' : ''}>${escape(item.name)}</option>`).join('')}</select></div>${description}`;
  }
  function resourceLink(resource, label) {
    return /^https:\/\//.test(resource.url || '') ? `<a class="standard-resource-link" href="${escape(resource.url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
  }
  function renderPlan(standard, filter = 'all', assetPrefix = '') {
    const plan = standard.learningPlan;
    if (!plan) return '<section class="standard-plan-section"><h2>学习方案</h2><p>该标准尚未配置学习方案</p></section>';
    const allCourses = plan.courses || [];
    const courses = allCourses.filter(course => filter === 'required' ? course.required : filter === 'optional' ? !course.required : true);
    const filters = [['all','全部'],['required','必修'],['optional','选修']].map(([value,label]) => `<button type="button" data-plan-filter="${value}" aria-pressed="${filter === value}">${label}</button>`).join('');
    const courseCards = courses.map(course => `<article class="standard-course"><img src="${escape(assetPrefix + course.cover)}" alt="" loading="lazy" width="112" height="84"><div class="standard-resource-info"><div class="standard-resource-type">${course.required ? '必修' : '选修'}</div><h3>${escape(course.name)}</h3><p>${escape(course.teacher)} · ${escape(course.hours)} 学时</p>${resourceLink(course,'进入学习')}</div></article>`).join('');
    const projects = (plan.projects || []).map(project => `<article class="standard-project"><h3>${escape(project.name)}</h3><p>${escape(project.description)}</p>${resourceLink(project,'进入项目')}</article>`).join('');
    const tasks = (plan.tasks || []).map(task => `<article class="standard-practice"><h3>${escape(task.name)}</h3><ul>${task.actions.map(action => `<li>${escape(action)}</li>`).join('')}</ul><dl><dt>完成标准</dt><dd>${escape(task.criteria)}</dd></dl></article>`).join('');
    return `<h2 class="standard-plan-title">${escape(plan.name)}</h2><section class="standard-plan-section"><h2>课程</h2><div class="standard-plan-filters" aria-label="课程类型">${filters}</div><div class="standard-course-grid">${courseCards || '<p>暂无符合条件的课程</p>'}</div></section><section class="standard-plan-section"><h2>学习项目</h2>${projects || '<p>暂无关联项目</p>'}</section><section class="standard-plan-section"><h2>实践任务</h2>${tasks || '<p>暂无实践任务</p>'}</section>`;
  }
  window.LearnerRequirements = {fromLegacy, render, selector, renderPlan, escape};
})();
