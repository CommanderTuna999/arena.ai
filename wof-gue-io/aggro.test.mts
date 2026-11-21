/* Focused check of rarity aggro, neutral low tiers and the shield formation. */
import { Game } from "@/game/engine";
import { newSave } from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };

type Probed = {
  aggro: boolean; act: unknown; gap: number; tier: number; radius: number; a: number;
  shieldReach: number; shields: { ang: number; span: number; bar: boolean }[]; provoked: number;
};
const g = new Game(newSave(), "tester") as unknown as {
  player: { x: number; y: number; hp: number; maxHp: number; dead: boolean };
  updateEnemy: (e: Probed, dt: number, dx: number, dy: number, dist: number) => void;
  trackDamage: (e: Probed, d: number, fromBase: boolean) => void;
  shieldAt: (e: Probed, x: number, y: number) => unknown;
  makeEnemy: (spi: number, tier: number, x: number, y: number, key: string, seed: number) => Probed;
};

/* sit far from the nest so the safe zone never kicks in */
g.player.x = 20000; g.player.y = 20000;

const spawn = (tier: number, dist: number) => {
  const e = g.makeEnemy(0, tier, g.player.x + dist, g.player.y, "test", 12345);
  e.aggro = false;
  return e;
};
const step = (e: Probed, dist: number) => {
  /* the ship must survive the probe: a dead player counts as "safe" and would
   * switch aggro off for every measurement after it */
  g.player.dead = false; g.player.hp = g.player.maxHp;
  g.updateEnemy(e, 1 / 60, dist, 0, dist);
  return e.aggro;
};

/* notice radius per tier, measured by bisection */
const noticeAt = (tier: number) => {
  let lo = 0, hi = 6000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (step(spawn(tier, mid), mid)) lo = mid; else hi = mid;
  }
  return Math.round(lo);
};

const ranges = [0, 1, 2, 3, 4, 5].map((t) => {
  const r = noticeAt(t);
  console.log(`  tier ${t}: notices at ${r}u`);
  return r;
});
assert(ranges[2] > 0 && ranges[3] > ranges[2] && ranges[4] > ranges[3] && ranges[5] > ranges[4],
  "rarer bodies see further, and every range is tight");
assert(ranges[5] < 1000, "even a mythical notices you well under a screen and a half");
assert(ranges[2] < 400, "a rare has to be close before it starts something");

/* commons and uncommons never open a fight */
assert(!step(spawn(0, 120), 120), "a common nearby stays neutral (outside its swat reach)");
assert(!step(spawn(1, 165), 165), "an uncommon nearby stays neutral");
assert(step(spawn(2, 120), 120), "a rare does not wait to be shot at");

/* ... but they fight back when hit */
const bitten = spawn(0, 120);
g.trackDamage(bitten, 12, false);
assert(bitten.provoked > 0, "hitting a neutral body provokes it");
assert(step(bitten, 120), "a provoked common turns on you");

/* leash: start aggroed, walk out, and the chase ends */
const chased = spawn(3, 300);
chased.aggro = true;
step(chased, 300);
assert(chased.aggro, "chase continues inside the range");
step(chased, 5000);
assert(!chased.aggro, "leaving the range ends the chase");
assert(chased.act === null, "a queued swing is dropped when interest is lost");
assert(chased.gap >= 0.5, "a fresh gap is armed after losing the chase");

/* shield formation: the front is walled, the tail is open */
const walled = g.makeEnemy(0, 5, g.player.x + 4000, g.player.y, "test", 99);
assert(walled.tier === 5 && walled.shields.length === 0, "panels are projected on the first update");
step(walled, 4000);
const nSh = walled.shields.length;
console.log(`  tier 5 carries ${nSh} panels, reach ${Math.round(walled.shieldReach)}u`);
assert(nSh >= 5, "a mythical body carries a full front formation");

/* sweep a ray outward at this body-local angle: is there energy in the way? */
const at = (rel: number) => {
  const ang = walled.a + rel;
  for (let r = walled.shieldReach * 0.45; r <= walled.shieldReach * 1.15; r += 6) {
    if (g.shieldAt(walled, walled.x + Math.cos(ang) * r, walled.y + Math.sin(ang) * r)) return true;
  }
  return false;
};
/* rel 0 = straight ahead of the body; sample a fan in front and a fan behind */
const deg = (d: number) => at((d * Math.PI) / 180);
const frontSealed = [-80, -60, -40, -20, 0, 20, 40, 60, 80].every((d) => deg(d));
const backOpen = [150, 165, 180, -165, -150].every((d) => !deg(d));
assert(frontSealed, "the leading 160 degrees is sealed by energy");
assert(backOpen, "the tail is left open");

console.log("\naggro: all checks passed");
