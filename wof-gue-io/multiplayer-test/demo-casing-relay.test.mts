import assert from 'node:assert/strict';
import {Game} from './source/src/game/engine';
import {newSave} from './source/src/game/data';
import {CombatHarness} from './source/src/game/multiplayer/combat-harness';
import {interestSnapshot} from './source/src/game/multiplayer/interest';
import {ReplicaView} from './source/src/game/multiplayer/replica-view';
import {casingsAt,drawCasings,casingProfile} from './source/src/game/casing-fx';
const world=new Game(newSave(),'world'),h=new CombatHarness(world,3,false,undefined,undefined,true);h.roster.add('a','Alpha');h.roster.add('b','Beta');h.roster.add('far','Far');const a=h.roster.get('a')!,b=h.roster.get('b')!,far=h.roster.get('far')!;far.player.x+=50000;
assert(h.roster.equipDemoCannon('a','skewer2'));assert(h.roster.equipDemoCannon('b','revolutionary'));
for(let i=0;i<90;i++){for(const id of ['a','b'])h.roster.receive(id,{seq:i,forward:false,backward:false,left:false,right:false,boost:false,fire:true,aim:0},1000+i*50);h.step(.05,1000+i*50);}
// Use a separate fresh shot at the end so it survives its bounded lifetime.
a.player.fireCd=0;h.roster.receive('a',{seq:90,forward:false,backward:false,left:false,right:false,boost:false,fire:true,aim:0},5500);h.step(.05,5500);
const full=h.snapshot(),view=interestSnapshot(full,'b',2000)!,distant=interestSnapshot(full,'far',2000)!;assert(view.casings.some(c=>c.weapon==='skewer2'));assert.equal(distant.casings.length,0,'casings respect interest');assert(view.casings.length<=48);
const replica=new ReplicaView();assert(replica.apply(view,view.pilots,view.enemies,'b',view.time));const copy=casingsAt(replica.game,view.time);assert(copy.some(c=>c.weapon==='skewer2'));assert.notEqual(copy[0],view.casings[0]);
const future=copy[0].at-.1,ctx:any=new Proxy({},{get:()=>()=>{},set:()=>true});drawCasings(ctx,replica.game,future);assert(casingsAt(replica.game,view.time).length>0,'delayed playback retains future casings');
assert.notDeepEqual(casingProfile('skewer2','core'),casingProfile('skewer2','shell'),'energy and kinetic shots have distinct spent rounds');
h.step(.05,5550);for(let i=0;i<50;i++)h.step(.05,5600+i*50);assert.equal(h.snapshot().casings.length,0,'effects expire');
console.log('Authoritative shot casings reach nearby replicas, retain profiles and expire');
