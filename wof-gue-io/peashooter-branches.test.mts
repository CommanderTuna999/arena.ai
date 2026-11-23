import assert from 'node:assert/strict';
import {CANNON_BY_ID,cannonTracks,cannonBarrels,cannonSpread,cannonBillPicks,cannonBillProblem,newSave,computeStats,type Comp} from './src/game/data';
import {Game} from './src/game/engine';import {readFileSync} from 'node:fs';
const pea=CANNON_BY_ID.peashooter2,gat=CANNON_BY_ID.gatler,scatter=CANNON_BY_ID.scattermk1;
assert.deepEqual([pea.dmg,pea.interval,pea.credits,pea.requires],[80,.03,6000,'peashooter']);assert.deepEqual([gat.dmg,gat.interval,gat.credits,gat.requires],[50,.01,8000,'peashooter']);assert.deepEqual([scatter.dmg,scatter.interval,scatter.credits,scatter.requires],[35,.5,12000,'peashooter']);
assert.equal(pea.desc,'Spray and pray, now with more barrels.');assert.equal(gat.desc,'So we’re just spamming now.');assert.equal(scatter.desc,'Balls to the face.');
assert.equal(cannonTracks(pea).map(t=>t.id).join(','),'acc,speed,dmg,crit,critDmg,barrels');assert.equal(cannonTracks(gat).map(t=>t.id).join(','),'acc,speed,dmg,crit,critDmg');assert.equal(cannonTracks(scatter).map(t=>t.id).join(','),'spread,pen,dmg,crit,critDmg,rate');
assert.equal(cannonBarrels({},pea),3);assert.equal(cannonBarrels({barrels:1},pea),4);assert(cannonSpread(scatter,{spread:2})<cannonSpread(scatter));assert(cannonSpread(pea,{acc:2})<cannonSpread(pea));
const part=(id:string,kind:Comp['kind'],tier:number,name:string,species='Mantis'):Comp=>({id,kind,tier,name,species,poly:[],area:1,mass:1,hue:1,value:1});
const mk=(s:string,n:number,k:Comp['kind'],tier:number,name:string,species='Mantis')=>Array.from({length:n},(_,i)=>part(s+i,k,tier,name,species));
let save=newSave();save.credits=99999;save.cannon.owned.push('peashooter');
save.inventory=[...mk('l',5,'leg',2,'Mantis Leg'),...mk('c',7,'core',2,'Mantis Core'),...mk('a',3,'segment',2,'Mantis Abdomen')];assert.equal(cannonBillPicks(save,pea).length,15);assert.equal(cannonBillProblem(save,pea),null);
const g=new Game(save,'p');assert.equal(g.buyCannonChassis(pea.id),null);assert.equal(g.save.inventory.length,0);assert.equal(g.save.cannon.id,pea.id);assert.equal(g.stats.muzzles.length,3);assert.equal(g.buyCannon('barrels',1),1);assert.equal(g.stats.muzzles.length,4);
function buildGat(){const s=newSave();s.credits=8000;s.cannon.owned.push('peashooter');s.inventory=[...mk('p',1,'armor',3,'Scorpion Carapace Plate','Scorpion'),...mk('h',8,'segment',2,'Mantis Head'),...mk('t',5,'segment',2,'Mantis Thorax')];return s;}
save=buildGat();assert.equal(cannonBillProblem(save,gat),null);save.inventory[9].species='Widow Spider';assert.match(cannonBillProblem(save,gat)!,/Mantis thorax/);save=buildGat();save.inventory[0].name='Scorpion Thorax Plate';assert.match(cannonBillProblem(save,gat)!,/carapace plate/);
save=newSave();save.credits=12000;save.cannon.owned.push('peashooter');save.inventory=[...mk('l',15,'leg',2,'Mantis Leg'),...mk('c',2,'core',3,'Mantis Core'),...mk('w',1,'segment',3,'Widow Spider Cephalothorax','Widow Spider')];assert.equal(cannonBillProblem(save,scatter),null);save.inventory.at(-1)!.species='Mantis';assert.match(cannonBillProblem(save,scatter)!,/Widow Spider thorax/);
save.cannon.owned=[];assert.match(cannonBillProblem(save,scatter)!,/Requires/);
function simulation(id:string,step:number,duration:number){const s=newSave();s.cannon.owned.push(id);s.cannon.id=id;const game=new Game(s,'fire') as any;game.player.x=5200;game.player.y=0;game.player.a=0;game.input.lmb=true;if(id==='gatler')game.player.gatSpin=1.5;for(let t=0;t<duration-1e-9;t+=step){game.t+=step;game.firePlayer(step);}return game;}
for(const [id,expected] of [['peashooter2',1/.03],['gatler',100]] as const){
 for(const dt of [1/30,1/60,1/144]) {const game=simulation(id,dt,3);const actual=game.bullets.length/3;assert(Math.abs(actual-expected)<1,`${id} ${dt} actual ${actual}`);assert(game.bullets.every((b:any)=>b.dmg===CANNON_BY_ID[id].dmg));}
}
const peaFire=simulation('peashooter2',.01,.18);assert.equal(new Set(peaFire.bullets.map((b:any)=>b.y.toFixed(2))).size>2,true,'rotary barrels feed real muzzle positions');
const gatFire=simulation('gatler',.01,.1);assert(gatFire.player.vx < -100,'Gatler kicks the hull backwards');
const scatterFire=simulation('scattermk1',.01,.01);assert.equal(scatterFire.bullets.length,8);assert(scatterFire.bullets.every((b:any)=>b.dmg===35));assert(scatterFire.player.vx <= -180);assert(scatterFire.bullets.some((b:any)=>b.vy>0)&&scatterFire.bullets.some((b:any)=>b.vy<0));
const select=newSave();select.cannon.id='gatler';select.cannon.owned.push('gatler');const turning=new Game(select,'turn') as any;turning.player.x=5200;turning.player.y=0;turning.player.a=0;turning.input.mx=turning.w/2;turning.input.my=turning.h/2+200;turning.cam.x=turning.player.x;turning.cam.y=turning.player.y;turning.admin.sandbox=true;turning.update(.05);assert(Math.abs(turning.player.a)<=.150001,'Gatler has a heavy aiming turn limit');
const ui=readFileSync(new URL('./src/components/GameClient.tsx',import.meta.url),'utf8');assert.match(ui,/title="Open base \(E\)"[\s\S]{0,350}>\s*<span className="text-xl font-black">E<\/span>/);
console.log('Peashooter branches: crafting, species restrictions, upgrades, barrel rotation, frame-independent rapid fire, scatter, recoil, turn rate and E prompt verified');
