/* Cannon chassis + per-cannon tracks, and the shield wall. */
import { Game } from "@/game/engine";
import { CANNONS, CANNON_TRACKS, computeStats, migrate, newSave, cannonDmg, cannonRate } from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };
const sting = CANNONS[0];

/* --- the sheet's tier 0 numbers --- */
let s = newSave();
let st = computeStats(s);
assert(st.dmg === 20, `starts at 20 damage (got ${st.dmg})`);
assert(Math.abs(st.rate - 1 / 0.7) < 1e-9, `starts on a 0.7s interval (got ${(1 / st.rate).toFixed(3)}s)`);
assert(st.bulletSpeed === sting.speed && st.bulletRange === sting.range, "bolt speed and reach come from the chassis");

/* --- tracks belong to the cannon --- */
const g = new Game(newSave(), "t") as any;
g.save.credits = 100000;
const bought = g.buyCannon("dmg", 5);
assert(bought === 5, "buys five levels on the damage track");
const after = computeStats(g.save);
assert(Math.abs(after.dmg - cannonDmg(sting, 5)) < 1e-9, `damage follows the track (${after.dmg.toFixed(1)})`);
assert(after.rate === computeStats(newSave()).rate, "the rate track is untouched by damage levels");
assert(CANNON_TRACKS.length === 1 && CANNON_TRACKS[0].id === "dmg", "the Stinger has a damage track and nothing else");
assert(Math.abs(computeStats(g.save).rate - cannonRate(sting)) < 1e-9, "the fire interval stays fixed at 0.7s");

/* --- a new chassis starts clean (nothing to swap to yet, so assert the shape) --- */
assert(g.save.cannon.id === sting.id, "the Stinger is the fitted gun");
assert(g.cannon().name === "Stinger", "engine reports the fitted chassis");

/* --- legacy saves keep their work --- */
const legacy = { ...newSave(), cannon: undefined, upgrades: { dmg: 7, rate: 2, crit: 4 } } as any;
const m = migrate(legacy);
assert(m.cannon.lv.dmg === 7, "v2.9 Cannon Damage levels migrate onto the gun");
assert(!("dmg" in m.upgrades), "the global copy is gone");

/* --- the panel is a wall --- */
const g2 = new Game(newSave(), "t") as any;
g2.resize(1280, 720, 1);
const e = g2.makeEnemy(0, 5, 1200, 0, "test", 11);
g2.player.x = 1200; g2.player.y = 200;
g2.enemies.push(e);
g2.update(1 / 60);                         // populate e.shields
g2.player.dead = false; g2.player.hp = g2.player.maxHp ?? 100;
const info = e.shields[0];
const ux = e.x + Math.cos(info.ang) * info.r, uy = e.y + Math.sin(info.ang) * info.r;
g2.player.hitT = 99;
g2.player.x = ux; g2.player.y = uy;        // dead centre of the wall
const d0 = Math.hypot(g2.player.x - e.x, g2.player.y - e.y);
const hpBefore = g2.player.hp + g2.player.shield;
g2.update(1 / 60);
const hpAfter = g2.player.hp + g2.player.shield;
const d1 = Math.hypot(g2.player.x - e.x, g2.player.y - e.y);
assert(hpAfter < hpBefore, "touching the wall shocks the hull");
console.log(`  radius before ${d0.toFixed(0)}u, after ${d1.toFixed(0)}u (wall at ${info.r.toFixed(0)}u)`);
assert(Math.abs(d1 - info.r) > info.thick, "the ship is pushed off the wall instead of through it");

console.log("\ncannon: all checks passed");
