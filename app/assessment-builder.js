(function () {
  const params=new URLSearchParams(location.search);
  if(params.get('mode')==='ai'){location.replace('assess-projects.html?ai=1');return;}
  const S=window.Standards,A=window.AssessmentDrafts,e=UI.escape,$=s=>document.querySelector(s);
  const select=$('#assessment-standard'),documentHost=$('#assessment-document'),selection=$('#assessment-selection');
  let standard=null,questions=[],title='',dirty=false,id=params.get('id'),sourceContent=null,sourceScope=null,sourceRangeLabel='',purpose='',scenario='',counts={single:0,multi:0,score:2,essay:0},turns=[];
  const standards=S.read().standards;
  select.innerHTML+=standards.map(s=>`<option value="${e(s.id)}">${e(s.name)}</option>`).join('');
  const error=message=>$('#assessment-error').textContent=message;
  function changed(){dirty=true;$('#assessment-save-state').textContent='有未保存的修改';}
  function sync(){const available=!!questions.length;$('#assessment-save').disabled=!available;$('#assessment-preview').disabled=!available;$('#assessment-question-count').textContent=available?`${new Set(questions.map(q=>q.ability)).size} 项能力 · ${questions.length} 道题`:'';}
  function renderScope(){
    const scope=standard?A.resolve(standard):null;
    $('#assessment-scope').innerHTML=scope?`<strong>应用范围</strong><p>${e(scope.label)}</p><p>${scope.people.length?scope.people.map(p=>e(p.name)).join('、'):'当前可用人员中暂无匹配人员'}${scope.unknown.length?`；${scope.unknown.length} 人待确认`:''}</p>${!scope.valid?`<p class="assessment-input-error">该标准尚无应用范围，请先在<a href="standard-detail.html?id=${encodeURIComponent(standard.id)}#scope">标准详情</a>配置。</p>`:''}`:'';
    const selected=new Set(questions.map(q=>q.ability));
    selection.innerHTML=standard?`<fieldset><legend>评估能力</legend>${standard.content.cap.map(([name,level])=>`<label><input type="checkbox" data-ability value="${e(name)}" ${!questions.length||selected.has(name)?'checked':''}><span>${e(name)}</span><span>${e(level)}</span></label>`).join('')}</fieldset><button type="button" class="btn btn-secondary" id="assessment-generate" ${!scope.valid||!standard.content.cap.length?'disabled':''}>${questions.length?'按所选能力重新生成':'生成初始问卷'}</button>`:'';
  }
  function renderDocument(){
    if(!questions.length){documentHost.innerHTML='<div class="assessment-document-empty"><h3>从人才标准开始</h3><a class="btn btn-secondary" href="assess-projects.html?ai=1">使用 AI 帮建</a></div>';sync();return;}
    documentHost.innerHTML=`<div class="assessment-title-field"><label for="assessment-title">问卷名称</label><input class="input" id="assessment-title" maxlength="100" value="${e(title)}"></div><p class="assessment-document-source">依据：${e(standard.name)} · ${e(sourceRangeLabel)}</p>${[...new Set(questions.map(q=>q.ability))].map(ability=>`<section class="assessment-question-group"><header><h3>${e(ability)}</h3><button class="btn-text" type="button" data-add-question="${e(ability)}">添加打分题</button></header>${questions.filter(q=>q.ability===ability).map((q,index)=>`<div class="assessment-question"><div class="assessment-question-toolbar"><label for="${e(q.id)}">第 ${index+1} 题 · ${A.types[q.type||'score']}</label><button class="btn-text" type="button" data-remove-question="${e(q.id)}">移除</button></div><textarea class="input" rows="2" id="${e(q.id)}" data-question-id="${e(q.id)}" maxlength="500">${e(q.text)}</textarea>${['single','multi'].includes(q.type)?`<div class="assessment-edit-options">${(q.options||[]).map((option,i)=>`<label><span>${String.fromCharCode(65+i)}.</span><input class="input" aria-label="第 ${index+1} 题选项 ${String.fromCharCode(65+i)}" data-option-question="${e(q.id)}" data-option-index="${i}" maxlength="300" value="${e(option)}"></label>`).join('')}</div>`:q.type==='essay'?'<p>作答方式：填写具体案例</p>':'<p>评价选项：1、2、3、4、5、无法判断</p>'}</div>`).join('')}</section>`).join('')}`;
    sync();
  }
  function resetStandard(value){standard=standards.find(s=>s.id===value)||null;questions=[];title='';sourceContent=null;sourceScope=null;sourceRangeLabel='';purpose='';scenario='';turns=[];id=null;counts={single:0,multi:0,score:2,essay:0};error('');changed();renderScope();renderDocument();}
  select.onchange=()=>{const value=select.value;if(dirty&&questions.length){select.value=standard.id;UI.openDialog({title:'切换人才标准',body:'<p>切换将清空当前问卷，重新确认应用范围和能力。</p>',confirmLabel:'切换标准',onConfirm(){select.value=value;resetStandard(value);}});}else resetStandard(value);};
  selection.onclick=event=>{
    if(!event.target.closest('#assessment-generate'))return;
    const selected=[...selection.querySelectorAll('[data-ability]:checked')].map(input=>input.value);
    if(!selected.length){error('请至少选择一项能力');return;}
    const generate=()=>{questions=A.generate(selected,counts,scenario);title=title||standard.name+' 360 评估';sourceContent=S.clone(standard.content);sourceScope=S.clone({mode:standard.mode,positions:standard.positions,groups:standard.groups});sourceRangeLabel=A.resolve(standard).label;error('');changed();renderDocument();};
    if(questions.length)UI.openDialog({title:'重新生成问卷',body:'<p>将替换当前题目及手工修改内容。</p>',confirmLabel:'重新生成',onConfirm:generate});else generate();
  };
  documentHost.oninput=event=>{
    if(event.target.id==='assessment-title')title=event.target.value;
    if(event.target.dataset.questionId)questions.find(q=>q.id===event.target.dataset.questionId).text=event.target.value;
    if(event.target.dataset.optionQuestion)questions.find(q=>q.id===event.target.dataset.optionQuestion).options[Number(event.target.dataset.optionIndex)]=event.target.value;
    error('');changed();
  };
  documentHost.onclick=event=>{
    const remove=event.target.closest('[data-remove-question]'),add=event.target.closest('[data-add-question]');
    if(remove){const q=questions.find(q=>q.id===remove.dataset.removeQuestion);if(questions.filter(item=>item.ability===q.ability).length===1){error('每项能力至少保留一道题；移除能力请重新选择评估能力');return;}questions=questions.filter(q=>q.id!==remove.dataset.removeQuestion);changed();renderDocument();}
    if(add){const q={id:'q-'+Math.random().toString(36).slice(2,10),ability:add.dataset.addQuestion,type:'score',text:'',options:[]};questions.push(q);changed();renderDocument();document.getElementById(q.id).focus();}
  };
  function validate(){
    if(!title.trim()){error('请输入问卷名称');$('#assessment-title').focus();return false;}
    const empty=questions.find(q=>!q.text.trim()||(['single','multi'].includes(q.type)&&((q.options||[]).length<2||q.options.some(option=>!option.trim()))));
    if(empty){error('请补全题目及选项内容');document.getElementById(empty.id).focus();return false;}
    return questions.length>0;
  }
  $('#assessment-preview').onclick=()=>{if(validate())UI.openDialog({title:'预览：'+title,body:`<p>${e(standard.name)} · ${e(sourceRangeLabel)}</p>${questions.map((q,index)=>A.questionMarkup(q,index,e,true)).join('')}`,confirmLabel:'关闭',cancelLabel:''});};
  $('#assessment-save').onclick=()=>{
    if(!validate())return;
    const latest=S.read().standards.find(s=>s.id===standard.id);
    if(!latest||A.resolve(latest).label!==sourceRangeLabel||JSON.stringify(latest.content.cap)!==JSON.stringify(sourceContent.cap)||JSON.stringify({mode:latest.mode,positions:latest.positions,groups:latest.groups})!==JSON.stringify(sourceScope)){error('人才标准的能力或应用范围已变化，请重新选择标准并确认问卷');return;}
    const projects=A.read();id=id||'assess-'+Date.now().toString(36);
    const project={id,title:title.trim(),standardId:standard.id,standardName:standard.name,scope:S.clone(sourceScope),scopeLabel:sourceRangeLabel,sourceContent,questions:S.clone(questions),purpose,scenario,counts,turns,status:'草稿',updated:new Date().toISOString()};
    const index=projects.findIndex(p=>p.id===id);if(index<0)projects.unshift(project);else projects[index]=project;
    try{A.write(projects);}catch(err){error('保存失败，请检查浏览器存储空间');return;}
    dirty=false;error('');$('#assessment-save-state').textContent='草稿已保存';document.querySelector('.assessment-topbar h1').textContent='编辑 360 评估';document.title='编辑 360 评估 · 人才发展';history.replaceState(null,'','assess-new.html?id='+encodeURIComponent(id));
  };
  let initial=id?A.read().find(p=>p.id===id):null;
  const incoming=params.get('ai')==='1';
  if(incoming){const raw=sessionStorage.getItem('talent-assessment-ai-draft-v1');if(raw)initial=JSON.parse(raw);}
  if(initial){
    standard=standards.find(s=>s.id===initial.standardId);
    if(!standard){error('来源标准已移除，请重新选择人才标准');renderDocument();return;}
    select.value=standard.id;questions=S.clone(initial.questions);title=initial.title;purpose=initial.purpose||'';scenario=initial.scenario||'';counts=initial.counts||{single:0,multi:0,score:initial.perAbility||2,essay:0};turns=initial.turns||[];sourceContent=initial.sourceContent;sourceScope=initial.scope;sourceRangeLabel=initial.scopeLabel;
    if(incoming){sessionStorage.removeItem('talent-assessment-ai-draft-v1');changed();}else{document.querySelector('.assessment-topbar h1').textContent='编辑 360 评估';document.title='编辑 360 评估 · 人才发展';$('#assessment-save-state').textContent='草稿已保存';}
  }else if(id||incoming)error('未找到问卷草稿，请返回列表重新打开或帮建');
  renderScope();renderDocument();
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
})();
