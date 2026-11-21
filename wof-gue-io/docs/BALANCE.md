# Balance sheet → code

Snapshot of the design sheet the numbers in `src/game/` now come from. The sheet itself lives in
Google Docs and is the owner's; this file only records what was applied and where.

## Piece health by rarity (`src/game/data.ts` → `HP_MUL`)

| rarity    | multiplier | cumulative |
| --------- | ---------- | ---------- |
| common    | x1         | x1         |
| uncommon  | x3.75      | x3.75      |
| rare      | x4         | x15        |
| epic      | x4.7       | x70.5      |
| legendary | x6         | x423       |
| mythical  | x8.1       | x3426.3    |

## Piece health by species (`src/game/enemies.ts` → `SpeciesDef.hp`)

The species number is one **normal (body) piece** at common rarity:

Dragonfly 19 · Scorpion 25 · Widow Spider 19 · Luna Moth 20 · Mantis 31 · Centipede 20 · Hornet 20 ·
Scarab 36 · Soldier Ant 27 (sheet lists worker ant only) · Firefly 24 · Worker Ant 27 · Honeybee 25 ·
Grasshopper 27 · Cockroach 27 · Mosquito 20 · Bombardier Beetle 37 · Rhinoceros Beetle 40 ·
Yellowjacket 25 · Ladybug 25 · Stag Beetle 37 · Carpenter Ant 28 · Cicada 25 · Assassin Bug 23 ·
Tiger Beetle 34 · Mole Cricket 25 · Katydid 25 · Dung Beetle 35 · Atlas Moth 30 · Weevil 25 ·
Locust 16 · Jewel Beetle 40 · Snake (boss) 80

Kinds compared to that normal piece (`KIND_HP`): core x2.5, segment x1, **armour x9** (sheet rule),
leg x0.5, arm x1.33, wing x0.5, weapon x1.83, shield x2.17, spike x0.42.

## Enemy base damage (`SpeciesDef.dmg`, per hit at common rarity)

Dragonfly 30 · Scorpion 34 · Widow Spider 50 · Luna Moth 20 · Mantis 29 · Centipede 35 · Hornet 37 ·
Scarab 20 · Soldier Ant 25 · Firefly 21 · Worker Ant 25 · Honeybee 35 · Grasshopper 27 · Cockroach 27 ·
Mosquito 28 · Bombardier 20 · Rhinoceros 20 · Yellowjacket 38 · Ladybug 25 · Stag 23 · Carpenter 22 ·
Cicada 20 · Assassin 47 · Tiger 25 · Mole Cricket 28 · Katydid 25 · Dung 20 · Atlas 30 · Weevil 25 ·
Locust 29 · Jewel 25 · Snake 100

Rarity scales it with `DMG_MUL = [1, 3, 9, 27, 81, 243]`; abilities and projectiles are multiples of
the same base, so a ranged attack scales with the body that fired it.

## Attachment multipliers (`GUN_SPECS.dmg`)

| attachment        | multiplier | note in the sheet                            |
| ----------------- | ---------- | -------------------------------------------- |
| basic cannon      | 0.5        | very large, slow projectiles                 |
| scatter shotgun   | 1.2        | large, slow projectiles                      |
| minigun           | 0.2        | 10s burst, then a 5s cooldown                |
| laser             | 1.0        | per tick, tracking damage                    |
| heavy rail cannon | 17         | hitscan, reach = the body's aggro range      |
| energy shield     | 25         | shock, screen shake, massive knockback       |

## Player (`src/game/data.ts`)

- Starts at **100 hull**, and hull plating now runs `100 x 1.19^level` (was `1.22`) — max 30 levels
  gives 18,450 instead of 40,700.
- Hull-side prices down (plating 25→18 base with 1.4 growth, shield core 120→90 base with 1.45,
  nano repair / reactive armour / dampers all cheaper).
- Shield core runs `60 x 1.22^(level-1)` (was `1.28`), so 25 levels is ~5,500 instead of ~25,800.
- Starting cannon: **20 damage on a 0.7s interval**, free at the start (`CANNON_DMG`,
  `CANNON_INTERVAL`). Cannon damage upgrades still multiply by 1.2 per level.

## Measured result (21 Nov 2026, v2.9.0)

With the sheet applied as written, a whole enemy body carries tens of pieces (a Dragonfly is ~65),
so the piece values multiply out. Effective HP includes the `SHELL_HP_FRAC = 0.6` plating bar.

| rarity    | Dragonfly body HP (all pieces) | + plating | time to kill, starting cannon (29 dps) | time to kill, maxed cannon (~46.7k dps) |
| --------- | ------------------------------ | --------- | -------------------------------------- | --------------------------------------- |
| common    | 1,628                          | 2,605     | 91 s                                   | instant                                 |
| uncommon  | 7,330                          | 11,728    | 6.8 min                                | instant                                 |
| rare      | 58,590                         | 93,744    | 55 min                                 | 2 s                                     |
| epic      | 376,466                        | 602,346   | 5.9 h                                  | 13 s                                    |
| legendary | 2,537,924                      | 4,060,678 | 39 h                                   | 1.4 min                                 |
| mythical  | 21,529,122                     | 34,446,595| 334 h                                  | 12 min                                  |

Player side: 100 hull at level 0, 18,468 hull + ~7,080 shield fully plated; a mythical body hits for
`30 * 243 = 7,290` per laser tick. Knobs if the ladder needs flattening: `HP_MUL` in `data.ts`,
`KIND_HP.armor` (the 9x rule), and `DMG_MUL` (currently 3x a tier).
