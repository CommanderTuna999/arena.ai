import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';import {casingsAt,ejectCasing,ejectCasingLimited} from './src/game/casing-fx';
function fire(id:string){const s=newSave();s.cannon.owned.push(id);s.cannon.id=id;const g:any=new Game(s,'test');g.player.x=5200;g.player.y=0;g.player.a=0;g.input.lmb=true;if(id==='gatler')g.player.gatSpin=1.5;g.t=.05;g.firePlayer(.05);return g;}
for(const [id,kind] of [['peashooter','small'],['gatler','small'],['scattermk1','orb'],['skewer','core'],['workhorse','shell']] as const){const g=fire(id);const q=casingsAt(g,g.t);assert(q.length>0,id);assert(q.every(v=>v.kind===kind),id);}
const s=newSave();s.cannon.owned.push('mediator');s.cannon.id='mediator';const g:any=new Game(s,'test');g.player.x=5200;g.player.y=0;g.input.lmb=true;for(let i=0;i<45;i++){g.t+=.05;g.firePlayer(.05);}g.input.lmb=false;g.t+=.05;g.firePlayer(.05);assert.equal(casingsAt(g,g.t).length,0);for(let i=0;i<60;i++){g.t+=.05;g.firePlayer(.05);}assert.equal(casingsAt(g,g.t).filter(v=>v.kind==='core').length,1,'one core on beam completion');
const obj={};for(let i=0;i<200;i++)ejectCasing(obj,0,0,0,1,'small');assert.equal(casingsAt(obj,1).length,120);assert.equal(casingsAt(obj,3).length,0);
const beam={};for(let i=0;i<10;i++)ejectCasingLimited(beam,'0',0,0,0,i*.1);assert.equal(casingsAt(beam,1).length,1);
console.log('Weapon ejecta match projectile classes, beam fires one core and effects are bounded');
