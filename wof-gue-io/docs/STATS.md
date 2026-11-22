# wof gue — complete stat compendium

Build 2.15.0 · generated 20 Nov 2026 · every figure is a live simulation constant, not a design target.

How to read it: enemy health is the sum of every part at that rarity tier. Enemy damage is listed as a multiplier of the tier damage (eDmg), because every bite, bolt, blast and contact hit scales from that one number. Weapon damage is a multiplier of the player cannon damage (st.dmg = 10 x 1.2^Cannon Damage level). Efficiency (eff) is the crafted item quality: 0.30 minimum, 1.00 typical; the raw formula can reach 2.25 on an unrestricted tier-5 core build and 1.80 on a 7-part difficulty-5 recipe.

============================================================
1. CORE FORMULAS
============================================================

Player cannon: every cannon is a chassis (`CANNONS` in data.ts) with its **own** upgrade tracks and its own levels. The tree lives in the base under the CANNON tab and is drawn as a tree: the free **Stinger** (20 damage, 0.7s interval, 640u/s, 820u reach, small charge on impact, Damage track only) is the root at the bottom and the three tier 1 guns — **Skewer MK1** (300 damage hitscan, 1.2s), **Peashooter MK1** (35 damage, 0.1s spray) and **Workhorse MK1** (55 damage, 0.55s, up to 300 when overheated) — hang off it, for 300-500 credits plus a bill of common parts. Crit is a Skewer track, the Workhorse's barrels stop at two (9,600 credits for the single level), one gun is bought per tier outside admin mode, and everything is per chassis: a new gun starts at zero and does not inherit the last one's work.
Crafted weapon: damage per hit = st.dmg x wpn.dmg x eff (then x2.2 during Overdrive; there are no critical hits). Cooldown = wpn.cd / (0.7 + 0.3 x eff), so 100% efficiency is the listed cooldown and 30% efficiency is 1.27x slower (cd / 0.79).
Enemy damage: eDmg = 16 x DMG_MUL[tier] = 16 / 48 / 144 / 432 / 1,296 / 3,888. Every ability, gun, missile and contact hit is a multiplier of that eDmg.
Enemy attachment damage: every weapon mount's damage is a **per-projectile** multiple of the body's own eDmg, per the sheet. Basic cannon (Gun Turret) **0.5x** — a very large, very slow round (r 14, 300 u/s). Scatter shotgun (Scatter Cannon) **1.2x** — seven large pellets at 420 u/s. Rotary gun (Minigun) **0.2x** — fast, small rounds (720 u/s) that cool down for 10s after a 10s burst. Laser (Laser Emitter) **1.0x** — a held tracking beam dealing damage per tick, ramping from 0.35x to 1.0x over 3s of unbroken contact. Heavy rail (Heavy Rail Cannon) **17x** — hitscan, with a reach equal to the body's own aggro range rather than a fixed number. The energy-shield shock stays at **25x** an unshielded contact.
Enemy hull: every part HP is generated from HP_MUL[tier] = 1 / 4 / 18 / 80 / 360 / 1,600, with part size and shape adding their own multipliers. Armour is re-priced once the body is built: each plate is `ARMOUR_HP_MUL[tier]` x the average HP of the body's other pieces — 2.5x common, 3.25x uncommon, then the sheet's 4x rare, 5.5x epic, 7x legendary, 9x mythical. Eyes sit at 0.9x a plate and Core Guard layers at 1.6x/2.2x. The tables below give the resulting totals.
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

Enemy energy-shield panels: each Shield Generator part projects one wall just outside the torso armour plates - a curved arc for flyers and serpents, a straight bar for walkers, some species sweeping them at 0.4-0.7 rad/s. A panel covers only a slice of the ring (2 generators at epic, 3 at legendary, 4 at mythical), so a shot through a gap reaches the hull normally. Energy, shock and thermal projectiles and beams pass straight through and hit the body inside. Every other projectile is stopped dead at the panel with no effect on it or the hull: a panel has no charge to strip, so it never collapses, re-arms or regenerates, and only disappears when its Shield Generator part is destroyed. The Shield-Bypass Laser still ignores panels; the Rail Sniper no longer does, and hull shells still stop the rail. Direct area effects (EMP, chain lightning, sonic, gravity, mines, explosions, collisions) do not run the panel check.
Enemy hull shells (plating): tier 2+ enemies get tier-1 solid armour layers, each holding 60% of the enemy total hull, bolted over the body as steel slabs. A hit is swallowed by the outermost layer and only a share of it is lost: bullets 30%, missile/flak rounds 40%, beams 80% (plating resists only 20% of energy), area blasts 40%, shockwaves 15% (EMP, chain lightning and sonic skip shelled enemies entirely). Legendary legs carry 1 plating layer of their own and mythical legs 2, so shots that land on a plated limb are swallowed by the hull slabs instead of the leg. A layer shatters into a damaging shockwave when destroyed. Tier 5 mythical: 4 layers of 60% hull each, e.g. 943,872 HP per layer (3.8M total) on a 1,573,120 hull.
Player defence labels: the Blocks column comes from damageProfile, which the crafting UI displays. Actual player mitigation is type-agnostic: armour reduces every incoming hit, then shield absorbs the remainder, then hull takes the rest. Kinetic Barrier adds another multiplier while shield holds; dodge is checked before all of it.

============================================================
4. ENEMY COMPENDIUM (32 SPECIES)
============================================================

Every species block lists spawn band, movement, total hull by tier, shell/shield defence, mounts and abilities. Ability availability is gated by index as well as minTier: tier T can only use the first min(T, n) ability entries where n is the species' ability count, so the "from Tn" value is exact. Ability cooldowns scale down with rarity: 17s (T0), 12s (T1), 8s (T2), 3s (T3), 1.75s (T4), 1s (T5).

--- 1. Dragonfly (dragonfly) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 210u/s; turn 3.4; ranged, keeps 330u; muzzle 2.2 body-size units.
Hull by tier:
  T0: 310 HP total; core 30; largest part 30; 30 parts; radius 101u; no energy shield.
  T1: 1,405 HP total; core 120; largest part 120; 33 parts; radius 167u; no energy shield.
  T2: 9,792 HP total; core 540; largest part 540; 44 parts; radius 276u; no energy shield; 1 hull shell (5,875 HP).
  T3: 64,576 HP total; core 2,400; largest part 2,400; 64 parts; radius 455u; 2 panels (curved arcs, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (77,492 HP).
  T4: 337,968 HP total; core 10,800; largest part 12,672; 70 parts; radius 751u; 3 panels (curved arcs, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (608,343 HP).
  T5: 1,656,320 HP total; core 48,000; largest part 56,320; 75 parts; radius 1,239u; 4 panels (curved arcs, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (3,975,168 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4): cooldowns scale down with rarity (T1 12s, T2 8s, T3 3s, T4 1.75s, T5 1s). Ranges scale with body size so they reach the kite's stand-off distance.
  - Dash [charge], from T1: 1x eDmg damage (3,888 at T5); 0.4s wind-up; 620 u/s; 0.4s duration; range 150-~1300u.
  - Spray [shoot], from T2: 5x eDmg damage (19,440 at T5); 0.5s wind-up; 9 projectiles at T5 (4 + 1/tier); 0.6 rad spread; 220 u/s; 3s life; size 11; range 0-~1300u; orb projectile.
  - Chomp [grab], from T3: 7x eDmg damage (27,216 at T5); 0.5s wind-up; 4 chomps at 0.8s each over a 3s hold; lunges in to close the gap; range 0-~1300u.
  - Shockwave [ring], from T4: 8x eDmg damage (31,104 at T5); 0.7s wind-up; 520 u/s; size 6; knocks the ship back 700 u/s; range 0-~1100u.

--- 2. Scorpion (scorpion) ---
Spawn: zones 0-3 (Common (outer) to Epic). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 115u/s; turn 2.4; melee, no keep distance; muzzle 2.6 body-size units.
Hull by tier:
  T0: 486 HP total; core 30; largest part 30; 41 parts; radius 108u; no energy shield.
  T1: 1,987 HP total; core 120; largest part 120; 42 parts; radius 178u; no energy shield.
  T2: 12,262 HP total; core 540; largest part 540; 56 parts; radius 294u; no energy shield; 1 hull shell (7,357 HP).
  T3: 89,920 HP total; core 2,400; largest part 2,400; 91 parts; radius 485u; 2 panels (straight bars, some sweeping, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (107,904 HP).
  T4: 498,960 HP total; core 10,800; largest part 12,672; 103 parts; radius 800u; no energy shield; 3 hull shells (898,128 HP).
  T5: 2,288,000 HP total; core 48,000; largest part 56,320; 105 parts; radius 1,321u; no energy shield; 4 hull shells (5,491,200 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (2): cooldowns scale down with rarity (T1 12s, T2 8s, T3 3s, T4 1.75s, T5 1s). Both lunge in to close the gap.
  - Pincer Grab [grab], from T1: 2x eDmg damage (7,776 at T5); 0.5s wind-up; chomps at 0.8s each over a 2s hold; range 0-3.5 body-size units.
  - Tail Sting [sting], from T3: 3.6x eDmg damage (13,997 at T5) + venom; 0.7s wind-up; the tail uncoils and the scorpion lunges in to sting (knockback 500), then recoils; poison 0.3x eDmg; range 0-3.5 body-size units.

--- 3. Widow Spider (spider) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 140u/s; turn 2.8; ranged, keeps 300u; muzzle 2.2 body-size units.
Hull by tier:
  T0: 406 HP total; core 30; largest part 30; 40 parts; radius 110u; no energy shield.
  T1: 1,644 HP total; core 120; largest part 120; 41 parts; radius 182u; no energy shield.
  T2: 9,947 HP total; core 540; largest part 540; 52 parts; radius 301u; no energy shield; 1 hull shell (5,968 HP).
  T3: 82,608 HP total; core 2,400; largest part 2,400; 94 parts; radius 496u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (99,130 HP).
  T4: 478,008 HP total; core 10,800; largest part 12,672; 107 parts; radius 818u; no energy shield; 3 hull shells (860,415 HP).
  T5: 2,194,880 HP total; core 48,000; largest part 56,320; 109 parts; radius 1,350u; no energy shield; 4 hull shells (5,267,712 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 2 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4): cooldowns scale down with rarity (T1 12s, T2 8s, T3 3s, T4 1.75s, T5 1s). Ranges scale with body size so they reach the kite's stand-off distance.
  - Web [shoot], from T1: 0.4x eDmg damage (1,555 at T5); 0.5s wind-up; 1 projectile; 380 u/s; 2s life; size 14; slow to 0.4x for 3s; poison 0.2x eDmg; range 120-~1300u; the web lands on the floor and expands into a spider-web zone the size of the spider (1.4x scale) that slows (0.5x) and poisons (0.2x eDmg/s) the ship while it lasts.
  - Web Volley [shoot], from T2: 0.3x eDmg damage (1,166 at T5); 0.5s wind-up; 3 projectiles; 0.2 rad spread; 680 u/s; 1.5s life; size 7; range 120-~1300u; each web is tethered to the spider by a silken string and, on hit, reels the ship back to the spider (1.4s pull).
  - Bite [grab], from T4: 1.67x eDmg damage (6,493 at T5); 0.4s wind-up; chomps at 1s each over a 3s hold; lunges in to close the gap; range 0-~1300u.
  - Pull [pull], from T4: 17x eDmg damage (66,096 at T5); 0.5s wind-up; 760 u/s; range 250-~1300u.

--- 4. Luna Moth (moth) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: flying; speed 130u/s; turn 2.6; ranged, keeps 380u; muzzle 1.4 body-size units.
Hull by tier:
  T0: 350 HP total; core 30; largest part 30; 34 parts; radius 71u; no energy shield.
  T1: 1,683 HP total; core 120; largest part 120; 38 parts; radius 116u; no energy shield.
  T2: 8,957 HP total; core 540; largest part 540; 45 parts; radius 192u; no energy shield; 1 hull shell (5,374 HP).
  T3: 72,832 HP total; core 2,400; largest part 2,400; 67 parts; radius 317u; 2 panels (curved arcs, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (87,398 HP).
  T4: 346,608 HP total; core 10,800; largest part 12,672; 69 parts; radius 523u; 3 panels (curved arcs, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (623,895 HP).
  T5: 1,582,080 HP total; core 48,000; largest part 56,320; 70 parts; radius 862u; 4 panels (curved arcs, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (3,796,992 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
Abilities (4): cooldowns scale down with rarity (T1 12s, T2 8s, T3 3s, T4 1.75s, T5 1s). Ranges scale with body size so they reach the kite's stand-off distance.
  - Shot Burst [shoot], from T1: 2x eDmg damage (7,776 at T5); 0.4s wind-up; 5 projectiles; 1.2 rad spread; 600 u/s; 1.2s life; size 5; range 0-~1000u; bolt projectile.
  - Rotating Lasers [beam], from T3: 1x eDmg per tick (3,888 at T5); 0.6s wind-up; 4 rotating lasers at 1.5 rad/s over a 4s duration; each beam is a long, thick laser (1100u reach, 16px glowing body with a hot white core and a muzzle node); range 0-~1000u.
  - Missiles [shoot], from T4: 3x eDmg damage (11,664 at T5); 0.6s wind-up; 20 homing missiles; 0.3 rad spread; 480 u/s; 3s life; size 9; homing 2.5 rad/s; range 0-~1300u; missile projectile (all enemy projectiles render ~5x larger).
  - Domain [domain], from T5: opens a three-minute moon domain; the moth heals to full and scales its damage and health from 3x to 10x by phase; the moon grinds the ship for 5% max hull/sec and feeds the moth 1% max health/sec; cannot be reused while open; range 0-~1500u.

--- 5. Mantis (mantis) ---
Spawn: zones 0-4 (Common (outer) to Legendary). Pack per tier: 1 / 1 / 1 / 1 / 1 / 1.
Movement: ground; speed 120u/s; turn 3; melee, no keep distance; muzzle 2 body-size units.
Hull by tier:
  T0: 428 HP total; core 30; largest part 30; 36 parts; radius 92u; no energy shield.
  T1: 1,710 HP total; core 120; largest part 120; 36 parts; radius 152u; no energy shield.
  T2: 9,022 HP total; core 540; largest part 540; 43 parts; radius 251u; no energy shield; 1 hull shell (5,413 HP).
  T3: 72,544 HP total; core 2,400; largest part 2,400; 73 parts; radius 414u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (87,052 HP).
  T4: 360,000 HP total; core 10,800; largest part 12,672; 77 parts; radius 683u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (648,000 HP).
  T5: 1,928,320 HP total; core 48,000; largest part 56,320; 86 parts; radius 1,127u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,627,968 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 228,448 HP total; core 2,400; largest part 2,400; 275 parts; radius 863u; 2 panels (curved arcs, 32% of the ring, 182u out); energy/shock/thermal pass.
  T4: 1,190,880 HP total; core 10,800; largest part 12,672; 316 parts; radius 1,505u; 3 panels (curved arcs, 48% of the ring, 301u out); energy/shock/thermal pass.
  T5: 5,793,920 HP total; core 48,000; largest part 56,320; 352 parts; radius 2,618u; no energy shield.
Defence: serpentine body (no hull shells); energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 73,528 HP total; core 2,400; largest part 2,400; 71 parts; radius 379u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (88,234 HP).
  T4: 416,268 HP total; core 10,800; largest part 12,672; 93 parts; radius 626u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (749,283 HP).
  T5: 2,390,880 HP total; core 48,000; largest part 56,320; 108 parts; radius 1,032u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (5,738,112 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 69,728 HP total; core 2,400; largest part 2,400; 72 parts; radius 410u; 2 panels (curved arcs, some sweeping, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (83,674 HP).
  T4: 351,648 HP total; core 10,800; largest part 12,672; 76 parts; radius 676u; 3 panels (curved arcs, some sweeping, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (632,967 HP).
  T5: 1,674,880 HP total; core 48,000; largest part 56,320; 79 parts; radius 1,115u; 4 panels (curved arcs, some sweeping, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,019,712 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T5: 1,881,760 HP total; core 48,000; largest part 56,320; 86 parts; radius 1,149u; 4 panels (curved arcs, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,516,224 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; T3 has 2 gun(s) / 0 pod(s). Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 90,464 HP total; core 2,400; largest part 2,400; 84 parts; radius 363u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (108,556 HP).
  T4: 486,720 HP total; core 10,800; largest part 12,672; 102 parts; radius 599u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (876,096 HP).
  T5: 2,275,200 HP total; core 48,000; largest part 56,320; 105 parts; radius 988u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (5,460,480 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T5: 1,221,440 HP total; core 48,000; largest part 56,320; 63 parts; radius 838u; 4 panels (curved arcs, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (2,931,456 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T4: 399,600 HP total; core 10,800; largest part 12,672; 84 parts; radius 596u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (719,280 HP).
  T5: 1,958,400 HP total; core 48,000; largest part 56,320; 89 parts; radius 984u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,700,160 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 77,424 HP total; core 2,400; largest part 2,400; 78 parts; radius 485u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (92,908 HP).
  T4: 492,840 HP total; core 10,800; largest part 12,672; 104 parts; radius 842u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (887,112 HP).
  T5: 2,302,400 HP total; core 48,000; largest part 56,320; 107 parts; radius 1,457u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (5,525,760 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T5: 1,909,920 HP total; core 48,000; largest part 56,320; 87 parts; radius 1,288u; 4 panels (curved arcs, some sweeping, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,583,808 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 75,616 HP total; core 2,400; largest part 2,400; 76 parts; radius 363u; 2 panels (curved arcs, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (90,740 HP).
  T4: 393,984 HP total; core 10,800; largest part 12,672; 82 parts; radius 599u; 3 panels (curved arcs, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (709,170 HP).
  T5: 1,863,040 HP total; core 48,000; largest part 56,320; 85 parts; radius 988u; 4 panels (curved arcs, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,471,296 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 77,472 HP total; core 2,400; largest part 2,400; 77 parts; radius 469u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (92,966 HP).
  T4: 412,416 HP total; core 10,800; largest part 12,672; 93 parts; radius 805u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (742,350 HP).
  T5: 1,944,960 HP total; core 48,000; largest part 56,320; 96 parts; radius 1,379u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,667,904 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 75,456 HP total; core 2,400; largest part 2,400; 75 parts; radius 445u; 2 panels (straight bars, some sweeping, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (90,548 HP).
  T4: 458,064 HP total; core 10,800; largest part 12,672; 89 parts; radius 735u; 3 panels (straight bars, some sweeping, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (824,514 HP).
  T5: 2,147,840 HP total; core 48,000; largest part 56,320; 92 parts; radius 1,212u; 4 panels (straight bars, some sweeping, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (5,154,816 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; T3 has 2 gun(s) / 0 pod(s). Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 65,664 HP total; core 2,400; largest part 2,400; 69 parts; radius 420u; 2 panels (curved arcs, some sweeping, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (78,796 HP).
  T4: 317,520 HP total; core 10,800; largest part 12,672; 71 parts; radius 694u; 3 panels (curved arcs, some sweeping, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (571,536 HP).
  T5: 1,452,800 HP total; core 48,000; largest part 56,320; 72 parts; radius 1,145u; 4 panels (curved arcs, some sweeping, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (3,486,720 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T4: 354,096 HP total; core 10,800; largest part 12,672; 77 parts; radius 588u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (637,374 HP).
  T5: 1,615,360 HP total; core 48,000; largest part 56,320; 78 parts; radius 969u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (3,876,864 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; T3 has 2 gun(s) / 0 pod(s). Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 72,544 HP total; core 2,400; largest part 2,400; 74 parts; radius 369u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (87,052 HP).
  T4: 390,240 HP total; core 10,800; largest part 12,672; 90 parts; radius 609u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (702,432 HP).
  T5: 1,846,400 HP total; core 48,000; largest part 56,320; 93 parts; radius 1,004u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,431,360 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 60,288 HP total; core 2,400; largest part 2,400; 61 parts; radius 549u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (72,346 HP).
  T4: 293,328 HP total; core 10,800; largest part 12,672; 63 parts; radius 905u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (527,991 HP).
  T5: 1,345,280 HP total; core 48,000; largest part 56,320; 64 parts; radius 1,494u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (3,228,672 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 82,464 HP total; core 2,400; largest part 2,400; 89 parts; radius 420u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (98,956 HP).
  T4: 489,600 HP total; core 10,800; largest part 12,672; 103 parts; radius 693u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (881,280 HP).
  T5: 2,288,000 HP total; core 48,000; largest part 56,320; 106 parts; radius 1,144u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (5,491,200 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 55,872 HP total; core 2,400; largest part 2,400; 63 parts; radius 616u; 2 panels (curved arcs, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (67,046 HP).
  T4: 305,136 HP total; core 10,800; largest part 12,672; 69 parts; radius 1,016u; 3 panels (curved arcs, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (549,246 HP).
  T5: 1,468,160 HP total; core 48,000; largest part 56,320; 72 parts; radius 1,677u; 4 panels (curved arcs, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (3,523,584 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 6 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 75,136 HP total; core 2,400; largest part 2,400; 76 parts; radius 434u; 2 panels (straight bars, 55% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (90,164 HP).
  T4: 375,984 HP total; core 10,800; largest part 12,672; 80 parts; radius 716u; 3 panels (straight bars, 82% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (676,770 HP).
  T5: 1,783,040 HP total; core 48,000; largest part 56,320; 83 parts; radius 1,182u; 4 panels (straight bars, 110% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (4,279,296 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 80,496 HP total; core 2,400; largest part 2,400; 80 parts; radius 370u; 2 panels (curved arcs, some sweeping, 32% of the ring, 182u out); energy/shock/thermal pass; 2 hull shells (96,596 HP).
  T4: 496,584 HP total; core 10,800; largest part 12,672; 96 parts; radius 611u; 3 panels (curved arcs, some sweeping, 48% of the ring, 301u out); energy/shock/thermal pass; 3 hull shells (893,850 HP).
  T5: 2,389,440 HP total; core 48,000; largest part 56,320; 101 parts; radius 1,008u; 4 panels (curved arcs, some sweeping, 64% of the ring, 497u out); energy/shock/thermal pass; 4 hull shells (5,734,656 HP).
Defence: energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 4 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
  T3: 461,096 HP total; core 2,400; largest part 2,432; 415 parts; radius 1,589u; 2 panels (curved arcs, some sweeping, 32% of the ring, 182u out); energy/shock/thermal pass.
  T4: 2,293,524 HP total; core 10,800; largest part 12,672; 456 parts; radius 2,773u; 3 panels (curved arcs, some sweeping, 48% of the ring, 301u out); energy/shock/thermal pass.
  T5: 11,038,240 HP total; core 48,000; largest part 56,320; 494 parts; radius 4,827u; 4 panels (curved arcs, some sweeping, 64% of the ring, 497u out); energy/shock/thermal pass.
Defence: serpentine body (no hull shells); energy shield panels appear at tier 3+ (2 generators at epic, 3 at legendary, 4 at mythical, each covering only a slice of the ring); hull shells at tier 2+ (60% hull per layer, ~4x that in kinetic fire).
Damage: eDmg 16 / 48 / 144 / 432 / 1,296 / 3,888 by tier. Contact = 0.25x eDmg every 0.7s. Weapon mounts: 0 gun(s) (0.5x eDmg, 1.1-1.7s cadence) and 0 missile pod(s) (1.1x eDmg, 4.5-6s cadence) at T5; no gun or missile mounts at T3. Destroying a weapon part explodes for 1.8x eDmg to the player; other parts explode for 1.3x.
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
Behaviour: Auto-firing beam that ignores shield generators but cannot cut through armour plating. Beam ignores enemy energy-shield panels and hits 3 parts; 0.16x st.dmg per part. Hull shells still block it.

--- Heavy Machine Gun (hmg) ---
Type: kinetic. Per projectile: 0.1x st.dmg. Per trigger/beam-part: 0.1x st.dmg. Cooldown 0.075s at eff 1.00 (0.095s at eff 0.30). Nominal DPS 13.3 at st.dmg 10 / eff 1.00 (0.1x st.dmg per second). Range 650u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 2, exactly 4 components; 1x Weapon/Limb. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Very high rate of fire, wide spray, weak per hit. Good for stripping light enemies. One tracer per trigger, 0.10x st.dmg, 0.13 rad random spray; no pierce.

--- EMP Cannon (emp) ---
Type: shock. Per projectile: 1.4x st.dmg. Per trigger/beam-part: 1.4x st.dmg. Cooldown 2.6s at eff 1.00 (3.291s at eff 0.30). Nominal DPS 5.4 at st.dmg 10 / eff 1.00 (1.4x st.dmg per second). Range 560u (capped at 95% of the visible radius when zoomed in).
Craft: difficulty 4, exactly 6 components; 1x Core/Shield + 1x Cicada / Firefly part. Efficiency = max(0.30, (0.60 + 0.30 x average component tier [+0.5 if core]) x (1 - 0.05 x (difficulty - 1))).
Behaviour: Pulse that stuns every enemy within a wide radius. 620u radius EMP: 1.4x st.dmg to every enemy and 1.8s stun; ignores shield panels but not hull shells.

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
Component Magnet (magnet): passive pickup radius 420 + 320 x eff for loose components under mass 14 (those are also scooped up on touch, no magnet needed). Craft: difficulty 3, 5 components; 1x Core/Body + 1x Worker Ant / Honeybee part.

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

The tree is a diagram: the free **Stinger** is the root at the bottom, a trunk climbs to a bus and the three tier 1 chassis hang off it as nodes. A node is compact (silhouette, name, state) and opens into the full card on hover; once a tier is taken the rest of that row greys out (**one gun per tier**). Only one gun is fitted at a time; fitting another is free and every chassis keeps its own levels. Each chassis is drawn on the hull and in the tree icon from its `look` entry, with its own muzzle points, recoil kick and per-shot heat.

Chassis | Tier | Damage | Interval | Round | Upgrades | Bill
Stinger | 0 | 20 | 0.7s | 640u/s bolt, 820u reach, small charge (0.3x the round in a 44u radius) | Damage | free, fitted at the start
Skewer MK1 | 1 (needs Stinger) | 300 | 1.2s | hitscan line, 2400u, drawn as a hard white line | Crit Chance, Crit Damage, Penetration, Damage | 500 CR + 2x Common leg, 1x Common antenna, 1x Common head, 6x Common core
Peashooter MK1 | 1 (needs Stinger) | 35 | 0.1s | 430u/s seed, 720u reach, 12.6 deg base spread | Accuracy, Projectile Speed, Damage, Crit Chance, Crit Damage | 300 CR + 2x Common leg, 6x Common core
Workhorse MK1 | 1 (needs Stinger) | 55 (300 overheated) | 0.55s | 720u/s round, 900u reach, 1.7 deg base spread (x4 at full heat) | Damage, Fire Rate, Penetration, Barrels (2) | 500 CR + 2x Common leg, 1x Common head, 5x Common core

Feel per chassis: Stinger — one muzzle at 19u, barrel 20u long, kick 9 u/s, 5.5% heat per shot. Skewer — one muzzle at 37u, barrel 38u, kick 34, 34% heat. Peashooter — one muzzle at 16u, three spigots drawn, kick 3, 1.2% heat. Workhorse — two muzzles at 25u/±5.5u, kick 16, 8% heat; **every** trigger throws one round and the barrels alternate, always, with or without the Barrels track. Heat bleeds at 34%/s and recoil springs to 1 on the trigger and decays at 5.5/s, sliding the gun 30% of its length back into the mount.

Overheat (Workhorse only): `heatMax` scales the round with the gauge — 55 at cold, 300 at full — and `heatSpread` widens it x4, so a hot gun hits like a truck and sprays like a hose. A full gauge jams the trigger for **3s** (`Player.jam`, `CannonDef.overheat`), draining the gauge on the clock; the gun vents steam and the HUD bar turns red and counts down. Two barrels split the heat (`heatPerShot / barrels`), so the Barrels track doubles the time before a jam. No other chassis can jam.

Bills are common legs, common cores and the odd head or antenna, and never name a species: any insect's leg will do. A head is a body segment part called "Head" and an antenna is a spike part called "Antenna", so a plain body segment or a tail spike does not fill those lines. The tree consumes the cheapest matching parts in storage when you build, and admin mode's infinite components skips the bill (but not the 300 credits).

Kinetic rounds (every chassis) are stopped dead by enemy energy shields, which take no damage. Energy panels are also **solid**: the hull is lifted back onto the outside face every frame whether or not the shock is on cooldown, so a panel cannot be flown through at any speed. Contact still discharges 25x the body's damage (capped below a full hull) and throws the ship off.

Upgrade | Max | Effect per level | Cost
Damage (per chassis) | 30 | Damage per round, per cannon. 24 dmg at L1, 4.75K dmg at max | 20 x 1.45^level x chassis cost multiplier
Fire Rate (Workhorse) | 20 | Interval x0.94 per level: 0.55s at L0, 0.16s at max | 45 x 1.5^level x 1.6
Crit Chance (Skewer) | 15 | +5% chance of a critical round per level (75% at max) | 120 x 1.55^level x 2.4
Crit Damage (Skewer) | 15 | Critical multiplier x2.00 at L0, +0.25 per level (x5.75 at max) | 90 x 1.5^level x 2.4
Penetration (Skewer, Workhorse) | 8 | Rounds pass through 1 more piece per level (80% damage after each) | 260 x 1.65^level x chassis cost multiplier
Accuracy (Peashooter) | 15 | Spread x0.9 per level: 12.6 deg at L0, 2.6 deg at max | 40 x 1.45^level
Projectile Speed (Peashooter) | 12 | Round speed x1.08 per level: 430 u/s at L0, 1,083 u/s at max | 55 x 1.45^level
Barrels (Workhorse) | 1 | A second barrel: rounds alternate between the two, so each fires at half the rate and the gun heats half as fast. Never more than two barrels | 6,000 x 1.6 = 9,600 credits for the single level
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
Scavenger Drones (drops) | 10 | Multiplier for pieces dropping components. x1.25 drop at L1, x3.50 drop at max | 60 x 1.55^level credits
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
Energy shields: a panel has no charge to strip, so it never collapses, re-arms or regenerates. Destroying its Shield Generator part removes it.
Destroyed parts: each dead part can drop a component; weapons and shield generators detonate for 1.8x eDmg to the player (other parts 1.3x) and damage enemies in the blast. The drop roll uses one kind table — core 90%, segment 35%, armor 30%, leg 25%, arm 35%, wing 25%, weapon 50%, shield 50%, spike 12% — scaled by the salvage stat's multiplier.
Boss: the Snake is the only boss (217 parts, body wave, 294u radius at T0; no reflective shield). At most one is alive; it spawns in the mythical core and never counts as a normal resident. SNAKE_ENABLED is false in this build, so the dedicated core pass is dormant even though the encounter code exists.

End of compendium · build 2.15.0
