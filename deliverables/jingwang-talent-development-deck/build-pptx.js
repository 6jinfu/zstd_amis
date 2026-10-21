const path = require('node:path');
const pptxgen = require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const pptx = new pptxgen();
pptx.defineLayout({ name: 'SWISS_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'SWISS_WIDE';
pptx.author = '时代光华';
pptx.company = '时代光华';
pptx.subject = '景旺电子人才发展系统设计思路与平台演示';
pptx.title = '景旺电子人才发展 · 介绍与演示';
pptx.lang = 'zh-CN';
const FONT = 'Hiragino Sans GB';
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

const C = { paper:'FAFAF8', white:'FFFFFF', ink:'0A0A0A', grey:'F0F0EE', line:'D4D4D2', secondary:'525252', helper:'737373', blue:'002FA7', pale:'E8EDFF', lightBlue:'DCE4FF' };
const W = 13.333, H = 7.5, M = 0.66, TOTAL = 9;
const ST = pptx.ShapeType;
function box(s,x,y,w,h,fill,line=fill,lw=0.4){s.addShape(ST.rect,{x,y,w,h,rectRadius:0,fill:{color:fill},line:{color:line,width:lw,transparency:line===fill?100:0}})}
function rule(s,x,y,w,h,color=C.line,lw=0.5){s.addShape(ST.line,{x,y,w,h,line:{color,width:lw}})}
function tx(s,value,x,y,w,h,size=18,color=C.ink,opt={}){s.addText(value,{x,y,w,h,fontFace:FONT,fontSize:size,color,bold:opt.bold||false,align:opt.align||'left',valign:opt.valign||'top',margin:0,breakLine:false,fit:'shrink',charSpacing:opt.charSpacing||0,lang:'zh-CN'})}
function meta(s,value,x,y,w,color=C.helper,align='left'){tx(s,value,x,y,w,.22,8.5,color,{bold:true,align,charSpacing:1.1,valign:'mid'})}
function chrome(s,left,page,dark=false){meta(s,left,M,.38,9,dark?'B8B8B5':C.helper);meta(s,`${String(page).padStart(2,'0')} / ${String(TOTAL).padStart(2,'0')}`,W-1.6,.38,1,dark?'B8B8B5':C.helper,'right')}
function heading(s,kicker,title,page,left,dark=false){chrome(s,left,page,dark);meta(s,kicker,M,.94,10,dark?'A3A3A3':C.helper);tx(s,title,M,1.25,12.02,.8,34,dark?C.white:C.ink)}
function notes(s,items){s.addNotes(items.join('\n\n'))}

// 01 · Guizang Swiss cover
{
  const s=pptx.addSlide();s.background={color:C.blue};
  for(let i=0;i<12;i++)rule(s,7.3+i*.45,0,0,H,'5B7BFF',.22);
  for(let r=0;r<8;r++)for(let c=0;c<10;c++)box(s,8.1+c*.38,1.2+r*.44,.025,.025,'9BAEFF');
  meta(s,'景旺电子 × 时代光华',M,.38,7,C.lightBlue);meta(s,'TALENT DEVELOPMENT · 01 / 09',9.4,.38,3.3,C.lightBlue,'right');
  meta(s,'人才发展系统 · 设计思路与平台演示',M,1.25,8,C.lightBlue);
  tx(s,'从岗位标准出发\n把人才发展接起来',M,1.85,11.4,2.3,48,C.white);
  rule(s,M,5.58,12.0,0,C.white,.5);
  tx(s,'先看全景，再沿着一轮业务工作看系统如何落地。',M,5.85,11.4,.42,19,C.white);
  meta(s,'组织与岗位 / 人才标准 / 评鉴盘点 / 培养发展',M,6.65,10,C.lightBlue);
  notes(s,['今天先用几分钟介绍设计思路，再进入平台演示。','从岗位标准出发，把组织、评鉴、盘点和发展串起来。']);
}

// 02 · S17 system diagram
{
  const s=pptx.addSlide();s.background={color:C.paper};heading(s,'从组织人事数据到培养执行，围绕同一批岗位与人才','一张业务全景，连接人才与学习',2,'01 · 平台全景');
  const arr=[['01','组织与岗位','数据基础'],['02','人才标准','定尺子'],['03','评鉴盘点','看现状'],['04','发展安排','定方向'],['05','培训学习','去执行'],['06','结果反馈','再使用']];
  const gap=.14,w=(12.0-gap*5)/6,y=2.45,h=1.75;
  arr.forEach((a,i)=>{let x=M+i*(w+gap),end=i===5;box(s,x,y,w,h,end?C.blue:C.grey);if(!end)box(s,x,y,w,.035,i===1?C.blue:C.ink);meta(s,`${a[0]} / ${a[2]}`,x+.16,y+.2,w-.32,end?C.lightBlue:C.helper);tx(s,a[1],x+.16,y+.9,w-.32,.42,17,end?C.white:C.ink)});
  rule(s,M,4.62,12.0,0,C.line,.6);
  const cols=[['同一岗位基础','标准与发展通道相连'],['同一人才结果','评鉴、盘点与档案相连'],['同一发展方向','学习资源围绕差距配置']];
  cols.forEach((a,i)=>{const x=M+i*4.07;tx(s,a[0],x,4.98,3.75,.38,18,C.ink,{bold:true});tx(s,a[1],x,5.56,3.75,.55,13,C.secondary)});
  meta(s,'业务链路在一个平台内连续使用',M,6.75,11,C.helper);
  notes(s,['组织和岗位数据是基础；人才标准给后续环节同一把尺子。','评鉴盘点形成结果，发展中心安排方向，培训平台承接学习执行。','这是一条完整的业务链，不是单独一块培训功能。']);
}

// 03 · S13 three forces
{
  const s=pptx.addSlide();s.background={color:C.grey};heading(s,'多基地制造企业的人才发展，从三个业务问题开始','先把要解决的问题说清楚',3,'02 · 景旺场景');
  box(s,M,2.38,4.2,4.05,C.blue);meta(s,'从组织出发',M+.34,2.72,3.5,C.lightBlue);tx(s,'03',M+.3,3.05,3.45,1.65,94,C.white);tx(s,'个问题，串起一轮人才工作',M+.34,5.47,3.4,.66,17,C.white);
  const rows=[['01','哪些岗位值得优先投入？','先看组织结构与关键岗位。'],['02','现有人才与岗位要求差在哪里？','用统一标准连接评鉴与盘点。'],['03','下一步怎样培养和发展？','把岗位通道和学习方案接到结果上。']];
  rows.forEach((a,i)=>{const y=2.38+i*1.37;box(s,5.08,y,7.59,1.28,C.white);meta(s,a[0],5.34,y+.23,.55,C.blue);tx(s,a[1],6.0,y+.18,6.35,.42,19,C.ink);tx(s,a[2],6.0,y+.76,6.2,.27,11.5,C.secondary)});
  notes(s,['景旺公开资料显示公司有多个生产基地，产品类型丰富。','我们不预设其内部问题，而是用三个问题组织今天的介绍。','看系统能否支持岗位优先级、人才差距和发展安排的判断。']);
}

// 04 · S11 horizontal timeline
{
  const s=pptx.addSlide();s.background={color:C.paper};heading(s,'从组织和岗位开始，最终落到人的发展','六步走完一条业务链',4,'03 · 一轮人才发展');
  const steps=[['01','定组织范围'],['02','建人才标准'],['03','做 360 评估'],['04','做宫格盘点'],['05','看人员差距'],['06','安排岗位发展']];
  rule(s,M+.25,4.1,11.5,0,C.ink,1.3);
  steps.forEach((a,i)=>{let x=M+i*2.0;box(s,x+1.03,4.02,.16,.16,i===3?C.blue:C.ink);const up=i%2===0;meta(s,a[0],x,up?2.64:4.65,2.2,i===3?C.blue:C.helper);tx(s,a[1],x,up?3.0:5.03,2.2,.52,17,i===3?C.blue:C.ink,{align:'center'});if(up)rule(s,x+1.11,3.55,0,.46,C.line,.8);else rule(s,x+1.11,4.18,0,.39,C.line,.8)});
  rule(s,M,6.18,12.0,0,C.line,.6);tx(s,'前一步的结果，成为下一步的依据。',M,6.42,11.9,.38,19,C.ink);
  notes(s,['组织和关键岗位分析帮助确定范围。','标准、360 评估和宫格盘点形成判断依据。','人才中心和发展中心把结果用于岗位发展与学习安排。']);
}

// 05 · S05 three layers
{
  const s=pptx.addSlide();s.background={color:C.grey};heading(s,'先说清岗位要做什么、需要具备什么','标准，是评鉴与发展的共同语言',5,'04 · 人才标准');
  const cards=[['01 · 任职','职责与任务','这个岗位要完成什么。'],['02 · 资格','经历与能力','怎样判断能否胜任。'],['03 · 特质','动力与潜力','为后续识别提供参考。']];
  cards.forEach((a,i)=>{const x=M+i*4.07,blue=i===1;box(s,x,2.38,3.88,3.65,blue?C.blue:C.white);if(!blue)box(s,x,2.38,3.88,.045,C.ink);meta(s,a[0],x+.26,2.7,3.3,blue?C.lightBlue:C.helper);tx(s,a[1],x+.26,3.37,3.4,.58,28,blue?C.white:C.ink);tx(s,a[2],x+.26,5.12,3.4,.46,13,blue?'DCE4FF':C.secondary)});
  rule(s,M,6.23,12,0,C.line,.6);tx(s,'标准独立维护；能力指标可在评估和人才查看中复用。',M,6.43,11.8,.36,15,C.ink);
  notes(s,['标准说明职责和任务，也说明经历、能力、动力和潜力要求。','标准独立维护，可关联岗位或按人员条件确定适用范围。','同一能力指标可被评估和人才查看复用，业务人员确认后再使用。']);
}

// 06 · S08 duo compare
{
  const s=pptx.addSlide();s.background={color:C.ink};heading(s,'从个人能力表现，走到组织人才分布','评鉴看表现，盘点看位置',6,'05 · 评鉴中心',true);
  rule(s,6.67,2.4,0,3.53,'555555',.6);
  meta(s,'01 / 360 评估',M,2.63,5.3,'A3A3A3');tx(s,'一个人\n具备哪些能力',M,3.08,5.4,1.35,29,C.white);tx(s,'多来源评价形成能力结果，帮助管理者看见优势与待发展项。',M,5.12,5.3,.8,14,'C9C9C9');
  meta(s,'02 / 宫格盘点',7.12,2.63,5.3,'A3A3A3');tx(s,'一群人\n处于什么位置',7.12,3.08,5.2,1.35,29,C.white);tx(s,'把能力与绩效放在一起讨论，保留人工校准过程。',7.12,5.12,5.2,.8,14,'C9C9C9');
  rule(s,M,6.28,12,0,'555555',.6);tx(s,'结果进入人才档案，继续支持用人与培养判断。',M,6.48,11.8,.33,15,C.white);
  notes(s,['360 评估汇集多来源评价，帮助看见个人能力优势和待发展项。','宫格盘点把能力与绩效放在一个坐标里，用于讨论人才分布。','初始落位可人工校准并保留记录。']);
}

// 07 · S14 loop form
{
  const s=pptx.addSlide();s.background={color:C.paper};heading(s,'把岗位要求与人的实际情况放到同一个画面','识别差距之后，才能安排发展',7,'06 · 发展中心 × 人才中心');
  const rows=[['01','人才档案','看岗位要求与实际能力。'],['02','岗位地图','看岗位之间的发展方向。'],['03','学习方案','按岗位能力关联课程、项目、前后测。'],['04','培训执行','学习过程由培训平台承接。']];
  rows.forEach((a,i)=>{let y=2.4+i*.96;rule(s,M,y+0.85,5.18,0,C.line,.55);meta(s,a[0],M,y+.11,.48,C.blue);tx(s,a[1],M+.63,y+.07,1.55,.36,17,C.ink);tx(s,a[2],M+2.18,y+.1,3.0,.44,11.4,C.secondary)});
  box(s,6.28,2.38,6.39,4.13,C.grey);meta(s,'发展连接',6.62,2.7,5,C.helper);
  s.addShape(ST.ellipse,{x:6.88,y:3.28,w:2.02,h:2.02,fill:{color:C.grey,transparency:100},line:{color:C.blue,width:1.5}});tx(s,'岗位要求',7.17,4.07,1.46,.36,18,C.ink,{align:'center'});
  rule(s,8.9,4.29,1.25,0,C.blue,1.2);
  s.addShape(ST.ellipse,{x:10.15,y:3.28,w:2.02,h:2.02,fill:{color:C.blue},line:{color:C.blue,width:1}});tx(s,'学习行动',10.43,4.07,1.46,.36,18,C.white,{align:'center'});
  tx(s,'学习资源围绕岗位要求和人员差距组织。',6.62,5.76,5.72,.42,15,C.ink);
  notes(s,['人才档案把岗位要求、实际能力和最近盘点结果放在一起。','岗位地图展示发展方向；学习方案围绕岗位能力配置资源。','具体课程和项目由培训平台执行。']);
}

// 08 · S19 four cards
{
  const s=pptx.addSlide();s.background={color:C.grey};heading(s,'AI 出现在需要判断、整理和匹配的节点','AI 要服务场景，结果仍由人确认',8,'07 · AI 融入业务');
  const cards=[['01 / 分析','组织与\n关键岗位','给出结构和优先岗位建议。'],['02 / 帮建','人才标准\n草稿','整理材料和场景要求。'],['03 / 匹配','学习资源\n推荐','围绕岗位能力推荐资源。'],['04 / 确认','业务人员\n判断生效','可查看、可调整、可确认。']];
  cards.forEach((a,i)=>{let x=M+i*3.05,blue=i===3;box(s,x,2.38,2.87,3.95,blue?C.blue:C.white);if(!blue)box(s,x,2.38,2.87,.04,C.ink);meta(s,a[0],x+.22,2.74,2.45,blue?C.lightBlue:C.helper);tx(s,a[1],x+.22,3.62,2.43,1.15,24,blue?C.white:C.ink);tx(s,a[2],x+.22,5.45,2.45,.53,12.5,blue?C.lightBlue:C.secondary)});
  notes(s,['AI 嵌入组织与关键岗位分析、人才标准帮建和学习资源匹配等任务。','它提供建议或草稿；最终认定和采用由业务人员确认。','今天重点看业务链如何运作，后续场景继续迭代。']);
}

// 09 · S03 split statement
{
  const s=pptx.addSlide();s.background={color:C.paper};box(s,0,0,6.63,H,C.blue);
  for(let i=0;i<10;i++)rule(s,3.2+i*.35,0,0,H,'5B7BFF',.2);
  meta(s,'08 · 进入平台',M,.38,4,C.lightBlue);meta(s,'09 / 09',11.68,.38,1,C.helper,'right');
  tx(s,'现在，\n看系统\n怎么做',M,2.0,5.4,2.78,48,C.white);
  meta(s,'景旺电子 × 时代光华',M,6.68,5.1,C.lightBlue);
  meta(s,'现场演示路线',7.1,.76,4,C.helper);meta(s,'10–15 MIN',11.55,.76,1.1,C.helper,'right');
  const rows=[['01','建标准','选岗位场景，形成统一要求。'],['02','看结果','从 360 到宫格盘点。'],['03','接发展','看人才档案、岗位地图与学习方案。']];
  rows.forEach((a,i)=>{let y=2.08+i*1.36;meta(s,a[0],7.1,y,.55,C.blue);tx(s,a[1],7.8,y-.04,1.45,.4,19,C.ink);tx(s,a[2],9.38,y-.03,3.05,.63,12,C.secondary);rule(s,7.1,y+.9,5.55,0,i===2?C.blue:C.line,i===2?1.25:.5)});
  meta(s,'→ 打开人才发展平台',9.4,6.7,3.22,C.helper,'right');
  notes(s,['接下来按三段看：建标准、看评鉴盘点结果、看发展衔接。','请直接在平台里验证刚才讲的连接。']);
}

pptx.writeFile({fileName:path.join(__dirname,'景旺电子人才发展_介绍与演示.pptx')});
