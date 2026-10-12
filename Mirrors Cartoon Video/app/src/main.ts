import { Engine } from './engine/engine';
import { PW, PH } from './engine/gl';
import { makeTimeline } from './timeline';
import { clamp } from './engine/util';

const params=new URLSearchParams(location.search);
const exportMode=params.has('export');
const canvas=document.querySelector<HTMLCanvasElement>('#c')!;
canvas.width=PW;canvas.height=PH;
const engine=new Engine(canvas,makeTimeline);
declare global{interface Window{__mirrors:any}}

async function boot(){
  await engine.init();
  if(exportMode){setupExport();return}
  setupPlayer();
}

function setupExport(){
  document.body.classList.add('export');
  window.__mirrors={
    engine,width:PW,height:PH,duration:engine.duration,
    timeline:engine.timeline.map(({id,start,end})=>({id,start,end})),errors:engine.errors,
    still(t:number,samples=1,shutter=.18){return engine.render(t,1/60,true,samples,shutter)},
    async stream(opts:{from:number;to:number;fps:number;speed:number;ws:string;samples:number;shutter:number;inflight?:number}){
      const ws=new WebSocket(opts.ws);ws.binaryType='arraybuffer';let acked=0;
      ws.onmessage=e=>{if(typeof e.data==='string')acked=Math.max(acked,Number(e.data)||0)};
      await new Promise<void>((resolve,reject)=>{ws.onopen=()=>resolve();ws.onerror=e=>reject(e)});
      const step=opts.speed/opts.fps,total=Math.ceil((opts.to-opts.from)/step),buf=new Uint8Array(PW*PH*4);
      const used:Record<number,number>={};
      for(let n=0;n<total;n++){
        const t=Math.min(opts.to-1e-5,opts.from+n*step);
        const k=engine.render(t,step,false,opts.samples,opts.shutter);used[k]=(used[k]??0)+1;
        await engine.readPixelsAsync(buf);
        if(opts.inflight)while(n-acked>=opts.inflight)await new Promise(r=>setTimeout(r,2));
        while(ws.bufferedAmount>64*1024*1024)await new Promise(r=>setTimeout(r,2));
        ws.send(buf);if(n%30===0)await new Promise(r=>setTimeout(r,0));
      }
      while(ws.bufferedAmount>0)await new Promise(r=>setTimeout(r,5));ws.close();return used;
    },
  };
  window.__mirrors.ready=true;
}

function setupPlayer(){
  const audio=new Audio('/audio/mirrors-demo.mp3');audio.preload='auto';audio.volume=1;
  const ui=document.querySelector<HTMLElement>('#ui')!;
  const scrub=document.querySelector<HTMLInputElement>('#scrub')!;
  const info=document.querySelector<HTMLElement>('#info')!;
  const marks=document.querySelector<HTMLElement>('#marks')!;
  const playButton=document.querySelector<HTMLButtonElement>('#play')!;
  const speedButtons=[...document.querySelectorAll<HTMLButtonElement>('[data-speed]')];
  scrub.max=String(engine.duration);scrub.step='0.001';
  let t=Number(params.get('t')??0),playing=false,rate=1,tailing=false,tailStart=0;
  const audioEnd=22;
  const seek=(value:number)=>{
    t=clamp(value,0,engine.duration-.001);tailing=false;
    if(t<audioEnd){audio.currentTime=t;audio.volume=1}else{audio.pause();audio.currentTime=audioEnd;audio.volume=0}
    if(playing&&t<audioEnd)void audio.play();
  };
  engine.timeline.forEach(e=>{
    const marker=document.createElement('div');marker.className='mark';
    marker.style.left=`${e.start/engine.duration*100}%`;marker.style.width=`${(e.end-e.start)/engine.duration*100}%`;
    marker.title=`${e.id} · ${e.start.toFixed(2)}–${e.end.toFixed(2)} s`;marker.textContent=e.id;
    marker.onclick=()=>seek(e.start);marks.appendChild(marker);
  });
  const setRate=(n:number)=>{rate=n;audio.playbackRate=n;speedButtons.forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===n))};
  const toggle=()=>{
    playing=!playing;playButton.textContent=playing?'❚❚ Pause':'▶ Play';
    if(!playing){audio.pause();tailing=false;return}
    if(t>=audioEnd){tailing=true;tailStart=performance.now();return}
    audio.currentTime=t;void audio.play();
  };
  playButton.onclick=toggle;
  document.querySelector<HTMLButtonElement>('#restart')!.onclick=()=>{playing=false;audio.pause();audio.currentTime=0;t=0;tailing=false;playButton.textContent='▶ Play'};
  speedButtons.forEach(b=>b.onclick=()=>setRate(Number(b.dataset.speed)));
  document.querySelector<HTMLButtonElement>('#hide')!.onclick=()=>ui.classList.toggle('hidden');
  scrub.oninput=()=>seek(Number(scrub.value));
  window.addEventListener('keydown',ev=>{
    if(ev.code==='Space'&&!(ev.target instanceof HTMLInputElement)){ev.preventDefault();toggle()}
    if(ev.key==='ArrowRight')seek(t+(ev.shiftKey?5:1));if(ev.key==='ArrowLeft')seek(t-(ev.shiftKey?5:1));
    if(ev.key==='h')ui.classList.toggle('hidden');
  });
  const tick=()=>{
    if(playing){
      if(tailing){t=audioEnd+(performance.now()-tailStart)/1000*rate;if(t>=engine.duration){t=engine.duration-.001;playing=false;tailing=false;playButton.textContent='▶ Play'}}
      else if(audio.currentTime>=audioEnd){audio.pause();audio.volume=0;t=audioEnd;tailStart=performance.now();tailing=true}
      else{t=audio.currentTime;audio.volume=t<20.64?1:clamp(1-(t-20.64)/(audioEnd-20.64),0,1)}
    }
    engine.render(t,1/60);scrub.value=String(t);
    const active=engine.timeline.find(e=>t>=e.start&&t<e.end);
    const line=engine.lyrics.lineAt(t);
    info.textContent=`${t.toFixed(2)} s · ${active?.id??'—'} · ${Math.round(rate*100)}% · ${line?`“${line.text}”`:''}`;
    requestAnimationFrame(tick);
  };
  engine.render(t,1/60);requestAnimationFrame(tick);
  if(import.meta.hot)import.meta.hot.on('vite:afterUpdate',async payload=>{
    for(const update of payload.updates??[]){const match=/scenes\/([\w-]+)\.ts/.exec(update.path??'');if(match)await engine.reload(match[1]!)}
  });
}

boot().catch(error=>{
  console.error(error);const out=document.querySelector<HTMLElement>('#errs');if(out){out.textContent=String(error?.stack??error);out.style.display='block'}
  if(exportMode)window.__mirrors={error:String(error?.stack??error)};
});
