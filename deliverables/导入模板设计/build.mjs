import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = 'deliverables/导入模板设计';
const levels = Array.from({length:10}, (_,i)=>`L${i+1}`);
const books = [
 {file:'人才标准导入模板.xlsx', title:'人才标准导入模板', notes:['按标准或岗位导入使用同一模板；带 * 的字段必填。','先填写标准基本信息，再填写需要的内容工作表；相同标准标识用于跨表关联。','应用方式仅支持指定岗位或暂不关联；指定岗位时在关联岗位表填写至少一个岗位。','能力、动力、潜力引用已有指标；岗位引用已有岗位。示例仅供参考，请勿作为真实数据上传。'], sheets:[
  ['标准基本信息',['*标准标识','*标准名称','*标准类别','标准说明','*应用方式'],['STD001','销售经理标准','销售序列','适用于销售经理','指定岗位']],
  ['关联岗位',['*标准标识','*岗位编号','岗位名称'],['STD001','P001','销售经理']],
  ['职责任务',['*标准标识','*职责标识','*职责名称','任务标识','任务内容','排序'],['STD001','D01','销售管理','T01','制定销售计划',1]],
  ['经历经验',['*标准标识','*经历要求','排序'],['STD001','具有团队管理经验',1]],
  ['能力要求',['*标准标识','*能力标识','能力名称','*要求等级','排序'],['STD001','C001','团队管理','L3',1]],
  ['动力要求',['*标准标识','*动力指标标识','指标名称','排序'],['STD001','M001','成就结果',1]],
  ['潜力要求',['*标准标识','*潜力指标标识','指标名称','排序'],['STD001','POT001','分析性',1]]]},
 {file:'能力指标导入模板.xlsx',title:'能力指标导入模板',notes:['带 * 的字段必填。先填写能力指标，再按需填写能力等级。','能力标识用于跨表关联；类别路径填写系统已有的完整路径。','等级支持 L1–L10；能力可以不分级，同一能力的等级不可重复。','示例仅供参考，请勿作为真实数据上传。'],sheets:[
  ['能力指标',['*能力标识','*能力名称','*类别路径','能力描述'],['C001','团队管理','技能 / 管理能力','组织团队并推动目标达成']],
  ['能力等级',['*能力标识','*等级','等级名称','*行为描述'],['C001','L1','基础','能按照既定分工完成协作']]]},
 {file:'人员能力数据导入模板.xlsx',title:'人员能力数据导入模板',notes:['人才中心和人才盘点使用相同字段。盘点正式下载时由系统带入已选人员工号和姓名。','带 * 的字段必填；得分与等级至少填写一项，等级范围 L1–L10。','每行填写一名人员的一项能力；工号和能力标识须与系统已有数据一致。','测评日期格式为 YYYY-MM-DD；分值须采用明确且可比较的口径，等级不自动换算得分。','示例仅供参考，请勿作为真实数据上传。'],sheets:[
  ['能力数据',['*工号','姓名','*能力标识','能力名称','能力得分','能力等级','*测评日期','来源说明'],['E001','张三','C001','团队管理',85,'L3','2026-10-15','外部测评']]]},
 {file:'发展序列导入模板.xlsx',title:'发展序列导入模板',notes:['带 * 的字段必填。依次填写序列与职级、发展通道和岗位节点。','各表以序列、职级、通道标识关联；岗位编号须匹配系统已有岗位。','同一序列中的职级编码和等级序不能重复；缺失行不会自动删除已有节点。','示例仅供参考，请勿作为真实数据上传。'],sheets:[
  ['序列与职级',['*序列标识','*序列名称','*职级标识','*职级编码','*职级名称','*等级序'],['S01','技术序列','L04','P4','专家',4]],
  ['发展通道',['*序列标识','*通道标识','*通道名称','排序'],['S01','CH01','架构通道',1]],
  ['岗位节点',['*序列标识','*通道标识','*职级标识','*岗位编号','岗位名称'],['S01','CH01','L04','P001','架构师']]]}
];

for (const book of books) {
 const wb=Workbook.create();
 const info=wb.worksheets.add('填写说明'); info.showGridLines=false;
 info.getRange('A1:H1').merge(); info.getRange('A1').values=[[book.title]];
 info.getRange('A1:H1').format={fill:'#174B80',font:{name:'Arial',size:16,bold:true,color:'#FFFFFF'},rowHeight:36};
 info.getRange('A2:H2').merge(); info.getRange('A2').values=[['填写说明']]; info.getRange('A2:H2').format={fill:'#EAF1F8',font:{bold:true,color:'#183C60'},rowHeight:28};
 book.notes.forEach((note,i)=>{const row=i+3;info.getRange(`A${row}:H${row}`).merge();info.getRange(`A${row}`).values=[[`${i+1}. ${note}`]];info.getRange(`A${row}:H${row}`).format={wrapText:true,rowHeight:34,font:{name:'Arial',size:11,color:'#263849'}};});
 info.getRange('A:H').format.columnWidth=17;
 for(const [name,headers,example] of book.sheets){
  const s=wb.worksheets.add(name);s.showGridLines=false;const last=String.fromCharCode(64+headers.length);
  s.getRange(`A1:${last}1`).merge();s.getRange('A1').values=[[`${name}：带 * 的字段为必填；请从第 5 行开始填写。`]];
  s.getRange(`A1:${last}1`).format={fill:'#EAF1F8',font:{name:'Arial',size:11,color:'#183C60'},rowHeight:30};
  s.getRange(`A2:${last}2`).merge();s.getRange('A2').values=[['参考示例见“填写示例”工作表；请勿修改表名与表头。']];s.getRange(`A2:${last}2`).format={font:{name:'Arial',size:10,color:'#52677B'},rowHeight:26};
  s.getRangeByIndexes(3,0,1,headers.length).values=[headers];s.getRange(`A4:${last}4`).format={fill:'#174B80',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30,wrapText:true};
  s.getRange(`A5:${last}104`).format={font:{name:'Arial',size:11,color:'#243443'},rowHeight:25,borders:{preset:'all',style:'thin',color:'#E0E6ED'}};
  s.getRange(`A:${last}`).format.columnWidth=22;s.freezePanes.freezeRows(4);
  if(name==='标准基本信息')s.getRange('E5:E104').dataValidation={rule:{type:'list',values:['指定岗位','暂不关联']}};
  if(name==='能力等级')s.getRange('B5:B104').dataValidation={rule:{type:'list',values:levels}};
  if(name==='能力要求')s.getRange('D5:D104').dataValidation={rule:{type:'list',values:levels}};
  if(name==='能力数据'){s.getRange('F5:F104').dataValidation={rule:{type:'list',values:levels}};s.getRange('A5:A104').setNumberFormat('@');}
 }
 const ex=wb.worksheets.add('填写示例');ex.showGridLines=false;ex.getRange('A:H').format.columnWidth=21;
 let row=1;for(const [name,headers,example] of book.sheets){ex.getRange(`A${row}`).values=[[`${name}（仅示例）`]];ex.getRangeByIndexes(row-1,0,1,headers.length).format={fill:'#EAF1F8',font:{bold:true,color:'#183C60'},rowHeight:25};row++;ex.getRangeByIndexes(row-1,0,1,headers.length).values=[headers];ex.getRangeByIndexes(row-1,0,1,headers.length).format={font:{bold:true},rowHeight:24};row++;ex.getRangeByIndexes(row-1,0,1,headers.length).values=[example];ex.getRangeByIndexes(row-1,0,1,headers.length).format={wrapText:true,rowHeight:30};row+=2;}
 wb.recalculate();
 for(const [name] of [['填写说明'],...book.sheets,['填写示例']]){try{const blob=await wb.render({sheetName:name,range:'A1:H9',scale:1,format:'png'});await fs.writeFile(`/private/tmp/${book.title}-${name}.png`,new Uint8Array(await blob.arrayBuffer()));}catch(e){console.error('render',book.title,name,e.message)}}
 await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/${book.file}`);console.log(book.file);
}
