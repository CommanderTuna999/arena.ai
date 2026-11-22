import assert from 'node:assert/strict';
import { Game, plateGrow, SHELL_BASE_GROW, SHELL_GROW_PER_LAYER, SHELL_GROW_FRAC, SHELL_GROW_CAP } from './src/game/engine';
import { newSave } from './src/game/data';
import { MAP_GRID, MAP_CELL, MAP_RADIUS, circleWalkable } from './src/game/world';
import { readFileSync } from 'node:fs';
let edge: [number, number] | undefined;
for (let y=1; y<MAP_GRID.length-1 && !edge; y++) for (let x=1; x<MAP_GRID.length-1; x++) {
 if (MAP_GRID[y][x]==='1' && MAP_GRID[y][x+1]==='0') { edge=[(x+1)*MAP_CELL-MAP_RADIUS,(y+.5)*MAP_CELL-MAP_RADIUS]; break; }
}
assert(edge); const [wallX,wallY]=edge;
assert(circleWalkable(wallX-50,wallY,20));
assert(!circleWalkable(wallX-10,wallY,20));
assert.equal(plateGrow(100,3), Math.min(100*SHELL_GROW_CAP,SHELL_BASE_GROW+2*SHELL_GROW_PER_LAYER+100*SHELL_GROW_FRAC)/3);
const g=new Game(newSave(),'test') as any; g.admin.sandbox=true;
const u=g.makeEnemy(0,6,0,0,'test',11), victim=g.makeEnemy(0,5,0,0,'test',11), same=g.makeEnemy(0,6,0,0,'test',11);
u.vx=u.vy=victim.vx=victim.vy=same.vx=same.vy=0;
g.enemies=[u,victim,same]; g.player.x=20000; g.player.y=20000;
const before=g.save.kills; g.updateEnemies(0);
assert(victim.dead); assert(!g.enemies.includes(victim)); assert(!same.dead);
assert.equal(g.comps.length,0); assert.equal(g.creditDrops.length,0); assert.equal(g.save.kills,before); assert.equal(g.save.bestiary[victim.spd.id],undefined);
const render=readFileSync('src/game/render.ts','utf8');
assert(render.includes('const drawOrder = e.order;')); assert(!render.includes('c.c.mass.toFixed(1)} mass'));
assert(render.includes('compSprites = new WeakMap'));
console.log('Performance, Ultra contact, armour, and wall checks passed');
