/* Weapon targeting: any piece in range is enough, and the piece chosen follows
 * the sheet's order (core -> shield generators / weapons -> closest part). */
import { Game } from "@/game/engine";
import { newSave } from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };
const g = new Game(newSave(), "t") as any;
g.resize(1280, 720, 1);
g.player.x = 0; g.player.y = 0;

const e = g.makeEnemy(0, 5, 1400, 0, "test", 21);
/* keep the field to just this body so the assertion is about the targeting
 * rules and not about whatever else the world seeded */
g.enemies.length = 0;
g.enemies.push(e);
g.updateEnemy(e, 1 / 60, 1400, 0, 1400);

const partDist = (q: any) => { const w = g.partWorld(e, q); return Math.hypot(w[0] - g.player.x, w[1] - g.player.y); };
const alive = e.parts.filter((q: any) => q.alive);
const nearest = Math.min(...alive.map(partDist));
console.log(`  body centre ${Math.hypot(e.x, e.y).toFixed(0)}u, nearest piece ${nearest.toFixed(0)}u, radius ${e.radius.toFixed(0)}u`);

/* a range that reaches the closest piece but not the hull centre */
const range = nearest + 5;
assert(Math.hypot(e.x, e.y) > range, "the test range falls short of the body centre");
assert(g.combatTarget(g.player.x, g.player.y, range) === e, "the weapon still fires while a single piece is in range");
assert(g.combatTarget(g.player.x, g.player.y, nearest - 300) === null, "and holds fire once every piece is out of range");

/* priority order */
const core = e.parts[e.coreId];
assert(g.priorityPart(e, g.player.x, g.player.y) === core, "the core is the first choice");
core.alive = false;
const pick = g.priorityPart(e, g.player.x, g.player.y);
const support = [...e.shieldParts, ...e.weaponParts].some((id: number) => e.parts[id] === pick);
assert(!!pick && (support || pick.kind === "shield" || pick.kind === "weapon"), `with the core gone it shoots a generator or a gun (${pick?.kind})`);
for (const id of [...e.shieldParts, ...e.weaponParts]) e.parts[id].alive = false;
const fallback = g.priorityPart(e, g.player.x, g.player.y);
assert(!!fallback && fallback.kind !== "shield" && fallback.kind !== "weapon", `with no support left it takes the closest piece (${fallback?.kind})`);

console.log("\ntargeting: all checks passed");
