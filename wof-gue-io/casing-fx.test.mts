import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';import {casingsAt,ejectCasing,ejectCasingLimited} from './src/game/casing-fx';
function fire(id:string){const s=newSave();s.cannon.owned.push(id);s.cannon.id=id;const g:any=new Game(s,'test');g.player.x=5200;g.player.y=0;g.player.a=0;g.input.lmb=true;if(id==='gatler')g.player.gatSpin=1.5;g.t=.05;g.firePlayer(.05);return g;}
for(const [id,kind] of [['peashooter','small'],['gatler','small'],['scattermk1','shell'],['skewer','shell'],['workhorse','shell']] as const){const g=fire(id);const q=casingsAt(g,g.t);assert(q.length>0,id);assert(q.every(v=>v.kind===kind),id);}
const s=newSave();s.cannon.owned.push('mediator');s.cannon.id='mediator';const g:any=new Game(s,'test');g.player.x=5200;g.player.y=0;g.input.lmb=true;for(let i=0;i<45;i++){g.t+=.05;g.firePlayer(.05);}g.input.lmb=false;g.t+=.05;g.firePlayer(.05);assert.equal(casingsAt(g,g.t).length,0);for(let i=0;i<60;i++){g.t+=.05;g.firePlayer(.05);}assert.equal(casingsAt(g,g.t).filter(v=>v.kind==='core').length,1,'one core on beam completion');
const obj={};for(let i=0;i<200;i++)ejectCasing(obj,0,0,0,1,'small');assert.equal(casingsAt(obj,1).length,48);assert.equal(casingsAt(obj,3).length,0);
const beam={};for(let i=0;i<10;i++)ejectCasingLimited(beam,'0',0,0,0,i*.1);assert.equal(casingsAt(beam,1).length,1);
console.log('Weapon ejecta match projectile classes, beam fires one core and effects are bounded');

const variety={};for(let i=0;i<12;i++)ejectCasing(variety,0,0,0,1,'small',0,0,'gatler');const v=casingsAt(variety,1);assert(new Set(v.map(q=>q.vx.toFixed(2))).size>8);assert(new Set(v.map(q=>q.spin.toFixed(2))).size>8);assert(v.every(q=>q.weapon==='gatler'));
for(const chance of [0,1]){const s=newSave();s.cannon.owned.push('skewer2');s.cannon.id='skewer2';const g:any=new Game(s,'alt');g.player.x=5200;g.stats.energyChance=chance;g.input.lmb=true;g.t=.1;g.firePlayer(.05);assert.equal(casingsAt(g,g.t)[0].kind,chance?'core':'shell','ejecta follow the actual shot');}

// Every defined player weapon has a hand-authored profile, not a hash-derived
// tint. Mixed-shot weapons must select a different shape for energy rounds.
import {CANNONS,RECIPES} from './src/game/data';import {CASING_PROFILES,casingProfile,drawCasings} from './src/game/casing-fx';
const ids=[...CANNONS.map(c=>c.id),...RECIPES.filter(r=>r.slot==='weapon').map(r=>r.id)];
for(const id of ids)assert(CASING_PROFILES[id],`missing authored casing: ${id}`);
assert.equal(new Set(ids.map(id=>JSON.stringify(CASING_PROFILES[id]))).size,ids.length,'weapons have unique designs');
for(const id of ['skewer2','fencer']) {assert.equal(casingProfile(id,'shell').shape,'brass');assert.equal(casingProfile(id,'core').shape,'battery');}
assert.equal(casingProfile('mediator','core').shape,'battery');assert(casingProfile('mediator','core').length>=50,'mediator gets a large long power rod');
let rects=0;const ctx:any={save(){},restore(){},translate(){},rotate(){},fillRect(){rects++}};const rod={};ejectCasing(rod,0,0,0,0,'core',0,0,'mediator');drawCasings(ctx,rod,.2);assert(rects>=10,'power rod is layered, not a plain rectangle');
console.log('All cannons and crafted weapons have explicit unique visual profiles');
// Exercise the actual crafted-weapon firing path, not just the profile table.
for(const id of ids.filter(id=>RECIPES.some(r=>r.id===id&&r.slot==='weapon')&&id!=='drones')){
 const g:any=new Game(newSave(),'crafted');g.player.x=5200;g.player.y=0;g.stats.weapons=[{rid:id,eff:1}];g.player.wCd=[0];
 const enemy:any={x:5300,y:0,dead:false,id:1,radius:5,shells:[],parts:[{alive:true}],stun:0};g.enemies=[enemy];g.combatTarget=()=>enemy;g.aimPoint=()=>[5300,0];g.partWorld=()=>[5300,0];g.inSafe=()=>false;g.updateWeaponAims=()=>{};g.beam=()=>{};g.empBlast=()=>{};g.ringFx=()=>{};g.damagePart=()=>{};g.nearestEnemyExcept=()=>null;g.lock={e:enemy,part:enemy.parts[0]};
 g.fireWeapons(.05,0);const q=casingsAt(g,g.t);assert.equal(q.length,1,`${id} ejects only on firing`);assert.equal(q[0].weapon,id);assert.equal(q[0].profile,CASING_PROFILES[id]);
}
const drone:any=new Game(newSave(),'drone');drone.stats.weapons=[{rid:'drones',eff:1}];drone.player.x=5200;drone.combatTarget=()=>({});drone.aimPoint=()=>[5300,0];drone.updateDrones(.5);assert.equal(casingsAt(drone,drone.t).length,2,'each firing drone ejects its own cartridge');assert(casingsAt(drone,drone.t).every(q=>q.weapon==='drones'));
const rngObj={};const originalRandom=Math.random;Math.random=()=>{throw Error('cosmetics must not consume combat RNG')};try{ejectCasing(rngObj,0,0,0,0,'core',0,0,'mediator');}finally{Math.random=originalRandom;}
