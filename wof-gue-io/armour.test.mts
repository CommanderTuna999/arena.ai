/* Plating strength: armour is a multiple of the body's average piece, and the
 * multiple climbs with rarity (sheet: rare 4, epic 5.5, legendary 7, mythical 9). */
import { ARMOUR_HP_MUL, SPECIES_LIST, buildEnemy } from "@/game/enemies";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };

const SHEET = [null, null, 4, 5.5, 7, 9, 16];
assert(ARMOUR_HP_MUL.length === 7, "one multiplier per rarity");
for (let t = 2; t <= 6; t++) assert(ARMOUR_HP_MUL[t] === SHEET[t], `tier ${t} armour is ${SHEET[t]}x the average piece (got ${ARMOUR_HP_MUL[t]})`);
assert(ARMOUR_HP_MUL[0] < ARMOUR_HP_MUL[2] && ARMOUR_HP_MUL[1] < ARMOUR_HP_MUL[2], "common and uncommon sit below rare");

/* walk a few species at every tier and check the ratio the body actually gets */
let checked = 0;
for (let si = 0; si < SPECIES_LIST.length; si++) {
  for (let tier = 0; tier <= 5; tier++) {
    const b = buildEnemy(si, tier, 1337 + si * 7 + tier);
    const plates = b.parts.filter((p) => p.kind === "armor");
    if (!plates.length) continue;
    const others = b.parts.filter((p) => p.kind !== "armor");
    if (!others.length) continue;
    const avg = others.reduce((n, p) => n + p.maxHp, 0) / others.length;
    const want = ARMOUR_HP_MUL[tier];
    /* every plate is priced off the body's average; the standard plate is exactly
     * the sheet's figure, with eyes at 0.9x and Core Guard layers at 1.6x/2.2x */
    const ratios = plates.map((p) => p.maxHp / (want * avg));
    assert(ratios.some((r) => Math.abs(r - 1) < 0.02), `${SPECIES_LIST[si].name} t${tier}: a plate at exactly ${want}x the average piece (ratios ${ratios.map((r) => r.toFixed(2)).join(",")})`);
    assert(ratios.every((r) => r >= 0.5 && r <= 2.3), `${SPECIES_LIST[si].name} t${tier}: no plate escapes the armour band (${Math.min(...ratios).toFixed(2)}..${Math.max(...ratios).toFixed(2)})`);
    checked++;
    if (checked > 40) break;
  }
  if (checked > 40) break;
}
assert(checked > 10, `checked ${checked} bodies`);

/* armour still scales with rarity like everything else */
const rare = buildEnemy(0, 2, 99), mythic = buildEnemy(0, 5, 99);
const rp = Math.max(...rare.parts.filter((p) => p.kind === "armor").map((p) => p.maxHp));
const mp = Math.max(...mythic.parts.filter((p) => p.kind === "armor").map((p) => p.maxHp));
assert(mp > rp * 100, `mythical plating towers over rare (${Math.round(rp)} vs ${Math.round(mp)} HP)`);

console.log("\narmour: all checks passed");
