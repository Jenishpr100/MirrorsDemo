import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, clearRT } from '../engine/gl';
import { Lyrics, type Line } from '../engine/lyrics';
import { ease, prog, TAU } from '../engine/util';
import { background, drawLine, drawSilhouette, label, line, rounded, SWATCH } from './art';

export default class Phone extends Scene {
  private layer=new Layer2D();private call!:Line;private alone!:Line;
  override init(){this.call=this.ctx.lyrics.get('She calls up my phone');this.alone=this.ctx.lyrics.get('Baby, just leave me alone')}
  override render(f:Frame,out:THREE.WebGLRenderTarget):PostOverrides{
    const {renderer,comp,lyrics}=this.ctx,c=this.layer.ctx,t=f.t;this.layer.clear();background(c,t,2);
    const isAlone=t>=this.alone.start,withdraw=prog(t,this.alone.start,this.alone.end,ease.inOutCubic);
    // A small floating cut-paper figure and a phone that grows louder through its ringing.
    drawSilhouette(c,550,790,.68,t,0,SWATCH.ink);
    const ringing=this.call.words.filter(w=>w.w.toLowerCase().replace(/[^a-z]/g,'')==='ringing');
    const currentRing=ringing.findIndex(w=>t>=w.start&&t<w.end);const pulse=currentRing<0?0:Math.sin(prog(t,ringing[currentRing]!.start,ringing[currentRing]!.end)*Math.PI);
    const phoneX=1320+Math.sin(t*2.7)*17,phoneY=425+Math.cos(t*2.2)*20,scale=1+Math.max(0,currentRing)*.06;
    c.save();c.translate(phoneX,phoneY);c.rotate(Math.sin(t*4)*.035);c.scale(scale,scale);
    rounded(c,-120,-208,240,420,28,'#1b202b','#c7d3df',7);rounded(c,-97,-174,194,325,14,'#090c13','#657486',3);c.fillStyle='#b5c2ce';c.beginPath();c.arc(0,174,9,0,TAU);c.fill();
    c.strokeStyle=SWATCH.blue;c.lineWidth=11;c.lineCap='round';c.beginPath();c.moveTo(-48,-24);c.bezierCurveTo(-30,-76,7,-78,32,-43);c.bezierCurveTo(57,-7,23,30,-3,40);c.stroke();
    if(currentRing>=0){c.save();c.globalAlpha=.85;c.font='600 25px "IBM Plex Mono"';c.fillStyle=SWATCH.rose;c.textAlign='center';c.fillText(`RINGING (x${currentRing+1})`,0,115);c.restore()}
    c.restore();
    if(currentRing>=0){
      c.save();c.globalAlpha=.25+pulse*.45;c.strokeStyle=SWATCH.blue;c.lineWidth=5+currentRing;c.beginPath();c.ellipse(phoneX,phoneY,205+pulse*80,270+pulse*72,-.08,0,TAU);c.stroke();
      for(let k=0;k<currentRing+1;k++){const a=k*TAU/(currentRing+1)+t*.6;c.beginPath();c.arc(phoneX+Math.cos(a)*250,phoneY+Math.sin(a)*300,6,0,TAU);c.fillStyle=SWATCH.rose;c.fill()}c.restore();
    }
    if(isAlone){
      // The sentence is pushed away from the figure, while the actual lyric stays title-safe and readable.
      c.save();c.globalAlpha=1-withdraw*.68;c.font='700 38px "Archivo-1000-700"';c.textAlign='center';c.fillStyle=SWATCH.lav;c.fillText('leave me alone',1050+withdraw*270,680-withdraw*150);c.restore();
      c.globalAlpha=1-withdraw*.7;rounded(c,1150+withdraw*280,360-withdraw*90,160,105,20,'#161a24','#9a9bb0',3);
    }
    const active=lyrics.lineAt(t);if(active)drawLine(c,active,t,914,{size:62,color:SWATCH.blue,maxWidth:1630});
    label(c,'INCOMING CALL  /  NO NAME',90,88,17,SWATCH.ash);
    clearRT(renderer,out,[.008,.009,.014]);comp.draw(renderer,this.layer.upload(),out,{mode:'normal'});
    return{hud:0,bloom:.1,bloomThreshold:1,halation:0,ca:.1,grain:.04,vignette:.35};
  }
}
