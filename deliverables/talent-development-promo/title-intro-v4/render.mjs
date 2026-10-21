import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root=path.dirname(fileURLToPath(import.meta.url));
const cli='/private/tmp/talent-intro-npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/bin/hyperframes.mjs';
const bin='/private/tmp/talent-intro-tools';
const ffmpeg=path.join(bin,'imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1');
const ffprobe=path.join(bin,'ffprobe');
const framesDir=path.join(root,'renders/frames');
const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,HYPERFRAMES_BROWSER_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'};
try{await fs.access(path.join(bin,'ffmpeg'));}catch{await fs.symlink(ffmpeg,path.join(bin,'ffmpeg'));}
function run(executable,args,capture=false){
 return new Promise((resolve,reject)=>{
  let out='';const child=spawn(executable,args,{cwd:root,env,stdio:capture?['ignore','pipe','pipe']:'inherit'});
  if(capture){child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);}
  child.on('error',reject);child.on('close',code=>code===0?resolve(out):reject(new Error(executable+' exited '+code+' '+out.slice(-1200))));
 });
}
console.log('Rendering 480 frames with local Chrome and local FFmpeg.');
await run(process.execPath,[cli,'render',root,'--format','png-sequence','--output',framesDir,'--fps','60','--workers','2','--strict','--quiet']);
async function collect(dir){
 const items=await fs.readdir(dir,{withFileTypes:true});const result=[];
 for(const item of items){const p=path.join(dir,item.name);if(item.isDirectory())result.push(...await collect(p));else if(item.name.endsWith('.png'))result.push(p);}
 return result.sort();
}
const frames=await collect(framesDir);
if(frames.length!==480)throw new Error('Expected 480 frames, got '+frames.length);
const match=path.basename(frames[0]).match(/^(.*?)(\d+)(\.png)$/);
if(!match)throw new Error('Cannot determine frame pattern');
const start=Number(match[2]);
const pattern=path.join(path.dirname(frames[0]),match[1]+'%0'+match[2].length+'d'+match[3]);
for(let i=0;i<frames.length;i++)if(Number(path.basename(frames[i]).match(/(\d+)\.png$/)[1])!==start+i)throw new Error('Noncontiguous frames');
const input=['-y','-hide_banner','-loglevel','error','-framerate','60','-start_number',String(start),'-i',pattern,'-frames:v','480','-an'];
const outputs=[
 {name:'talent-intro-v4.mp4',width:1728,height:1117,args:['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv444p','-movflags','+faststart']},
 {name:'talent-intro-v4-edit.mov',width:1728,height:1117,args:['-c:v','prores_ks','-profile:v','4','-pix_fmt','yuv444p10le']},
 {name:'talent-intro-v4-compatible.mp4',width:1728,height:1118,args:['-vf','pad=iw:ih+1:0:0:color=white','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart']},
 {name:'talent-intro-v4-preview.webm',width:1728,height:1117,args:['-c:v','libvpx-vp9','-crf','25','-b:v','0','-deadline','good','-cpu-used','3','-row-mt','1','-pix_fmt','yuv420p']}
];
const report={verified:true,date:'2026-10-13',capture:'Hyperframes PNG sequence; deterministic GSAP seek; local Chrome',outputs:[]};
for(const output of outputs){
 console.log('Encoding '+output.name);
 const target=path.join(root,output.name);
 await run(ffmpeg,[...input,...output.args,target]);
 const data=JSON.parse(await run(ffprobe,['-v','error','-count_frames','-show_entries','stream=codec_name,profile,width,height,pix_fmt,avg_frame_rate,nb_read_frames,duration:format=duration,size','-of','json',target],true));
 const stream=data.streams[0];
 if(stream.width!==output.width||stream.height!==output.height||stream.avg_frame_rate!=='60/1'||Number(stream.nb_read_frames)!==480||Math.abs(Number(data.format.duration)-8)>.002)throw new Error('Output verification failed: '+output.name);
 await run(ffmpeg,['-v','error','-i',target,'-f','null','-'],true);
 report.outputs.push({file:output.name,...data});
 console.log('Verified '+output.name+' '+data.format.size+' bytes');
}
await fs.copyFile(frames[300],path.join(root,'poster.png'));
await fs.writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log('Finished: four video formats, 480 frames each, 8 seconds.');
