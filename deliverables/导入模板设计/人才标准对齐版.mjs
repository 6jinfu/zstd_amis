import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out='deliverables/导入模板设计/人才标准导入模板_对齐版.xlsx';
const shared=['*标准名称','*标准类别'];
const a='研发岗位通用标准',b='技术专项标准',ca='研发序列',cb='专项标准';
const sheets=[
 {name:'基本信息和岗位',headers:[...shared,'标准说明','*应用方式','岗位编号','岗位名称'],notes:['本表填写标准的基本信息和适用岗位；星号标记必填字段。','指定岗位时，一行填写一个岗位；同一标准关联多个岗位时重复填写标准基本信息。','暂不关联时，岗位编号和岗位名称留空；不通过导入创建岗位。','同一文件中以“标准名称＋标准类别”对应标准；同一标准重复行的说明和应用方式须一致。','第7至9行为示例，导入时跳过；从第10行开始填写。不要修改工作表名和表头。'],samples:[[a,ca,'适用于研发岗位','指定岗位','RD-302','架构师'],[a,ca,'适用于研发岗位','指定岗位','RD-205','后端开发工程师'],[b,cb,'技术专项要求','暂不关联','','']],rules:[['D',['指定岗位','暂不关联']]]},
 {name:'职责任务',headers:[...shared,'*职责','任务'],notes:['一行填写一项职责及其下一项任务；职责可以不填写任务。','同一职责有多项任务时，重复填写相同的标准名称、标准类别和职责，每行一项任务。','标准名称和标准类别应与“基本信息和岗位”表一致。','职责、任务按填写顺序导入；未使用的内容无需填写。','第7至9行为示例，导入时跳过；从第10行开始填写。'],samples:[[a,ca,'负责系统架构与技术方案','完成架构设计与技术选型'],[a,ca,'负责系统架构与技术方案','推进跨团队技术协作'],[b,cb,'开展技术研究','']],rules:[]},
 {name:'经历经验',headers:[...shared,'*经历经验'],notes:['一行填写一条经历经验；同一标准有多条经历时分别填写。','标准名称和标准类别应与“基本信息和岗位”表一致。','经历经验按填写顺序导入，不需要配置时可不填写本表。','星号标记必填字段；请勿修改工作表名和表头。','第7至9行为示例，导入时跳过；从第10行开始填写。'],samples:[[a,ca,'具有系统设计与技术方案制定经验'],[a,ca,'具有跨团队协作经验'],[b,cb,'具有相关技术领域研究经验']],rules:[]},
 {name:'能力要求',headers:[...shared,'*能力名称','*要求等级'],notes:['一行填写一项能力要求；能力名称需与指标库已有能力一致。','同一标准有多项能力时，每项能力填写一行；要求等级填写 L1–L10。','标准名称和标准类别应与“基本信息和岗位”表一致；能力名称无法唯一匹配时需在导入时处理。','当前原型编辑器仍为 L1–L5；L1–L10 是已确认的目标设计，系统尚需适配。','第7至9行为示例，导入时跳过；从第10行开始填写。'],samples:[[a,ca,'系统架构','L4'],[a,ca,'团队管理','L3'],[b,cb,'系统架构','L3']],rules:[['D',Array.from({length:10},(_,i)=>`L${i+1}`)]]},
 {name:'动力要求',headers:[...shared,'*动力名称'],notes:['一行填写一项动力要求；动力名称需与系统已有动力指标一致。','同一标准有多项动力时，每项动力填写一行；不需要时可不填写本表。','标准名称和标准类别应与“基本信息和岗位”表一致。','名称无法唯一匹配时需在导入时处理；不自动新建固定库指标。','第7至9行为示例，导入时跳过；从第10行开始填写。'],samples:[[a,ca,'成就导向'],[a,ca,'技术钻研'],[b,cb,'成就导向']],rules:[]},
 {name:'潜力要求',headers:[...shared,'*潜力名称'],notes:['一行填写一项潜力要求；潜力名称需与系统已有潜力指标一致。','同一标准有多项潜力时，每项潜力填写一行；不需要时可不填写本表。','标准名称和标准类别应与“基本信息和岗位”表一致。','名称无法唯一匹配时需在导入时处理；不自动新建固定库指标。','第7至9行为示例，导入时跳过；从第10行开始填写。'],samples:[[a,ca,'学习敏锐'],[a,ca,'战略思维'],[b,cb,'学习敏锐']],rules:[]}
];
const wb=Workbook.create();
for(const x of sheets){
 const s=wb.worksheets.add(x.name);s.showGridLines=false;const last=String.fromCharCode(64+x.headers.length);
 s.getRange(`A:${last}`).format.columnWidth=25;
 for(let i=0;i<5;i++){let r=i+1;s.getRange(`A${r}:${last}${r}`).merge();s.getRange(`A${r}`).values=[[`${i+1}. ${x.notes[i]}`]];s.getRange(`A${r}:${last}${r}`).format={fill:i===0?'#EAF1F8':'#FFFFFF',font:{name:'Arial',size:11,color:'#263849'},wrapText:true,rowHeight:32};}
 s.getRangeByIndexes(5,0,1,x.headers.length).values=[x.headers];s.getRange(`A6:${last}6`).format={fill:'#174B80',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30,wrapText:true};
 s.getRangeByIndexes(6,0,3,x.headers.length).values=x.samples;s.getRange(`A7:${last}9`).format={fill:'#F1F4F6',font:{name:'Arial',size:11,color:'#637587'},rowHeight:28,wrapText:true,borders:{preset:'all',style:'thin',color:'#E0E6ED'}};
 s.getRange(`A10:${last}209`).format={font:{name:'Arial',size:11,color:'#243443'},rowHeight:27,borders:{preset:'all',style:'thin',color:'#E0E6ED'}};
 if(x.name==='职责任务'){s.getRange('C:D').format.columnWidth=34;}
 if(x.name==='经历经验')s.getRange('C:C').format.columnWidth=42;
 if(x.name==='基本信息和岗位')s.getRange('C:C').format.columnWidth=32;
 for(const [col,values] of x.rules)s.getRange(`${col}10:${col}209`).dataValidation={rule:{type:'list',values}};
 s.freezePanes.freezeRows(6);
}
wb.recalculate();
for(const x of sheets){const img=await wb.render({sheetName:x.name,range:`A1:${String.fromCharCode(64+x.headers.length)}11`,scale:1,format:'png'});await fs.writeFile(`/private/tmp/标准对齐-${x.name}.png`,new Uint8Array(await img.arrayBuffer()));}
await (await SpreadsheetFile.exportXlsx(wb)).save(out);console.log(out);
