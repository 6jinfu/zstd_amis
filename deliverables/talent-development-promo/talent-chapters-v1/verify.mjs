import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(await fs.readFile(path.join(root,'font-source.json'),'utf8'));
for(const f of source.files){const bytes=await fs.readFile(path.join(root,'assets',f.name));const sha=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');if(sha!==f.sha)throw new Error('Font source mismatch');}
const expected=[
 ['需要什么样的人？','组织与关键岗位分析 · 人才标准'],
 ['现在的人怎么样？','360 评估 · 人才盘点'],
 ['知道差距以后怎么办？','岗位地图 · 学习方案 · 人才中心']
];
const report={fontChecksumsPassed:true,chapters:[],cuts:[]};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage({viewport:{width:1728,height:1117},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(root,'index.html')).href+'?t=2');
 await page.evaluate(()=>window.fontsReady);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const doc=await cdp.send('DOM.getDocument');
 for(let i=0;i<3;i++){
  const t=i*4+2;await page.evaluate(t=>window.seekChapters(t),t);
  const info=await page.evaluate(i=>{
   const visible=[...document.querySelectorAll('.chapter')].filter(e=>getComputedStyle(e).visibility==='visible'&&Number(getComputedStyle(e).opacity)>.99);
   const c=document.getElementById('chapter-'+(i+1));
   const number=c.querySelector('.chapter-number'),numberRect=number.getBoundingClientRect(),questionRect=c.querySelector('.glyph').getBoundingClientRect();
   return {visible:visible.map(e=>e.id),number:number.textContent,numberBottom:numberRect.bottom,questionTop:questionRect.top,title:c.querySelector('h2').textContent,detail:c.querySelector('.detail').textContent,boxes:[...c.querySelectorAll('.chapter-number,.glyph,.detail-text')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,opacity:getComputedStyle(e).opacity};}),cover:Number(getComputedStyle(document.getElementById('white-cover')).opacity),fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))};
  },i);
  if(info.visible.length!==1||info.visible[0]!=='chapter-'+(i+1))throw new Error('Chapter visibility');
  if(info.title!==expected[i][0]||info.detail!==expected[i][1])throw new Error('Copy differs');
  if(info.number!==String(i+1).padStart(2,'0')||info.numberBottom>info.questionTop-16)throw new Error('Chapter number / spacing');
  if(info.cover!==0||info.fonts.some(f=>f.status!=='loaded')||info.boxes.some(b=>b.left<96||b.right>1632||Number(b.opacity)!==1))throw new Error('Text / font / safe area');
  const nodes=await cdp.send('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'#chapter-'+(i+1)+' .chapter-number,#chapter-'+(i+1)+' .glyph,#chapter-'+(i+1)+' .detail-text'});
  const fonts=[];
  for(const nodeId of nodes.nodeIds){const used=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});if(used.fonts.length!==1||!used.fonts[0].isCustomFont||!used.fonts[0].familyName.includes('Source Han Sans'))throw new Error('Font fallback');fonts.push(used.fonts[0].postScriptName);}
  report.chapters.push({time:t,...info,actualFonts:[...new Set(fonts)],passed:true});
 }
 for(const t of [4,8,12]){
  await page.evaluate(t=>window.seekChapters(t),t);
  const opacity=await page.evaluate(()=>Number(getComputedStyle(document.getElementById('white-cover')).opacity));
  if(opacity!==1)throw new Error('Cut is not white: '+t);
  report.cuts.push({time:t,whiteCoverOpacity:opacity});
 }
 await fs.writeFile(path.join(root,'content-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Passed: 01/02/03 sequence, number spacing, three chapter titles, functional labels, safe areas, official fonts without fallback, and white cut boundaries.');
}finally{await browser.close();}
