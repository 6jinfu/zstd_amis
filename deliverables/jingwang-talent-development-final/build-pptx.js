const path=require('node:path');
const pptxgen=require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
const pptx=new pptxgen();pptx.defineLayout({name:'JW_WIDE',width:13.333,height:7.5});pptx.layout='JW_WIDE';
pptx.author='时代光华';pptx.company='时代光华';pptx.subject='景旺电子人才发展平台介绍';pptx.title='景旺电子人才发展平台介绍';pptx.lang='zh-CN';
const SERIF='Songti SC',SANS='Hiragino Sans GB';pptx.theme={headFontFace:SERIF,bodyFontFace:SANS,lang:'zh-CN'};
const C={paper:'FFFFFF',ink:'07204E',brand:'0152D9',line:'B8D5FF',muted:'355179',white:'FFFFFF'};
const ST=pptx.ShapeType,W=13.333,H=7.5,M=.8,N=11;
function rect(s,x,y,w,h,fill){s.addShape(ST.rect,{x,y,w,h,fill:{color:fill},line:{color:fill,transparency:100}})}
function rule(s,x,y,w,h=0,color=C.line,lw=.65){s.addShape(ST.line,{x,y,w,h,line:{color,width:lw}})}
function txt(s,v,x,y,w,h,size=17,color=C.ink,o={}){s.addText(v,{x,y,w,h,fontFace:o.serif?SERIF:SANS,fontSize:size,color,bold:o.bold||false,italic:o.italic||false,align:o.align||'left',valign:o.valign||'mid',margin:0,breakLine:false,fit:'shrink',lang:'zh-CN',charSpacing:o.spacing||0})}
function small(s,v,x,y,w,color=C.muted,o={}){txt(s,v,x,y,w,.26,9.5,color,{bold:true,spacing:.7,align:o.align})}
function chrome(s,label,n,dark=false){small(s,label,M,.4,8,dark?'DCEAFF':C.muted);small(s,`${String(n).padStart(2,'0')} / ${N}`,11.85,.4,.7,dark?'DCEAFF':C.muted,{align:'right'})}
function foot(s,label,n,dark=false){small(s,label,M,6.95,10,dark?'DCEAFF':C.muted);small(s,`${String(n).padStart(2,'0')} / ${N}`,11.85,6.95,.7,dark?'DCEAFF':C.muted,{align:'right'})}
function head(s,kicker,title,n,label,dark=false){chrome(s,label,n,dark);small(s,kicker,M,1.06,10,dark?'DCEAFF':C.muted);txt(s,title,M,1.38,11.7,.77,33,dark?C.paper:C.ink,{serif:true})}
function note(s,items){s.addNotes(items.join('\n\n'))}
function bg(dark=false){const s=pptx.addSlide();s.background={color:dark?C.brand:C.paper};return s}

// 01 封面
{
 const s=bg(true);small(s,'景旺电子 × 时代光华',M,.44,7,'F0F6FF');small(s,'人才发展平台介绍',9.8,.44,2.65,'F0F6FF',{align:'right'});
 small(s,'平台思路与现场演示',M,1.52,6,'DCEAFF');txt(s,'从人才标准\n走向人才发展',M,2.05,10.8,2.38,48,C.paper,{serif:true});
 txt(s,'先看完整业务链，再进入平台，沿一个具体场景走一遍。',M,5.1,9.6,.65,18,C.paper,{serif:true});rule(s,M,6.39,11.75,0,'85B7FF');small(s,'标准 / 评鉴 / 盘点 / 发展',M,6.64,7,'DCEAFF');small(s,'2026.09',11.47,6.64,1.08,'DCEAFF',{align:'right'});
 note(s,['今天先简要介绍平台覆盖的工作，再进入现场操作。','演示以建立人才标准为主线，并看结果如何继续使用。']);
}
// 02 介绍顺序
{
 const s=bg();head(s,'这次先回答一个整体问题','先看全局，再走一遍具体流程',2,'介绍顺序');
 rule(s,M,2.48,5.54);rule(s,6.98,2.48,5.55);txt(s,'01',M,2.75,2.1,.72,40,C.ink,{serif:true});txt(s,'02',6.98,2.75,2.1,.72,40,C.ink,{serif:true});
 txt(s,'平台覆盖哪些工作',M,3.65,5.48,.47,24,C.ink,{serif:true});txt(s,'一项工作怎样落地',6.98,3.65,5.5,.47,24,C.ink,{serif:true});
 txt(s,'组织与岗位、人才标准、评鉴盘点、发展安排和人才查看，如何围绕同一批岗位与人员衔接。',M,4.45,5.36,1.18,16,C.muted);
 txt(s,'现场重点看人才标准的建立和使用，再看评鉴、盘点结果怎样回到人才与发展。',6.98,4.45,5.36,1.18,16,C.muted);
 foot(s,'先全景 · 后操作',2);note(s,['客户希望先有完整认识，再挑一项具体需求看如何操作。','PPT 讲业务关系，按钮和细节留到平台中展示。']);
}
// 03 平台全景
{
 const s=bg();head(s,'一个平台，五个工作域','人才发展平台覆盖哪些工作',3,'平台全景');
 const arr=[['人才标准','组织结构、关键岗位分析、人才标准、指标库'],['评鉴中心','360 评估与宫格盘点'],['发展中心','岗位地图、按岗位配置学习方案'],['人才中心','人才列表、能力与盘点结果查看'],['系统设置','职级与功能配置，支撑前面的业务流程']];
 arr.forEach((a,i)=>{let y=2.39+i*.76;rule(s,M,y,11.74);txt(s,`0${i+1}`,M,y+.17,.55,.32,16,C.muted,{serif:true});txt(s,a[0],1.73,y+.12,2.9,.42,21,C.ink,{serif:true});txt(s,a[1],5.0,y+.13,7.5,.42,15,C.muted)});rule(s,M,6.19,11.74);foot(s,'五个工作域使用同一套岗位与人才基础',3);
 note(s,['人才标准、评鉴、发展、人才和系统设置组成一套工作环境。','这里不逐个讲菜单，只看哪些业务有承接。']);
}
// 04 业务主线
{
 const s=bg(true);head(s,'前一步的结果，进入下一步','从岗位要求到人才发展',4,'业务主线',true);
 const arr=[['看组织与岗位','确定范围，识别关键岗位'],['建立人才标准','明确职责、经历与能力要求'],['开展 360 评估','收集多方评价，形成能力结果'],['开展宫格盘点','结合绩效，讨论人才分布'],['查看人才差距','对照岗位要求与实际能力'],['安排后续发展','通过岗位地图和学习方案承接']];
 arr.forEach((a,i)=>{let col=i%3,row=Math.floor(i/3),x=M+col*4.02,y=2.6+row*1.89;rule(s,x,y,3.55,0,'85B7FF');txt(s,`0${i+1}`,x,y+.17,.55,.4,16,'DCEAFF',{serif:true});txt(s,a[0],x,y+.66,3.66,.46,20,C.paper,{serif:true});txt(s,a[1],x,y+1.17,3.66,.5,13,'F0F6FF')});foot(s,'岗位 → 人才 → 发展',4,true);
 note(s,['从组织岗位开始，建立标准后再做能力评价和人才盘点。','结果回到人才档案、岗位地图和学习方案，不停在评估报告里。']);
}
// 05 人才标准
{
 const s=bg();head(s,'把岗位需要什么样的人说清楚','标准是后续工作的共同依据',5,'人才标准');
 txt(s,'标准可以独立维护，再按岗位或人员条件确定适用范围。',M,2.61,4.6,1.1,20,C.ink,{serif:true});rule(s,M,4.42,4.65);txt(s,'能力指标复用',M,4.68,4.5,.43,20,C.ink,{serif:true});txt(s,'同一套指标继续用于 360 评估和人才能力查看，减少各环节口径不一致。',M,5.21,4.63,.95,14,C.muted);
 const a=[['职责任务','岗位要完成什么'],['经历经验','需要哪些相关经历'],['能力要求','具备哪些能力、达到什么等级'],['动力要求','行为意愿与驱动因素'],['潜力要求','未来发展所需特质']];a.forEach((v,i)=>{let y=2.35+i*.78;rule(s,6.04,y,6.49);txt(s,`0${i+1}`,6.04,y+.16,.51,.29,14,C.muted,{serif:true});txt(s,v[0],6.73,y+.1,2.0,.42,18,C.ink,{serif:true});txt(s,v[1],9.01,y+.12,3.52,.38,12.7,C.muted)});rule(s,6.04,6.25,6.49);foot(s,'标准内容与适用范围由业务人员确认',5);
 note(s,['标准可以独立维护，按岗位或人员条件确定适用范围。','能力指标会被评估与人才查看复用，具体内容由业务人员确认。']);
}
// 06 评估与盘点
{
 const s=bg();head(s,'先看个人，再看组织','评估与盘点，回答两个不同的问题',6,'评鉴与盘点');
 rule(s,M,2.6,5.44);rule(s,7.1,2.6,5.42);txt(s,'01',M,2.79,1.0,.51,29,C.ink,{serif:true});txt(s,'02',7.1,2.79,1.0,.51,29,C.ink,{serif:true});
 txt(s,'360 评估',M,3.51,5.3,.49,26,C.ink,{serif:true});txt(s,'宫格盘点',7.1,3.51,5.3,.49,26,C.ink,{serif:true});
 txt(s,'这个人具备哪些能力？',M,4.25,5.3,.42,18,C.ink,{serif:true});txt(s,'这批人才处于什么位置？',7.1,4.25,5.3,.42,18,C.ink,{serif:true});
 txt(s,'自评、上级、同级、下级等评价关系提供多来源反馈；项目结束后查看综合结果和能力表现。',M,4.91,5.25,1.12,14.5,C.muted);
 txt(s,'结合能力与绩效查看分布和人员明细；初始落位可以经业务与 HR 校准，并保留调整过程。',7.1,4.91,5.25,1.12,14.5,C.muted);
 foot(s,'评鉴结果进入人才查看与发展讨论',6);note(s,['360 评估汇集不同评价关系的反馈。','宫格盘点结合能力与绩效，业务和 HR 可以校准结果并留下过程。']);
}
// 07 结果应用
{
 const s=bg();head(s,'评鉴完成之后','结果回到人，也回到岗位',7,'结果应用');
 const a=[['人才档案','把岗位标准要求、实际能力和最近一次盘点结果放在一起看。'],['岗位地图','查看岗位序列与发展方向，明确下一步可能走向哪里。'],['学习方案','围绕岗位能力关联课程、培训项目与前后测；具体学习执行由培训平台承接。']];
 a.forEach((v,i)=>{let x=M+i*4.01;rule(s,x,2.67,3.55);txt(s,`0${i+1}`,x,2.94,.65,.38,17,C.muted,{serif:true});txt(s,v[0],x,3.58,3.59,.47,23,C.ink,{serif:true});txt(s,v[1],x,4.49,3.57,1.45,15,C.muted)});foot(s,'先识别差距，再安排发展',7);
 note(s,['人才档案放在一起看岗位要求、能力与盘点结果。','岗位地图给出发展方向，学习方案关联课程、项目及前后测；课程内容今天不展开。']);
}
// 08 标准深化
{
 const s=bg();head(s,'让建标更省力','人才标准支持 AI 帮建与整理',8,'持续深化 · 人才标准');
 txt(s,'把岗位资料和业务描述整理成可审阅的标准草稿，减少从空白文档开始的工作量。',M,2.55,5.35,1.45,21,C.ink,{serif:true});rule(s,M,4.68,5.12);txt(s,'人的判断仍在最后一步',M,4.91,5.2,.42,19,C.ink,{serif:true});txt(s,'职责、能力要求和适用范围由业务人员核对、修改后采用。',M,5.51,5.1,.75,13.8,C.muted);
 const a=[['输入资料','岗位说明、业务要求等材料'],['整理内容','归纳职责、经历与能力条目'],['审核采用','形成可维护的人才标准']];a.forEach((v,i)=>{let y=2.48+i*1.27;rule(s,7.03,y,5.49);txt(s,`0${i+1}`,7.03,y+.18,.58,.36,16,C.muted,{serif:true});txt(s,v[0],7.79,y+.14,1.9,.42,20,C.ink,{serif:true});txt(s,v[1],9.75,y+.17,2.78,.45,12.8,C.muted)});rule(s,7.03,6.29,5.49);foot(s,'能力落在建标工作中',8);
 note(s,['AI 可以整理岗位材料，辅助形成标准草稿。','最终标准及适用范围由业务人员审核采用。']);
}
// 09 评鉴深化
{
 const s=bg(true);head(s,'不只依靠一种评鉴方式','评鉴手段继续丰富',9,'持续深化 · 评鉴中心',true);
 const a=[['AI 创建评估问卷','围绕能力指标辅助生成题目，交由管理员审阅后使用。'],['内置人才测评产品','补充动力、潜力等维度的测评工具，让人才识别有更多依据。'],['考试','增加知识与技能检验，并让有效结果进入人才评鉴与发展过程。']];a.forEach((v,i)=>{let x=M+i*4.01;rule(s,x,2.72,3.57,0,'85B7FF');txt(s,`0${i+1}`,x,3.01,.62,.38,17,'DCEAFF',{serif:true});txt(s,v[0],x,3.61,3.54,.72,22,C.paper,{serif:true});txt(s,v[1],x,4.66,3.53,1.3,14,'F0F6FF')});foot(s,'评鉴方式增加，人才判断更有依据',9,true);
 note(s,['评鉴中心会增加 AI 创建评估问卷。','还会纳入更多内置人才测评产品与考试，让人才识别有更多依据。']);
}
// 10 人才中心深化
{
 const s=bg();head(s,'从个人查看走向组织人才经营','人才结果还要方便持续使用',10,'持续深化 · 人才中心');
 const a=[['人才池','跨项目沉淀重点人才，支持持续跟踪与培养'],['人才看板','从组织视角查看人才分布、结构和变化'],['人才档案','继续汇集标准、评鉴、盘点与发展信息，形成连续记录']];a.forEach((v,i)=>{let y=2.52+i*1.02;rule(s,M,y,11.73);txt(s,`0${i+1}`,M,y+.26,.64,.34,16,C.muted,{serif:true});txt(s,v[0],1.83,y+.16,3.13,.48,23,C.ink,{serif:true});txt(s,v[1],5.36,y+.2,7.08,.52,14.7,C.muted)});rule(s,M,5.58,11.73);txt(s,'一次评估或盘点结束后，结果仍能被找到、被比较、被用于下一次发展讨论。',M,5.9,11.6,.5,18,C.ink,{serif:true});foot(s,'人才标准 → 评鉴 → 人才结果',10);
 note(s,['人才池用于沉淀和跟踪重点人才。','人才看板提供组织视角，人才档案继续汇集个人结果与发展信息。']);
}
// 11 平台演示转场
{
 const s=bg(true);chrome(s,'进入平台',11,true);small(s,'接下来用 10–15 分钟',M,1.3,8,'DCEAFF');txt(s,'现场建立一套标准，\n再看结果怎样使用',M,1.85,11.6,2.17,45,C.paper,{serif:true});
 const a=[['建立人才标准','内容与适用范围'],['查看评鉴盘点','能力结果与人员落位'],['回到人才发展','人才档案、岗位地图与学习方案']];a.forEach((v,i)=>{let x=M+i*4.01;rule(s,x,5.03,3.57,0,'85B7FF');txt(s,`0${i+1}`,x,5.19,.55,.32,15,'DCEAFF',{serif:true});txt(s,v[0],x,5.54,3.58,.42,19,C.paper,{serif:true});txt(s,v[1],x,6.09,3.58,.38,11.8,'F0F6FF')});foot(s,'景旺电子 × 时代光华',11,true);
 note(s,['先建立标准，重点看内容和适用范围。','再看评鉴盘点结果，以及它们如何进入人才档案和发展安排。']);
}

pptx.writeFile({fileName:path.join(__dirname,'景旺电子人才发展_完整介绍_优化版.pptx')});
