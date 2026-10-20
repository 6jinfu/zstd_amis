(function () {
  const S=window.Standards,A=window.AssessmentDrafts,e=UI.escape,$=s=>document.querySelector(s);
  const drawer=$('#eva-ai-drawer'),chat=drawer.querySelector('.std-ai-chat'),host=$('#eva-ai-messages'),select=$('#eva-ai-standard'),prompt=$('#eva-ai-prompt'),send=$('#eva-ai-send');
  const welcome=host.innerHTML;
  let standard=null,selected=[],counts=A.defaults(),questions=[],turns=[],phase='welcome',purpose='',scenario='',sourceContent=null,scope=null,scopeLabel='',title='',generatedCounts=null;
  select.innerHTML+=S.read().standards.map(s=>`<option value="${e(s.id)}">${e(s.name)}</option>`).join('');
  const error=message=>$('#eva-ai-error').textContent=message;
  function renderCounts(){
    $('#eva-ai-question-types').innerHTML=Object.entries(A.types).map(([type,label])=>`<label><span class="sr-only">每项能力${label}数量</span><select data-eva-count="${type}" aria-label="每项能力${label}数量">${[0,1,2,3,4,5].map(n=>`<option value="${n}" ${counts[type]===n?'selected':''}>${label}${n}题</option>`).join('')}</select></label>`).join('');
  }
  function sync(){select.disabled=phase!=='welcome';send.disabled=!prompt.value.trim();prompt.placeholder=phase==='welcome'?'请描述你需要的评估主题':'Enter发送，Shift+Enter换行';}
  function review(){
    return `<section class="eva-ai-confirm"><h3>确认评估内容</h3><dl><div><dt>人才标准</dt><dd>${e(standard.name)}</dd></div><div><dt>应用范围</dt><dd>${e(A.resolve(standard).label)}</dd></div><div><dt>评估场景</dt><dd>${e(scenario||purpose)}</dd></div></dl><fieldset><legend>本次评估能力</legend>${standard.content.cap.map(([name,level])=>`<label><input type="checkbox" data-eva-ability value="${e(name)}" ${selected.includes(name)?'checked':''}><span>${e(name)}</span><span>${e(level)}</span></label>`).join('')}</fieldset></section>`;
  }
  function documentMarkup(){
    let index=0;
    return `<article class="eva-ai-questionnaire"><h2>${e(title)}</h2><p>依据：${e(standard.name)} · ${e(scopeLabel)}</p><p>${e(scenario||purpose)}</p>${selected.map((ability,section)=>`<section id="eva-ability-${section}"><h3>${e(ability)}</h3>${Object.entries(A.types).map(([type,label])=>{const list=questions.filter(q=>q.ability===ability&&(q.type||'score')===type);return list.length?`<h4>${label}</h4>${list.map(q=>A.questionMarkup(q,index++,e)).join('')}`:'';}).join('')}</section>`).join('')}<div class="eva-ai-result-actions"><button class="btn btn-primary" type="button" data-eva-create>创建问卷</button><button class="btn btn-secondary" type="button" data-eva-reselect>调整评估能力</button><button class="btn-text" type="button" data-eva-regenerate>重新生成</button></div></article>`;
  }
  function render(scrollToResult=false){
    chat.classList.toggle('conversation-mode',phase!=='welcome');
    if(phase==='welcome'){host.innerHTML=welcome;sync();return;}
    host.innerHTML=`${phase==='draft'?`<nav class="eva-ai-ability-nav" aria-label="评估能力跳转">${selected.map((ability,i)=>`<button type="button" data-eva-jump="${i}">${e(ability)}</button>`).join('')}</nav>`:''}<div class="eva-ai-thread-scroll"><div class="eva-ai-thread">${turns.map(t=>`<div class="eva-ai-message ${t.role}"><p>${e(t.text)}</p></div>`).join('')}${phase==='review'?review():documentMarkup()}</div></div>${phase==='review'?'<div class="eva-ai-confirm-actions"><button type="button" class="btn btn-primary" data-eva-generate>确认并生成问卷</button></div>':''}`;
    sync();
    if(scrollToResult)host.querySelector('.eva-ai-questionnaire')?.scrollIntoView({block:'start'});
  }
  function generate(){
    if(!selected.length){error('请至少选择一项能力');return;}
    if(!Object.values(counts).some(n=>n>0)){error('请至少为一种题型设置题数');return;}
    const latest=S.read().standards.find(s=>s.id===standard.id);
    if(!latest||!A.resolve(latest).valid||JSON.stringify(latest.content.cap)!==JSON.stringify(standard.content.cap)||JSON.stringify([latest.mode,latest.positions,latest.groups])!==JSON.stringify([standard.mode,standard.positions,standard.groups])){error('标准能力或应用范围已变化，请新建会话后重新选择');return;}
    sourceContent=S.clone(standard.content);scope=S.clone({mode:standard.mode,positions:standard.positions,groups:standard.groups});scopeLabel=A.resolve(standard).label;
    questions=A.generate(selected,counts,scenario||purpose);generatedCounts={...counts};title=title||standard.name+' 360 评估';phase='draft';
    turns.push({role:'assistant',text:`已按 ${selected.length} 项能力生成 ${questions.length} 道题。`});error('');render(true);
  }
  function submit(){
    const text=prompt.value.trim();if(!text)return;
    if(!standard){error('请先选择人才标准，应用范围随标准带入');select.focus();return;}
    if(!A.resolve(standard).valid||!standard.content.cap.length){error('请先完善该标准的应用范围和能力要求');return;}
    if(phase==='welcome'){
      purpose=text;scenario=text;selected=standard.content.cap.map(c=>c[0]);
      turns.push({role:'user',text},{role:'assistant',text:'已整理评估需求。请确认人才标准、应用范围及评估能力，再生成问卷。'});phase='review';prompt.value='';error('');render();return;
    }
    const context=text.match(/(?:场景|情境)(?:改为|设为|：|:)\s*(.{2,300})/),changes={};
    Object.entries(A.types).forEach(([type,label])=>{const match=text.match(new RegExp(label+'(?:改为|调整为|设为|保留)?\\s*([0-5])\\s*(?:题|道)?'));if(match)changes[type]=Number(match[1]);});
    if(!context&&!Object.keys(changes).length){error('请说明具体调整，例如“单选题改为2题”或“场景改为：跨部门项目交付”，也可点击“调整评估能力”');return;}
    const apply=()=>{Object.assign(counts,changes);if(context)scenario=context[1];turns.push({role:'user',text});prompt.value='';renderCounts();error('');if(phase==='draft')generate();else render();};
    if(phase==='draft')UI.openDialog({title:'重新生成问卷',body:'<p>按本次调整替换当前问卷，是否继续？</p>',confirmLabel:'重新生成',onConfirm:apply});else apply();
  }
  function reset(){standard=null;selected=[];counts=A.defaults();questions=[];turns=[];phase='welcome';purpose='';scenario='';title='';sourceContent=null;scope=null;scopeLabel='';select.value='';prompt.value='';error('');renderCounts();render();}
  function newSession(){
    if(phase!=='welcome')UI.openDialog({title:'新建会话',body:'<p>新建将清空当前对话内容，已保存的草稿仍可从历史会话打开。</p>',confirmLabel:'新建会话',onConfirm:reset});else reset();
  }
  function historyList(){
    const query=$('#eva-ai-history-search').value.trim();
    const drafts=A.read().filter(p=>p.turns?.length&&p.title.includes(query));
    $('#eva-ai-history-list').innerHTML=drafts.length?drafts.map(p=>`<button type="button" data-eva-history="${e(p.id)}" title="${e(p.title)}">${e(p.title)}</button>`).join(''):'<p class="eva-ai-history-empty">暂无已保存的会话</p>';
  }
  select.onchange=()=>{standard=S.read().standards.find(s=>s.id===select.value)||null;error('');};
  prompt.oninput=()=>{error('');sync();};
  prompt.onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit();}};
  send.onclick=submit;
  $('#eva-ai-question-types').onchange=event=>{counts[event.target.dataset.evaCount]=Number(event.target.value);error(phase==='draft'&&JSON.stringify(counts)!==JSON.stringify(generatedCounts)?'题数已调整，请点击“重新生成”后再创建问卷':'');};
  $('#eva-ai-history-toggle').onclick=()=>{const open=drawer.classList.toggle('history-open');$('#eva-ai-history-toggle').setAttribute('aria-expanded',String(open));drawer.querySelector('.std-ai-history').inert=!open;historyList();};
  $('#eva-ai-history-search').oninput=historyList;
  $('#eva-ai-new-chat').onclick=newSession;
  drawer.querySelector('.std-ai-history').inert=true;
  drawer.onclick=event=>{
    const quick=event.target.closest('[data-eva-quick]'),jump=event.target.closest('[data-eva-jump]'),history=event.target.closest('[data-eva-history]');
    if(quick){prompt.value=quick.dataset.evaQuick;sync();prompt.focus();}
    if(event.target.closest('[data-eva-reset]'))newSession();
    if(event.target.closest('[data-eva-generate]'))generate();
    if(event.target.closest('[data-eva-reselect]')){phase='review';render();}
    if(event.target.closest('[data-eva-regenerate]'))UI.openDialog({title:'重新生成问卷',body:'<p>将按下方题型数量重新生成完整问卷。</p>',confirmLabel:'重新生成',onConfirm:generate});
    if(jump){host.querySelector('#eva-ability-'+jump.dataset.evaJump)?.scrollIntoView({block:'start'});host.querySelectorAll('[data-eva-jump]').forEach(b=>b.classList.toggle('active',b===jump));}
    if(history){
      const p=A.read().find(d=>d.id===history.dataset.evaHistory);if(!p)return;
      const load=()=>{standard=S.read().standards.find(s=>s.id===p.standardId);if(!standard){error('该会话的来源标准已移除');return;}
        select.value=standard.id;questions=S.clone(p.questions);selected=[...new Set(questions.map(q=>q.ability))];counts=p.counts||{single:0,multi:0,score:p.perAbility||2,essay:0};generatedCounts={...counts};turns=S.clone(p.turns);purpose=p.purpose||'';scenario=p.scenario||'';sourceContent=p.sourceContent;scope=p.scope;scopeLabel=p.scopeLabel;title=p.title;phase='draft';error('');renderCounts();render(true);};
      if(phase!=='welcome')UI.openDialog({title:'打开历史会话',body:'<p>打开后将替换当前未保存会话。</p>',confirmLabel:'打开会话',onConfirm:load});else load();
    }
    if(event.target.closest('[data-eva-create]')){
      if(JSON.stringify(counts)!==JSON.stringify(generatedCounts)){error('题数已调整，请先重新生成问卷');return;}
      const latest=S.read().standards.find(s=>s.id===standard.id);
      if(!latest||A.resolve(latest).label!==scopeLabel||JSON.stringify(latest.content.cap)!==JSON.stringify(sourceContent.cap)||JSON.stringify({mode:latest.mode,positions:latest.positions,groups:latest.groups})!==JSON.stringify(scope)){error('来源标准已变化，请新建会话后重新确认');return;}
      const draft={title,standardId:standard.id,standardName:standard.name,scope,scopeLabel,sourceContent,questions,purpose,scenario,counts,turns};
      try{sessionStorage.setItem('talent-assessment-ai-draft-v1',JSON.stringify(draft));}catch(err){error('无法带入问卷，请检查浏览器存储空间');return;}
      location.href='assess-new.html?ai=1';
    }
    if(event.target.closest('.std-ai-microphone'))error('当前原型暂未接入语音输入，请直接输入评估需求');
  };
  host.onchange=event=>{if(event.target.matches('[data-eva-ability]'))selected=[...host.querySelectorAll('[data-eva-ability]:checked')].map(input=>input.value);error('');};
  renderCounts();sync();
  if(new URLSearchParams(location.search).get('ai')==='1')openOverlay('eva-ai-drawer');
})();
