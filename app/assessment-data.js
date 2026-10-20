(function () {
  const key='talent-assessment-drafts-v1';
  const read=()=>JSON.parse(localStorage.getItem(key)||'[]');
  const write=value=>localStorage.setItem(key,JSON.stringify(value));
  function resolve(standard) {
    const S=window.Standards,data=S.read();
    const positions=S.positions.filter(p=>S.associated(data,p.id).some(s=>s.id===standard.id));
    const applicable=S.people.filter(person=>S.forPerson(data,person).some(s=>s.id===standard.id));
    const unknown=S.people.filter(person=>S.match(standard,person)===null);
    const label=standard.mode==='rules'?S.summary(standard):positions.map(p=>p.name).join('、')||'暂未关联岗位或人员';
    return {label,people:applicable,unknown,valid:Boolean(standard.mode==='rules'&&standard.groups.some(group=>group.length)||positions.length>0)};
  }
  const types={single:'单选题',multi:'多选题',score:'打分题',essay:'问答题'};
  const defaults=()=>({single:3,multi:1,score:1,essay:1});
  function generate(abilities,counts,scenario='') {
    const context=scenario?`在${scenario}的场景中，`:'在实际工作中，';
    const situations=['日常任务推进','问题与变化处理','协作沟通','复盘改进','经验分享'];
    const behaviors={
      '跨部门沟通':['能与协作方确认目标、职责和交付时间','遇到依赖或进度变化时，能及时同步影响并协商解决办法','能根据协作方反馈确认信息是否被准确理解'],
      '创新思维':['能识别现有工作方式的问题，并提出可尝试的改进方案','能通过小范围尝试收集结果，判断改进方案是否有效','能结合实践反馈调整方案，而不只停留在想法层面'],
      '团队管理':['能将团队目标拆解为清晰任务并确认责任人','能识别成员遇到的困难并提供具体支持','能跟踪任务结果并给出有依据的反馈'],
      '系统架构':['能说明设计方案与业务目标、技术约束的对应关系','能识别关键依赖和潜在风险，并提出处理方案','能结合实施反馈检查和调整设计方案'],
      '技术选型':['能明确技术选择需要满足的业务条件和约束','能比较候选方案的适用性并说明取舍依据','能通过验证结果检查选型是否满足需求']
    };
    return abilities.flatMap(ability=>Object.keys(types).flatMap(type=>Array.from({length:counts[type]||0},(_,index)=>{
      const behavior=[...(behaviors[ability]||[`能运用“${ability}”完成职责范围内的任务`,`遇到“${ability}”相关问题时能主动采取行动并跟进结果`,`能结合反馈改进“${ability}”相关的工作方式`]),`能在任务条件变化时调整“${ability}”相关的行动方案`,`能向他人分享“${ability}”相关的实践经验`][index];
      const text=type==='essay'?`请结合${scenario||'实际工作'}中${situations[index]}的情境，描述一个体现“${ability}”的具体案例，说明情境、行动和可观察的结果。`:type==='multi'?`${context}在${situations[index]}时，该人员在“${ability}”方面有哪些可观察的行为？请选择符合实际的选项。`:type==='score'?`${context}请对“${behavior}”的表现进行评分。`:`${context}对“${behavior}”的表现，以下哪项描述最符合实际？`;
      const options=type==='single'?['很少表现出这一行为','在提醒或支持下表现出这一行为','能够独立、稳定地表现出这一行为','能够主动改进并帮助他人做到','缺少观察，无法判断']:type==='multi'?[...(behaviors[ability]||[behavior,'能主动同步问题与处理进展','能结合反馈改进工作方法']),'尚未观察到相关行为']:[];
      return {id:'q-'+Math.random().toString(36).slice(2,10),ability,type,text,options};
    })));
  }
  function questionMarkup(question,index,escape,interactive=false) {
    const type=question.type||'score',options=question.options||[];
    const choices=type==='single'||type==='multi'?options.map((option,i)=>`<label>${interactive?`<input type="${type==='single'?'radio':'checkbox'}" name="preview-${escape(question.id)}">`:''}<span>${String.fromCharCode(65+i)}. ${escape(option)}</span></label>`).join(''):type==='essay'?(interactive?`<textarea class="input" rows="2" aria-label="第 ${index+1} 题回答" placeholder="请填写具体案例"></textarea>`:''):(interactive?`<div class="eva-score-options">${['1','2','3','4','5','无法判断'].map(label=>`<label><input type="radio" name="preview-${escape(question.id)}">${label}</label>`).join('')}</div>`:'<p>评分范围：1–5 分，可选择“无法判断”。</p>');
    return `<div class="eva-question-preview"><p><span>${index+1}.</span> ${escape(question.text)}</p><div class="eva-question-options">${choices}</div></div>`;
  }
  window.AssessmentDrafts={key,read,write,resolve,types,defaults,generate,questionMarkup};
})();
