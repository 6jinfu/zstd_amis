import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const curl = promisify(execFile);
const root = import.meta.dirname;
const mapping = fs.existsSync(path.join(root, 'assets.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'assets.json'))) : {};
const downloads = new Map();
function add(url, file) { downloads.set(url, file); }
for (const name of ['map', 'detail', 'ability', 'skills']) {
  const js = fs.readFileSync(path.join(root, 'source', name + '.js'), 'utf8');
  for (const match of js.matchAll(/\.p\+"((?:img|fonts)\/[^"\s]+)"/g)) {
    if (name === 'map' && match[1].includes('zccx')) continue;
    add('https://v4static.21tb.com/frontend-h5/' + match[1], match[1]);
  }
}
const css = fs.readFileSync(path.join(root, 'source', 'map.css'), 'utf8');
for (const match of css.matchAll(/url\(\.\.\/([^)]*)\)/g)) add('https://v4static.21tb.com/frontend-h5/' + match[1], match[1]);
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'data.json')));
function walk(value, key) {
  if (Array.isArray(value)) value.forEach(item => walk(item, key));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => walk(v, k));
  else if (typeof value === 'string' && ['coverImgUrl', 'coverId', 'imagePathList'].includes(key) && /^https?:\/\//.test(value)) {
    const url = new URL(value);
    const file = 'assets/' + Buffer.from(url.href).toString('base64url').slice(0, 170) + path.extname(url.pathname);
    add(value, file);
    mapping[value] = file;
  } else if (key === 'coverImgUrl' && typeof value === 'string' && value.startsWith('coverbook')) {
    const file = 'assets/' + value + '.png';
    add('https://v4.21tb.com/web-static/assets/courseV2/coverImg/' + value + '.png', file);
    mapping[value] = file;
  }
}
walk(fixtures, '');
const pending = [...downloads];
let count = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (pending.length) {
    const [url, file] = pending.shift();
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target)) await curl('curl', ['-f', '-sS', '-L', '--max-time', '45', encodeURI(url), '-o', target]);
    count++;
  }
}));
fs.writeFileSync(path.join(root, 'assets.json'), JSON.stringify(mapping, null, 2));
console.log('Original assets saved:', count);
