import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(await fs.readFile(path.join(root,'font-source.json'),'utf8'));
for(const f of source.files){const b=await fs.readFile(path.join(root,'assets',f.name));const sha=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');if(sha!==f.sha)throw new Error('Font checksum mismatch');}
const expected=[['intro','人才标准 · 评鉴盘点 · 学习方案'],['outro','让岗位有标准，识人有依据，培养有方向']];
const report={fontChecksumsPassed:true,parts:[]};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage({viewport:{width:1728,height:1117},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(root,'index.html')).href+'?t=2');await page.evaluate(()=>window.fontsReady);
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const doc=await cdp.send('DOM.getDocument');
 for(let i=0;i<2;i++){
  await page.evaluate(t=>window.seekIntroOutro(t),i*5+2);
  const [id,detail]=expected[i];
  const info=await page.evaluate(id=>{
   const c=document.getElementById(id);
   return{visible:[...document.querySelectorAll('.part')].filter(e=>getComputedStyle(e).visibility==='visible'&&Number(getComputedStyle(e).opacity)>.99).map(e=>e.id),title:c.querySelector('h1').textContent,detail:c.querySelector('.detail').textContent,boxes:[...c.querySelectorAll('.glyph,.detail-text')].map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,opacity:Number(getComputedStyle(e).opacity)};}),fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))};
  },id);
  if(info.visible.length!==1||info.visible[0]!==id||info.title!=='人才发展'||info.detail!==detail)throw new Error('Content mismatch');
  if(info.fonts.some(f=>f.status!=='loaded')||info.boxes.some(b=>b.left<96||b.right>1632||b.opacity!==1))throw new Error('Font / safe area');
  const nodes=await cdp.send('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'#'+id+' .glyph,#'+id+' .detail-text'}),actual=[];
  for(const nodeId of nodes.nodeIds){const used=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});if(used.fonts.length!==1||!used.fonts[0].isCustomFont||!used.fonts[0].familyName.includes('Source Han Sans'))throw new Error('Font fallback');actual.push(used.fonts[0].postScriptName);}
  report.parts.push({id,...info,actualFonts:[...new Set(actual)],passed:true});
 }
 await page.evaluate(()=>window.seekIntroOutro(5));report.cutOpacity=await page.evaluate(()=>Number(getComputedStyle(document.getElementById('white-cover')).opacity));if(report.cutOpacity!==1)throw new Error('Intro cut must be white');
 await page.evaluate(()=>window.seekIntroOutro(9.983333333));
 report.outroEnd=await page.evaluate(()=>({visible:getComputedStyle(document.getElementById('outro')).visibility,opacity:Number(getComputedStyle(document.getElementById('outro')).opacity),cover:Number(getComputedStyle(document.getElementById('white-cover')).opacity)}));
 if(report.outroEnd.visible!=='visible'||report.outroEnd.opacity!==1||report.outroEnd.cover!==0)throw new Error('Outro text must remain visible');
 await fs.writeFile(path.join(root,'content-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Passed: exact copy, official fonts without fallback, safe areas, white intro ending and held outro ending.');
}finally{await browser.close();}
