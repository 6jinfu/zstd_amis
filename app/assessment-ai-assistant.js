(function () {
  const S=window.Standards,A=window.AssessmentDrafts,e=UI.escape,$=s=>document.querySelector(s);
  const drawer=$('#eva-ai-drawer'),chat=drawer.querySelector('.std-ai-chat'),host=$('#eva-ai-messages'),select=$('#eva-ai-standard'),prompt=$('#eva-ai-prompt'),send=$('#eva-ai-send');
  const welcome=host.innerHTML;
  let standard=null,selected=[],counts=A.defaults(),questions=[],turns=[],phase='welcome',purpose='',scenario='',sourceContent=null,scope=null,scopeLabel='',title='',generatedCounts=null;
  let generation=null,generationTimer=0;
  select.innerHTML+=S.read().standards.map(s=>`<option value="${e(s.id)}">${e(s.name)}</option>`).join('');
  const error=message=>$('#eva-ai-error').textContent=message;
  function renderCounts(){
    $('#eva-ai-question-types').innerHTML=Object.entries(A.types).map(([type,label])=>`<label><span class="sr-only">每项能力${label}数量</span><select data-eva-count="${type}" aria-label="每项能力${label}数量">${[0,1,2,3,4,5].map(n=>`<option value="${n}" ${counts[type]===n?'selected':''}>${label}${n}题</option>`).join('')}</select></label>`).join('');
  }
  function sync(){const busy=phase==='generating';select.disabled=phase!=='welcome';send.disabled=busy||!prompt.value.trim();$('#eva-ai-question-types').querySelectorAll('select').forEach(input=>input.disabled=busy);prompt.placeholder=phase==='welcome'?'请描述你需要的评估主题':busy?'正在生成，可先输入后续调整':'Enter发送，Shift+Enter换行';}
  function review(){
    return `<section class="eva-ai-confirm"><h3>确认评估内容</h3><dl><div><dt>人才标准</dt><dd>${e(standard.name)}</dd></div><div><dt>应用范围</dt><dd>${e(A.resolve(standard).label)}</dd></div><div><dt>评估场景</dt><dd>${e(scenario||purpose)}</dd></div></dl><fieldset><legend>本次评估能力</legend>${standard.content.cap.map(([name,level])=>`<label><input type="checkbox" data-eva-ability value="${e(name)}" ${selected.includes(name)?'checked':''}><span>${e(name)}</span><span>${e(level)}</span></label>`).join('')}</fieldset></section>`;
  }
  function documentMarkup(){
    let index=0;
    return `<article class="eva-ai-questionnaire"><h2>${e(title)}</h2><p>依据：${e(standard.name)} · ${e(scopeLabel)}</p><p>${e(scenario||purpose)}</p>${selected.map((ability,section)=>`<section id="eva-ability-${section}"><h3>${e(ability)}</h3>${Object.entries(A.types).map(([type,label])=>{const list=questions.filter(q=>q.ability===ability&&(q.type||'score')===type);return list.length?`<h4>${label}</h4>${list.map(q=>A.questionMarkup(q,index++,e)).join('')}`:'';}).join('')}</section>`).join('')}<div class="eva-ai-result-actions"><button class="btn btn-primary" type="button" data-eva-create>创建问卷</button><button class="btn btn-secondary" type="button" data-eva-reselect>调整评估能力</button><button class="btn-text" type="button" data-eva-regenerate>重新生成</button></div></article>`;
  }
  function generationRows(items){
    return `<ol class="eva-ai-generation-list">${items.map(item=>`<li class="${item.state||'done'}"><span class="eva-ai-generation-dot" aria-hidden="true">${!item.state||item.state==='done'?'✓':''}</span><span>${e(item.name)}</span><span>${e(item.state==='active'?'正在生成':item.state==='pending'?'待生成':item.count+' 题')}</span></li>`).join('')}</ol>`;
  }
  function generationMarkup(){
    const job=generation,checking=job.index===job.abilities.length;
    const items=job.abilities.map((name,index)=>({name,count:job.countsPerAbility,state:index<job.index?'done':index===job.index&&!checking?'active':'pending'}));
    const latest=job.questions[job.questions.length-job.countsPerAbility];
    return `<section class="eva-ai-generation" aria-label="题本生成进度"><header><strong>${checking?'正在检查题本':'正在生成人才评估题本'}</strong><span>${job.questions.length} / ${job.total} 题</span></header><p class="eva-ai-generation-status" role="status">${checking?'能力题目已生成，正在核对题型数量、能力覆盖和题干选项。':`已完成 ${job.index} / ${job.abilities.length} 项能力，正在生成“${e(job.abilities[job.index])}”。`}</p><progress value="${job.index}" max="${job.abilities.length}" aria-label="能力生成进度"></progress>${generationRows(items)}${latest?`<div class="eva-ai-generation-sample"><span>已生成示例 · ${e(latest.ability)}</span><p>${e(latest.text)}</p></div>`:''}</section>`;
  }
  function generationRecord(turn){
    return `<details class="eva-ai-generation-record"><summary>生成记录 · ${turn.total} 题</summary>${generationRows(turn.abilities)}<ul>${turn.checks.map(text=>`<li>${e(text)}</li>`).join('')}</ul></details>`;
  }
  function render(scrollToResult=false){
    chat.classList.toggle('conversation-mode',phase!=='welcome');
    chat.classList.toggle('is-generating',phase==='generating');
    if(phase==='welcome'){host.innerHTML=welcome;sync();return;}
    const content=phase==='review'?review():phase==='generating'?generationMarkup():documentMarkup();
    host.innerHTML=`${phase==='draft'?`<nav class="eva-ai-ability-nav" aria-label="评估能力跳转">${selected.map((ability,i)=>`<button type="button" data-eva-jump="${i}">${e(ability)}</button>`).join('')}</nav>`:''}<div class="eva-ai-thread-scroll"><div class="eva-ai-thread">${turns.map(t=>`<div class="eva-ai-message ${t.role}" ${t.kind==='generation'?'data-eva-completion':''}><p>${e(t.text)}</p>${t.kind==='generation'?generationRecord(t):''}</div>`).join('')}${content}</div></div>${phase==='review'?'<div class="eva-ai-confirm-actions"><button type="button" class="btn btn-primary" data-eva-generate>确认并生成问卷</button></div>':''}`;
    sync();
    if(scrollToResult){const target=phase==='generating'?host.querySelector('.eva-ai-generation'):Array.from(host.querySelectorAll('[data-eva-completion]')).pop()||host.querySelector('.eva-ai-questionnaire');target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  }
  function updateGeneration(){
    const card=host.querySelector('.eva-ai-generation');if(!card)return;
    const scroller=host.querySelector('.eva-ai-thread-scroll'),follow=scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<48;
    card.innerHTML=generationMarkup().replace(/^<section[^>]*>|<\/section>$/g,'');
    if(follow)scroller.scrollTo({top:scroller.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function checkQuestions(items,abilities,typeCounts){
    const quantity=abilities.every(ability=>Object.keys(A.types).every(type=>items.filter(q=>q.ability===ability&&q.type===type).length===typeCounts[type]));
    const coverage=items.every(q=>abilities.includes(q.ability)&&Object.hasOwn(A.types,q.type))&&abilities.every(ability=>items.some(q=>q.ability===ability));
    const complete=items.every(q=>typeof q.id==='string'&&q.id&&typeof q.text==='string'&&q.text.trim()&&(!['single','multi'].includes(q.type)||(Array.isArray(q.options)&&q.options.length>=2&&q.options.every(option=>typeof option==='string'&&option.trim()))))&&new Set(items.map(q=>q.id)).size===items.length;
    return {valid:quantity&&coverage&&complete,checks:[`已核对 ${items.length} 道题的题型数量`,`已覆盖 ${abilities.length} 项确认能力`,'题干及选择题选项完整']};
  }
  function stopGeneration(){clearTimeout(generationTimer);generationTimer=0;generation=null;}
  function generate(){
    if(phase==='generating')return;
    if(!selected.length){error('请至少选择一项能力');return;}
    if(!Object.values(counts).some(n=>n>0)){error('请至少为一种题型设置题数');return;}
    const latest=S.read().standards.find(s=>s.id===standard.id);
    if(!latest||!A.resolve(latest).valid||JSON.stringify(latest.content.cap)!==JSON.stringify(standard.content.cap)||JSON.stringify([latest.mode,latest.positions,latest.groups])!==JSON.stringify([standard.mode,standard.positions,standard.groups])){error('标准能力或应用范围已变化，请新建会话后重新选择');return;}
    stopGeneration();
    sourceContent=S.clone(standard.content);scope=S.clone({mode:standard.mode,positions:standard.positions,groups:standard.groups});scopeLabel=A.resolve(standard).label;
    const countsPerAbility=Object.values(counts).reduce((sum,count)=>sum+count,0);
    const job={abilities:[...selected],counts:{...counts},scenario:scenario||purpose,countsPerAbility,total:countsPerAbility*selected.length,index:0,questions:[]};
    generation=job;
    turns.push({role:'user',text:`确认 ${selected.length} 项评估能力，按当前题型设置生成问卷。`},{role:'assistant',text:`已确认本次 ${job.abilities.length} 项评估能力。我会结合你描述的工作场景，为每项能力生成 ${countsPerAbility} 道题，共 ${job.total} 道，再核对题目完整性。`});
    phase='generating';error('');render(true);
    function advance(){
      if(generation!==job||phase!=='generating')return;
      try{
        if(job.index<job.abilities.length){
          job.questions.push(...A.generate([job.abilities[job.index]],job.counts,job.scenario));job.index++;updateGeneration();generationTimer=setTimeout(advance,450);return;
        }
        const report=checkQuestions(job.questions,job.abilities,job.counts);
        if(!report.valid)throw new Error('Incomplete questionnaire');
        questions=job.questions;generatedCounts=job.counts;title=title||standard.name+' 360 评估';phase='draft';
        turns.push({role:'assistant',kind:'generation',total:questions.length,abilities:job.abilities.map(name=>({name,count:countsPerAbility})),checks:report.checks,text:`题本已整理完成，共 ${job.abilities.length} 项能力、${questions.length} 道题，题型数量和题干选项检查已通过。你可以查看全文，也可以继续告诉我需要调整的题数或场景。`});
        stopGeneration();render(true);
      }catch(err){stopGeneration();phase='review';turns.push({role:'assistant',text:'本次题本未能完整生成，请重试。'});render();error('题本生成未完成，请重新生成；当前内容尚未保存。');}
    }
    generationTimer=setTimeout(advance,450);
  }
  function submit(){
    if(phase==='generating')return;
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
  function reset(){stopGeneration();standard=null;selected=[];counts=A.defaults();questions=[];turns=[];phase='welcome';purpose='';scenario='';title='';sourceContent=null;scope=null;scopeLabel='';select.value='';prompt.value='';error('');renderCounts();render();}
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
  $('#eva-ai-question-types').onchange=event=>{if(phase==='generating')return;counts[event.target.dataset.evaCount]=Number(event.target.value);error(phase==='draft'&&JSON.stringify(counts)!==JSON.stringify(generatedCounts)?'题数已调整，请点击“重新生成”后再创建问卷':'');};
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
      const load=()=>{const source=S.read().standards.find(s=>s.id===p.standardId);if(!source){error('该会话的来源标准已移除');return;}stopGeneration();standard=source;
        select.value=standard.id;questions=S.clone(p.questions);selected=[...new Set(questions.map(q=>q.ability))];counts=p.counts||{single:0,multi:0,score:p.perAbility||2,essay:0};generatedCounts={...counts};turns=S.clone(p.turns);purpose=p.purpose||'';scenario=p.scenario||'';sourceContent=p.sourceContent;scope=p.scope;scopeLabel=p.scopeLabel;title=p.title;phase='draft';error('');renderCounts();render(true);};
      if(phase!=='welcome')UI.openDialog({title:'打开历史会话',body:'<p>打开后将替换当前未保存会话。</p>',confirmLabel:'打开会话',onConfirm:load});else load();
    }
    if(event.target.closest('[data-eva-create]')){
      if(phase!=='draft')return;
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
