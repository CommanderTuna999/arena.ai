/* Enemy attachment damage values from the sheet, per projectile, plus the two
 * shape rules that come with them: the rail's reach is the body's own aggro,
 * and the laser holds a beam whose damage climbs to its full 1.0x. */
import { Game } from "@/game/engine";
import { GUN_SPECS, LASER_RAMP, LASER_RAMP_MIN, type GunKind } from "@/game/enemies";
import { newSave } from "@/game/data";

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };
const g = new Game(newSave(), "t") as any;
g.resize(1280, 720, 1);
g.player.x = 0; g.player.y = 0;
g.stats.dodge = 0;

/* ---- the sheet's per-projectile multiples of the body's own hit ----------- */
const sheet: Record<string, number> = { gun: 0.5, minigun: 0.2, scatter: 1.2, heavy: 17, laser: 1.0 };
for (const [kind, mult] of Object.entries(sheet)) {
  assert(Math.abs(GUN_SPECS[kind as GunKind].dmg - mult) < 1e-9, `${GUN_SPECS[kind as GunKind].name}: ${mult}x per projectile (sheet)`);
}
assert(GUN_SPECS.gun.r === 14 && GUN_SPECS.gun.speed === 720, "the basic cannon's round is large and fast");
assert(GUN_SPECS.scatter.pellets === 7 && GUN_SPECS.scatter.r === 9, "the scatter throws 7 large pellets");
assert(GUN_SPECS.minigun.burst === 10 && GUN_SPECS.minigun.cool === 10, "the rotary gun cools down for 10s after its burst");
assert(GUN_SPECS.heavy.hitscan === true && GUN_SPECS.heavy.aggroRange === true, "the heavy rail is hitscan out to the body's aggro");
assert(GUN_SPECS.laser.track === true, "the laser is a tracking beam, not a projectile");

/* ---- a body with a single known mount, ship in front of it --------------- */
const e = g.makeEnemy(0, 3, 600, 0, "test", 11);
g.enemies.length = 0;
g.enemies.push(e);
e.aggro = true;
e.stun = 0;
const wp = e.parts[e.weaponParts[0]];
for (const id of e.weaponParts) if (id !== wp.id) e.parts[id].alive = false;
wp.cd = 0;

/* one trigger: re-aim the mount at the ship, run one update tick, and read the
 * projectiles that leave. Re-aiming every time keeps the test about the damage
 * values rather than about which tick the group happened to be tracking. */
/* point the body itself at the ship and zero the turret group, so the muzzle
 * already aims at the ship and the body's own turning cannot walk it off */
const aimAt = () => {
  e.x = 600; e.y = 0; e.vx = 0; e.vy = 0; e.stun = 0;
  e.a = Math.atan2(g.player.y - e.y, g.player.x - e.x);
  for (const gs of e.groups) gs.ang = 0;
};
const fire = (kind: GunKind) => {
  aimAt();
  g.eprojs.length = 0;
  (g as any).beams.length = 0;
  wp.wpn = kind;
  wp.cd = 0;
  e.mgHeat = 0; e.mgCool = 0;
  g.updateEnemy(e, 1 / 60, 600, 0, 600);
  return g.eprojs.length;
};

const r = fire("gun");
assert(r > 0, "a gun mount throws a projectile at the ship");
assert(Math.abs(g.eprojs[0].dmg / e.eDmg - 0.5) < 1e-9, `a gun projectile is 0.5x eDmg (${g.eprojs[0].dmg.toFixed(1)} = 0.5 × ${e.eDmg.toFixed(1)})`);
assert(g.eprojs[0].r === 14 * (1 + 0.1 * e.tier), "and it is a very large round");

const r2 = fire("scatter");
assert(r2 === 7, "the scatter fires all seven of its pellets at once");
assert(Math.abs(g.eprojs[0].dmg / e.eDmg - 1.2) < 1e-9, "every pellet is 1.2x eDmg");

const r3 = fire("minigun");
assert(r3 > 0, "the rotary gun fires while the burst is open");
assert(Math.abs(g.eprojs[0].dmg / e.eDmg - 0.2) < 1e-9, "a rotary projectile is 0.2x eDmg");
/* run the burst dry and it goes onto the cool-down */
wp.wpn = "minigun"; wp.cd = 0; e.mgHeat = 9.99; e.mgCool = 0;
g.updateEnemy(e, 1 / 60, 600, 0, 600);
assert(e.mgCool > 0, "once the burst runs dry the rotary gun cools for 10s");
/* the shot that ends the burst is the one that closes it, so the hold-fire
 * check is the tick after it */
g.eprojs.length = 0;
g.updateEnemy(e, 1 / 60, 600, 0, 600);
assert(g.eprojs.length === 0, "and it holds its trigger while it cools");

/* ---- the rail: reach is the body's own aggro ---------------------------- */
/* the ship sits inside the ring now; move it just outside and the rail should
 * hold fire, because its reach is the body's aggro and nothing further */
const range = g.aggroRange(e);
{
  g.eprojs.length = 0;
  wp.wpn = "heavy"; wp.cd = 0; e.mgHeat = 0; e.mgCool = 0;
  g.player.x = e.x + Math.cos(e.a) * (range + 60);
  g.player.y = e.y + Math.sin(e.a) * (range + 60);
  aimAt();
  const before = (g as any).beams.length;
  g.updateEnemy(e, 1 / 60, 600, 0, 600);
  assert(g.eprojs.length === 0, "the rail holds fire once the ship is outside the aggro ring");
  assert(Math.abs((g as any).aggroRange(e) - range) < 1e-9, `and its reach is the body's own aggro (${range.toFixed(0)}u)`);
}
{
  /* back inside: the slug lands and its damage is the sheet's 17x. A 17x slug
   * outright kills the hull, so the hull is oversized just for this check */
  g.player.x = 0; g.player.y = 0;
  aimAt();
  wp.wpn = "heavy"; wp.cd = 0; e.mgHeat = 0; e.mgCool = 0;
  const hullSave = g.stats.hull;
  g.stats.hull = 1e6; g.player.hp = 1e6;
  g.updateEnemy(e, 1 / 60, 600, 0, 600);
  assert(g.player.hp < 1e6, "the rail lands a hit on the ship");
  g.stats.hull = hullSave;
  assert(Math.abs(GUN_SPECS.heavy.dmg - 17) < 1e-9, "and its slug is the sheet's 17x eDmg");
}

/* ---- the laser: held beam, ramping damage ------------------------------- */
{
  /* the mount tracks, so re-aim it every tick. The body is pinned to one spot
   * so the three seconds of ramp are about the beam and not about the body
   * walking the mount off its line */
  /* 900u away: inside the laser's 1000u reach but far enough that the body
   * itself never touches the ship, which would stun the mount mid-beam */
  const aim = () => {
    e.x = 0; e.y = 900; e.vx = 0; e.vy = 0; e.stun = 0;
    e.a = Math.atan2(g.player.y - e.y, g.player.x - e.x);
    for (const gs of e.groups) gs.ang = 0;
  };
  wp.wpn = "laser"; wp.cd = 0; e.stun = 0;
  /* the beam is a damage-over-time weapon, so the hull is oversized to keep the
   * ship alive through the ramp and the checks are about damage per tick */
  const hullSave = g.stats.hull;
  g.stats.hull = 1e6; g.player.hp = 1e6;
  const tick = () => { aim(); g.player.hp = g.stats.hull; g.updateEnemy(e, 1 / 60, 600, 0, 600); return g.stats.hull - g.player.hp; };
  const d0 = tick();
  assert(d0 > 0, "the beam deals damage on its first tick");
  const expect0 = e.eDmg * 1.0 * (LASER_RAMP_MIN + (1 - LASER_RAMP_MIN) * (1 / 60 / LASER_RAMP)) / 60;
  assert(Math.abs(d0 - expect0) < expect0 * 0.15, `a fresh beam is at the ramp's floor (${d0.toFixed(2)} ≈ ${expect0.toFixed(2)})`);
  assert(g.beams.length > 0, "and the beam is drawn while it is held");
  for (let i = 0; i < 60 * 3; i++) { aim(); g.updateEnemy(e, 1 / 60, 600, 0, 600); }
  const full = tick();
  const expectFull = e.eDmg * 1.0 / 60;
  assert(Math.abs(full - expectFull) < expectFull * 0.12, `a fully ramped beam deals the sheet's 1.0x per tick (${full.toFixed(2)} ≈ ${expectFull.toFixed(2)})`);
  /* break the line: the ramp falls away */
  e.stun = 3;
  for (let i = 0; i < 60 * 3; i++) g.updateEnemy(e, 1 / 60, 600, 0, 600);
  assert(wp.beam < 0.01, "the ramp falls back when the ship breaks the line");
  g.stats.hull = hullSave; g.player.hp = g.stats.hull;
}

console.log("\nattachments: all checks passed");
