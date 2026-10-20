(function () {
  const $ = selector => document.querySelector(selector);
  const escape = UI.escape;
  const levels = ['G', 'A', 'B', 'C', 'D'];
  const sequences = [
    {
      name: '研发序列',
      channels: [
        {name: '上海研发序列', cells: [{name:'研发总监'}, {name:'架构师', id:'RD-302'}, {name:'研发经理'}, {name:'后端开发工程师', id:'RD-205'}, {name:'前端开发工程师', id:'RD-102'}]},
        {name: '广州研发序列', cells: [{name:'总裁特助'}, {name:'证券事务代表'}, {name:'培训项目经理'}, {name:'人事行政'}, {name:'内容策划主管'}]},
        {name: '芯片研发序列', cells: [{name:'总工程师'}, {name:'主任工程师'}, {name:'高级算法工程师', id:'RD-301'}, {name:'工程师'}, {name:'助理工程师'}]}
      ]
    },
    {
      name: '管理序列',
      channels: [
        {name: '综合管理通道', cells: [{name:'总经理'}, {name:'部门总监'}, {name:'部门经理'}, {name:'主管'}, {name:'专员'}]},
        {name: '职能管理通道', cells: [{name:'首席财务官'}, {name:'财务总监'}, {name:'财务分析经理', id:'FN-203'}, {name:'团队主管'}, {name:'招聘专员', id:'HR-101'}]}
      ]
    },
    {
      name: '销售序列',
      channels: [
        {name: '销售管理通道', cells: [{name:'销售负责人'}, {name:'区域销售总监', id:'SA-301'}, {name:'销售经理', id:'SA-201'}, {name:'销售主管'}, {name:'销售专员'}]},
        {name: '客户经营通道', cells: [{name:'战略客户负责人'}, {name:'大客户总监'}, {name:'大客户销售经理', id:'SA-110'}, {name:'客户经理'}, {name:'客户专员'}]}
      ]
    },
    {
      name: '专业序列',
      channels: [
        {name: '人力资源通道', cells: [{name:'人力资源总监'}, {name:'人力资源专家'}, {name:'人力资源经理'}, {name:'人事行政'}, {name:'招聘专员', id:'HR-101'}]},
        {name: '财务专业通道', cells: [{name:'财务总监'}, {name:'高级财务专家'}, {name:'财务分析经理', id:'FN-203'}, {name:'财务分析师'}, {name:'财务专员'}]}
      ]
    }
  ];
  let active = 0;
  let selected = null;
  let query = '';

  const fileIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 1h9l5 5v13H3z"/><path d="M12 1v5h5" fill="#e7eefc"/></svg>';
  const editIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m3 14 9-9 3 3-9 9-4 1zM11 6l3 3M3 18h14"/></svg>';
  const deleteIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M7 5V3h6v2M5 5l1 12h8l1-12M8 8v6M12 8v6"/></svg>';

  function renderSeries() {
    const term = $('#pm-series-search').value.trim().toLowerCase();
    $('#pm-series-list').innerHTML = sequences.map((sequence, index) =>
      sequence.name.toLowerCase().includes(term)
        ? `<button type="button" class="pm-series-item${index === active ? ' active' : ''}" data-series="${index}" title="${escape(sequence.name)}" aria-current="${index === active ? 'true' : 'false'}">${fileIcon}<span>${escape(sequence.name)}</span></button>`
        : ''
    ).join('') || '<p class="pm-series-empty">没有匹配的序列</p>';
  }

  function renderMatrix() {
    const sequence = sequences[active];
    const matrix = $('#pm-matrix');
    matrix.style.setProperty('--pm-columns', sequence.channels.length);
    const term = query.toLowerCase();
    const matches = sequence.channels.flatMap(channel => channel.cells).filter(cell => cell?.name?.toLowerCase().includes(term)).length;
    matrix.innerHTML = levels.map((level, row) => {
      const cells = sequence.channels.map((channel, column) => {
        const cell = channel.cells[row];
        const name = cell?.name || '';
        const matched = term && name.toLowerCase().includes(term);
        const dimmed = term && !matched;
        return `<button type="button" class="pm-cell${name ? '' : ' is-empty'}${matched ? ' is-match' : ''}${dimmed ? ' is-muted' : ''}" data-row="${row}" data-column="${column}" aria-label="${escape(level + '级 · ' + channel.name + ' · ' + (name || '配置岗位'))}">${name ? escape(name) : '+ 配置岗位'}</button>`;
      }).join('');
      return `<div class="pm-level" aria-label="${level}级">${level}</div>${cells}`;
    }).join('') + '<div class="pm-corner">职级 / 通道</div>' + sequence.channels.map((channel, column) =>
      `<div class="pm-channel"><span class="pm-channel-name" title="${escape(channel.name)}">${escape(channel.name)}</span><span class="pm-channel-actions"><button type="button" data-edit-channel="${column}" aria-label="编辑${escape(channel.name)}">${editIcon}</button><button type="button" data-delete-channel="${column}" aria-label="删除${escape(channel.name)}">${deleteIcon}</button></span></div>`
    ).join('');
    const note = $('#pm-search-note');
    if (term) {
      note.hidden = false;
      note.textContent = `找到 ${matches} 个岗位；其他岗位已淡化显示`;
    } else note.hidden = true;
  }

  function selectCell(row, column) {
    selected = {row, column};
    const sequence = sequences[active];
    const cell = sequence.channels[column].cells[row];
    if (!cell?.name) { renderPicker(); openOverlay('drawer-selpos'); return; }
    const drawer = $('#drawer-node');
    drawer.querySelector('h3').textContent = cell.name;
    drawer.querySelector('.m-head .text-sm').textContent = `${sequence.name} · ${levels[row]}级 · ${sequence.channels[column].name}`;
    const link = drawer.querySelector('a.action-item');
    link.hidden = !cell.id;
    if (cell.id) link.href = 'learning-plan.html?position=' + encodeURIComponent(cell.id);
    openOverlay('drawer-node');
  }

  function renderPicker() {
    const term = $('#pm-pick-search').value.trim().toLowerCase();
    $('#pm-pick-results').innerHTML = Standards.positions.filter(position =>
      position.name.toLowerCase().includes(term) || position.id.toLowerCase().includes(term)
    ).map(position => `<tr><td><input type="radio" name="pos" value="${escape(position.id)}" aria-label="选择${escape(position.name)}"></td><td>${escape(position.name)}</td><td class="muted">${escape(position.category)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">没有匹配的岗位</td></tr>';
  }

  $('#pm-series-search').addEventListener('input', renderSeries);
  $('#pm-series-list').addEventListener('click', event => {
    const button = event.target.closest('[data-series]');
    if (!button) return;
    active = Number(button.dataset.series);
    query = '';
    $('#pm-position-search').value = '';
    renderSeries();
    renderMatrix();
  });
  $('#pm-search-form').addEventListener('submit', event => {
    event.preventDefault();
    query = $('#pm-position-search').value.trim();
    renderMatrix();
  });
  $('#pm-position-search').addEventListener('input', event => {
    if (!event.target.value) { query = ''; renderMatrix(); }
  });
  $('#pm-matrix').addEventListener('click', event => {
    const cell = event.target.closest('[data-row][data-column]');
    if (cell) { selectCell(Number(cell.dataset.row), Number(cell.dataset.column)); return; }
    const edit = event.target.closest('[data-edit-channel]');
    if (edit) { editChannel(Number(edit.dataset.editChannel)); return; }
    const remove = event.target.closest('[data-delete-channel]');
    if (remove) deleteChannel(Number(remove.dataset.deleteChannel));
  });

  function channelDialog(title, current, save) {
    UI.openDialog({title, body:'<label for="pm-channel-name">通道名称</label><input id="pm-channel-name" class="input mt-sm" maxlength="24" value="' + escape(current) + '" placeholder="输入通道名称">', confirmLabel:'保存', onConfirm(dialog) {
      const name = dialog.querySelector('input').value.trim();
      if (!name) { dialog.showError('请输入通道名称'); return false; }
      save(name);
      renderMatrix();
    }});
  }
  $('#pm-add-map').addEventListener('click', () => channelDialog('新增岗位地图', '', name => {
    sequences[active].channels.push({name, cells: levels.map(() => null)});
  }));
  function editChannel(column) {
    const channel = sequences[active].channels[column];
    channelDialog('编辑通道', channel.name, name => { channel.name = name; });
  }
  function deleteChannel(column) {
    const channels = sequences[active].channels;
    if (channels.length === 1) { showToast('至少保留一条通道'); return; }
    UI.openDialog({title:'删除通道', body:`<p>删除“${escape(channels[column].name)}”及其中的岗位节点？</p>`, confirmLabel:'删除', onConfirm() {
      channels.splice(column, 1);
      renderMatrix();
    }});
  }

  $('#pm-pick-search').addEventListener('input', renderPicker);
  $('#pm-attach-position').addEventListener('click', () => {
    if (!selected) return;
    const input = $('#pm-pick-results input[name="pos"]:checked');
    if (!input) { showToast('请选择岗位'); return; }
    const position = Standards.positions.find(item => item.id === input.value);
    sequences[active].channels[selected.column].cells[selected.row] = {name: position.name, id: position.id};
    closeAllOverlays();
    renderMatrix();
  });
  $('#pm-remove-position').addEventListener('click', () => {
    if (!selected) return;
    const cell = sequences[active].channels[selected.column].cells[selected.row];
    UI.openDialog({title:'移除岗位', body:`<p>将“${escape(cell.name)}”从当前通道移除？岗位资料与学习方案会保留。</p>`, confirmLabel:'移除', onConfirm() {
      sequences[active].channels[selected.column].cells[selected.row] = null;
      closeAllOverlays();
      renderMatrix();
    }});
  });
  $('#drawer-node [data-open="drawer-channel"]').addEventListener('click', () => {
    if (!selected) return;
    const {row, column} = selected;
    const channel = sequences[active].channels[column];
    const cell = channel.cells[row];
    $('#drawer-channel .m-head .text-sm').textContent = `${sequences[active].name} · ${cell.name}`;
    $('#drawer-channel .m-body').innerHTML = [row - 1, row, row + 1].filter(index => index >= 0 && index < levels.length).map(index =>
      `<div class="flex gap-sm center" style="padding:10px 0"><span class="tag tag-primary">${levels[index]}</span><b>${escape(channel.cells[index]?.name || '尚未配置岗位')}${index === row ? '（当前）' : ''}</b></div>`
    ).join('');
  });

  const note = document.createElement('p');
  note.id = 'pm-search-note';
  note.className = 'pm-search-note';
  note.hidden = true;
  $('.pm-map-scroll').before(note);
  renderSeries();
  renderMatrix();
})();
