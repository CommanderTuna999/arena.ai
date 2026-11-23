import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave,computeStats,CANNON_BY_ID,cannonSpread} from './src/game/data';
const make=()=>{const s=newSave();s.cannon.owned.push('gatler');s.cannon.id='gatler';const g=new Game(s,'p') as any;g.player.x=-50000;g.player.y=-65000;g.input.lmb=true;return g;};
for(const dt of [1/30,1/60,1/144]) {
 const g=make();let t=0;while(t+dt<1.5-1e-9){g.firePlayer(dt);t+=dt;assert.equal(g.bullets.length,0,'no bullets during spin-up');}
 assert(g.player.gatAngle>0,'barrels visibly rotate during rev');
 while(t<2.5-1e-9){g.firePlayer(dt);t+=dt;}
 assert(Math.abs(g.bullets.length-101)<=3,`firing speed after spin-up at ${dt}: ${g.bullets.length}`);
}
const g=make();for(let i=0;i<50;i++)g.firePlayer(.02);assert.equal(g.bullets.length,0);g.input.lmb=false;for(let i=0;i<50;i++)g.firePlayer(.02);assert.equal(g.player.gatSpin,0,'release spins down fully');g.input.lmb=true;g.firePlayer(.02);assert.equal(g.bullets.length,0,'release cannot bank a partial rev indefinitely');
g.player.gatSpin=1.5;g.save.cannon.id='peashooter2';g.stats=computeStats(g.save);g.firePlayer(.02);assert.equal(g.player.gatSpin,0,'switching away resets spin');
g.save.cannon.id='gatler';g.stats=computeStats(g.save);g.bullets=[];g.firePlayer(.02);assert.equal(g.bullets.length,0,'switching back requires a fresh rev');
g.player.gatSpin=1.5;g.killPlayer();assert.equal(g.player.gatSpin,0,'death resets spin');
const s=CANNON_BY_ID.scattermk1;assert(cannonSpread(s,{spread:1})<cannonSpread(s));assert(cannonSpread(s,{spread:10})<cannonSpread(s,{spread:1}));assert(cannonSpread(s,{spread:10})>0);
console.log('Gatler spin-up, release, swap, death and tighter scatter upgrades verified');
// Scatter upgrades narrow the actual simultaneously fired pellet cone, not
// just the displayed stat.
function cone(level:number) {const s=newSave();s.cannon.owned.push('scattermk1');s.cannon.id='scattermk1';s.cannon.lv.scattermk1={spread:level};const w=new Game(s,'s') as any;w.player.x=-50000;w.player.y=-65000;w.player.a=0;w.input.lmb=true;w.firePlayer(.01);return w.bullets.map((b:any)=>Math.atan2(b.vy,b.vx));}
const wide=cone(0),tight=cone(10);assert.equal(wide.length,8);assert.equal(tight.length,8);assert(tight.at(-1)-tight[0]<wide.at(-1)-wide[0]);
