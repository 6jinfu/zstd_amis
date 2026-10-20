(function () {
  const root=document.querySelector('[data-standard-list]');
  if(!root)return;
  const S=window.Standards,$=selector=>document.querySelector(selector),e=UI.escape;
  const drawer=$('#std-ai-drawer'),chat=drawer.querySelector('.std-ai-chat'),messages=$('#std-ai-messages'),composer=drawer.querySelector('.std-ai-composer'),prompt=$('#std-ai-prompt'),promptLabel=drawer.querySelector('label[for="std-ai-prompt"]'),positionSelect=$('#std-ai-position'),send=$('#std-ai-send'),files=$('#std-ai-files');
  const pendingKey='talent-standard-ai-draft-v1';
  const productContent={duty:[{n:'负责产品规划与需求管理',t:['结合业务目标完成需求分析与优先级判断','输出清晰的产品方案并推动评审']},{n:'推动产品交付与持续优化',t:['协同研发、设计和运营推进版本落地','跟踪核心数据与用户反馈并持续迭代']}],exp:['本科及以上，产品、计算机或相关专业优先','2 年以上互联网或企业软件产品经验','具备从需求分析到产品交付的完整项目经验'],cap:[['需求分析','L3'],['产品规划','L3'],['数据分析','L3'],['跨部门沟通','L3'],['项目管理','L3']],pow:['成就导向','协作共赢','创新探索'],pot:['学习敏锐','复杂决策','跨界整合']};
  const commonContent={duty:[{n:'围绕岗位目标完成专业工作交付',t:['理解任务目标并制定执行计划','按质量和时间要求完成工作成果']},{n:'参与团队协作与持续改进',t:['主动同步进展、问题和风险','沉淀经验并参与知识共享']}],exp:['具备与岗位相关的专业学习或实践经历','能够独立承担职责范围内的工作任务'],cap:[['目标执行','L3'],['问题解决','L3'],['跨部门沟通','L3'],['持续学习','L3']],pow:['成就导向','协作共赢'],pot:['学习敏锐','坚韧抗压']};
  const T=window.TalentSettings,defaultSections=Object.keys(T.dimensions),sectionLabels=T.dimensions;
  let sourceId='',detail='concise',focus='balanced',feedbackResponses=[];
  let stage='welcome',result=null,originalRequest='',brief=null,uploadedFile='',generationTimer=0,thinkingTarget='review',generatedSections=T.enabled(),scope='position',scopeFeedback='',feedbackHistory=[],reviewFeedbackHistory=[];

  positionSelect.innerHTML='<option value="">请选择岗位</option>'+S.positions.map(item=>`<option value="${e(item.id)}">${e(item.name)}</option>`).join('');
  function welcomeMarkup(){return '<div class="std-ai-welcome" id="std-ai-welcome"><h4>你好！我是AI帮建助手～</h4><div class="std-ai-quick"><button type="button" data-ai-quick="企业培训平台的初级销售经理建模">企业培训平台的初级销售经理建模</button><button type="button" data-ai-quick="个人贡献者能力建模">个人贡献者能力建模</button><button type="button" data-ai-quick="入职三年的产品经理的能力建模">入职三年的产品经理的能力建模</button></div></div>';}
  function composerEnabled(){return stage==='welcome'||stage==='thinking';}
  function setStage(next){
    stage=next;chat.classList.toggle('conversation-mode',next!=='welcome');chat.classList.toggle('thinking-mode',next==='thinking');chat.classList.toggle('preview-mode',next==='scope');drawer.classList.toggle('flow-active',next!=='welcome');positionSelect.disabled=next!=='welcome';
    const hidden=next==='review'||next==='outline'||next==='scope',promptText=next==='welcome'?'请描述建模的岗位要求':'有问题或者需要调整的，可以直接告诉我';composer.setAttribute('aria-hidden',String(hidden));prompt.placeholder=promptText;promptLabel.textContent=promptText;send.disabled=hidden||!prompt.value.trim();
  }
  function reset(){clearTimeout(generationTimer);result=null;originalRequest='';brief=null;uploadedFile='';files.value='';thinkingTarget='review';generatedSections=T.enabled();sourceId='';detail='concise';focus='balanced';feedbackResponses=[];scope='position';scopeFeedback='';feedbackHistory=[];reviewFeedbackHistory=[];setStage('welcome');positionSelect.value='';prompt.value='';send.disabled=true;messages.innerHTML=welcomeMarkup();prompt.focus();}
  function selectedPosition(){return S.positions.find(item=>item.id===positionSelect.value);}
  function inferPosition(text){return S.positions.find(item=>text.includes(item.name));}
  function inferBrief(text){
    const inferred=!positionSelect.value&&inferPosition(text);if(inferred)positionSelect.value=inferred.id;
    const position=selectedPosition(),scenario=text.replace(/的?(能力)?建模/g,'').trim()||(position?`${position.name}岗位建模`:'通用人才标准建模');
    return {scenario,level:/初级|基层/.test(text)?'基层/初级':/高级|资深|高层/.test(text)?'高层/高级':/中级|中层/.test(text)?'中层/中级':'未指定',management:/个人贡献者|不带团队/.test(text)?'不带团队':/带团队|团队管理/.test(text)?'带团队':'未指定'};
  }
  function build(){
    const position=selectedPosition(),seeds=Object.values(window.STANDARD_POSITION_SEEDS||{}),context=`${position?.name||''} ${brief.scenario}`;let seed=position?seeds.find(item=>item.code===position.id):null;
    if(!seed&&position?.category==='销售')seed=window.STANDARD_POSITION_SEEDS?.sales;if(!seed&&/算法/.test(position?.name||''))seed=window.STANDARD_POSITION_SEEDS?.algorithm;
    const source=sourceStandard(),fallback=seed?seed.standard:/产品/.test(context)?productContent:commonContent;
    const content=source?S.clone(source.content):S.clone(fallback);
    defaultSections.forEach(key=>{if(!content[key].length&&generatedSections.includes(key))content[key]=S.clone(fallback[key]);});
    const categoryMap={研发:'研发序列',销售:'销售序列',职能:'通用标准'};let category=categoryMap[position?.category]||'通用标准';
    if(!S.read().categories.includes(category))category='通用标准';if(brief.management==='带团队'&&generatedSections.includes('cap')&&!content.cap.some(item=>item[0]==='团队管理'))content.cap.push(['团队管理','L3']);
    const feedback=feedbackHistory.join(' ');
    if(/重点客户|大客户|客户经营/.test(feedback)&&content.duty[0])content.duty[0].n='负责销售目标达成与重点客户经营';
    if(/精简|减少/.test(feedback)){content.exp=content.exp.slice(0,2);content.pow=content.pow.slice(0,2);content.pot=content.pot.slice(0,2);}
    if(/团队|辅导/.test(feedback)&&generatedSections.includes('cap')&&!content.cap.some(item=>item[0]==='团队管理'))content.cap.push(['团队管理','L3']);
    const limit=detail==='concise'?{duty:2,exp:2,cap:3,pow:2,pot:2}:{duty:3,exp:3,cap:5,pow:3,pot:3};
    const pattern=focus==='collaboration'?/沟通|协作|协同/:focus==='leadership'?/管理|团队|辅导/:/执行|目标|交付|规划/;
    if(focus!=='balanced')content.cap.sort((a,b)=>Number(pattern.test(b[0]))-Number(pattern.test(a[0])));
    defaultSections.forEach(key=>{content[key]=generatedSections.includes(key)?content[key].slice(0,limit[key]):[];});
    return {name:position?`${position.name}标准`:'人才标准草稿',category,description:`面向${brief.scenario}${brief.level==='未指定'?'':'，岗位层级：'+brief.level}${brief.management==='未指定'?'':'，管理范围：'+brief.management}。` ,mode:position?'positions':'none',positions:position?[position.id]:[],groups:[],content};
  }
  function flowLayout(body,footer){return `<div class="std-ai-flow-workspace">${body}${footer||''}</div>`;}
  function generationConfirmation(){const labels={balanced:'均衡呈现',delivery:'工作交付',collaboration:'协同沟通',leadership:'团队管理'};return `生成${generatedSections.map(key=>sectionLabels[key]).join('、')}；${detail==='concise'?'简洁内容':'常规内容'}；${labels[focus]}`;}
  function sourceStandard(){return S.read().standards.find(item=>item.id===sourceId);}
  function userMessage(text){return `<article class="std-ai-thread-message user"><div class="std-ai-thread-bubble">${e(text)}</div></article>`;}
  function assistantMessage(text,component='',className=''){return `<article class="std-ai-thread-message assistant ${className}"><div class="std-ai-thread-message-body">${text?`<div class="std-ai-thread-copy">${text}</div>`:''}${component}</div></article>`;}
  function threadHeader(status){return `<header class="std-ai-thread-header"><div><strong>人才标准帮建</strong><span>${e(selectedPosition()?.name||'未指定岗位')}</span></div><span class="std-ai-thread-status">${status}</span></header>`;}
  function conversationLead(){return `${userMessage(originalRequest)}${assistantMessage(selectedPosition()?'我已结合岗位和你的描述整理了建模信息。':'我已根据你的描述整理了建模信息，岗位可在后续再关联。')}`;}
  function reviewFeedbackTurns(pending=false){return reviewFeedbackHistory.map((item,index)=>`${userMessage(item)}${pending&&index===reviewFeedbackHistory.length-1?'':assistantMessage('已更新建模信息，请再次确认。')}`).join('');}
  function focusHeading(){messages.querySelector('[data-ai-stage-heading]')?.focus({preventScroll:true});}
  function thinkingMarkup(){
    const title=thinkingTarget==='review'?'正在整理建模信息…':'正在生成人才标准…';
    const latestFeedback=thinkingTarget==='scope'&&feedbackHistory.length?userMessage(feedbackHistory[feedbackHistory.length-1]):'';
    const before=thinkingTarget==='review'?(reviewFeedbackHistory.length?`${conversationLead()}${reviewFeedbackTurns(true)}`:userMessage(originalRequest)):`${conversationLead()}${reviewFeedbackTurns()}${userMessage(generationConfirmation())}${latestFeedback}`;
    const state=`<div class="std-ai-generation-state" role="status" aria-live="polite" aria-busy="true"><span class="std-ai-generation-dots" aria-hidden="true"><i></i><i></i><i></i></span><strong>${title}</strong></div>`;
    return flowLayout(`${threadHeader(thinkingTarget==='review'?'整理信息中':'生成标准中')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${before}${assistantMessage('',state,'working')}</div></div>`);
  }
  function startThinking(target){
    clearTimeout(generationTimer);thinkingTarget=target;setStage('thinking');messages.innerHTML=thinkingMarkup();
    generationTimer=setTimeout(()=>{if(thinkingTarget==='scope'){if(!result)result=build();scopeFeedback='';if(!scope)scope=selectedPosition()?'position':'none';renderScope();}else renderReview();},target==='review'?900:1200);
  }
  function reviewSummary(){
    const position=selectedPosition();
    const select=(id,label,value,options)=>`<label class="std-ai-review-field"><span>${label}</span><select id="${id}">${options.map(v=>`<option ${v===value?'selected':''}>${e(v)}</option>`).join('')}</select></label>`;
    return `<div class="std-ai-review-summary"><div class="std-ai-review-fields"><label class="std-ai-review-field full"><span>本次操作</span><select id="std-ai-source"><option value="">新建人才标准</option>${S.read().standards.map(item=>`<option value="${e(item.id)}" ${item.id===sourceId?'selected':''}>更新：${e(item.name)}</option>`).join('')}</select></label><div class="std-ai-review-field"><span>目标岗位</span><strong>${e(position?.name||'未指定')}</strong></div>${select('std-ai-level','岗位层级',brief.level,['未指定','基层/初级','中层/中级','高层/高级'])}${select('std-ai-management','管理范围',brief.management,['未指定','不带团队','带团队'])}<div class="std-ai-review-field full"><span>业务场景</span><p>${e(brief.scenario)}</p></div>${uploadedFile?`<div class="std-ai-review-field full"><span>参考资料</span><p>${e(uploadedFile)}</p></div>`:''}</div><fieldset class="std-ai-dimension-picker"><legend>本次生成内容</legend><div>${T.enabled().map(key=>`<label><input type="checkbox" value="${key}" data-ai-dimension ${generatedSections.includes(key)?'checked':''}><span>${sectionLabels[key]}</span></label>`).join('')}</div></fieldset></div>`;
  }
  function reviewDecision(){return `<footer class="std-ai-confirm-dock"><div class="std-ai-confirm-card"><label class="sr-only" for="std-ai-review-feedback">补充建模信息</label><textarea id="std-ai-review-feedback" rows="1" maxlength="1200" data-ai-review-feedback placeholder="补充业务场景，或直接确认以上选择"></textarea><p class="std-ai-flow-error" data-ai-review-error aria-live="polite"></p><div class="std-ai-confirm-footer"><span data-ai-dimension-count>已选择 ${generatedSections.length} 类内容</span><button type="button" class="std-ai-flow-primary" data-ai-review-submit>确认，继续</button></div></div></footer>`;}
  function outlineMarkup(){
    const options=(name,items,current)=>items.map(([value,label])=>`<label class="std-ai-outline-option"><input type="radio" name="${name}" value="${value}" ${value===current?'checked':''}><span>${label}</span></label>`).join('');
    return `<div class="std-ai-outline-options"><fieldset><legend>内容详略</legend>${options('ai-detail',[['concise','简洁 · 聚焦关键要求'],['regular','常规 · 保留更多要求']],detail)}</fieldset><fieldset><legend>优先呈现</legend>${options('ai-focus',[['balanced','均衡呈现'],['delivery','工作交付'],['collaboration','协同沟通'],['leadership','团队管理']],focus)}</fieldset></div>`;
  }
  function renderOutline(){
    setStage('outline');
    const selected=generatedSections.map(key=>sectionLabels[key]).join('、');
    messages.innerHTML=flowLayout(`${threadHeader('确认内容侧重')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${userMessage('生成'+selected)}${assistantMessage('已记下你的选择。可以调整内容详略与侧重，也可以直接生成。',`<div class="std-ai-thread-component"><header><strong tabindex="-1" data-ai-stage-heading>确认内容侧重</strong></header>${outlineMarkup()}</div>`)}</div></div>`,`<footer class="std-ai-confirm-dock"><div class="std-ai-confirm-card"><label class="sr-only" for="std-ai-outline-feedback">补充内容侧重</label><textarea id="std-ai-outline-feedback" maxlength="1200" placeholder="补充具体业务场景（选填）"></textarea><div class="std-ai-confirm-footer"><button class="btn-text" type="button" data-ai-edit-brief>返回调整维度</button><button class="std-ai-flow-primary" type="button" data-ai-generate>生成草稿</button></div></div></footer>`);
  }
  function renderReview(){
    const pendingInput=prompt.value;
    setStage('review');
    const component=`<div class="std-ai-thread-component"><header><strong id="std-ai-review-title" tabindex="-1" data-ai-stage-heading>确认建模信息</strong><span class="std-ai-component-state">待确认</span></header>${reviewSummary()}</div>`;
    messages.innerHTML=flowLayout(`${threadHeader('信息待确认')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${assistantMessage('',component)}</div></div>`,reviewDecision());focusHeading();
    if(pendingInput){messages.querySelector('[data-ai-review-feedback]').value=pendingInput;prompt.value='';}
    const threadScroll=messages.querySelector('.std-ai-thread-scroll');threadScroll.scrollTop=threadScroll.scrollHeight;
  }
  function previewMarkup(){
    const content=result.content;
    const rows=generatedSections.map(key=>`<details class="std-ai-draft-section" open><summary><span>${sectionLabels[key]}</span><span>${content[key].length} 项</span></summary><ul>${content[key].map(item=>`<li>${key==='duty'?`<strong>${e(item.n)}</strong><ul>${item.t.map(t=>`<li>${e(t)}</li>`).join('')}</ul>`:key==='cap'?`${e(item[0])}<span class="std-ai-level-value">${e(item[1])}</span>`:e(item)}</li>`).join('')||'<li>暂无内容</li>'}</ul><button class="btn-text" type="button" data-ai-section-edit="${key}">编辑${sectionLabels[key]}</button></details>`).join('');
    return `<div class="std-ai-artifact-scroll"><div class="std-ai-preview-title"><strong>${e(sourceStandard()?.name||result.name)}</strong></div>${rows}</div>`;
  }
  function editDraftSection(key){
    const c=result.content;
    const value=key==='duty'?c[key].map(item=>[item.n,...item.t.map(t=>'  '+t)].join('\n')).join('\n\n'):key==='cap'?c[key].map(item=>item.join(' | ')).join('\n'):c[key].join('\n');
    const format=key==='duty'?'每组第一行为职责，其后每行一个任务；组间空一行。':key==='cap'?'每行一项能力，格式：能力名称 | L1–L5。':'每行一项要求。';
    UI.openDialog({title:'编辑'+sectionLabels[key],body:`<p>${format}</p><label class="sr-only" for="ai-section-content">${sectionLabels[key]}</label><textarea class="input std-ai-edit-content" id="ai-section-content" rows="10">${e(value)}</textarea>`,confirmLabel:'更新草稿',onConfirm(d){
      const text=d.querySelector('textarea').value.trim();
      if(key==='duty')c[key]=text?text.split(/\n\s*\n/).map(block=>{const [n,...t]=block.split('\n').map(line=>line.trim()).filter(Boolean);return {n,t};}):[];
      else if(key==='cap'){
        const values=text?text.split('\n').filter(line=>line.trim()).map(line=>line.split(/\s*[|｜]\s*/).map(v=>v.trim())):[];
        if(values.some(item=>item.length!==2||!item[0]||!/^L[1-5]$/.test(item[1]))){d.showError('每行请填写能力名称 | L1–L5');return false;}
        if(values.length>20){d.showError('最多保留 20 项能力');return false;}
        if(new Set(values.map(item=>item[0])).size!==values.length){d.showError('能力名称不能重复');return false;}
        c[key]=values;
      }else c[key]=text?text.split('\n').map(line=>line.trim()).filter(Boolean):[];
      feedbackHistory.push('编辑'+sectionLabels[key]);feedbackResponses.push(`已更新${sectionLabels[key]}，当前 ${c[key].length} 项。`);renderScope();
    }});
  }
  function scopeCard(){
    const position=selectedPosition(),samePositions=position?S.positions.filter(item=>item.category===position.category):[];
    const option=(value,title,description)=>`<label class="std-ai-flow-choice"><input type="radio" name="std-ai-scope" value="${value}" ${scope===value?'checked':''} data-ai-scope="${value}"><span><strong>${title}${value==='position'?'<em>推荐</em>':''}</strong><small>${e(description)}</small></span></label>`;
    const existing=sourceStandard();
    const choices=existing?option('original','保留原应用范围',S.applicableObjectLabel(S.read(),existing)):position?`${option('position','仅当前岗位',position.name)}${option('category','同类岗位',`${position.category}类 · ${samePositions.length} 个岗位`)}${option('none','暂不关联','先完善标准内容，稍后设置')}`:option('none','暂不关联岗位','可先确认标准内容，进入新建页后再设置');
    return `<footer class="std-ai-confirm-dock"><div class="std-ai-elicitation"><header><strong>请选择标准应用范围</strong></header><fieldset><legend class="sr-only">应用范围</legend>${choices}</fieldset><label class="sr-only" for="std-ai-followup">输入需要调整的内容</label><textarea id="std-ai-followup" rows="1" maxlength="1200" placeholder="有问题或者需要调整的，可以直接告诉我"></textarea><p class="std-ai-thread-input-error" data-ai-followup-error aria-live="polite"></p><div class="std-ai-elicitation-footer"><p class="std-ai-flow-scope-context" data-ai-scope-context aria-live="polite"></p><button type="button" class="std-ai-flow-primary" data-ai-confirm-scope>确 认</button></div></div></footer>`;
  }
  function scopeFooter(){return `<footer class="std-ai-artifact-footer"><button type="button" class="std-ai-flow-secondary" data-ai-edit-brief>修改建模信息</button><button type="button" class="std-ai-flow-primary" data-ai-confirm-scope>${sourceId?'确认更新方式':'带入新建页'}</button></footer>`;}
  function updateScopeUI(){
    const position=selectedPosition();
    messages.querySelectorAll('[data-ai-scope]').forEach(input=>{input.checked=input.value===scope;});
    messages.querySelector('[data-ai-confirm-scope]').disabled=!scope;
    const scopeText=!scope?'请选择应用范围后继续。':scope==='original'&&sourceStandard()?'已选择：'+S.applicableObjectLabel(S.read(),sourceStandard()):scope==='category'&&position?`已选择：${S.positions.filter(item=>item.category===position.category).map(item=>item.name).join('、')}`:scope==='none'?'已选择：暂不关联岗位，稍后仍可设置。':position?`已选择：关联至${position.name}。`:'已选择：暂不关联岗位，稍后仍可设置。';
    messages.querySelector('[data-ai-scope-context]').textContent=scopeText;
    const artifactState=messages.querySelector('[data-ai-artifact-scope-state]'),artifactText=messages.querySelector('[data-ai-artifact-scope-text]');
    if(artifactState){artifactState.textContent=scope?'已选择':'待确认';artifactState.classList.toggle('is-done',!!scope);}
    if(artifactText)artifactText.textContent=scopeText.replace(/^已选择：/,'');
  }
  function renderScope(){
    const pendingInput=prompt.value;
    setStage('scope');
    const feedbackTurns=feedbackHistory.map((item,index)=>`${userMessage(item)}${assistantMessage(feedbackResponses[index]||'已更新草稿。')}`).join('');
    const summary=`草稿已整理为 ${generatedSections.length} 类、${generatedSections.reduce((n,key)=>n+result.content[key].length,0)} 项要求。请查看右侧全文，可以逐项编辑，或要求精简某一类内容。`;
    const thread=`<section class="std-ai-thread-pane">${threadHeader('草稿待确认')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${userMessage(generationConfirmation())}${feedbackTurns}${assistantMessage(summary)}</div></div>${scopeCard()}</section>`;
    const artifact=`<section class="std-ai-artifact-pane"><header class="std-ai-artifact-header"><strong tabindex="-1" data-ai-stage-heading>人才标准预览</strong><span>待确认</span></header>${previewMarkup()}${scopeFooter()}</section>`;
    messages.innerHTML=flowLayout(`<div class="std-ai-conversation-layout">${thread}${artifact}</div>`);updateScopeUI();focusHeading();
    if(pendingInput){messages.querySelector('#std-ai-followup').value=pendingInput;prompt.value='';}
    const threadScroll=messages.querySelector('.std-ai-thread-scroll');threadScroll.scrollTop=threadScroll.scrollHeight;
  }
  function run(text){
    text=(text||prompt.value).trim();if(!composerEnabled())return;if(!text){showToast(stage==='welcome'?'请输入人才标准建模要求':'请输入具体的调整要求');prompt.focus();return;}
    if(stage==='welcome'){originalRequest=text;brief=inferBrief(text);scope=selectedPosition()?'position':'none';prompt.value='';send.disabled=true;startThinking('review');return;}
    if(/^(优化|调整|改一下|再改改)[一下。！! ]*$/.test(text)){showToast('请说明要调整的字段、模块或方向');prompt.focus();return;}
    if(thinkingTarget==='review'){
      const previousSections=[...generatedSections];applyReviewFeedback(text);
      if(!generatedSections.length){generatedSections=previousSections;showToast('至少保留一类生成内容');prompt.focus();return;}
      reviewFeedbackHistory.push(text);
    }else{
      feedbackHistory.push(text);scopeFeedback='';brief.scenario=`${brief.scenario}；${text}`;
    }
    prompt.value='';send.disabled=true;startThinking(thinkingTarget);
  }
  function applyReviewFeedback(value){
    if(/不指定岗位|不关联岗位|去掉岗位/.test(value))positionSelect.value='';else{const position=inferPosition(value);if(position)positionSelect.value=position.id;}
    if(/初级|基层/.test(value))brief.level='基层/初级';else if(/高级|资深|高层/.test(value))brief.level='高层/高级';else if(/中级|中层/.test(value))brief.level='中层/中级';
    if(/不带团队|个人贡献者/.test(value))brief.management='不带团队';else if(/带团队|团队管理|管理团队/.test(value))brief.management='带团队';
    const sectionPatterns={duty:/删除职责任务|不生成职责任务/,exp:/删除经历经验|不生成经历经验/,cap:/删除能力要求|不生成能力要求/,pow:/删除动力要求|不生成动力要求/,pot:/删除潜力要求|不生成潜力要求/};
    Object.entries(sectionPatterns).forEach(([key,pattern])=>{if(pattern.test(value))generatedSections=generatedSections.filter(item=>item!==key);});
    if(!/(初级|基层|中级|中层|高级|资深|高层|不带团队|个人贡献者|带团队|团队管理|管理团队|不指定岗位|不关联岗位|去掉岗位|删除|不生成)/.test(value))brief.scenario=`${brief.scenario}；${value}`;
    scope=sourceId?'original':selectedPosition()?'position':'none';
  }
  function submitFollowup(){
    if(stage!=='scope')return;
    const input=messages.querySelector('#std-ai-followup'),error=messages.querySelector('[data-ai-followup-error]'),value=input.value.trim();
    if(!value){error.textContent='请输入具体调整要求，或点击右侧编辑内容';return;}
    const key=Object.entries(sectionLabels).find(([key,label])=>value.includes(label)||value.includes(label.replace('要求','')))?.[0];
    const remove=/删除|去掉|移除/.test(value);
    const shorten=/精简|减少|简洁/.test(value);
    if(!key||(!remove&&!shorten)){error.textContent='请指定要精简或移除的内容；改写条目可直接点击右侧“编辑”';input.focus();return;}
    const before=result.content[key].length;
    if(remove){
      const matches=result.content[key].filter(item=>value.includes(key==='duty'?item.n:key==='cap'?item[0]:item));
      if(!matches.length){error.textContent='请写出要移除的具体条目名称';return;}
      result.content[key]=result.content[key].filter(item=>!matches.includes(item));
    }else result.content[key]=result.content[key].slice(0,Math.max(1,Math.ceil(before/2)));
    const after=result.content[key].length;
    if(before===after){error.textContent='当前已没有可继续精简的条目，可直接编辑内容';return;}
    feedbackHistory.push(value);feedbackResponses.push(`${sectionLabels[key]}已由 ${before} 项调整为 ${after} 项，其他内容保持原样。`);renderScope();
  }
  function submitReviewAdjustment(){
    if(stage!=='review')return;
    const input=messages.querySelector('[data-ai-review-feedback]'),value=input.value.trim(),error=messages.querySelector('[data-ai-review-error]');
    if(!value){error.textContent='请说明需要调整的内容';input.focus();return;}
    if(/^(优化|调整|改一下|再改改)[一下。！! ]*$/.test(value)){error.textContent='请说明要调整的字段或方向';input.focus();return;}
    const previousSections=[...generatedSections];applyReviewFeedback(value);
    if(!generatedSections.length){generatedSections=previousSections;error.textContent='至少保留一类生成内容';input.focus();return;}
    reviewFeedbackHistory.push(value);startThinking('review');
  }
  function submitReviewDecision(){
    if(stage!=='review')return;
    const input=messages.querySelector('[data-ai-review-feedback]');
    if(input?.value.trim()){submitReviewAdjustment();return;}
    confirmInfo();
  }
  function confirmInfo(){
    if(stage!=='review')return;
    if(!generatedSections.length){messages.querySelector('[data-ai-review-error]').textContent='请至少选择一类生成内容';return;}
    renderOutline();
  }
  function transferDraft(strategy){
    const existing=sourceStandard(),position=selectedPosition();
    if(existing){result.targetId=existing.id;result.updateStrategy=strategy;result.generatedSections=[...generatedSections];result.mode=existing.mode;result.positions=S.clone(existing.positions);result.groups=S.clone(existing.groups);}
    else if(scope==='none'||!position){result.mode='none';result.positions=[];}
    else{result.mode='positions';result.positions=scope==='category'?S.positions.filter(item=>item.category===position.category).map(item=>item.id):[position.id];}
    sessionStorage.setItem(pendingKey,JSON.stringify(result));location.href='standard-detail.html?ai=1'+(existing?'&id='+encodeURIComponent(existing.id):'');
  }
  function confirmScope(){
    if(stage!=='scope')return;
    const input=messages.querySelector('#std-ai-followup');
    if(input?.value.trim()){submitFollowup();return;}
    if(!scope){showToast('请选择应用范围');return;}
    const existing=sourceStandard();
    if(!existing){transferDraft();return;}
    const merged=T.mergeContent(existing.content,result.content,generatedSections,'merge');
    const impact=generatedSections.map(key=>`<tr><td>${sectionLabels[key]}</td><td>${existing.content[key].length}</td><td>${result.content[key].length}</td><td>${merged[key].length}</td></tr>`).join('');
    const conflicts=generatedSections.includes('cap')?result.content.cap.filter(item=>existing.content.cap.some(old=>old[0]===item[0]&&old[1]!==item[1])).map(item=>`${e(item[0])}：${e(existing.content.cap.find(old=>old[0]===item[0])[1])} → ${e(item[1])}`).join('；'):'';
    const dialog=UI.openDialog({title:'确认已有标准的更新方式',body:`<p>更新“${e(existing.name)}”。只处理本次生成的维度，其他维度与应用范围保留。</p><table class="t"><thead><tr><th>维度</th><th>原有条目</th><th>覆盖后</th><th>保留更新后</th></tr></thead><tbody>${impact}</tbody></table>${conflicts?`<p>同名能力等级更新：${conflicts}</p>`:''}<fieldset class="std-ai-update-options"><legend>更新方式</legend><label><input type="radio" name="ai-update" value="replace"><span><strong>直接覆盖</strong><p>用本次草稿替换上述维度的原有内容。</p></span></label><label><input type="radio" name="ai-update" value="merge"><span><strong>保留更新</strong><p>保留原有条目并补充新内容；同名职责合并任务，同名能力采用草稿等级。</p></span></label></fieldset>`,confirmLabel:'带入编辑页',onConfirm(d){
      const strategy=d.querySelector('input:checked')?.value;if(!strategy){d.showError('请选择更新方式');return false;}
      transferDraft(strategy);
    }});
  }
  prompt.addEventListener('input',()=>{send.disabled=!prompt.value.trim()||!composerEnabled();});
  prompt.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();run();}});send.disabled=true;send.onclick=()=>run();
  $('#std-ai-history-toggle').onclick=()=>{const open=!drawer.classList.contains('history-open');drawer.classList.toggle('history-open',open);$('#std-ai-history-toggle').setAttribute('aria-expanded',String(open));$('#std-ai-history-toggle').setAttribute('aria-label',open?'关闭边栏':'打开边栏');};
  $('#std-ai-new-chat').onclick=reset;drawer.querySelector('[data-ai-reset]').onclick=reset;drawer.querySelector('.std-ai-microphone').onclick=()=>showToast('语音输入暂未接入');
  files.addEventListener('change',()=>{uploadedFile=files.files[0]?.name||'';if(uploadedFile)showToast(`已添加资料：${uploadedFile}`);});
  messages.addEventListener('input',event=>{if(event.target.hasAttribute('data-ai-review-feedback'))messages.querySelector('[data-ai-review-error]').textContent='';if(event.target.id==='std-ai-followup')messages.querySelector('[data-ai-followup-error]').textContent='';});
  messages.addEventListener('change',event=>{const target=event.target;
    if(target.hasAttribute('data-ai-dimension')){generatedSections=[...messages.querySelectorAll('[data-ai-dimension]:checked')].map(input=>input.value);messages.querySelector('[data-ai-dimension-count]').textContent=`已选择 ${generatedSections.length} 类内容`;messages.querySelector('[data-ai-review-error]').textContent='';}
    if(target.id==='std-ai-level')brief.level=target.value;
    if(target.id==='std-ai-management')brief.management=target.value;
    if(target.id==='std-ai-source'){sourceId=target.value;scope=sourceId?'original':selectedPosition()?'position':'none';const source=sourceStandard();if(source?.positions.length===1)positionSelect.value=source.positions[0];}
    if(target.name==='ai-detail')detail=target.value;
    if(target.name==='ai-focus')focus=target.value;
    if(target.hasAttribute('data-ai-scope')){scope=target.value;scopeFeedback='';updateScopeUI();}});
  messages.addEventListener('keydown',event=>{if(event.target.id==='std-ai-outline-feedback'&&(event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();messages.querySelector('[data-ai-generate]').click();return;}if(event.target.hasAttribute('data-ai-review-feedback')&&(event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();submitReviewDecision();}if(event.target.id==='std-ai-followup'&&(event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();confirmScope();}});
  drawer.addEventListener('click',event=>{
    const item=event.target.closest('[data-ai-quick], [data-ai-history]');if(item){const text=item.dataset.aiQuick||item.dataset.aiHistory;prompt.value=text;send.disabled=false;if(item.dataset.aiQuick!==undefined)run(text);else{if(stage!=='welcome'){reset();prompt.value=text;send.disabled=false;}drawer.classList.remove('history-open');$('#std-ai-history-toggle').setAttribute('aria-expanded','false');prompt.focus();}return;}
    if(event.target.closest('[data-ai-attachment]')){files.click();return;}
    if(event.target.closest('[data-ai-edit-brief]')){renderReview();return;}
    if(event.target.closest('[data-ai-generate]')){const text=messages.querySelector('#std-ai-outline-feedback').value.trim();if(text){brief.scenario+='；'+text;reviewFeedbackHistory.push(text);}result=null;startThinking('scope');return;}
    if(event.target.closest('[data-ai-review-submit]')){submitReviewDecision();return;}
    const sectionEdit=event.target.closest('[data-ai-section-edit]');if(sectionEdit){editDraftSection(sectionEdit.dataset.aiSectionEdit);return;}
    if(event.target.closest('[data-ai-confirm-scope]')){confirmScope();return;}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)reset();});
})();
