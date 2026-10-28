import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = import.meta.dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(root, 'assets.json'), 'utf8'));
const files = {
  'app.js': 'js/app.03651038.js',
  'libs.js': 'js/chunk-libs.c9f15ad3.js',
  'vant.js': 'js/chunk-vantUI.904d4e79.js',
  'vant.css': 'css/chunk-vantUI.7f32843f.css',
  'common.js': 'js/chunk-35cab158.574b5029.js',
  'common.css': 'css/chunk-35cab158.b03e573d.css',
  'shared.js': 'js/chunk-74e14855.6eec54c6.js',
  'shared.css': 'css/chunk-74e14855.9c09efb1.css',
  'map.js': 'js/chunk-0ea63994.6fb2ba9c.js',
  'map.css': 'css/chunk-0ea63994.64452f83.css',
  'detail.js': 'js/chunk-5a63389c.d53a29e7.js',
  'detail.css': 'css/chunk-5a63389c.b5993caf.css',
  'chart-a.js': 'js/chunk-5d442d1d.87d3b4d1.js',
  'chart-b.js': 'js/chunk-6e83591c.22ec3898.js',
  'chart-c.js': 'js/chunk-26273ac2.f6f584aa.js',
  'ability.js': 'js/chunk-4f3267c3.d839874d.js',
  'ability.css': 'css/chunk-4f3267c3.6274782e.css',
  'skills.js': 'js/chunk-3fd2cbd2.645b4730.js',
  'skills.css': 'css/chunk-3fd2cbd2.aa68d92e.css',
};
const provenance = Object.entries(files).map(([file, url]) => {
  const bytes = fs.readFileSync(path.join(root, 'source', file));
  assert(!bytes.toString('utf8', 0, 20).includes('<html'), 'Failed source download: ' + file);
  return { file: 'source/' + file, originalUrl: 'https://v4static.21tb.com/frontend-h5/' + url, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
const w = { webpackJsonp: [] };
for (const file of Object.keys(files).filter(f => f.endsWith('.js'))) vm.runInNewContext(fs.readFileSync(path.join(root, 'source', file), 'utf8'), { window: w });
const modules = Object.assign({}, ...w.webpackJsonp.map(chunk => chunk[1]));
for (const id of ['f6c8', 'c402', 'a97f', '3f82', '2b0e', '313e']) assert(modules[id], 'Missing original component: ' + id);
for (const file of Object.values(assets)) assert(fs.statSync(path.join(root, file)).size > 0, 'Missing original image: ' + file);
assert(!/elnSessionId\.[a-z0-9]+|"password"|"idCard"|"mobile"/.test(JSON.stringify(data)), 'Unexpected personal data or session credential');
const positions = data['POST /uc/html/h5/positiongrade/curLoginPositionCart.do {}'].bizResult;
const summaries = positions.flatMap(s => s.positionSequenceDetails.map(n => ({ name: n.positionSequenceDetailName, id: n.positionId, visible: s.positionSequenceDetails.indexOf(n) < 10 })));
for (const node of summaries) {
  const keys = Object.keys(data).filter(k => k.includes(node.id));
  assert(keys.some(k => k.includes('findPositionBaseInfo')), 'Missing base: ' + node.name);
  assert(keys.filter(k => k.includes('findUserLearnPlanCourse')).length >= 3, 'Missing filters: ' + node.name);
  assert(keys.filter(k => k.includes('findUserLearnPlanIdp')).length === 5, 'Missing IDP filters: ' + node.name);
  assert(keys.filter(k => k.includes('findUserLearnPlanExam')).length === 2, 'Missing pre/post assessment: ' + node.name);
}
fs.writeFileSync(path.join(root, 'provenance.json'), JSON.stringify({ capturedAt: '2026-09-30', sourceEntry: 'https://v4.21tb.com/frontend-h5/#/jobSysH5', originalFiles: provenance, originalModules: Object.keys(modules).length, responses: Object.keys(data).length, assetReferences: Object.keys(assets).length, positions: summaries }, null, 2));
console.log(JSON.stringify({ originalFiles: provenance.length, modules: Object.keys(modules).length, responses: Object.keys(data).length, positions: summaries.length, visiblePositions: summaries.filter(n => n.visible).length, assetReferences: Object.keys(assets).length, status: 'passed' }, null, 2));
