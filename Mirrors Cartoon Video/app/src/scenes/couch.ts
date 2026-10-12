import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, clearRT } from '../engine/gl';
import { Lyrics, type Line } from '../engine/lyrics';
import { clamp, ease, prog, smoothstep, TAU } from '../engine/util';
import { background, drawLine, drawSilhouette, label, line, mirror, rounded, SWATCH } from './art';

export default class Couch extends Scene {
  private layer=new Layer2D();private ohwell!:Line;private couchLine!:Line;
  override init(){this.ohwell=this.ctx.lyrics.get('Oh well');this.couchLine=this.ctx.lyrics.get('so I wanna die on top')}
  override render(f:Frame,out:THREE.WebGLRenderTarget):PostOverrides{
    const {renderer,comp,lyrics}=this.ctx,c=this.layer.ctx,t=f.t,leave=this.ohwell.start;this.layer.clear();background(c,t,4);
    const fold=prog(t,this.couchLine.start,this.ohwell.end,ease.inOutCubic),last=clamp((t-(leave-1.35))/1.35);
    // An impossible couch built from a few folded planes, like a paper model under pressure.
    c.save();c.translate(965,730);c.rotate(Math.sin(t*1.6)*.025+fold*.12);c.globalAlpha=1-smoothstep(t,leave-.48,leave-.18);
    c.lineJoin='round';c.lineWidth=9;c.fillStyle='#292b38';c.strokeStyle='#c0c5d1';
    c.beginPath();c.moveTo(-430,20);c.lineTo(-335,-160);c.lineTo(-70,-116);c.lineTo(15,-245);c.lineTo(360,-190);c.lineTo(450,38);c.lineTo(360,170);c.lineTo(-366,160);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(-335,-154);c.lineTo(-278,28);c.lineTo(15,23);c.lineTo(15,-238);c.moveTo(22,-236);c.lineTo(44,25);c.lineTo(398,22);c.stroke();
    c.beginPath();c.moveTo(-365,156);c.lineTo(-405,235);c.moveTo(350,164);c.lineTo(388,236);c.stroke();
    // Perspective folds turn the familiar couch into a closed geometric trap.
    for(let i=0;i<5;i++){const a=(i/4-.5)*1.7;c.save();c.rotate(a);c.globalAlpha*=.18;c.strokeStyle=SWATCH.lav;c.beginPath();c.moveTo(-310,55);c.lineTo(0,-180+i*24);c.lineTo(320,65);c.stroke();c.restore()}
    c.restore();
    const personAlpha=1-smoothstep(t,leave-.25,leave-.04);c.save();c.globalAlpha=personAlpha;drawSilhouette(c,830,795,.64,t,.45,SWATCH.ink);c.restore();
    // Last echoes: mirror, caller, question. They disappear in order before the lyric enters black.
    const echoes=[
      {a:1-smoothstep(t,leave-1.35,leave-1.08),x:295,y:350},
      {a:1-smoothstep(t,leave-1.04,leave-.79),x:1540,y:335},
      {a:1-smoothstep(t,leave-.76,leave-.51),x:1435,y:700},
    ];
    if(echoes[0]!.a>.01){c.save();c.globalAlpha=echoes[0]!.a*.42;mirror(c,echoes[0]!.x,echoes[0]!.y,125,215,-.14,t,0,7);c.restore()}
    if(echoes[1]!.a>.01){c.save();c.globalAlpha=echoes[1]!.a*.62;rounded(c,1505,275,76,142,12,'#171a22','#adbaca',4);c.strokeStyle=SWATCH.blue;c.lineWidth=5;c.beginPath();c.arc(1543,338,21,.5,Math.PI*1.5);c.stroke();c.restore()}
    if(echoes[2]!.a>.01){c.save();c.globalAlpha=echoes[2]!.a;c.font='500 92px "Cormorant-600"';c.fillStyle=SWATCH.lav;c.textAlign='center';c.fillText('?',1435,735);c.restore()}
    // Doubt marks orbit briefly, then lose their outlines.
    if(t<leave-.5){c.save();c.globalAlpha=.55*(1-last);for(let i=0;i<8;i++){const a=t*.75+i*TAU/8,x=960+Math.cos(a)*510,y=480+Math.sin(a)*215;c.font='500 30px "Cormorant-600"';c.fillStyle=SWATCH.rose;c.textAlign='center';c.fillText(i%2?'…':'?',x,y)}c.restore()}
    const active=lyrics.lineAt(t);if(active)drawLine(c,active,t,916,{size:60,color:SWATCH.blue,maxWidth:1640});
    label(c,'WEIGHT /  UNKNOWN',88,88,17,SWATCH.ash);
    const black=clamp((t-(leave-.22))/.22);if(black>0){c.save();c.globalAlpha=black;c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.restore()}
    clearRT(renderer,out,[.008,.009,.014]);comp.draw(renderer,this.layer.upload(),out,{mode:'normal'});
    return{hud:0,bloom:.06,bloomThreshold:1,halation:0,ca:0,grain:.025,vignette:.28};
  }
}
