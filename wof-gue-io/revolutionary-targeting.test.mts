import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from './src/game/engine';
import {newSave} from './src/game/data';
function setup(){const s=newSave();s.cannon.owned.push('revolutionary');s.cannon.id='revolutionary';const g:any=new Game(s,'aim');g.player.x=5200;g.player.y=0;g.player.a=0;g.cam={x:5200,y:0,z:1};g.input.mx=600;g.input.my=300;g.input.lmb=true;return g;}
const g=setup(),e:any=g.makeEnemy(0,2,5400,0,'test',7);g.enemies=[e];g.partAt=()=>e.parts[0];let shot:any[]=[];g.beam=(...a:any[])=>shot=a;
g.firePlayer(.01);assert(g.revolutionaryScan);assert.equal(shot.length,0,'a targeted shot waits for scan');
g.input.lmb=false;e.x+=30;e.y+=80;const duration=g.revolutionaryScan.duration;g.firePlayer(duration-.1);assert(g.revolutionaryScan && g.revolutionaryScan.elapsed >= duration-.2);assert.equal(shot.length,0,'flash completes before the shot');g.firePlayer(.11);assert.equal(g.revolutionaryScan,null);assert(shot.length>0,'committed trigger fires even if released');
const [cx,cy]=g.partWorld(e,e.parts[e.coreId]);assert(Math.abs(shot[2]-Math.atan2(cy-shot[1],cx-shot[0]))<1e-10,'actual muzzle aims at moving core');
const free=setup();let freeShot:any[]=[];free.beam=(...args:any[])=>freeShot=args;free.firePlayer(.01);assert(freeShot.length>0,'empty mouse skips targeting');assert.equal(freeShot[2],0);
const cancelled=setup();const target=cancelled.makeEnemy(0,2,5400,0,'test',7);cancelled.enemies=[target];cancelled.partAt=()=>target.parts[0];cancelled.beam=()=>{throw Error('cancelled shot fired')};cancelled.firePlayer(.01);cancelled.player.dead=true;cancelled.firePlayer(.01);assert.equal(cancelled.revolutionaryScan,null);
const r=readFileSync(new URL('./src/game/render.ts',import.meta.url),'utf8');assert.match(r,/const scan = g\.revolutionaryScan/);assert.match(r,/scan\.elapsed >= scan\.duration - 0\.2/);assert.match(r,/1 - clamp\(spring, 0, 1\)/);
console.log('Target scan, flash, committed shot, moving-core aim, empty mouse and cancellation verified');
