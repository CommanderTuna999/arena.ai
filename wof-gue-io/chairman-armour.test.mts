import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
import {chairmanArmourDronePosition,chairmanDronePosition} from './src/game/chairman';
function setup(){const s=newSave();s.cannon.id='chairman';s.cannon.owned.push('chairman');const g:any=new Game(s,'armour');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};return g;}
const old=Math.random;try{
 Math.random=()=>.5;
 const g=setup();g.stats.hull=150;g.player.hp=150;g.chairman.drones.fill(Infinity);g.chairman.drones[0]=0;g.beam=()=>{};g.input.lmb=true;g.firePlayer(.01);
 const s=g.chairman;assert(s.armourActive,'last shot gathers drones');assert.equal(s.armour,1500);assert.equal(s.armourMax,1500);assert.equal(s.armourBlend,0);
 assert.deepEqual(chairmanArmourDronePosition(s,0,g.player.x,g.player.y),chairmanDronePosition(s,0,g.player.x,g.player.y));
 g.mouseUp(0);g.mouseDown(0);assert(!s.armourDispersing,'click before recharge cannot disperse');g.mouseUp(0);g.firePlayer(.35);assert(s.armourBlend>0&&s.armourBlend<1,'gathering animates over time');
 const mid=chairmanArmourDronePosition(s,0,g.player.x,g.player.y);assert.notDeepEqual(mid,chairmanDronePosition(s,0,g.player.x,g.player.y));g.firePlayer(.65);assert.equal(s.armourBlend,1);
 let ready=s.drones.filter((x:number)=>x<=0).length;assert(ready>0&&ready<15,'individual drones charge progressively');
 let shots=0;g.beam=()=>shots++;g.mouseDown(0);g.firePlayer(.1);assert.equal(shots,0);assert.equal(s.charge,0);
 const dome=s.shield,hp=g.player.hp;g.hurtPlayer(50,{energy:true});assert.equal(s.armour,1450);assert.equal(s.armourLostPieces,0,'partial chunk does not uncharge');g.hurtPlayer(50,{energy:true});assert.equal(s.armour,1400);assert.equal(s.armourLostPieces,1);assert(s.drones[0]>0,'corresponding drone uncharged');assert.equal(s.shield,dome);assert.equal(g.player.hp,hp);
 const timer=s.drones[0];g.hurtPlayer(200,{energy:true});assert.equal(s.armourLostPieces,3);assert.equal(s.drones[0],timer,'previous piece is not charged twice');assert(s.drones[1]>0&&s.drones[2]>s.drones[1],'multiple lost pieces queue sequentially');
 g.firePlayer(10);assert(s.armourActive&&!s.armourDispersing,'held M1 does not automatically disperse');assert(s.drones.every((x:number)=>x===0));
 g.mouseUp(0);g.mouseDown(0);assert(s.armourDispersing,'fresh M1 initiates dispersal');g.firePlayer(.3);assert(s.armourBlend>0&&s.armourBlend<1);assert.equal(shots,0,'no shots during outward animation');
 g.hurtPlayer(100,{energy:true});assert(!s.armourDispersing,'losing a segment during dispersal reverses the animation');assert(s.drones[3]>0);g.mouseUp(0);g.firePlayer(3);assert.equal(s.armourBlend,1);g.mouseDown(0);assert(s.armourDispersing);g.mouseUp(0);g.firePlayer(.71);assert(!s.armourActive);assert.equal(s.armour,0);g.player.fireCd=0;g.mouseDown(0);g.firePlayer(.01);assert.equal(shots,1,'dispersed drones fire again');
 Math.random=()=>0;const sun=setup();sun.mouseDown(0);sun.firePlayer(.01);sun.mouseUp(0);sun.firePlayer(1);assert(sun.chairman.armourActive,'sun gathers drones into armour');sun.firePlayer(2);ready=sun.chairman.drones.filter((x:number)=>x<=0).length;assert(ready>0&&ready<15,'sun recharge happens one drone at a time');sun.firePlayer(3.01);sun.mouseDown(0);assert(sun.chairman.armourDispersing);sun.mouseUp(0);sun.firePlayer(.71);assert(!sun.chairman.armourActive);
}finally{Math.random=old;}
console.log('Chairman armour transitions, M1, sequential recharge and piece damage verified');
