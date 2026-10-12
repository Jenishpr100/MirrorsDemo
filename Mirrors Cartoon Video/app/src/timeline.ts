import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

const modules=import.meta.glob<{default:SceneClass}>('./scenes/*.ts');
const load=(name:string)=>()=>{
  const m=modules[`./scenes/${name}.ts`];
  return m?m():Promise.reject(new Error(`scene module not found: ${name}`));
};

/** Segment boundaries come from aligned lyric data so the visual edit follows the song. */
export function makeTimeline(ly:Lyrics,au:AudioData):TimelineEntry[]{
  const E=(id:string,file:string,start:number,end:number):TimelineEntry=>({id,load:load(file),start,end});
  const firstCall=ly.get('She calls up my phone').start;
  const flaws=ly.get('She saw all my flaws').start;
  const doubts=ly.get('Ooh, I hate the feeling').start;
  const ohwell=ly.get('Oh well').start;
  return [
    E('mirrors','mirrors',0,firstCall),
    E('phone','phone',firstCall,flaws),
    E('flaws','flaws',flaws,doubts),
    E('couch','couch',doubts,ohwell),
    E('black','black',ohwell,au.duration),
  ];
}
