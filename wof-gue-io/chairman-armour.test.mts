import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
import {chairmanArmourDronePosition,chairmanDronePosition,chairmanDroneVisualPosition,CHAIRMAN_OUTER_RADIUS} from './src/game/chairman';
import {readFileSync} from 'node:fs';
function setup(){const s=newSave();s.cannon.id='chairman';s.cannon.owned.push('chairman');const g:any=new Game(s,'armour');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};return g;}
const old=Math.random;try{
 Math.random=()=>.5;
 const g=setup();g.stats.hull=150;g.player.hp=150;const s=g.chairman;
 const index=7, origin=chairmanDronePosition(s,index,g.player.x,g.player.y);g.hurtPlayer(1,{energy:true});assert.equal(s.drones[index],Infinity);
 assert.deepEqual(chairmanDroneVisualPosition(s,index,g.player.x,g.player.y),origin,'darkening starts at the drone, without teleporting');
 g.firePlayer(1.21);let [x,y]=chairmanDroneVisualPosition(s,index,g.player.x,g.player.y);assert(Math.abs(Math.hypot(x-g.player.x,y-g.player.y)-CHAIRMAN_OUTER_RADIUS)<1e-6);assert(!s.armourActive,'a dark drone waits in the wide orbit while others remain lit');
 const before=[x,y];g.firePlayer(.4);[x,y]=chairmanDroneVisualPosition(s,index,g.player.x,g.player.y);assert(Math.hypot(x-before[0],y-before[1])>1,'dark drones slowly orbit');
 for(let i=0;i<14;i++)g.hurtPlayer(1,{energy:true});assert(!s.armourActive,'armour waits for the last drone to reach the outer radius');g.firePlayer(.6);assert(!s.armourActive);g.firePlayer(.61);assert(s.armourActive);assert.equal(s.armourMax,1500);assert.equal(s.armourBlend,0);
 const outer=chairmanDroneVisualPosition(s,0,g.player.x,g.player.y);assert.deepEqual(chairmanArmourDronePosition(s,0,g.player.x,g.player.y),outer,'assembly starts at outer orbit');g.firePlayer(1);assert(Math.abs(s.armourBlend-.5)<1e-8,'two second assembly');assert.notDeepEqual(chairmanArmourDronePosition(s,0,g.player.x,g.player.y),outer);g.firePlayer(1);assert.equal(s.armourBlend,1);
 const ready=s.drones.filter((v:number)=>v<=0).length;assert(ready>0&&ready<15,'drones recharge sequentially during assembly');
 const dome=s.shield,hp=g.player.hp;g.hurtPlayer(50,{energy:true});assert.equal(s.armour,1450);assert.equal(s.armourLostPieces,0);g.hurtPlayer(50,{energy:true});assert.equal(s.armourLostPieces,1);assert(s.drones[0]>0);assert.equal(s.shield,dome);assert.equal(g.player.hp,hp);const timer=s.drones[0];g.hurtPlayer(200,{energy:true});assert.equal(s.armourLostPieces,3);assert.equal(s.drones[0],timer);assert(s.drones[1]>0&&s.drones[2]>s.drones[1]);
 g.firePlayer(10);assert(s.armourActive && s.drones.every((v:number)=>v===0));let shots=0;g.beam=()=>shots++;g.mouseDown(0);assert(s.armourDispersing,'M1 disperses once ready');g.firePlayer(.3);assert(s.armourBlend>0&&s.armourBlend<1);assert.equal(shots,0);g.hurtPlayer(100,{energy:true});assert(!s.armourDispersing);g.mouseUp(0);g.firePlayer(3);g.mouseDown(0);assert(s.armourDispersing);g.mouseUp(0);g.firePlayer(.71);assert(!s.armourActive);g.player.fireCd=0;g.mouseDown(0);g.firePlayer(.01);assert.equal(shots,1);
 // Explicit manual sun works while gathering, but holding the trigger and
 // automatic fire cannot cause a second sun after the blast.
 const sun=setup();sun.chairman.drones.fill(Infinity);sun.firePlayer(1.21);assert(sun.chairman.armourActive);sun.firePlayer(.5);assert(sun.chairman.armourBlend<1);sun.mouseDown(0);sun.firePlayer(.01);assert(sun.chairman.charge>0,'sun can be triggered while armour gathers');sun.firePlayer(1);assert(sun.chairman.sunLocked);assert(!sun.chairman.armourActive);sun.autoFire=true;sun.firePlayer(1.21);assert(sun.chairman.armourActive);sun.firePlayer(2);assert.equal(sun.chairman.charge,0);sun.mouseUp(0);sun.mouseDown(0);sun.firePlayer(.01);assert.equal(sun.chairman.charge,0,'sun cannot retrigger after a blast while recharging');
 const outerSun=setup();outerSun.chairman.drones.fill(Infinity);outerSun.mouseDown(0);outerSun.firePlayer(.01);assert(outerSun.chairman.charge>0,'sun can be triggered while drones move outward');
 const render=readFileSync('src/game/render.ts','utf8');const draw=render.slice(render.indexOf('function drawChairman('),render.indexOf('/** Screen-space Ultra'));assert(draw.includes('chairmanDroneVisualPosition') && draw.includes('chairmanArmourDronePosition'));assert(draw.includes('ctx.moveTo(11,0);ctx.lineTo(3,-5)'),'armour uses actual drone silhouette');assert(!draw.includes('half=TAU/n*.47'),'no separate brick armour');
}finally{Math.random=old;}
console.log('Outer orbit, two-second drone-shaped armour, damage, dispersal and manual sun verified');
