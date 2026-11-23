import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
function setup(){const s=newSave();s.cannon.id='chairman';s.cannon.owned.push('chairman');const g:any=new Game(s,'armour');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};return g;}
const old=Math.random;try{
 Math.random=()=>.5;
 const g=setup();g.stats.hull=250;g.player.hp=250;g.chairman.drones.fill(Infinity);g.chairman.drones[0]=0;g.beam=()=>{};g.input.lmb=true;g.firePlayer(.01);
 assert(g.chairman.armourActive,'last shot gathers drones');assert.equal(g.chairman.armour,2500);assert.equal(g.chairman.armourMax,2500);assert(!g.disperseChairman(),'cannot disperse before all have recharged');
 g.input.lmb=false;g.firePlayer(1);let ready=g.chairman.drones.filter((x:number)=>x<=0).length;assert(ready>0&&ready<15,'individual drones charge progressively');
 let shots=0;g.beam=()=>shots++;g.input.lmb=true;g.player.fireCd=0;g.firePlayer(.1);assert.equal(shots,0,'ready drones stay in armour until dispersed');assert.equal(g.chairman.charge,0,'holding fire does not force a sun blast during recharge');
 const armour=g.chairman.armour,dome=g.chairman.shield,hp=g.player.hp;g.hurtPlayer(100,{energy:true});assert.equal(g.chairman.armour,armour-100);assert.equal(g.chairman.shield,dome);assert.equal(g.player.hp,hp);
 g.input.lmb=false;g.firePlayer(5);assert(g.chairman.armourActive,'armour stays until player disperses');assert(g.chairman.drones.every((x:number)=>x===0));g.keyDown('KeyQ');assert(!g.chairman.armourActive);assert.equal(g.chairman.armour,0);g.player.fireCd=0;g.input.lmb=true;g.firePlayer(.01);assert.equal(shots,1,'dispersed drones fire again');
 Math.random=()=>0;const sun=setup();sun.input.lmb=true;sun.firePlayer(.01);sun.input.lmb=false;sun.firePlayer(1);assert(sun.chairman.armourActive,'sun gathers drones into armour');sun.firePlayer(2);ready=sun.chairman.drones.filter((x:number)=>x<=0).length;assert(ready>0&&ready<15,'sun recharge happens one drone at a time');assert(!sun.disperseChairman());sun.firePlayer(3.01);assert(sun.chairman.armourActive);assert(sun.disperseChairman());
}finally{Math.random=old;}
console.log('Chairman armour gathers on exhaustion and sun, protects hull, charges sequentially and disperses on command');
