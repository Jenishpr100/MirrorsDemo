import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, clearRT } from '../engine/gl';
import { Lyrics, type Line } from '../engine/lyrics';
import { clamp, ease, prog } from '../engine/util';
import { background, drawLine, drawSilhouette, label, line, mirror, rounded, SWATCH } from './art';

export default class Mirrors extends Scene {
  private layer=new Layer2D();
  private first!:Line;private face!:Line;private laughs!:Line;private dates!:Line;
  override init(){
    this.first=this.ctx.lyrics.get('Take down all the mirrors');
    this.face=this.ctx.lyrics.get('I hate my nose');
    this.laughs=this.ctx.lyrics.get('I hate the jokes');
    this.dates=this.ctx.lyrics.get("I hate the hoes");
  }
  override render(f:Frame,out:THREE.WebGLRenderTarget):PostOverrides{
    const {renderer,comp,lyrics}=this.ctx,c=this.layer.ctx,t=f.t;this.layer.clear();background(c,t,1);
    const reveal=prog(t,this.first.start,this.first.end,ease.outCubic);
    // Four illustrated mirror panels fall away one after another as the opening line is sung.
    const panels=[[-120,450,330,700,-.13],[315,390,300,590,.08],[1540,400,300,620,-.07],[1900,460,350,710,.14]] as const;
    panels.forEach(([x,y,w,h,r],i)=>{
      const cue=this.first.words[Math.min(this.first.words.length-1,1+i*2)]!.start;
      const gone=prog(t,cue,cue+.48,ease.inCubic);
      mirror(c,x,y,w,h,r,t,gone,i);
      if(gone<.25){c.save();c.globalAlpha=.28*(1-gone);drawSilhouette(c,x,y+70,.4,t,0,'#abb3c1');c.restore()}
    });
    // A small floor grid keeps the space legible like a drafted set, but the drawing stays soft and human.
    c.save();c.globalAlpha=.32;c.strokeStyle='#71809566';c.lineWidth=2;for(let i=0;i<9;i++){const x=i*240;c.beginPath();c.moveTo(960,650);c.lineTo(x,1080);c.stroke()}line(c,0,812,1920,812,'#a9b4c32b',2);c.restore();
    drawSilhouette(c,950,775,.76,t,prog(t,this.face.start,this.dates.end),SWATCH.ink);
    if(t>=this.face.start&&t<this.face.end){
      // Facial features exist as displaced cut-paper symbols, not as a face on the figure.
      const p=prog(t,this.face.start,this.face.end,ease.inOutCubic),a=prog(t,this.face.start,this.face.start+.12);
      c.save();c.globalAlpha=a;c.strokeStyle=SWATCH.rose;c.fillStyle=SWATCH.rose;c.lineWidth=8;
      c.beginPath();c.ellipse(900-p*28,385-p*34,26,9,-.16,0,Math.PI*2);c.stroke();
      c.beginPath();c.ellipse(984+p*33,379+p*27,25,8,.12,0,Math.PI*2);c.stroke();
      c.beginPath();c.moveTo(945,400);c.lineTo(925-p*32,447+p*14);c.lineTo(958-p*16,451+p*14);c.closePath();c.stroke();
      c.beginPath();c.moveTo(906,482+p*32);c.quadraticCurveTo(949,501+p*43,991,480+p*25);c.stroke();
      label(c,'EYE / OFFSET',1110,375,17,SWATCH.rose);label(c,'NOSE / MISREGISTERED',1110,430,17,SWATCH.rose);label(c,'MOUTH / REJECTED',1110,485,17,SWATCH.rose);
      c.restore();
    }
    if(t>=this.laughs.start){
      const q=prog(t,this.laughs.start,this.dates.end,ease.inOutCubic);c.save();c.globalAlpha=.7;
      // Laugh marks become an empty speech balloon, then the unused outline of another place setting.
      c.strokeStyle=SWATCH.lav;c.lineWidth=4;c.beginPath();c.ellipse(430,340,145+q*25,83,0,0,Math.PI*2);c.stroke();
      c.beginPath();c.moveTo(475,407);c.lineTo(446,455);c.lineTo(520,412);c.stroke();
      c.font='600 42px "Archivo-1000-700"';c.fillStyle=SWATCH.lav;c.textAlign='center';c.fillText('ha',410,354);c.fillText('ha',458,332);
      c.globalAlpha*=1-q*.8;rounded(c,1310,590,265,180,5,'#15151d','#757184',4);line(c,1340,632,1545,632,'#817c90',3);line(c,1340,666,1490,666,'#817c90',3);line(c,1340,701,1520,701,'#817c90',3);label(c,'NO REPLY',1350,744,15,SWATCH.ash);
      c.restore();
    }
    const current=lyrics.lineAt(t);if(current)drawLine(c,current,t,914,{size:t<this.face.end?68:62,color:SWATCH.blue,maxWidth:1640});
    label(c,'ROOM STUDY  /  01',82,86,17,'#a6a0b7');
    clearRT(renderer,out,[.008,.009,.014]);comp.draw(renderer,this.layer.upload(),out,{mode:'normal'});
    return{hud:0,bloom:.08,bloomThreshold:1,halation:0,ca:0,grain:.035,vignette:.3};
  }
}
