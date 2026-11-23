import assert from 'node:assert/strict';
import {Game} from './source/src/game/engine';
import {newSave, CANNON_BY_ID} from './source/src/game/data';
import {CombatHarness} from './source/src/game/multiplayer/combat-harness';
import {PilotRoom} from './source/src/game/multiplayer/pilot-room';
import {PilotTransport} from './source/src/game/multiplayer/pilot-transport';
import {ReplicaView} from './source/src/game/multiplayer/replica-view';
const world:any=new Game(newSave(),'world'),h=new CombatHarness(world,3,true,undefined,undefined,true),room=new PilotRoom(world,3,60,h),transport=new PilotTransport(room);
const peer=()=>({bufferedAmount:0,messages:[] as any[],send(s:string){this.messages.push(JSON.parse(s));},close(){}});
const a=peer(),b=peer(),c=peer();assert(transport.attach(a,'a','Alpha'));assert(transport.attach(b,'b','Beta'));assert(transport.attach(c,'c','Charlie'));
const equip=(p:any,cannon:unknown,now:number,extra={})=>transport.receive(p,JSON.stringify({type:'demo-equip',cannon,...extra}),now);
assert(equip(a,'peashooter',1000,{pilotId:'b'}));assert(equip(b,'workhorse',1000));assert.equal(room.roster.get('a')!.stats.cannonId,'peashooter');assert.equal(room.roster.get('b')!.stats.cannonId,'workhorse');assert.equal(room.roster.get('c')!.stats.cannonId,'sting');
assert(!equip(a,'not-a-cannon',1001));for(let i=0;i<6;i++)assert(!equip(a,'not-a-cannon',1002+i));assert(!equip(a,'sting',1010),'equip rate limit includes invalid choices');assert(equip(a,'sting',2000));assert(equip(a,'peashooter',2001));
const pilotA=room.roster.get('a')!,pilotB=room.roster.get('b')!;assert.equal(pilotA.stats.dmg,CANNON_BY_ID.peashooter.dmg);assert.equal(pilotB.stats.dmg,CANNON_BY_ID.workhorse.dmg);assert(pilotA.player.fireCd>=.5,'switch cannot reset a weapon cooldown');
// Actual fire is simulated once per pilot in the shared world, with distinct
// damage values and independent weapons; the third guest stays unchanged.
for(const [i,p] of room.roster.contexts().entries()){p.player.x=-50000;p.player.y=-65000+i*500;p.player.a=0;p.player.fireCd=0;}
for(const [peer,id] of [[a,'a'],[b,'b'],[c,'c']] as const){assert(transport.receive(peer,JSON.stringify({type:'input',frame:{seq:1,forward:false,backward:false,left:false,right:false,boost:false,fire:true,aim:0}}),2100));}
h.step(.033,2100);assert.equal(world.bullets.length,3);assert.deepEqual(world.bullets.map((x:any)=>x.dmg).sort((x:number,y:number)=>x-y),[20,35,55]);
const snap=h.snapshot();const view=new ReplicaView();assert(view.apply(snap,snap.pilots,snap.enemies,'a'));assert.equal(view.game.stats.cannonId,'peashooter');assert.equal(view.game.player.heat,pilotA.player.heat);assert.equal(room.roster.get('c')!.stats.cannonId,'sting');
transport.detach(a);assert(!equip(a,'workhorse',3000),'detached socket cannot equip');assert.equal(room.roster.get('b')!.stats.cannonId,'workhorse');
console.log('Disposable demo cannon choices validate, isolate pilots, fire real projectile stats and render server-selected loadouts');
