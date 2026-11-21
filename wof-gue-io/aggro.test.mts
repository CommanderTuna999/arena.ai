/* Focused check of the new rarity-scaled aggro + leash. */
import { Game } from "@/game/engine";
import { newSave } from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };

const g = new Game(newSave(), "tester") as unknown as Record<string, unknown> & {
  player: { x: number; y: number; hp: number; maxHp: number; dead: boolean };
  updateEnemy: (e: unknown, dt: number, dx: number, dy: number, dist: number) => void;
  makeEnemy: (spi: number, tier: number, x: number, y: number, key: string, seed: number) => { aggro: boolean; tier: number; act: unknown; gap: number };
};

/* sit far from the nest so the safe zone never kicks in */
g.player.x = 20000; g.player.y = 20000;

const spawn = (tier: number, dist: number) => {
  const e = g.makeEnemy(0, tier, g.player.x + dist, g.player.y, "test", 12345);
  e.aggro = false;
  return e;
};
const step = (e: ReturnType<typeof spawn>, dist: number) => {
  /* the ship must survive the probe: a dead player counts as "safe" and would
   * switch aggro off for every measurement after it */
  g.player.dead = false; g.player.hp = g.player.maxHp;
  g.updateEnemy(e, 1 / 60, dist, 0, dist);
  return e.aggro;
};

/* notice radius per tier, measured by bisection */
/* aggro happens for distances below the notice range, so grow lo while it hits */
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
assert(ranges.every((r, i) => i === 0 || r > ranges[i - 1]), "every rarity sees further than the one below it");

const common = spawn(0, 300);
assert(step(common, 300), "common aggroes inside its range");
const commonFar = spawn(0, 1200);
assert(!step(commonFar, 1200), "common ignores a player well outside its range");

const mythic = spawn(5, 1100);
assert(step(mythic, 1100), "mythic notices a player at 1100u");

/* leash: start aggroed, walk out, and the chase ends */
const chased = spawn(3, 600);
chased.aggro = true;
step(chased, 600);
assert(chased.aggro, "chase continues inside the range");
step(chased, 5000);
assert(!chased.aggro, "leaving the range ends the chase");
assert(chased.act === null, "a queued swing is dropped when interest is lost");
assert(chased.gap >= 0.5, "a fresh gap is armed after losing the chase");

/* boss keeps a long leash */
const boss = g.makeEnemy(0, 5, g.player.x + 900, g.player.y, "boss", 7);
boss.aggro = true;
step(boss, 900);
assert(boss.aggro, "boss keeps chasing at 900u");
console.log("\naggro: all checks passed");
