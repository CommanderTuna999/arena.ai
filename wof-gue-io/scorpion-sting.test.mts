import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {SPECIES_LIST} from './src/game/enemies';
import {newSave,SHIP_R} from './src/game/data';
import {circleWalkable} from './src/game/world';
let x=0,y=0;outer:for(let xx=5000;xx<20000;xx+=500)for(let yy=5000;yy<20000;yy+=500)if(circleWalkable(xx,yy,500)){x=xx;y=yy;break outer;}assert(x);
function setup(id:string,tier:number){const g:any=new Game(newSave(),'sting');const e=g.makeEnemy(SPECIES_LIST.findIndex(s=>s.id===id),tier,x,y,'test',1);e.a=0;e.eDmg=10;const d=e.abil.find((v:any)=>v.type==='grab');e.act={i:e.abil.indexOf(d),def:d,t:0,ph:1,hit:false,dir:0,fired:false};g.player.x=x+(id==='spider'?1.9:3.35)*e.S;g.player.y=y;g.player.hp=g.player.maxHp=1e9;g.player.shield=0;g.player.pull={e,x,y,t:2,max:2};g.stats.dodge=0;return {g,e};}
for(const tier of [1,2,3,4,5]){
 const {g,e}=setup('scorpion',tier);const hits:number[]=[];g.hurtPlayer=(damage:number)=>hits.push(damage);
 for(let i=0;i<13;i++)g.runAct(e,.05,0,3.35*e.S);
 assert.equal(g.player.stingDots.length,0,'no sting before 0.7s');
 g.runAct(e,.05,0,3.35*e.S);assert.equal(g.player.stingDots.length,tier>=3?1:0,'only Epic+ stings at 0.7 seconds');
 assert.equal(hits[0],20,'pincer hit is twice base damage');
 if(tier>=3){hits.length=0;for(let i=0;i<3;i++)g.runAct(e,.05,0,3.35*e.S);assert.equal(g.player.stingDots.length,1,'sting applies once');g.player.pull=null;hits.length=0;for(let i=0;i<51;i++)g.tickScorpionStings(.1);assert(Math.abs(hits.reduce((a,b)=>a+b,0)-180)<1e-7,'18x damage over exactly five seconds after release');assert.equal(g.player.stingDots.length,0);}
}
{
 const {g,e}=setup('scorpion',3);e.parts.find((p:any)=>p.name==='Stinger').alive=false;for(let i=0;i<15;i++)g.runAct(e,.05,0,3.35*e.S);assert.equal(g.player.stingDots.length,0,'destroyed stinger cannot sting');
}
{
 const {g,e}=setup('scorpion',3);g.input.lmb=true;g.autoFire=true;g.player.gatSpin=1.5;g.mediatorBeamTime=2;g.fencerCharge=2;let rack=false;g.fireWeapons=()=>{rack=true};g.firePlayer(.05);assert.equal(g.bullets.length,0);assert.equal(rack,false);assert.equal(g.mediatorBeamTime,0);assert.equal(g.fencerCharge,0);
}
{
 const {g,e}=setup('spider',4);g.runAct(e,.05,0,1.9*e.S);assert(Math.abs(g.player.x-(x+1.9*e.S))<1e-6);for(const q of e.parts)if(q.name==='Fang')q.alive=false;g.runAct(e,.05,0,1.9*e.S);assert(Math.abs(g.player.x-(x+1.45*e.S+SHIP_R))<1e-6,'fangless spider holds at head');assert.equal(e.act.ph,1);
}
console.log('Scorpion grab damage, firing lock, delayed five-second sting and spider head fallback verified');
