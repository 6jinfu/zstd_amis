(function () {
  const root=document.querySelector('[data-standard-list]');
  if(!root)return;
  const S=window.Standards,$=selector=>document.querySelector(selector),e=UI.escape;
  const drawer=$('#std-ai-drawer'),chat=drawer.querySelector('.std-ai-chat'),messages=$('#std-ai-messages'),composer=drawer.querySelector('.std-ai-composer'),prompt=$('#std-ai-prompt'),promptLabel=drawer.querySelector('label[for="std-ai-prompt"]'),positionSelect=$('#std-ai-position'),send=$('#std-ai-send'),files=$('#std-ai-files');
  const pendingKey='talent-standard-ai-draft-v1';
  const productContent={duty:[{n:'负责产品规划与需求管理',t:['结合业务目标完成需求分析与优先级判断','输出清晰的产品方案并推动评审']},{n:'推动产品交付与持续优化',t:['协同研发、设计和运营推进版本落地','跟踪核心数据与用户反馈并持续迭代']}],exp:['本科及以上，产品、计算机或相关专业优先','2 年以上互联网或企业软件产品经验','具备从需求分析到产品交付的完整项目经验'],cap:[['需求分析','L3'],['产品规划','L3'],['数据分析','L3'],['跨部门沟通','L3'],['项目管理','L3'],['市场洞察','L3'],['客户导向','L3']],pow:['成就导向','协作共赢','创新探索'],pot:['学习敏锐','复杂决策','跨界整合']};
  const commonContent={duty:[{n:'围绕岗位目标完成专业工作交付',t:['理解任务目标并制定执行计划','按质量和时间要求完成工作成果']},{n:'参与团队协作与持续改进',t:['主动同步进展、问题和风险','沉淀经验并参与知识共享']}],exp:['具备与岗位相关的专业学习或实践经历','能够独立承担职责范围内的工作任务'],cap:[['目标执行','L3'],['问题解决','L3'],['跨部门沟通','L3'],['持续学习','L3'],['协同推进','L3'],['专业知识整合','L3'],['自我认知','L2']],pow:['成就导向','协作共赢'],pot:['学习敏锐','坚韧抗压']};
  const T=window.TalentSettings,defaultSections=Object.keys(T.dimensions),sectionLabels=T.dimensions;
  let confirmedBrief=null;
  let sourceId='',detail='concise',focus='balanced',feedbackResponses=[];
  let stage='welcome',result=null,originalRequest='',brief=null,uploadedFile='',generationTimer=0,thinkingTarget='review',generatedSections=T.enabled(),scope='position',scopeFeedback='',feedbackHistory=[],reviewFeedbackHistory=[];

  let priorityItems=[],rankedCapabilities=[],capabilityScores=Object.create(null),comparisonConfirmed=false,priorityPhase='',priorityStep=0,draggedCapability=null;

  positionSelect.innerHTML='<option value="">请选择岗位</option>'+S.positions.map(item=>`<option value="${e(item.id)}">${e(item.name)}</option>`).join('');
  function welcomeMarkup(){return '<div class="std-ai-welcome" id="std-ai-welcome"><h4>你好！我是AI帮建助手～</h4><div class="std-ai-quick"><button type="button" data-ai-quick="企业培训平台的初级销售经理建模">企业培训平台的初级销售经理建模</button><button type="button" data-ai-quick="个人贡献者能力建模">个人贡献者能力建模</button><button type="button" data-ai-quick="入职三年的产品经理的能力建模">入职三年的产品经理的能力建模</button></div></div>';}
  function composerEnabled(){return stage==='welcome'||(stage==='thinking'&&thinkingTarget!=='rank');}
  function setStage(next){
    stage=next;chat.classList.toggle('conversation-mode',next!=='welcome');chat.classList.toggle('thinking-mode',next==='thinking'&&thinkingTarget!=='rank');chat.classList.toggle('preview-mode',next==='scope');drawer.classList.toggle('flow-active',next!=='welcome');positionSelect.disabled=next!=='welcome';
    const hidden=['review','outline','scope','rank','compare','priority-thinking'].includes(next)||(next==='thinking'&&thinkingTarget==='rank'),promptText=next==='welcome'?'请描述建模的岗位要求':'有问题或者需要调整的，可以直接告诉我';composer.setAttribute('aria-hidden',String(hidden));prompt.placeholder=promptText;promptLabel.textContent=promptText;send.disabled=hidden||!prompt.value.trim();
  }
  function reset(){clearTimeout(generationTimer);resetPriority();confirmedBrief=null;result=null;originalRequest='';brief=null;uploadedFile='';files.value='';thinkingTarget='review';generatedSections=T.enabled();sourceId='';detail='concise';focus='balanced';feedbackResponses=[];scope='position';scopeFeedback='';feedbackHistory=[];reviewFeedbackHistory=[];setStage('welcome');positionSelect.value='';prompt.value='';send.disabled=true;messages.innerHTML=welcomeMarkup();prompt.focus();}
  function selectedPosition(){return S.positions.find(item=>item.id===positionSelect.value);}
  function inferPosition(text){return S.positions.find(item=>text.includes(item.name));}
  function inferBrief(text){
    const inferred=!positionSelect.value&&inferPosition(text);if(inferred)positionSelect.value=inferred.id;
    const position=selectedPosition(),scenario=text.replace(/的?(能力)?建模/g,'').trim()||(position?`${position.name}岗位建模`:'通用人才标准建模');
    return {scenario,level:/初级|基层/.test(text)?'基层/初级':/高级|资深|高层/.test(text)?'高层/高级':/中级|中层/.test(text)?'中层/中级':'未指定',management:/个人贡献者|不带团队/.test(text)?'不带团队':/带团队|团队管理/.test(text)?'带团队':'未指定'};
  }
  function interpretBrief(text,additions=[],positionName=''){
    const understood={context:[],actions:[],outcomes:[]};
    const resultCue=/^(?:希望|期望|预期|最终|从而|以便|目标(?:是|为|改为|调整为|：|:))/;
    const actionCue=/^(?:(?:主要|日常|重点|核心)?(?:负责|承担|职责|工作包括)|需要(?:能够|负责)?|通过)/;
    const replacements={context:/^(?:背景|场景|情境|情景|业务背景)(?:改为|调整为|换成)/,actions:/^(?:主要职责|职责|行动|工作重点)(?:改为|调整为|换成)/,outcomes:/^(?:目标|预期|结果)(?:改为|调整为|换成)/};
    const clean=value=>value.replace(/^[：:、\s]+|[。；;\s]+$/g,'').trim();
    [text,...additions].forEach(entry=>{
      const reset=new Set();
      String(entry).replace(/(?=主要负责|工作包括|需要|能够|希望|期望|目标是|目标改为|最终|从而|以便)/g,(match,offset,source)=>offset&&source[offset-1]!=='不'?'；':'').split(/[。；;！？!?\n，,]+/).forEach(raw=>{
        let clause=clean(raw.replace(/^(?:补充|另外|还有)[：:]?\s*/,''));if(!clause)return;
        let key=Object.keys(replacements).find(name=>replacements[name].test(clause)),value=clause;
        if(key){if(!reset.has(key)){understood[key]=[];reset.add(key);}value=clean(clause.replace(replacements[key],''));}
        else if(/^(?:情景|情境|场景|背景)(?:是|为|：|:)/.test(clause)){key='context';value=clean(clause.replace(/^(?:情景|情境|场景|背景)(?:是|为|：|:)/,''));}
        else if(/^(?:动作|行动|职责)(?:是|为|包括|：|:)/.test(clause)){key='actions';value=clean(clause.replace(/^(?:动作|行动|职责)(?:是|为|包括|：|:)/,''));}
        else if(/^(?:预期结果|结果|成果)(?:是|为|：|:)/.test(clause)){key='outcomes';value=clean(clause.replace(/^(?:预期结果|结果|成果)(?:是|为|：|:)/,''));}
        else if(/^(?:不再|不需要|无需|不要|不负责|不承担)/.test(clause))key='actions';
        else if(/^(?:能够|能独立|独立完成)/.test(clause))key='actions';
        else if(resultCue.test(clause)){key='outcomes';value=clean(clause.replace(/^(?:希望|期望|预期|最终|从而|以便)(?:能够|可以|能)?|^目标(?:是|为|：|:)/,''));}
        else if(actionCue.test(clause)){key='actions';value=clean(clause.replace(actionCue,''));}
        else if(/^(?:提高|提升|降低|减少|缩短|达成|实现|确保|交付可)/.test(clause))key='outcomes';
        else if(/^(?:拓展|开发|跟进|协调|推进|分析|设计|组织|制定|解决|识别|建立|维护|完成|管理|协同)/.test(clause))key='actions';
        else{key='context';value=clean(clause.replace(/^(?:请)?(?:帮我|我们想|我想)?(?:为|给)?/,'').replace(/^(?:我们是|公司是|业务是|背景是|场景是)[：:]?/,'').replace(/(?:的)?(?:能力建模|建模|(?:建立|生成|制定|创建|设计|建)(?:一套|一份|一个)?(?:人才|岗位|能力)?标准)$/,''));}
        if(value&&!/^(?:初级|中级|高级|基层|中层|高层|不带团队|带团队|管理团队|不指定岗位|不关联岗位|去掉岗位|请|帮我|建立人才标准|生成人才标准)$/.test(value)&&!/(?:删除|不生成)(?:职责任务|经历经验|能力要求|动力要求|潜力要求)/.test(value)&&!understood[key].includes(value))understood[key].push(value);
      });
    });
    if(!understood.context.length&&positionName)understood.context.push(positionName);
    return understood;
  }
  function understandingMarkup(understood){
    const icons=['<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5V3m8 2V3M4 10h16"/>','<path d="m5 12 4 4L19 6M5 5h4M5 20h14"/>','<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 6-6"/>'];
    const rows=[['context','这套标准面向','还可以补充岗位所在的业务、团队或实际工作环境。'],['actions','重点需要做到','还可以补充日常要承担的工作，或最需要解决的问题。'],['outcomes','最终希望看到','还可以补充希望达成的变化、交付成果或衡量目标。']];
    return `<ol class="std-ai-understanding" aria-label="建模需求理解">${rows.map(([key,lead,empty],index)=>`<li class="${understood[key].length?'has-content':'needs-detail'}"><span class="std-ai-understanding-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[index]}</svg></span><p>${understood[key].length?`${lead}<strong>${e(understood[key].join('；'))}</strong>。`:empty}</p></li>`).join('')}</ol>`;
  }
  function syncBriefScenario(){
    const understood=interpretBrief(originalRequest,reviewFeedbackHistory,selectedPosition()?.name);
    const text=[...understood.context,...understood.actions.map(value=>'需要'+value),...understood.outcomes.map(value=>'期望'+value)].join('；');
    if(text)brief.scenario=text;
    return understood;
  }
  function build(){
    const position=selectedPosition(),seeds=Object.values(window.STANDARD_POSITION_SEEDS||{}),context=`${position?.name||''} ${brief.scenario}`;let seed=position?seeds.find(item=>item.code===position.id):null;
    if(!seed&&position?.category==='销售')seed=window.STANDARD_POSITION_SEEDS?.sales;if(!seed&&/算法/.test(position?.name||''))seed=window.STANDARD_POSITION_SEEDS?.algorithm;
    const source=sourceStandard(),fallback=seed?seed.standard:/产品/.test(context)?productContent:commonContent;
    const content=source?S.clone(source.content):S.clone(fallback);
    if(!source&&seed)seed.abilityOptions.forEach(item=>{if(!content.cap.some(([name])=>name===item[0]))content.cap.push(S.clone(item));});
    defaultSections.forEach(key=>{if(!content[key].length&&generatedSections.includes(key))content[key]=S.clone(fallback[key]);});
    const categoryMap={研发:'研发序列',销售:'销售序列',职能:'通用标准'};let category=categoryMap[position?.category]||'通用标准';
    if(!S.read().categories.includes(category))category='通用标准';if(brief.management==='带团队'&&generatedSections.includes('cap')&&!content.cap.some(item=>item[0]==='团队管理'))content.cap.push(['团队管理','L3']);
    const feedback=feedbackHistory.join(' ');
    if(/重点客户|大客户|客户经营/.test(feedback)&&content.duty[0])content.duty[0].n='负责销售目标达成与重点客户经营';
    if(/精简|减少/.test(feedback)){content.exp=content.exp.slice(0,2);content.pow=content.pow.slice(0,2);content.pot=content.pot.slice(0,2);}
    if(/团队|辅导/.test(feedback)&&generatedSections.includes('cap')&&!content.cap.some(item=>item[0]==='团队管理'))content.cap.push(['团队管理','L3']);
    const limit=detail==='concise'?{duty:2,exp:2,cap:5,pow:2,pot:2}:{duty:3,exp:3,cap:7,pow:3,pot:3};
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
  function reviewFeedbackTurns(pending=false){
    const history=reviewFeedbackHistory.map((item,index)=>`${userMessage(item)}${pending&&index===reviewFeedbackHistory.length-1?'':assistantMessage('已结合你的补充更新理解，请看看是否准确。')}`).join('');
    const showConfirmed=confirmedBrief&&stage!=='review'&&!(stage==='thinking'&&thinkingTarget==='review');
    return history+(showConfirmed?assistantMessage('',`<details class="std-ai-understanding-record"><summary>已确认的建模理解</summary>${understandingMarkup(confirmedBrief)}</details>`):'');
  }
  function focusHeading(){messages.querySelector('[data-ai-stage-heading]')?.focus({preventScroll:true});}
  function thinkingMarkup(){
    const title=thinkingTarget==='review'?'正在整理建模信息…':thinkingTarget==='rank'?'正在整理能力候选…':'正在生成人才标准…';
    const latestFeedback=thinkingTarget==='scope'&&feedbackHistory.length?userMessage(feedbackHistory[feedbackHistory.length-1]):'';
    const before=thinkingTarget==='review'?(reviewFeedbackHistory.length?`${conversationLead()}${reviewFeedbackTurns(true)}`:userMessage(originalRequest)):`${conversationLead()}${reviewFeedbackTurns()}${userMessage(generationConfirmation())}${latestFeedback}`;
    const state=`<div class="std-ai-generation-state" role="status" aria-live="polite" aria-busy="true"><span class="std-ai-generation-dots" aria-hidden="true"><i></i><i></i><i></i></span><strong>${title}</strong></div>`;
    return flowLayout(`${threadHeader(thinkingTarget==='review'?'整理信息中':thinkingTarget==='rank'?'整理能力中':'生成标准中')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${before}${assistantMessage('',state,'working')}</div></div>`);
  }
  function startThinking(target){
    clearTimeout(generationTimer);thinkingTarget=target;setStage('thinking');messages.innerHTML=thinkingMarkup();
    generationTimer=setTimeout(()=>{if(thinkingTarget==='rank'){result=build();priorityItems=S.clone(result.content.cap);if(priorityItems.length)renderPriority('rank');else renderScope();}else if(thinkingTarget==='scope'){if(!result)result=build();scopeFeedback='';if(!scope)scope=selectedPosition()?'position':'none';renderScope();}else renderReview();},target==='review'?900:1200);
  }
  function reviewSummary(){
    const position=selectedPosition();
    const select=(id,label,value,options)=>`<label class="std-ai-review-field"><span>${label}</span><select id="${id}">${options.map(v=>`<option ${v===value?'selected':''}>${e(v)}</option>`).join('')}</select></label>`;
    return `<div class="std-ai-review-summary">${understandingMarkup(interpretBrief(originalRequest,reviewFeedbackHistory,position?.name))}<details class="std-ai-review-options"><summary>生成设置</summary><div class="std-ai-review-fields"><label class="std-ai-review-field full"><span>本次操作</span><select id="std-ai-source"><option value="">新建人才标准</option>${S.read().standards.map(item=>`<option value="${e(item.id)}" ${item.id===sourceId?'selected':''}>更新：${e(item.name)}</option>`).join('')}</select></label><div class="std-ai-review-field"><span>目标岗位</span><strong>${e(position?.name||'未指定')}</strong></div>${select('std-ai-level','岗位层级',brief.level,['未指定','基层/初级','中层/中级','高层/高级'])}${select('std-ai-management','管理范围',brief.management,['未指定','不带团队','带团队'])}<div class="std-ai-review-field full"><span>业务场景</span><p>${e(brief.scenario)}</p></div>${uploadedFile?`<div class="std-ai-review-field full"><span>参考资料</span><p>${e(uploadedFile)}</p></div>`:''}</div><fieldset class="std-ai-dimension-picker"><legend>本次生成内容</legend><div>${T.enabled().map(key=>`<label><input type="checkbox" value="${key}" data-ai-dimension ${generatedSections.includes(key)?'checked':''}><span>${sectionLabels[key]}</span></label>`).join('')}</div></fieldset></details></div>`;
  }
  function reviewDecision(){return `<footer class="std-ai-confirm-dock"><div class="std-ai-confirm-card"><label class="sr-only" for="std-ai-review-feedback">补充建模信息</label><textarea id="std-ai-review-feedback" rows="1" maxlength="1200" data-ai-review-feedback placeholder="可以继续补充实际工作、需要做的事，或希望达成的变化"></textarea><p class="std-ai-flow-error" data-ai-review-error aria-live="polite"></p><div class="std-ai-confirm-footer"><span data-ai-dimension-count>已选择 ${generatedSections.length} 类内容</span><button type="button" class="std-ai-flow-primary" data-ai-review-submit>确认，继续</button></div></div></footer>`;}
  function outlineMarkup(){
    const options=(name,items,current)=>items.map(([value,label])=>`<label class="std-ai-outline-option"><input type="radio" name="${name}" value="${value}" ${value===current?'checked':''}><span>${label}</span></label>`).join('');
    return `<div class="std-ai-outline-options"><fieldset><legend>内容详略</legend>${options('ai-detail',[['concise','简洁 · 聚焦关键要求'],['regular','常规 · 保留更多要求']],detail)}</fieldset><fieldset><legend>优先呈现</legend>${options('ai-focus',[['balanced','均衡呈现'],['delivery','工作交付'],['collaboration','协同沟通'],['leadership','团队管理']],focus)}</fieldset></div>`;
  }
  function renderOutline(){
    setStage('outline');
    const selected=generatedSections.map(key=>sectionLabels[key]).join('、');
    messages.innerHTML=flowLayout(`${threadHeader('确认内容侧重')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${userMessage('生成'+selected)}${assistantMessage(generatedSections.includes('cap')?'已记下你的选择。可以调整内容详略与侧重，确认后继续整理能力优先级。':'已记下你的选择。可以调整内容详略与侧重，确认后生成草稿。',`<div class="std-ai-thread-component"><header><strong tabindex="-1" data-ai-stage-heading>确认内容侧重</strong></header>${outlineMarkup()}</div>`)}</div></div>`,`<footer class="std-ai-confirm-dock"><div class="std-ai-confirm-card"><label class="sr-only" for="std-ai-outline-feedback">补充内容侧重</label><textarea id="std-ai-outline-feedback" maxlength="1200" placeholder="补充具体业务场景（选填）"></textarea><div class="std-ai-confirm-footer"><button class="btn-text" type="button" data-ai-edit-brief>返回调整维度</button><button class="std-ai-flow-primary" type="button" data-ai-generate>继续</button></div></div></footer>`);
  }
  function renderReview(){
    const pendingInput=prompt.value;
    setStage('review');
    const component=`<div class="std-ai-thread-component"><header><strong id="std-ai-review-title" tabindex="-1" data-ai-stage-heading>对这次建模的理解</strong><span class="std-ai-component-state">可继续补充</span></header>${reviewSummary()}</div>`;
    messages.innerHTML=flowLayout(`${threadHeader('信息待确认')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${assistantMessage('',component)}</div></div>`,reviewDecision());focusHeading();
    if(pendingInput){messages.querySelector('[data-ai-review-feedback]').value=pendingInput;messages.querySelector('[data-ai-review-submit]').textContent='更新理解';prompt.value='';}
    messages.querySelector('[data-ai-stage-heading]').scrollIntoView({block:'start',behavior:'instant'});
  }
  function resetPriority(){priorityItems=[];rankedCapabilities=[];capabilityScores=Object.create(null);comparisonConfirmed=false;priorityPhase='';priorityStep=0;draggedCapability=null;}
  function sortCapabilitiesByScore(items,scores){
    return items.map((item,index)=>({item,index})).sort((a,b)=>scores[b.item[0]]-scores[a.item[0]]||a.index-b.index).map(entry=>entry.item);
  }
  function priorityAnalysis(phase){
    if(phase==='rank')return [`已记录 ${rankedCapabilities.length} 项能力的优先顺序。`,`“${rankedCapabilities[0][0]}”排在首位，将作为同分时的排序依据。`,'接下来逐项比较岗位重要性；能力要求等级保持不变。'];
    const sorted=sortCapabilitiesByScore(rankedCapabilities,capabilityScores),ties=new Set(Object.values(capabilityScores)).size<rankedCapabilities.length;
    return [`已收齐 ${rankedCapabilities.length} 项能力评分，按重要性从高到低重新排序。`,`“${sorted[0][0]}”以 ${capabilityScores[sorted[0][0]]} 分排在首位。${ties?'同分项沿用“排一排”的先后顺序。':'各项评分无并列。'}`,'最终顺序将写入能力要求，原有 L1–L5 等级和其他标准内容保持不变。'];
  }
  function prioritySummary(phase){
    const finalOrder=phase==='compare'?`<ol class="std-ai-priority-snapshot" aria-label="最终能力排序">${sortCapabilitiesByScore(rankedCapabilities,capabilityScores).map(([name])=>`<li><span>${e(name)}</span><b>${capabilityScores[name]} 分</b></li>`).join('')}</ol>`:'';
    return `<details class="std-ai-priority-summary" ${phase==='compare'?'open':''}><summary>${phase==='rank'?'排序分析摘要':'评分分析摘要 · 最终排序'}</summary><ul>${priorityAnalysis(phase).map(text=>`<li>${e(text)}</li>`).join('')}</ul>${finalOrder}</details>`;
  }
  function priorityHistory(){
    if(!rankedCapabilities.length)return '';
    const snapshot=(title,items,scored)=>`<div class="std-ai-thread-component std-ai-priority-card"><header><strong>${title}</strong><span class="std-ai-component-state">已确认</span></header><ol class="std-ai-priority-snapshot">${items.map(([name])=>`<li><span>${e(name)}</span>${scored?`<b>${capabilityScores[name]} 分</b>`:''}</li>`).join('')}</ol></div>`;
    let history=assistantMessage('',snapshot('排一排 · 能力优先级',rankedCapabilities,false))+userMessage('确认能力排序');
    if(stage!=='priority-thinking'||priorityPhase!=='rank')history+=assistantMessage('',prioritySummary('rank'));
    if(comparisonConfirmed){history+=assistantMessage('',snapshot('比一比 · 岗位重要性评分',rankedCapabilities,true))+userMessage('确认评分，生成标准');if(stage!=='priority-thinking')history+=assistantMessage('',prioritySummary('compare'));}
    return history;
  }
  function priorityCard(kind){
    const ranking=kind==='rank',title=ranking?'排一排 · 能力优先级':'比一比 · 岗位重要性评分';
    const rows=priorityItems.map(([name,level],index)=>ranking?`<li class="std-ai-priority-row" data-ai-priority-item="${e(name)}"><button type="button" class="std-ai-drag-handle" data-ai-drag="${e(name)}" aria-label="拖动${e(name)}，也可用上下方向键排序"><svg viewBox="0 0 16 20" aria-hidden="true" fill="currentColor"><circle cx="5" cy="5" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="5" cy="10" r="1.5"/><circle cx="11" cy="10" r="1.5"/><circle cx="5" cy="15" r="1.5"/><circle cx="11" cy="15" r="1.5"/></svg></button><span class="std-ai-priority-index">${index+1}</span><span class="std-ai-priority-name">${e(name)}</span><span class="std-ai-priority-level">${e(level)}</span><span class="std-ai-priority-moves"><button type="button" data-ai-move="-1" aria-label="上移${e(name)}" ${index===0?'disabled':''}>↑</button><button type="button" data-ai-move="1" aria-label="下移${e(name)}" ${index===priorityItems.length-1?'disabled':''}>↓</button></span></li>`:`<fieldset class="std-ai-score-row"><legend>${e(name)}</legend><div class="std-ai-score-options">${[1,2,3,4,5].map(score=>`<label><input type="radio" name="cap-score-${index}" value="${score}" data-ai-score="${e(name)}" ${capabilityScores[name]===score?'checked':''}><span>${score}</span></label>`).join('')}</div></fieldset>`).join('');
    return `<div class="std-ai-thread-component std-ai-priority-card"><header><strong tabindex="-1" data-ai-stage-heading>${title}</strong><span class="std-ai-component-state">${ranking?'待排序':'待评分'}</span></header><div class="std-ai-priority-body"><p>${ranking?'拖动能力项，越靠上优先级越高。也可点击上下箭头调整。':'按岗位重要性逐项打分：1 分较低，5 分最重要。分数用于排序，不改变要求等级。'}</p>${ranking?`<ol class="std-ai-priority-canvas" aria-label="能力排序画布">${rows}</ol>`:`<div class="std-ai-score-canvas">${rows}</div>`}<p class="std-ai-priority-feedback" data-ai-priority-feedback aria-live="polite">${ranking?'':`已评分 ${Object.keys(capabilityScores).length} / ${priorityItems.length} 项`}</p><p class="std-ai-flow-error" data-ai-priority-error role="alert"></p><div class="std-ai-priority-actions"><button type="button" class="std-ai-flow-primary" data-ai-priority-confirm>${ranking?'确定排序':'确定评分'}</button></div></div></div>`;
  }
  function renderPriority(kind){
    setStage(kind);
    messages.innerHTML=flowLayout(`${threadHeader(kind==='rank'?'能力排序':'能力评分')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${userMessage(generationConfirmation())}${priorityHistory()}${assistantMessage('',priorityCard(kind))}</div></div>`);
    focusHeading();messages.querySelector('[data-ai-stage-heading]').scrollIntoView({block:'start',behavior:'instant'});
  }
  function moveCapability(name,to){
    if(stage!=='rank')return;
    const from=priorityItems.findIndex(item=>item[0]===name);if(from<0||to<0||to>=priorityItems.length||from===to)return;
    priorityItems.splice(to,0,priorityItems.splice(from,1)[0]);
    const canvas=messages.querySelector('.std-ai-priority-canvas'),rows=[...canvas.children],moving=rows.find(row=>row.dataset.aiPriorityItem===name);
    canvas.insertBefore(moving,from<to?rows[to].nextSibling:rows[to]);
    if(draggedCapability)draggedCapability.handle.setPointerCapture(draggedCapability.pointerId);else moving.querySelector('[data-ai-drag]').focus({preventScroll:true});
    [...canvas.children].forEach((row,index)=>{row.querySelector('.std-ai-priority-index').textContent=index+1;row.querySelector('[data-ai-move="-1"]').disabled=index===0;row.querySelector('[data-ai-move="1"]').disabled=index===priorityItems.length-1;});
    messages.querySelector('[data-ai-priority-feedback]').textContent=`${name}已移至第 ${to+1} 位`;
  }
  function runPriorityAnalysis(kind){
    clearTimeout(generationTimer);priorityPhase=kind;priorityStep=0;setStage('priority-thinking');
    const steps=priorityAnalysis(kind);
    messages.innerHTML=flowLayout(`${threadHeader(kind==='rank'?'分析排序中':'分析评分中')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${userMessage(generationConfirmation())}${priorityHistory()}${assistantMessage('',`<div class="std-ai-thread-component std-ai-priority-card"><header><strong tabindex="-1" data-ai-stage-heading>${kind==='rank'?'正在分析能力排序…':'正在比较评分并重新排序…'}</strong></header><div class="std-ai-priority-body" role="status" aria-live="polite" aria-busy="true"><ol class="std-ai-analysis-steps">${steps.map((text,index)=>`<li data-ai-analysis-step="${index}" class="${index===0?'active':'pending'}"><span aria-hidden="true"></span><p>${index===0?e(text):'等待分析'}</p></li>`).join('')}</ol></div></div>`,'working')}</div></div>`);
    focusHeading();messages.querySelector('[data-ai-stage-heading]').scrollIntoView({block:'start',behavior:'instant'});
    function advance(){
      if(stage!=='priority-thinking'||priorityPhase!==kind)return;
      const current=messages.querySelector(`[data-ai-analysis-step="${priorityStep}"]`);current.className='done';
      priorityStep++;
      if(priorityStep<steps.length){const next=messages.querySelector(`[data-ai-analysis-step="${priorityStep}"]`);next.className='active';next.querySelector('p').textContent=steps[priorityStep];generationTimer=setTimeout(advance,800);}
      else if(kind==='rank')renderPriority('compare');
      else{result.content.cap=sortCapabilitiesByScore(rankedCapabilities,capabilityScores);renderScope();}
    }
    generationTimer=setTimeout(advance,800);
  }
  function confirmPriority(){
    if(stage==='rank'){rankedCapabilities=S.clone(priorityItems);runPriorityAnalysis('rank');}
    else if(stage==='compare'){
      const missing=priorityItems.find(([name])=>!Number.isInteger(capabilityScores[name])||capabilityScores[name]<1||capabilityScores[name]>5);
      if(missing){messages.querySelector('[data-ai-priority-error]').textContent='请为每一项能力评分后再确认';[...messages.querySelectorAll('[data-ai-score]')].find(input=>input.dataset.aiScore===missing[0]).focus();return;}
      comparisonConfirmed=true;runPriorityAnalysis('compare');
    }
  }
  messages.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-ai-drag]');if(stage!=='rank'||!handle||event.button!==0)return;
    draggedCapability={name:handle.dataset.aiDrag,handle,pointerId:event.pointerId,order:S.clone(priorityItems)};
    handle.setPointerCapture(event.pointerId);handle.closest('li').classList.add('is-dragging');
  });
  messages.addEventListener('pointermove',event=>{
    if(!draggedCapability||event.pointerId!==draggedCapability.pointerId)return;
    const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-ai-priority-item]');
    if(row){const target=priorityItems.findIndex(item=>item[0]===row.dataset.aiPriorityItem),from=priorityItems.findIndex(item=>item[0]===draggedCapability.name),box=row.getBoundingClientRect();if((target>from&&event.clientY>box.top+box.height/2)||(target<from&&event.clientY<box.top+box.height/2))moveCapability(draggedCapability.name,target);}
    const scroll=messages.querySelector('.std-ai-thread-scroll'),box=scroll.getBoundingClientRect();if(event.clientY>box.bottom-32)scroll.scrollTop+=16;else if(event.clientY<box.top+32)scroll.scrollTop-=16;
  });
  function endCapabilityDrag(event){if(!draggedCapability||event.pointerId!==draggedCapability.pointerId)return;const drag=draggedCapability;draggedCapability=null;drag.handle.closest('li').classList.remove('is-dragging');if(event.type==='pointercancel'){priorityItems=drag.order;renderPriority('rank');}}
  messages.addEventListener('pointerup',endCapabilityDrag);messages.addEventListener('pointercancel',endCapabilityDrag);
  messages.addEventListener('keydown',event=>{const handle=event.target.closest('[data-ai-drag]');if(handle&&stage==='rank'&&['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();moveCapability(handle.dataset.aiDrag,priorityItems.findIndex(item=>item[0]===handle.dataset.aiDrag)+(event.key==='ArrowUp'?-1:1));}});
  messages.addEventListener('click',event=>{const move=event.target.closest('[data-ai-move]');if(move){const name=move.closest('[data-ai-priority-item]').dataset.aiPriorityItem;moveCapability(name,priorityItems.findIndex(item=>item[0]===name)+Number(move.dataset.aiMove));}if(event.target.closest('[data-ai-priority-confirm]'))confirmPriority();});
  messages.addEventListener('change',event=>{const name=event.target.dataset.aiScore;if(stage==='compare'&&name){capabilityScores[name]=Number(event.target.value);messages.querySelector('[data-ai-priority-feedback]').textContent=`已评分 ${Object.keys(capabilityScores).length} / ${priorityItems.length} 项`;messages.querySelector('[data-ai-priority-error]').textContent='';}});
  function capabilityPreview(items){return window.StandardUI.capabilityRadar(items,(sourceStandard()?.name||result.name).replace(/标准$/,'')+'能力雷达图');}
  function previewMarkup(){
    const content=result.content;
    const rows=generatedSections.map(key=>`<details class="std-ai-draft-section" open><summary><span>${sectionLabels[key]}</span><span>${content[key].length} 项</span></summary>${key==='cap'?capabilityPreview(content[key]):`<ul>${content[key].map(item=>`<li>${key==='duty'?`<strong>${e(item.n)}</strong><ul>${item.t.map(t=>`<li>${e(t)}</li>`).join('')}</ul>`:e(item)}</li>`).join('')||'<li>暂无内容</li>'}</ul>`}<button class="btn-text" type="button" data-ai-section-edit="${key}">编辑${sectionLabels[key]}</button></details>`).join('');
    return `<div class="std-ai-artifact-scroll"><div class="std-ai-preview-title"><strong>${e(sourceStandard()?.name||result.name)}</strong></div>${rows}</div>`;
  }
  function updateDraftSection(key,items){
    result.content[key]=items;
    feedbackHistory.push('编辑'+sectionLabels[key]);feedbackResponses.push(`已更新${sectionLabels[key]}，当前 ${items.length} 项。`);renderScope();
  }
  function editIndicatorDraft(key){
    const capability=key==='cap',label={cap:'能力',pow:'动力',pot:'潜力'}[key];
    let items=S.clone(result.content[key]);
    const form=UI.openDialog({title:'编辑'+sectionLabels[key],body:`<div class="std-ai-section-editor"><div class="std-block-head"><strong data-ai-indicator-count></strong><button class="btn btn-secondary" type="button" data-ai-indicator-pick>选择${label}</button></div><div data-ai-indicator-list></div></div>`,confirmLabel:'更新草稿',onConfirm(){
      updateDraftSection(key,items);
    }});
    function render(){
      form.querySelector('[data-ai-indicator-count]').textContent=`已选 ${items.length} 项${label}`;
      form.querySelector('[data-ai-indicator-list]').innerHTML=items.map((item,index)=>{const name=capability?item[0]:item;return `<span class="std-chip">${e(name)}${capability?`<select class="select" aria-label="${e(name)}要求等级" data-ai-cap-level="${index}">${[1,2,3,4,5].map(n=>`<option ${item[1]==='L'+n?'selected':''}>L${n}</option>`).join('')}</select>`:''}<button class="btn-text" type="button" data-ai-indicator-remove="${index}" aria-label="移除${e(name)}">×</button></span>`;}).join('')||`<p>尚未配置${sectionLabels[key]}</p>`;
    }
    form.addEventListener('change',ev=>{if(ev.target.dataset.aiCapLevel!==undefined)items[+ev.target.dataset.aiCapLevel][1]=ev.target.value;});
    form.addEventListener('click',ev=>{
      const button=ev.target.closest('button');if(!button)return;
      if(button.dataset.aiIndicatorRemove!==undefined){items.splice(+button.dataset.aiIndicatorRemove,1);render();form.querySelector('[data-ai-indicator-pick]').focus();}
      if(button.hasAttribute('data-ai-indicator-pick')){
        const categories=capability?(window.IndicatorDemo?.categories||[]):(window.IndicatorDemo?.traitCategories[key]||[]);
        const fallback=capability?Object.values(window.STANDARD_POSITION_SEEDS||{}).flatMap(seed=>seed.abilityOptions.map(item=>item[0])):key==='pow'?['成就导向','技术钻研','创新探索','影响他人','稳定归属','自主独立','掌控权力','协作共赢']:['战略思维','变革推动','学习敏锐','复杂决策','跨界整合','坚韧抗压'];
        const library=new Map((window.IndicatorDemo?.items[key]||[]).map(item=>[item.name,{id:item.name,name:item.name,note:item.description,categoryId:item.categoryId}]));
        const names=[...fallback,...S.read().standards.flatMap(item=>item.content[key].map(value=>capability?value[0]:value)),...items.map(item=>capability?item[0]:item)];
        names.forEach(name=>{if(!library.has(name))library.set(name,{id:name,name,categoryId:capability?'general':categories[0]?.id||''});});
        StandardUI.pickIndicators(capability?'选择关联指标':`选择${label}指标`,[...library.values()],items.map(item=>capability?item[0]:item),selected=>{
          items=selected.map(name=>capability?(items.find(item=>item[0]===name)||[name,'L3']):name);render();
        },capability?20:Infinity,{categories,treeTitle:label+'指标',nameLabel:label+'名称',keepParent:true});
      }
    });
    render();
  }
  function editDraftSection(key){
    if(['cap','pow','pot'].includes(key)){editIndicatorDraft(key);return;}
    const duty=key==='duty',label=duty?'职责':'经历',items=S.clone(result.content[key]);
    const form=UI.openDialog({title:'编辑'+sectionLabels[key],body:`<div class="std-ai-section-editor"><div class="std-block-head"><strong data-ai-section-count></strong><button class="btn btn-secondary" type="button" data-ai-section-add>${duty?'新增职责':'添加经历'}</button></div><div data-ai-section-items></div></div>`,confirmLabel:'更新草稿',onConfirm(){
      const invalid=duty?items.some(item=>!item.n.trim()||item.t.some(task=>!task.trim())):items.some(item=>!item.trim());
      if(invalid){form.showError('请填写空白要求，或移除未使用的条目');[...form.querySelectorAll('textarea')].find(input=>!input.value.trim())?.focus();return false;}
      updateDraftSection(key,duty?items.map(item=>({n:item.n.trim(),t:item.t.map(task=>task.trim())})):items.map(item=>item.trim()));
    }});
    function render(focus){
      form.querySelector('[data-ai-section-count]').textContent=`已配置 ${items.length} 项${label}`;
      form.querySelector('[data-ai-section-items]').innerHTML=items.map((item,index)=>duty?`<div class="std-duty"><div class="std-text-row"><textarea class="input" aria-label="职责 ${index+1}" data-ai-duty="${index}" placeholder="填写职责">${e(item.n)}</textarea><button class="btn-text" type="button" data-ai-section-remove="${index}" aria-label="移除职责 ${index+1}">移除</button></div>${item.t.map((task,j)=>`<div class="std-text-row std-task"><textarea class="input" aria-label="职责 ${index+1} 的任务 ${j+1}" data-ai-task="${index},${j}" placeholder="填写任务">${e(task)}</textarea><button class="btn-text" type="button" data-ai-task-remove="${index},${j}" aria-label="移除职责 ${index+1} 的任务 ${j+1}">×</button></div>`).join('')}<button class="btn-text std-task" type="button" data-ai-task-add="${index}">添加任务</button></div>`:`<div class="std-text-row"><textarea class="input" aria-label="经历经验 ${index+1}" data-ai-exp="${index}" placeholder="填写经历经验">${e(item)}</textarea><button class="btn-text" type="button" data-ai-section-remove="${index}" aria-label="移除经历经验 ${index+1}">移除</button></div>`).join('')||`<p>尚未配置${sectionLabels[key]}</p>`;
      if(focus)form.querySelector(focus)?.focus();
    }
    form.addEventListener('input',ev=>{
      const input=ev.target,d=input.dataset;
      if(d.aiDuty!==undefined)items[+d.aiDuty].n=input.value;
      if(d.aiTask!==undefined){const[i,j]=d.aiTask.split(',').map(Number);items[i].t[j]=input.value;}
      if(d.aiExp!==undefined)items[+d.aiExp]=input.value;
      form.showError('');
    });
    form.addEventListener('click',ev=>{
      const button=ev.target.closest('button');if(!button)return;const d=button.dataset;
      if(d.aiSectionAdd!==undefined){items.push(duty?{n:'',t:[]}:'');render(`[data-ai-${duty?'duty':'exp'}="${items.length-1}"]`);}
      if(d.aiSectionRemove!==undefined){items.splice(+d.aiSectionRemove,1);render('[data-ai-section-add]');}
      if(d.aiTaskAdd!==undefined){const i=+d.aiTaskAdd;items[i].t.push('');render(`[data-ai-task="${i},${items[i].t.length-1}"]`);}
      if(d.aiTaskRemove!==undefined){const[i,j]=d.aiTaskRemove.split(',').map(Number);items[i].t.splice(j,1);render(`[data-ai-task-add="${i}"]`);}
    });
    render();
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
    const thread=`<section class="std-ai-thread-pane">${threadHeader('草稿待确认')}<div class="std-ai-thread-scroll"><div class="std-ai-thread-list">${conversationLead()}${reviewFeedbackTurns()}${userMessage(generationConfirmation())}${priorityHistory()}${feedbackTurns}${assistantMessage(summary)}</div></div>${scopeCard()}</section>`;
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
      reviewFeedbackHistory.push(text);syncBriefScenario();
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
    if(!/^(?:初级|基层|中级|中层|高级|资深|高层|不带团队|个人贡献者|带团队|团队管理|管理团队|不指定岗位|不关联岗位|去掉岗位|(?:删除|不生成)(?:职责任务|经历经验|能力要求|动力要求|潜力要求))$/.test(value))brief.scenario=`${brief.scenario}；${value}`;
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
    reviewFeedbackHistory.push(value);syncBriefScenario();startThinking('review');
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
    confirmedBrief=S.clone(syncBriefScenario());renderOutline();
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
  messages.addEventListener('input',event=>{if(event.target.hasAttribute('data-ai-review-feedback')){messages.querySelector('[data-ai-review-error]').textContent='';messages.querySelector('[data-ai-review-submit]').textContent=event.target.value.trim()?'更新理解':'确认，继续';}if(event.target.id==='std-ai-followup')messages.querySelector('[data-ai-followup-error]').textContent='';});
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
    if(event.target.closest('[data-ai-edit-brief]')){clearTimeout(generationTimer);resetPriority();renderReview();return;}
    if(event.target.closest('[data-ai-generate]')){if(stage!=='outline')return;const text=messages.querySelector('#std-ai-outline-feedback').value.trim();if(text){brief.scenario+='；'+text;reviewFeedbackHistory.push(text);confirmedBrief=S.clone(syncBriefScenario());}result=null;resetPriority();startThinking(generatedSections.includes('cap')?'rank':'scope');return;}
    if(event.target.closest('[data-ai-review-submit]')){submitReviewDecision();return;}
    const sectionEdit=event.target.closest('[data-ai-section-edit]');if(sectionEdit){editDraftSection(sectionEdit.dataset.aiSectionEdit);return;}
    if(event.target.closest('[data-ai-confirm-scope]')){confirmScope();return;}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)reset();});
})();
