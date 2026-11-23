import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';
const g:any=new Game(newSave(),'shield-kinetic');const e=g.makeEnemy(0,4,10000,10000,'test',9);g.enemies=[e];
const generator=e.parts[e.coreId];generator.shieldMax=generator.shieldHp=10000;
const r=e.radius+120;e.shieldReach=r+30;e.shields=[{part:generator,cx:e.x,cy:e.y,ang:0,r,span:Math.PI,bar:false,thick:16}];
const before=()=>({parts:e.parts.map((p:any)=>p.hp),layers:e.shells.map((s:any)=>s.hp)});
const initial=before(),x=e.x+r+20,y=e.y;
g.areaDamage(x,y,r*3,100,null,'explosive');assert.deepEqual(before(),initial,'kinetic blast outside a full panel cannot damage protected body or armor');
g.areaDamage(x,y,r*3,100,null,'shock');assert.notDeepEqual(before().layers,initial.layers,'energy damage still bypasses panels');
// An impact overlapping a panel and slab must meet the outer kinetic shield first.
const layerBefore=e.shells.at(-1).hp;const realPlate=g.plateAt;g.plateAt=()=>true;
const bullet={x:e.x+r,y:e.y,vx:-300,vy:0,life:1,dmg:100,pierce:10,hit:[],kind:0,target:null,crit:false,elem:'kinetic'};
assert.equal(g.tryHit(bullet),true);assert.equal(e.shells.at(-1).hp,layerBefore,'panel prevents slab damage even with penetration');
g.beam(e.x+r+50,e.y,Math.PI,200,100,10,false,'kinetic');assert.equal(e.shells.at(-1).hp,layerBefore,'kinetic beam stops on panel before plating');g.plateAt=realPlate;
// Shattering one shared plating layer must not recursively break other layers or
// inflict an unavoidable whole-body blast on its owner.
const layerCount=e.shells.length, hp=e.parts.map((p:any)=>p.hp);e.shells.at(-1).hp=1;g.shellHit(e,100,'kinetic');assert.equal(e.shells.length,layerCount-1);assert.deepEqual(e.parts.map((p:any)=>p.hp),hp);
console.log('Kinetic impacts and splash respect shield coverage; armor breaks do not cascade through their own body');
