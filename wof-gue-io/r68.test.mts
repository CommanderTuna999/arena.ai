import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from './src/game/engine';
import { newSave } from './src/game/data';
const g = new Game(newSave(), 'test') as any;
g.setAdmin('on', true); g.setAdmin('damage', true);
assert.equal(g.dmgMul(), Infinity);
const e = g.makeEnemy(0, 6, 5000, 5000, 'test', 11);
const layer = e.shells.at(-1);
if (layer) { g.shellHit(e, Infinity, 'kinetic'); assert.equal(layer.hp, 0); assert(Number.isFinite(e.dmgTaken)); }
const p = e.parts[e.coreId]; e.buffT = 1; e.buffHp = 100;
g.damagePart(e, p, Infinity, 0, 0); assert.equal(p.hp, 0); assert.equal(p.alive, false); assert(Number.isFinite(e.dmgTaken));
g.setAdmin('damage', false); assert.equal(g.dmgMul(), 1);
const r = readFileSync('src/game/render.ts', 'utf8');
const map = r.slice(r.indexOf('function drawMinimap('), r.indexOf('function drawBaseArrow('));
assert(!map.includes('g.cam.'));
console.log('Infinite damage and map rectangle checks passed');
