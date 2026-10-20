(function () {
  const key = 'talent-settings-v1';
  const dimensions = {duty:'职责任务', exp:'经历经验', cap:'能力要求', pow:'动力要求', pot:'潜力要求'};
  function read() {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    return stored || {
      dimensions:Object.keys(dimensions),
      sequences:[
        {id:'technical', name:'技术序列', levels:[{id:'p5',name:'首席',code:'P5',rank:5},{id:'p4',name:'专家',code:'P4',rank:4},{id:'p3',name:'高级',code:'P3',rank:3}]},
        {id:'management', name:'管理序列', levels:[{id:'m3',name:'经理',code:'M3',rank:3},{id:'m2',name:'主管',code:'M2',rank:2}]}
      ]
    };
  }
  function write(value) { localStorage.setItem(key, JSON.stringify(value)); }
  function enabled() { return Object.keys(dimensions).filter(id => read().dimensions.includes(id)); }
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
  window.TalentSettings = {key, dimensions, read, write, enabled, mergeContent};
})();
