import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chairmanDronePosition,chairmanHaloCenter,createChairman,moveChairmanHalos} from './src/game/chairman';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';
const s=createChairman();moveChairmanHalos(s,.01,1000,500);assert.deepEqual(chairmanHaloCenter(s,0,0,0),[1000,500]);
moveChairmanHalos(s,.05,1100,500);const inner=chairmanHaloCenter(s,0,0,0)[0],outer=chairmanHaloCenter(s,2,0,0)[0];assert(inner<1100&&outer<inner,'rings trail independently behind the ship');
for(let i=0;i<100;i++)moveChairmanHalos(s,.05,1100,500);assert(Math.abs(s.haloCenters![2].x-1100)<1e-5,'rings settle back at rest');
for(let i=0;i<20;i++)moveChairmanHalos(s,.05,1100+i*80,500);for(let i=0;i<3;i++)assert(Math.abs(s.haloCenters![i].x-(1100+19*80))<=[55,85,115][i]+1e-8,'halo stays within its leash');
moveChairmanHalos(s,.01,-5000,-5000);for(let i=0;i<3;i++)assert.deepEqual(chairmanHaloCenter(s,i,0,0),[-5000,-5000],'teleports snap every ring');
const a=createChairman(),b=createChairman();moveChairmanHalos(a,0,0,0);moveChairmanHalos(b,0,0,0);moveChairmanHalos(a,.1,50,0);moveChairmanHalos(b,.05,50,0);moveChairmanHalos(b,.05,50,0);assert(Math.abs(a.haloCenters![2].x-b.haloCenters![2].x)<1e-9,'damping is frame-rate independent for a stationary target');
const save=newSave();save.cannon.id='chairman';save.cannon.owned.push('chairman');const g:any=new Game(save,'trail');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};g.autoFire=false;g.input.lmb=false;g.firePlayer(.01);g.player.x+=100;g.firePlayer(.05);const expected=chairmanDronePosition(g.chairman,0,g.player.x,g.player.y);g.chairman.drones.fill(Infinity);g.chairman.drones[0]=0;let beam:any[]=[];g.beam=(...args:any[])=>beam=args;g.input.lmb=true;const old=Math.random;try{Math.random=()=>.5;g.firePlayer(0);}finally{Math.random=old;}assert(Math.abs(beam[0]-expected[0])<1e-9&&Math.abs(beam[1]-expected[1])<1e-9,'beam originates from the same trailing position as the rendered drone');
console.log('Chairman halo trailing, bounded motion, teleport reset and beam alignment verified');

const render=readFileSync('src/game/render.ts','utf8');const draw=render.slice(render.indexOf('function drawChairman('),render.indexOf('/** Screen-space Ultra'));assert(!draw.includes('for(let ring=0;ring<3;ring++)'),'orbit guide circles are not drawn');assert(draw.includes('chairmanDronePosition(s,i,p.x,p.y)'),'drones still orbit and trail');
