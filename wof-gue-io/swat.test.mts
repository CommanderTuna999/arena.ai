/* The hull swat: sitting on an insect's back is punished, but only while there
 * is a back to sit on. A body stripped down to its legs has no plating left, so
 * the ship must be able to fly through the space the abdomen used to fill. */
import { Game } from "@/game/engine";
import { newSave } from "@/game/data";
import { SPECIES_LIST } from "@/game/enemies";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };
const TAU = Math.PI * 2;

const g = new Game(newSave(), "t") as any;
g.resize(1280, 720, 1);
const spi = SPECIES_LIST.findIndex((sp) => !sp.boss);
const e = g.makeEnemy(spi, 2, 4000, 0, "test", 21);
g.enemies.push(e);
g.update(1 / 60);
g.enemies = [e];
const p = g.player;
p.dead = false;
p.hp = g.stats.hull;

/* a point in enemy-local space -> world space (mirrors touching()) */
const toWorld = (lx: number, ly: number) => ({
  x: e.x + lx * Math.cos(e.a) - ly * Math.sin(e.a),
  y: e.y + lx * Math.sin(e.a) + ly * Math.cos(e.a),
});
/** the world point where a part's own centre sits */
const partWorld = (q: any) => {
  let x = q.cx, y = q.cy;
  if (q.seg >= 0 && e.bend) y += g.bendOff(e, q);
  if (q.g >= 0) {
    /* touching() maps local -> polygon with R(-ang) about the group pivot */
    const gr = e.groups[q.g];
    const cc = Math.cos(gr.ang), ss = Math.sin(gr.ang);
    const dx = x - gr.px, dy = y - gr.py;
    x = gr.px + dx * cc - dy * ss;
    y = gr.py + dx * ss + dy * cc;
  }
  return toWorld(x, y);
};
/** how far the ship can be from a body and still be swatted, plus a margin */
const swatR = () => Math.min(Math.max(e.radius * 0.5, 45), 260) + 34;
/** a world point near this part where the hull is solid under the ship */
const standOn = (q: any) => {
  const c = partWorld(q);
  for (let r = 0; r <= q.r + 6; r += 2) {
    for (let a = 0; a < TAU; a += 0.2) {
      p.x = c.x + Math.cos(a) * r; p.y = c.y + Math.sin(a) * r;
      if (g.touching(e, 8)) return { x: p.x, y: p.y };
    }
  }
  return null;
};
/** the closest world point to the body that has nothing left to stand on,
 *  inside the radius the old swat used to cover */
const nearestEmpty = () => {
  for (let r = 0; r < swatR() - 8; r += 3) {
    for (let a = 0; a < TAU; a += 0.12) {
      p.x = e.x + Math.cos(a) * r; p.y = e.y + Math.sin(a) * r;
      if (!g.touching(e, 8)) return { x: p.x, y: p.y };
    }
  }
  return null;
};

/* the biggest solid piece is the one the ship would be sitting on */
const solid = e.parts.filter((q: any) => q.alive && q.kind !== "wing" && q.kind !== "leg");
assert(solid.length > 2, `the test body has solid pieces (${solid.length})`);
/* the outermost piece: the one with air behind it, so its removal leaves a hole */
const victim = [...solid].sort((a: any, b: any) => Math.hypot(b.cx, b.cy) - Math.hypot(a.cx, a.cy))[0];

/* --- 1. an intact piece swats --- */
const spot = standOn(victim);
assert(!!spot, "found a standing spot on the hull");
p.x = spot!.x; p.y = spot!.y; p.vx = 0; p.vy = 0;
e.swatCd = 0; e.stun = 0;
const hp0 = p.hp + p.shield;
g.update(1 / 60);
const shoved = Math.hypot(p.vx, p.vy);
assert(p.hp + p.shield < hp0, "standing on a real piece hurts");
assert(shoved > 120, `and throws the ship off it (${shoved.toFixed(0)} u/s)`);

/* --- 2. the same radius, where there is no plating: free air --- */
const gap = nearestEmpty();
assert(!!gap, "found a hole in the body's footprint");
const d = Math.hypot(gap!.x - e.x, gap!.y - e.y);
assert(d < swatR(), `and it is inside the old swat radius (${d.toFixed(0)}u < ${swatR().toFixed(0)}u)`);
p.x = gap!.x; p.y = gap!.y; p.vx = 0; p.vy = 0;
p.hp = g.stats.hull; p.shield = g.stats.shieldMax;
e.swatCd = 0; e.stun = 0;
const hp1 = p.hp + p.shield;
g.update(1 / 60);
assert(p.hp + p.shield >= hp1, "flying through a hole in the hull costs nothing");
const v1 = Math.hypot(p.vx, p.vy);
assert(v1 < 120, `and nothing shoves the ship away (${v1.toFixed(0)} u/s)`);

/* --- 3. blow the pieces off: the ground they stood on is gone with them --- */
victim.alive = false;
for (const q of e.parts) if (q.kind !== "leg" && q.kind !== "wing") q.alive = false;
e.dead = false;
const middle = toWorld(0, 0);
p.x = middle.x; p.y = middle.y; p.vx = 0; p.vy = 0;
p.hp = g.stats.hull; p.shield = g.stats.shieldMax;
e.swatCd = 0; e.stun = 0; e.aggro = false;
const hp2 = p.hp + p.shield;
g.update(1 / 60);
assert(p.hp + p.shield >= hp2, "a carcass of legs cannot swat the ship");
const v2 = Math.hypot(p.vx, p.vy);
assert(v2 < 120, `and it does not throw it either (${v2.toFixed(0)} u/s)`);

/* --- 4. one piece still standing still bites --- */
const survivor = solid.find((q: any) => q !== victim);
assert(!!survivor, "another solid piece is still standing");
survivor.alive = true;
const spot2 = standOn(survivor);
assert(!!spot2, "found a standing spot on the survivor");
p.x = spot2!.x; p.y = spot2!.y; p.vx = 0; p.vy = 0;
p.hp = g.stats.hull; p.shield = g.stats.shieldMax;
e.swatCd = 0; e.stun = 0;
const hp3 = p.hp + p.shield;
g.update(1 / 60);
assert(p.hp + p.shield < hp3, "the piece that is still there still swats");

console.log("\nswat: all checks passed");
