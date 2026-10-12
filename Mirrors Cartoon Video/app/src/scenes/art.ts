import { F, font } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { clamp, frameIdx, hash, smoothstep } from '../engine/util';

export const SWATCH={ink:'#080a10',ink2:'#121620',silver:'#d6d9e2',ash:'#8995a6',lav:'#a6a0bd',blue:'#9bbacb',rose:'#bd8294',dim:'#4b5261',paper:'#e8e5e9'};
export const DISPLAY=F.archivo(100,700);
export const MONO=F.mono(400);
export const FONT=(fam:string,size:number)=>font(fam,size);

export function background(c:CanvasRenderingContext2D,t:number,seed=0){
  const g=c.createRadialGradient(1030,405,10,960,530,1150);g.addColorStop(0,'#202431');g.addColorStop(.48,'#10141d');g.addColorStop(1,SWATCH.ink);c.fillStyle=g;c.fillRect(0,0,1920,1080);
  c.save();c.globalAlpha=.18;c.strokeStyle='#8c9bae';c.lineWidth=1;
  for(let i=0;i<10;i++){const x=80+i*196;c.beginPath();c.moveTo(x,0);c.lineTo(960+(x-960)*1.35,1080);c.stroke()}
  c.restore();
  const v=c.createRadialGradient(960,520,260,960,520,1000);v.addColorStop(0,'#0000');v.addColorStop(1,'#020309bb');c.fillStyle=v;c.fillRect(0,0,1920,1080);
  const fi=frameIdx(t);c.save();c.globalAlpha=.18;for(let i=0;i<90;i++){c.fillStyle=i%4===0?'#c1aebe':'#b9c4d0';c.fillRect(hash(i,seed)*1920,hash(i+190,seed)*1080,1.5+(i%2),1.5)}
  // Fixed seed, changing only once per output frame, gives the grain a film cadence.
  c.globalAlpha=.035;for(let i=0;i<30;i++){c.fillStyle=hash(i,fi,seed)>.5?'#fff':'#000';c.fillRect(hash(i+31,fi,seed)*1920,hash(i+71,fi,seed)*1080,3,3)}c.restore();
}

export function rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke=SWATCH.ash,width=3){
  c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}
}
export function line(c:CanvasRenderingContext2D,x:number,y:number,x2:number,y2:number,color=SWATCH.ash,width=3){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
export function drawSilhouette(c:CanvasRenderingContext2D,x:number,y:number,scale=1,t=0,defects=0,fill=SWATCH.ink){
  c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(Math.sin(t*1.7)*.012);c.lineJoin='round';c.fillStyle=fill;c.strokeStyle='#bec6d255';c.lineWidth=5;
  c.beginPath();c.ellipse(0,-420,71,88,-.09,0,Math.PI*2);c.fill();c.stroke();
  c.beginPath();c.moveTo(-44,-349);c.quadraticCurveTo(-120,-372,-136,-293);c.lineTo(-166,-130);c.quadraticCurveTo(-188,-68,-130,-26);c.lineTo(-114,74);c.quadraticCurveTo(-150,189,-194,287);c.quadraticCurveTo(-208,320,-126,322);c.lineTo(-28,137);c.lineTo(18,314);c.quadraticCurveTo(30,342,123,315);c.lineTo(81,101);c.lineTo(124,-38);c.quadraticCurveTo(163,-130,117,-225);c.lineTo(102,-303);c.quadraticCurveTo(74,-365,-44,-349);c.closePath();c.fill();c.stroke();
  c.strokeStyle=SWATCH.rose;c.lineWidth=5;c.globalAlpha=.26+defects*.54;
  const cracks=[[-56,-455,-27,-429,-43,-404],[43,-469,19,-441,42,-421],[-119,-230,-91,-211,-110,-183],[58,-105,38,-83,60,-62],[-52,57,-31,85,-47,109]];
  cracks.slice(0,2+Math.round(defects*3)).forEach(([a,b,d,e,f,g])=>{c.beginPath();c.moveTo(a!,b!);c.lineTo(d!,e!);c.lineTo(f!,g!);c.stroke()});
  if(defects>.35){c.globalAlpha=defects*.65;c.fillStyle=SWATCH.rose;c.beginPath();c.moveTo(-142,-247);c.lineTo(-114,-228);c.lineTo(-151,-199);c.closePath();c.fill()}
  c.restore();
}
export function mirror(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,rot:number,t:number,retire=0,seed=0){
  c.save();c.translate(x,y+retire*650);c.rotate(rot+retire*.32);c.globalAlpha=1-retire;c.lineJoin='round';
  c.beginPath();c.moveTo(-w*.48,-h*.49);c.lineTo(w*.47,-h*.44);c.lineTo(w*.5,h*.47);c.lineTo(-w*.45,h*.5);c.closePath();c.fillStyle='#a2adbd16';c.fill();c.strokeStyle='#aab8caaa';c.lineWidth=8;c.stroke();
  c.beginPath();c.moveTo(-w*.41,-h*.42);c.lineTo(w*.39,-h*.38);c.lineTo(w*.42,h*.40);c.lineTo(-w*.38,h*.42);c.closePath();c.clip();
  c.fillStyle='#8e9aaf17';c.fillRect(-w/2,-h/2,w,h);c.strokeStyle='#c1cfdd36';c.lineWidth=2;
  for(let i=0;i<6;i++){const yy=-h*.35+i*h*.13;c.beginPath();c.moveTo(-w*.4,yy);c.quadraticCurveTo(Math.sin(t*.8+i+seed)*24,yy+8,w*.4,yy-24);c.stroke()}
  drawSilhouette(c,Math.sin(seed+t*.2)*10,Math.cos(seed)*10,.34,t,0,'#9ba7b7');
  c.restore();
}

/** Single active lyric line; the word wipe follows the word and optional syllable times. */
export function karaoke(c:CanvasRenderingContext2D,ly:Lyrics,t:number,y:number,opts:{size?:number;color?:string;maxWidth?:number;x?:number;alpha?:number}={}){
  const l=ly.lineAt(t);if(!l)return;
  drawLine(c,l,t,y,opts); 
}
export function drawLine(c:CanvasRenderingContext2D,l:Line,t:number,y:number,opts:{size?:number;color?:string;maxWidth?:number;x?:number;alpha?:number}={}){
  const size=opts.size??65,color=opts.color??SWATCH.blue,maxWidth=opts.maxWidth??1540,cx=opts.x??960,alpha=opts.alpha??1;
  c.save();c.textAlign='left';c.textBaseline='middle';c.font=FONT(DISPLAY,size);c.shadowColor='#03040a';c.shadowBlur=8;
  const widths=l.words.map(w=>c.measureText(w.w).width),space=c.measureText(' ').width;
  const total=widths.reduce((a,b)=>a+b,0)+Math.max(0,widths.length-1)*space;
  const shrink=Math.min(1,maxWidth/Math.max(1,total)),fontSize=size*shrink;c.font=FONT(DISPLAY,fontSize);
  const scaled=widths.map(w=>w*shrink),gap=space*shrink;let x=cx-(scaled.reduce((a,b)=>a+b,0)+Math.max(0,widths.length-1)*gap)/2;
  for(let i=0;i<l.words.length;i++){
    const w=l.words[i]!,width=scaled[i]!;c.globalAlpha=alpha*(t>=w.end ? .88 : .34);c.fillStyle=SWATCH.paper;c.fillText(w.w,x,y);
    if(t>=w.start){const p=Lyrics.wordProgress(w,t);c.globalAlpha=alpha;c.fillStyle=color;c.save();c.beginPath();c.rect(x-2,y-fontSize*.68,(width+4)*clamp(p),fontSize*1.4);c.clip();c.fillText(w.w,x,y);c.restore()}
    x+=width+gap;
  }
  c.restore();
}

export function label(c:CanvasRenderingContext2D,text:string,x:number,y:number,size=19,color=SWATCH.ash){
  c.save();c.font=FONT(MONO,size);c.fillStyle=color;c.textAlign='left';c.textBaseline='alphabetic';c.fillText(text,x,y);c.restore();
}

export const fadeIn=(t:number,a:number,b:number)=>smoothstep(a,b,t);
