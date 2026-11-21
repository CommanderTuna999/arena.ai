/* Cannon chassis tree, per-cannon tracks, chassis bills and the shield wall. */
import { Game } from "@/game/engine";
import {
  CANNONS, CANNON_BY_ID, CANNON_TRACK_BY_ID, cannonBarrels, cannonCrit, cannonCritMul, cannonDmg,
  cannonHeatDmg, cannonHeatSpread, cannonOwned, cannonRate, cannonSpread, cannonTracks, cannonTrackCost,
  computeStats, migrate, newSave,
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
assert(tier1.every((c) => c.name !== "" && c.desc.length > 6), "every tier 1 chassis has a name and a description");

/* --- bills: common legs, heads and a pile of common cores, straight off the sheet --- */
const ALLOWED = new Set(["leg", "core", "segment", "spike"]);
const cores = (c: (typeof tier1)[number]) => c.parts.filter((b) => b.kind === "core").reduce((n, b) => n + b.count, 0);
for (const c of tier1) {
  const commons = c.parts.filter((b) => b.tier === 0);
  const commonCount = commons.reduce((n, b) => n + b.count, 0);
  assert(commons.length === c.parts.length, `${c.name}: the whole bill is common parts (no rare materials)`);
  assert(commons.every((b) => ALLOWED.has(b.kind)), `${c.name}: every line is a leg, core, head or antenna (${commons.map((b) => b.label).join(", ")})`);
  assert(commons.some((b) => b.kind === "leg" && b.count === 2), `${c.name}: two common legs`);
  assert(cores(c) >= 5, `${c.name}: cores are the bulk of the bill (${cores(c)})`);
  assert(c.credits === (c.id === "peashooter" ? 300 : 500), `${c.name}: ${c.credits} credits on top of the parts`);
}
assert(tier1.every((c) => c.parts.every((b) => !("species" in b))), "no bill line names a species");
assert(CANNONS.every((c) => !/MK\d/.test(c.id)), "the MK numbers live in the names, not the ids");
assert(skewer.name === "Skewer MK1" && pea.name === "Peashooter MK1" && horse.name === "Workhorse MK1", "the tier 1 guns are the sheet's MK1s");

/* --- the frames' upgrades, per chassis --- */
assert(cannonTracks(sting).map((t) => t.id).join() === "dmg", "the Stinger has a damage track and nothing else");
assert(cannonTracks(skewer).map((t) => t.id).join() === "crit,critDmg,pen,dmg", "the Skewer carries crit chance, crit damage, penetration and damage");
assert(cannonTracks(pea).map((t) => t.id).join() === "acc,speed,dmg,crit,critDmg", "the Peashooter carries accuracy, projectile speed, damage, crit chance and crit damage");
assert(cannonTracks(horse).map((t) => t.id).join() === "dmg,rate,pen,barrels", "the Workhorse carries damage, fire rate, penetration and barrels");
assert(CANNON_TRACK_BY_ID["pen"].name === "Penetration", "the sheet calls the track Penetration");
assert(skewer.hitscan === true && skewer.dmg === 300 && skewer.interval === 1.2, "the Skewer is a 300-damage hitscan on a 1.2s interval");
assert(pea.dmg === 35 && Math.abs(pea.interval - 0.1) < 1e-9 && (pea.spread ?? 0) > 0.1, "the Peashooter is a 35-damage spray gun");
assert(horse.dmg === 55 && (horse.spread ?? 0) < 0.1, "the Workhorse starts at 55 a round");
assert(cannonHeatDmg(horse, 0) === 1 && Math.abs(cannonHeatDmg(horse, 1) - 300 / 55) < 1e-9, "and hits 300 when the gauge is full");
assert(Math.round(cannonDmg(horse) * cannonHeatDmg(horse, 1)) === 300, "55 x the full-heat multiplier is the sheet's 300");
assert(cannonHeatSpread(horse, 0) === 1 && cannonHeatSpread(horse, 1) > 2, "a hot Workhorse throws them wide");
assert(horse.overheat === 3, "and a full gauge is a three-second cool-off");
assert(sting.overheat === undefined || sting.overheat === undefined, "the Stinger never jams");
assert(tier1.every((c) => c.overheat === 3 || c.overheat === undefined), "only the guns the sheet cooks can jam");

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
g.save.inventory = [comp("segment", 0, "s0"), comp("spike", 0, "sp0", "Tail Spike"), comp("leg", 0, "l0"), comp("leg", 0, "l4"), comp("core", 0, "c0")];
const nameProb = g.buyCannonChassis("skewer");
assert(!!nameProb && /antenna|head|core/i.test(nameProb), `a body segment and a spike do not stand in for a head and an antenna (${nameProb})`);
g.save.inventory = [
  comp("leg", 0, "l1"), comp("leg", 0, "l2"), comp("leg", 0, "l3"),
  comp("spike", 0, "an1", "Worker Ant Antenna"), comp("spike", 0, "sp1", "Tail Spike"),
  comp("segment", 0, "h1", "Mantis Head"), comp("segment", 0, "s1", "Body Segment"),
  ...Array.from({ length: 7 }, (_, i) => comp("core", 0, `k${i}`)),
];
assert(g.buyCannonChassis("skewer") === null, "2 legs, an antenna, a head and six common cores build the Skewer");
const left = g.save.inventory.map((c: Comp) => c.id).sort().join();
assert(left === "k6,l3,s1,sp1", `exactly the bill is consumed (left: ${left})`);
assert(g.save.credits === 500, `500 credits were spent (left ${g.save.credits})`);
assert(cannonOwned(g.save, "skewer") && g.save.cannon.id === "skewer", "the new chassis is owned and fitted");

/* --- one gun per tier (and admin mode is the only way around it) --- */
const gt = new Game(newSave(), "t") as any;
gt.save.credits = 100000;
gt.save.inventory = [
  comp("leg", 0, "t1"), comp("leg", 0, "t2"), comp("leg", 0, "t3"), comp("leg", 0, "t4"),
  ...Array.from({ length: 12 }, (_, i) => comp("core", 0, `t${10 + i}`)),
  comp("segment", 0, "t9", "Mantis Head"),
];
assert(gt.buyCannonChassis("peashooter") === null, "the Peashooter can be bought while tier 1 is empty");
const second = gt.buyCannonChassis("workhorse");
assert(!!second && /one gun per tier/i.test(second), `a second tier 1 chassis is refused outside admin mode (${second})`);
assert(!gt.save.cannon.owned.includes("workhorse"), "and nothing was charged for it");
gt.admin = { ...gt.admin, on: true };
assert(gt.buyCannonChassis("workhorse") === null, "admin mode may buy the whole row");

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
assert(computeStats(g.save).dmg === 300, `a fresh chassis starts at its own damage (${computeStats(g.save).dmg})`);
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

/* --- barrels are real places on the hull, not one point --- */
assert(sting.muzzles.length === 1 && skewer.muzzles.length === 1, "single-barrel guns have one muzzle");
assert(horse.muzzles.length === 2, "the Workhorse has two barrels");
assert(horse.desc === "Boring..." && skewer.desc === "Pretty accurate." && pea.desc === "Spray and pray, huh?", "the tier 1 descriptions are the sheet's lines, nothing appended");
assert(sting.desc === "Everyone’s gotta start somewhere.", "the Stinger carries the sheet's description");
assert(new Set(CANNONS.map((c) => c.look.style)).size === 4, "every chassis wears a different silhouette");

const gf = new Game(newSave(), "t") as any;
gf.player.x = 5200; gf.player.y = 0; gf.player.dead = false;
gf.save.cannon.owned.push("workhorse");
gf.selectCannon("workhorse");
gf.input.lmb = true;
const fire = () => { gf.player.fireCd = 0; gf.bullets = []; (gf as any).firePlayer(1 / 60); return gf.bullets as { x: number; y: number; dmg: number }[]; };
gf.player.barrelRec = [0, 0];
gf.player.heat = 0;
let shots = fire();
assert(shots.length === 1, `one round per trigger before the barrel upgrade (got ${shots.length})`);
assert(gf.player.muzzle === 1, "the second barrel is up next: a twin alternates");
assert(gf.player.barrelRec[0] === 1 && gf.player.barrelRec[1] === 0, "only the barrel that fired kicks back");
gf.player.barrelRec = [0, 0];
shots = fire();
assert(shots.length === 1 && gf.player.muzzle === 0, "the next trigger comes out of the other barrel");
assert(gf.player.barrelRec[1] === 1 && gf.player.barrelRec[0] === 0, "and it is the other barrel that kicks");
assert(gf.player.recoil === 1 && gf.player.muzzleFlash === 1, "firing kicks the gun back and lights the muzzle");
assert(gf.player.heat > 0, "firing heats the barrel");
const hot = gf.player.heat;
gf.player.dead = false; gf.update(0.5);
assert(gf.player.heat < hot, "and it cools off when you stop");

/* --- a cold round is 55, a hot one is the sheet's 300 --- */
gf.player.heat = 0;
shots = fire();
assert(Math.abs(shots[0].dmg - 55) < 1e-9, `a cold round hits for 55 (got ${shots[0].dmg})`);
gf.player.heat = 0.5;
shots = fire();
assert(shots[0].dmg > 55 && shots[0].dmg < 300, `a half-hot round sits between the two (${shots[0].dmg.toFixed(0)})`);
gf.player.heat = 0.999;
shots = fire();
assert(Math.round(shots[0].dmg) >= 299, `a gauge about to blow hits for 300 (${shots[0].dmg.toFixed(0)})`);
gf.player.heat = 0; gf.player.jam = 0;

/* --- the second barrel alternates too, and shares the heat --- */
gf.save.credits = 100000;
gf.buyCannon("barrels", 1);
gf.player.heat = 0; gf.player.muzzle = 0;
shots = fire();
assert(shots.length === 1, `the second barrel does not double the round, it takes turns (got ${shots.length})`);
assert(gf.player.muzzle === 1, "the barrels still alternate after the upgrade");
gf.player.heat = 0;
fire();
assert(Math.abs(gf.player.heat - gf.stats.heatPerShot / 2) < 1e-9, "two barrels split the heat, so the gun runs cooler");
gf.player.barrelRec = [0, 0];
gf.player.muzzle = 0;
fire();
assert(gf.player.barrelRec[0] === 1 && gf.player.barrelRec[1] === 0, "and exactly one barrel recoils per trigger");

/* --- a full gauge jams the trigger for three seconds --- */
const gh = new Game(newSave(), "t") as any;
gh.player.x = 5200; gh.player.y = 0; gh.player.dead = false;
gh.save.cannon.owned.push("workhorse");
gh.selectCannon("workhorse");
gh.input.lmb = true;
let guard = 0;
while (gh.player.jam <= 0 && guard++ < 200) { gh.player.fireCd = 0; gh.bullets = []; gh.firePlayer(1 / 60); }
assert(gh.player.jam > 2.9 && gh.player.jam <= 3, `a full gauge jams for three seconds (${gh.player.jam.toFixed(2)}s after ${guard} rounds)`);
assert(guard > 10, `it takes a dozen rounds to cook (${guard})`);
gh.player.fireCd = 0; gh.bullets = [];
gh.firePlayer(1 / 60);
assert(gh.bullets.length === 0, "a jammed gun does not fire");
/* nothing hunts a test range: keep the ship clean so the clock is the only thing moving */
const step = (n: number) => {
  for (let i = 0; i < n; i++) {
    gh.enemies.length = 0;
    gh.player.dead = false;
    gh.player.hp = gh.stats.hull;
    gh.player.x = 5200; gh.player.y = 0;
    gh.update(0.05);
  }
};
step(20);   // one second
assert(gh.player.jam < 2.1 && gh.player.jam > 1.9, `the jam counts down, one second at a time (${gh.player.jam.toFixed(2)}s)`);
gh.player.fireCd = 0; gh.bullets = [];
gh.firePlayer(1 / 60);
assert(gh.bullets.length === 0, "and it stays dead until the timer runs out");
step(45);   // and the rest of the cool-off
assert(gh.player.jam === 0 && gh.player.heat < 0.05, `then it is cold and ready again (${gh.player.jam.toFixed(2)}s)`);
gh.player.fireCd = 0; gh.bullets = [];
gh.firePlayer(1 / 60);
assert(gh.bullets.length === 1, "and it fires again");

/* a gun the sheet does not cook never jams */
const gs = new Game(newSave(), "t") as any;
gs.player.x = 5200; gs.player.y = 0; gs.player.dead = false;
gs.input.lmb = true;
let gsN = 0;
while (gsN++ < 400) { gs.player.fireCd = 0; gs.bullets = []; gs.firePlayer(1 / 60); }
assert(gs.player.jam === 0 && gs.player.heat >= 1, "the Stinger heats up but never locks out");

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
