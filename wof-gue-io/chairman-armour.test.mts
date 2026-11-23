import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
import {chairmanArmourDronePosition,chairmanDronePosition,chairmanDroneVisualPosition,CHAIRMAN_OUTER_RADIUS} from './src/game/chairman';
import {readFileSync} from 'node:fs';
function setup(){const s=newSave();s.cannon.id='chairman';s.cannon.owned.push('chairman');const g:any=new Game(s,'armour');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};return g;}
const old=Math.random;try{
 Math.random=()=>.5;
 const g=setup();g.stats.hull=150;g.player.hp=150;const s=g.chairman;
 const index=7;g.hurtPlayer(1,{energy:true});assert.equal(s.drones[index],Infinity);g.firePlayer(2);
 assert.deepEqual(chairmanDroneVisualPosition(s,index,g.player.x,g.player.y),chairmanDronePosition(s,index,g.player.x,g.player.y),'ordinarily exhausted drone remains on its normal orbit');assert.equal(s.outerStart[index],null);
 for(let i=0;i<14;i++)g.hurtPlayer(1,{energy:true});g.autoFire=true;g.firePlayer(20);assert(s.drones.every((v:number)=>v===Infinity));assert(!s.armourActive&&!s.sunLocked,'all dark drones stay dark without a sun blast');assert(s.outerStart.every((v:any)=>v===null));assert.equal(s.charge,0,'auto never fires sun');
 g.mouseDown(0);g.firePlayer(.01);assert(s.charge>0,'manual M1 can fire the sun with all drones dark');g.mouseUp(0);g.firePlayer(1);assert(s.sunLocked && !s.armourActive);assert(s.drones.every((v:number)=>v===Infinity));
 const start=chairmanDroneVisualPosition(s,0,g.player.x,g.player.y);assert.deepEqual(start,chairmanDronePosition(s,0,g.player.x,g.player.y),'sun launches the drones from their current locations');
 g.firePlayer(.6);assert(!s.armourActive);const mid=chairmanDroneVisualPosition(s,0,g.player.x,g.player.y);assert.notDeepEqual(mid,start,'sun pushes drones outward');g.firePlayer(.61);assert(s.armourActive,'armour starts after all drones arrive in the outer orbit');assert.equal(s.armourMax,1500);assert.equal(s.armourBlend,0);
 const outer=chairmanDroneVisualPosition(s,0,g.player.x,g.player.y);assert(Math.abs(Math.hypot(outer[0]-g.player.x,outer[1]-g.player.y)-CHAIRMAN_OUTER_RADIUS)<1e-6);const first=chairmanArmourDronePosition(s,0,g.player.x,g.player.y);assert(Math.hypot(first[0]-outer[0],first[1]-outer[1])<1e-8);g.firePlayer(1);assert(Math.abs(s.armourBlend-.5)<1e-8,'armour takes two seconds to assemble');assert.notDeepEqual(chairmanArmourDronePosition(s,0,g.player.x,g.player.y),outer);g.firePlayer(1);assert.equal(s.armourBlend,1);
 const ready=s.drones.filter((v:number)=>v<=0).length;assert(ready>0&&ready<15,'drones recharge sequentially during assembly');g.mouseDown(0);g.firePlayer(.01);assert.equal(s.charge,0,'post-blast lock prevents a second sun');g.mouseUp(0);
 const dome=s.shield,hp=g.player.hp;g.hurtPlayer(50,{energy:true});assert.equal(s.armour,1450);assert.equal(s.armourLostPieces,0);g.hurtPlayer(50,{energy:true});assert.equal(s.armourLostPieces,1);assert(s.drones[0]>0);assert.equal(s.shield,dome);assert.equal(g.player.hp,hp);const timer=s.drones[0];g.hurtPlayer(200,{energy:true});assert.equal(s.armourLostPieces,3);assert.equal(s.drones[0],timer);assert(s.drones[1]>0&&s.drones[2]>s.drones[1]);
 g.firePlayer(10);assert(s.armourActive && s.drones.every((v:number)=>v===0));let shots=0;g.beam=()=>shots++;g.autoFire=false;g.mouseDown(0);assert(s.armourDispersing,'M1 disperses once ready');g.firePlayer(.3);assert(s.armourBlend>0&&s.armourBlend<1);assert.equal(shots,0);g.hurtPlayer(100,{energy:true});assert(!s.armourDispersing);g.mouseUp(0);g.firePlayer(3);g.mouseDown(0);assert(s.armourDispersing);g.mouseUp(0);g.firePlayer(.71);assert(!s.armourActive&&!s.sunLocked);g.player.fireCd=0;g.mouseDown(0);g.firePlayer(.01);assert.equal(shots,1);
 // Firing without a sun leaves the shot drone dark on its original orbit.
 const firing=setup();firing.beam=()=>{};firing.mouseDown(0);firing.firePlayer(.01);firing.mouseUp(0);const spent=firing.chairman.drones.findIndex((v:number)=>v===Infinity);assert(spent>=0);firing.firePlayer(10);assert.equal(firing.chairman.drones[spent],Infinity);assert.equal(firing.chairman.outerStart[spent],null);assert(!firing.chairman.armourActive);
 // An early random sun knocks even lit drones out and starts the same cycle.
 Math.random=()=>0;const early=setup();early.mouseDown(0);early.firePlayer(.01);assert(early.chairman.charge>0);early.mouseUp(0);early.firePlayer(1);assert(early.chairman.drones.every((v:number)=>v===Infinity));assert(early.chairman.outerStart.every(Boolean));early.firePlayer(1.21);assert(early.chairman.armourActive);
 const render=readFileSync('src/game/render.ts','utf8');const draw=render.slice(render.indexOf('function drawChairman('),render.indexOf('/** Screen-space Ultra'));assert(draw.includes('chairmanDroneVisualPosition')&&draw.includes('chairmanArmourDronePosition'));assert(draw.includes('ctx.moveTo(11,0);ctx.lineTo(3,-5)'));assert(!draw.includes('half=TAU/n*.47'));
}finally{Math.random=old;}
console.log('Only a sun launches the dark swarm and forms drone-shaped armour; recharge, damage and dispersal verified');
