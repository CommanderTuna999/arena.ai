import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {CANNONS,CANNON_BY_ID,cannonBillProblem,newSave} from './src/game/data';
const s=newSave();s.credits=0;const g=new Game(s,'admin');const initial=JSON.stringify(s.cannon);
assert.equal(g.selectCannon('gatler'),false,'locked without admin');g.setAdmin('on',true);
for(const c of CANNONS){g.selectCannon(c.id);assert.equal(g.stats.cannonId,c.id,`${c.name} is usable with admin enabled`);}
assert.equal(JSON.stringify(s.cannon),initial,'admin test fitting does not grant saved ownership');
g.selectCannon('gatler');assert.equal(g.buyCannon('dmg',1),0,'without infinite credits, upgrades still cost credits');
g.setAdmin('credits',true);assert.equal(g.buyCannon('dmg',2),2);assert.equal(g.cannonLevels('gatler').dmg,2);assert.equal(s.credits,0);assert.equal(JSON.stringify(s.cannon),initial,'test upgrades do not leak to save');
g.setAdmin('on',false);assert.equal(g.stats.cannonId,'sting');assert.equal(JSON.stringify(s.cannon),initial);assert.equal(g.selectCannon('gatler'),false);
const h=new Game(newSave(),'buyer');h.save.credits=0;h.save.cannon.owned.push('peashooter');h.setAdmin('on',true);h.setAdmin('credits',true);h.setAdmin('components',true);
assert.equal(cannonBillProblem(h.save,CANNON_BY_ID.scattermk1,true,true,true),null);assert.equal(h.buyCannonChassis('scattermk1'),null);assert.equal(h.save.credits,0);assert(h.save.cannon.owned.includes('scattermk1'),'explicit chassis purchase persists');
const k=new Game(newSave(),'credits');k.save.credits=0;k.save.cannon.owned.push('peashooter');k.setAdmin('on',true);k.setAdmin('credits',true);assert.match(k.buyCannonChassis('scattermk1')!,/Needs .*carapace plate/,'infinite credits do not give infinite components');
console.log('Admin test fitting is temporary; infinite credits bypasses chassis and upgrade prices');
