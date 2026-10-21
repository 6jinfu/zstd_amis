import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const cli='/private/tmp/talent-intro-npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/bin/hyperframes.mjs';
const bin='/private/tmp/talent-intro-tools';
const ffmpeg=path.join(bin,'imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'),ffprobe=path.join(bin,'ffprobe');
const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,HYPERFRAMES_BROWSER_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'};
function run(executable,args,capture=false){return new Promise((resolve,reject)=>{let out='';const child=spawn(executable,args,{cwd:root,env,stdio:capture?['ignore','pipe','pipe']:'inherit'});if(capture){child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);}child.on('error',reject);child.on('close',code=>code===0?resolve(out):reject(new Error(executable+' exited '+code+' '+out.slice(-1500))));});}
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'talent-intro-outro-')),framesDir=path.join(temp,'frames');
console.log('Capturing two 5-second clips / 600 frames: '+temp);
await run(process.execPath,[cli,'render',root,'--format','png-sequence','--output',framesDir,'--fps','60','--workers','3','--strict','--quiet']);
const frames=(await fs.readdir(framesDir)).filter(n=>n.endsWith('.png')).sort();
if(frames.length!==600)throw new Error('Expected 600 frames');
const m=frames[0].match(/^(.*?)(\d+)(\.png)$/),start=Number(m[2]);
for(let i=0;i<frames.length;i++)if(Number(frames[i].match(/(\d+)\.png$/)[1])!==start+i)throw new Error('Frame order');
const pattern=path.join(framesDir,m[1]+'%0'+m[2].length+'d'+m[3]);
const report={verified:true,date:'2026-10-13',font:'Source Han Sans SC',outputs:[]};
for(const [i,id] of ['intro','outro'].entries()){
 const input=['-y','-hide_banner','-loglevel','error','-framerate','60','-start_number',String(start+i*300),'-i',pattern,'-frames:v','300','-an'];
 const outputs=[
  {name:'talent-'+id+'.mp4',height:1117,args:['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv444p','-movflags','+faststart']},
  {name:'talent-'+id+'-compatible.mp4',height:1118,args:['-vf','pad=iw:ih+1:0:0:color=white','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart']}
 ];
 for(const o of outputs){
  const target=path.join(root,o.name);console.log('Encoding '+o.name);
  await run(ffmpeg,[...input,...o.args,target]);
  const data=JSON.parse(await run(ffprobe,['-v','error','-count_frames','-show_entries','stream=codec_name,profile,width,height,pix_fmt,avg_frame_rate,nb_read_frames,duration:format=duration,size','-of','json',target],true));
  const s=data.streams[0];if(s.width!==1728||s.height!==o.height||s.avg_frame_rate!=='60/1'||Number(s.nb_read_frames)!==300||Math.abs(Number(data.format.duration)-5)>.002)throw new Error('Video verification failed');
  await run(ffmpeg,['-v','error','-i',target,'-f','null','-'],true);
  report.outputs.push({file:o.name,...data});console.log('Verified '+o.name+' / '+data.format.size+' bytes');
 }
 await fs.copyFile(path.join(framesDir,frames[i*300+120]),path.join(root,'talent-'+id+'-poster.png'));
 await fs.copyFile(path.join(framesDir,frames[i*300+299]),path.join(root,'talent-'+id+'-last-frame.png'));
}
await fs.writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2)+'\n');
await fs.rm(temp,{recursive:true});console.log('Finished: intro and outro MP4 verified; temporary frames removed.');
