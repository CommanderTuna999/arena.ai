import assert from 'node:assert/strict';
import {Game} from './source/src/game/engine';import {newSave} from './source/src/game/data';
import {CombatHarness} from './source/src/game/multiplayer/combat-harness';import {ReplicaView} from './source/src/game/multiplayer/replica-view';
const world:any=new Game(newSave(),'world'),h=new CombatHarness(world,3,false,undefined,undefined,true);assert(h.roster.add('a','Alpha'));assert(h.roster.add('b','Beta'));
const a=h.roster.get('a')!,b=h.roster.get('b')!;a.player.x=-50000;a.player.y=-65000;b.player.x=-48000;b.player.y=-65000;
assert.equal(a.stats.shieldMax,60);assert.equal(a.player.shield,60);assert.equal(b.player.shield,60);assert.equal(newSave().upgrades.shield,undefined,'the default main-game save is unchanged');
world.puddles.push({x:a.player.x,y:a.player.y,r:40,life:1,max:1,arm:0,dps:200,slow:0,hue:0});h.step(.05,1000);world.puddles=[];
const damaged=a.player.shield;assert(damaged<60 && damaged>0,'main-game damage hits shield first');assert.equal(a.player.hp,100);assert.equal(b.player.shield,60,'damage and cooldown remain pilot-specific');assert.equal(b.player.hp,100);
for(let i=0;i<40;i++)h.step(.05,1050+i*50);assert.equal(a.player.shield,damaged,'shield waits for its post-hit delay');
for(let i=0;i<65;i++)h.step(.05,3050+i*50);assert(a.player.shield>damaged,'shield recharges after the main-game delay');assert.equal(b.player.shield,60);
b.player.x=-59000;b.player.y=-68000;assert(h.roster.equipDemoCannon('b','workhorse'));b.player.x=-48000;b.player.y=-65000;b.player.heat=.7;b.player.jam=1;b.player.recoil=.4;b.player.muzzleFlash=.8;b.player.barrelRec=[.9,.2];
const snap=h.snapshot(),p=snap.pilots.find(p=>p.id==='a')!,q=snap.pilots.find(p=>p.id==='b')!;assert.equal(p.shield,a.player.shield);assert.equal(p.shieldMax,60);assert.equal(q.cannonId,'workhorse');
const replica=new ReplicaView();assert(replica.apply(snap,snap.pilots,snap.enemies,'a'));assert.equal(replica.game.stats.shieldMax,60);assert.equal(replica.game.player.shield,a.player.shield);
const remote=replica.game.others[0];assert.equal(remote.cannonId,'workhorse');assert.equal(remote.shield,60);assert.equal(remote.heat,.7);assert.deepEqual(remote.barrelRec,[.9,.2]);remote.barrelRec![0]=5;assert.equal(q.barrelRec[0],.9,'replica does not mutate wire state');
a.player.hp=0;a.player.dead=true;const dead=h.snapshot();assert(dead.pilots.find(x=>x.id==='a')!.dead);assert(replica.apply(dead,dead.pilots,dead.enemies,'b'));assert.equal(replica.game.others.find(x=>x.id==='a')!.dead,true);
console.log('Guest shields absorb and recharge independently, and remote visuals use copied server state');
// Exercise the actual canvas renderer with a recording context. This confirms
// remote cannons and shields reach the render path; it is not a visual review.
{
 const {render}=await import('./source/src/game/render');
 const counts:Record<string,number>={};const gradient={addColorStop(){}};
 const ctx:any=new Proxy({canvas:{width:800,height:600}}, {get(target,key){if(key in target)return (target as any)[key];if(key==='createRadialGradient'||key==='createLinearGradient')return ()=>gradient;if(key==='measureText')return ()=>({width:50});return (..._args:any[])=>{counts[String(key)]=(counts[String(key)]??0)+1;};},set(target,key,value){(target as any)[key]=value;return true;}});
 (globalThis as any).document={createElement:()=>({getContext:()=>ctx})};
 const live=h.snapshot();assert(replica.apply(live,live.pilots,live.enemies,'a'));
 render(replica.game,ctx);const withGun=counts.rect??0,withShield=counts.arc??0;
 const other=replica.game.others[0];delete other.cannonId;other.shield=0;for(const key of Object.keys(counts))delete counts[key];render(replica.game,ctx);
 assert(withGun>(counts.rect??0),'remote cannon geometry is rendered');assert(withShield>(counts.arc??0),'remote shield animation is rendered');
 delete (globalThis as any).document;
}
console.log('Remote cannon and shield draw paths execute with a recording canvas');
