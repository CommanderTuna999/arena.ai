import assert from 'node:assert/strict';
import { Game } from './src/game/engine';
import { BASE, computeStats, newSave } from './src/game/data';
function make() {
 const g = new Game(newSave(),'test') as any;
 g.save.cannon.id='mediator';g.stats=computeStats(g.save);g.admin.sandbox=true;
 g.player.x=BASE.x-3000;g.player.y=BASE.y;g.player.a=0;g.cam.x=g.player.x;g.cam.y=g.player.y;
 g.input.lmb=true;g.firePlayer(.05);g.input.lmb=false;g.firePlayer(.05);
 g.particles=[];return g;
}
for (const dt of [.05,.01]) {
 const g=make(); for(let i=0;i<Math.round(1/dt);i++)g.firePlayer(dt);
 assert(g.particles.length>=23 && g.particles.length<=24,`stable spark rate at ${dt}: ${g.particles.length}`);
 assert(g.particles.every((p:any)=>p.color==='#e9d5ff'||p.color==='#a978ff'), 'beam sparks have the intended palette');
 assert(g.particles.every((p:any)=>p.life<.6 && p.shape===1), 'short-lived energy shards');
 g.player.x=BASE.x; g.player.y=BASE.y; const n=g.particles.length;g.firePlayer(.05);
 assert.equal(g.particles.length,n,'sparks stop in safe zone');
}
console.log('Mediator firing particles passed');
