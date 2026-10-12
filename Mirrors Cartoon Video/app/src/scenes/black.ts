import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, clearRT } from '../engine/gl';
import { type Line } from '../engine/lyrics';
import { drawLine, SWATCH } from './art';

export default class Black extends Scene {
  private layer=new Layer2D();private lyric!:Line;
  override init(){this.lyric=this.ctx.lyrics.get('Oh well')}
  override render(f:Frame,out:THREE.WebGLRenderTarget):PostOverrides{
    const {renderer,comp}=this.ctx,c=this.layer.ctx;this.layer.clear('#000000');
    drawLine(c,this.lyric,f.t,540,{size:82,color:SWATCH.paper,maxWidth:1500,alpha:1});
    clearRT(renderer,out,[0,0,0]);comp.draw(renderer,this.layer.upload(),out,{mode:'normal'});
    // No grain, bloom, corners, or set dressing: the repeated lyric sits in absolute black.
    return{hud:0,bloom:0,halation:0,ca:0,grain:0,vignette:0,exposure:1};
  }
}
