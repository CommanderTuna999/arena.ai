import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CANNON_BY_ID,cannonTracks,cannonTrackValue,cannonBillProblem,cannonBillPicks,newSave,type Comp} from './src/game/data';
import {Game} from './src/game/engine';
import {CASING_PROFILES} from './src/game/casing-fx';
const gun=CANNON_BY_ID.revolutionary;
assert.deepEqual([gun.tier,gun.requires,gun.dmg,gun.credits,gun.hitscan],[2,'workhorse',18000,50000,true]);
assert.equal(CANNON_BY_ID.mediator.name,'Mediator');
assert.deepEqual(cannonTracks(gun).map(t=>t.id),['dmg','rate','pen','barrels','crit','critDmg','armorDmg']);
assert.equal(cannonTrackValue(gun,'armorDmg',10),'+250% vs armour');
const mk=(kind:Comp['kind'],tier:number,name:string,species:string,n:number):Comp[]=>Array.from({length:n},(_,i)=>({id:`${species}-${name}-${i}`,kind,tier,name:`${species} ${name}`,species,poly:[],area:1,mass:1,hue:1,value:1}));
const s=newSave();s.credits=50000;s.cannon.owned.push('workhorse');s.inventory=[...mk('armor',3,'Compound Eye','Dragonfly',2),...mk('armor',3,'Eye Cluster','Widow Spider',3),...mk('segment',2,'Head','Mantis',7),...mk('core',3,'Core','Mantis',4)];
assert.equal(cannonBillProblem(s,gun),null);assert.equal(cannonBillPicks(s,gun).length,16);s.inventory[0].species='Mantis';assert.match(cannonBillProblem(s,gun)!,/Dragonfly/);s.inventory[0].species='Dragonfly';
const g:any=new Game(s,'test');assert.equal(g.buyCannonChassis('revolutionary'),null);assert.equal(g.save.credits,0);assert.equal(g.save.inventory.length,0);assert.equal(g.stats.dmg,18000);assert.equal(g.stats.pierce,5);
g.player.x=5200;g.player.y=0;g.player.a=0;g.input.lmb=true;let args:any[]=[];g.beam=(...a:any[])=>{args=a};g.firePlayer(.01);assert.equal(args[4],18000);assert.equal(args[5],5);assert.equal(args[7],'laser');assert.equal(args[8],'#ff263b');assert.equal(args[12],true);assert.equal(g.player.vx,-300);assert.equal(g.player.fireCd,4);assert.equal(CASING_PROFILES.revolutionary.shape,'battery');
g.save.credits=1000000;assert.equal(g.buyCannon('barrels',1),1);assert.equal(g.stats.muzzles.length,2);g.player.fireCd=0;g.firePlayer(.01);const y1=args[1];g.player.fireCd=0;g.firePlayer(.01);assert.notEqual(args[1],y1);
const r=readFileSync(new URL('./src/game/render.ts',import.meta.url),'utf8');assert.match(r,/redFlash[\s\S]*?fillRect\(0, 0, w, h\)/);
// Exercise the real beam collision with controlled targets and verify splash is
// once per shot, excludes its direct target and uses energy damage.
const h:any=new Game(newSave(),'beam');const p={id:1,kind:'armor',alive:true};const e={id:1,dead:false,x:100,y:0,a:0,radius:100,shieldReach:0,melt:0,shells:[],parts:[p]};h.enemies=[e];h.shieldAt=()=>null;h.partAt=()=>p;const direct:any[]=[];const splash:any[]=[];h.damagePart=(...a:any[])=>direct.push(a);h.areaDamage=(...a:any[])=>splash.push(a);h.burst=()=>{};h.ringFx=()=>{};h.beam(0,0,0,200,18000,5,false,'laser','#ff263b',1,3.5,false,true);assert.equal(direct.length,1);assert.equal(direct[0][2],63000);assert.equal(direct[0][5],'laser');assert.equal(splash.length,1);assert.equal(splash[0][3],3600);assert.equal(splash[0][4],p);assert.equal(splash[0][5],'laser');assert.equal(h.beams[0].color,'#ff263b');
console.log('Revolutionary recipe, upgrades, hitscan, energy splash, recoil, alternating barrels and flash verified');
