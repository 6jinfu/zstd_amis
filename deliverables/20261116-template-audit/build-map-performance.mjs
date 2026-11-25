import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const workbook=Workbook.create();
const sheet=workbook.worksheets.add('绩效数据');
sheet.getRange('A1:E1').values=[['工号','姓名','部门','岗位','绩效得分']];
sheet.getRange('A1:E1').format.font.bold=true;
sheet.getRange('A1:E1').format.fill='#E8F0FA';
sheet.getRange('A:E').format.columnWidth=20;
sheet.getRange('A:A').numberFormat='@';
sheet.freezePanes.freezeRows(1);
await fs.mkdir('app/templates',{recursive:true});
await (await SpreadsheetFile.exportXlsx(workbook)).save('app/templates/review-map-performance.xlsx');
const preview=await workbook.render({sheetName:'绩效数据',range:'A1:E6',scale:1,format:'png'});
await fs.writeFile('deliverables/20261116-template-audit/绩效模板预览.png',new Uint8Array(await preview.arrayBuffer()));
