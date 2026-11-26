(function () {
  const key = 'talent-settings-v1';
  const dimensions = {duty:'职责任务', exp:'经历经验', cap:'能力要求', pow:'动力要求', pot:'潜力要求'};
  const defaultTemplates = () => [
    {id:'tpl-full', name:'完整人才标准', description:'包含职责任务、经历经验、能力、动力与潜力全部维度', dimensions:['duty','exp','cap','pow','pot'], isDefault:true, enabled:true},
    {id:'tpl-competency', name:'素质评估标准', description:'包含能力要求、动力要求与潜力要求，适用于盘点与选拔', dimensions:['cap','pow','pot'], isDefault:false, enabled:true},
    {id:'tpl-duty', name:'岗位职责标准', description:'包含职责任务与经历经验，适用于基础任职要求', dimensions:['duty','exp'], isDefault:false, enabled:true}
  ];
  function parseStored() {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
  function read() {
    const stored = parseStored();
    const base = {
      dimensions:Object.keys(dimensions),
      abilityDimensions:['技能','素养','知识'],
      templates:defaultTemplates(),
      learnerFeatures:{portrait:true, channel:true},
      sequences:[
        {id:'technical', name:'技术序列', levels:[{id:'p5',name:'首席',code:'P5',rank:5},{id:'p4',name:'专家',code:'P4',rank:4},{id:'p3',name:'高级',code:'P3',rank:3}]},
        {id:'management', name:'管理序列', levels:[{id:'m3',name:'经理',code:'M3',rank:3},{id:'m2',name:'主管',code:'M2',rank:2}]}
      ]
    };
    if (!stored) return base;
    if (!Array.isArray(stored.abilityDimensions) || stored.abilityDimensions.length !== 3) stored.abilityDimensions = base.abilityDimensions;
    if (!Array.isArray(stored.templates) || !stored.templates.length) stored.templates = defaultTemplates();
    if (!stored.templates.some(t => t.isDefault && t.enabled !== false)) stored.templates[0].isDefault = true;
    stored.templates.forEach(t => { if (t.enabled === undefined) t.enabled = true; });
    if (!stored.learnerFeatures || typeof stored.learnerFeatures !== 'object') stored.learnerFeatures = base.learnerFeatures;
    if (!Array.isArray(stored.sequences)) stored.sequences = base.sequences;
    return stored;
  }
  function write(value) { localStorage.setItem(key, JSON.stringify(value)); }
  function templates(data = read(), {onlyEnabled = false} = {}) {
    const list = data.templates || defaultTemplates();
    return onlyEnabled ? list.filter(t => t.enabled !== false) : list;
  }
  function defaultTemplate(data = read()) {
    const list = templates(data, {onlyEnabled:true});
    return list.find(t => t.isDefault) || list[0] || defaultTemplates()[0];
  }
  function enabled(standard) {
    if (Array.isArray(standard?.enabledDimensions) && standard.enabledDimensions.length) {
      return Object.keys(dimensions).filter(k => standard.enabledDimensions.includes(k));
    }
    return Object.keys(dimensions);
  }
  function mergeContent(previous, incoming, selected, strategy) {
    const content = JSON.parse(JSON.stringify(previous));
    selected.forEach(key => {
      if (strategy === 'replace') { content[key] = JSON.parse(JSON.stringify(incoming[key] || [])); return; }
      (incoming[key] || []).forEach(item => {
        const name = key === 'duty' ? item.n : key === 'cap' ? item[0] : item;
        const index = content[key].findIndex(old => (key === 'duty' ? old.n : key === 'cap' ? old[0] : old) === name);
        if (index < 0) content[key].push(JSON.parse(JSON.stringify(item)));
        else if (key === 'duty') content[key][index].t = [...new Set([...content[key][index].t, ...item.t])];
        else if (key === 'cap') content[key][index] = [...item];
      });
    });
    return content;
  }
  window.TalentSettings = {key, dimensions, defaultTemplates, read, write, templates, defaultTemplate, enabled, mergeContent};
})();
