import assert from 'node:assert/strict';import {Game} from './source/src/game/engine';import {BASE,CANNONS,newSave} from './source/src/game/data';import {CombatHarness} from './source/src/game/multiplayer/combat-harness';
for(const gun of CANNONS){
 const world:any=new Game(newSave(),'world'),h=new CombatHarness(world,2,false);assert(h.roster.add('a','Alpha'));assert(h.roster.add('b','Beta'));const a=h.roster.get('a')!,b=h.roster.get('b')!;
 assert(h.roster.equipDemoCannon('a',gun.id),`${gun.name} can equip at base`);assert.equal(b.stats.cannonId,'sting','other guest keeps their gun');
 assert(!h.roster.upgradeDemoCannon('a','not-a-track',1,gun.id));assert(!h.roster.upgradeDemoCannon('a',gun.tracks[0],1,'wrong-gun'),'stale gun upgrades rejected');assert(h.roster.upgradeDemoCannon('a',gun.tracks[0],1,gun.id));assert.equal(a.save.cannon.lv[gun.id][gun.tracks[0]],1);
 a.player.x=-50000;a.player.y=-65000;a.player.a=0;a.player.fireCd=0;b.player.x=-51000;b.player.y=-64000;assert(!h.roster.equipDemoCannon('a','sting') || gun.id==='sting','loadouts cannot change outside base');
 const enemy=world.makeEnemy(0,2,-49700,-65000,'test',42);world.enemies.push(enemy);enemy.shells=[];enemy.shields=[];for(const p of enemy.parts)p.hp=p.maxHp=1e9;world.stepEnemyAgainstPilots=()=>true;
 let produced=false;for(let i=0;i<120;i++){const fire=gun.id==='mediator'?i<50:true;assert(h.roster.receive('a',{seq:i,forward:false,backward:false,left:false,right:false,boost:false,fire,aim:0,aimDistance:300},1000+i*50));h.step(.05,1000+i*50);if(world.bullets.length||h.snapshot().beams.length)produced=true;}
 const report=world.experimentalDamageReport(enemy);assert(produced || report.total>0,`${gun.name} produces a simulated shot`);assert(report.total>0,`${gun.name} can damage a shared enemy`);assert(report.contributions.some((c:any)=>c.pilotId==='a'),`${gun.name} damage is credited to shooter`);
 assert.equal(b.stats.cannonId,'sting');assert.equal(a.stats.cannonId,gun.id);
 console.log(`  ${gun.name}: fired and damaged the shared enemy`);
}
console.log('Every live-game cannon can be equipped at base, upgraded and tested against an authoritative shared enemy');
// A fresh left click is routed to only the Chairman pilot, not the other
// guest. Ordinary automatic mode must not request a sun blast on its own.
{
 const world:any=new Game(newSave(),'world'),h=new CombatHarness(world,2,false,undefined,undefined,true);h.roster.add('a','Alpha');h.roster.add('b','Beta');const a=h.roster.get('a')!,b=h.roster.get('b')!;assert(h.roster.equipDemoCannon('a','chairman'));a.player.fireCd=0;
 a.chairman!.drones.fill(Infinity);const frame={seq:1,forward:false,backward:false,left:false,right:false,boost:false,fire:false,aim:0};h.roster.receive('a',frame,1000);h.step(.05,1000);assert.equal(a.chairman!.charge,0,'auto mode alone cannot request the sun');
 h.roster.receive('a',{...frame,seq:2,fire:true},1050);h.step(.05,1050);assert(a.chairman!.charge>0,'fresh player click requests sun with dark drones');assert.equal(b.chairman,null,'other pilot is isolated');
}
