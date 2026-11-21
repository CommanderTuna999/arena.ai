# Changelog — combat, plating and website pass

Everything below is implemented in the current build. Numbers are the actual constants used by
the simulation, not design targets.

## 0. v2.4.0 — neon credit chip, bestiary by rarity

### Credit chip
- `CreditCoin` (HUD) and `drawCreditFlights` (canvas) now draw the same neon hexagon: gold radial face, `#7df9ff` rim, square hole punched through the middle, corner ticks and a drop-shadow glow. It reads as currency without breaking the neon palette.
- The coin keeps a constant screen size at any zoom, since both the icon and the flight are drawn in screen space.

### Bestiary: one entry per rarity
- The catalog is now `32 species x 6 rarities = 192 entries`. Each species block holds six chips (one per rarity), each with that tier's own silhouette, its rarity colour, a three-letter label and a lit/unlit state.
- An entry lights up only when that species has been killed at that rarity (`bestiary[id] >= tier`, from the persisted `save.bestiary`), so a mythic kill lights all six chips while a rare kill lights three.
- The detail card is now tier-specific: rarity banner, parts, hull, radius, hull-shell layers (`tier - 1` from rare), shield panels (`tier - 1` from epic), mounts, speed, turn, pack size and the drop rarities that tier actually yields.
- The header counts both: species discovered and rarity entries filled in.

## 0. v2.3.0 — salvage on contact, cash on the counter

### Light parts are scooped on touch
- A loose component with `mass <= 14` (`compMass = area / 900`, so parts up to ~63u radius) is collected the instant `|ship - part| < SHIP_R + partRadius + 12`: no tether, no tow, no dock trip.
- `updateComps` only does this for unhooked pieces, so a part already on a cable is never vacuumed out of the tether mid-pull. Heavier pieces behave exactly as before.
- The scoop runs through `dockComp`, so it respects the cargo cap and `autoSell`: with the bay full the piece is sold for its value instead of being stored.

### Credits fly into the counter
- `dropCreditValue` no longer spills collectible motes: it throws `1-5` coins with `delay = k * 0.055` and `dur = 0.5-0.8s`. Nothing is picked up.
- `updateCreditDrops` only ages the coins; when one lands it adds `value` to `save.credits` / `save.earned` and increments `creditTick`, which the HUD uses to pulse the counter.
- `render.ts` draws the flights in **screen space**: the coin starts at the part's world position (projected through the camera), arcs toward `game.creditHud` with a smoothstep and a `sin` lift, shrinks slightly, leaves a short gold streak, then pops into the counter. `GameClient` measures the counter element every 100ms and hands its position to `game.setCreditHud(x, y)`.
- The counter icon is now a struck cash coin: radial gold gradient, dark rim, inner ring, rim ticks and a real square hole cut with an SVG mask. It replays a `creditPop` keyframe on each landing.

### HUD declutter
- Removed: the bottom-left toast stack, the `● online · fps · wheel = zoom` readout, the `CANNON ONLINE/OFFLINE` label and the `HOSTILES IN NEST RANGE` banner.
- The discovery banner is now one short line (`NEW · <name>`); the AUTO/OVERDRIVE/ADMIN pills stay because they are interactive state.
- Help text updated to match: light parts scoop on contact, credits fly straight in.

## 0. v2.2.1 — shield panels ride outside the armour

- Panels were sized off body scale alone, which put them *inside* the plating on anything above rare (a mythical dragonfly's plates reach ~1,167u while the panel ring sat at ~497u).
- `makeEnemy` now measures, per panel, how far the torso plates reach along that panel's own ray (ray/circle exit distance over every `segment` and `armor` part, including its `plateGrow` slab thickness) and pushes `shieldR` out past it with a `max(28u, 6%)` margin.
- The result is a wall that hugs the hull instead of a single distant circle: a mythical dragonfly's four panels now sit at 497/858/1016/497u depending on the direction, and every one of them is outside the armour.
- Legs and wings are deliberately excluded from the measurement — they stick far past the hull, and a ring out there would float in empty space. A plated limb can therefore poke through the shield line, which reads as an exposed weak point.

## 0. v2.2.0 — shield projectors throw walls, not bubbles

### One panel per generator
- `Part` gained `shieldKind` (0 arc / 1 bar), `shieldSpan`, `shieldAng` and `shieldSpin`, and `shieldStyle(sp, S)` picks the panel for a generator: flyers and serpents (`flying || bodyWave`) get a curved arc with a **0.5 rad** half-angle (~57°, about 29% of the ring), walkers get a straight bar with a **1.25 × body size** half-length. Panel radius starts at `1.45 × body size` and is then pushed out so it sits at least `28u` (or 6%) beyond the outermost torso plate along that panel's ray, so the wall always stands outside the armour; thickness is `max(9, 0.07 × r)`.
- The old closed hexagon bubble is gone from `enemies.ts`, `engine.ts` (shield resolution and hit test) and `render.ts`. Each panel is drawn as a thick translucent `rgba(70,210,255)` band with a bright core stroke, round caps, and a faint energy link back to the generator that projects it.

### Rarity buys coverage, never closure
- Generator count is `tier - 1` (was `tier - 2`): **2 panels at epic, 3 at legendary, 4 at mythical**, laid evenly around the body on a 0.95 ring of tiny hex generators. Arc coverage is roughly 32% / 48% / 64% of the ring, so there is always a gap to shoot through.

### Shape and motion vary by species
- Spin comes from a stable per-part hash: bosses sweep at `0.5 rad/s`, otherwise `idHash % 3` gives `0.7 rad/s` (flyers) or `-0.4 rad/s` (walkers), `-0.55 rad/s` for the second flyer band, and the third band is static. Panel world angle is `enemy angle + shieldAng + spin × t`.
- `engine.shieldAt(e, x, y)` replaces the old radius test: an arc is hit when `|dist - r| <= thickness` **and** the angle is within the span; a bar is hit when the perpendicular offset is within the half-length and the along-axis offset is within the thickness. Bullets test the sample point and one step back along their velocity, so fast rounds cannot tunnel through a wall.

### Rules preserved
- Energy, shock and thermal rounds still pass through a panel; everything else is stopped dead, deals nothing, and never drains the panel. A panel disappears only when its generator part dies (`shieldDown`), and `reflectShell` still reflects energy.
- `Enemy.shieldReach` extends the broad-phase radius for bullets and beams to the furthest panel, so a wall standing outside the body silhouette still catches incoming fire.

## 0. v2.1.3 — energy vs plating, and the overfly swat

### Energy only loses 20% to plating
- `SHELL_TAKE.laser`: 0.22 → **0.8**. Beams (and the thermal cutter, which shares the `laser` source) now put 80% of their damage into the slabs; kinetic 0.3, missile 0.32, explosive 0.4, shock 0.15 and DoT 0.1 are unchanged.
- This is the intended answer to high-rarity hulls shrugging off energy builds: energy already ignores bubble shields, so it is now the anti-plating branch too.

### Overflying a body gets you swatted
- New per-enemy `swatCd` (1.4s) and `engine.swat()`: when the ship is inside the hull footprint — `dist < clamp(enemy.radius * 0.5, 45, 260) + SHIP_R` — the body reacts the same frame, before the player can act.
- Effect: `2.2 × eDmg` with knockback of `1,500 + 90 × tier` u/s away from the core, `shake >= 30`, a 1300 u/s shock ring plus twin spark bursts. Cooldown-gated so it cannot chain-stun a player.
- Suppressed in the safe zone and on stunned bodies.

## 0. v2.1.2 — legs cripple, legendary and mythical legs get plating

### Crippling
- `LEG_CRIPPLE_FRAC = 0.35` and `legHealthy(p)`: a leg part below 35% of its max HP no longer counts. `damagePart` recomputes mobility whenever a leg takes damage, so the penalty applies the moment a limb crosses the threshold — no need to destroy it.
- `refreshMobility` now works per **limb** (`roleGroups.leg`, one group per leg chain): a limb is crippled when its surviving parts hold ≤35% of the limb's max HP. Crippled limbs drop out of `mobility` and `turnFrac`; with every limb crippled the body can neither walk (`mobility 0`) nor turn (`turnFrac 0`).
- `Enemy.crippledLegs[group]` freezes the walk cycle for that limb (`g.ang *= exp(-7·dt)`) while healthy limbs keep stepping. Species with ungrouped leg parts fall back to per-part counting.

### Leg plating
- `Enemy.legPlate` = `tier - 3` from legendary up (0 below), i.e. 1 slab layer at legendary, 2 at mythical.
- `plateAt` treats leg parts as plated when `legPlate > 0` and grows their slabs with `plateGrow(p.r, legPlate)`, so shots on a plated limb are swallowed by the hull shell stack rather than hitting the leg directly.
- The shell envelope (`shellR`) now includes the plated limbs, so beams and blasts respect them too.
- `render.ts` draws the leg slabs with their own layer count (body keeps `e.shells.length`) and dims/desaturates crippled limbs.

## 0. v2.1.1 — heavy cannons are hitscan, legs steer again

### Heavy Cannon is hitscan
- `GUN_SPECS.heavy` sets `hitscan: true`, range 1200u, and drops the 0.9 homing (there is nothing left to home with).
- `engine.heavyShot()` draws a line from the muzzle to the first thing it meets (nest or ship), applies `1.8 × eDmg` without travel time, paints a tracer in `this.beams`, and still applies the 260u/s recoil shove on the shooter.
- A ship hit adds a 150u impact ring, two spark bursts, knockback along the line, and raises `this.shake` to at least 34 — the heaviest shake in the game (normal hits cap around 14). A miss produces no damage and no shake.

### Legs steer again
- Restored `Enemy.turnFrac` (`clamp(aliveLegs / legCount, 0, 1)`, serpentine rigs pinned to 1), recomputed in `refreshMobility`.
- `updateEnemies` uses `turnMul = e.turnFrac` and `runAct`'s `turnTo` scales by it, so charges and swings respect broken legs too. Zero legs means no turning at all.
- Rarity scaling from 2.0.8 is unchanged.

## 0. v2.1.0 — enemy weapon overhaul

### Cannon upgrades retired
- `pierce`, `breaker`, `coreseek`, `frag` and `velocity` are gone from `UPGRADES`, from `Stats` (`pierce`, `breaker`, `coreMul`, `frag`, plus the velocity-scaled bullet speed/range, now the flat 900 u/s / 760 u) and from the damage path in `hitEnemy`.
- `migrate` filters unknown upgrade ids through the new `UPGRADE_BY_ID`, so a save carrying the old levels loads without them.
- Left as-is for the coming cannon rework: damage, rate, barrels, crit.

### Everyone can roll guns and shields
- `loadout` no longer takes the species' `armed` flags as gospel: if a body has no gun it rolls `b.rng() < 0.12 + 0.06 * tier`, and if it has no shield generator it rolls `b.rng() < 0.10 + 0.05 * tier`, gated on the epic+ mounts existing (`nGun`/`nSh` still scale as `tier - 2`).
- Rolled guns pick a kind from `randomGunKind()` (weights shift toward the heavy weapons at legendary/mythical).

### Four new turret kinds (`GUN_SPECS`)
- `gun` — unchanged baseline (900u, 1.35s, 0.4×, 560u/s).
- `minigun` — "Rotary Gun": 700u, 0.16s, 0.05×, 720u/s, 0.16 rad spray.
- `scatter` — "Scatter Cannon": 700u, 2.6s, 7 pellets of 0.2× at 420u/s across 0.5 rad, 9u+ pellets.
- `heavy` — "Heavy Cannon": 1050u, 5.0s, 1.8×, 950u/s slug with 0.9 homing that shoves the enemy 260u/s backwards.
- `laser` — "Laser Emitter": 1000u, 2.4s, 1.0×, 1,500u/s, `energy` damage.
- Turret barrels are tinted per kind, and `render.ts` draws `pellet`, `slug` and `laser` projectile shapes.
- `hurtPlayer` takes `energy`, which skips the kinetic-shield archetype's reduction; `EProj.energy` carries the flag.

### Signature guns
- `SpeciesDef.gunType` — Dragonfly/Firefly/Jewel/Serpent use lasers, Scorpion/Scarab/Bombardier scatter cannons, Rhino/Dung/Weevil heavy cannons, Hornet/Ant/Yellowjacket/Locust rotary guns.

## 0. v2.0.9 — legs no longer drag the turn rate

### Turning is a pure species stat
- Removed `Enemy.turnFrac` and the leg-fraction logic added in 2.0.8. `updateEnemies` uses `turnMul = 1`, and `runAct`'s `turnTo` is back to `e.turn * rate` with no limb scaling.
- `refreshMobility` still rebuilds `mobility` from surviving legs/wings, so a de-legged body still crawls (or stops, if it has no wings); it simply keeps its full turn rate.
- Rarity scaling from 2.0.8 is unchanged: `TIER_TURN = [1, 1, 1, 1, 0.9, 0.8]`.

## 0. v2.0.8 — enemies that can actually turn

### Turn rate by rarity
- `makeEnemy` built turn as `spd.turn / ((1 + tier * 1.05) * (1 + radius / (size * 6)))`. The size term is constant across tiers (radius scales with `b.size`), so the whole rarity penalty was the `1 + 1.05·tier` divisor: 4.2x at epic, 6.3x at mythical.
- New `TIER_TURN = [1, 1, 1, 1, 0.9, 0.8]`: common through epic share the species rate, legendary is 10% slower and mythical 20% slower. Mythic dragonfly turn went from 0.34 to 1.47 rad/s (a 180° swing in ~2.1s rather than ~10.5s).

### Legs steer
- `Enemy.turnFrac` (new field, initialised to 1) is recomputed in `refreshMobility` from the share of `leg` parts still alive: `clamp(aliveLegs / legCount, 0, 1)`. Serpentine rigs (`id === "serpent"`) and bodies with no legs keep 1.
- `updateEnemies` uses `turnMul = e.turnFrac` (was `0.3 + 0.7 * mobility`, which left a legless body steering at 30%). `runAct`'s `turnTo` multiplies by `turnFrac` too, so charge/swing wind-ups respect it. With every leg destroyed the body cannot rotate at all, and `mobility` already drops to 0 so it cannot walk either.

### Admin spawner memory
- `AdminPanel` seeds `spawn` state lazily from `localStorage["wof-admin-spawn"]` (`{ id, tier }`, matched back to the species by id) and writes it back whenever the selection changes, so the panel reopens on the last enemy and rarity picked.

## 0. v2.0.7 — plating you can see and hit

### Thicker slabs
- `plateGrow(r, layers)` (exported from `engine.ts`, used by both the renderer and hit detection) is now `min(1.9r, 20 + 10(layers - 1) + 0.26r)`, up from `min(1.5r, 12 + 8(layers - 1) + 0.18r)` and far above the original fixed 4–19u rim.
- The renderer draws a dark underlay grown by 1.3x, a gunmetal face (`hsla(hue, 9%, 19+11f%)`), a lighter bevelled lip at 0.84x of the growth, a bright rim and one ridge per extra layer.

### Hits land on the armour
- Added `plateAt(e, wx, wy)`: point-in-slab test against every alive `segment`/`armor` part, with the same `plateGrow` radius the renderer uses. It handles the enemy's rotation, per-group pivots and the body-wave bend, so armour on a serpent still lines up.
- `tryHit` now uses `plateAt` (three samples along the round's per-frame travel, to stop tunnelling) instead of the body-wide `shellR` circle. `beam` uses the same test inside the `shellR` broad phase, so beams end on steel too.
- `shellR` is now the plate envelope (`max(center + r + plateGrow)` over plated parts, at least core radius + 10) rather than `b.radius + 6`, which on winged species was mostly empty space.
- Every plate hit spawns a spark burst and a flash ring at the contact point (`shellHit` takes optional `hx, hy`), so a stopped round is visible instead of silent.

### Ring sweep
- `rings` update now tests the swept band `prev - 26 <= d <= r + 26` instead of `abs(d - r) < 26`. A shell-break shockwave at ~3,900u/s moves ~65u per frame and could previously skip past the ship entirely.

## 0. v2.0.6 — real armour plating, proximity cannon

### Plating is an extra armour layer
- Each `ShellLayer` now holds `SHELL_HP_FRAC` (0.6) of the enemy's total part hull instead of the old `5 * HP_MUL[tier]`, which was under 1% of hull. Layers remain `tier - 1`, so tier 2 = 1 layer, tier 5 = 4 layers. A 1,573,120 HP mythical now carries 4 × 943,872 HP of plating.
- `SHELL_TAKE` became a per-source table: kinetic 0.30, missile 0.32, explosive 0.40, laser 0.22, shock 0.15, dot 0.10. Beams and shockwaves chip plates now instead of being permanently walled by them.
- `shellHit` multiplies the plate loss by `stats.breaker` (Plate Breaker, up to 2.5x) for player damage.
- A shattered layer's shockwave deals `e.eDmg * 1.25` to nearby enemies instead of `layer.max * 0.75`, which at the new plate HP would have wiped every enemy on screen.

### Plating is visible
- `drawEnemy` draws plating in its own pass before the body: a dark underlay grown 2.4u past the slab, a solid filled top face (`hsla` steel tinted to the species hue, brightening as integrity drops), a bright rim, and one faint ridge per extra layer. Growth is `4 + 5 × (layers - 1)` capped at 0.9 × part radius.
- Old code drew a single translucent 2px stroke per body part; that is gone.

### Nest cannon
- `updateTurret` sets `basePowerT = BASE_POWER_IDLE` whenever `nearestEnemy(BASE.x, BASE.y, BASE.aggroR)` finds anything, so the cannon powers up as soon as any enemy enters the 1,760u alert band and stays up 120s after the band clears.
- `hurtBase` no longer touches `basePowerT`. The instant retaliation kill on the attacker is unchanged, as is the rare+ targeting rule.

## 0. v2.0.5 — admin test range

### Test range
- `AdminState` gains a `sandbox` flag (session-only: `readAdminFlags` always returns `false` for it and `writeAdminFlags` leaves it out of `wof-admin-flags`).
- `adminTestRange(true)` clears `enemies`, `eprojs` and `mines`, teleports the ship to the outer ring at `atan2(-BASE.y, -BASE.x) × (WORLD_R - 900)` — the point farthest from the nest — caps hull/shield, clears status effects and snaps the camera. It also forces admin mode on. `adminTestRange(false)` restores the saved pre-teleport position and lets the world resume.
- While `admin.sandbox` is set, the update loop skips `seedWorld()` and the `manageChunks()` tick entirely, `seedWorld()` early-returns, and the boss-spawn branch in `updateEnemies` is suppressed. Nothing spawns on its own.

### Spawner
- `adminSpawn(spi, tier, n)` takes any index from `SPECIES_LIST` and any rarity 0–5, places up to 20 copies in a line perpendicular to the aim, 520–1,100u toward the cursor (clamped inside `WORLD_R - 40`), marks them `aggro = true` and reports `SPAWNED n × NAME · RARITY`.
- `adminClearEnemies()` empties enemies, hostile projectiles and mines in one call.
- Both are gated on `admin.on`; species and rarity pickers live in the admin panel's new TEST RANGE section, with SPAWN, SPAWN ×5 and CLEAR buttons.

## 0. v2.0.4 — energy shields are hard walls

### Enemy energy shields
- Shields no longer have a charge to drain. `SHIELD_STRIP` (0.08) is deleted; blocked hits change nothing about the bubble, so `shieldDown`, the 4s collapse, the 40% re-arm and the 15%/s regeneration never trigger. A bubble lives until its Shield Generator part is destroyed.
- Only `energy`, `shock` and `thermal` damage passes through a bubble. Kinetic, physical, explosive and corrosive projectiles and beams stop at the hex edge and deal nothing to the shield or the hull.
- `tryHit` and `beam` share the same rule: energy family breaks out of the bubble check and continues to the parts; everything else returns/ends the beam with a cyan impact ring.
- The "SHIELD DOWN" toast and its collapse/re-arm branches are removed.

### Rail Sniper
- The rail beam is now fired with `bypass = false`, so it is stopped by enemy energy shields like any other kinetic weapon. The Shield-Bypass Laser keeps `bypass = true` and is the only weapon that ignores bubbles. Hull shells still stop the rail.

### Documentation
- `DMG_INFO` tooltips, `docs/STATS.md` damage-type table and the bubble rules paragraph all describe the new behaviour.

## 0. v2.0.3 — particle budget pass

### Particle lifecycle
- `pPool` recycles `Particle` records instead of allocating a fresh object for every spark.
- Expired particles use a swap-pop (`particles[i] = particles[last]; pop()`), not `splice(i, 1)`.
- `addParticle` rejects any spark outside the camera rectangle plus a 120u margin. The live cap is 900 particles at `cam.z < 0.18` and 1,500 otherwise.
- `burst` emits 55% of its normal count at `cam.z < 0.18`.

### Particle rendering
- Below 2.5 screen pixels (or at `z < 0.16`), particles render as a single `fillRect` point sprite; larger close-up particles keep their triangle/diamond/hex/line shapes.
- `strokeStyle` and `fillStyle` are cached between particles with the same colour. `lineWidth` is set once per frame instead of per particle.
- Particles whose remaining alpha is <= 0.05 are skipped.
- Off-screen particles were already culled in the render loop; the spawn-side cull stops them from entering the array in the first place.

## 0. v2.0.2 — kinetic shields, quieter inner rings and the stat compendium

### Base cannon and kinetic shields
- The base cannon bullet now carries `elem: "kinetic"` explicitly (it previously left `elem` undefined).
- Enemy energy-shield bubbles now stop kinetic and physical rounds. Each kinetic hit removes `8% × shieldMax`; at zero the bubble sets `shieldDown = 4`, re-arms at 40% and regenerates 15%/s after a 3s quiet period.
- Energy/shock/thermal hits are still absorbed without draining the bubble; explosive/corrosive rounds still pass through; bypass and rail beams still skip bubbles.
- Base cannon damage remains `st.dmg`, rate `4 + 0.7/level`, `1 + barrels` shots.

### Spawn pressure
- `ZONE_DENS` is now `[2.6, 2.2, 1.8, 0.32, 0.16, 0.075]` (epic was 0.56, legendary 0.44, mythical 0.36).
- `ZONE_CAP` is now `[56, 48, 40, 14, 8, 4]` (epic was 18, legendary 10, mythical 5).
- The initial seed probability floor is now `0.03` (was `0.38`), so the actual chunk pass rates are common 100%, uncommon 84.6%, rare 69.2%, epic 12.3%, legendary 6.2%, mythical 2.9%.
- The visibility floor spawns at most tier 2 (rare) in epic+ zones; top-up still spawns the local tier but is limited by the much lower caps.

### Documentation
- Added `docs/STATS.md`: all 32 enemy species at every tier, all 19 crafted weapons, player shields, armour, optics, utility, active abilities, base cannon and upgrades, with formulas and live constants.

## 0. v2.0.1 — max-zoom performance and the white mythical pile

### Enemy level of detail
- `drawEnemy` computes `sr = e.radius × cam.z`. Below 3px it draws one mote; below 9px it draws a
  stride-filtered body (about seven parts); below 26px it draws a heavier stride-filtered body
  (about twelve parts).
- Camera zoom caps detail independently of body size: `z < 0.1` forces the marker pass,
  `z < 0.35` forces the mid pass. At full optics zoom the viewport is ~10,000u wide, so every
  visible insect is a species-coloured marker with a bright core dot.
- `drawBars` is skipped at `z < 0.1` and for enemies under 10px on screen.

### Plating and the white blob
- Plating is now one outer rim, drawn *before* each `segment` / `armor` part, tinted with
  `hsl(speciesHue, 48%, 64%)` at 24-50% alpha. The old pass drew a grey fill for every shell layer
  after the entire body, which washed multi-layer mythical insects to opaque white.
- Plate growth is clamped to `min(grow, p.r × 0.45)`, so small plates cannot balloon into
  free-floating hexes; `wing`, `leg`, `spike`, `weapon` and `shield` parts are not plated.
- `ZONE_CAP` is now `[56, 48, 40, 18, 10, 5]` (was `[56, 48, 40, 22, 18, 15]`). The mythical
  centre holds at most five residents instead of fifteen.

### Large-body spacing
- Separation uses true radii capped at 900u: `(min(rA,900) + min(rB,900)) × 0.8`, with a push of
  320u/s. The old 420u radius cap let two 1,300u insects occupy almost the same point.
- Ranged enemies already used `keep + radius × 0.9`; melee enemies now stop at
  `radius × 0.9 + SHIP_R` instead of `S × 0.8 + SHIP_R`, so their bodies no longer walk through
  the player.

### Far-zoom effects
- Canvas `shadowBlur` on glowing parts is limited to pieces between 10px and 34px on screen.
- Enemy projectiles lose their 12px glow below 2px on screen.
- Loose components use a single rarity-coloured pip below `z = 0.12`; particles become 1px
  rectangles and credit motes become small squares below `z = 0.1`.

## 0. v2.0 — bulk upgrades, persistent admin, component shockwaves, global vision

### Admin mode lives for the tab, not the page
- Admin flags are read from `sessionStorage["wof-admin-flags"]` when the `Game` is constructed, so
  leaving `/play` with the HOME button and returning keeps admin enabled.
- `setAdmin` and `adminAll` write the flag object (`on`, `credits`, `health`, `damage`, `components`)
  back after every toggle. Nothing is added to `SaveData`, so the pilot save stays clean.

### 1x / 5x / 10x / MAX upgrades
- Every upgrade card has a quantity selector. Fixed quantities price each level with the existing
  `upgradeCost(u, level)` curve and disable the button unless the whole batch is affordable.
- MAX walks levels until `u.max` or the first unaffordable level, then buys exactly that many.
- `Game.buy(id, count)` loops the levels, stops at the cap or the first level the player cannot pay
  for, recomputes stats once, and returns the number of levels bought.

### Component shockwaves
- `breakPart` already detonated weapon and shield parts; those blasts now use `shockwave()`, an
  expanding ring that applies player damage when it reaches them and immediate hull damage to every
  enemy part inside `part.r × 3 + 40`.
- Shattered plating (`shellHit`, `layer.hp <= 0`) now calls the same shockwave with radius
  `shellR × 1.7 + 40`, player damage `eDmg × 1.1` and hull damage `layer.max × 0.75`, replacing the
  old silent pop.
- The blast hits the breaking enemy's own remaining parts too; `areaDamage` still routes through
  another shell layer first if one remains. Cascade explosions during death use 35% damage and only
  fire when `expDepth === 0`, so packed enemies cannot chain-nuke the screen.

### Global 1.3x vision
- `VISION_MUL = 1.3`; the camera target is always `min(playerZoom, 1 / VISION_MUL)` with an 8/s
  smoothing rate. The old `BASE.aggroR` proximity gate and `baseVision` HUD flag are gone.
- Optics upgrades still zoom out from the 1.3x baseline.

### Enemy damage doubled
- `eDmg` is now `16 × DMG_MUL[tier]` instead of `8 × DMG_MUL[tier]`, so every rarity deals 2x damage
  while the 3x step between tiers (1 / 3 / 9 / 27 / 81 / 243) is unchanged.

## 0. v1.9 — construct player, whole-map spawns, credit drops and nest retaliation

### The player is a construct, not a ship
- `drawShipShape` is now a circular machine: three animated gimbal arms with pumping piston
  rods, three counter-rotating armour plates, an eight-segment orbital ring, three orbiting
  sensor motes, a fast inner gyro ring, a vented hex core and a forward iris lens.
- The hull has no bow or stern. The old forward thruster triangle is replaced by a directional
  ion wash that points opposite the velocity vector, and the minimap icon is a ring rather
  than a triangle.
- Weapon hardpoints are three radial sockets at 120° (`W_SLOTS` in `data.ts`, radius 17u).
  Each mount rests pointing outward and rotates to its target; shots spawn at the matching
  socket + 7u muzzle. Main-cannon rounds now leave the core at 12u instead of the old nose.
- Armour is drawn as curved plates bolted around the 18.9u ring plus a core collar. Shield
  emitters ride the three gimbal joints. Shield/barrier visuals were widened to clear the
  larger silhouette.

### Whole-map enemy population
- `seedWorld()` runs on the first simulation tick and visits every walkable 1,500u chunk
  (376 chunks) once. Each chunk gets one resident with a zone-dependent probability
  (`ZONE_DENS / 2.6`, floored at 0.38), preserving the low high-rarity density.
- Chunks are no longer deleted when the player leaves and enemies are no longer filtered by
  the player's current chunk. The initial population is ~250-300 enemies and persists.
- `HARD_MAX` is 420. `topUp()` now measures the local neighbourhood instead of the global
  array and refills around the player without relocating the world population.

### Credits from broken parts
- `breakPart` calls `dropCredits` for player-attributed breaks. Each break creates 1-4
  physical motes worth ~4% of `compValue(part.area, enemyTier, part.kind) × sellMul`.
- Motes drift for 18s, home in from 260u (plus 45% of magnet range), and add to
  `save.credits` / `save.earned` on contact. Base-majority kills scrub the dead enemy's motes
  the same way they scrub loose components.

### Nest retaliation and cannon power
- `hurtBase` sets `basePowerT = 120` and instantly calls `killEnemy(src, ..., byBase=true)` on
  the attacker that damaged the hull. Such kills grant no bestiary credit and drop nothing.
- `updateTurret` refuses to acquire targets while `basePowerT <= 0`; the barrel idles and the
  renderer dims the turret. Damage restarts the 120s window, so the cannon sleeps again after
  two quiet minutes.
- HUD exposes `basePowered`; the nest panel shows CANNON ONLINE / OFFLINE.
- Any enemy projectile crossing `BASE.r × 0.82` still damages the hull, so stray fire can
  trigger retaliation without enemies deliberately targeting the nest.

### Base vision (superseded in v2.0)
- v1.9 applied a 1.3x camera pull-back only inside `BASE.aggroR` (1,760u) and exposed
  `baseVision` to the HUD. v2.0 makes the 1.3x baseline global and removes both the gate and the
  HUD chip.

## 0. v1.8 — turret system rework, detailed ship, rotating mounts

### Enemies hunt the ship, not the nest
- Removed every base-targeting branch from `updateEnemy`: no `baseEngaged` aggro override, no nest-aimed
  projectiles (`tgtBase`), no 2.6× nest charge, no docking-apron exemption, no hull gnawing and no
  forced 1.6 rad/s turn floor.
- `BASE.aggroR` (1,760u) is now purely the nest's defence-alert radius and the retention zone for
  enemies chasing the player through it. Enemies follow the player normally at every distance, so they
  can be drawn into turret range instead of switching to the nest.
- The nest hull remains solid for stray fire: any enemy projectile that crosses `BASE.r × 0.82` now
  damages the structure, regardless of what it was aimed at. Base defences and the 120s repair
  lockout are unchanged, and nest-owned kills still grant no bestiary credit.

### Detailed player hull
- `drawShipShape` is a multi-layer build: dark-to-light hull gradient, flank chine plates, inset wing
  armour, three rib lines per wing, tail fins, cockpit canopy with frame and highlight, fixed nose
  cannon with muzzle glow, engine block with two nozzles, reactor spine, intake slots, greeble boxes,
  antennae, rivets and panel seams.
- Adds animated engine wash, port/starboard running lights and wingtip pods. Only the outer silhouette
  uses a shadow blur; interior detail is plain stroked geometry to keep frame time flat.

### Rotating weapon mounts
- New `Player.wAim[]` holds a per-mount angle relative to the hull. `updateWeaponAims()` tracks the same
  target each weapon would fire at (including the marked missile part) at 9 rad/s and relaxes to the nose
  when auto-fire is off.
- `drawWeaponMount` takes that angle, rotates about a hex hardpoint on the wing, and shot origins now
  start from the matching hardpoint plus a 7u muzzle offset, so tracers leave the barrel that is pointing
  at them.

## 0. v1.6.1 — stable preview, solid bestiary cards, compact cores

### Preview cannot serve an old release
- The live preview now runs a **production build** (`scripts/preview.sh`) instead of the dev server.
  Production chunk filenames are content-hashed, so a rebuilt release can never be assembled from
  old cached JavaScript.
- The preview script owns port 3000 and kills any process already listening, so a stale server from
  an earlier release cannot keep answering.
- Every response carries `Cache-Control: no-store, max-age=0, must-revalidate` (plus
  `X-Wof-Version`) and the build id is `wof-<VERSION>`.
- A `VersionGuard` on the title screen clears Cache Storage and legacy service workers, then polls
  `/api/version`; if the server is newer than the running bundle it hard-navigates once with a
  cache-busting query. The check also runs on bfcache restore (`pageshow`) and tab focus, so the
  preview cannot keep showing a cached 1.1 page.

### Bestiary legibility
- Entry cards now use an opaque `#0b1224` panel (selected `#221c08`, hover `#141d33`) with a drop
  shadow; the hover card is opaque `#070b1a`. The arena scene no longer bleeds through the text.
- Inner art and stat wells use solid `#0a1020` instead of translucent black.

### Compact cores
- Core radius is back to `max(0.24, min(rx, ry) × 0.36)` — the previous ×√10 inflation (10× area)
  is removed.
- Cores stay on layer 0, underneath the body, so segments and plating draw over them and the core
  only shows through gaps.

## 0. v1.7.1 — four-times turret damage, no bestiary credit for nest kills

### Point-defence damage
- `MINI_DMG` is now **72**, up from 18 (exactly 4×). Fire cadence stays **0.24s**, tracer speed
  1,450u/s and range 850u, so six turrets put out roughly 1,800 raw dps when all have targets.
- Plating still absorbs 70% of each physical tracer (`SHELL_TAKE = 0.3`), and energy shields still
  do not stop kinetic fire.

### Bestiary credit
- `killEnemy(e, x, y, byBase)` now receives an explicit base-kill flag, propagated from
  `breakPart(..., byBase)` and from `damagePart(..., fromBase)`.
- A kill never updates `save.bestiary` or sets the discovery banner when **either** the finishing
  blow came from the nest defences **or** `baseDmg × 2 > dmgTaken`. This covers the siege cannon,
  the six hex turrets and core breaks caused by either.
- Player-credited kills still update the bestiary, best-rarity record and discovery banner.
  `save.kills` continues to count every kill.

## 0. v1.7 — hex point turrets, legendary siege shells, 120s repair lockout

### Aggro leash
- `BASE.aggroR` is now **1,760u**, exactly `turretR × 1.1` (1,600 × 1.1). Mobs switch from the
  player to the nest only when they are already inside the siege cannon's envelope, instead of the
  old 2,240u (×1.4). The orange leash ring and the "NEST UNDER ATTACK" check both use the new value.

### Six hex point-defence turrets
- Six small turrets sit on the existing hex pylons at `BASE.r` (260u), one every 60°.
- Each turret spins up toward its target (5 rad/s), idles by slowly rotating, and fires a fast
  (`1,450u/s`) cyan tracer every **0.24s** for **18 damage** (raised to **72** in v1.7.1) at anything inside **850u**
  (`BASE.smallR`). Tracers lead moving targets, last 0.85s and hit plating before hull.
- Point-turret damage is physical/kinetic: armour shells absorb 30%, shields still ignore it.
- They do **not** wake the siege cannon; the cannon only reacts to rare+ enemies.
- Every sixth of the nest's **maximum** integrity lost destroys one turret (`baseDamageTaken`
  divided by `baseMaxHp / 6`). A 100-damage chunk kills one, three 100-damage chunks kill three,
  and all six are gone when the nest dies. Damage is cumulative, so repairs never bring a turret
  back. The HUD draws six teal pips beside the nest bar.

### Siege cannon: rare+ gate and legendary kills
- The cannon now acquires only `tier >= 2` (rare, epic, legendary, mythical) targets. Common and
  uncommon enemies never cause it to power up, and in-flight shells retarget only rare+ enemies.
- A shell strips all plating and shields, then **one-shots everything up to legendary** (tier 4).
  It no longer stops at epic.
- **Mythicals** (tier 5) lose a fixed **55% of current hull** per shell, so they survive one hit at
  45% and remain an end-game threat.
- The cannon still has 1,600u range, 7s reload, one shell in flight, 1.8 rad/s traverse, and the
  same heavy recoil/muzzle effects. It renders dimmed while no rare+ target is in range.

### No salvage from base kills
- Every enemy tracks `dmgTaken` and `baseDmg`. Base cannon damage (full hull value for one-shots,
  actual hull removed for mythical chunks) and point-turret damage are attributed to the nest.
- `maybeDrop` returns immediately when `baseDmg × 2 > dmgTaken` (strict majority). Loose parts that
  already broke off that enemy are scrubbed from the world when it dies, so a base-majority kill
  leaves nothing behind. Player-majority kills still drop normally.

### Repair lockout
- Any hit that deals integrity damage sets `baseHitT = 120`; the 2%/s repair only starts once that
  timer reaches zero. Low-tier hits that deal 0 damage do not reset it.

## 0. v1.6 — nest siege cannon and a destructible base

### Siege cannon
- The nest now carries a permanently fitted cannon. Stats: **range 1,600u**, shell speed 650,
  **7-second reload**, 1.8 rad/s traverse. It picks the nearest enemy in range and holds that
  target until it dies or leaves the leash.
- One shell **incinerates any enemy of epic tier or below** outright, burning through plating and
  energy shields (it is a physical incendiary shell, not an energy weapon).
- Legendary and mythical enemies only lose a proportional chunk of hull (120,000 damage spread over
  their remaining parts), so they cannot be held off — one legendary reaches the nest in a few
  seconds and ends the run.
- Recoil is deliberately huge: the barrel slides back 36u, a hot muzzle flash and six spikes
  appear, a shock ring leaves the nest, the mount ring expands, plasma vents behind the barrel and
  the camera kicks 26 (scaled down when the player is far away).
- Only one shell is in flight at a time because the 7s reload is longer than the ~2.5s flight.

### Base aggro and destruction
- Enemies whose centre is within `turretR × 1.4 = 2,240u` of the nest switch their target to the
  nest and ignore the ship completely (their shots carry a `tgtBase` flag and only collide with the
  nest). They charge at **2.6× normal speed**, then ram and fire at the hull.
- The nest has **600 integrity**. Incoming damage scales by attacker tier:
  common ×0, uncommon ×0.01, rare ×0.4, epic ×1, legendary ×1.6, mythical ×2.4. Ambient trash
  therefore cannot erode it; one epic that reaches the hull does ~140 dps, two epics overwhelm the
  cannon's one-target-at-a-time 7s cycle, and a legendary/mythical kills it in about 2 seconds.
- Integrity regenerates 2%/s after 7 seconds without a hit. A slim teal `⬢` bar joins the player
  bars while the nest is nearby or damaged, and `⬢ NEST UNDER ATTACK` appears when rare+ enemies
  are inside the leash.
- At zero integrity: every enemy in the world is vaporised, all loose and stored components are
  lost (`save.inventory = []`), half the credits are removed, the penalties are saved immediately,
  and after a 3-second `NEST DESTROYED` overlay the client routes back to the title screen. The
  next run places the nest elsewhere.

### Nest placement
- `BASE_RING` is 13,900–15,300u — the same outer (common) ring, never an inner zone and never near
  the world edge. A module-level last position guarantees consecutive runs are at least 3,000u
  apart. The camera, player spawn, docking, recall, safe zone, spawning exclusion and minimap dot
  all read the mutated `BASE` position.

## 0. v1.5 — moth lag, bestiary hover cards, visible loadout

### White moth lag
- The tier-5 moths (Luna Moth, Atlas Moth) carry three shield generators with projected radii of
  650–780 units. Each hex used `shadowBlur`, and the huge core used a 22px glow. Canvas shadows on
  paths that large are software-blurred every frame and caused the visible stall.
- Guards: shield shadows are only used when `radius × zoom < 180`; the inner shield hex is skipped
  for big shields. Part glow is skipped when `part.r × zoom > 160`. Plating draws no shadows at all.
- Large enemies still render the same silhouettes, just without the multi-thousand-pixel blur passes.

### Bestiary
- Modal widened to `min(97vw, 74rem)` and the whole card area is a single `overflow-y-auto`
  `overscroll-contain` pane, so it scrolls on every screen size.
- Cards are larger (`7.4rem`, 62px art) and the six rarity pips are thicker.
- Hovering (or focusing/tapping) a card opens a floating detail card **beside that entry** instead
  of a fixed bottom panel: name, family, best rarity, field note, parts/hull/speed/turn/pack/zones,
  abilities and rarity-coloured drops. Undiscovered species still show a black silhouette and no
  stats. The popover is viewport-clamped and `pointer-events: none`.

### Player hardware
- `drawPlayer` now reads the equipped crafted items and draws each one:
  - **Weapons** (up to 3): guns (single/triple barrels), missile/utility pods, beam emitters
    (rail is longest), and special emitters, each in its role colour with a pulsing muzzle glow.
  - **Armour**: side plates plus a dorsal ridge, thickness and colour by recipe (titan/carapace are
    visibly heavier).
  - **Shield**: emitter dots and a coloured bubble + two counter-rotating arcs, colour by shield id.
  - **Optics**: a small lens at the nose. **Utility**: a glowing pod at the tail.
- Engine flame, overdrive ring and hit flash are unchanged; all fitted effects animate with `t`.

## 0. v1.4 — bestiary, damage types and visible plating

### Saving when leaving a run
- The HUD home button now writes the local save and pushes the server save **before** routing to `/`.
- The title screen's local-save store compares the raw `localStorage` string on every render instead of
  keeping a stale module cache, so the just-finished run cannot be overwritten by pre-run progress.
- `pagehide` / unmount still call `beaconSave()` as a second line of defence.

### Summon cap
- `summon` children carry a `gen` counter. Only `gen < 2` enemies can summon, broods are capped at 4
  per cast, and the global `HARD_MAX` is respected. No more infinite clone explosions.

### Plating
- Layers per tier: **2 → 1, 3 → 2, 4 → 3, 5 → 4** (`tier - 1`, no longer `tier - 2`).
- Every layer is a solid grey expanded copy of each part polygon (`+3 + 4.5·layer` world units), drawn
  outermost-first with a light rim, so armoured enemies read as a thick grey shell rather than a
  hairline. The old "plating cracked / stripped" toasts are gone — the layers disappearing is the
  feedback.
- Hit shell stays `radius + 6`.

### Damage types and shields
- `DmgKind`: kinetic, energy, explosive, shock, corrosive, thermal, physical; `DMG_INFO` carries name
  and colour, `WEAPON_DMG` maps every weapon, `damageProfile()` lists what an item deals or blocks.
- Crafting detail shows `DEALS …` / `BLOCKS …` badges. Shields block energy/thermal (and kinetic on
  kinetic/phase/ward/reflector/prismatic/nullfield); armour blocks kinetic/physical plus variants.
- Enemy energy shields (blue hexes) now **stop energy, shock and thermal completely** and take no
  damage from them. Kinetic, explosive and corrosive rounds pass through and hit the body. Beam
  weapons follow the same rule unless the weapon is a bypass laser.
- Visual language per type: yellow tracers (kinetic), cyan bolts with white cores (energy), green
  globs (corrosive), violet zig-zags (shock), wide pink streaks (thermal), orange missiles
  (explosive). Beams carry their own colour: cyan lance, pink cutter, green bypass, pale gold rail,
  violet chain lightning.

### Rail, spawns, zoom
- Rail reload `1.4s → 1.82s` (30% slower).
- Zone tiers 3–5 densities cut 60%: `1.4/1.1/0.9 → 0.56/0.44/0.36`; caps `38/32/28 → 22/18/15`.
  Tiers 0–2 keep `2.6/2.2/1.8` and caps `56/48/40`.
- Optics nerfed 30%: `1/(1 + 1.96·eff)`, floor `0.056` (was `2.8` / `0.04`).

### HUD and bestiary
- Home, settings, admin, controls and the new bestiary button live in the **top-left** row; the
  health/shield/boost stack starts below them (`top-16`).
- Every enabled button scales up 5.5% on hover and dips on press (`globals.css`).
- Bestiary modal: seven families (ants/bees/wasps, beetles, moths/drifters, leapers, hunters, long
  ones, legends). Each species is a real SVG of its built body plan; undiscovered species are black
  silhouettes labelled `???`. Rarity pips (six) fill as higher-tier versions are killed.
- Hovering an entry shows parts, hull, speed, turn, pack, zones, unlocked abilities, a handwritten
  field note, and a drop table with each drop chip coloured by the rarity it rolls.
- First kill of a species records `save.bestiary[species] = tier` and shows the top-of-screen banner
  **New enemy discovered: Name!** for five seconds.
- Unique bosses are excluded from the ordinary species lottery (they only spawn through the boss
  pass, which is still disabled while `SNAKE_ENABLED = false`).

## 0. v1.3 — crowd, cores, plating and firing discipline

### Title screen
- SETTINGS and CHANGELOG are now **icon buttons** (gear, document) rather than text links, each
  44×44 with an accessible label. The wordmark, name field, PLAY and version are unchanged.

### Spawn pressure, per zone
| Zone tier | 0 outer | 1 | 2 | 3 | 4 | 5 core |
| --- | --- | --- | --- | --- | --- | --- |
| Enemies per 1,500u chunk | 2.6 | 2.2 | 1.8 | 1.4 | 1.1 | 0.9 |
| Population cap | 56 | 50 | 44 | 38 | 32 | 28 |

- `ZONE_DENS` / `ZONE_CAP` in `engine.ts`; `HARD_MAX = 60` is only a safety net.
- A **top-up pass** every chunk tick refills toward ~85% of the player's zone cap, so killing does
  not leave the ring empty.
- A **visibility floor** (`ensureNearby`) keeps at least **4** enemies inside the view in tiers 0–3
  and **2** in tiers 4–5, spawned at ~78% of the view radius instead of the old 1,200u exclusion
  for this specific case.
- Measured in the harness: rim / mid / core = **54 / 35 / 29** enemies, and 4 visible within the
  screen at the rim.

### Cores and plating
- Core radius is multiplied by **√10**, i.e. **10× the area**, without changing any other part.
  Cores draw beneath the body (layer 0) and `partAt` prefers non-core parts, so the big core does
  not steal clicks aimed at legs or plates; its exposed edges are still selectable.
- Plating is no longer a circle. Every shell layer expands each live part polygon by
  `3.5 + 3.5·layer` world units, filled grey with a matching thick stroke — an extra grey copy of
  the component outline. The hit shell remains a body-sized ring (`b.radius + 6`).

### Weapons, view and ranges
- Auto-fire targets only what is on screen: `viewRadius = hypot(w,h)/2 / zoom`, with ranges clamped
  to 95% of it.
- Weapon ranges now live in `WEAPON_RANGE` (`data.ts`) and are role-based:

| Role | Weapons | Range |
| --- | --- | --- |
| Point blank | Plasma Cutter | 190 |
| Short beam | Arc Lance | 330 |
| Short spray | Acid Sprayer | 400 |
| Shotgun | Scatter Driver | 420 |
| Brawler | Sonic Emitter | 470 |
| Standard turret | Pulse Turret, Venom Injector, EMP Cannon | 560 |
| Mid machine gun | Heavy Machine Gun | 650 |
| Bypass | Shield-Bypass Laser | 700 |
| Chain | Chain Lightning | 780 |
| Area | Flak, Gravity Well, Mine Layer | 800 |
| Missile | Seeker Pod | 850 |
| Precision | Homing Missile Launcher | 900 |
| Cluster | Cluster Pod | 950 |
| Sniper | Rail Driver | 1150 |

- New save setting **`showRanges`** (default off) draws a faint filled circle plus dashed rim in the
  weapon's role colour for every fitted weapon.

### Optics
- Wide-Field Optics zoom term raised 7×: `zoomMin = clamp(1/(1 + 2.8·eff), 0.04, 1)` (was
  `0.4` / `0.28`). Maximum zoom-out range is therefore 25× the default view instead of 3.6×.

### Crafting visuals
- `RecipeIcon.tsx` draws an actual SVG silhouette for every recipe: turrets, scatter barrels,
  missile pods, beams and rails, EMP rings, cutters, acid nozzles, chain lightning, flak, gravity
  wells, mines, drones, sonic arcs, shields, layered plate, optics and abilities. Icons appear in
  the recipe list (34px) and the detail header (54px), tinted by weapon role.

### Portable build
- `scripts/export-static.sh` produces a static `out/` and zips it with `serve.py` and `PLAY.txt`.
  The zip has no API routes: progress is localStorage + save codes, and the shared map is off.

## 0. Title screen, settings, changelog and versioning (v1.2)

- **Title screen is the loading screen.** `WOFGUE.IO` is the whole design: a very large, tightly
  tracked wordmark (`clamp(2.9rem, 14.5vw, 10.5rem)`) with a neon glow, modelled on florr.io's
  full-screen logo. There is no callsign label and no tagline — only the wordmark, the name field,
  PLAY, the SETTINGS / CHANGELOG links and the version at the bottom.
- **Neon grid backdrop** (`Backdrop.tsx`, a canvas): the same 100u/500u grid the game draws, at
  92/460 screen pixels with a slow drift, a cyan central glow and a vignette. Small geometric
  insects (beetles, moths, centipedes, mantises, 7–20 px) drift across it with a soft pulse and
  wrap at the edges. `prefers-reduced-motion` freezes the animation.
- The grid and insects are cosmetic only: `pointer-events: none`, `aria-hidden`, and no link to
  the simulation.

## 0. Title screen, settings, changelog and versioning (v1.1)

- **Wofgue.io start screen** (`/`): the title, a callsign field on top (pre-filled when a name is
  already saved, empty on a fresh browser), a full-width **PLAY** button, **SETTINGS** and
  **CHANGELOG** buttons side by side, and the version number in small text at the bottom.
  The game itself is still `/play`; the in-game `⌂` returns here.
- **Play requires a callsign.** An empty name focuses the field and shows "Enter a callsign to play."
  The name is stored in the local save and pushed to the shared map as before.
- **Real settings panel** (`src/components/SettingsPanel.tsx`), shared by the title screen and the
  in-game gear button (`⚙`, bottom right) and the Nest → SYSTEM tab. It contains every setting:

  | Setting | Key | Default | Effect |
  | --- | --- | --- | --- |
  | Automatic crafted weapons | `autoFire` | `true` | Crafted weapons fire on their own (B still toggles) |
  | Component hover info | `showCompInfo` | `true` | Name / rarity / value / mass card under the cursor |
  | Auto-sell docked components | `autoSell` | `false` | Sell on arrival instead of storing |
  | Callsign | `name` | `""` | Shown to other pilots, max 16 characters |
  | Save code | — | — | Export to clipboard, or paste + restore |
  | Reset all progress | — | — | Two-step confirm, wipes the local save |

- **Hover info.** `Game.compUnderCursor()` polygon-tests loose components with 16u of slack.
  The hovered part gets a dashed rarity-coloured ring and a 216×84 screen-space card showing name,
  `RARITY · category`, `◈ value CR`, `⚖ mass` and the species. Disabled by `showCompInfo`.
- **Snake boss disabled.** `SNAKE_ENABLED = false` in `src/game/engine.ts` makes `BOSS_SP = -1`, so
  the centre zone no longer spawns it. The species, its parts and its bestiary entry remain; flip
  the flag to bring it back.
- **Changelog.** `src/game/changelog.ts` holds `VERSION` and the short, dated release list drawn by
  the title-screen CHANGELOG button; this file keeps the long-form history. Versioning: `1.1` for a
  feature release, `1.0.1` for a fix or small quality-of-life change. Every release bumps both
  `VERSION` and the entry list.
- **Responsive layout.** Title scales with `clamp(2.75rem, 14vw, 4.5rem)`, the column is capped at
  24rem, panels at `min(94vw, 32rem)` / `max-height: 88dvh`, and the game canvas keeps its
  full-window sizing, so phones, tablets and desktop browsers all get the same screens.

## 1. Missile targeting (Homing Missile Launcher)

| Rule | Implementation |
| --- | --- |
| Marking | Right-click an enemy piece. The cursor is hit-tested against every part polygon; the part under the pointer becomes the lock. |
| Harpoon coexistence | If no launcher is equipped **or** the cursor is not over an enemy, right-click fires the tether exactly as before. Marking never consumes a tether. |
| Automatic fire | While a mark exists the launcher fires without any mouse button held, one missile per `1.7s / (0.7 + 0.3·eff)`. |
| Re-targeting | Right-clicking a different piece replaces the mark and resets the launcher reload to a full cycle. Re-clicking the same piece does not reset it. |
| Flight | Precision missiles (`kind 4`) ignore **all** collision — other enemies, shields, armour shells and other pieces of the same body — and steer to the marked piece's current world position at 9 rad/s, accelerating to 1,500 u/s. |
| Impact | Damage is applied directly to the marked piece (`3.1 × base cannon damage × efficiency`), plus a small 74u splash. |
| Lost marks | If the marked piece is destroyed or dislocated (severed), or the enemy dies, the mark clears and `TARGET LOST` is shown. In-flight missiles revert to ordinary warheads. |

## 2. Automatic crafted weapons

- Crafted weapons no longer read the fire button. Every weapon acquires its own target and fires
  when something is inside its engagement range.
- **B** or the **AUTO ON/OFF** pill at the top of the screen toggles the whole rack. The setting is
  saved (`save.autoFire`, default `true`).
- Base cannon (left click / Space) is unchanged and still manual.

Engagement ranges and damage multipliers (damage = `st.dmg × multiplier × efficiency`):

| Weapon | Range | Dmg × | Cooldown |
| --- | --- | --- | --- |
| Pulse Turret | 650 | 0.60 | 0.45s |
| Scatter Driver | 470 | 0.55 ×6 | 0.75s |
| Seeker Pod | 1,000 | 2.20 ×2 | 1.50s |
| Arc Lance | 420 | **0.22** | 0.12s |
| Homing Launcher | mark | 3.10 | 1.70s |
| Shield-Bypass Laser | 820 | **0.16** | 0.10s |
| Heavy Machine Gun | 780 | **0.10** | 0.075s |
| EMP Cannon | 640 | 1.40 | 2.60s |
| Plasma Cutter | 250 | 1.10 | 0.18s |
| Acid Sprayer | 460 | 0.30 ×3 | 0.16s |
| Chain Lightning | 900 | 1.60 | 0.80s |
| Flak Cannon | 950 | 1.30 | 0.90s |
| Rail Sniper | 1,400 | 2.40 | 1.40s |
| Gravity Bomb | 900 | 2.80 | 3.20s |
| Mine Layer | 900 | 2.50 | 1.10s |
| Swarm Drones | 720 | 0.40 ×2 | 0.55s |
| Venom Injector | 700 | 0.45 ×2 | 0.35s |
| Sonic Disruptor | 600 | 0.60 | 1.60s |
| Cluster Rockets | 1,100 | 1.70 | 2.20s |

Spray weapons were cut hard: HMG `0.32 → 0.10`, bypass laser `0.50 → 0.16`, arc lance `0.45 → 0.22`.
All ability damage also multiplies `st.dmg` (Cannon Damage upgrade level), so every crafted weapon
and every ability scales with base damage and overdrive.

## 3. Armour plating (epic and above)

- Epic / legendary / mythical enemies gain **1 / 2 / 3** thin grey shell layers.
- Each layer has `5 × HP_MUL[tier]` HP: **400** (epic), **1,800** (legendary), **8,000** (mythical) per layer.
- Kinetic, missile, flak and explosive damage is reduced by **70%** against plating.
- **Lasers and shockwaves do zero damage and are stopped** — beams terminate on the shell, shock
  AoE is absorbed, EMP stuns but does not burn, chain lightning and sonic do nothing.
- Precision missiles (right-click marks) bypass plating entirely and strike the marked piece.
- Layers break one at a time with a grey particle burst; the HUD shows a pip per remaining layer.
- Long-bodied species (centipede, snake) use their segmented armour instead of a bubble shell.

## 4. Spawn pressure

Per-zone densities and caps are listed in section 0 (v1.3). In short: the outer rings are the
busiest (2.6 enemies/chunk, cap 56), the core is the calmest (0.9/chunk, cap 28), a top-up pass
refills to ~85% of the local cap, and a visibility floor guarantees 2–4 enemies on screen. Spawns
still avoid the base safe zone and usually the area within 1,200u of the player (the visibility
floor may place one at the edge of the screen).

## 5. Serpentine bodies

- **Centipede**: `12 + 3×tier` segments (27 at tier 5), body length `9 + 0.8×tier` units
  (≈4,400 world px at tier 5, ~2.5× the old length). Wave amplitude `0.22 × size`, wave number
  `0.8` per segment, speed 6. All segments, tergites, legs and head ornaments carry a segment index
  so the whole animal bends together.
- **Snake** (renamed from World Serpent): `40 + 5×tier` segments (65 at tier 5), length
  `7 + 0.3×segments` units (≈9,100 world px, ~5.4× the old length), radius ≈2,900.
  Wave amplitude `0.5 × size`, wave number `0.42`, speed 2.4. Speed 430, turn 3.6, and it weaves
  its heading while chasing so it never turns rigidly.
- The lateral offset is applied consistently to rendering, hit-testing, tether/drop world
  positions, contact checks and severed-debris geometry.
- **Length tuning:** the brief asked for "probably 10x". At 10x the snake would be longer than
  the core zone is wide (≈16,800px against a 16,000px world radius) and its collision radius would
  swallow the arena, so it was capped at ~5.4x (≈9,100px). One constant controls it:
  `buildSnake`: `L = 7 + 0.3 * n`. Raise `0.3` for a longer animal.

## 6. UI and tone

- Removed the **HANGAR** lettering and its subtitle from the base; replaced with a hex sigil.
- Removed the **CRIPPLED** / **IMMOBILISED** warnings entirely.
- Removed all text from the health/shield/boost bars (both player HUD and enemy bars).
- Tether indicators are now bare harpoon glyphs; colour alone encodes ready / flying / hooked /
  reel-in, with load and cable-integrity slices.
- The nest panel title is an icon; the base prompt is a hex button; `SHIP DESTROYED` is now
  `CORE DESTROYED` and "rebuilding at hangar" is "reforming at the nest".
- Copy switched away from ship language ("craft", "nest", "integrity", "callsign").

## 7. Website and save codes

- `/` is now the Wofgue.io title screen (callsign, PLAY, SETTINGS, CHANGELOG, version); the old
  feature grid, how-to-play and controls-table site is gone, and save-code entry lives in SETTINGS.
- The game moved to **`/play`**; the in-game `⌂` button returns to it.
- **Save code format:** `NH1-<checksum base36>-<base64 JSON>`; checksum is a 31× rolling hash mod
  1,000,003. Invalid or truncated codes fail closed.
- Export copies the code to the clipboard from **SETTINGS** (title screen, gear button or Nest →
  SYSTEM); paste a code there to restore.
- Restoring validates and checksums the code, writes it to the local save and updates the title
  screen immediately.
- Server-side profiles (`/api/save`) still work when `DATABASE_URL` is configured; without a
  database the browser is the vault.

## 8. Compatibility and migration

- Save version stays **2**; `autoFire` is additive and defaults to `true`.
- Components whose species was `"World Serpent"` are migrated to `"Snake"` so old crafting
  requirements still match.
- `encodeSave` / `decodeSave` are exported from `src/game/data.ts`.

## 9. Verification

```
npx tsc --noEmit
npx eslint .
npx next build
node /tmp/h1.js   # all species/tiers/zones/weapons/abilities tour
node /tmp/h2.js   # original mechanics assertions (lock test updated to right-click)
node /tmp/h3.js   # plating, precision missiles, auto-fire, spawn cap, save codes, body length
```

All four pass; `h2` now asserts that no boss spawns while `SNAKE_ENABLED` is `false`. `h3` asserts, among other things: epic=1 / mythical=3 layers, lasers and shockwaves
deal 0 to plating, kinetic hits deal 30%, a marked far-side piece is hit through the body, crafted
weapons fire with no mouse input, the toggle stops them, and population peaks at 12 in a 20-location
tour.
