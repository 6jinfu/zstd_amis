const path = require('node:path');
const pptxgen = require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const pptx = new pptxgen();
pptx.defineLayout({ name: 'SWISS_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'SWISS_WIDE';
pptx.author = '时代光华';
pptx.company = '时代光华';
pptx.subject = '景旺电子人才发展演示模板';
pptx.title = '景旺电子人才发展演示模板';
pptx.lang = 'zh-CN';
const FONT = 'Hiragino Sans GB';
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

const C = { paper:'FAFAF8', white:'FFFFFF', ink:'0A0A0A', grey:'F0F0EE', line:'D4D4D2', secondary:'525252', helper:'737373', blue:'002FA7', pale:'E8EDFF', lightBlue:'DCE4FF' };
const W=13.333, H=7.5, M=.66, TOTAL=16, ST=pptx.ShapeType;
function box(s,x,y,w,h,fill,line=fill,lw=.4){s.addShape(ST.rect,{x,y,w,h,rectRadius:0,fill:{color:fill},line:{color:line,width:lw,transparency:line===fill?100:0}})}
function line(s,x,y,w,h,color=C.line,lw=.6){s.addShape(ST.line,{x,y,w,h,line:{color,width:lw}})}
function tx(s,v,x,y,w,h,size=18,color=C.ink,o={}){s.addText(v,{x,y,w,h,fontFace:FONT,fontSize:size,color,bold:o.bold||false,italic:o.italic||false,align:o.align||'left',valign:o.valign||'mid',margin:0,breakLine:false,fit:'shrink',charSpacing:o.spacing||0,lang:'zh-CN',transparency:o.transparency||0})}
function meta(s,v,x,y,w,color=C.helper,align='left'){tx(s,v,x,y,w,.25,9,color,{bold:true,align,spacing:1.0})}
function chrome(s,left,page,dark=false){meta(s,left,M,.38,9,dark?'B8B8B5':C.helper);meta(s,`${String(page).padStart(2,'0')} / ${TOTAL}`,W-1.64,.38,.97,dark?'B8B8B5':C.helper,'right')}
function heading(s,kicker,title,page,label,dark=false){chrome(s,label,page,dark);meta(s,kicker,M,.95,11,dark?'B8B8B5':C.helper);tx(s,title,M,1.25,12.02,.75,35,dark?C.white:C.ink)}
function notes(s,lines){s.addNotes(lines.join('\n\n'))}
function slot(s,x,y,w,h,label,sub='[替换图片]',dark=false){box(s,x,y,w,h,dark?'242424':C.grey,dark?'7B7B7B':C.line,1);line(s,x+.2,y+.18,w-.4,h-.36,dark?'545454':C.line,.55);line(s,x+.2,y+h-.18,w-.4,-(h-.36),dark?'545454':C.line,.55);if(label){box(s,x+w*.16,y+h*.36,w*.68,h*.29,dark?'242424':C.grey);tx(s,label,x+w*.17,y+h*.38,w*.66,.27,13,dark?C.white:C.ink,{align:'center'});tx(s,sub,x+w*.17,y+h*.52,w*.66,.25,10,dark?'B8B8B5':C.helper,{align:'center'})}}

// 01 · SWISS-COVER-ASCII
{
 const s=pptx.addSlide();s.background={color:C.blue};
 for(let i=0;i<14;i++)line(s,7.6+i*.37,0,0,H,'5478E7',.18);
 for(let r=0;r<8;r++)for(let c=0;c<11;c++)box(s,8.1+c*.36,1.3+r*.43,.018,.018,'9BAEFF');
 meta(s,'景旺电子 × 时代光华',M,.4,7,C.lightBlue);meta(s,'TALENT DEVELOPMENT · 01 / 16',9.1,.4,3.55,C.lightBlue,'right');
 meta(s,'人才发展系统 · 演示模板',M,1.28,9,C.lightBlue);
 tx(s,'[项目主标题]\n[一句话副标题]',M,1.95,11.6,2.55,48,C.white);
 line(s,M,5.58,12,0,C.white,.55);tx(s,'[填写本次介绍的核心判断或价值主张]',M,5.83,11.5,.48,20,C.white);
 meta(s,'[讲者] / [日期] / [版本]',M,6.66,11,C.lightBlue);
 notes(s,['填写项目主标题、副标题、讲者和日期。','演示前删除全部方括号占位符。']);
}

// 02 · S17 平台全景
{
 const s=pptx.addSlide();s.background={color:C.paper};heading(s,'[平台定位 / 覆盖范围]','[一张业务全景，说明整体设计]',2,'01 · 平台全景');
 const arr=['[组织与岗位]','[人才标准]','[评鉴盘点]','[发展安排]','[培训学习]','[结果反馈]'];let gap=.13,w=(12-gap*5)/6;
 arr.forEach((v,i)=>{let x=M+i*(w+gap),accent=i===5;box(s,x,2.45,w,1.67,accent?C.blue:C.grey);if(!accent)box(s,x,2.45,w,.04,i===1?C.blue:C.ink);meta(s,`0${i+1} / [环节]`,x+.13,2.72,w-.26,accent?C.lightBlue:C.helper);tx(s,v,x+.13,3.35,w-.26,.43,17,accent?C.white:C.ink)});
 line(s,M,4.58,12,0);[['[结论一]','[业务价值或设计原则]'],['[结论二]','[业务价值或设计原则]'],['[结论三]','[业务价值或设计原则]']].forEach((a,i)=>{let x=M+i*4.07;tx(s,a[0],x,4.91,3.7,.42,18,C.ink,{bold:true});tx(s,a[1],x,5.52,3.7,.48,14,C.secondary)});
 notes(s,['填写六段业务链及其先后关系。','下方三条结论应回应客户关注点。']);
}

// 03 · S09 章节幕封
{
 const s=pptx.addSlide();s.background={color:C.ink};chrome(s,'02 · 章节幕封',3,true);meta(s,'SECTION / [章节序号]',M,1.47,5,'A3A3A3');
 tx(s,'[章节名称]',M,2.05,11.6,1.2,58,C.white);box(s,M,4.01,2.2,.1,C.blue);tx(s,'[本章核心判断，建议不超过两行]',M,4.5,11.2,1.22,29,C.white);
 meta(s,'[下一部分讨论的业务主题]',M,6.59,9,'B8B8B5');notes(s,['填写一条清晰的章节判断。','此页用于从平台全景切入主题。']);
}

// 04 · S13 三个业务问题
{
 const s=pptx.addSlide();s.background={color:C.grey};heading(s,'[客户场景 / 业务背景]','[最值得回答的三个问题]',4,'03 · 业务问题');
 box(s,M,2.37,4.05,4.05,C.blue);meta(s,'从业务问题出发',M+.3,2.7,3.5,C.lightBlue);tx(s,'03',M+.28,3.11,3.5,1.55,93,C.white);tx(s,'[问题总括]',M+.3,5.61,3.37,.48,19,C.white);
 for(let i=0;i<3;i++){let y=2.37+i*1.38;box(s,4.91,y,7.76,1.28,C.white);meta(s,`0${i+1}`,5.18,y+.18,.55,C.blue);tx(s,`[业务问题${['一','二','三'][i]}]`,5.9,y+.16,6.4,.44,20,C.ink);tx(s,'[一句话解释问题为何重要]',5.9,y+.76,6.4,.3,12.5,C.secondary)}
 notes(s,['填写客户真实关注的三个业务问题。','不要把推测写成客户事实。']);
}

// 05 · S11 六步流程
{
 const s=pptx.addSlide();s.background={color:C.paper};heading(s,'[流程起点 / 适用业务]','[六步走完一条业务链]',5,'04 · 核心流程');
 line(s,M+.2,4.04,11.58,0,C.ink,1.25);
 for(let i=0;i<6;i++){let x=M+i*2.01,up=i%2===0;box(s,x+1.0,3.96,.17,.17,i===3?C.blue:C.ink);line(s,x+1.08,up?3.49:4.13,0,.44,C.line,.7);meta(s,`0${i+1}`,x,up?2.56:4.65,1.95,i===3?C.blue:C.helper,'center');tx(s,`[步骤${i+1}]`,x,up?2.97:5.03,1.95,.48,17,i===3?C.blue:C.ink,{align:'center'})}
 line(s,M,6.16,12,0);tx(s,'[填写流程的关键逻辑或前后依赖]',M,6.43,11.7,.39,19,C.ink);
 notes(s,['填写六步业务流程。','强调上一步的产出如何进入下一步。']);
}

// 06 · S05 三层能力
{
 const s=pptx.addSlide();s.background={color:C.grey};heading(s,'[产品结构 / 设计逻辑]','[三层能力如何相互支撑]',6,'05 · 能力结构');
 for(let i=0;i<3;i++){let x=M+i*4.07,accent=i===1;box(s,x,2.38,3.89,3.63,accent?C.blue:C.white);if(!accent)box(s,x,2.38,3.89,.04,C.ink);meta(s,`0${i+1} / [层级]`,x+.25,2.73,3.3,accent?C.lightBlue:C.helper);tx(s,`[能力层${i+1}]`,x+.25,3.5,3.4,.62,28,accent?C.white:C.ink);tx(s,'[该层的作用与主要内容]',x+.25,5.18,3.4,.44,13.5,accent?C.lightBlue:C.secondary)}
 line(s,M,6.22,12,0);tx(s,'[三层能力之间的关系]',M,6.45,11.8,.39,16,C.ink);
 notes(s,['填写三层能力或产品结构。','中间蓝色卡片用于最需要突出的层级。']);
}

// 07 · S08 对照
{
 const s=pptx.addSlide();s.background={color:C.ink};heading(s,'[两个方法的共通目标]','[方法 A 与方法 B 各负责什么]',7,'06 · 方法对照',true);
 line(s,6.67,2.44,0,3.48,'555555',.6);
 meta(s,'01 / [方法 A]',M,2.67,5.2,'A3A3A3');tx(s,'[方法 A\n核心作用]',M,3.1,5.4,1.39,29,C.white);tx(s,'[适用场景与输出]',M,5.15,5.4,.6,15,'C9C9C9');
 meta(s,'02 / [方法 B]',7.12,2.67,5.2,'A3A3A3');tx(s,'[方法 B\n核心作用]',7.12,3.1,5.2,1.39,29,C.white);tx(s,'[适用场景与输出]',7.12,5.15,5.2,.6,15,'C9C9C9');
 line(s,M,6.29,12,0,'555555');tx(s,'[两种方法如何配合]',M,6.5,11.8,.34,16,C.white);
 notes(s,['填写两种方法的差异和共同目标。','一侧讲一个判断，不要塞入操作细节。']);
}

// 08 · S06 关键数据
{
 const s=pptx.addSlide();s.background={color:C.paper};heading(s,'[统计口径 / 时间范围 / 来源]','[一个最关键的数据说明什么]',8,'07 · 关键数据');
 line(s,M,2.42,7.14,0,C.blue,2.2);meta(s,'主指标 / [单位]',M,2.65,5.8);tx(s,'[XX]',M,3.13,7.3,1.78,96,C.blue);tx(s,'[一句话解释主指标的意义]',M,5.64,7.15,.52,20,C.ink);
 for(let i=0;i<2;i++){let y=2.4+i*1.96;box(s,8.18,y,4.49,1.79,C.grey);meta(s,`辅助指标 ${i===0?'A':'B'}`,8.48,y+.23,3.7);tx(s,'[XX]',8.48,y+.62,3.7,.68,34,C.ink);tx(s,'[指标解释]',8.48,y+1.34,3.7,.28,12.5,C.secondary)}
 notes(s,['填写一个主指标和两个辅助指标。','必须补充单位、统计时间和数据来源。']);
}

// 09 · S22 案例封面，21:9 图槽
{
 const s=pptx.addSlide();s.background={color:C.paper};chrome(s,'08 · 案例封面模板',9);slot(s,M,1.17,12.0,5.14,'','');
 box(s,M,1.68,6.28,2.21,C.paper);meta(s,'CASE / [案例编号]',M+.24,1.98,5.6);tx(s,'[案例名称]\n[一句话成果]',M+.24,2.35,5.6,1.12,33,C.ink);
 tx(s,'21:9 案例主图槽位',8.03,2.53,3.65,.34,14,C.helper);tx(s,'[替换为真实横幅图片]',8.03,2.98,3.65,.29,11,C.helper);
 box(s,M,5.43,12.0,1.45,C.paper);const arr=[['客户 / 场景','[填写]'],['核心动作','[填写]'],['关键结果','[填写]']];arr.forEach((a,i)=>{let x=M+i*4.07;line(s,x,5.56,3.83,0);meta(s,a[0],x,5.81,3.7);tx(s,a[1],x,6.2,3.7,.47,18,C.ink)});
 notes(s,['插入经过授权的 21:9 案例主图。','填写客户、核心动作和有依据的结果。']);
}

// 10 · S14 案例路径
{
 const s=pptx.addSlide();s.background={color:C.grey};heading(s,'[案例名称] / [项目周期]','[从问题到结果，做了哪四步]',10,'09 · 案例行动路径模板');
 const labels=[['背景','[原始问题与范围]'],['动作','[关键实施动作]'],['交付','[具体交付物]'],['结果','[可核验的变化]']];
 labels.forEach((a,i)=>{let y=2.39+i*.98;line(s,M,y+.86,5.3,0);meta(s,`0${i+1}`,M,y+.1,.5,C.blue);tx(s,`[${a[0]}]`,M+.63,y+.04,1.32,.4,18,C.ink);tx(s,a[1],M+2.02,y+.08,3.28,.45,12.5,C.secondary)});
 box(s,6.31,2.39,6.36,4.01,C.white);meta(s,'CASE FLOW',6.64,2.74,5);for(let i=0;i<4;i++){let x=6.64+i*1.4;box(s,x,3.55,1.24,.04,i===2?C.blue:C.ink);tx(s,`[阶段${i+1}]`,x,3.85,1.2,.42,14,C.ink)}tx(s,'[这一案例最值得复用的方法]',6.64,5.55,5.55,.54,19,C.ink);
 notes(s,['填写案例的背景、动作、交付、结果。','右侧四阶段与左侧四项保持同一逻辑。']);
}

// 11 · S16 案例证据
{
 const s=pptx.addSlide();s.background={color:C.paper};heading(s,'[选择最能证明案例结论的两张图]','[让证据自己说话]',11,'10 · 案例证据模板');
 slot(s,M,2.37,5.76,3.6,'16:10 截图槽位 A','[替换为原始页面或现场截图]');slot(s,6.91,2.37,5.76,3.6,'16:10 截图槽位 B','[替换为原始页面或现场截图]');
 line(s,M,6.14,5.76,0,C.ink,1.2);line(s,6.91,6.14,5.76,0,C.blue,1.2);tx(s,'[证据标题 A]',M,6.27,5.76,.38,18,C.ink);tx(s,'[证据标题 B]',6.91,6.27,5.76,.38,18,C.ink);meta(s,'[截图证明了什么]',M,6.75,5.76);meta(s,'[截图证明了什么]',6.91,6.75,5.76);
 notes(s,['插入两张真实且可读的 16:10 截图。','标题解释每张截图证明了什么。']);
}

// 12 · S20 案例成效
{
 const s=pptx.addSlide();s.background={color:C.ink};heading(s,'[统计口径 / 时间 / 数据来源]','[用可信数据说明案例成效]',12,'11 · 案例成效模板',true);
 for(let i=0;i<3;i++){let x=M+i*4.08;line(s,x,2.47,3.79,0,C.blue,1.3);meta(s,`指标 ${String.fromCharCode(65+i)}`,x,2.73,3.68,'A3A3A3');tx(s,'[XX]',x,3.4,3.7,1.05,64,C.white);tx(s,'[指标定义 / 单位]',x,5.0,3.72,.54,15,'C9C9C9')}
 line(s,M,6.18,12,0,'555555');tx(s,'[如无可核验数字，可改为三项定性成果]',M,6.45,11.8,.38,14,'B8B8B5');
 notes(s,['仅填写可核验的真实成果。','如暂无数字，可改用定性结果并附来源。']);
}

// 13 · S11 未来规划三阶段
{
 const s=pptx.addSlide();s.background={color:C.paper};heading(s,'[规划起点 / 适用范围 / 版本]','[未来三个阶段要达成什么]',13,'12 · 未来规划总览模板');
 const phases=['NEAR / 近期','NEXT / 中期','LATER / 远期'];
 phases.forEach((phase,i)=>{let x=M+i*4.07,blue=i===1;box(s,x,2.4,3.89,4.14,blue?C.blue:C.grey);if(!blue)box(s,x,2.4,3.89,.05,C.ink);meta(s,phase,x+.28,2.72,3.3,blue?C.lightBlue:C.helper);tx(s,`[阶段目标${i+1}]`,x+.28,3.15,3.36,.57,25,blue?C.white:C.ink);line(s,x+.28,4.09,3.32,0,blue?C.lightBlue:C.line);tx(s,'[关键能力]\n\n[主要交付]\n\n[前置依赖]',x+.28,4.36,3.28,1.65,15,blue?C.white:C.ink)});
 notes(s,['填写近期、中期和远期的目标。','每一阶段写清能力、交付与前置依赖；阶段名称不自动代表日期承诺。']);
}

// 14 · S16 六项未来能力
{
 const s=pptx.addSlide();s.background={color:C.grey};heading(s,'[将规划拆成可讨论的能力主题]','[六项能力如何组成下一阶段]',14,'13 · 未来能力矩阵模板');
 for(let i=0;i<6;i++){let col=i%3,row=Math.floor(i/3),x=M+col*4.07,y=2.33+row*2.06,blue=i===5;box(s,x,y,3.89,1.88,blue?C.blue:C.white);if(!blue)box(s,x,y,3.89,.04,C.ink);meta(s,`0${i+1} / [主题]`,x+.22,y+.2,3.3,blue?C.lightBlue:C.helper);tx(s,`[规划能力${i+1}]`,x+.22,y+.64,3.35,.47,20,blue?C.white:C.ink);tx(s,'[用户价值]',x+.22,y+1.27,3.35,.33,12.5,blue?C.lightBlue:C.secondary)}
 notes(s,['填写六项规划能力。','每张卡只保留一个能力名称和一条用户价值。']);
}

// 15 · S21 重点规划详页
{
 const s=pptx.addSlide();s.background={color:C.paper};heading(s,'[规划能力名称] / [阶段]','[一项重点规划的价值主张]',15,'14 · 重点规划详页模板');
 box(s,M,2.38,6.45,2.28,C.grey);meta(s,'目标',M+.25,2.69,5.8);tx(s,'[希望解决的问题]',M+.25,3.12,5.8,.62,27,C.ink);tx(s,'[完成后谁会受益，如何受益]',M+.25,4.02,5.8,.36,13,C.secondary);
 line(s,M,5.12,3.02,0,C.blue,1.3);line(s,4.09,5.12,3.02,0,C.ink,1.3);meta(s,'能力',M,5.37,2.8);meta(s,'依赖',4.09,5.37,2.8);tx(s,'[核心交付]',M,5.83,2.82,.48,19,C.ink);tx(s,'[前置条件]',4.09,5.83,2.82,.48,19,C.ink);
 line(s,7.42,2.38,0,4.18);meta(s,'MILESTONE / 里程碑',7.74,2.52,4.7);for(let i=0;i<4;i++){let y=2.98+i*.86;line(s,7.74,y+.74,4.92,0);meta(s,`0${i+1}`,7.74,y+.15,.48,C.blue);tx(s,`[节点${i+1}]`,8.31,y+.1,1.58,.35,17,C.ink);tx(s,'[验收结果]',10.01,y+.11,2.54,.36,12,C.secondary)}
 notes(s,['填写目标、核心交付、前置条件和四个里程碑。','每个里程碑都应能检查是否完成。']);
}

// 16 · S10 收束与讨论
{
 const s=pptx.addSlide();s.background={color:C.paper};box(s,0,0,6.6,H,C.blue);for(let i=0;i<11;i++)line(s,3.1+i*.31,0,0,H,'5478E7',.16);
 meta(s,'15 · 收束与讨论模板',M,.44,5,C.lightBlue);meta(s,'16 / 16',11.67,.44,1,C.helper,'right');
 tx(s,'[最终\n核心结论]',M,2.12,5.37,2.22,50,C.white);meta(s,'景旺电子 × 时代光华',M,6.7,5,C.lightBlue);
 meta(s,'下一步讨论',7.08,.77,3.8);meta(s,'03 ITEMS',11.65,.77,1.0,C.helper,'right');
 for(let i=0;i<3;i++){let y=2.15+i*1.35;meta(s,`0${i+1}`,7.08,y,.55,C.blue);tx(s,`[议题${i+1}]`,7.82,y-.05,1.75,.4,19,C.ink);tx(s,`[需要确认的${['范围','责任','时间'][i]}]`,9.72,y-.04,2.83,.46,13,C.secondary);line(s,7.08,y+.8,5.59,0,i===2?C.blue:C.line,i===2?1.2:.5)}
 meta(s,'→ [会议结束语或演示转场]',9.08,6.68,3.54,C.helper,'right');
 notes(s,['填写最终结论和三个需要讨论的事项。','此页也可作为进入系统演示的转场。']);
}

pptx.writeFile({fileName:path.join(__dirname,'景旺电子人才发展_演示模板.pptx')});
