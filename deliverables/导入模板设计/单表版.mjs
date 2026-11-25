import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out='deliverables/导入模板设计/单表版';
const levels=Array.from({length:10},(_,i)=>`L${i+1}`);
const books=[
 {file:'人才标准导入模板.xlsx',name:'人才标准',notes:[
 '按标准、按岗位导入均使用本表。第8行是示例，不参与导入；从第9行开始填写。',
 '同一标准的每行填写相同的标准编号；新增时自行编一个文件内唯一编号。',
 '每个标准先填写一行“标准信息”，再按需填写岗位、职责、任务、经历、能力、动力、潜力行。',
 '标准信息行填标准名称、类别、应用方式；应用方式为指定岗位时，至少填写一行关联岗位。',
 '任务行需填写所属职责编号；能力、动力、潜力引用系统指标；岗位编号引用系统岗位。',
 '带 * 的列为每行必填；各类型的其他必填字段见下方字段说明。请勿修改表头。'],
 headers:['*标准编号','*内容类型','标准名称','标准类别','标准说明','应用方式','岗位编号','岗位名称','职责编号','职责名称','任务内容','经历要求','指标编号','指标名称','要求等级','排序'],
 sample:['STD001','标准信息','销售经理标准','销售序列','适用于销售经理','指定岗位','','','','','','','','','',''],
 detail:'关联岗位：岗位编号必填；职责：职责编号、职责名称必填；任务：职责编号、任务内容必填；经历：经历要求必填；能力：指标编号、要求等级必填；动力、潜力：指标编号必填。',
 rules:[['B',['标准信息','关联岗位','职责','任务','经历','能力','动力','潜力']],['F',['指定岗位','暂不关联']],['O',levels]]},
 {file:'能力指标导入模板.xlsx',name:'能力指标',notes:[
 '第8行是示例，不参与导入；从第9行开始填写。带 * 的字段必填。',
 '一行填写一个能力等级；同一能力有多个等级时重复填写能力编号、名称、类别和描述。',
 '新增时可自编文件内唯一能力编号；类别填写系统已有的完整路径。',
 '等级支持 L1–L10，同一能力的等级不能重复；每个已填写等级须填写行为描述。',
 '能力不分级时只填一行，等级、等级名称和行为描述留空。',
 '同一能力的名称、类别及描述须保持一致；请勿修改表头。'],
 headers:['*能力编号','*能力名称','*类别路径','能力描述','等级','等级名称','行为描述'],sample:['C001','团队管理','技能 / 管理能力','组织团队并推动目标达成','L1','基础','能按照既定分工完成协作'],
 detail:'同一能力多等级示例：第9、10行都填 C001，分别填写 L1、L2 及各自的行为描述。',rules:[['E',levels]]},
 {file:'人员能力数据导入模板.xlsx',name:'能力数据',notes:[
 '人才中心和人才盘点使用同一结构。第8行是示例，不参与导入；从第9行开始填写。',
 '盘点正式下载时自动带入已选人员的工号、姓名和选定能力；此文件为静态空白样板。',
 '每行一名人员的一项能力结果；工号和能力编号匹配系统已有数据。',
 '能力得分与等级至少填写一项；等级支持 L1–L10，等级不会自动换算分数。',
 '测评日期按 YYYY-MM-DD 填写；分数应使用明确且可比较的评分口径。',
 '带 * 的字段必填。请勿修改表头；本模板不包含部门和岗位字段。'],
 headers:['*工号','姓名','*能力编号','能力名称','能力得分','能力等级','*测评日期','来源说明'],sample:['E001','张三','C001','团队管理',85,'L3','2026-10-15','外部测评'],
 detail:'同一人员有多项能力时，每项能力另填一行。工号建议设置为文本，避免前导零丢失。',rules:[['F',levels]],textCols:['A']},
 {file:'发展序列导入模板.xlsx',name:'发展序列',notes:[
 '第8行是示例，不参与导入；从第9行开始填写。带 * 的字段必填。',
 '一行代表一个发展通道下某一职级的岗位节点；同一序列、职级或通道可在多行重复。',
 '新增序列、职级和通道时可自行编写文件内唯一编号；相同编号的信息须保持一致。',
 '岗位编号匹配系统已有岗位；空节点不填写岗位编号和岗位名称。',
 '同一序列中的职级编码和等级序不能重复；同一节点的重复岗位会被校验。',
 '缺少的行不会自动删除已有节点；请勿修改表头。'],
 headers:['*序列编号','*序列名称','*职级编号','*职级编码','*职级名称','*等级序','*通道编号','*通道名称','通道排序','岗位编号','岗位名称'],sample:['S01','技术序列','LV04','P4','专家',4,'CH01','架构通道',1,'P001','架构师'],
 detail:'同一通道有多个职级时，每个职级另填一行；同一序列和通道信息重复填写。',rules:[]}
];
await fs.mkdir(out,{recursive:true});
for(const b of books){
 const wb=Workbook.create(),s=wb.worksheets.add(b.name);s.showGridLines=false;
 const last=String.fromCharCode(64+b.headers.length);s.getRange(`A:${last}`).format.columnWidth=20;
 for(let i=0;i<6;i++){const row=i+1;s.getRange(`A${row}:${last}${row}`).merge();s.getRange(`A${row}`).values=[[`${i+1}. ${b.notes[i]}${i===5?' '+b.detail:''}`]];s.getRange(`A${row}:${last}${row}`).format={font:{name:'Arial',size:11,color:'#263849'},fill:i===0?'#EAF1F8':'#FFFFFF',rowHeight:i===5?40:26,wrapText:true};}
 s.getRangeByIndexes(6,0,1,b.headers.length).values=[b.headers];s.getRange(`A7:${last}7`).format={fill:'#174B80',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30,wrapText:true};
 s.getRangeByIndexes(7,0,1,b.headers.length).values=[b.sample];s.getRange(`A8:${last}8`).format={fill:'#F1F4F6',font:{name:'Arial',size:11,color:'#637587'},rowHeight:30,wrapText:true};
 s.getRange(`A9:${last}208`).format={font:{name:'Arial',size:11,color:'#243443'},rowHeight:25,borders:{preset:'all',style:'thin',color:'#E0E6ED'}};
 for(const [col,vals] of b.rules)s.getRange(`${col}9:${col}208`).dataValidation={rule:{type:'list',values:vals}};
 for(const col of b.textCols||[])s.getRange(`${col}9:${col}208`).setNumberFormat('@');
 s.freezePanes.freezeRows(7);
 wb.recalculate();const img=await wb.render({sheetName:b.name,range:`A1:${last}11`,scale:1,format:'png'});await fs.writeFile(`/private/tmp/单表-${b.name}.png`,new Uint8Array(await img.arrayBuffer()));
 await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/${b.file}`);console.log(b.file);
}
