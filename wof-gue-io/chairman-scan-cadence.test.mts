import assert from 'node:assert/strict';import {Game} from './src/game/engine';import {newSave} from './src/game/data';import {scanPartIndex} from './src/game/target-scan';
const old=Math.random;try{Math.random=()=>.5;
for(const manual of [false,true])for(const rate of [.5,2,4]){
 const s=newSave();s.cannon.id='chairman';s.cannon.owned.push('chairman');const g:any=new Game(s,'cadence');g.player.x=5200;g.player.y=0;g.cam={x:5200,y:0,z:1};g.stats.rate=rate;g.input.lmb=manual;g.autoFire=!manual;const e=g.makeEnemy(0,2,5400,0,'test',401);g.enemies=[e];g.partAt=()=>e.parts[0];g.input.mx=600;g.input.my=300;
 const shots:number[]=[];let t=0;g.beam=()=>shots.push(t);let started=0, finishedEarly=false;
 for(let i=0;i<Math.ceil((4/rate+2)*100);i++){t=i*.01;g.firePlayer(.01);if(g.chairman.scan){started++;assert(g.chairman.scan.duration<=.8/rate+1e-10);if(g.chairman.scan.elapsed>=g.chairman.scan.duration && g.player.fireCd>0){finishedEarly=true;assert.equal(scanPartIndex(g.chairman.scan),-1);}}if(shots.length>=4)break;}
 assert.equal(shots.length,4,`four ${manual?'manual':'auto'} shots at ${rate}/s`);assert(started>0&&finishedEarly,'scan runs and finishes during cooldown');for(let i=1;i<shots.length;i++)assert(Math.abs((shots[i]-shots[i-1])-1/rate)<.025,`shot interval ${shots[i]-shots[i-1]} at ${rate}/s`);
}
}finally{Math.random=old;}console.log('Chairman scans fit inside manual and automatic shot intervals at multiple fire rates');
