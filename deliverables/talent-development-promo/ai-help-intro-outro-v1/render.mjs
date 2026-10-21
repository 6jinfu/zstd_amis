import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.dirname(fileURLToPath(import.meta.url));
const cli='/private/tmp/talent-intro-npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/bin/hyperframes.mjs';
const bin='/private/tmp/talent-intro-tools';
const ffmpeg=path.join(bin,'imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1');
const ffprobe=path.join(bin,'ffprobe');
const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,HYPERFRAMES_BROWSER_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'};
const selected=process.argv[2]?[process.argv[2]]:['intro','outro'];
const encodeOnly=process.argv.includes('--encode-only');
if(selected.some(id=>!['intro','outro'].includes(id)))throw new Error('Choose intro or outro');
function run(executable,args,capture=false){return new Promise((resolve,reject)=>{
 let out='';const child=spawn(executable,args,{cwd:root,env,stdio:capture?['ignore','pipe','pipe']:'inherit'});
 if(capture){child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);}
 child.on('error',reject);child.on('close',code=>code===0?resolve(out):reject(new Error(executable+' exited '+code+' '+out.slice(-1500))));
});}
const report={verified:true,date:'2026-10-13',font:'Source Han Sans SC',outputs:[]};
for(const id of selected){
 const folder=path.join(root,id),framesDir=path.join(folder,'renders/frames');
 if(!encodeOnly){console.log('Capturing '+id+' / 480 frames');await run(process.execPath,[cli,'render',folder,'--format','png-sequence','--output',framesDir,'--fps','60','--workers','2','--strict','--quiet']);}
 const frames=(await fs.readdir(framesDir)).filter(n=>n.endsWith('.png')).sort();
 if(frames.length!==480)throw new Error(id+': expected 480 frames, got '+frames.length);
 const match=frames[0].match(/^(.*?)(\d+)(\.png)$/),start=Number(match[2]);
 for(let i=0;i<frames.length;i++)if(Number(frames[i].match(/(\d+)\.png$/)[1])!==start+i)throw new Error('Frame order');
 const pattern=path.join(framesDir,match[1]+'%0'+match[2].length+'d'+match[3]);
 const input=['-y','-hide_banner','-loglevel','error','-framerate','60','-start_number',String(start),'-i',pattern,'-frames:v','480','-an'];
 const outputs=[
  {name:'ai-help-'+id+'.mp4',height:1117,args:['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv444p','-movflags','+faststart']},
  {name:'ai-help-'+id+'-edit.mov',height:1117,args:['-c:v','prores_ks','-profile:v','4','-pix_fmt','yuv444p10le']},
  {name:'ai-help-'+id+'-compatible.mp4',height:1118,args:['-vf','pad=iw:ih+1:0:0:color=white','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart']}
 ];
 for(const output of outputs){
  console.log('Encoding '+output.name);
  const target=path.join(root,output.name);
  await run(ffmpeg,[...input,...output.args,target]);
  const data=JSON.parse(await run(ffprobe,['-v','error','-count_frames','-show_entries','stream=codec_name,profile,width,height,pix_fmt,avg_frame_rate,nb_read_frames,duration:format=duration,size','-of','json',target],true));
  const stream=data.streams[0];
  if(stream.width!==1728||stream.height!==output.height||stream.avg_frame_rate!=='60/1'||Number(stream.nb_read_frames)!==480||Math.abs(Number(data.format.duration)-8)>.002)throw new Error('Video verification failed');
  await run(ffmpeg,['-v','error','-i',target,'-f','null','-'],true);
  report.outputs.push({file:output.name,...data});
  console.log('Verified '+output.name+' / '+data.format.size+' bytes');
 }
 await fs.copyFile(path.join(framesDir,frames[299]),path.join(root,'ai-help-'+id+'-poster.png'));
 await fs.writeFile(path.join(root,'verification-'+id+'.json'),JSON.stringify({verified:true,...report,outputs:report.outputs.filter(o=>o.file.startsWith('ai-help-'+id))},null,2)+'\n');
}
console.log('Finished: '+selected.join(', ')+' verified.');
