import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
import {SPECIES_LIST} from './src/game/enemies';
import {drawKineticOrb} from './src/game/projectile-render';

const save=newSave();save.cannon.owned.push('scattermk1');save.cannon.id='scattermk1';
const g=new Game(save,'test') as any;g.player.x=-50000;g.player.y=-65000;g.player.a=0;g.input.lmb=true;g.firePlayer(.01);
assert.equal(g.bullets.length,8);assert(g.bullets.every((b:any)=>b.visual==='scatter-orb' && b.dmg===35));
const circles:number[]=[];let strokes=0;
const ctx:any={beginPath(){},arc(_x:number,_y:number,r:number){circles.push(r)},fill(){},stroke(){strokes++}};
drawKineticOrb(ctx,g.bullets[0]);assert.deepEqual(circles,[7.5,3.5999999999999996,1.2]);assert.equal(strokes,0,'scatter renders as layered circular fills, never a line');
circles.length=0;drawKineticOrb(ctx,{x:0,y:0,crit:false});assert.equal(circles[0],4.5,'default kinetic rounds are also round');
circles.length=0;drawKineticOrb(ctx,{x:0,y:0,crit:true,visual:'scatter-orb'});assert.equal(circles[0],8.5);

const idx=SPECIES_LIST.findIndex(s=>s.id==='dragonfly');
const e=g.makeEnemy(idx,4,g.player.x-500,g.player.y,'test',7);e.aggro=true;e.a=0;e.swatCd=100;
assert(e.shieldParts.length>0,'fixture has real shield generators');
const dash=e.abil.find((a:any)=>a.type==='charge');e.act={i:0,def:dash,t:0,ph:0,hit:false,dir:0,fired:false};
for(let i=0;i<20;i++) {const dx=g.player.x-e.x,dy=g.player.y-e.y;g.updateEnemy(e,.03,dx,dy,Math.hypot(dx,dy));assert.equal(e.shieldDownT,0,'dash does not trigger retraction');assert(e.shields.length>0,'shield panels stay active during dash');}
const grab=e.abil.find((a:any)=>a.type==='grab');e.act={i:2,def:grab,t:0,ph:0,hit:false,dir:0,fired:false};g.runAct(e,.01,0,500);assert(e.shieldDownT>0,'other contact attacks retain their existing retraction');
console.log('Scatter and kinetic rounds render as orbs; shields remain active during dragonfly dash');
