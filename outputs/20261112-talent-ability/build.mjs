import fs from 'node:fs/promises';
import vm from 'node:vm';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = new URL('.', import.meta.url).pathname;
const root = new URL('../../', import.meta.url).pathname;
const context = { window: {} };
for (const name of ['standard-seeds.js', 'standards-data.js', 'talent-data.js', 'indicator-data.js', 'talent-ability-import.js']) {
  vm.runInNewContext(await fs.readFile(root + 'app/' + name, 'utf8'), context);
  Object.assign(context, context.window);
}
const wb = Workbook.create(), sheet = wb.worksheets.add('人员能力数据'), reference = wb.worksheets.add('填写参考');
for (const s of [sheet, reference]) {
  s.showGridLines = false;
  s.getRange('A1:G208').format = { font: { name: 'Arial', size: 11, color: '#243443' }, verticalAlignment: 'center', rowHeight: 28 };
}
[20, 16, 40, 24, 16, 18, 26].forEach((width, index) => { sheet.getRange(`${String.fromCharCode(65 + index)}1:${String.fromCharCode(65 + index)}208`).format.columnWidth = width; });
const notes = [
  '导入说明：第 8 行为示例，不参与导入；从第 9 行开始填写，每人每项能力一行，每次最多 2000 条。',
  '必填工号、姓名、能力类别、能力名称、能力等级和来源；能力得分选填。工号按文本保存，保留前导零。',
  '人员须已存在，姓名与工号一致；类别与名称须匹配能力词典。多级类别用英文句号连接，如“技能.管理能力”；详见“填写参考”。',
  '能力等级下拉选择 1–10，对应 L1–L10。能力得分填写 0–999，最多两位小数；0 为有效分数，空白不等于 0。',
  '同一人员、同一能力在本文件中不可重复。来源填写实际来源，如“线下能力评估”，最多 100 字。填写实际值，不使用公式。',
  '确认后保留历史与未导入的能力，采用最新有效等级；得分单独保留。请保留说明、表头和示例行，文件另存为 .xlsx 后上传。'
];
notes.forEach((note, i) => {
  const row = i + 1, range = sheet.getRange(`A${row}:G${row}`); range.merge();
  sheet.getRange(`A${row}`).values = [[`${row}. ${note}`]];
  range.format = { wrapText: true, rowHeight: 38, fill: i === 0 ? '#EAF1F8' : '#FFFFFF' };
});
const heading = { fill: '#174B80', font: { name: 'Arial', size: 11, color: '#FFFFFF', bold: true }, rowHeight: 32 };
sheet.getRange('A7:G7').values = [context.TalentAbilityImport.headers]; sheet.getRange('A7:G7').format = heading;
sheet.getRange('A8:G8').values = [['EMP-1026', '张明', '技能.管理能力', '团队管理', 3, 88.5, '线下能力评估']];
sheet.getRange('A8:G8').format = { fill: '#F1F4F6', font: { name: 'Arial', size: 11, color: '#637587' } };
sheet.getRange('A9:G208').format.borders = { insideHorizontal: { style: 'thin', color: '#E0E6ED' } };
sheet.getRange('A8:D208').setNumberFormat('@'); sheet.getRange('G8:G208').setNumberFormat('@');
sheet.getRange('E8:E208').setNumberFormat('0'); sheet.getRange('F8:F208').setNumberFormat('0.00');
sheet.getRange('E9:E2008').dataValidation = { rule: { type: 'list', values: Array.from({ length: 10 }, (_, i) => String(i + 1)) } };
sheet.freezePanes.freezeRows(7);
[20, 16, 4, 40, 26].forEach((width, index) => { reference.getRange(`${String.fromCharCode(65 + index)}1:${String.fromCharCode(65 + index)}40`).format.columnWidth = width; });
reference.getRange('A1:B1').merge(); reference.getRange('A1').values = [['当前原型人员（演示数据）']];
reference.getRange('D1:E1').merge(); reference.getRange('D1').values = [['能力类别与名称']];
reference.getRange('A1:B1').format = heading; reference.getRange('D1:E1').format = heading;
reference.getRange('A2:B2').values = [['工号', '姓名']]; reference.getRange('D2:E2').values = [['能力类别', '能力名称']];
reference.getRange('A2:B2').format.fill = '#EAF1F8'; reference.getRange('D2:E2').format.fill = '#EAF1F8';
reference.getRange('A3:B7').values = context.Talent.people.map(p => [p.employeeId, p.name]);
const abilities = context.TalentAbilityImport.catalog();
reference.getRange(`D3:E${abilities.length + 2}`).values = abilities.map(item => [item.category, item.name]);
reference.getRange('A3:A7').setNumberFormat('@'); reference.freezePanes.freezeRows(2);
wb.recalculate();
console.log((await wb.inspect({ kind: 'table', range: '人员能力数据!A7:G9', tableMaxRows: 3, tableMaxCols: 7 })).ndjson);
console.log((await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 10 } })).ndjson);
for (const [name, range] of [['人员能力数据', 'A1:G12'], ['填写参考', `A1:E${abilities.length + 2}`]]) {
  const preview = await wb.render({ sheetName: name, range, scale: 1.4, format: 'png' });
  await fs.writeFile(out + name + '.png', new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(out + '人员能力数据导入模板.xlsx');
