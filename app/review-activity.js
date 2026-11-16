(function () {
  const projects = [
    { id: 'e206bbe5656041f681a79d6201ee2273', name: '基础管理者360评估', type: '360 评估' },
    { id: 'AS-202607-006', name: '研发专业能力360评估', type: '360 评估' },
    { id: 'AS-202607-011', name: '协同能力 360', type: '360 评估' },
    { id: 'AS-202606-022', name: '销售专业能力360评估', type: '360 评估' }
  ];
  function cell(row, value) {
    const td = document.createElement('td');
    if (value instanceof Node) td.append(value);
    else td.textContent = value;
    row.append(td);
  }
  function checkbox(id, label) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = id;
    input.setAttribute('aria-label', label);
    return input;
  }
  window.ReviewActivity = {
    mount() {
      const selected = new Map(projects.slice(0, 3).map(project => [project.id, '2026-11-12']));
      const body = document.querySelector('[data-review-projects]');
      const all = document.querySelector('[data-review-project-all]');
      const drawer = document.getElementById('drawer-review-projects');
      const search = drawer.querySelector('form');
      const monitorSession = 'review-external-monitor-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
      let externalProjects = [];
      let pending = new Set(), keyword = '';
      function render() {
        body.replaceChildren();
        projects.filter(project => selected.has(project.id)).forEach(project => {
          const row = document.createElement('tr');
          cell(row, checkbox(project.id, '选择' + project.name));
          cell(row, project.name);
          cell(row, project.type);
          cell(row, selected.get(project.id));
          const actions=document.createElement('div');actions.className='review-source-actions';
          const monitor=document.createElement('a');monitor.className='btn-text btn-sm';monitor.textContent='监控360 评估';monitor.href=ReviewProjectMonitor.urlFor(project.id,project.name);monitor.target='_blank';monitor.rel='noopener';actions.append(monitor);
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'btn-text btn-sm';
          remove.textContent = '移除';
          remove.setAttribute('aria-label', '移除' + project.name);
          remove.addEventListener('click', () => { selected.delete(project.id); render(); });
          actions.append(remove);cell(row, actions);
          body.append(row);
        });
        externalProjects.forEach(project=>{
          const row=document.createElement('tr');
          cell(row, checkbox(project.key,'选择'+project.name));cell(row,project.name);cell(row,'外部测评');cell(row,project.importedAt);
          const actions=document.createElement('div');actions.className='review-source-actions';
          const monitor=document.createElement('a');monitor.className='btn-text btn-sm';monitor.textContent='监控';monitor.href='review-external-monitor.html?session='+encodeURIComponent(monitorSession)+'&project='+encodeURIComponent(project.key);monitor.target='_blank';monitor.rel='noopener';
          const remove=document.createElement('button');remove.type='button';remove.className='btn-text btn-sm';remove.textContent='移除';remove.setAttribute('aria-label','移除'+project.name);remove.addEventListener('click',()=>{externalProjects=externalProjects.filter(item=>item.key!==project.key);saveExternal();render();});
          actions.append(monitor,remove);cell(row,actions);body.append(row);
        });
        const count=selected.size+externalProjects.length;
        if (!count) body.innerHTML = '<tr><td colspan="5" class="review-source-empty">暂无数据</td></tr>';
        document.getElementById('review-source-count').textContent = '已选 ' + count + ' 个';
        document.querySelector('[data-review-project-total]').textContent = '共 ' + count + ' 条';
        all.checked = false;
        all.indeterminate = false;
        all.disabled = !count;
      }
      function saveExternal(){localStorage.setItem(monitorSession,JSON.stringify(externalProjects));}
      function setExternal(records){
        const grouped=new Map(),now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
        records.forEach((record,index)=>{const key=JSON.stringify([record.projectName,record.startDate,record.endDate]);if(!grouped.has(key))grouped.set(key,{key,name:record.projectName,startDate:record.startDate,endDate:record.endDate,importedAt:date,records:[]});grouped.get(key).records.push({...record,importOrder:index});});
        externalProjects=[...grouped.values()];saveExternal();render();
      }
      all.addEventListener('change', () => body.querySelectorAll('input').forEach(input => { input.checked = all.checked; }));
      body.addEventListener('change', () => {
        const checks = [...body.querySelectorAll('input')], count = checks.filter(input => input.checked).length;
        all.checked = count === checks.length;
        all.indeterminate = count > 0 && count < checks.length;
      });
      function renderPicker() {
        ['available', 'picked'].forEach(side => {
          const target = drawer.querySelector('[data-review-' + side + ']');
          const items = projects.filter(project => !selected.has(project.id) && pending.has(project.id) === (side === 'picked') && (side === 'picked' || (project.id + project.name).toLowerCase().includes(keyword)));
          target.replaceChildren();
          items.forEach(project => {
            const row = document.createElement('tr');
            cell(row, checkbox(project.id, '勾选' + project.name));
            cell(row, project.id);
            cell(row, project.name);
            cell(row, '100%');
            target.append(row);
          });
          if (!items.length) target.innerHTML = '<tr><td colspan="4" class="review-source-empty">暂无数据</td></tr>';
          drawer.querySelector('[data-review-' + (side === 'available' ? 'available' : 'picked') + '-count]').textContent = (side === 'available' ? '待选区' : '已选择') + '（' + items.length + '）';
          const toggle = drawer.querySelector('[data-review-picker-all="' + side + '"]');
          toggle.checked = false;
          toggle.disabled = !items.length;
        });
        updateMoveButtons();
      }
      function updateMoveButtons() {
        ['in', 'out', 'all-in', 'all-out'].forEach(action => {
          const side = action.endsWith('in') ? 'available' : 'picked';
          drawer.querySelector('[data-review-move="' + action + '"]').disabled = !drawer.querySelector('[data-review-' + side + '] input' + (action.startsWith('all') ? '' : ':checked'));
        });
      }
      document.querySelector('[data-open="drawer-review-projects"]').addEventListener('click', () => {
        pending = new Set();
        keyword = '';
        search.reset();
        renderPicker();
      });
      search.addEventListener('submit', event => { event.preventDefault(); keyword = search.querySelector('input').value.trim().toLowerCase(); renderPicker(); });
      drawer.addEventListener('change', event => {
        const side = event.target.dataset.reviewPickerAll;
        if (side) drawer.querySelectorAll('[data-review-' + side + '] input').forEach(input => { input.checked = event.target.checked; });
        updateMoveButtons();
      });
      drawer.querySelectorAll('[data-review-move]').forEach(button => button.addEventListener('click', () => {
        const action = button.dataset.reviewMove, inward = action.endsWith('in');
        drawer.querySelectorAll('[data-review-' + (inward ? 'available' : 'picked') + '] input' + (action.startsWith('all') ? '' : ':checked')).forEach(input => inward ? pending.add(input.value) : pending.delete(input.value));
        renderPicker();
      }));
      drawer.querySelector('[data-review-confirm-project]').addEventListener('click', () => {
        const now = new Date(), date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        pending.forEach(id => selected.set(id, date));
        render();
      });
      setExternal([
        {employeeId:'EMP-1026',name:'张明',department:'研发中心',position:'架构师',projectName:'管理能力测评（外部示例）',startDate:'2026-11-01',endDate:'2026-11-12',score:88},
        {employeeId:'EMP-1088',name:'李华',department:'研发中心',position:'高级算法工程师',projectName:'管理能力测评（外部示例）',startDate:'2026-11-01',endDate:'2026-11-12',score:82}
      ]);
      return { getProjectCount: () => selected.size, getExternalCount:()=>externalProjects.length, setExternal, snapshot(){
        const key=monitorSession+'-activity-'+Date.now().toString(36),session=key+'-external';
        localStorage.setItem(session,JSON.stringify(externalProjects));
        localStorage.setItem(key,JSON.stringify({session,projects:projects.filter(project=>selected.has(project.id)).map(project=>({...project,associatedAt:selected.get(project.id)})),externalProjects,abilityScores:ReviewScoreImport.latestScores(externalProjects.flatMap(project=>project.records))}));
        return key;
      }};
    }
  };
})();
