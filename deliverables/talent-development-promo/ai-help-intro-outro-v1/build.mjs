import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const previous=path.resolve(root,'../title-intro-v4/assets');
const fonts=[
 {name:'SourceHanSansSC-Bold.otf',sha:'3b33e77fce75424e20c90eb2feaa489e38ebe9d7'},
 {name:'SourceHanSansSC-Medium.otf',sha:'304b3e6cc2eb1b0c694d53fba21107fe83116cea'}
];
for(const font of fonts){
 const data=await fs.readFile(path.join(root,'assets',font.name));
 const sha=crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
 if(sha!==font.sha)throw new Error('Official font checksum mismatch: '+font.name);
}
const scene=(await fs.readFile(path.join(previous,'scene.js'),'utf8'))
 .replace('function(canvas){','function(canvas,options={}){')
 .replace('leave=smooth((t-6.95)/1.05)','leave=options.exit===false?0:smooth((t-6.95)/1.05)')
 .replace('const exit=smooth((t-7.03)/.97)','const exit=options.exit===false?0:smooth((t-7.03)/.97)');
const clips=[
 {id:'intro',label:'片头',copy:'项目设计，SO easy！',first:'项目设计，',size:112,exit:true},
 {id:'outro',label:'片尾',copy:'从培养需求到项目方案，SO easy！',first:'从培养需求到项目方案，',size:84,exit:false}
];
for(const clip of clips){
 const folder=path.join(root,clip.id),assets=path.join(folder,'assets');
 await fs.mkdir(assets,{recursive:true});
 for(const font of fonts)await fs.copyFile(path.join(root,'assets',font.name),path.join(assets,font.name));
 await fs.copyFile(path.join(root,'assets/LICENSE-SourceHanSans.txt'),path.join(assets,'LICENSE-SourceHanSans.txt'));
 await fs.copyFile(path.join(previous,'gsap.min.js'),path.join(assets,'gsap.min.js'));
 await fs.writeFile(path.join(assets,'scene.js'),scene);
 const html=`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI 帮建 · ${clip.label}</title>
<style>
@font-face{font-family:"Source Han Sans SC";src:url("assets/SourceHanSansSC-Bold.otf") format("opentype");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"Source Han Sans SC";src:url("assets/SourceHanSansSC-Medium.otf") format("opentype");font-weight:500;font-style:normal;font-display:block}
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f5f9ff}
body{font-family:"Source Han Sans SC";font-synthesis:none;-webkit-font-smoothing:antialiased}
#main{position:absolute;width:1728px;height:1117px;overflow:hidden;transform-origin:0 0;background:#fff}
.scene{position:absolute;inset:0;overflow:hidden}
#air{position:absolute;inset:0;width:1728px;height:1117px}
.type-stage{position:absolute;inset:0}
.title-position{position:absolute;top:319px;left:0;right:0;text-align:center;transform-origin:50% 50%}
h1{margin:0;font-size:96px;line-height:1.4;font-weight:700;letter-spacing:1px;color:#0b5eff;white-space:nowrap}
.glyph-mask{display:inline-block;overflow:hidden;vertical-align:top;padding:0 3px 8px}
.glyph{display:inline-block;transform-origin:50% 80%;will-change:transform,opacity;opacity:0}
.claim{position:absolute;left:0;right:0;top:501px;margin:0;text-align:center;font-size:${clip.size}px;line-height:1.5;font-weight:${clip.id==='intro'?700:500};letter-spacing:0;color:#0b5eff;white-space:nowrap}
.claim-mask{display:inline-block;overflow:hidden;vertical-align:top;padding:0 2px 12px}
.claim-text{display:inline-block;opacity:0;will-change:transform,opacity}
.claim-text.second{font-weight:700}
.end-light{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
</style>
</head>
<body>
<main id="main" data-composition-id="main" data-width="1728" data-height="1117" data-duration="8" data-fps="60">
<section id="ai-help-${clip.id}" class="scene clip" data-start="0" data-duration="8" data-track-index="0" aria-label="AI 帮建${clip.label}">
<canvas id="air" width="1728" height="1117" aria-hidden="true"></canvas>
<div class="type-stage">
<div class="title-position"><h1 aria-label="AI 帮建"><span class="glyph-mask"><span class="glyph">AI</span></span> <span class="glyph-mask"><span class="glyph">帮</span></span><span class="glyph-mask"><span class="glyph">建</span></span></h1></div>
<p class="claim" aria-label="${clip.copy}"><span class="claim-mask"><span class="claim-text first">${clip.first}</span></span><span class="claim-mask"><span class="claim-text second">SO easy！</span></span></p>
</div>
<div class="end-light"></div>
</section>
</main>
<script src="assets/gsap.min.js"></script>
<script src="assets/scene.js"></script>
<script>
const renderAir=window.createAirScene(document.getElementById("air"),{exit:${clip.exit}});
let current=0;
const clock={};
Object.defineProperty(clock,"t",{get:()=>current,set:t=>{current=t;renderAir(t);},enumerable:true});
const tl=gsap.timeline({paused:true});
tl.to(clock,{t:8,duration:8,ease:"none"},0);
tl.fromTo(".glyph",{y:68,x:i=>-12+i*5,rotation:i=>-2+i*.8,opacity:0},{y:0,x:0,rotation:0,opacity:1,duration:.93,stagger:.055,ease:"power4.out"},.72);
tl.fromTo(".title-position",{y:15,scale:.978},{y:0,scale:1,duration:1.35,ease:"power3.out"},.72);
tl.fromTo(".claim-text.first",{y:75,x:-12,opacity:0},{y:0,x:0,opacity:1,duration:1.06,ease:"power3.out"},1.48);
tl.fromTo(".claim-text.second",{y:75,x:-8,opacity:0,rotation:-1.1},{y:0,x:0,opacity:1,rotation:0,duration:1.06,ease:"power3.out"},1.68);
${clip.exit?`tl.to(".type-stage",{y:-7,duration:.33,ease:"power2.inOut"},6.92);
tl.to(".type-stage",{opacity:0,y:-21,duration:.4,ease:"power2.in"},7.25);
tl.to(".end-light",{opacity:1,duration:.55,ease:"power2.inOut"},7.45);`:''}
window.__timelines=window.__timelines||{};
window.__timelines.main=tl;
window.seekIntro=t=>{t=Math.max(0,Math.min(8,t));tl.pause().seek(t,false);renderAir(t);};
function fit(){const s=Math.min(innerWidth/1728,innerHeight/1117),e=document.getElementById("main");e.style.transform="scale("+s+")";e.style.left=(innerWidth-1728*s)/2+"px";e.style.top=(innerHeight-1117*s)/2+"px";}
addEventListener("resize",fit);fit();renderAir(0);
window.fontsReady=Promise.all([
 document.fonts.load('700 96px "Source Han Sans SC"','AI 帮建 SO easy！'),
 document.fonts.load('500 84px "Source Han Sans SC"','${clip.copy}')
]).then(()=>document.fonts.ready);
window.fontsReady.then(()=>{
 const params=new URLSearchParams(location.search);
 if(params.has("t"))window.seekIntro(Number(params.get("t")));
 else if(matchMedia("(prefers-reduced-motion: reduce)").matches)window.seekIntro(5);
 else if(location.protocol==="file:"||params.has("play"))tl.play(0);
});
</script>
</body>
</html>`;
 await fs.writeFile(path.join(folder,'index.html'),html);
}
await fs.writeFile(path.join(root,'font-source.json'),JSON.stringify({
 repository:'https://github.com/adobe-fonts/source-han-sans',
 commit:'a4f7cf94edfb9d7ffbdfc4841de276358bd7e0f2',
 license:'SIL Open Font License 1.1',
 files:fonts
},null,2)+'\n');
console.log('Two compositions built; both official font file checksums verified.');
