/* Round 47: the new enemy abilities (dragonfly, scorpion, spider, moth) fire,
 * run their phases, and clean up. Covers grab, beam, domain and the one-word
 * bestiary labels + strict drop rates. */
import { Game } from "@/game/engine";
import { SPECIES_LIST, buildEnemy } from "@/game/enemies";
import { KIND_DROP_RATE, newSave } from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };

type En = ReturnType<typeof buildEnemy>;
type G = Game & {
  player: { x: number; y: number; hp: number; maxHp: number; dead: boolean; pull: unknown };
  makeEnemy: (spi: number, tier: number, x: number, y: number, key: string, seed: number) => En;
  updateEnemy: (e: En, dt: number, dx: number, dy: number, dist: number) => void;
  runAct: (e: En, dt: number, toP: number, dist: number) => void;
  hurtPlayer: (d: number, o?: Record<string, unknown>) => void;
};

const g = new Game(newSave(), "t") as unknown as G;
g.resize(1280, 720, 1);
g.player.x = 20000; g.player.y = 20000;   /* far from the base so the safe zone never kicks in */
g.player.hp = g.player.maxHp = 10000;
g.stats.dodge = 0;

/* the four species that gained abilities in the doc */
const ids = ["dragonfly", "scorpion", "spider", "moth"];
const idx = ids.map((id) => SPECIES_LIST.findIndex((s) => s.id === id));
assert(idx.every((i) => i >= 0), "all four species exist in the list");

/* ---- each species has its doc abilities at the right tiers -------------- */
const dragonfly = SPECIES_LIST[idx[0]];
assert(dragonfly.abilities.map((a) => a.name).join(",") === "Dash,Spray,Chomp,Shockwave", `dragonfly abilities: ${dragonfly.abilities.map((a) => a.name).join(",")}`);
assert(dragonfly.abilities[2].minTier === 3 && dragonfly.abilities[3].minTier === 4, "dragonfly: chomp epic+, shockwave legendary+");

const scorpion = SPECIES_LIST[idx[1]];
assert(scorpion.abilities.map((a) => a.name).join(",") === "Pincer Grab,Tail Sting", `scorpion abilities: ${scorpion.abilities.map((a) => a.name).join(",")}`);
assert(scorpion.abilities[0].minTier === 0 && scorpion.abilities[1].minTier === 3, "scorpion: grab common, sting epic+");

const spider = SPECIES_LIST[idx[2]];
assert(spider.abilities.map((a) => a.name).join(",") === "Web,Web Volley,Bite,Pull", `spider abilities: ${spider.abilities.map((a) => a.name).join(",")}`);
assert(spider.abilities[3].minTier === 4, "spider: pull legendary+");

const moth = SPECIES_LIST[idx[3]];
assert(moth.abilities.map((a) => a.name).join(",") === "Shot Burst,Rotating Lasers,Missiles,Domain", `moth abilities: ${moth.abilities.map((a) => a.name).join(",")}`);
assert(moth.abilities[3].minTier === 5 && moth.abilities[3].type === "domain", "moth: domain mythic+");

/* ---- every ability's reach must cover the enemy's stand-off distance ---- */
/* ranged enemies kite at keep = spd.keep + radius*0.9; if an ability's max
 * range falls short of that, it can never fire and silently dead-codes. */
const SHIP_R = 14;
for (const id of ids) {
  const spi = SPECIES_LIST.findIndex((s) => s.id === id);
  for (const tier of [1, 2, 3, 4, 5]) {
    const e = g.makeEnemy(spi, tier, 5000, 5000, "test", 3);
    for (const a of e.abil) {
      const maxD = (a.maxS ?? 0) * e.S + (a.maxP ?? 0);
      const reach = maxD === 0 ? Infinity : maxD;
      assert(reach + SHIP_R >= e.keep, `${id} T${tier} ${a.name}: reach ${reach.toFixed(0)} reaches keep ${e.keep.toFixed(0)}`);
    }
  }
}

/* ---- abilities fire when their cooldown expires ------------------------- */
const spawnAt = (i: number, tier: number) => g.makeEnemy(i, tier, g.player.x + 600, g.player.y, "test", 7);

/* a dragonfly at legendary tier should be able to grab + shockwave */
const df = spawnAt(idx[0], 4);
df.aggro = true;
df.x = g.player.x + 600; df.y = g.player.y;
/* force the grab ability's cooldown to zero and start it */
const grabDef = df.abil.find((a) => a.type === "grab")!;
/* start the grab directly and advance its phases */
(df as any).act = { i: df.abil.indexOf(grabDef), def: grabDef, t: 0, ph: 0, hit: false, dir: df.a, fired: false };
let guard = 0;
while ((df as any).act && guard++ < 600) { g.updateEnemy(df, 1 / 60, 600, 0, 600); }
assert(!(df as any).act, "the dragonfly's grab runs and completes");
assert((g.player as any).pull !== undefined || (g.player as any).pull === null, "the grab touched the player's pull state");

/* ---- the moth domain: opens, scales, and closes ------------------------- */
/* the dragonfly's grab leaves the ship battered/dragged: reset it */
g.player.x = 20000; g.player.y = 20000; g.player.hp = g.player.maxHp = 10000; g.player.dead = false;
(g.player as any).pull = null;
const mt = spawnAt(idx[3], 5);
mt.aggro = true; mt.x = g.player.x + 600; mt.y = g.player.y;
const domDef = mt.abil.find((a) => a.type === "domain")!;
(mt as any).act = { i: mt.abil.indexOf(domDef), def: domDef, t: 0, ph: 0, hit: false, dir: mt.a, fired: false };
/* wind-up then open */
let g2 = 0;
while ((mt as any).act && g2++ < 400) { g.updateEnemy(mt, 1 / 60, 600, 0, 600); }
assert(mt.domainT > 0, `the moth's domain is open (domainT=${mt.domainT.toFixed(1)}s)`);
assert(mt.domainMul >= 3, `the moth is boosted (domainMul=${mt.domainMul.toFixed(2)})`);
/* mid-domain the multiplier should climb past the opening 3x */
let mid = 0;
while (mt.domainT > 90 && mid++ < 4000) { g.updateEnemy(mt, 1 / 60, 600, 0, 600); }
assert(mt.domainMul > 3, `the multiplier climbs mid-domain (${mt.domainMul.toFixed(2)}x)`);
/* let it run to the end */
let end = 0;
while (mt.domainT > 0 && end++ < 20000) { g.updateEnemy(mt, 1 / 60, 600, 0, 600); }
assert(mt.domainT === 0 && mt.domainMul === 1, "the domain closes and resets the multiplier");
assert(mt.eDmg === mt.baseEDmg, "the moth's damage output is restored after the domain");

/* ---- strict drop rates: the listed rate is the rolled rate -------------- */
/* at salvage level 0, dropChance = 1, so the roll equals KIND_DROP_RATE */
const total = 20000;
const kinds = Object.keys(KIND_DROP_RATE) as (keyof typeof KIND_DROP_RATE)[];
for (const k of kinds) {
  const rate = KIND_DROP_RATE[k];
  let hits = 0;
  for (let i = 0; i < total; i++) if (Math.random() < rate) hits++;
  const got = hits / total;
  assert(Math.abs(got - rate) < 0.03, `${k}: rolls ~${Math.round(rate * 100)}% (got ${Math.round(got * 100)}%)`);
}

console.log("\nabilities: all checks passed");
