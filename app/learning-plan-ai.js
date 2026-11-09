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
      [/基础|准备|入门|认知|知识|学习|拓展|认识|理解/,/知识|理解|设计|洞察|分析|选型|特征/],
      [/实践|实战|交付|项目|攻坚|演练|落地|应用|推进/,/工程|编程|开发|系统|管理|销售|谈判|推进|协同|设计/],
      [/复盘|分享|沉淀|总结|研讨|案例/,/理解|分析|洞察|管理|协同|沟通|创新|辅导/]
    ];
    return groups.map(group => ({...group,capabilities:group.confirmed
      ? group.capabilities.filter(name => names.includes(name))
      : names.filter(name => group.title.includes(name) || rules.some(([titlePattern,abilityPattern]) => titlePattern.test(group.title) && abilityPattern.test(name)))}));
  }
  window.LearningPlanAI = {parseTitles,abilityNames,targetGroup,unmatchedAbilities,autoAssociate};
  if (typeof document === 'undefined') return;
  const editor = window.LearningPlanEditor;
  if (!editor) return;
  const e = UI.escape, $ = selector => document.querySelector(selector);
  const drawer = $('#lp-ai-drawer'), chat = drawer.querySelector('.std-ai-chat'), host = $('#lp-ai-messages'), prompt = $('#lp-ai-prompt'), send = $('#lp-ai-send');
  const context = editor.context(), caps = context.standard.content.cap || [];
  const examples = [
    '面向新员工，分为基础学习、岗位实践、复盘分享',
    '围绕业务项目，分为项目准备、实战交付',
    '培养业务骨干，分为知识拓展、案例研讨、项目攻坚、经验沉淀'
  ];
  let phase = 'welcome', groups = [], turns = [], current = 0;
  const say = (role,text) => turns.push({role,text});
  const error = text => { $('#lp-ai-error').textContent = text; };
  const groupFrom = title => ({title,output:'',capabilities:[],activities:[],confirmed:false});
  function sync() {
    prompt.disabled = phase === 'applied';
    send.disabled = !prompt.value.trim() || phase === 'applied';
    prompt.placeholder = phase === 'welcome' ? '描述阶段或分组安排，以及要关联的能力' : phase === 'capabilities' ? '告诉我这一组要关联的能力，也可以直接选择' : '继续补充或调整分组、能力和资源';
  }
  function card() {
    if (phase === 'confirm') return `<section class="lp-ai-card"><h3>确认分组</h3><ol>${groups.map(group => `<li>${e(group.title)}</li>`).join('')}</ol><div class="lp-ai-card-actions"><button class="btn btn-primary" data-plan-ai="confirm-groups">确认分组</button></div></section>`;
    if (phase === 'capabilities') {
      const group = groups[current];
      return `<section class="lp-ai-card"><h3>${e(group.title)}</h3><fieldset class="lp-ai-capabilities"><legend>关联能力</legend>${caps.map(([name,level]) => `<label><input type="checkbox" value="${e(name)}" ${group.capabilities.includes(name) ? 'checked' : ''}><span>${e(name)}</span><span>${e(level || '')}</span></label>`).join('') || '<p>当前标准暂无能力项</p>'}</fieldset><div class="lp-ai-card-actions"><button class="btn btn-secondary" data-plan-ai="skip-capabilities">暂不关联</button><button class="btn btn-primary" data-plan-ai="confirm-capabilities">确认关联</button></div></section>`;
    }
    if (phase === 'ready' || phase === 'applied') return `<section class="lp-ai-card"><h3>学习方案</h3>${groups.map((group,index) => `<section class="lp-ai-ready-group"><header><h4>${index + 1}. ${e(group.title)}</h4>${phase === 'ready' ? `<button class="btn-text" data-plan-ai="edit-capabilities" data-index="${index}">调整能力</button>` : ''}</header><div class="lp-ai-cap-chips" aria-label="${e(group.title)}的关联能力">${group.capabilities.map(name => phase === 'ready' ? `<button type="button" data-plan-ai="remove-capability" data-index="${index}" data-name="${e(name)}" aria-label="移除${e(group.title)}的${e(name)}">${e(name)}<span aria-hidden="true">×</span></button>` : `<span>${e(name)}</span>`).join('') || '<span class="lp-ai-unmatched">待调整</span>'}</div>${group.activities.length ? `<p>${e(group.activities.map(item => item.title).join('、'))}</p>` : ''}${phase === 'ready' ? `<button class="btn-text" data-plan-ai="resources" data-index="${index}">关联资源</button>` : ''}</section>`).join('')}<div class="lp-ai-card-actions"><button class="btn btn-primary" data-plan-ai="apply" ${phase === 'applied' ? 'disabled' : ''}>${phase === 'applied' ? '已添加到方案' : '添加到方案'}</button></div></section>`;
    return '';
  }
  function render(keepScroll = false) {
    const scrollTop = host.scrollTop;
    const started = phase !== 'welcome';
    chat.classList.toggle('conversation-mode',started);
    drawer.classList.toggle('has-preview',groups.length > 0);
    if (!started) host.innerHTML = `<div class="std-ai-welcome"><h4>你好！一起构建学习方案</h4><div class="std-ai-quick">${examples.map(text => `<button type="button" data-plan-ai="example" data-prompt="${e(text)}">${e(text)}</button>`).join('')}</div></div>`;
    else host.innerHTML = `<div class="lp-ai-thread">${turns.map(turn => `<p class="lp-ai-message ${turn.role}">${e(turn.text)}</p>`).join('')}${card()}</div>`;
    const preview = $('#lp-ai-preview'); preview.hidden = !groups.length;
    preview.innerHTML = `<h3>方案预览</h3>${groups.map((group,index) => `<section><h4>${index + 1}. ${e(group.title)}</h4><p>${e(group.capabilities.join('、') || '待关联能力')}</p>${group.activities.length ? `<p>${group.activities.length} 项资源</p>` : ''}</section>`).join('')}`;
    sync(); host.scrollTop = keepScroll ? scrollTop : host.scrollHeight;
  }
  function confirmAbilities(names) {
    groups[current].capabilities = names; groups[current].confirmed = true;
    say('assistant',`“${groups[current].title}”${names.length ? '关联：' + names.join('、') : '暂不关联能力'}。`);
    phase = 'ready';
    error(''); render();
  }
  function submit() {
    const text = prompt.value.trim();
    if (!text || phase === 'applied') return;
    say('user',text); prompt.value = ''; error('');
    const rename = text.match(/(?:把|将)?(.+?)(?:改名为|重命名为|改为|改成)[“"]?(.+?)[”"]?[。]?$/);
    if (rename && groups.length) {
      const index = targetGroup(rename[1],groups), title = clean(rename[2]);
      if (index >= 0 && title && title.length <= 150) { groups[index].title = title; if (phase === 'ready') groups = autoAssociate(groups,caps); say('assistant',`已改为“${title}”。`); render(); return; }
    }
    const add = text.match(/^(?:再)?(?:增加|新增|添加)(?:一个|一组)?(?:阶段|分组)?(?:叫|为|：|:)?\s*[“"]?(.+?)[”"]?[。]?$/);
    if (add && groups.length) {
      const title = clean(add[1]);
      if (title && title.length <= 150 && !groups.some(group => group.title === title)) { groups.push(groupFrom(title)); phase = 'confirm'; say('assistant',`已增加“${title}”。`); render(); return; }
    }
    if (/^(?:删除|移除)/.test(text) && groups.length) {
      const index = targetGroup(text,groups);
      if (index >= 0) { const title = groups[index].title; groups.splice(index,1); phase = groups.length ? 'confirm' : 'names'; say('assistant',`已移除“${title}”。`); render(); return; }
    }
    if (phase === 'capabilities' || phase === 'ready') {
      const target = targetGroup(text,groups);
      if (target >= 0) current = target;
      const names = abilityNames(text,caps.map(([name]) => name));
      if (names.length || /^(?:暂不关联|不关联|跳过)[。]?$/u.test(text)) {
        if (phase === 'ready' && target < 0) { say('assistant','请指定要调整的分组。'); render(); return; }
        const unknown = unmatchedAbilities(text,caps.map(([name]) => name));
        if (unknown.length) { say('assistant',`“${unknown.join('、')}”未匹配当前标准，请重新选择能力。`); render(); return; }
        confirmAbilities(names); return;
      }
      if (phase === 'ready') {
        const resources = editor.catalog().filter(item => text.includes(item.title));
        if (target >= 0 && resources.length) {
          resources.forEach(item => { if (!groups[target].activities.some(existing => existing.title === item.title && existing.kind === item.kind)) groups[target].activities.push({...item,note:''}); });
          say('assistant',`已为“${groups[target].title}”关联所选资源。`); render(); return;
        }
      }
      if (phase === 'capabilities' && !/分为|分成|分组[为是叫：:]|阶段[为是叫：:]|顺序改为/.test(text)) { say('assistant','请使用当前标准中的能力名称，或在上方选择。'); render(); return; }
    }
    const explicitGroups = /分为|分成|分组[为是叫：:]|阶段[为是叫：:]|顺序改为/.test(text);
    const titles = phase === 'ready' && !explicitGroups ? [] : parseTitles(text);
    if (titles.length) {
      groups = titles.map(title => groups.find(group => group.title === title) || groupFrom(title)); phase = 'confirm';
      say('assistant','已整理分组，请确认名称和顺序。'); render(); return;
    }
    if (phase === 'welcome' || phase === 'names') { phase = 'names'; say('assistant','希望设置哪些阶段或分组？请告诉我名称和顺序。'); }
    else if (phase === 'capabilities') say('assistant','请使用当前标准中的能力名称，或在上方选择。');
    else say('assistant','可以告诉我新的分组名称，或指定要调整的分组与能力。');
    render();
  }
  function reset() { phase = 'welcome'; groups = []; turns = []; current = 0; prompt.value = ''; error(''); render(); prompt.focus(); }
  drawer.addEventListener('click',event => {
    const control = event.target.closest('[data-plan-ai]'); if (!control) return;
    error('');
    switch (control.dataset.planAi) {
      case 'example': prompt.value = control.dataset.prompt; error(''); sync(); prompt.focus(); break;
      case 'confirm-groups':
        say('user','确认分组：' + groups.map(group => group.title).join('、'));
        groups = autoAssociate(groups,caps); phase = 'ready';
        say('assistant','已匹配关联能力，可以直接调整。'); render(); break;
      case 'confirm-capabilities': {
        const names = [...host.querySelectorAll('input[type=checkbox]:checked')].map(input => input.value);
        if (!names.length) { error('选择能力，或点击“暂不关联”。'); return; }
        say('user',names.join('、')); confirmAbilities(names); break;
      }
      case 'skip-capabilities': say('user','暂不关联'); confirmAbilities([]); break;
      case 'edit-capabilities': current = Number(control.dataset.index); phase = 'capabilities'; say('assistant',`调整“${groups[current].title}”的关联能力。`); render(); break;
      case 'remove-capability': {
        const group = groups[Number(control.dataset.index)];
        group.capabilities = group.capabilities.filter(name => name !== control.dataset.name); group.confirmed = true;
        render(true); host.querySelector(`[data-plan-ai="edit-capabilities"][data-index="${control.dataset.index}"]`)?.focus({preventScroll:true}); break;
      }
      case 'resources': {
        const group = groups[Number(control.dataset.index)], rows = editor.catalog();
        UI.openPicker({title:'关联课程 / 项目',items:rows.map((item,index) => ({id:String(index),label:item.title,description:item.kind})),selectedIds:rows.flatMap((item,index) => group.activities.some(existing => existing.kind === item.kind && existing.title === item.title) ? [String(index)] : []),onConfirm(ids) {
          group.activities = ids.map(id => ({...rows[Number(id)],note:''})); say('user',`为“${group.title}”关联 ${ids.length} 项资源。`); render();
        }}); break;
      }
      case 'apply': {
        if (phase !== 'ready') return;
        const latest = Standards.associated(Standards.read(),context.position.id).find(item => item.id === context.standard.id);
        if (!latest || JSON.stringify(latest.content.cap) !== JSON.stringify(caps)) { error('标准已变化，请刷新页面后重新核对。'); return; }
        const values = groups.map(({confirmed,...group}) => group);
        if (!editor.append(values)) { error('无法应用，请核对分组和能力。'); return; }
        phase = 'applied'; say('assistant','已添加到方案。'); render(); closeAllOverlays(); showToast('已添加到方案'); break;
      }
    }
  });
  $('#lp-ai-new-chat').onclick = () => {
    if (turns.length && phase !== 'applied') UI.openDialog({title:'新建会话',body:'<p>清空当前对话，开始新的帮建？</p>',confirmLabel:'新建会话',onConfirm:reset});
    else reset();
  };
  $('#lp-ai-context').textContent = context.standard.name;
  $('#lp-ai-open').addEventListener('click',() => { render(); });
  prompt.oninput = () => { error(''); sync(); };
  prompt.onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(); } };
  send.onclick = submit;
  render();
})();
