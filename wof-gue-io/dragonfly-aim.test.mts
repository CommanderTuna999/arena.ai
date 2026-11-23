import assert from 'node:assert/strict';
import { Game } from './src/game/engine';
import { newSave } from './src/game/data';
import { SPECIES_LIST } from './src/game/enemies';
import { interceptAngle } from './src/game/projectile-aim';

// Constant-velocity intercepts, including an unreachable target and stationary target.
assert.equal(interceptAngle(0, 0, 100, 0, 0, 0, 800), 0);
assert.equal(interceptAngle(0, 0, 100, 0, 900, 0, 800), 0);
const game = new Game(newSave(), 'aim') as any;
const index = SPECIES_LIST.findIndex(s => s.id === 'dragonfly');
for (const tier of [2, 3, 5, 6]) for (const [vx, vy] of [[0,0],[0,300],[-250,150]]) {
  game.eprojs.length = 0;
  Object.assign(game.player, {x: 20600, y: 20000, vx, vy});
  const e = game.makeEnemy(index, tier, 20000, 20000, 'aim', 3);
  e.a = 0;
  const def = e.abil.find((d:any) => d.name === 'Spray');
  e.act = {i: e.abil.indexOf(def), def, t: def.wind, ph: 0, hit: false, dir: 0, fired: false};
  game.runAct(e, 0, 0, 600);
  const shots = game.eprojs;
  assert.equal(shots.length, 4 + tier);
  for (const shot of shots) assert(Math.abs(Math.hypot(shot.vx,shot.vy)-800)<1e-7);
  // Midpoint of the fan points at the predicted intersection from the muzzle.
  const mid = Math.atan2(shots[0].vy + shots.at(-1).vy, shots[0].vx + shots.at(-1).vx);
  const targetAngle = interceptAngle(shots[0].x, shots[0].y, game.player.x, game.player.y, vx, vy, 800);
  assert(Math.abs(Math.atan2(Math.sin(mid-targetAngle), Math.cos(mid-targetAngle)))<1e-8);
  assert(Math.acos((shots[0].vx*shots.at(-1).vx+shots[0].vy*shots.at(-1).vy)/800**2) < .15);
}
console.log('Dragonfly spray speed and moving-target aim verified across tiers');
