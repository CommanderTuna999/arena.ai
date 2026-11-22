import assert from 'node:assert/strict';
import { Game } from './src/game/engine';
import { BASE, computeStats, newSave } from './src/game/data';
for (const level of [0, 5, 10]) {
 const g = new Game(newSave(), 'test') as any;
 g.save.cannon.id='mediator'; g.save.cannon.lv.mediator={chargeRate:level}; g.stats=computeStats(g.save);
 g.player.x=BASE.x-3000; g.player.y=BASE.y;
 g.input.lmb=true; for(let i=0;i<20;i++)g.firePlayer(.05);
 g.input.lmb=false; g.firePlayer(.05);
 assert.equal(g.mediatorBeamTime,0,`level ${level}: short charge must not fire`);
 assert.equal(g.player.charge,0);
 g.input.lmb=true; for(let i=0;i<40;i++)g.firePlayer(.05);
 g.input.lmb=false; g.firePlayer(.05);
 assert.equal(g.mediatorBeamTime,3,`level ${level}: two seconds fires`);
 g.input.lmb=true; for(let i=0;i<60;i++)g.firePlayer(.05);
 assert.equal(g.mediatorBeamTime,0); assert(g.player.fireCd > .69);
 for(let i=0;i<13;i++)g.firePlayer(.05);
 assert.equal(g.player.charging,false,`level ${level}: can't charge while reloading`);
 for(let i=0;i<2;i++)g.firePlayer(.05);
 assert.equal(g.player.charging,true,`level ${level}: charge resumes after reload`);
}
console.log('Mediator minimum charge and post-beam reload passed');
