import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, clearRT } from '../engine/gl';
import { Lyrics, type Line } from '../engine/lyrics';
import { ease, prog, TAU } from '../engine/util';
import { background, drawLine, drawSilhouette, label, line, rounded, SWATCH } from './art';

export default class Flaws extends Scene {
  private layer=new Layer2D();private flaws!:Line;private question!:Line;
  override init(){this.flaws=this.ctx.lyrics.get('She saw all my flaws');this.question=this.ctx.lyrics.get("Baby, won't you tell me")}
  override render(f:Frame,out:THREE.WebGLRenderTarget):PostOverrides{
    const {renderer,comp,lyrics}=this.ctx,c=this.layer.ctx,t=f.t;this.layer.clear();background(c,t,3);
    const q=prog(t,this.question.start,this.question.end,ease.inOutCubic),def=prog(t,this.flaws.start,this.question.end);
    drawSilhouette(c,910,790,.82,t,def,SWATCH.ink);
    // Visible paper-cut defects and offset registration marks appear on the silhouette.
    c.save();c.strokeStyle=SWATCH.rose;c.lineWidth=6;c.globalAlpha=.4+def*.55;
    [[827,493,798,518,829,548],[972,617,1004,638,980,670],[849,742,819,775,848,801],[951,374,924,399,952,428]].forEach(([a,b,d,e,g,h])=>{c.beginPath();c.moveTo(a!,b!);c.lineTo(d!,e!);c.lineTo(g!,h!);c.stroke()});
    c.setLineDash([10,9]);c.strokeStyle=SWATCH.lav;c.beginPath();c.moveTo(775,566);c.lineTo(808,566);c.moveTo(1007,566);c.lineTo(1045,566);c.stroke();c.setLineDash([]);c.restore();
    if(t>=this.question.start){
      // Circular question path returns to its starting point without ever revealing an answer.
      c.save();c.translate(930,532);c.rotate(q*TAU*1.3);c.strokeStyle='#a6a0bd77';c.lineWidth=4;c.beginPath();c.ellipse(0,0,445,185,-.17,Math.PI*.08,Math.PI*1.78);c.stroke();
      const markerX=Math.cos(q*TAU*1.3)*445,markerY=Math.sin(q*TAU*1.3)*185;c.fillStyle=SWATCH.rose;c.beginPath();c.arc(markerX,markerY,10,0,TAU);c.fill();c.restore();
      // Hand-drawn diagnostic boxes cycle through blanks. The held question itself remains readable.
      c.save();c.globalAlpha=.72;rounded(c,1260,335,430,224,2,'#12151d','#8b91a2',3);label(c,'CAUSE / UNRESOLVED',1290,377,18,SWATCH.ash);
      for(let i=0;i<3;i++){const yy=421+i*45;line(c,1290,yy,1354,yy,'#a6a0bd',2);label(c,i===1&&q>.7?'?':'________',1370,yy+6,17,SWATCH.lav)}
      c.globalAlpha=.65;c.font='500 76px "Archivo-1000-700"';c.textAlign='center';c.fillStyle=SWATCH.rose;c.fillText('?',1184+Math.sin(t*3)*18,274+Math.cos(t*2)*9);c.restore();
    }
    const active=lyrics.lineAt(t);if(active)drawLine(c,active,t,914,{size:58,color:SWATCH.blue,maxWidth:1680});
    label(c,'VISIBLE DEFECTS  /  ROOT CAUSE: UNKNOWN',82,88,17,SWATCH.ash);
    clearRT(renderer,out,[.008,.009,.014]);comp.draw(renderer,this.layer.upload(),out,{mode:'normal'});
    return{hud:0,bloom:.08,bloomThreshold:1,halation:0,ca:0,grain:.045,vignette:.34};
  }
}
