# wof gue — complete stat compendium

Build 2.1.2 · generated 21 Nov 2026 · every figure is a live simulation constant, not a design target.

How to read it: enemy health is the sum of every part at that rarity tier. Enemy damage is listed as a multiplier of the tier damage (eDmg), because every bite, bolt, blast and contact hit scales from that one number. Weapon damage is a multiplier of the player cannon damage (st.dmg = 10 x 1.2^Cannon Damage level). Efficiency (eff) is the crafted item quality: 0.30 minimum, 1.00 typical; the raw formula can reach 2.25 on an unrestricted tier-5 core build and 1.80 on a 7-part difficulty-5 recipe.

============================================================
1. CORE FORMULAS
============================================================

Player base cannon: damage = st.dmg per shot; rate = 4 + 0.7 x Fire Rate level shots/s; shots per trigger = 1 + Extra Barrels level; range 760u; projectile speed 900u/s. Cannon upgrades are damage, rate, barrels and crit only.
Crafted weapon: damage per hit = st.dmg x wpn.dmg x eff (then x2.5 on a crit, x2.2 during Overdrive). Cooldown = wpn.cd / (0.7 + 0.3 x eff), so 100% efficiency is the listed cooldown and 30% efficiency is 1.27x slower (cd / 0.79).
Enemy damage: eDmg = 16 x DMG_MUL[tier] = 16 / 48 / 144 / 432 / 1,296 / 3,888. Every ability, gun, missile and contact hit is a multiplier of that eDmg.
Enemy hull: every part HP is generated from HP_MUL[tier] = 1 / 4 / 18 / 80 / 360 / 1,600, with part size and shape adding their own multipliers. The tables below give the resulting totals.
Player hull: 100 x 1.22^Hull level. Armour reduction is multiplicative with Reactive Lattice and Kinetic Barrier; shield absorbs before hull. Dodge is checked before any damage is applied.

============================================================
2. ZONES, RARITY AND SPAWN PRESSURE
============================================================

Zone edges are 2,200 / 4,800 / 7,800 / 10,600 / 13,200 / 16,000u from the centre. Zone 0 is the outer ring and zone 5 is the mythical core.

Tier | Zone | Radius band | HP_MUL | DMG_MUL | eDmg | Base contact (0.25x) | Spawn weight/chunk | Local cap
0 | Common (outer) | 13,200-16,000u | 1 | 1 | 16 | 4 | 2.6 | 56
1 | Uncommon | 10,600-13,200u | 4 | 3 | 48 | 12 | 2.2 | 48
2 | Rare | 7,800-10,600u | 18 | 9 | 144 | 36 | 1.8 | 40
3 | Epic | 4,800-7,800u | 80 | 27 | 432 | 108 | 0.32 | 14
4 | Legendary | 2,200-4,800u | 360 | 81 | 1,296 | 324 | 0.16 | 8
5 | Mythical (core) | 0-2,200u | 1600 | 243 | 3,888 | 972 | 0.075 | 4

Initial world seed: every walkable 1,500u chunk is visited once. A chunk only gets a resident if its zone roll passes clamp(zone weight / 2.6, 0.03, 1): common 100%, uncommon 84.6%, rare 69.2%, epic 12.3%, legendary 6.2%, mythical 2.9%. Within a seeded chunk, 55% of enemies are the zone tier, 28% one tier lower, 12% two lower and 5% three lower. Epic and above therefore hold far fewer residents, and each higher ring is lower again.
Top-up refills only toward 85% of the local cap: 48 / 41 / 34 / 12 / 7 / 3 enemies within 2,700u. The visibility floor is 4 enemies in view in common-rare and 2 in legendary-mythical; it deliberately spawns no higher than rare tier, so it cannot repopulate a high ring with legends. Boss check: the dedicated snake pass is disabled in this build (SNAKE_ENABLED = false); no boss is spawned by normal seeding.

============================================================
3. DAMAGE TYPES AND DEFENCES
============================================================

Type | Carried by | Enemy energy shield | Enemy hull shells | Player shield (damageProfile)
Kinetic | base cannon, scatter, hmg, rail, drones | STOPPED dead; no shield drain | bullet: 30% | crafting label: kinetic/phase/ward/reflector/prismatic/nullfield shields
Energy | pulse, lance, bypass | passes through | beam: 80% (plating resists 20%) | crafting label: every player shield
Explosive | missile, homing, flak, mines, cluster | STOPPED dead; no shield drain | missile/flak: 40%; blast: 40% | crafting label: kinetic and prismatic shields only
Shock | emp, chain, gravity, sonic | passes through; direct AoE bypasses | blast: 15%; EMP/chain/sonic skip shelled enemies | crafting label: every player shield
Corrosive | acid, venom | STOPPED dead; no shield drain | bullet: 30% | armour label: titan/carapace/chitin block it
Thermal | cutter | passes through | beam: 80% | crafting label: every player shield
Physical | collisions, knockback, shockwave abilities | collisions are not projectiles; physical rounds stopped | no shell check on collisions | armour label: every armour blocks physical

Enemy energy-shield bubble: a Shield Generator part projects a hex bubble of 1.9 x body size that covers only that generator, not the whole body; a shot outside the hex reaches the hull normally. Energy, shock and thermal projectiles and beams pass straight through and hit the generator inside. Every other projectile is stopped dead at the hex edge with no effect on the bubble or the hull: the bubble has no charge to strip, so it never collapses, re-arms or regenerates, and only disappears when its Shield Generator part is destroyed. The Shield-Bypass Laser still ignores bubbles; the Rail Sniper no longer does, and hull shells still stop the rail. Direct area effects (EMP, chain lightning, sonic, gravity, mines, explosions, collisions) do not run the bubble check.
Enemy hull shells (plating): tier 2+ enemies get tier-1 solid armour layers, each holding 60% of the enemy total hull, bolted over the body as steel slabs. A hit is swallowed by the outermost layer and only a share of it is lost: bullets 30%, missile/flak rounds 40%, beams 80% (plating resists only 20% of energy), area blasts 40%, shockwaves 15% (EMP, chain lightning and sonic skip shelled enemies entirely). Legendary legs carry 1 plating layer of their own and mythical legs 2, so shots that land on a plated limb are swallowed by the hull slabs instead of the leg. A layer shatters into a damaging shockwave when destroyed. Tier 5 mythical: 4 layers of 60% hull each, e.g. 943,872 HP per layer (3.8M total) on a 1,573,120 hull.
Player defence labels: the Blocks column comes from damageProfile, which the crafting UI displays. Actual player mitigation is type-agnostic: armour reduces every incoming hit, then shield absorbs the remainder, then hull takes the rest. Kinetic Barrier adds another multiplier while shield holds; dodge is checked before all of it.

============================================================
4. ENEMY COMPENDIUM (32 SPECIES)
============================================================

Every species block lists spawn band, movement, total hull by tier, shell/shield defence, mounts and abilities. Ability availability is gated by index as well as minTier: tier T can only use the first min(T, 4) ability entries, so the "from Tn" value is exact.

--- 1. Dragonfly (dragonfly) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 210u/s; turn 3.4; ranged, keeps 330u; muzzle 2.2 body-size units.
Hull by tier:
  T0: 310 HP total; core 30; largest part 30; 30 parts; radius 101u; no energy shield.
  T1: 1,405 HP total; core 120; largest part 120; 33 parts; radius 167u; no energy shield.
  T2: 9,792 HP total; core 540; largest part 540; 44 parts; radius 276u; no energy shield; 1 hull shell (5,875 HP).
  T3: 62,496 HP total; core 2,400; largest part 2,400; 63 parts; radius 455u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (74,996 HP).
  T4: 328,608 HP total; core 10,800; largest part 12,672; 69 parts; radius 751u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (591,495 HP).
  T5: 1,573,120 HP total; core 48,000; largest part 56,320; 73 parts; radius 1,239u; 2 shield generators (651-716u bubbles; energy/shock/thermal pass); 4 hull shells (3,775,488 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Ion Bolt [shoot], from T1, 1.8s cooldown: 0.7x eDmg damage (2,722 at T5); 0.3s wind-up; 2 projectiles at T5 (1 + 0.3/tier); 0.15 rad spread; 700 u/s; 1.4s life; size 6; slow to 0.75x for 1.2s; range 0-950u; bolt projectile.
  - Strafe Run [charge], from T2, 7s cooldown: 1.5x eDmg damage (5,832 at T5); 0.5s wind-up; 880 u/s; 0.5s duration; range 220-750u.
  - Fan Burst [shoot], from T3, 6s cooldown: 0.6x eDmg damage (2,333 at T5); 0.5s wind-up; 8 projectiles at T5 (5 + 0.6/tier); 0.9 rad spread; 600 u/s; 1.2s life; size 6; range 0-800u; bolt projectile.
  - Wing Shear [nova], from T4, 10s cooldown: 0.7x eDmg damage (2,722 at T5); 0.8s wind-up; 17 projectiles at T5 (10 + 1.5/tier); 420 u/s; 1.6s life; size 7; range 0-600u; wave projectile.

--- 2. Scorpion (scorpion) ---
Spawn: zones 0-3 (Common (outer) to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 115u/s; turn 2.4; melee, no keep distance; muzzle 2.6 body-size units.
Hull by tier:
  T0: 486 HP total; core 30; largest part 30; 41 parts; radius 108u; no energy shield.
  T1: 1,987 HP total; core 120; largest part 120; 42 parts; radius 178u; no energy shield.
  T2: 12,262 HP total; core 540; largest part 540; 56 parts; radius 294u; no energy shield; 1 hull shell (7,357 HP).
  T3: 87,840 HP total; core 2,400; largest part 2,400; 90 parts; radius 485u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (105,408 HP).
  T4: 498,960 HP total; core 10,800; largest part 12,672; 103 parts; radius 800u; no energy shield; 3 hull shells (898,128 HP).
  T5: 2,288,000 HP total; core 48,000; largest part 56,320; 105 parts; radius 1,321u; no energy shield; 4 hull shells (5,491,200 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Pincer Clamp [swing], from T1, 2.6s cooldown: 2x eDmg damage (7,776 at T5); 0.5s wind-up; range 0-3.5 body-size units; arm swing; requires intact Pincer.
  - Tail Lash [swing], from T2, 4.2s cooldown: 2.6x eDmg damage (10,109 at T5); 0.6s wind-up; poison 0.3x eDmg; range 0-3.9 body-size units; tail swing; requires intact Stinger.
  - Venom Bolt [shoot], from T3, 4.5s cooldown: 0.9x eDmg damage (3,499 at T5); 0.4s wind-up; 3 projectiles at T5 (1 + 0.5/tier); 0.3 rad spread; 560 u/s; 1.5s life; size 7; poison 0.25x eDmg; range 200-800u; bolt projectile.
  - Claw Grapple [pull], from T4, 11s cooldown: 0.5x eDmg damage (1,944 at T5); 0.5s wind-up; 760 u/s; range 260-800u.

--- 3. Widow Spider (spider) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 140u/s; turn 2.8; ranged, keeps 300u; muzzle 2.2 body-size units.
Hull by tier:
  T0: 406 HP total; core 30; largest part 30; 40 parts; radius 110u; no energy shield.
  T1: 1,644 HP total; core 120; largest part 120; 41 parts; radius 182u; no energy shield.
  T2: 9,947 HP total; core 540; largest part 540; 52 parts; radius 301u; no energy shield; 1 hull shell (5,968 HP).
  T3: 80,528 HP total; core 2,400; largest part 2,400; 93 parts; radius 496u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (96,634 HP).
  T4: 478,008 HP total; core 10,800; largest part 12,672; 107 parts; radius 818u; no energy shield; 3 hull shells (860,415 HP).
  T5: 2,194,880 HP total; core 48,000; largest part 56,320; 109 parts; radius 1,350u; no energy shield; 4 hull shells (5,267,712 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 2 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Web Shot [shoot], from T1, 6s cooldown: 0.4x eDmg damage (1,555 at T5); 0.5s wind-up; 1 projectile at T5 (1); 460 u/s; 1.8s life; size 12; slow to 0.5x for 2.5s; range 120-800u; web projectile.
  - Fang Strike [swing], from T2, 2s cooldown: 1.7x eDmg damage (6,610 at T5); 0.4s wind-up; range 0-2.3 body-size units; mandible swing; requires intact Fang.
  - Acid Glob [spit], from T3, 7s cooldown: 0.6x eDmg damage (2,333 at T5); 0.5s wind-up; 480 u/s; size 1.5; range 0-800u.
  - Silk Line [pull], from T4, 12s cooldown: 0.5x eDmg damage (1,944 at T5); 0.5s wind-up; 760 u/s; range 250-850u.

--- 4. Luna Moth (moth) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 130u/s; turn 2.6; ranged, keeps 380u; muzzle 1.4 body-size units.
Hull by tier:
  T0: 350 HP total; core 30; largest part 30; 34 parts; radius 71u; no energy shield.
  T1: 1,683 HP total; core 120; largest part 120; 38 parts; radius 116u; no energy shield.
  T2: 8,957 HP total; core 540; largest part 540; 45 parts; radius 192u; no energy shield; 1 hull shell (5,374 HP).
  T3: 70,752 HP total; core 2,400; largest part 2,400; 66 parts; radius 317u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (84,902 HP).
  T4: 337,248 HP total; core 10,800; largest part 12,672; 68 parts; radius 523u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (607,047 HP).
  T5: 1,540,480 HP total; core 48,000; largest part 56,320; 69 parts; radius 862u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (3,697,152 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Scale Dust [cloud], from T1, 8s cooldown: 0.4x eDmg damage (1,555 at T5); 0.6s wind-up; size 2.8; slow to 0.55x for 1.5s; range 0-700u; spawns on the player.
  - Spore Orbs [shoot], from T2, 5s cooldown: 0.8x eDmg damage (3,110 at T5); 0.5s wind-up; 4 projectiles at T5 (2 + 0.5/tier); 0.7 rad spread; 260 u/s; 4s life; size 9; slow to 0.8x for 1s; homing 1.6 rad/s; range 0-800u; orb projectile.
  - Lunar Lure [pull], from T3, 12s cooldown: 0.5x eDmg damage (1,944 at T5); 0.6s wind-up; 700 u/s; range 250-800u.
  - Gust Pulse [ring], from T4, 9s cooldown: 1.2x eDmg damage (4,666 at T5); 0.9s wind-up; 460 u/s; size 6; range 0-4 body-size units.

--- 5. Mantis (mantis) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 120u/s; turn 3; melee, no keep distance; muzzle 2 body-size units.
Hull by tier:
  T0: 428 HP total; core 30; largest part 30; 36 parts; radius 92u; no energy shield.
  T1: 1,710 HP total; core 120; largest part 120; 36 parts; radius 152u; no energy shield.
  T2: 9,022 HP total; core 540; largest part 540; 43 parts; radius 251u; no energy shield; 1 hull shell (5,413 HP).
  T3: 70,464 HP total; core 2,400; largest part 2,400; 72 parts; radius 414u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (84,556 HP).
  T4: 350,640 HP total; core 10,800; largest part 12,672; 76 parts; radius 683u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (631,152 HP).
  T5: 1,886,720 HP total; core 48,000; largest part 56,320; 85 parts; radius 1,127u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (4,528,128 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Scythe Strike [swing], from T1, 2.2s cooldown: 2.4x eDmg damage (9,331 at T5); 0.5s wind-up; range 0-3.2 body-size units; arm swing; requires intact Raptor Blade.
  - Lunge [charge], from T2, 6s cooldown: 2x eDmg damage (7,776 at T5); 0.5s wind-up; 820 u/s; 0.35s duration; range 150-600u.
  - Blade Wave [shoot], from T3, 5s cooldown: 1.5x eDmg damage (5,832 at T5); 0.5s wind-up; 3 projectiles at T5 (1 + 0.4/tier); 0.3 rad spread; 520 u/s; 1.5s life; size 14; pierces; range 150-800u; wave projectile.
  - Whirling Blades [nova], from T4, 10s cooldown: 1x eDmg damage (3,888 at T5); 0.8s wind-up; 15 projectiles at T5 (10 + 1/tier); 380 u/s; 1.6s life; size 9; range 0-600u; wave projectile.

--- 6. Centipede (centipede) ---
Spawn: zones 0-3 (Common (outer) to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 170u/s; turn 2.8; melee, no keep distance; muzzle 3 body-size units.
Hull by tier:
  T0: 899 HP total; core 30; largest part 30; 88 parts; radius 160u; no energy shield.
  T1: 4,411 HP total; core 120; largest part 120; 109 parts; radius 282u; no energy shield.
  T2: 23,983 HP total; core 540; largest part 540; 131 parts; radius 494u; no energy shield.
  T3: 224,288 HP total; core 2,400; largest part 2,400; 273 parts; radius 863u; no energy shield.
  T4: 1,162,800 HP total; core 10,800; largest part 12,672; 313 parts; radius 1,505u; no energy shield.
  T5: 5,793,920 HP total; core 48,000; largest part 56,320; 352 parts; radius 2,618u; no energy shield.
Defence: serpentine body (no hull shells); no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Forcipule Bite [swing], from T1, 2s cooldown: 1.8x eDmg damage (6,998 at T5); 0.4s wind-up; range 0-3.6 body-size units; mandible swing; requires intact Forcipule.
  - Rush [charge], from T2, 5s cooldown: 1.5x eDmg damage (5,832 at T5); 0.4s wind-up; 540 u/s; 0.9s duration; range 220-900u.
  - Venom Spray [shoot], from T3, 5s cooldown: 0.5x eDmg damage (1,944 at T5); 0.4s wind-up; 9 projectiles at T5 (5 + 0.8/tier); 0.9 rad spread; 500 u/s; 0.9s life; size 6; poison 0.15x eDmg; range 0-520u; bolt projectile.
  - Venom Ring [nova], from T4, 10s cooldown: 0.6x eDmg damage (2,333 at T5); 0.8s wind-up; 24 projectiles at T5 (14 + 2/tier); 380 u/s; 1.5s life; size 7; poison 0.15x eDmg; range 0-600u; bolt projectile.

--- 7. Hornet (wasp) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 2 / 2 / 1 / 1 / 1 / 1.
Movement: flying; speed 190u/s; turn 3.6; melee, no keep distance; muzzle 1.8 body-size units.
Hull by tier:
  T0: 403 HP total; core 30; largest part 30; 38 parts; radius 99u; no energy shield.
  T1: 1,682 HP total; core 120; largest part 120; 39 parts; radius 164u; no energy shield.
  T2: 8,978 HP total; core 540; largest part 540; 43 parts; radius 271u; no energy shield; 1 hull shell (5,387 HP).
  T3: 56,992 HP total; core 2,400; largest part 2,400; 66 parts; radius 447u; no energy shield; 2 hull shells (68,390 HP).
  T4: 307,152 HP total; core 10,800; largest part 12,672; 72 parts; radius 737u; no energy shield; 3 hull shells (552,873 HP).
  T5: 1,393,280 HP total; core 48,000; largest part 56,320; 73 parts; radius 1,216u; no energy shield; 4 hull shells (3,343,872 HP).
Defence: no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Mandible Snap [swing], from T1, 2s cooldown: 1.2x eDmg damage (4,666 at T5); 0.35s wind-up; range 0-2.2 body-size units; mandible swing; requires intact Mandible.
  - Hornet Dive [charge], from T2, 5s cooldown: 1.6x eDmg damage (6,221 at T5); 0.5s wind-up; 900 u/s; poison 0.25x eDmg; 0.45s duration; range 150-800u.
  - Stinger Volley [shoot], from T3, 4s cooldown: 0.7x eDmg damage (2,722 at T5); 0.35s wind-up; 5 projectiles at T5 (3 + 0.5/tier); 0.35 rad spread; 620 u/s; 1.3s life; size 5; poison 0.2x eDmg; range 150-750u; bolt projectile.
  - Stinger Burst [nova], from T4, 10s cooldown: 0.6x eDmg damage (2,333 at T5); 0.8s wind-up; 19 projectiles at T5 (12 + 1.5/tier); 440 u/s; 1.4s life; size 5; range 0-600u; bolt projectile.

--- 8. Scarab (beetle) ---
Spawn: zones 0-5 (Common (outer) to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 110u/s; turn 2.8; melee, no keep distance; muzzle 2.8 body-size units.
Hull by tier:
  T0: 362 HP total; core 30; largest part 30; 29 parts; radius 84u; no energy shield.
  T1: 1,448 HP total; core 120; largest part 120; 29 parts; radius 139u; no energy shield.
  T2: 8,768 HP total; core 540; largest part 540; 48 parts; radius 230u; no energy shield; 1 hull shell (5,261 HP).
  T3: 71,448 HP total; core 2,400; largest part 2,400; 70 parts; radius 379u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (85,738 HP).
  T4: 406,908 HP total; core 10,800; largest part 12,672; 92 parts; radius 626u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (732,435 HP).
  T5: 2,307,680 HP total; core 48,000; largest part 56,320; 106 parts; radius 1,032u; 2 shield generators (651-716u bubbles; energy/shock/thermal pass); 4 hull shells (5,538,432 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Mandible Crush [swing], from T1, 2.4s cooldown: 1.8x eDmg damage (6,998 at T5); 0.45s wind-up; range 0-2.7 body-size units; mandible swing; requires intact Mandible.
  - Ram [charge], from T2, 7s cooldown: 2.6x eDmg damage (10,109 at T5); 0.8s wind-up; 560 u/s; 0.6s duration; range 200-750u.
  - Quake Stomp [ring], from T3, 9s cooldown: 1.6x eDmg damage (6,221 at T5); 0.9s wind-up; 420 u/s; size 6; range 0-3.8 body-size units.

--- 9. Soldier Ant (ant) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 4 / 3 / 2 / 1 / 1 / 1.
Movement: ground; speed 150u/s; turn 3.4; melee, no keep distance; muzzle 3 body-size units.
Hull by tier:
  T0: 390 HP total; core 30; largest part 30; 34 parts; radius 93u; no energy shield.
  T1: 1,562 HP total; core 120; largest part 120; 34 parts; radius 153u; no energy shield.
  T2: 9,144 HP total; core 540; largest part 540; 52 parts; radius 253u; no energy shield; 1 hull shell (5,486 HP).
  T3: 71,040 HP total; core 2,400; largest part 2,400; 73 parts; radius 418u; no energy shield; 2 hull shells (85,248 HP).
  T4: 374,112 HP total; core 10,800; largest part 12,672; 88 parts; radius 689u; no energy shield; 3 hull shells (673,401 HP).
  T5: 1,733,120 HP total; core 48,000; largest part 56,320; 90 parts; radius 1,137u; no energy shield; 4 hull shells (4,159,488 HP).
Defence: no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Mandible Crush [swing], from T1, 2s cooldown: 1.6x eDmg damage (6,221 at T5); 0.4s wind-up; range 0-3.1 body-size units; mandible swing; requires intact Mandible.
  - Formic Acid [spit], from T2, 5s cooldown: 0.7x eDmg damage (2,722 at T5); 0.45s wind-up; 500 u/s; size 1.3; range 150-750u.
  - Formic Haze [cloud], from T3, 9s cooldown: 0.5x eDmg damage (1,944 at T5); 0.6s wind-up; size 3.2; slow to 0.6x for 1.5s; range 0-3.2 body-size units.
  - Acid Burst [nova], from T4, 10s cooldown: 0.7x eDmg damage (2,722 at T5); 0.8s wind-up; 19 projectiles at T5 (12 + 1.5/tier); 380 u/s; 1.5s life; size 8; range 0-600u; bolt projectile.

--- 10. Firefly (firefly) ---
Spawn: zones 1-5 (Uncommon to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 125u/s; turn 2.8; ranged, keeps 340u; muzzle 1.7 body-size units.
Hull by tier:
  T0: 352 HP total; core 30; largest part 30; 33 parts; radius 91u; no energy shield.
  T1: 1,522 HP total; core 120; largest part 120; 35 parts; radius 150u; no energy shield.
  T2: 7,308 HP total; core 540; largest part 540; 36 parts; radius 248u; no energy shield; 1 hull shell (4,385 HP).
  T3: 67,648 HP total; core 2,400; largest part 2,400; 71 parts; radius 410u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (81,178 HP).
  T4: 342,288 HP total; core 10,800; largest part 12,672; 75 parts; radius 676u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (616,119 HP).
  T5: 1,633,280 HP total; core 48,000; largest part 56,320; 78 parts; radius 1,115u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (3,919,872 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Glow Orb [shoot], from T1, 3s cooldown: 0.8x eDmg damage (3,110 at T5); 0.4s wind-up; 3 projectiles at T5 (1 + 0.4/tier); 0.5 rad spread; 300 u/s; 4.5s life; size 9; slow to 0.8x for 1s; homing 1.2 rad/s; range 0-850u; orb projectile.
  - Flash Pulse [ring], from T2, 8s cooldown: 1.4x eDmg damage (5,443 at T5); 0.8s wind-up; 480 u/s; size 5; range 0-4 body-size units.
  - Flash Dive [charge], from T3, 7s cooldown: 1.6x eDmg damage (6,221 at T5); 0.6s wind-up; 780 u/s; 0.5s duration; range 200-700u.
  - Firework [nova], from T4, 10s cooldown: 0.7x eDmg damage (2,722 at T5); 0.8s wind-up; 24 projectiles at T5 (14 + 2/tier); 360 u/s; 1.8s life; size 8; homing 0.4 rad/s; range 0-600u; orb projectile.

--- 11. Worker Ant (workerant) ---
Spawn: zones 0-2 (Common (outer) to Rare). Pack per tier: 4 / 4 / 3 / 2 / 1 / 1.
Movement: ground; speed 165u/s; turn 3.8; melee, no keep distance; muzzle 2.6 body-size units.
Hull by tier:
  T0: 394 HP total; core 30; largest part 30; 34 parts; radius 96u; no energy shield.
  T1: 1,574 HP total; core 120; largest part 120; 34 parts; radius 158u; no energy shield.
  T2: 9,202 HP total; core 540; largest part 540; 52 parts; radius 261u; no energy shield; 1 hull shell (5,521 HP).
  T3: 77,056 HP total; core 2,400; largest part 2,400; 85 parts; radius 431u; no energy shield; 2 hull shells (92,468 HP).
  T4: 343,584 HP total; core 10,800; largest part 12,672; 84 parts; radius 712u; no energy shield; 3 hull shells (618,450 HP).
  T5: 1,527,040 HP total; core 48,000; largest part 56,320; 84 parts; radius 1,175u; no energy shield; 4 hull shells (3,664,896 HP).
Defence: no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Mandible Crush [swing], from T1, 2.1s cooldown: 1.4x eDmg damage (5,443 at T5); 0.4s wind-up; range 0-2.9 body-size units; mandible swing; requires intact Mandible.
  - Call Swarm [summon], from T2, 15s cooldown: no direct damage; 0.7s wind-up; 2 projectiles at T5 (2); range 0-2 body-size units.
  - Formic Haze [cloud], from T3, 10s cooldown: 0.4x eDmg damage (1,555 at T5); 0.6s wind-up; size 2.6; slow to 0.6x for 1.5s; range 0-2.8 body-size units.

--- 12. Honeybee (honeybee) ---
Spawn: zones 0-2 (Common (outer) to Rare). Pack per tier: 3 / 3 / 2 / 1 / 1 / 1.
Movement: flying; speed 175u/s; turn 3.6; melee, no keep distance; muzzle 1.9 body-size units.
Hull by tier:
  T0: 451 HP total; core 30; largest part 30; 39 parts; radius 94u; no energy shield.
  T1: 1,872 HP total; core 120; largest part 120; 40 parts; radius 155u; no energy shield.
  T2: 10,787 HP total; core 540; largest part 540; 58 parts; radius 256u; no energy shield; 1 hull shell (6,472 HP).
  T3: 73,096 HP total; core 2,400; largest part 2,400; 75 parts; radius 422u; no energy shield; 2 hull shells (87,716 HP).
  T4: 363,780 HP total; core 10,800; largest part 12,672; 79 parts; radius 696u; no energy shield; 3 hull shells (654,804 HP).
  T5: 1,756,960 HP total; core 48,000; largest part 56,320; 83 parts; radius 1,149u; 1 shield generator (651-651u bubbles; energy/shock/thermal pass); 4 hull shells (4,216,704 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; T3 has 2 gun(s) / 0 pod(s). Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Venom Sting [spit], from T1, 4.5s cooldown: 0.8x eDmg damage (3,110 at T5); 0.4s wind-up; 520 u/s; size 1.2; poison 0.3x eDmg; range 0-520u.
  - Sting Dive [charge], from T2, 6s cooldown: 1.5x eDmg damage (5,832 at T5); 0.5s wind-up; 850 u/s; poison 0.25x eDmg; 0.4s duration; range 150-750u.
  - Pollen Burst [nova], from T3, 11s cooldown: 0.5x eDmg damage (1,944 at T5); 0.8s wind-up; 17 projectiles at T5 (10 + 1.4/tier); 420 u/s; 1.4s life; size 5; poison 0.18x eDmg; range 0-600u; bolt projectile.

--- 13. Grasshopper (grasshopper) ---
Spawn: zones 0-2 (Common (outer) to Rare). Pack per tier: 2 / 2 / 2 / 1 / 1 / 1.
Movement: ground; speed 155u/s; turn 3.2; melee, no keep distance; muzzle 2.4 body-size units.
Hull by tier:
  T0: 326 HP total; core 30; largest part 30; 30 parts; radius 118u; no energy shield.
  T1: 1,306 HP total; core 120; largest part 120; 30 parts; radius 195u; no energy shield.
  T2: 7,920 HP total; core 540; largest part 540; 47 parts; radius 322u; no energy shield; 1 hull shell (4,752 HP).
  T3: 45,440 HP total; core 2,400; largest part 2,400; 55 parts; radius 531u; no energy shield; 2 hull shells (54,528 HP).
  T4: 217,152 HP total; core 10,800; largest part 12,672; 56 parts; radius 876u; no energy shield; 3 hull shells (390,873 HP).
  T5: 965,120 HP total; core 48,000; largest part 56,320; 56 parts; radius 1,445u; no energy shield; 4 hull shells (2,316,288 HP).
Defence: no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Leaping Charge [charge], from T1, 5.5s cooldown: 1.8x eDmg damage (6,998 at T5); 0.6s wind-up; 980 u/s; 0.45s duration; range 180-900u.
  - Kick [swing], from T2, 3.4s cooldown: 1.5x eDmg damage (5,832 at T5); 0.35s wind-up; range 0-3.1 body-size units; leg swing; requires intact Hind Leg.
  - Spit Seeds [shoot], from T3, 5s cooldown: 0.5x eDmg damage (1,944 at T5); 0.4s wind-up; 5 projectiles at T5 (3 + 0.4/tier); 0.4 rad spread; 480 u/s; 1.3s life; size 5; range 200-800u; bolt projectile.

--- 14. Cockroach (cockroach) ---
Spawn: zones 0-2 (Common (outer) to Rare). Pack per tier: 3 / 3 / 2 / 2 / 1 / 1.
Movement: ground; speed 190u/s; turn 3.5; melee, no keep distance; muzzle 2.4 body-size units.
Hull by tier:
  T0: 497 HP total; core 30; largest part 30; 40 parts; radius 81u; no energy shield.
  T1: 1,989 HP total; core 120; largest part 120; 40 parts; radius 133u; no energy shield.
  T2: 11,066 HP total; core 540; largest part 540; 58 parts; radius 220u; no energy shield; 1 hull shell (6,640 HP).
  T3: 88,384 HP total; core 2,400; largest part 2,400; 83 parts; radius 363u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (106,060 HP).
  T4: 477,360 HP total; core 10,800; largest part 12,672; 101 parts; radius 599u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (859,248 HP).
  T5: 2,233,600 HP total; core 48,000; largest part 56,320; 104 parts; radius 988u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (5,360,640 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Shell Bash [charge], from T1, 4.5s cooldown: 1.6x eDmg damage (6,221 at T5); 0.5s wind-up; 760 u/s; 0.5s duration; range 160-700u.
  - Wing Flare [ring], from T2, 9s cooldown: 1x eDmg damage (3,888 at T5); 0.7s wind-up; 460 u/s; size 4.5; range 0-3.4 body-size units.
  - Scuttle Acid [spit], from T3, 6s cooldown: 0.5x eDmg damage (1,944 at T5); 0.4s wind-up; 460 u/s; size 1.4; range 0-700u.

--- 15. Mosquito (mosquito) ---
Spawn: zones 0-2 (Common (outer) to Rare). Pack per tier: 3 / 3 / 2 / 2 / 1 / 1.
Movement: flying; speed 220u/s; turn 4.2; melee, no keep distance; muzzle 2.2 body-size units.
Hull by tier:
  T0: 343 HP total; core 30; largest part 30; 33 parts; radius 69u; no energy shield.
  T1: 1,374 HP total; core 120; largest part 120; 33 parts; radius 113u; no energy shield.
  T2: 6,930 HP total; core 540; largest part 540; 38 parts; radius 187u; no energy shield; 1 hull shell (4,158 HP).
  T3: 39,376 HP total; core 2,400; largest part 2,400; 52 parts; radius 308u; no energy shield; 2 hull shells (47,252 HP).
  T4: 189,864 HP total; core 10,800; largest part 12,672; 53 parts; radius 508u; no energy shield; 3 hull shells (341,754 HP).
  T5: 1,096,640 HP total; core 48,000; largest part 56,320; 60 parts; radius 838u; 1 shield generator (651-651u bubbles; energy/shock/thermal pass); 4 hull shells (2,631,936 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Blood Drain [drain], from T1, 5s cooldown: 0.55x eDmg damage (2,138 at T5); 0.5s wind-up; 1.6s duration; range 0-380u; range 0-2.4 body-size units.
  - Dive [charge], from T2, 6s cooldown: 1.2x eDmg damage (4,666 at T5); 0.4s wind-up; 880 u/s; poison 0.3x eDmg; 0.35s duration; range 150-700u.
  - Swarm Bite [nova], from T3, 9s cooldown: 0.4x eDmg damage (1,555 at T5); 0.7s wind-up; 14 projectiles at T5 (8 + 1.2/tier); 440 u/s; 1.3s life; size 4; poison 0.2x eDmg; range 0-520u; bolt projectile.

--- 16. Bombardier Beetle (bombardier) ---
Spawn: zones 1-3 (Uncommon to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 120u/s; turn 2.9; ranged, keeps 300u; muzzle 2.8 body-size units.
Hull by tier:
  T0: 411 HP total; core 30; largest part 30; 37 parts; radius 80u; no energy shield.
  T1: 1,645 HP total; core 120; largest part 120; 37 parts; radius 133u; no energy shield.
  T2: 9,518 HP total; core 540; largest part 540; 55 parts; radius 219u; no energy shield; 1 hull shell (5,711 HP).
  T3: 72,704 HP total; core 2,400; largest part 2,400; 76 parts; radius 361u; no energy shield; 2 hull shells (87,244 HP).
  T4: 390,240 HP total; core 10,800; largest part 12,672; 83 parts; radius 596u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (702,432 HP).
  T5: 1,875,200 HP total; core 48,000; largest part 56,320; 87 parts; radius 984u; 2 shield generators (651-716u bubbles; energy/shock/thermal pass); 4 hull shells (4,500,480 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Chemical Spray [spit], from T1, 5s cooldown: 0.7x eDmg damage (2,722 at T5); 0.45s wind-up; 520 u/s; size 1.7; range 0-640u.
  - Acid Puddle [cloud], from T2, 9s cooldown: 0.55x eDmg damage (2,138 at T5); 0.5s wind-up; size 3; slow to 0.7x for 1.5s; range 0-720u; spawns on the player.
  - Boiling Jet [shoot], from T3, 6s cooldown: 0.55x eDmg damage (2,138 at T5); 0.5s wind-up; 7 projectiles at T5 (4 + 0.6/tier); 0.7 rad spread; 500 u/s; 1.3s life; size 6; poison 0.2x eDmg; range 150-720u; bolt projectile.

--- 17. Rhinoceros Beetle (rhino) ---
Spawn: zones 1-3 (Uncommon to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 105u/s; turn 2.2; melee, no keep distance; muzzle 2.9 body-size units.
Hull by tier:
  T0: 418 HP total; core 30; largest part 30; 37 parts; radius 91u; no energy shield.
  T1: 1,673 HP total; core 120; largest part 120; 37 parts; radius 160u; no energy shield.
  T2: 11,372 HP total; core 540; largest part 540; 60 parts; radius 279u; no energy shield; 1 hull shell (6,823 HP).
  T3: 75,344 HP total; core 2,400; largest part 2,400; 77 parts; radius 485u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (90,412 HP).
  T4: 483,480 HP total; core 10,800; largest part 12,672; 103 parts; radius 842u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (870,264 HP).
  T5: 2,260,800 HP total; core 48,000; largest part 56,320; 106 parts; radius 1,457u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (5,425,920 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Horn Charge [charge], from T1, 7s cooldown: 3.2x eDmg damage (12,442 at T5); 0.9s wind-up; 620 u/s; 0.6s duration; range 200-800u.
  - Horn Toss [swing], from T2, 3s cooldown: 2.2x eDmg damage (8,554 at T5); 0.5s wind-up; range 0-3.4 body-size units; mandible swing; requires intact Mandible.
  - Ground Slam [ring], from T3, 10s cooldown: 2x eDmg damage (7,776 at T5); 0.9s wind-up; 420 u/s; size 5.5; range 0-4 body-size units.

--- 18. Yellowjacket (yellowjacket) ---
Spawn: zones 1-3 (Uncommon to Epic). Pack per tier: 2 / 2 / 2 / 1 / 1 / 1.
Movement: flying; speed 200u/s; turn 3.9; ranged, keeps 300u; muzzle 2 body-size units.
Hull by tier:
  T0: 468 HP total; core 30; largest part 30; 40 parts; radius 105u; no energy shield.
  T1: 1,943 HP total; core 120; largest part 120; 41 parts; radius 174u; no energy shield.
  T2: 9,808 HP total; core 540; largest part 540; 47 parts; radius 287u; no energy shield; 1 hull shell (5,885 HP).
  T3: 74,504 HP total; core 2,400; largest part 2,400; 76 parts; radius 473u; no energy shield; 2 hull shells (89,404 HP).
  T4: 370,116 HP total; core 10,800; largest part 12,672; 80 parts; radius 780u; no energy shield; 3 hull shells (666,210 HP).
  T5: 1,785,120 HP total; core 48,000; largest part 56,320; 84 parts; radius 1,288u; 1 shield generator (651-651u bubbles; energy/shock/thermal pass); 4 hull shells (4,284,288 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Venom Darts [shoot], from T1, 4s cooldown: 0.65x eDmg damage (2,527 at T5); 0.4s wind-up; 5 projectiles at T5 (3 + 0.5/tier); 0.35 rad spread; 600 u/s; 1.4s life; size 5; slow to 0.7x for 1.2s; poison 0.2x eDmg; range 180-800u; bolt projectile.
  - Stinger Thrust [swing], from T2, 2.6s cooldown: 1.8x eDmg damage (6,998 at T5); 0.35s wind-up; range 0-2.6 body-size units; tail swing; requires intact Stinger.
  - Dive Bomb [charge], from T3, 7s cooldown: 1.8x eDmg damage (6,998 at T5); 0.5s wind-up; 900 u/s; poison 0.25x eDmg; 0.45s duration; range 150-800u.

--- 19. Ladybug (ladybug) ---
Spawn: zones 1-3 (Uncommon to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 135u/s; turn 3; ranged, keeps 280u; muzzle 2 body-size units.
Hull by tier:
  T0: 440 HP total; core 30; largest part 30; 37 parts; radius 81u; no energy shield.
  T1: 1,758 HP total; core 120; largest part 120; 37 parts; radius 133u; no energy shield.
  T2: 11,758 HP total; core 540; largest part 540; 60 parts; radius 220u; no energy shield; 1 hull shell (7,055 HP).
  T3: 73,536 HP total; core 2,400; largest part 2,400; 75 parts; radius 363u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (88,244 HP).
  T4: 384,624 HP total; core 10,800; largest part 12,672; 81 parts; radius 599u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (692,322 HP).
  T5: 1,821,440 HP total; core 48,000; largest part 56,320; 84 parts; radius 988u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (4,371,456 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Spore Cloud [cloud], from T1, 8s cooldown: 0.45x eDmg damage (1,750 at T5); 0.6s wind-up; size 2.9; slow to 0.6x for 1.5s; range 0-3.2 body-size units.
  - Repel Pulse [ring], from T2, 8s cooldown: 1.1x eDmg damage (4,277 at T5); 0.7s wind-up; 440 u/s; size 5; range 0-3.6 body-size units.
  - Spore Burst [nova], from T3, 10s cooldown: 0.4x eDmg damage (1,555 at T5); 0.8s wind-up; 19 projectiles at T5 (12 + 1.5/tier); 360 u/s; 1.6s life; size 6; poison 0.15x eDmg; homing 0.6 rad/s; range 0-620u; orb projectile.

--- 20. Stag Beetle (stag) ---
Spawn: zones 1-3 (Uncommon to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 120u/s; turn 2.6; melee, no keep distance; muzzle 2.8 body-size units.
Hull by tier:
  T0: 419 HP total; core 30; largest part 30; 36 parts; radius 92u; no energy shield.
  T1: 1,675 HP total; core 120; largest part 120; 36 parts; radius 158u; no energy shield.
  T2: 9,655 HP total; core 540; largest part 540; 54 parts; radius 273u; no energy shield; 1 hull shell (5,793 HP).
  T3: 75,392 HP total; core 2,400; largest part 2,400; 76 parts; radius 469u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (90,470 HP).
  T4: 403,056 HP total; core 10,800; largest part 12,672; 92 parts; radius 805u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (725,502 HP).
  T5: 1,903,360 HP total; core 48,000; largest part 56,320; 95 parts; radius 1,379u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (4,568,064 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Pincer Grab [swing], from T1, 2.8s cooldown: 2.4x eDmg damage (9,331 at T5); 0.5s wind-up; range 0-3.2 body-size units; mandible swing; requires intact Pincer.
  - Toss [pull], from T2, 10s cooldown: 0.7x eDmg damage (2,722 at T5); 0.6s wind-up; 780 u/s; range 220-800u.
  - Goring Rush [charge], from T3, 7s cooldown: 2.6x eDmg damage (10,109 at T5); 0.7s wind-up; 700 u/s; 0.55s duration; range 200-800u.

--- 21. Carpenter Ant (carpenter) ---
Spawn: zones 2-4 (Rare to Legendary). Pack per tier: 2 / 2 / 2 / 1 / 1 / 1.
Movement: ground; speed 135u/s; turn 3; melee, no keep distance; muzzle 2.8 body-size units.
Hull by tier:
  T0: 490 HP total; core 30; largest part 30; 39 parts; radius 99u; no energy shield.
  T1: 1,958 HP total; core 120; largest part 120; 39 parts; radius 164u; no energy shield.
  T2: 9,634 HP total; core 540; largest part 540; 45 parts; radius 270u; no energy shield; 1 hull shell (5,780 HP).
  T3: 73,376 HP total; core 2,400; largest part 2,400; 74 parts; radius 445u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (88,052 HP).
  T4: 448,704 HP total; core 10,800; largest part 12,672; 88 parts; radius 735u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (807,666 HP).
  T5: 2,023,040 HP total; core 48,000; largest part 56,320; 89 parts; radius 1,212u; 1 shield generator (651-651u bubbles; energy/shock/thermal pass); 4 hull shells (4,855,296 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; T3 has 2 gun(s) / 0 pod(s). Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Crushing Bite [swing], from T1, 2.2s cooldown: 2.2x eDmg damage (8,554 at T5); 0.45s wind-up; range 0-3 body-size units; mandible swing; requires intact Mandible.
  - Quake Stomp [ring], from T2, 9s cooldown: 1.6x eDmg damage (6,221 at T5); 0.8s wind-up; 440 u/s; size 5; range 0-3.6 body-size units.
  - Call Colony [summon], from T3, 16s cooldown: no direct damage; 0.8s wind-up; 3 projectiles at T5 (3); range 0-2.5 body-size units.

--- 22. Cicada (cicada) ---
Spawn: zones 2-4 (Rare to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 140u/s; turn 3; ranged, keeps 340u; muzzle 1.8 body-size units.
Hull by tier:
  T0: 338 HP total; core 30; largest part 30; 32 parts; radius 94u; no energy shield.
  T1: 1,354 HP total; core 120; largest part 120; 32 parts; radius 154u; no energy shield.
  T2: 8,222 HP total; core 540; largest part 540; 41 parts; radius 255u; no energy shield; 1 hull shell (4,933 HP).
  T3: 63,584 HP total; core 2,400; largest part 2,400; 68 parts; radius 420u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (76,300 HP).
  T4: 308,160 HP total; core 10,800; largest part 12,672; 70 parts; radius 694u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (554,688 HP).
  T5: 1,411,200 HP total; core 48,000; largest part 56,320; 71 parts; radius 1,145u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (3,386,880 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Sonic Screech [ring], from T1, 8s cooldown: 1.4x eDmg damage (5,443 at T5); 0.75s wind-up; 520 u/s; size 6; range 0-4.2 body-size units.
  - Resonance [nova], from T2, 10s cooldown: 0.6x eDmg damage (2,333 at T5); 0.8s wind-up; 22 projectiles at T5 (14 + 1.6/tier); 380 u/s; 1.5s life; size 7; range 0-600u; wave projectile.
  - Chorus Field [cloud], from T3, 11s cooldown: 0.5x eDmg damage (1,944 at T5); 0.7s wind-up; size 3.4; slow to 0.7x for 1.5s; range 0-800u; spawns on the player.

--- 23. Assassin Bug (assassin) ---
Spawn: zones 2-4 (Rare to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 185u/s; turn 3.4; melee, no keep distance; muzzle 2.6 body-size units.
Hull by tier:
  T0: 417 HP total; core 30; largest part 30; 36 parts; radius 79u; no energy shield.
  T1: 1,667 HP total; core 120; largest part 120; 36 parts; radius 131u; no energy shield.
  T2: 9,619 HP total; core 540; largest part 540; 54 parts; radius 216u; no energy shield; 1 hull shell (5,772 HP).
  T3: 73,152 HP total; core 2,400; largest part 2,400; 75 parts; radius 356u; no energy shield; 2 hull shells (87,782 HP).
  T4: 344,736 HP total; core 10,800; largest part 12,672; 76 parts; radius 588u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (620,526 HP).
  T5: 1,573,760 HP total; core 48,000; largest part 56,320; 77 parts; radius 969u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (3,777,024 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; T3 has 2 gun(s) / 0 pod(s). Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Piercing Proboscis [drain], from T1, 5s cooldown: 0.7x eDmg damage (2,722 at T5); 0.45s wind-up; 1.8s duration; range 0-460u; range 0-2.6 body-size units.
  - Fang Slash [swing], from T2, 2.4s cooldown: 2x eDmg damage (7,776 at T5); 0.4s wind-up; range 0-2.8 body-size units; mandible swing; requires intact Proboscis.
  - Ambush Lunge [charge], from T3, 6s cooldown: 2.2x eDmg damage (8,554 at T5); 0.5s wind-up; 900 u/s; 0.4s duration; range 180-700u.

--- 24. Tiger Beetle (tiger) ---
Spawn: zones 2-4 (Rare to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 230u/s; turn 4; melee, no keep distance; muzzle 2.7 body-size units.
Hull by tier:
  T0: 401 HP total; core 30; largest part 30; 35 parts; radius 82u; no energy shield.
  T1: 1,605 HP total; core 120; largest part 120; 35 parts; radius 135u; no energy shield.
  T2: 8,978 HP total; core 540; largest part 540; 48 parts; radius 224u; no energy shield; 1 hull shell (5,387 HP).
  T3: 70,464 HP total; core 2,400; largest part 2,400; 73 parts; radius 369u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (84,556 HP).
  T4: 380,880 HP total; core 10,800; largest part 12,672; 89 parts; radius 609u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (685,584 HP).
  T5: 1,804,800 HP total; core 48,000; largest part 56,320; 92 parts; radius 1,004u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (4,331,520 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Dash [charge], from T1, 3.5s cooldown: 1.4x eDmg damage (5,443 at T5); 0.3s wind-up; 1,000 u/s; 0.32s duration; range 200-900u.
  - Second Dash [charge], from T2, 4s cooldown: 1.5x eDmg damage (5,832 at T5); 0.3s wind-up; 1,000 u/s; 0.32s duration; range 200-900u.
  - Sickle Jaws [swing], from T3, 2.2s cooldown: 2.1x eDmg damage (8,165 at T5); 0.35s wind-up; range 0-2.8 body-size units; mandible swing; requires intact Mandible.

--- 25. Mole Cricket (molecricket) ---
Spawn: zones 2-4 (Rare to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 130u/s; turn 3; melee, no keep distance; muzzle 2.8 body-size units.
Hull by tier:
  T0: 383 HP total; core 30; largest part 30; 30 parts; radius 122u; no energy shield.
  T1: 1,533 HP total; core 120; largest part 120; 30 parts; radius 202u; no energy shield.
  T2: 8,942 HP total; core 540; largest part 540; 47 parts; radius 333u; no energy shield; 1 hull shell (5,365 HP).
  T3: 58,208 HP total; core 2,400; largest part 2,400; 60 parts; radius 549u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (69,850 HP).
  T4: 283,968 HP total; core 10,800; largest part 12,672; 62 parts; radius 905u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (511,143 HP).
  T5: 1,303,680 HP total; core 48,000; largest part 56,320; 63 parts; radius 1,494u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (3,128,832 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Burrow Ambush [blink], from T1, 8s cooldown: 1.2x eDmg damage (4,666 at T5); 0.6s wind-up; range 0-700u.
  - Digger Claws [swing], from T2, 2.6s cooldown: 2x eDmg damage (7,776 at T5); 0.45s wind-up; range 0-3 body-size units; leg swing; requires intact Hind Leg.
  - Earth Shock [ring], from T3, 10s cooldown: 1.8x eDmg damage (6,998 at T5); 0.9s wind-up; 420 u/s; size 6; range 0-4 body-size units.

--- 26. Katydid (katydid) ---
Spawn: zones 2-5 (Rare to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 165u/s; turn 3.3; ranged, keeps 320u; muzzle 2.2 body-size units.
Hull by tier:
  T0: 350 HP total; core 30; largest part 30; 34 parts; radius 112u; no energy shield.
  T1: 1,402 HP total; core 120; largest part 120; 34 parts; radius 184u; no energy shield.
  T2: 7,056 HP total; core 540; largest part 540; 39 parts; radius 304u; no energy shield; 1 hull shell (4,234 HP).
  T3: 42,752 HP total; core 2,400; largest part 2,400; 55 parts; radius 501u; no energy shield; 2 hull shells (51,302 HP).
  T4: 205,056 HP total; core 10,800; largest part 12,672; 56 parts; radius 826u; no energy shield; 3 hull shells (369,102 HP).
  T5: 911,360 HP total; core 48,000; largest part 56,320; 56 parts; radius 1,364u; no energy shield; 4 hull shells (2,187,264 HP).
Defence: no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Leaf Shards [shoot], from T1, 4.5s cooldown: 0.7x eDmg damage (2,722 at T5); 0.4s wind-up; 5 projectiles at T5 (3 + 0.5/tier); 0.4 rad spread; 540 u/s; 1.5s life; size 7; pierces; range 180-800u; wave projectile.
  - Camo Shift [blink], from T2, 9s cooldown: 0.6x eDmg damage (2,333 at T5); 0.4s wind-up; range 0-600u.
  - Shard Storm [nova], from T3, 10s cooldown: 0.5x eDmg damage (1,944 at T5); 0.8s wind-up; 19 projectiles at T5 (12 + 1.4/tier); 460 u/s; 1.3s life; size 7; range 0-600u; wave projectile.

--- 27. Dung Beetle (dung) ---
Spawn: zones 3-5 (Epic to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 92u/s; turn 2; melee, no keep distance; muzzle 3.2 body-size units.
Hull by tier:
  T0: 505 HP total; core 30; largest part 30; 41 parts; radius 94u; no energy shield.
  T1: 2,021 HP total; core 120; largest part 120; 41 parts; radius 154u; no energy shield.
  T2: 11,210 HP total; core 540; largest part 540; 59 parts; radius 255u; no energy shield; 1 hull shell (6,726 HP).
  T3: 80,384 HP total; core 2,400; largest part 2,400; 88 parts; radius 420u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (96,460 HP).
  T4: 480,240 HP total; core 10,800; largest part 12,672; 102 parts; radius 693u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (864,432 HP).
  T5: 2,246,400 HP total; core 48,000; largest part 56,320; 105 parts; radius 1,144u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (5,391,360 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Rolling Slam [charge], from T1, 8s cooldown: 3.4x eDmg damage (13,219 at T5); 1s wind-up; 560 u/s; 0.7s duration; range 220-900u.
  - Boulder Toss [spit], from T2, 6s cooldown: 0.9x eDmg damage (3,499 at T5); 0.6s wind-up; 420 u/s; size 2.4; range 0-800u.
  - Impact Wave [ring], from T3, 11s cooldown: 2.4x eDmg damage (9,331 at T5); 1s wind-up; 400 u/s; size 7; range 0-4.4 body-size units.

--- 28. Atlas Moth (atlas) ---
Spawn: zones 3-5 (Epic to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 115u/s; turn 2.4; ranged, keeps 420u; muzzle 1.6 body-size units.
Hull by tier:
  T0: 350 HP total; core 30; largest part 30; 34 parts; radius 137u; no energy shield.
  T1: 1,542 HP total; core 120; largest part 120; 36 parts; radius 226u; no energy shield.
  T2: 7,690 HP total; core 540; largest part 540; 41 parts; radius 373u; no energy shield; 1 hull shell (4,614 HP).
  T3: 53,792 HP total; core 2,400; largest part 2,400; 62 parts; radius 616u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (64,550 HP).
  T4: 295,776 HP total; core 10,800; largest part 12,672; 68 parts; radius 1,016u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (532,398 HP).
  T5: 1,343,360 HP total; core 48,000; largest part 56,320; 69 parts; radius 1,677u; 1 shield generator (651-651u bubbles; energy/shock/thermal pass); 4 hull shells (3,224,064 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Wind Gust [ring], from T1, 8s cooldown: 1.3x eDmg damage (5,054 at T5); 0.8s wind-up; 480 u/s; size 7; range 0-4.6 body-size units.
  - Slow Powder [cloud], from T2, 10s cooldown: 0.5x eDmg damage (1,944 at T5); 0.7s wind-up; size 4; slow to 0.8x for 1.5s; range 0-900u; spawns on the player.
  - Downdraft [pull], from T3, 13s cooldown: 0.8x eDmg damage (3,110 at T5); 0.7s wind-up; 700 u/s; range 300-900u.

--- 29. Weevil (weevil) ---
Spawn: zones 3-5 (Epic to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 110u/s; turn 2.8; melee, no keep distance; muzzle 3.4 body-size units.
Hull by tier:
  T0: 390 HP total; core 30; largest part 30; 35 parts; radius 97u; no energy shield.
  T1: 1,558 HP total; core 120; largest part 120; 35 parts; radius 159u; no energy shield.
  T2: 7,834 HP total; core 540; largest part 540; 41 parts; radius 263u; no energy shield; 1 hull shell (4,700 HP).
  T3: 73,056 HP total; core 2,400; largest part 2,400; 75 parts; radius 434u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (87,668 HP).
  T4: 366,624 HP total; core 10,800; largest part 12,672; 79 parts; radius 716u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (659,922 HP).
  T5: 1,741,440 HP total; core 48,000; largest part 56,320; 82 parts; radius 1,182u; 3 shield generators (651-781u bubbles; energy/shock/thermal pass); 4 hull shells (4,179,456 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Drill Strike [swing], from T1, 3s cooldown: 2.6x eDmg damage (10,109 at T5); 0.55s wind-up; range 0-3.4 body-size units; mandible swing; requires intact Snout.
  - Boring Charge [charge], from T2, 8s cooldown: 2.8x eDmg damage (10,886 at T5); 0.8s wind-up; 640 u/s; 0.6s duration; range 200-800u.
  - Drill Shock [ring], from T3, 10s cooldown: 1.8x eDmg damage (6,998 at T5); 0.9s wind-up; 440 u/s; size 6; range 0-4 body-size units.

--- 30. Locust (locust) ---
Spawn: zones 3-5 (Epic to Mythical (core)). Pack per tier: 2 / 2 / 2 / 2 / 1 / 1.
Movement: flying; speed 205u/s; turn 3.4; melee, no keep distance; muzzle 2.6 body-size units.
Hull by tier:
  T0: 386 HP total; core 30; largest part 30; 36 parts; radius 114u; no energy shield.
  T1: 1,542 HP total; core 120; largest part 120; 36 parts; radius 189u; no energy shield.
  T2: 9,936 HP total; core 540; largest part 540; 56 parts; radius 312u; no energy shield; 1 hull shell (5,962 HP).
  T3: 53,312 HP total; core 2,400; largest part 2,400; 62 parts; radius 514u; no energy shield; 2 hull shells (63,974 HP).
  T4: 284,256 HP total; core 10,800; largest part 12,672; 67 parts; radius 849u; no energy shield; 3 hull shells (511,662 HP).
  T5: 1,263,360 HP total; core 48,000; largest part 56,320; 67 parts; radius 1,400u; no energy shield; 4 hull shells (3,032,064 HP).
Defence: no energy shields at any tier; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Swarm Rush [charge], from T1, 5s cooldown: 1.5x eDmg damage (5,832 at T5); 0.4s wind-up; 950 u/s; 0.4s duration; range 180-850u.
  - Summon Swarm [summon], from T2, 14s cooldown: no direct damage; 0.6s wind-up; 3 projectiles at T5 (3); range 0-2.5 body-size units.
  - Wing Storm [nova], from T3, 10s cooldown: 0.5x eDmg damage (1,944 at T5); 0.7s wind-up; 22 projectiles at T5 (14 + 1.6/tier); 480 u/s; 1.4s life; size 6; range 0-640u; wave projectile.

--- 31. Jewel Beetle (jewel) ---
Spawn: zones 4-5 (Legendary to Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1. Reflective shield: energy bolts are bounced back at 0.6x damage.
Movement: flying; speed 170u/s; turn 3.2; ranged, keeps 360u; muzzle 2.4 body-size units.
Hull by tier:
  T0: 553 HP total; core 30; largest part 30; 44 parts; radius 82u; no energy shield.
  T1: 2,210 HP total; core 120; largest part 120; 44 parts; radius 136u; no energy shield.
  T2: 12,064 HP total; core 540; largest part 540; 62 parts; radius 224u; no energy shield; 1 hull shell (7,238 HP).
  T3: 78,416 HP total; core 2,400; largest part 2,400; 79 parts; radius 370u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass); 2 hull shells (94,100 HP).
  T4: 487,224 HP total; core 10,800; largest part 12,672; 95 parts; radius 611u; 2 shield generators (394-434u bubbles; energy/shock/thermal pass); 3 hull shells (877,002 HP).
  T5: 2,306,240 HP total; core 48,000; largest part 56,320; 99 parts; radius 1,008u; 2 shield generators (651-716u bubbles; energy/shock/thermal pass); 4 hull shells (5,534,976 HP).
Defence: energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (3):
  - Prismatic Beam [shoot], from T1, 5s cooldown: 1.1x eDmg damage (4,277 at T5); 0.5s wind-up; 2 projectiles at T5 (1 + 0.3/tier); 0.1 rad spread; 760 u/s; 1.5s life; size 8; pierces; range 200-950u; wave projectile.
  - Refraction [nova], from T2, 9s cooldown: 0.7x eDmg damage (2,722 at T5); 0.7s wind-up; 24 projectiles at T5 (16 + 1.8/tier); 420 u/s; 1.7s life; size 7; range 0-700u; wave projectile.
  - Prism Pulse [ring], from T3, 11s cooldown: 2x eDmg damage (7,776 at T5); 0.8s wind-up; 480 u/s; size 6; range 0-4 body-size units.

--- 32. Snake (serpent) ---
Spawn: zone 5 only (Mythical (core)). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1. UNIQUE BOSS: at most one alive, centre only, mythical drops.
Movement: ground; speed 430u/s; turn 3.6; melee, no keep distance; muzzle 3 body-size units.
Hull by tier:
  T0: 2,607 HP total; core 30; largest part 30; 217 parts; radius 294u; no energy shield.
  T1: 11,669 HP total; core 120; largest part 122; 244 parts; radius 517u; no energy shield.
  T2: 58,984 HP total; core 540; largest part 547; 278 parts; radius 908u; no energy shield.
  T3: 459,016 HP total; core 2,400; largest part 2,432; 414 parts; radius 1,589u; 1 shield generator (239-239u bubbles; energy/shock/thermal pass).
  T4: 2,274,804 HP total; core 10,800; largest part 12,672; 454 parts; radius 2,773u; 1 shield generator (394-394u bubbles; energy/shock/thermal pass).
  T5: 10,913,440 HP total; core 48,000; largest part 56,320; 491 parts; radius 4,827u; 1 shield generator (651-651u bubbles; energy/shock/thermal pass).
Defence: serpentine body (no hull shells); energy shields appear at tier 3+; hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.4x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4):
  - Tail Sweep [swing], from T1, 4s cooldown: 4.5x eDmg damage (17,496 at T5); 0.8s wind-up; range 0-5 body-size units; tail swing; requires intact Tail Barb.
  - Venom Ring [nova], from T2, 9s cooldown: 0.9x eDmg damage (3,499 at T5); 0.9s wind-up; 24 projectiles at T5 (20 + 2/tier); 460 u/s; 1.8s life; size 9; poison 0.3x eDmg; range 0-900u; bolt projectile.
  - Serpent Rush [charge], from T3, 10s cooldown: 4x eDmg damage (15,552 at T5); 1s wind-up; 760 u/s; 0.9s duration; range 400-1,400u.
  - Venom Glob [spit], from T4, 7s cooldown: 1.4x eDmg damage (5,443 at T5); 0.6s wind-up; 520 u/s; size 3; range 0-1,000u.

============================================================
5. WEAPON COMPENDIUM (19 CRAFTED WEAPONS)
============================================================

All weapon numbers are at 100% efficiency with base cannon damage st.dmg = 10. "Per trigger" is the sum of every projectile fired by one trigger, assuming every projectile hits the same part; beams list damage per part hit, and AoE weapons list their full blast. Real DPS is lower against moving targets and higher when a blast or beam hits multiple parts.

--- Pulse Turret (pulse) ---
Type: energy. Per projectile: 0.6x st.dmg. Per trigger/beam-part: 0.6x st.dmg. Cooldown 0.45s at eff 1.00 (0.57s at eff 0.30). Nominal DPS 13.3 at st.dmg 10 / eff 1.00 (0.6x st.dmg per second). Range 560u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 1, exactly 3 components. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Auto-targeting turret. Fires at the nearest enemy piece on its own. Auto-targets the nearest enemy within 560u; one projectile.

--- Scatter Driver (scatter) ---
Type: kinetic. Per projectile: 0.55x st.dmg. Per trigger/beam-part: 3.3x st.dmg. Cooldown 0.75s at eff 1.00 (0.949s at eff 0.30). Nominal DPS 44 at st.dmg 10 / eff 1.00 (3.3x st.dmg per second). Range 420u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 2, exactly 4 components; 1x Limb/Plate. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Short-range shotgun burst on your fire button. Six pellets per trigger, each 0.55x st.dmg, random spread up to 0.42 rad; short 420u range.

--- Seeker Pod (missile) ---
Type: explosive. Per projectile: 2.2x st.dmg. Per trigger/beam-part: 4.4x st.dmg. Cooldown 1.5s at eff 1.00 (1.899s at eff 0.30). Nominal DPS 29.3 at st.dmg 10 / eff 1.00 (4.4x st.dmg per second). Range 850u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 3, exactly 5 components; 1x Weapon/Shield. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Launches homing missiles with splash damage. Two homing missiles per trigger, each 2.2x st.dmg; 74u splash for 35% of the hit.

--- Arc Lance (lance) ---
Type: energy. Per projectile: 0.22x st.dmg. Per trigger/beam-part: 0.22x st.dmg. Cooldown 0.12s at eff 1.00 (0.152s at eff 0.30). Nominal DPS 18.3 at st.dmg 10 / eff 1.00 (0.22x st.dmg per second). Range 330u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 4, exactly 6 components; 1x Core. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Piercing beam. Strong against soft targets, stopped dead by armour plating. Continuous beam: 0.22x st.dmg per part hit, 2 + floor(eff) pierce, 8u step. Hull shells stop it completely.

--- Homing Missile Launcher (homing) ---
Type: explosive. Per projectile: 3.1x st.dmg. Per trigger/beam-part: 3.1x st.dmg. Cooldown 1.7s at eff 1.00 (2.152s at eff 0.30). Nominal DPS 18.2 at st.dmg 10 / eff 1.00 (3.1x st.dmg per second). Range 900u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 3, exactly 5 components; 1x Weapon + 1x Bombardier Beetle / Yellowjacket part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Right-click any enemy piece to mark it. Missiles fly straight through everything else to that exact spot. Requires right-click lock on one exact part; flies through everything else, then deals 3.1x st.dmg + 35% splash in 74u.

--- Shield-Bypass Laser (bypass) ---
Type: energy. Per projectile: 0.16x st.dmg. Per trigger/beam-part: 0.16x st.dmg. Cooldown 0.1s at eff 1.00 (0.127s at eff 0.30). Nominal DPS 16 at st.dmg 10 / eff 1.00 (0.16x st.dmg per second). Range 700u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 5, exactly 7 components; 1x Core/Weapon + 1x Jewel Beetle / Firefly part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Auto-firing beam that ignores shield generators but cannot cut through armour plating. Beam ignores enemy energy-shield bubbles and hits 3 parts; 0.16x st.dmg per part. Hull shells still block it.

--- Heavy Machine Gun (hmg) ---
Type: kinetic. Per projectile: 0.1x st.dmg. Per trigger/beam-part: 0.1x st.dmg. Cooldown 0.075s at eff 1.00 (0.095s at eff 0.30). Nominal DPS 13.3 at st.dmg 10 / eff 1.00 (0.1x st.dmg per second). Range 650u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 2, exactly 4 components; 1x Weapon/Limb. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Very high rate of fire, wide spray, weak per hit. Good for stripping light enemies. One tracer per trigger, 0.10x st.dmg, 0.13 rad random spray; no pierce.

--- EMP Cannon (emp) ---
Type: shock. Per projectile: 1.4x st.dmg. Per trigger/beam-part: 1.4x st.dmg. Cooldown 2.6s at eff 1.00 (3.291s at eff 0.30). Nominal DPS 5.4 at st.dmg 10 / eff 1.00 (1.4x st.dmg per second). Range 560u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 4, exactly 6 components; 1x Core/Shield + 1x Cicada / Firefly part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Pulse that stuns every enemy within a wide radius. 620u radius EMP: 1.4x st.dmg to every enemy and 1.8s stun; ignores shield bubbles but not hull shells.

--- Plasma Cutter (cutter) ---
Type: thermal. Per projectile: 1.1x st.dmg. Per trigger/beam-part: 1.1x st.dmg. Cooldown 0.18s at eff 1.00 (0.228s at eff 0.30). Nominal DPS 61.1 at st.dmg 10 / eff 1.00 (1.1x st.dmg per second). Range 190u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 3, exactly 5 components; 1x Plate/Weapon. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Short, searing plasma arc that shreds plates at point-blank range. Short beam: 1.1x st.dmg per part, 1 + floor(eff) pierce, 175-195u length.

--- Acid Sprayer (acid) ---
Type: corrosive. Per projectile: 0.3x st.dmg. Per trigger/beam-part: 0.9x st.dmg. Cooldown 0.16s at eff 1.00 (0.203s at eff 0.30). Nominal DPS 56.3 at st.dmg 10 / eff 1.00 (0.9x st.dmg per second). Range 400u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 3, exactly 5 components; 1x Body/Limb + 1x Soldier Ant / Worker Ant / Bombardier Beetle part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Cone of corrosive globs. Melts armour so every following hit lands harder. Three globs per trigger, each 0.3x st.dmg; each hit adds 0.32 melt and 1.6x eff damage-over-time. Stopped dead by enemy energy shields.

--- Chain Lightning (chain) ---
Type: shock. Per projectile: 1.6x st.dmg. Per trigger/beam-part: 1.6x st.dmg. Cooldown 0.8s at eff 1.00 (1.013s at eff 0.30). Nominal DPS 20 at st.dmg 10 / eff 1.00 (1.6x st.dmg per second). Range 780u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 4, exactly 6 components; 1x Core/Wing + 1x Firefly / Jewel Beetle part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Arcs between up to five nearby pieces, losing power with every jump. Up to 5 jumps within 520u; first hit 1.6x st.dmg, then 75% per jump. Skips enemies with hull shells.

--- Flak Cannon (flak) ---
Type: explosive. Per projectile: 1.3x st.dmg. Per trigger/beam-part: 2x st.dmg. Cooldown 0.9s at eff 1.00 (1.139s at eff 0.30). Nominal DPS 22.2 at st.dmg 10 / eff 1.00 (2x st.dmg per second). Range 800u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 3, exactly 5 components; 1x Plate/Body. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Lobs airburst shells that detonate near the target point. Airburst shell: 1.3x st.dmg on impact plus 0.7x in a 125u blast; explodes at the target point.

--- Rail Sniper (rail) ---
Type: kinetic. Per projectile: 2.4x st.dmg. Per trigger/beam-part: 2.4x st.dmg. Cooldown 1.82s at eff 1.00 (2.304s at eff 0.30). Nominal DPS 13.2 at st.dmg 10 / eff 1.00 (2.4x st.dmg per second). Range 1150u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 5, exactly 7 components; 1x Core/Weapon + 1x Tiger Beetle / Assassin Bug part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Hypervelocity slug that pierces the enemy line — but not plating. 1500u hitscan beam: 2.4x st.dmg per part, 12 pierce; stopped by enemy energy shields and by hull shells.

--- Gravity Bomb (gravity) ---
Type: shock. Per projectile: 2.8x st.dmg. Per trigger/beam-part: 2.8x st.dmg. Cooldown 3.2s at eff 1.00 (4.051s at eff 0.30). Nominal DPS 8.8 at st.dmg 10 / eff 1.00 (2.8x st.dmg per second). Range 800u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 5, exactly 7 components; 1x Core/Body + 1x Dung Beetle / Atlas Moth part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Collapses a gravity well that drags enemies in, then implodes. Drops a 230u gravity well for 1.15s, pulling enemies in, then 2.8x st.dmg in 270u.

--- Mine Layer (mines) ---
Type: explosive. Per projectile: 2.5x st.dmg. Per trigger/beam-part: 2.5x st.dmg. Cooldown 1.1s at eff 1.00 (1.392s at eff 0.30). Nominal DPS 22.7 at st.dmg 10 / eff 1.00 (2.5x st.dmg per second). Range 800u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 2, exactly 4 components; 1x Plate/Weapon + 1x Weevil / Scarab part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Drops proximity mines behind you that shred anything that follows. Drops a 150u proximity mine behind the ship; 0.7s arm time, 26s life, 2.5x st.dmg blast.

--- Swarm Drones (drones) ---
Type: kinetic. Per projectile: 0.4x st.dmg. Per trigger/beam-part: 0.8x st.dmg. Cooldown 0.55s at eff 1.00 (0.696s at eff 0.30). Nominal DPS 14.5 at st.dmg 10 / eff 1.00 (0.8x st.dmg per second). Range 720u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 4, exactly 6 components; 1x Wing/Core + 1x Honeybee / Yellowjacket / Hornet part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Deploys two orbiting drones that fire at nearby enemies. Deploys two orbiting drones; each fires a 0.4x st.dmg kinetic round every 0.55s at 720u.

--- Venom Injector (venom) ---
Type: corrosive. Per projectile: 0.45x st.dmg. Per trigger/beam-part: 0.9x st.dmg. Cooldown 0.35s at eff 1.00 (0.443s at eff 0.30). Nominal DPS 25.7 at st.dmg 10 / eff 1.00 (0.9x st.dmg per second). Range 560u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 3, exactly 5 components; 1x Limb/Weapon + 1x Assassin Bug / Wasp / Mosquito part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Fast darts that inject a stacking venom that eats enemies from inside. Two darts per trigger, each 0.45x st.dmg and 3.2x eff stacking venom damage-over-time.

--- Sonic Disruptor (sonic) ---
Type: shock. Per projectile: 0.6x st.dmg. Per trigger/beam-part: 0.6x st.dmg. Cooldown 1.6s at eff 1.00 (2.025s at eff 0.30). Nominal DPS 3.8 at st.dmg 10 / eff 1.00 (0.6x st.dmg per second). Range 470u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 4, exactly 6 components; 1x Wing/Core + 1x Cicada / Katydid / Locust part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Cone of concussive sound that stuns and shoves everything in front of you. Cone ±0.8 rad, 540u: 0.6x st.dmg to every part and 1.5s stun; enemies with hull shells are skipped.

--- Cluster Rockets (cluster) ---
Type: explosive. Per projectile: 1.7x st.dmg. Per trigger/beam-part: 4.76x st.dmg. Cooldown 2.2s at eff 1.00 (2.785s at eff 0.30). Nominal DPS 21.6 at st.dmg 10 / eff 1.00 (4.76x st.dmg per second). Range 950u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 5, exactly 7 components; 1x Weapon/Shield + 1x Bombardier Beetle / Rhinoceros Beetle part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Rockets that burst into a shower of bomblets on impact. Rocket deals 1.7x st.dmg, then splits into 4 bomblets at 0.45x the rocket damage each (0.765x st.dmg per bomblet).

============================================================
6. SHIELDS (PLAYER)
============================================================

All shields have base regen 0.18/s and 4s recharge delay unless overridden. shieldMax bonuses are percentages of current hull. eff is crafted efficiency.

Deflector Array (deflector): +45% hull shield; 0.18/s regen; 4s delay. Blocks: energy, thermal. Craft: difficulty 1, 3 components.
Absorber Core (absorber): +22% hull shield; 0.50/s regen; 1.6s delay. Blocks: energy, thermal. Craft: difficulty 2, 4 components; 1x Plate.
Mirror Barrier (reflector): +32% hull shield; reflects enemy bolts/orbs/waves, spending 50% of the projectile damage from shield. Blocks: energy, thermal, kinetic. Craft: difficulty 3, 5 components; 1x Shield/Core/Wing.
Kinetic Barrier (kinetic): +38% hull shield; all incoming damage x(1 - clamp(0.30 x eff, 0.10, 0.60)) while shield holds. Blocks: energy, thermal, kinetic, explosive. Craft: difficulty 2, 4 components; 1x Plate/Body.
Phase Shield (phase): +25% hull shield; dodge = clamp(0.12 x eff, 0, 0.50). Blocks: energy, thermal, kinetic. Craft: difficulty 4, 6 components; 1x Wing/Core + 1x Cicada / Atlas Moth part.
Regenerating Ward (ward): +30% hull shield; 0.90/s regen; 1.2s delay. Blocks: energy, thermal, kinetic. Craft: difficulty 3, 5 components; 1x Body + 1x Ladybug / Firefly part.
Reactive Shell (shell): +20% hull shield; when shield breaks, 300u blast for 4 x st.dmg x eff. Blocks: energy, thermal, kinetic. Craft: difficulty 4, 6 components; 1x Plate/Shield + 1x Rhinoceros Beetle / Cockroach part.
Overcharge Shield (overcharge): +70% hull shield; 0.07/s regen; 8s delay. Blocks: energy, thermal, kinetic. Craft: difficulty 5, 7 components; 1x Core/Shield + 1x Jewel Beetle / Firefly part.
Null Field (nullfield): +35% hull shield; 35% + 30% x eff chance to swallow a projectile, costing 20% of its damage from shield; 1.4/(0.5+eff)s cooldown. Blocks: energy, thermal, kinetic. Craft: difficulty 5, 7 components; 1x Core/Wing + 1x Moth / Atlas Moth part.
Prismatic Barrier (prismatic): +40% hull shield; reflects bolts; dodge +clamp(0.05 x eff, 0, 0.30). Blocks: energy, thermal, kinetic, explosive. Craft: difficulty 5, 7 components; 1x Wing/Shield/Core + 1x Jewel Beetle part.

============================================================
7. ARMOUR
============================================================

Hull Plating Kit (plating): +35% x eff hull. Blocks: kinetic, physical. Craft: difficulty 1, 3 components; 1x Plate/Body.
Reactive Lattice (reactive): damage reduction clamp(0.12 x eff, 0, 0.60). Blocks: kinetic, physical. Craft: difficulty 3, 5 components; 2x Plate.
Thorn Mesh (thorn): +10% x eff hull; when hit, 260u blast for 3 x st.dmg x eff every 1.5s. Blocks: kinetic, physical. Craft: difficulty 2, 4 components; 1x Limb.
Chitin Plating (chitin): +25% x eff hull; +0.02 x eff flat armour. Blocks: kinetic, physical, corrosive. Craft: difficulty 2, 4 components; 1x Plate + 1x Cockroach / Worker Ant part.
Carapace Shell (carapace): +55% x eff hull; thrust x(1 - clamp(0.06 x eff, 0, 0.35)). Blocks: kinetic, physical, corrosive. Craft: difficulty 3, 5 components; 1x Plate/Body + 1x Rhinoceros Beetle / Dung Beetle / Scarab part.
Nano-weave Mesh (nanoweave): +12% x eff hull; +0.004 x eff hull regen/s. Blocks: kinetic, physical, explosive. Craft: difficulty 4, 6 components; 1x Wing/Body + 1x Atlas Moth / Widow Spider part.
Ablative Coating (ablative): additional damage reduction clamp(0.08 x eff, 0, 0.50). Blocks: kinetic, physical, explosive. Craft: difficulty 3, 5 components; 1x Plate/Shield + 1x Cockroach / Weevil part.
Titan Frame (titan): +90% x eff hull; thrust x(1 - clamp(0.12 x eff, 0, 0.50)). Blocks: kinetic, physical, corrosive. Craft: difficulty 5, 7 components; 2x Body/Plate + 1x Dung Beetle / Snake part.
Exoskeleton Rig (exoskeleton): thrust +12% x eff; acceleration +10% x eff. Blocks: kinetic, physical. Craft: difficulty 3, 5 components; 2x Limb + 1x Grasshopper / Tiger Beetle / Mole Cricket part.
Venom Guard (venomguard): poison resistance clamp(0.20 x eff, 0, 0.90); +8% x eff hull. Blocks: kinetic, physical. Craft: difficulty 4, 6 components; 1x Plate/Limb + 1x Assassin Bug / Yellowjacket / Centipede part.
Scale Mail (scalemail): +0.03 x eff armour; +18% x eff hull. Blocks: kinetic, physical, explosive. Craft: difficulty 4, 6 components; 1x Plate/Wing + 1x Snake / Jewel Beetle / Ladybug part.

============================================================
8. OPTICS, UTILITY AND ACTIVE ABILITIES
============================================================

Wide-Field Optics (lens): minimum zoom = clamp(1 / (1 + 1.96 x eff), 0.056, 1). At eff 1.00 that is 0.34x zoom; at eff 0.30, 0.63x. Craft: difficulty 2, 4 components; 1x Wing/Core.
Recall Beacon (recall): channel time = clamp(6 / (0.6 + 0.5 x eff), 2, 6)s; cooldown = clamp(100 / (0.5 + 0.5 x eff), 20, 100)s. Craft: difficulty 4, 6 components; 1x Core.
Component Magnet (magnet): passive pickup radius 420 + 320 x eff (also extends credit-mote pull). Craft: difficulty 3, 5 components; 1x Core/Body + 1x Worker Ant / Honeybee part.

EMP Burst (ab_emp): 14s base cooldown. 760u radius: stun for 2.6 x (0.7 + 0.30 x eff)s and deal 1.5x st.dmg x eff to the enemy core (or first part). Enemies with hull shells take no damage but are still stunned. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 3, 5 components; 1x Core/Shield + 1x Cicada / Firefly part.
Missile Salvo (ab_salvo): 12s base cooldown. Fires 10 homing missiles in a ring at up to 6 targets within 1,200u; each missile deals 1.8x st.dmg x eff, 3.4s life. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 4, 6 components; 1x Weapon.
Nano Repair Field (ab_repair): 22s base cooldown. Restores 35% x min(1.6, eff) of max hull and 60% of max shield. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 3, 5 components; 1x Body/Core + 1x Worker Ant / Carpenter Ant part.
Phase Blink (ab_blink): 9s base cooldown. Teleports 520u forward, interrupting pulls and leaving a particle burst. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 4, 6 components; 1x Wing/Core + 1x Cicada / Katydid / Mantis part.
Aegis Barrier (ab_barrier): 18s base cooldown. 2.5s overshield = hull x (0.35 + 0.30 x eff), absorbs damage before shield and hull. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 3, 5 components; 1x Shield.
Overdrive (ab_overdrive): 26s base cooldown. 6s of 2.2x weapon damage and 1.8x fire rate. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 5, 7 components; 1x Core/Weapon + 1x Tiger Beetle / Hornet part.
Time Warp (ab_timewarp): 24s base cooldown. 4s slow on every enemy within 900u to max(0.10, 0.25 - 0.05 x eff) speed. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 5, 7 components; 1x Core/Wing + 1x Atlas Moth / Luna Moth part.
Shockwave (ab_shockwave): 16s base cooldown. 520u blast: 5x st.dmg x eff, 900u/s knockback, 0.5s stun. Cooldown = base / (0.7 + 0.30 x eff). Craft: difficulty 4, 6 components; 1x Plate/Body + 1x Dung Beetle / Scarab part.

============================================================
9. BASE CANNON AND UPGRADES
============================================================

Base cannon: kinetic, st.dmg = 10 x 1.2^level per shot; 4 + 0.7 x level shots/s; 1 + barrels shots per trigger in a 0.09 rad fan; 760u range; 900u/s projectile speed; no innate pierce, splash or core/plate bonus - only crafted weapon recipes add those, and Kinetic rounds are stopped dead by enemy energy shields, which take no damage. The cannon system is scheduled for a rework.

Upgrade | Max | Effect per level | Cost
Cannon Damage (dmg) | 30 | Raw damage per shot. 12 dmg at L1, 2.37K dmg at max | 20 x 1.45^level credits
Fire Rate (rate) | 12 | Shots per second. 4.7/s at L1, 12.4/s at max | 40 x 1.5^level credits
Extra Barrels (barrels) | 4 | Fire a fan of additional shots. 2 barrels at L1, 5 barrels at max | 150 x 2.6^level credits
Targeting Matrix (crit) | 10 | Chance for 2.5x critical hits. 9% crit at L1, 45% crit at max | 60 x 1.55^level credits
Hull Plating (hull) | 30 | Maximum hull integrity. 122 HP at L1, 39.0K HP at max | 25 x 1.5^level credits
Nano Repair (regen) | 10 | Hull regenerates every second. 0.5%/s at L1, 5.0%/s at max | 70 x 1.6^level credits
Reactive Armour (armor) | 14 | Flat percentage damage reduction. -3.5% dmg at L1, -49.0% dmg at max | 90 x 1.7^level credits
Energy Shield Core (shield) | 25 | A recharging shield layer. Level 1 unlocks it. 60 shield at L1, 22.4K shield at max | 120 x 1.55^level credits
Inertial Dampers (dampers) | 6 | Resist slows, snares and pulls from enemies. 12% resist at L1, 72% resist at max | 100 x 1.8^level credits
Thrusters (thrust) | 12 | Top speed. 490 u/s at L1, 930 u/s at max | 40 x 1.5^level credits
Handling Jets (handling) | 10 | Acceleration and agility. 1700 accel at L1, 3500 accel at max | 45 x 1.45^level credits
Afterburner (boost) | 8 | Hold SHIFT for a speed burst. Level 1 unlocks it. x1.7 burst at L1, x2.4 burst at max | 150 x 1.8^level credits
Launcher Bays (hcount) | 3 | Number of harpoons you can have out at once. 2 harpoons at L1, 4 harpoons at max | 100 x 3^level credits
Cable Tensile Strength (hstr) | 16 | Weight each harpoon can tow before it snaps. 7.1 load at L1, 1.37K load at max | 30 x 1.55^level credits
Launcher Range (hrange) | 10 | How far the harpoon flies. 440 u at L1, 980 u at max | 40 x 1.45^level credits
Cable Armouring (hhp) | 12 | Durability of the cable against enemy attacks. 54 HP at L1, 1.47K HP at max | 50 x 1.5^level credits
Winch Motor (hspeed) | 8 | Launch speed, reel speed and less towing drag. 1140 u/s at L1, 2120 u/s at max | 60 x 1.5^level credits
Salvage Contracts (value) | 20 | Credits received when selling components. x1.25 at L1, x6.00 at max | 50 x 1.5^level credits
Scavenger Drones (drops) | 10 | Chance for pieces to drop components. 34% drop at L1, 70% drop at max | 60 x 1.55^level credits
Rarity Scanner (luck) | 8 | Better rarity rolls on dropped components. +5% luck at L1, +40% luck at max | 100 x 1.7^level credits
Cargo Bay (cargo) | 8 | Storage capacity for components. 36 slots at L1, 120 slots at max | 80 x 1.7^level credits

Harpoon: up to 1 + Launcher Bays harpoons; cable load 5 x 1.42^level; range 380 + 60 x level; cable HP 40 x 1.35^level; launch/reel speed 1,000 + 140 x level; towing relief 6% x Winch Motor level.

============================================================
10. STATUS EFFECTS AND SPECIAL RULES
============================================================

Melt: acid adds 0.32 per hit, caps at 0.90; every later hit on that enemy deals x(1 + melt).
Poison/venom: damage-over-time, refreshed to 4s; Venom Guard reduces it by up to 90%.
Slow: enemy slow fields multiply speed; Inertial Dampers reduce both strength and duration.
Stun: enemy stops moving, turning and firing; EMP and Sonic apply it.
Swat: if the ship ends up inside an enemy body - flying over the plating and shields to shoot its soft middle - the body swats it away instantly, before the player can act: 2.2x contact damage and a 1,500 + 90 x tier u/s shove (about 1,770 u/s at legendary), a heavy screen shake, and a 1.4s cooldown per enemy. Stunned bodies cannot swat. The trigger radius is half the body radius, clamped to 45-260u, so it only fires when the ship is genuinely over the hull.
Turning: common, uncommon, rare and epic all use the species turn rate; legendary turns at 0.9x and mythical at 0.8x of it. Turn rate is multiplied by the share of healthy limbs, so half the legs mean half the turn rate and a body with no working legs cannot turn at all.
Legs cripple before they snap: a limb (one leg chain) that has lost 65% of its health, i.e. drops below 35%, stops pushing and steering and its walk cycle freezes - the leg is still attached and still shootable, it just does nothing. A leg at 50% health still works normally.
Enemy turrets: gun 900u/1.35s/0.4x contact dmg/560u/s; rotary gun 700u/0.16s/0.05x/720u/s with a 0.16 rad spray; scatter cannon 700u/2.6s, 7 pellets of 0.2x at 420u/s across 0.5 rad; heavy cannon 1200u/5.0s/1.8x as an instant hitscan line (no travel time, so it cannot be outrun) with a 260u/s recoil shove on the hull and a heavy screen shake when it connects; laser emitter 1000u/2.4s/1.0x at 1,500u/s and energy damage (kinetic shields do not reduce it). Turret mounts appear at epic+ (one pair per tier above rare).
Every body can turn up armed: species with no natural gun roll one with 12% + 6%/tier and species with no natural shield generator roll one with 10% + 5%/tier, so 30%/25% at epic and 42%/35% at mythical. Rolled guns draw from rotary, scatter, laser and heavy patterns, weighted toward heavier gear at high tiers.
Energy shields: a bubble has no charge to strip, so it never collapses, re-arms or regenerates. Destroying its Shield Generator part removes it.
Destroyed parts: each dead part can drop a component; weapons and shield generators detonate for 1.8x eDmg to the player (other parts 1.3x) and damage enemies in the blast.
Boss: the Snake is the only boss (217 parts, body wave, 294u radius at T0; no reflective shield). At most one is alive; it spawns in the mythical core and never counts as a normal resident. SNAKE_ENABLED is false in this build, so the dedicated core pass is dormant even though the encounter code exists.

End of compendium · build 2.1.2
