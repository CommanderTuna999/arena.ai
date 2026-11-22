import assert from 'node:assert/strict';
import { BASE, cannonChargeRate, CANNON_BY_ID, computeStats, newSave } from './src/game/data';
import { Game } from './src/game/engine';
assert.equal(CANNON_BY_ID.mediator.chargeTime, 70);
assert.equal(70/cannonChargeRate({chargeRate:0}), 70);
assert.equal(70/cannonChargeRate({chargeRate:10}), 10);
for (const level of [0, 5, 10]) {
 const g = new Game(newSave(), 't') as any;
 g.save.cannon.id = 'mediator';g.save.cannon.lv.mediator={chargeRate:level};g.stats=computeStats(g.save);
 g.player.x=BASE.x-3000;g.player.y=BASE.y;g.input.lmb=true;
 const time=70-6*level;
 for(let i=0;i<Math.round(time/0.05/2);i++)g.firePlayer(.05);
 assert(Math.abs(g.player.charge-0.5)<.001, `level ${level} half charge`);
 for(let i=0;i<Math.round(time/0.05/2)+1;i++)g.firePlayer(.05);
 assert.equal(g.player.charge,1,`level ${level} max charge at ${time}s`);
 g.input.lmb=false;g.firePlayer(.05);assert(g.mediatorBeamDamage >= 3999, 'full charge deals full damage');
}
console.log('Mediator charge timings and scaling passed');
