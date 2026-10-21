import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require('/Users/jeff/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report=[];
try{
 for(const id of ['intro','outro']){
  const page=await browser.newPage({viewport:{width:1728,height:1117},deviceScaleFactor:1});
  await page.goto(pathToFileURL(path.join(root,id,'index.html')).href+'?t=5');
  await page.evaluate(()=>window.fontsReady);
  await page.evaluate(()=>window.seekIntro(5));
  const content=await page.evaluate(()=>({
   title:document.querySelector('h1').textContent,
   claim:document.querySelector('.claim').textContent,
   loaded:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),
   boxes:[...document.querySelectorAll('.glyph,.claim-text')].map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,font:getComputedStyle(e).fontFamily};})
  }));
  const expected=id==='intro'?'项目设计，SO easy！':'从培养需求到项目方案，SO easy！';
  if(content.title!=='AI 帮建'||content.claim!==expected)throw new Error('Copy differs: '+id);
  if(content.loaded.length!==2||content.loaded.some(f=>f.status!=='loaded'))throw new Error('Font did not load');
  if(content.boxes.some(b=>b.left<90||b.right>1638))throw new Error('Insufficient text safe area');
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const doc=await cdp.send('DOM.getDocument');
  const nodes=await cdp.send('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'.glyph,.claim-text'});
  const actual=[];
  for(const nodeId of nodes.nodeIds){
   const fonts=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
   if(fonts.fonts.length!==1||!fonts.fonts[0].isCustomFont||!fonts.fonts[0].familyName.includes('Source Han Sans'))throw new Error('Unexpected fallback font: '+JSON.stringify(fonts));
   actual.push(fonts.fonts);
  }
  report.push({clip:id,...content,actualFonts:actual,passed:true});
  await page.close();
 }
 await fs.writeFile(path.join(root,'font-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Verified exact copy, text safe areas, loaded fonts, and actual Chinese/Latin font rendering for both clips.');
}finally{await browser.close();}
