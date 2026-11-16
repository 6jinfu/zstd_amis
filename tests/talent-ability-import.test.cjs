const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {}, Standards: { people: [{ name: '张明' }] }, localStorage: { getItem: () => null }, crypto: require('node:crypto').webcrypto };
for (const name of ['talent-data.js', 'indicator-data.js', 'review-score-import.js', 'talent-ability-import.js']) {
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../app/' + name), 'utf8'), context);
  Object.assign(context, context.window);
}
const importer = context.TalentAbilityImport, people = [{ id: 'person-1', employeeId: '0001', name: '测试人员' }];
const row = (changes = {}, number = 4) => ({ number, cells: ['0001', '测试人员', '技能.管理能力', '团队管理', '3', '0'], ...changes });
test('retains leading-zero IDs and zero scores; grades and optional scores are independent', () => {
  const result = importer.validate([row()], people);
  assert.equal(result.errors.length, 0);
  assert.equal(result.records[0].employeeId, '0001'); assert.equal(result.records[0].score, 0); assert.equal(result.records[0].level, 3);
  const blank = row(); blank.cells[5] = '';
  assert.equal(importer.validate([blank], people).records[0].score, null);
  for (const level of ['1', '10']) { const r = row(); r.cells[4] = level; assert.equal(importer.validate([r], people).errors.length, 0); }
});
test('rejects unknown/mismatched people, category/name pairs, invalid levels, scores and formulas', () => {
  for (const [index, value] of [[0, '0002'], [1, '错误姓名'], [2, '技能'], [3, '未知能力'], [4, '0'], [4, '11'], [4, 'L3'], [4, '2.5'], [5, '1000'], [5, '999.01'], [5, '0.001'], [5, '-1']]) {
    const r = row(); r.cells[index] = value; assert.equal(importer.validate([r], people).errors.length, 1, index + ':' + value);
  }
  assert.equal(importer.validate([row({ formula: true })], people).errors.length, 1);
  assert.equal(importer.validate([row(), row({}, 10)], people).errors.length, 1);
  assert.equal(importer.validate([row({ cells: [] })], people).errors.length, 1);
  assert.equal(importer.validate(Array.from({ length: 2001 }, () => row()), people).records.length, 0);
});
test('append retains history and unimported abilities; latest valid result replaces a higher historical grade', () => {
  const today = context.Talent.today();
  const data = { evidence: [{ id: 'original', person: 'person-1', date: '2020-01-01', values: [['团队管理', 5], ['沟通', 4]] }] };
  const records = importer.validate([row()], people).records;
  importer.append(data, records, today + 'T01:00:00Z');
  const values = context.Talent.values(data, 'person-1');
  assert.equal(data.evidence.length, 2); assert.equal(data.evidence[0].values[0][1], 5);
  assert.equal(values.get('团队管理').value, 3); assert.equal(values.get('沟通').value, 4);
  assert.equal(values.get('团队管理').record.abilityImport.score, 0);
  importer.append(data, [{ ...records[0], level: 2 }], today + 'T02:00:00Z');
  assert.equal(context.Talent.values(data, 'person-1').get('团队管理').value, 2);
  data.evidence.push({ person: 'person-1', date: '2099-01-01', values: [['团队管理', 10]] });
  data.evidence.push({ person: 'person-1', date: '2021-01-01', validUntil: '2021-12-31', values: [['团队管理', 9]] });
  assert.equal(context.Talent.values(data, 'person-1').get('团队管理').value, 2);
  assert.equal(context.Talent.requirements({ content: { cap: [['团队管理', 'L10']] } })[0].threshold, 10);
});
