import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LYRICS_SRC } from '../../lyrics/lyrics.src.js';

const app = path.resolve(import.meta.dir, '..');
const root = path.resolve(app, '..');
const source = path.join(root, 'audio', 'mirrors-demo.mp3');
const renderDuration = 22.8;
const sourceDuration = Number(spawnSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',source], { encoding:'utf8' }).stdout.trim());
if (!Number.isFinite(sourceDuration)) throw new Error('ffprobe could not read audio/mirrors-demo.mp3');

const analysis = spawnSync('ffmpeg', ['-v','error','-i',source,'-t',String(renderDuration),'-f','s16le','-acodec','pcm_s16le','-ac','1','-ar','22050','pipe:1'], { maxBuffer:64*1024*1024 });
if (analysis.status !== 0 || !analysis.stdout?.length) throw new Error('ffmpeg could not decode the opening audio excerpt');
const pcm: Buffer = analysis.stdout;
const rate=22050, block=220, fps=100, samples=Float32Array.from({length:Math.floor(pcm.length/2)},(_,i)=>pcm.readInt16LE(i*2)/32768);
const rms:number[]=[];
for(let i=0;i+block<samples.length;i+=block){let sum=0;for(let j=i;j<i+block;j++)sum+=samples[j]!*samples[j]!;rms.push(Math.sqrt(sum/block))}
const flux=rms.map((v,i)=>Math.max(0,v-(rms[Math.max(0,i-4)]??0)));
const maximum=Math.max(...flux,1e-6);
for(let i=0;i<flux.length;i++)flux[i]=Math.min(1,flux[i]!/maximum);
let bestLag=55,bestScore=-Infinity;
for(let lag=34;lag<=95;lag++){
  let dot=0,aa=0,bb=0;for(let i=lag;i<flux.length;i++){const a=flux[i]!,b=flux[i-lag]!;dot+=a*b;aa+=a*a;bb+=b*b}
  const score=dot/Math.sqrt(Math.max(1e-9,aa*bb));
  if(score>bestScore){bestScore=score;bestLag=lag}
}
// Check the half/double-tempo ambiguity and prefer the tempo whose grid lands on the strongest attacks.
const candidates=[bestLag,Math.round(bestLag/2),bestLag*2].filter(x=>x>=34&&x<=95);
const gridScore=(lag:number)=>{let best=0;for(let phase=0;phase<lag;phase++){let score=0;for(let i=phase;i<flux.length;i+=lag)score+=flux[i]??0;best=Math.max(best,score)}return best};
bestLag=candidates.sort((a,b)=>gridScore(b)-gridScore(a))[0]??bestLag;
const bpm=60/(bestLag/fps);
const period=60/bpm;
const phase=[...Array(bestLag).keys()].reduce((best,p)=>gridScore(best)>=gridScore(p)?best:p,0)/fps;
const beats:number[]=[];for(let t=phase;t<renderDuration;t+=period)beats.push(Number(t.toFixed(4)));
const downbeats=beats.filter((_,i)=>i%4===0);
const peakTimes:number[]=[];for(let i=2;i<flux.length-2;i++)if(flux[i]!>.42&&flux[i]!>=flux[i-1]!&&flux[i]!>flux[i+1]!&&(peakTimes.at(-1)??-1)<(i/fps)-.13)peakTimes.push(Number((i/fps).toFixed(3)));
const lines=LYRICS_SRC.map((line,i)=>{
  const tokens=line.text.trim().split(/\s+/);
  if(tokens.length!==line.syllables.length)throw new Error(`Syllable map length differs from word count in lyric line ${i+1}`);
  const count=line.syllables.reduce((a,b)=>a+b,0), span=line.end-line.start;
  let cursor=line.start;
  const words=tokens.map((w,j)=>{
    const wordSpan=span*line.syllables[j]!/count,start=cursor,end=j===tokens.length-1?line.end:cursor+wordSpan;cursor=end;
    const syl=Array.from({length:line.syllables[j]!},(_,k)=>[start+(end-start)*k/line.syllables[j]!,start+(end-start)*(k+1)/line.syllables[j]!]);
    return {w,start:Number(start.toFixed(4)),end:Number(end.toFixed(4)),conf:.62,...(syl.length>1?{syl:syl.map(pair=>pair.map(x=>Number(x.toFixed(4))) as [number,number])}:{})};
  });
  return {i,text:line.text,start:line.start,end:line.end,words};
});
mkdirSync(path.join(root,'data'),{recursive:true});mkdirSync(path.join(app,'public','data'),{recursive:true});
const lyricsJson=JSON.stringify({lines},null,2);
writeFileSync(path.join(root,'data','lyrics.json'),lyricsJson);writeFileSync(path.join(app,'public','data','lyrics.json'),lyricsJson);
const features={rms:Array.from(rms,v=>Number(Math.min(1,v/.45).toFixed(4)))};
const audio={duration:renderDuration,sourceDuration:Number(sourceDuration.toFixed(3)),bpm:Number(bpm.toFixed(2)),fps,beats,downbeats,sections:[{name:'mirrors',start:0,end:8.02},{name:'phone',start:8.02,end:12.96},{name:'question',start:12.96,end:17.32},{name:'couch',start:17.32,end:20.64},{name:'black outro',start:20.64,end:renderDuration}],features,onsets:{vocal:peakTimes.map(t=>[t,Math.max(.15,flux[Math.min(flux.length-1,Math.round(t*fps))]??.2)])}};
const audioJson=JSON.stringify(audio);writeFileSync(path.join(root,'data','audio.json'),audioJson);writeFileSync(path.join(app,'public','data','audio.json'),audioJson);
console.log(`Prepared ${lines.length} lyric lines and ${beats.length} beat anchors from ${sourceDuration.toFixed(2)} s audio; estimated tempo ${bpm.toFixed(1)} BPM.`);
