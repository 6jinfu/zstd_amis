import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = new URL('.', import.meta.url).pathname;
const definitions = [
  { name: '绩效数据', file: '绩效数据导入模板.xlsx', headers: ['工号', '姓名', '绩效等级', '绩效得分'], sample: ['示例001', '示例姓名', 'A', 88.5], widths: [26, 22, 24, 28], notes: [
    '导入说明：第 8 行为示例，不参与导入；从第 9 行开始填写，每人一行。',
    '工号、姓名、绩效等级、绩效得分均须填写。工号按文本保存，保留前导零。',
    '绩效得分填写 0–999 之间的数值，包含 0 和 999，最多两位小数；不要填写“分”或百分号。',
    '绩效等级填写原始等级，如 A、B、优秀或良好，不限定为低、中、高；宫格按绩效得分排名分档。',
    '工号须属于本次盘点人员，姓名须与工号一致；同一工号不可重复，空白得分不视为 0。',
    '请保留表头、说明和示例行。页面下载时预填当前盘点人员；未填写等级及得分的预填行不导入。'
  ] },
  { name: '能力测评结果', file: '能力测评结果导入模板.xlsx', headers: ['工号', '姓名', '能力得分'], sample: ['示例001', '示例姓名', 88.5], widths: [26, 26, 48], notes: [
    '导入说明：第 8 行为示例，不参与导入；从第 9 行开始填写，每人一行能力总分。',
    '工号、姓名、能力得分均须填写。工号按文本保存，保留前导零。',
    '能力得分填写 0–999 之间的数值，包含 0 和 999，最多两位小数；不要填写“分”或百分号。',
    '能力得分为本次盘点使用的人员能力总分，不填写分项指标、等级或测评日期。',
    '工号须属于本次盘点人员，姓名须与工号一致；同一工号不可重复，空白得分不视为 0。',
    '请保留表头、说明和示例行。页面下载时预填当前盘点人员；未填写得分的预填行不导入。'
  ] }
];
for (const d of definitions) {
  const wb = Workbook.create(), sheet = wb.worksheets.add(d.name);
  const last = String.fromCharCode(64 + d.headers.length);
  sheet.showGridLines = false;
  d.widths.forEach((width, i) => { sheet.getRange(`${String.fromCharCode(65 + i)}1:${String.fromCharCode(65 + i)}208`).format.columnWidth = width; });
  sheet.getRange(`A1:${last}208`).format = { font: { name: 'Arial', size: 11, color: '#243443' }, verticalAlignment: 'center' };
  d.notes.forEach((note, i) => {
    const row = i + 1, range = sheet.getRange(`A${row}:${last}${row}`);
    range.merge();
    sheet.getRange(`A${row}`).values = [[`${row}. ${note}`]];
    range.format = { wrapText: true, rowHeight: 38, fill: i === 0 ? '#EAF1F8' : '#FFFFFF' };
  });
  sheet.getRange(`A7:${last}7`).values = [d.headers];
  sheet.getRange(`A7:${last}7`).format = { fill: '#174B80', font: { name: 'Arial', size: 11, color: '#FFFFFF', bold: true }, rowHeight: 32 };
  sheet.getRange(`A8:${last}8`).values = [d.sample];
  sheet.getRange(`A8:${last}8`).format = { fill: '#F1F4F6', font: { name: 'Arial', size: 11, color: '#637587' }, rowHeight: 30 };
  sheet.getRange(`A9:${last}208`).format = { rowHeight: 26, borders: { insideHorizontal: { style: 'thin', color: '#E0E6ED' } } };
  sheet.getRange('A8:A208').setNumberFormat('@');
  sheet.getRange(`${last}8:${last}208`).setNumberFormat('0.00');
  sheet.getRange(`${last}8:${last}208`).format.horizontalAlignment = 'right';
  sheet.freezePanes.freezeRows(7);
  wb.recalculate();
  console.log((await wb.inspect({ kind: 'table', range: `${d.name}!A7:${last}9`, tableMaxRows: 3, tableMaxCols: 4 })).ndjson);
  const preview = await wb.render({ sheetName: d.name, range: `A1:${last}12`, scale: 1.5, format: 'png' });
  await fs.writeFile(`${out}/${d.name}.png`, new Uint8Array(await preview.arrayBuffer()));
  await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/${d.file}`);
}

execFileSync('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3', [new URL('add-validation.py', import.meta.url).pathname], { stdio: 'inherit' });
