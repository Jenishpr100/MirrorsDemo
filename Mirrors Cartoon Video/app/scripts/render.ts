#!/usr/bin/env bun
// Deterministic headless render: Three.js scene frames -> raw RGBA -> FFmpeg H.264 + audio.
import { chromium, type Page } from 'playwright-core';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const argv=process.argv.slice(2);
const opt=(key:string,fallback:string)=>{const i=argv.indexOf(`--${key}`);return i<0?fallback:argv[i+1]??fallback};
const app=path.resolve(import.meta.dir,'..'),root=path.resolve(app,'..');
const from=Math.max(0,Number(opt('from','0'))),to=Math.min(22.8,Number(opt('to','22.8'))),fps=Math.max(1,Number(opt('fps','60')));
const speed=Math.max(.25,Math.min(4,Number(opt('speed','1')))),samples=Math.max(1,Number(opt('samples','4'))),shutter=Number(opt('shutter','.18'));
const out=path.resolve(opt('out',path.join(root,'out','mirrors.mp4'))),W=1920,H=1080;
if(!(to>from))throw new Error('--to must be greater than --from');

async function reachable(url:string){try{return(await fetch(url,{signal:AbortSignal.timeout(1200)})).ok}catch{return false}}
async function ensureServer(){
  const preferred=Number(opt('port','5387'));if(await reachable(`http://127.0.0.1:${preferred}`))return{url:`http://127.0.0.1:${preferred}`,stop:()=>{}};
  const port=preferred+Math.floor(Math.random()*50),proc=Bun.spawn(['bunx','vite','--port',String(port),'--strictPort'],{cwd:app,stdout:'ignore',stderr:'ignore',env:{...process.env,PDOOM_NO_HMR:'1'}}),url=`http://127.0.0.1:${port}`;
  for(let i=0;i<120&&!await reachable(url);i++)await Bun.sleep(100);
  if(!await reachable(url)){proc.kill();throw new Error('Could not start the private Vite preview server')}
  return{url,stop:()=>proc.kill()};
}
async function openPage(url:string){
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu-rasterization','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
  const page=await browser.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
  const logs:string[]=[];page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')logs.push(`[${m.type()}] ${m.text()}`)});page.on('pageerror',e=>logs.push(`[pageerror] ${e.message}`));
  await page.goto(`${url}/?export=1`);await page.waitForFunction(()=>Boolean((window as any).__mirrors?.ready||(window as any).__mirrors?.error),null,{timeout:120000});
  const bootError=await page.evaluate(()=>((window as any).__mirrors.error as string|undefined));if(bootError)throw new Error(`Preview failed to initialize:\n${bootError}\n${logs.join('\n')}`);
  const dimensions=await page.evaluate(()=>[(window as any).__mirrors.width,(window as any).__mirrors.height]);
  if(dimensions[0]!==W||dimensions[1]!==H)throw new Error(`Unexpected output size: ${dimensions.join('×')}`);
  const sceneErrors=await page.evaluate(()=>((window as any).__mirrors.errors as string[]));if(sceneErrors.length)console.error('SCENE ERRORS:\n'+sceneErrors.join('\n'));
  return{browser,page,logs};
}
async function video(page:Page,url:string){
  mkdirSync(path.dirname(out),{recursive:true});
  const ffmpegArgs=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(fps),'-i','pipe:0','-ss',String(from),'-t',String(to-from),'-i',path.join(root,'audio','mirrors-demo.mp3')];
  const fadeStart=Math.max(0,(20.64-from)/speed),fadeDuration=Math.max(.01,Math.min(1.36/speed,(to-from)/speed-fadeStart));
  ffmpegArgs.push('-vf','vflip','-c:v','libx264','-preset',opt('preset','veryfast'),'-crf',opt('crf','18'),'-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-af',`atempo=${speed},afade=t=out:st=${fadeStart}:d=${fadeDuration}`,'-shortest','-movflags','+faststart',out);
  const ff=Bun.spawn(ffmpegArgs,{stdin:'pipe',stdout:'inherit',stderr:'inherit'}),total=Math.ceil((to-from)*fps/speed),started=performance.now();let received=0;
  const socketServer=Bun.serve({port:0,fetch(req,srv){return srv.upgrade(req)?undefined:new Response('websocket required',{status:400})},websocket:{maxPayloadLength:W*H*4+1024,async message(ws,msg){ff.stdin.write(msg as Uint8Array);await ff.stdin.flush();received++;ws.send(String(received));if(received%60===0||received===total){const elapsed=(performance.now()-started)/1000;console.log(`${received}/${total} frames · ${(received/elapsed).toFixed(1)} fps`)}}}});
  try{
    const counts=await page.evaluate(o=>(window as any).__mirrors.stream(o),{from,to,fps,speed,samples,shutter,ws:`ws://127.0.0.1:${socketServer.port}`,inflight:4});
    while(received<total)await Bun.sleep(20);ff.stdin.end();const status=await ff.exited;if(status!==0)throw new Error(`FFmpeg exited with code ${status}`);
    console.log(`Saved ${out} (${total} frames, ${speed}× timeline speed). Samples per frame: ${Object.entries(counts).map(([n,k])=>`${n}:${k}`).join(' ')}`);
  }finally{socketServer.stop()}
}

const server=await ensureServer();const{browser,page,logs}=await openPage(server.url);
try{await video(page,server.url);if(logs.length)console.warn('Browser messages:\n'+logs.slice(0,30).join('\n'))}
finally{await browser.close();server.stop()}
