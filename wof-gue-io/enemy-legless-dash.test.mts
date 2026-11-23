import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {SPECIES_LIST} from './src/game/enemies';
import {newSave, SHIP_R} from './src/game/data';
import {circleWalkable} from './src/game/world';
let x=0,y=0; outer: for(let xx=5000;xx<20000;xx+=500) for(let yy=5000;yy<20000;yy+=500) if(circleWalkable(xx,yy,400)){x=xx;y=yy;break outer;} assert(x);
const g:any=new Game(newSave(),'leg-dash');g.player.hp=g.player.maxHp=1e9;g.stats.dodge=0;
const make=(id:string,tier=5)=>{const e=g.makeEnemy(SPECIES_LIST.findIndex(s=>s.id===id),tier,x,y,'test',7);e.a=0;g.player.x=e.x+500;g.player.y=e.y;return e;};
const strip=(e:any)=>{for(const p of e.parts)if(p.kind==='leg'){p.alive=false;p.hp=0;}g.refreshMobility(e);assert.equal(e.turnFrac,0);};
const setAct=(e:any,type:string,phase=0)=>{const def=e.abil.find((a:any)=>a.type===type);assert(def,`${e.spd.id} has ${type}`);e.act={i:e.abil.indexOf(def),def,t:0,ph:phase,hit:false,dir:0,fired:false};};
for(const spec of SPECIES_LIST){
 const e=make(spec.id);if(!e.legCount || spec.id==='serpent')continue;
 for(const type of ['charge','sting'])if(e.abil.some((a:any)=>a.type===type)){
  setAct(e,type,1);e.vx=500;e.vy=100;strip(e);g.runAct(e,.05,0,500);assert.equal(e.act,null,`${spec.id} cancels ${type}`);assert.equal(e.vx,0);assert.equal(e.vy,0);
  e.abil=e.abil.filter((a:any)=>a.type===type);e.abilCd=e.abil.map(()=>0);g.chooseAct(e,500,0);assert.equal(e.act,null,`${spec.id} cannot start ${type}`);
 }
}
for(const id of ['spider','scorpion','dragonfly']){
 const e=make(id);setAct(e,'grab');strip(e);e.vx=500;g.player.x=e.x+6*e.S+SHIP_R;g.runAct(e,.05,0,g.player.x-e.x);assert.equal(e.vx,0,`${id} cannot lunge to grab`);
}
// Losing legs during a hold does not release an otherwise valid grip.
{
 const e=make('scorpion',4);setAct(e,'grab',1);strip(e);g.player.x=e.x+3.35*e.S;g.player.y=e.y;g.player.pull={e,x:e.x,y:e.y,t:2,max:2};g.runAct(e,.05,0,3.35*e.S);assert.equal(e.act.ph,1);assert.equal(g.player.pull.e,e);
}
console.log('Destroyed legs prevent charge, sting and grab lunges, including mid-attack');
