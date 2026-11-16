const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
for (const file of ['review-grid-content.js', 'review-score-import.js', 'review-distribution.js']) vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../app', file), 'utf8'), context);
const { validScore, validate } = context.window.ReviewScoreImport;
const { balance } = context.window.ReviewDistribution;
const people = [{ id: '0001', name: '测试人员' }];
test('scores include zero and 999, and reject excess precision or out-of-range values', () => {
  for (const value of ['0', '0.01', '88.5', '998.99', '999', '999.00']) assert.equal(validScore(value), true, value);
  for (const value of ['', '-0.01', '999.01', '1000', '1.001', 'NaN', '88分', '88%', '0x10', '1e2']) assert.equal(validScore(value), false, value);
});
test('person totals retain zero and leading-zero employee IDs; unused prefilled rows are ignored', () => {
  const result = validate([{ number: 9, cells: ['0001', '测试人员', '外部测评', '2026-01-01', '2026-01-31', '0'] }, { number: 10, cells: ['0001', '测试人员', '', '', '', ''] }], people, 'ability');
  assert.equal(result.errors.length, 0);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].score, 0);
  assert.equal(result.records[0].employeeId, '0001');
});
test('performance imports a numeric score without a grade and ignores unfilled roster rows', () => {
  assert.equal(validate([{ number: 4, cells: ['0001', '测试人员', '999'] }], people, 'performance').errors.length, 0);
  assert.equal(validate([{ number: 4, cells: ['0001', '测试人员', '0'] }, { number: 5, cells: ['0001', '测试人员', ''] }], people, 'performance').records.length, 1);
  assert.equal(validate([{ number: 4, cells: ['0001', '测试人员', 'A'] }], people, 'performance').errors.length, 1);
  assert.equal(validate([{ number: 4, cells: ['0001', '测试人员', '88'] }, { number: 5, cells: ['0001', '测试人员', '89'] }], people, 'performance').errors.length, 1);
});
test('legacy performance grades convert exactly once and valid scores remain unchanged',()=>{
  const convert=context.window.ReviewScoreImport.performanceScore;
  for(const [value,score] of [['低',1],['中',2],['高',3],['0',0],['999',999],['88.25',88.25]])assert.equal(convert(value),score);
  for(const value of ['',null,'优秀','1000'])assert.equal(convert(value),null);
});
test('duplicate project rows, mismatched names, unknown people and cached formulas are rejected', () => {
  const row=(number,id,name,score,formula=false)=>({number,cells:[id,name,'外部测评','2026-01-01','2026-01-31',score],formula});
  const rows = [row(9,'0001','测试人员','88'),row(10,'0001','测试人员','89'),row(11,'0001','错误姓名','90'),row(12,'0002','测试人员','90'),row(13,'0001','测试人员','88',true)];
  assert.equal(validate(rows, people, 'ability').errors.length, 4);
});
test('同一人员不同项目可导入，日期和必填项目必须有效',()=>{
  const rows=[{number:9,cells:['0001','测试人员','项目一','2026-01-01','2026-01-31','60']},{number:10,cells:['0001','测试人员','项目二','2026-02-01','2026-02-28','80']}];
  assert.equal(validate(rows,people,'ability').records.length,2);
  assert.equal(validate([{number:9,cells:['0001','测试人员','','2026-02-01','2026-01-01','80']}],people,'ability').errors.length,1);
});
test('最新结束日期优先，同日按最后导入的记录取分，不取最高分',()=>{
  const records=[{employeeId:'001',endDate:'2026-11-10',score:999},{employeeId:'001',endDate:'2026-11-16',score:80},{employeeId:'002',endDate:'2026-11-12',score:0},{employeeId:'001',endDate:'2026-11-16',score:60},{employeeId:'001',endDate:'2026-11-01',score:100}];
  const latest=context.window.ReviewScoreImport.latestScores(records);
  assert.equal(latest.find(record=>record.employeeId==='001').score,60);
  assert.equal(latest.find(record=>record.employeeId==='002').score,0);
  assert.equal(records.length,5);
});
test('two through five bands preserve 100% and the 5% minimum after changes at every index', () => {
  for (let count = 2; count <= 5; count++) {
    const base = Array(count).fill(20); base[0] += 100 - count * 20;
    for (let index = 0; index < count; index++) for (const value of [-10, 0, 5, 17, 50, 100, 1000]) {
      const result = balance(base, index, value);
      assert.equal(result.reduce((sum, item) => sum + item, 0), 100);
      assert.ok(result.every(item => item >= 5 && item <= 100 - (count - 1) * 5));
      assert.equal(base.reduce((sum, item) => sum + item, 0), 100);
    }
  }
});

test('all 25 cells have a distinct position, interpretation and suggested action; 2–5 band mappings are complete', () => {
  const model = context.window.ReviewGridContent;
  const names = new Set(), descriptions = new Set();
  for (let performance = 0; performance < 5; performance++) for (let ability = 0; ability < 5; ability++) {
    const cell = model.get(ability, performance, 5, 5);
    names.add(cell.name); descriptions.add(cell.desc);
    assert.ok(cell.desc.length > 8 && cell.action.length > 8);
  }
  assert.equal(names.size, 25); assert.equal(descriptions.size, 25);
  for (let a = 2; a <= 5; a++) for (let p = 2; p <= 5; p++) {
    assert.ok(model.get(a - 1, p - 1, a, p).name === '明星员工');
    assert.ok(model.get(0, 0, a, p).name === '重点关注员工');
  }
});

test('every 2–5 by 2–5 result geometry conserves the complete project total in either axis direction', () => {
  const source = fs.readFileSync(require('node:path').join(__dirname, '../app/review-detail.html'), 'utf8');
  const start = source.indexOf('  function cellKey(');
  const end = source.indexOf("  document.getElementById('review-grid-total')", start);
  const implementation = source.slice(start, end);
  const counts = {};
  for (let p = 0; p < 3; p++) for (let a = 0; a < 3; a++) counts['y' + p + '-x' + a] = p * 3 + a + 1;
  for (let x = 2; x <= 5; x++) for (let y = 2; y <= 5; y++) for (const xaxis of ['ability', 'performance']) {
    const ctx = { params: new URLSearchParams('grid=' + x + 'x' + y), xAxisName: xaxis, yAxisName: xaxis === 'ability' ? 'performance' : 'ability', matrixCounts: counts };
    vm.runInNewContext(implementation, ctx);
    assert.equal(ctx.matrixDistribution.flat().reduce((sum, value) => sum + value, 0), 45);
    assert.equal(ctx.matrixDistribution.length, xaxis === 'performance' ? x : y);
    assert.ok(ctx.matrixDistribution.every(row => row.length === (xaxis === 'ability' ? x : y) && row.every(value => Number.isInteger(value) && value >= 0)));
  }
});
