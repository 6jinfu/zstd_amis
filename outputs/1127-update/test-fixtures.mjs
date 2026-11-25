import fs from 'node:fs/promises';
import { FileBlob,SpreadsheetFile } from '@oai/artifact-tool';
const dir=new URL('./fixtures/',import.meta.url).pathname;
await fs.mkdir(dir,{recursive:true});
async function fixture(template,name,rows){
  const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(new URL('../../app/templates/'+template,import.meta.url).pathname));
  for(const [sheetName,address,values] of rows)wb.worksheets.getItem(sheetName).getRange(address).values=values;
  wb.recalculate();await (await SpreadsheetFile.exportXlsx(wb)).save(dir+name+'.xlsx');
}
await fixture('talent-standard-import.xlsx','standard',[
  ['基本信息和岗位','A6:H6',[['TEST1127','1127 导入验收标准','专项标准','本地功能验收示例','指定岗位','RD-302','研发','架构师']]],
  ['职责任务','A6:E6',[['TEST1127','1127 导入验收标准','专项标准','负责技术设计','完成设计评审']]],
  ['经历经验','A6:D6',[['TEST1127','1127 导入验收标准','专项标准','具有架构设计经验']]],
  ['能力要求','A6:F6',[['TEST1127','1127 导入验收标准','专项标准','架构核心能力','系统架构','L10']]],
  ['动力要求','A6:D6',[['TEST1127','1127 导入验收标准','专项标准','成就导向']]],
  ['潜力要求','A6:D6',[['TEST1127','1127 导入验收标准','专项标准','学习敏锐']]]
]);
await fixture('indicator-ability-import.xlsx','indicator',[
  ['胜任力词典-导入模板','A4:F4',[['团队管理','技能.管理能力','技能','本地导入验收定义','理解目标','按计划执行']]]
]);
await fixture('talent-person-ability.xlsx','person',[
  ['人员能力数据','A4:F4',[['EMP-1026','张明','技能.管理能力','团队管理',3,0]]]
]);
await fixture('review-external-ability-score.xlsx','external',[
  ['测评结果','A4:F5',[['EMP-1026','张明','1127 外部测评验收','2026-11-01','2026-11-16',0],['EMP-1088','李华','1127 外部测评验收','2026-11-01','2026-11-16',999]]]
]);
await fixture('review-performance.xlsx','performance',[
  ['绩效数据','A4:C5',[['EMP-1026','张明',0],['EMP-1088','李华',999]]]
]);
