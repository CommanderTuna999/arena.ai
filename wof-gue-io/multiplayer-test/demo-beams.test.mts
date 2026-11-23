import assert from 'node:assert/strict';import {Game} from './source/src/game/engine';import {newSave} from './source/src/game/data';import {CombatHarness} from './source/src/game/multiplayer/combat-harness';import {ReplicaView} from './source/src/game/multiplayer/replica-view';import {interestSnapshot} from './source/src/game/multiplayer/interest';import {segmentDistance} from './source/src/game/multiplayer/demo-beams';
const world:any=new Game(newSave(),'world'),h=new CombatHarness(world,3,false);assert(h.roster.add('a','Alpha'));assert(h.roster.add('b','Beta'));assert(h.roster.add('observer','Observer'));
const a=h.roster.get('a')!,b=h.roster.get('b')!,o=h.roster.get('observer')!;assert(h.roster.equipDemoCannon('a','skewer'));assert(h.roster.equipDemoCannon('b','fencer'));
for(const [p,y] of [[a,-65000],[b,-64500],[o,-64000]] as const){p.player.x=-50000;p.player.y=y;p.player.a=0;p.player.fireCd=0;}
b.player.fenceShots=4;
const frame=(seq:number,fire:boolean)=>({seq,forward:false,backward:false,left:false,right:false,fire,boost:false,aim:0});assert(h.roster.receive('a',frame(1,true),1000));assert(h.roster.receive('b',frame(1,true),1000));
// A concrete procedural enemy intercepts Skewer's hitscan. Freeze only its AI
// to make this deterministic; damage, shielding and beam logic are real.
const enemy=world.makeEnemy(0,2,-49700,-65000,'test',42);world.enemies.push(enemy);enemy.shells=[];enemy.shields=[];world.stepEnemyAgainstPilots=()=>true;
for(const p of enemy.parts){p.hp=p.maxHp=10000;}
const before=enemy.parts.reduce((n:number,p:any)=>n+p.hp,0);h.step(.05,1000);const after=enemy.parts.reduce((n:number,p:any)=>n+p.hp,0);assert(after<before,'Skewer hits and damages real enemy parts');assert.equal(world.experimentalDamageReport(enemy).contributions[0].pilotId,'a','hitscan damage credits the firing guest');
assert.equal(world.beams.length,0,'transient engine effects are drained');let snap=h.snapshot();assert.equal(snap.beams.length,1);assert.equal(b.weaponState.fencerCharge>0,true,'Fencer fifth shot charges independently');assert.equal(a.weaponState.fencerCharge,0);
assert(h.roster.receive('a',frame(2,false),1050));assert(h.roster.receive('b',frame(2,false),1050));for(let i=0;i<9;i++)h.step(.05,1050+i*50);snap=h.snapshot();assert(snap.beams.some(beam=>beam.color==='#c4a6ff'),'Fencer releases the fifth charged energy shot');assert(snap.beams.length<=512);
const copy=structuredClone(snap),view=new ReplicaView(),beam=snap.beams[0];assert(view.apply(snap,snap.pilots,snap.enemies,'a',beam.createdAt));assert(view.game.beams.some(v=>v.x1===beam.x1));assert.deepEqual(snap,copy,'renderer does not mutate transmitted beam data');assert(view.apply(snap,snap.pilots,snap.enemies,'a',beam.expiresAt+.01));assert(!view.game.beams.some(v=>v.x1===beam.x1),'beam expires on render clock without a new snapshot');
assert.equal(segmentDistance(5,1,{x1:0,y1:0,x2:10,y2:0}),1);assert.equal(segmentDistance(5,2,{x1:0,y1:0,x2:0,y2:0}),Math.hypot(5,2));
const crossing={...snap,beams:[{id:999,x1:-1000,y1:0,x2:1000,y2:0,createdAt:0,expiresAt:.6}],pilots:[{...snap.pilots[0],x:0,y:0}]};assert.equal(interestSnapshot(crossing,'a',20)!.beams.length,1,'long beam crossing view is included even if endpoints are outside');
for(let i=0;i<16;i++)h.step(.05,1600+i*50);assert.equal(h.snapshot().beams.length,0,'old beam history is bounded and expires');
assert(h.roster.equipDemoCannon('b','sting'));assert.equal(b.weaponState.fencerCharge,0);assert.equal(b.player.fenceShots,0);
console.log('Skewer and Fencer simulate owned hitscan damage, independent charges, bounded beam relay and rendering');
