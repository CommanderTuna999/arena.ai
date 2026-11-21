/* Cannon chassis tree, per-cannon tracks, chassis bills and the shield wall. */
import { Game } from "@/game/engine";
import {
  CANNONS, CANNON_BY_ID, CANNON_TRACK_BY_ID, cannonBarrels, cannonCrit, cannonCritMul, cannonDmg,
  cannonOwned, cannonRate, cannonSpread, cannonTracks, cannonTrackCost, computeStats, migrate, newSave,
  type Comp,
} from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };
const sting = CANNON_BY_ID["sting"];
const skewer = CANNON_BY_ID["skewer"];
const pea = CANNON_BY_ID["peashooter"];
const horse = CANNON_BY_ID["workhorse"];

const comp = (kind: Comp["kind"], tier: number, id: string, name?: string): Comp =>
  ({ id, species: "Worker Ant", name: name ?? `test ${kind}`, kind, tier, poly: [0, 0, 10, 0, 10, 10], area: 100, mass: 1, hue: 0, value: 5 });

/* --- the tree starts at the bottom with the Stinger --- */
let s = newSave();
let st = computeStats(s);
assert(st.dmg === 20, `starts at 20 damage (got ${st.dmg})`);
assert(Math.abs(st.rate - 1 / 0.7) < 1e-9, `starts on a 0.7s interval (got ${(1 / st.rate).toFixed(3)}s)`);
assert(st.bulletSpeed === sting.speed && st.bulletRange === sting.range, "round speed and reach come from the chassis");
const lowest = Math.min(...CANNONS.map((c) => c.tier));
assert(sting.tier === lowest, `the Stinger is the bottom row of the tree (tier ${sting.tier})`);
const tier1 = CANNONS.filter((c) => c.tier === 1);
assert(tier1.length === 3, `three tier 1 chassis (${tier1.map((c) => c.name).join(", ")})`);
assert(tier1.every((c) => c.requires === "sting"), "every tier 1 chassis requires the Stinger");
assert(tier1.every((c) => c.name !== "" && c.desc.length > 20), "every tier 1 chassis has a name and a description");

/* --- bills: 3-4 common legs/cores/heads/antennae plus an uncommon core --- */
const ALLOWED = new Set(["leg", "core", "segment", "spike"]);
for (const c of tier1) {
  const commons = c.parts.filter((b) => b.tier === 0);
  const uncommon = c.parts.filter((b) => b.tier === 1);
  const commonCount = commons.reduce((n, b) => n + b.count, 0);
  assert(commonCount >= 3 && commonCount <= 4, `${c.name}: ${commonCount} common parts in the bill`);
  assert(commons.every((b) => ALLOWED.has(b.kind)), `${c.name}: every common is a leg, core, head or antenna (${commons.map((b) => b.label).join(", ")})`);
  assert(commons.some((b) => b.kind === "leg"), `${c.name}: legs are the bulk of the bill`);
  assert(uncommon.length === 1 && uncommon[0].kind === "core" && uncommon[0].count === 1, `${c.name}: one uncommon core, no species named`);
  assert(c.credits === 300, `${c.name}: 300 credits on top of the parts`);
}
assert(tier1.every((c) => c.parts.every((b) => !("species" in b))), "no bill line names a species");

/* --- the frames' upgrades, per chassis --- */
assert(cannonTracks(sting).map((t) => t.id).join() === "dmg", "the Stinger has a damage track and nothing else");
assert(cannonTracks(skewer).map((t) => t.id).join() === "dmg,crit,critDmg,pen", "the Skewer carries damage, crit chance, crit damage and penetration");
assert(cannonTracks(pea).map((t) => t.id).join() === "dmg,acc,speed", "the Peashooter carries damage, accuracy and projectile speed");
assert(cannonTracks(horse).map((t) => t.id).join() === "dmg,rate,pen,barrels", "the Workhorse carries damage, fire rate, penetration and barrels");
assert(skewer.hitscan === true && skewer.dmg === 200 && skewer.interval === 1.5, "the Skewer is a 200-damage hitscan with a 1.5s interval");
assert(pea.dmg === 15 && Math.abs(pea.interval - 0.1) < 1e-9 && (pea.spread ?? 0) > 0.1, "the Peashooter is a 15-damage spray gun");
assert(horse.dmg === 45 && (horse.spread ?? 0) < 0.1, "the Workhorse sits in the middle");

/* --- barrels stop at two, and cost a fortune to get there --- */
const barrels = CANNON_TRACK_BY_ID["barrels"];
assert(barrels.max === 1, "barrels has a single level");
assert(cannonTrackCost(horse, barrels, 0) >= 5000, `the barrel upgrade is a big sum (${cannonTrackCost(horse, barrels, 0)} CR)`);
assert(cannonBarrels({ barrels: 1 }) === 2 && cannonBarrels({ barrels: 9 }) === 2, "one extra barrel, never more");

/* --- crit tracks --- */
assert(cannonCrit({ crit: 4 }) === 0.2 && cannonCrit({}) === 0, "crit chance is 5% a level, 0 without the track");
assert(cannonCritMul({}) === 2 && cannonCritMul({ critDmg: 4 }) === 3, "crit damage starts at x2 and climbs");

/* --- buying a chassis eats the bill and fits it --- */
const g = new Game(newSave(), "t") as any;
g.save.credits = 1000;
assert(g.buyCannonChassis("skewer") !== null, "cannot build the Skewer without the parts in storage");
/* right kinds, wrong part names: a plain body segment is not a head, a plain
 * spike is not an antenna */
g.save.inventory = [comp("segment", 0, "s0"), comp("spike", 0, "sp0", "Tail Spike"), comp("leg", 0, "l0"), comp("leg", 0, "l4"), comp("core", 1, "c0")];
const nameProb = g.buyCannonChassis("skewer");
assert(!!nameProb && /antenna|head/i.test(nameProb), `a body segment and a spike do not stand in for a head and an antenna (${nameProb})`);
g.save.inventory = [
  comp("leg", 0, "l1"), comp("leg", 0, "l2"), comp("leg", 0, "l3"),
  comp("spike", 0, "an1", "Worker Ant Antenna"), comp("spike", 0, "sp1", "Tail Spike"),
  comp("segment", 0, "h1", "Mantis Head"), comp("segment", 0, "s1", "Body Segment"),
  comp("core", 1, "c1"), comp("core", 1, "c2"),
];
assert(g.buyCannonChassis("skewer") === null, "2 legs, an antenna, a head and an uncommon core build the Skewer");
const left = g.save.inventory.map((c: Comp) => c.id).sort().join();
assert(left === "c2,l3,s1,sp1", `exactly the bill is consumed (left: ${left})`);
assert(g.save.credits === 700, `300 credits were spent (left ${g.save.credits})`);
assert(cannonOwned(g.save, "skewer") && g.save.cannon.id === "skewer", "the new chassis is owned and fitted");

/* --- admin mode's infinite components skips the bill, not the price --- */
const ga = new Game(newSave(), "t") as any;
ga.admin = { ...ga.admin, on: true, components: true, credits: false };
ga.save.credits = 1000;
ga.save.inventory = [];
assert(ga.buyCannonChassis("peashooter") === null, "admin infinite components builds a gun with an empty hold");
assert(ga.save.credits === 700, "admin infinite components still charges the credits");
const gb = new Game(newSave(), "t") as any;
gb.admin = { ...gb.admin, on: true, components: true, credits: false };
gb.save.credits = 10;
assert(gb.buyCannonChassis("peashooter") !== null, "and it still refuses when the credits are short");

/* --- levels stay with their chassis --- */
g.save.credits = 100000;
g.selectCannon("sting");
g.buyCannon("dmg", 5);
assert(Math.abs(computeStats(g.save).dmg - cannonDmg(sting, { dmg: 5 })) < 1e-9, "Stinger damage follows its own track");
g.selectCannon("skewer");
assert(computeStats(g.save).dmg === 200, `a fresh chassis starts at its own damage (${computeStats(g.save).dmg})`);
g.buyCannon("crit", 4);
assert(Math.abs(computeStats(g.save).crit - 0.2) < 1e-9, "the Skewer's crit track feeds its crit chance");
g.buyCannon("critDmg", 4);
assert(computeStats(g.save).critMul === 3, "crit damage climbs on its own track");
g.buyCannon("pen", 3);
assert(computeStats(g.save).pierce === 3, "penetration feeds the round");
g.selectCannon("sting");
assert(Math.abs(computeStats(g.save).dmg - cannonDmg(sting, { dmg: 5 })) < 1e-9, "swapping back keeps the Stinger's work");

/* --- the Workhorse's barrel --- */
g.save.cannon.owned.push("workhorse");
g.selectCannon("workhorse");
assert(g.buyCannon("barrels", 5) === 1, "the barrel track sells one level and refuses a second");
assert(computeStats(g.save).barrels === 2, "two barrels on the Workhorse");
assert(g.buyCannon("barrels", 1) === 0, "no third barrel");
g.selectCannon("sting");
assert(g.buyCannon("barrels", 1) === 0, "the Stinger has no barrel track to buy");

/* --- accuracy and speed tracks only move what they should --- */
assert(cannonSpread(pea, { acc: 0 }) > cannonSpread(pea, { acc: 10 }), "accuracy tightens the Peashooter's spray");
assert(cannonSpread(sting, { acc: 10 }) === 0, "a gun with no spread stays perfectly straight");

/* --- legacy saves keep their work --- */
const m = migrate({ ...newSave(), cannon: { id: "sting", lv: { dmg: 7, rate: 2 } }, upgrades: {} } as any);
assert(m.cannon.lv["sting"].dmg === 7, "v2.11 flat levels migrate onto the fitted chassis");
assert(!("rate" in m.cannon.lv["sting"]), "the dropped rate track is pruned");
const m2 = migrate({ ...newSave(), cannon: undefined, upgrades: { dmg: 7, rate: 2 } } as any);
assert(m2.cannon.lv["sting"].dmg === 7, "v2.9 global Cannon Damage levels migrate too");
assert(m2.cannon.owned.includes("sting"), "the Stinger is always owned");

/* --- the panel is a solid wall, not just a shock --- */
const g2 = new Game(newSave(), "t") as any;
g2.resize(1280, 720, 1);
const e = g2.makeEnemy(0, 5, 1200, 0, "test", 11);
g2.player.x = 1200; g2.player.y = 200;
g2.enemies.push(e);
g2.update(1 / 60);                          // populate e.shields
g2.enemies = [e];
g2.player.dead = false; g2.player.hp = g2.player.maxHp ?? 100;
const info = e.shields[0];
const ux = e.x + Math.cos(info.ang) * info.r, uy = e.y + Math.sin(info.ang) * info.r;
g2.player.hitT = 0;                          // shock still on cooldown: the wall must hold anyway
g2.player.x = ux; g2.player.y = uy;
const hp0 = g2.player.hp + g2.player.shield;
g2.update(1 / 60);
const d1 = Math.hypot(g2.player.x - e.x, g2.player.y - e.y);
assert(d1 > info.r + info.thick, `the hull is lifted off the panel even while the shock is cooling down (${d1.toFixed(0)}u vs wall ${info.r.toFixed(0)}u)`);
assert(g2.player.hp + g2.player.shield === hp0, "and it does not take a second shock for it");

/* the same wall still zaps when the cooldown is up */
g2.player.hitT = 99;
g2.player.x = ux; g2.player.y = uy;
const hp1 = g2.player.hp + g2.player.shield;
g2.update(1 / 60);
assert(g2.player.hp + g2.player.shield < hp1, "touching it with the shock ready still discharges");
assert(Math.hypot(g2.player.x - e.x, g2.player.y - e.y) > info.r + info.thick, "and still leaves the ship outside the panel");

console.log("\ncannon: all checks passed");
