import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {SPECIES_LIST} from './src/game/enemies';
import {newSave, SHIP_R} from './src/game/data';
import {circleWalkable} from './src/game/world';
const g:any=new Game(newSave(),'grab-test');g.resize(1280,720,1);g.player.hp=g.player.maxHp=1e9;g.stats.dodge=0;
let x=0,y=0; outer: for(let xx=5000;xx<20000;xx+=500) for(let yy=5000;yy<20000;yy+=500) if(circleWalkable(xx,yy,400)){x=xx;y=yy;break outer;} assert(x);
function enemy(id:string,tier:number){const e=g.makeEnemy(SPECIES_LIST.findIndex(s=>s.id===id),tier,x,y,'test',7);e.a=0;e.vx=e.vy=0;const def=e.abil.find(a=>a.type==='grab');e.act={i:e.abil.indexOf(def),def,t:0,ph:0,hit:false,dir:0,fired:false};g.player.dead=false;g.player.pull=null;return e;}
for(const tier of [1,2,4]){
 const e=enemy('scorpion',tier);g.player.x=x+3.35*e.S;g.player.y=y;
 g.runAct(e,.05,0,3.35*e.S);assert.equal(e.vx,0,'in-range scorpion does not lunge');
 for(let i=0;i<15 && e.act.ph===0;i++) g.runAct(e,.05,0,3.35*e.S);
 assert.equal(e.act.ph,1);g.runAct(e,.05,0,3.35*e.S);assert(Math.abs(g.player.x-(x+3.35*e.S))<1e-6);assert.equal(g.player.pull.e,e);
 // Real enemy update rotates the actual claw groups and does not push the
 // held player away through ordinary body-contact separation.
 e.aggro=true;g.updateEnemy(e,.05,g.player.x-e.x,g.player.y-e.y,Math.hypot(g.player.x-e.x,g.player.y-e.y));
 assert(e.groups.filter(q=>q.role==='arm').every(q=>q.ang*q.sign<0));
 assert(Math.abs(g.player.x-(e.x+3.35*e.S*Math.cos(e.a)))<1e-5);
 // Destroy both pincers on one side: no invisible grip.
 for(const p of e.parts) if(p.name==='Pincer' && e.groups[p.g].sign===1)p.alive=false;
 g.runAct(e,.05,0,3.35*e.S);assert.equal(e.act.ph,2);assert.equal(g.player.pull,null);
 const far=enemy('scorpion',tier);g.player.x=x+5*far.S+SHIP_R;g.player.y=y;g.runAct(far,.05,0,5*far.S+SHIP_R);assert(far.vx>0,'out-of-range scorpion lunges');
}
for(const tier of [4,5]) {const e=enemy('spider',tier);g.player.x=x+1.9*e.S;g.player.y=y;for(let i=0;i<15 && e.act.ph===0;i++)g.runAct(e,.05,0,1.9*e.S);assert.equal(e.act.ph,1);g.runAct(e,.05,0,1.9*e.S);assert(Math.abs(g.player.x-(x+1.9*e.S))<1e-6,'spider holds at fangs, not leg radius');assert.equal(g.player.pull.e,e);}
console.log('Grab anatomy, scorpion reach and destroyed-pincer release verified');
