import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from './src/game/engine';
import {BASE,newSave} from './src/game/data';
function setup(id:string){const s=newSave();s.cannon.id=id;s.cannon.owned.push(id);const g:any=new Game(s,'base-test');g.player.x=BASE.x;g.player.y=BASE.y;g.cam={x:BASE.x,y:BASE.y,z:1};g.input.lmb=true;assert(g.inSafe());return g;}
const rand=Math.random;try{Math.random=()=>.5;
 const normal=setup('workhorse');normal.firePlayer(.02);assert(normal.bullets.length>0,'normal cannon fires at base');const hp=normal.player.hp;normal.hurtPlayer(1e6,{});assert.equal(normal.player.hp,hp,'base protection remains');
 const gat=setup('gatler');for(let i=0;i<80;i++)gat.firePlayer(.02);assert(gat.bullets.length>0,'Gatler spins up and fires');
 const f=setup('fencer');let fshots=0;f.beam=()=>fshots++;for(let i=0;i<180;i++)f.firePlayer(.02);assert(fshots>5,'Fencer charges and fires inside base');
 const m=setup('mediator');for(let i=0;i<42;i++)m.firePlayer(.05);m.input.lmb=false;m.firePlayer(.05);assert.equal(m.mediatorBeamTime,3,'Mediator charges inside base');let beam=0;m.beam=()=>beam++;m.firePlayer(.1);assert(beam>0,'Mediator beam continues inside base');
 const r=setup('revolutionary');r.input.mx=600;r.input.my=300;const enemy=r.makeEnemy(0,2,BASE.x+200,BASE.y,'test',7);r.enemies=[enemy];r.partAt=()=>enemy.parts[0];let rev=0;r.beam=()=>rev++;r.firePlayer(.01);assert(r.revolutionaryScan);r.input.lmb=false;r.firePlayer(r.revolutionaryScan.duration+.01);assert(rev>0,'Revolutionary scans and fires in base');
 const c=setup('chairman');let cs=0;c.beam=()=>cs++;c.firePlayer(.01);assert(cs>0,'Chairman drones fire in base');c.chairman.drones.fill(Infinity);c.mouseUp(0);c.mouseDown(0);c.firePlayer(3);assert(c.chairman.charge>0,'Chairman sun is usable in base');c.firePlayer(1);assert(c.chairman.sunLocked);
 const w=setup('workhorse');w.autoFire=true;w.stats.weapons=[{rid:'pulse',eff:1}];const e=w.makeEnemy(0,2,BASE.x+180,BASE.y,'test',8);w.enemies=[e];w.combatTarget=()=>e;w.aimPoint=()=>[e.x,e.y];w.fireWeapons(.1,0);assert(w.bullets.length>0,'automatic crafted weapon fires in base');w.stats.weapons=[{rid:'drones',eff:1}];w.bullets=[];w.updateDrones(1);assert(w.bullets.length>0,'crafted drones fire in base');
 const render=readFileSync('src/game/render.ts','utf8');const draw=render.slice(render.indexOf('function drawChairman('),render.indexOf('/** Screen-space Ultra'));assert(!draw.includes('fillRect(p.x-35,p.y+62'),'Chairman under-player meter removed');
}finally{Math.random=rand;}
console.log('Base allows cannon and weapon fire while preserving safe-zone protection');
