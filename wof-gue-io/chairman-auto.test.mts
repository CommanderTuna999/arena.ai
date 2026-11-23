import assert from 'node:assert/strict';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
import {createChairman,tickChairman} from './src/game/chairman';
function setup(){const s=newSave();s.cannon.id='chairman';s.cannon.owned.push('chairman');const g:any=new Game(s,'auto');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};g.input.lmb=false;g.autoFire=true;return g;}
const old=Math.random;try{
 Math.random=()=>0;
 const g=setup(),near=g.makeEnemy(0,2,5400,0,'near',101),far=g.makeEnemy(0,2,20000,0,'far',102);g.enemies=[far,near];let shot:any[]=[];g.beam=(...a:any[])=>shot=a;
 g.firePlayer(.01);assert(g.chairman.scan);assert.equal(g.chairman.scan.enemyId,near.id);assert.equal(g.chairman.scan.manual,false);assert.equal(g.chairman.charge,0,'auto cannot roll an orb');
 near.y+=150;g.firePlayer(g.chairman.scan.duration+.01);assert(shot.length);const [x,y]=g.partWorld(near,near.parts[near.coreId]);assert(Math.abs(shot[2]-Math.atan2(y-shot[1],x-shot[0]))<1e-9,'auto aims at moving core');
 const spent=setup();spent.chairman.drones.fill(Infinity);spent.enemies=[near];for(let i=0;i<10;i++)spent.firePlayer(.1);assert.equal(spent.chairman.charge,0,'automatic mode never fires a guaranteed orb');spent.input.lmb=true;spent.firePlayer(.01);assert(spent.chairman.charge>0,'manual trigger still fires guaranteed orb');
 const interrupted=setup();interrupted.enemies=[near];interrupted.firePlayer(.01);assert(interrupted.chairman.scan);interrupted.chairman.drones.fill(Infinity);interrupted.firePlayer(interrupted.chairman.scan.duration+.01);assert.equal(interrupted.chairman.charge,0,'auto scan does not trigger orb if all drones go dark mid-scan');
 const disabled=setup();disabled.autoFire=false;disabled.enemies=[near];disabled.firePlayer(.1);assert.equal(disabled.chairman.scan,null);
 const s=createChairman();s.charge=.01;tickChairman(s,.2);const first=s.phase;tickChairman(s,.2);s.charge=.41;tickChairman(s,.2);const last=s.phase;assert(last>first*3,'orbit advances while charging');
 const early=createChairman(),late=createChairman();early.charge=.01;late.charge=.7;tickChairman(early,.1);tickChairman(late,.1);assert(late.phase>early.phase,'orbit speeds up as charge progresses');
}finally{Math.random=old;}
console.log('Chairman automatic targeting never fires the sun, manual trigger still does, charge accelerates orbit');
