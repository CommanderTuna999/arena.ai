## 0.3. v2.30.7 — Cannon equipment and damage

- Equip owned cannons from their hover cards; equipped cannons show a disabled Equipped button. Removed the admin test equipment block from upgrades.
- Gatler MK1 now deals 70 base damage per shot and Scatter MK1 deals 75 per projectile.

## 0.3. v2.30.6 — Cannon purchases

- Purchase cannons directly from their hover card; already-owned cannons show a disabled Owned button.

## 0.3. v2.30.5 — Cannon details

- Cannon details return on hover; clicking an owned cannon opens its upgrades. Cannon labels now say purchase and equipped.
- Restored Peashooter and Gatler projectile visuals while keeping Scatter energy orbs.

## 0.3. v2.30.4 — Cannon tree and admin

- The cannon tree fills the tab; selecting a cannon opens its full upgrade page with complete names.
- Scatter fires larger glowing orbs. Admin mode can temporarily test any cannon, and infinite credits applies to cannon purchases.

## 0.3. v2.30.3 — Shields and cannon handling

- Enemy energy shields stay active through all attacks until their generators are destroyed.
- Scatter upgrades tighten the shotgun spread; Gatler now spins up before firing and slows down when released.

## 0.3. v2.30.2 — Projectile visuals and dash shields

- Scatter MK1 fires glowing orbs, and ordinary kinetic rounds are now round instead of tracer lines.
- Enemy shields no longer retract during dashes and charges.

## 0.3. v2.30.1 — Dragonfly aim

- Dragonfly spray projectiles travel faster and lead moving targets more accurately.

## 0.3. v2.30.0 — Peashooter branches

- Added Peashooter MK2, Gatler MK1 and Scatter MK1, with their own crafting bills and upgrades.
- The base prompt now displays E.

## 0.3. v2.29.22 — Multiplayer test smoothing

- Smoothed projectile motion in the multiplayer test.

## 0.3. v2.29.21 — Respawn timer

- The respawn countdown catches up when returning to a background tab.

## 0.3. v2.29.20 — Multiplayer test vision

- Matched the multiplayer test’s default view to the main game and reduced off-screen updates.

## 0.3. v2.29.19 — Harpoons and multiplayer test

- Harpoons prioritise the component hovered at launch.
- Improved multiplayer test playback and connection diagnostics.

## 0.3. v2.29.18 — Multiplayer test performance

- Reduced multiplayer test snapshot bandwidth and rendering overhead.

## 0.3. v2.29.17 — Component magnet

- The component magnet collects eligible items immediately; the pull animation is cosmetic.

## 0.3. v2.29.16 — Multiplayer test

- Improved multiplayer test reconnection and reduced rendering and network overhead.

## 0.3. v2.29.15 — Username wording

- Account and settings labels now use username.

## 0.3. v2.29.14 — Multiplayer test performance

- Reduced multiplayer test bandwidth and processing overhead.

## 0.3. v2.29.13 — Multiplayer test

- Multiplayer test.

## 0.3. v2.29.12 — Chat focus and guest notice

- Empty Enter releases chat typing focus without closing the panel. The title screen explains that guests must log in to save progress.

## 0.3. v2.29.11 — Chat Enter fix

- Sending a chat message with Enter keeps chat open; Enter on an empty field closes it.

## 0.3. v2.29.10 — Red barriers

- Changed solid map walls to glowing red barriers without changing their collision.

## 0.3. v2.29.9 — Chat, map and contact

- Own chat messages are white; Enter sends and closes chat, and the input explains the shortcuts.
- The minimap starts focused and still cycles through the same views. Fixed shallow enemy contact damage being lost during separation.

## 0.3. v2.29.8 — Chat focus and colours

- Your own chat messages are coloured differently, including queued and recent messages. Clicking outside the typing field releases keyboard focus so movement works again.

## 0.3. v2.29.7 — Component storage

- Removed the gameplay component-storage limit and refunded existing Cargo Bay upgrade costs. Auto-sell still works when enabled.
- A brief warning on joining flags large inventories that could slow the game or exceed browser storage. Larger cloud saves no longer use the browser keepalive size limit.

## 0.3. v2.29.6 — Chat and Lunar Moth

- Chat queues offline messages locally, retries when connected, and fades its message panel after five seconds of inactivity. Incoming messages reveal the expanded panel again.
- Fixed chat message sanitization; renamed Lunar Moth and migrated older saved components without breaking recipes.

## 0.3. v2.29.5 — Chat connection diagnostics

- Chat shows a stable retry status; the chat service accepts known project website aliases and reports rejected origins.

## 0.3. v2.29.4 — Mediator charge and reload

- Mediator needs at least two seconds of continuous charge before firing; reload starts after the beam ends.

## 0.3. v2.29.3 — Changelog dates

- Corrected the displayed release dates from v2.12 onward: v2.12.0 through v2.15.0 are dated 21 November, and later versions are dated 22 November.

## 0.3. v2.29.2 — Core contact

- Enemy cores no longer deal contact or body-attack damage; other enemy parts and attacks still can.

## 0.3. v2.29.1 — Map and admin fixes

- Removed the camera rectangle from the map. Infinite Damage now deals infinite damage to hit parts and armour instead of 100 times damage.

## 0.3. v2.29.0 — Map controls

- Press M to glide between the large map, a focused local minimap and the default minimap. Removed enemy dots and made the player marker a green dot.

## 0.3. v2.28.1 — Chat controls

- Removed floating damage numbers. Chat opens on a new message or with slash or Enter; collapse it to a button with an unread count.

## 0.3. v2.28.0 — Chat groundwork and tree layering

- Fixed cannon tree popup layering so other nodes cannot draw over its opaque background.
- Added a chat panel for local Ultra notices and a standalone WebSocket chat service. Online chat requires deployment/configuration; shared multiplayer combat is not yet implemented.

## 0.3. v2.27.1 — Sharper salvage

- Increased cached component resolution and render very large pieces as vectors instead of stretching low-resolution images.

## 0.3. v2.27.0 — Combat feedback

- Added colour-coded damage numbers and critical hit indicators, grouping rapid damage ticks for readability.
- Removed rarity colouring from maps and made cannon-tree popups fully opaque.

## 0.3. v2.26.0 — Performance and scale

- Cached detailed salvage artwork and spatially indexed enemy separation. All enemy parts remain visible at every zoom.
- Ultra body contact destroys lower-rarity enemies without rewards or bestiary credit. Bestiary art uses a shared world scale; armour plating is one third as thick.
- Wall collision now accounts for the full player hull and a smaller enemy hitbox, including contact pushes. Removed the word mass from the component hover card.

## 0.3. v2.25.2 — Ultra scaling

- Ultra normal-piece health and damage are each 135× the mythical equivalent (13.5×, multiplied by 10). Armour remains 16× average Ultra normal-piece health.

## 0.3. v2.25.1 — Ultra visual and notice fixes

- Restored normal species colours for Ultra enemies; Ultra rarity components use black with a subtle white gradient instead of an animated enchantment glint.
- Ultra spawn and defeat messages now appear in a high-contrast bottom-left overlay above other UI for ten seconds, independent of ordinary notifications.

## 0.3. v2.25.0 — Ultra rarity

- Ultra enemies have 13.5× mythical normal-piece health, armour at 16× average normal-piece health, and 3× mythical size. Each ordinary mythical spawn has a 0.5% chance to become Ultra.
- Ultra pieces are black with an animated violet enchantment glint. Ultra enemies guarantee mythical drops, plus independent 2% Ultra part and 10% Ultra core chances.
- Added Ultra spawn/defeat notices, a screen-space boss health and armour display, and Ultra bestiary/admin entries.
- Live preview uses the independent dev output so a production rebuild cannot invalidate a running server. Combat is locally simulated; defeat credit distinguishes the local player from base damage, not other clients.

## 0.3. v2.24.0 — new map and Ultra zone

- Replaced the maze with the supplied map, placing the base at the top-left and increasing rarity toward the bottom-right.
- The new Ultra map zone currently spawns 80% mythical and 20% legendary enemies; Ultra enemy and component tiers are not yet available.
- Added map-point teleporting to the admin panel, with wall destinations snapped to nearby open ground.

## 0.3. v2.23.2 — Mediator sparks

- Added violet energy shards and pale sparks around the Mediator's muzzle throughout its sustained beam.

## 0.3. v2.23.1 — Mediator handling

- Removed the charge progress bar; the charging animation remains.
- Mediator's sustained beam turns at one tenth the normal turning rate. Initial and continuous recoil are tripled.

## 0.3. v2.23.0 — thicker walls and Mediator charge

- Rebuilt the connected maze with walls approximately five times thicker and softened corners. The mythical-to-other walkable area ratio remains approximately 3:1.
- Mediator displays charge progress as a percentage. Full charge takes 70 seconds unupgraded, decreasing by six seconds per charge-rate upgrade to 10 seconds at level 10; beam damage scales with charge.

## 0.3. v2.22.0 — connected walls and balanced rarity zones

- Rebuilt the original maze with thick connected wall networks, branches and connected walkable corridors.
- Adjusted rarity bands so mythical covers approximately three times the combined walkable area of the other zones.

## 0.3. v2.21.0 — original labyrinth and Mediator polish

- Replaced the traced map with an original, larger connected partition labyrinth. Its large mythical region leaves room for future rarities; zones increase in rarity with distance from the base.
- Cannon-tree nodes fit without horizontal scrolling and prerequisite connectors share aligned coordinates.
- Mediator has a segmented charging animation, crisp layered beam, continuous recoil and restricted movement while firing.

## 0.3. v2.20.0 — expanded world and rarity zones

- Enlarged the reference-inspired map and added 48 interior wall segments. Every walkable cell remains reachable from the base.
- Rarity zones progress outward from the base: common below 12k units, uncommon 12–25k, rare 25–40k, epic 40–56k, legendary 56–74k, mythical 74k+. Enemy rarity can vary within a zone.
- The minimap displays these zones in their rarity colours. The map leaves space for future rarity tiers. Population slots are reserved for nearby refills so the global enemy cap does not leave explored regions empty.

## 0.3. v2.19.0 — combat and session fixes

- Lunar moth rotating lasers deal seven times the previous damage.
- Fencer MK1 visibly charges its fifth attack before firing energy damage with strong recoil.
- Every player-severed disconnected component rolls its normal independent drop chance.
- Cannon-tree connections follow each chassis prerequisite, including all Skewer MK1 tier-2 branches.
- Leaving resets the run's world; reopening or reloading starts at the home screen while retaining pilot upgrades.
- Update checks no longer pause gameplay for a commit that has not deployed.

## 0.3. v2.18.0 — new map and tier-2 cannon upgrades

- Replaced the circular arena with a connected corridor map based on the supplied layout. Its walkable area is approximately five times the old arena; the base is in the lower open region.
- Skewer MK2 has critical chance, critical damage, penetration, damage, additional armour damage and energy shot chance tracks. Fencer MK1 has critical chance, critical damage, penetration and damage. Mediator has critical chance, critical damage, penetration, damage, charge rate and beam width.
- Mediator releases a sustained three-second energy beam, with critical damage, charge speed and beam width affecting combat.
- Halved the large spider web projectile and tripled the radius of its deployed web.
- Component bills accept the required rarity or higher, with distinct components allocated to each bill slot.
- Drops: approximately 5% per non-core part at the enemy's rarity; 90% per core (55% for common enemies). For non-core parts from common enemies, an uncommon roll is tried first at 30%; only if that fails is the 5% common roll attempted. Salvage bonuses modify these rates.

## 0.3. v2.17.0 — tier-2 cannons, faster enemy rounds, the moth's domain and its shield

- **Tier-2 cannon tree complete** (`data.ts`, `engine.ts`): all three branch off **Skewer MK1**.
  **Skewer MK2** — a 1200-damage hitscan lance with a **25% chance each shot to throw an energy shot
  that bypasses enemy shielding**. **Fencer MK1** — a rapid 200-damage jab on a 0.3s interval;
  **every fifth landed shot unleashes a charged 2.5k energy shot** (a `fenceShots` counter on the
  player; the combo shot is taller pierce and a bigger blast). **Mediator MK1** — **hold the trigger
  to charge** a devastating energy beam (builds to 1.0 over `chargeTime`), then **release to fire**
  at `dmg * (0.35 + 0.65*charge) * chargeDmg` with a large muzzle burst, ring, shake and recoil.
  No tier-2 weapons exist for Peashooter or Workhorse — the sheet only branches T2 off Skewer MK1.
- **Tier-1 crafting recipes per the sheet** (`data.ts`): the **antenna, head and core requirements
  are now uncommon**. Skewer MK1 = 2 common legs, 1 uncommon antenna, 1 common head, 2 uncommon
  cores, 500 credits. Peashooter MK1 = 2 common legs, 2 uncommon cores, 300 credits. Workhorse MK1
  = 2 common legs, 1 uncommon head, 1 uncommon core, 500 credits.
- **Enemy projectiles much faster** (`enemies.ts`): all `GUN_SPECS` speeds raised — gun 300→720,
  minigun 720→1500, scatter 420→980, heavy 950→2100, laser 1500→2600.
- **Inertial Dampers removed** (`data.ts`, `engine.ts`): dropped from `UPGRADES`, `Stats`,
  `computeStats`, `hurtPlayer` knockback resistance and `applySlow` resistance — knockback and
  slows now land at full strength.
- **Spider pull is unresistable** (`engine.ts`): the pull is now a **direct positional reel** — the
  ship is walked toward the spider at a fixed 1700 u/s via positional offsets, so thrust and inertia
  cannot fight it. Cancels only on death, expiry, safe zone, or reaching the spider's body.
- **Moth missiles** (`enemies.ts`, `engine.ts`, `render.ts`): now **smaller, much faster purple
  darts** (speed 1000), **summoned in a ring around the moth** instead of overlapping at one point,
  each leaving a **streaming purple trail**.
- **Domain lag fixed** (`engine.ts`): an `Enemy.domainFxT` throttles the domain's per-frame `ringFx`
  to one every 0.18s.
- **Moon and domain rebuilt in the JJK style** (`render.ts`): the domain is now a **black void** with
  a **glowing pulsing rim** and a **large moon with glowing watchful eyes** that open wider with the
  phase and craters. A **JJK-style cutscene** plays on domain expansion: a **violet flash** and the
  **"DOMAIN EXPANSION"** title streaking across the screen (`Game.cutscene`, `drawCutscene`).
- **Moth's purple Shield ability works** (`enemies.ts`, `engine.ts`, `render.ts`): the moth summons a
  **purple shield bubble** holding **5% of its max health**; incoming damage is **absorbed into the
  bubble** (`buffHp`) while it is up, and the moth **regenerates 5%/s** of its max health while the
  bubble persists (6s duration). A pulsing radial fill + glowing stroke renders the dome.

## 0.2. v2.16.0 — contact attacks break their own shields, full-aggro guns and tier-2 cannons

- **Contact attacks retract their own shields** (`engine.ts`): a dragonfly (and any future body whose
  attack reaches the ship by contact) **retracts every frontal shield panel for the whole of a grab,
  sting, charge or swing**, so the pincer grab cannot be blocked by the dragonfly's own shield wall.
  A body-level `shieldDownT` timer is kept topped up by `runAct` while any contact ability runs and
  bleeds off once it ends; the shield projection loop skips re-projecting while it is live.
- **Weapon range is the full aggro reach** (`engine.ts`): every enemy mount's firing `range` is now the
  body's full `aggroRange`, and an **aggroed body keeps firing at the ship even when the ship sits past
  that range** — the range is the reach, not a firing gate (the `dd < range` term is gone from the firing
  check). **Unaggroed enemies snap to attention the instant they take their first damage** (`trackDamage`
  now sets `e.aggro = true`).
- **Tier-driven drop rates** (`engine.ts`, `data.ts`): every **non-core component drops at ~5% at the
  enemy's own rarity**; the **core drops at 90%** (**55% on a common body**); a **common body
  additionally rolls an uncommon-tier component at 30%**. The old `rollTier` roll is gone.
- **Overheat vignette only on overheating guns** (`render.ts`): `drawHeatVignette` returns early unless
  `overheat > 0`, so chassis that never jam no longer flash the screen-edge warning.
- **Tier-2 cannon tree begun** (`data.ts`): the tier-2 row is built out per the design sheet (see
  v2.17.0 for the full trio). **Tier-1 crafting recipe check**: `homing` (cd 1.70→1.8) and
  `rail` (cd 1.82→1.4) are the slightly-altered tier-1 recipes.
- **Cannon tree helper text removed** (`GameClient.tsx`): the "hover a node for its numbers…" and "A
  button greys out…" paragraphs are gone.

## 0.1. v2.15.1 — ability behaviour: webs, pincers, stings and lasers

- **Spider webs reel and trap** (`engine.ts`, `enemies.ts`, `render.ts`): the **Web Volley**'s
  three small webs are each **tethered to the spider by a visible silken string**, and a hit
  **reels the ship back to the spider** (1.4s pull) instead of the spider lunging. The large
  **Web** now **lands on the floor** and **expands into a real spider-web zone the size of the
  spider** (1.4x scale) that **slows** the ship (0.5x) and **poisons** it (0.2x eDmg/s) while it
  lasts.
- **Scorpion pincers and tail** (`engine.ts`, `enemies.ts`, `render.ts`): **Pincer Grab** clamps
  the ship with drawn pincer claws; **Tail Sting** is now a real **`sting`** ability — the tail
  **uncoils and extends** a venom-glowing stinger needle toward the ship, the scorpion **lunges in**
  to sting (knockback 500, venom), then recoils.
- **Moth lasers and missiles** (`enemies.ts`, `render.ts`, `engine.ts`): **Rotating Lasers** are
  now **long, thick real lasers** (1100u reach, a wide glowing body with a hot white core and a
  muzzle node). **Missiles** now spawn as **missile** projectiles (they were silently dead as orbs)
  so the homing volley actually appears. **All enemy projectiles render ~5x larger** so every shot
  is clearly visible.

### Under the hood

- **`EProj` gains `tether` / `webDrop` / `tx` / `ty`** (`engine.ts`): a web-drop projectile lands
  at its aim point and spawns a web zone; a tethered volley web, on hit, sets the player's `pull`
  so the ship is reeled in. **`Puddle` gains `poison` / `web`** so a landed web applies both slow
  and poison.
- **New `runAct` `sting` case** (`engine.ts`): wind-up → lunge toward the ship → contact deals venom
  damage with knockback, then recoil. **`AbilityType` gains `sting`**; **`AbilityDef` gains
  `webDrop` / `tether`** (`enemies.ts`).

## 0. v2.15.0 — enemy abilities, bestiary drops and cannon quality of life

- **Four enemies gained their full ability kits** (`enemies.ts`, `engine.ts`): the **dragonfly**
  dashes, sprays an orb volley, chomps the ship and unleashes a shockwave ring; the **scorpion**
  pincer-grabs the ship and tail-stings it; the **spider** webs, fires a fast web volley, bites and
  pulls the ship; and the **moth** fires shot bursts, rotating lasers, homing missiles and opens a
  moon **Domain**.
- **The moth's Domain** (`engine.ts`): on open it heals the moth to full and boosts its damage and
  health, scaling with the moon phase from **3x to 10x** over the domain's three minutes. The moon
  image grinds the ship for **5% of max hull per second** and feeds the moth **1% of max health per
  second**, both scaling with the phase. It cannot be reused while open and restores the moth to its
  original health when it closes.
- **Bestiary drops and one-word abilities** (`Bestiary.tsx`): each ability renders as a single word
  (e.g. "Pincer Grab" → Grab, "Rotating Lasers" → Lasers), and every component drop chip now shows
  its kind, rarity and drop percentage.
- **Drop rates driven by one kind table** (`data.ts`, `engine.ts`): `KIND_DROP_RATE` is the single
  source of truth — core 90%, segment 35%, armor 30%, leg 25%, arm 35%, wing 25%, weapon 50%,
  shield 50%, spike 12% — rolled against the salvage stat, which is now a **multiplier** (1 + 0.25
  per salvage level) rather than a percentage.
- **Cannon quality of life** (`GameClient.tsx`): the weapon-stats hover card no longer shows when
  the cannon is disabled, weapon descriptions are quoted, and the hover helper text is gone.
- **Ability intervals follow rarity** (`enemies.ts`): cooldowns step down a rarity ladder —
  17, 12, 8, 3, 1.75, 1 seconds — instead of a flat cooldown.

### Under the hood

- **New `AbilityType` members** (`enemies.ts`): `grab`, `beam` and `domain` join the existing set;
  `AbilityDef` gains `chomps`, `chompCd`, `hold`, `beams`, `beamSpin` and an optional `cd`.
- **`runAct` cases** (`engine.ts`): `grab` lunges, holds and chomps on a period, then releases;
  `beam` winds up then rotates one or more beams that deal per-tick damage and shove the ship;
  `domain` runs the open/scale/close lifecycle described above.
- **`ABILITY_INTERVALS`** (`enemies.ts`): `[17, 12, 8, 3, 1.75, 1]` indexed by rarity tier;
  `startAct` falls back to it when an ability has no explicit cooldown.
- **`KIND_DROP_RATE`** (`data.ts`): the kind table plus `KIND_DROP_PCT` helper; `dropChance` is now
  `1 + 0.25 * L('drops')` and the `drops` upgrade reads `x1.25 drop`.

## 1. v2.14.1 — enemy attachment damage, and overheat reads on screen

- **Enemy attachment damage matches the sheet** (`enemies.ts`): every mount's per-projectile
  damage multiple is now the sheet's own — basic cannon **0.5x**, scatter shotgun **1.2x**,
  rotary gun **0.2x**, laser **1.0x**, heavy rail **17x**. The basic cannon's round is large and
  slow (r 14, 300 u/s); the scatter throws seven large pellets; the rotary cools for 10 s after
  its burst.
- **The heavy rail's reach is the body's own aggro** (`engine.ts`): instead of a fixed 1200 u, the
  mount fires with the same range the body notices you at (`aggroRange`), so a rail can hit
  anything it can see and nothing it cannot.
- **The laser is a held tracking beam** (`engine.ts`): damage is dealt per tick while it stays on
  the ship, starting at the ramp's floor (0.35x) and climbing to the sheet's full **1.0x** over
  three seconds of unbroken contact. Breaking the line drops the ramp.
- **Overheat reads on screen** (`render.ts`): the barrel now runs a real heat ramp — a dull red
  glow climbing to a hard white-hot core, heat shimmer rising off the bore, and a muzzle bloom that
  grows with the ramp. Near the top the mount shudders and the bore pulses white as the last
  warning before the jam. A warm glow also bleeds in from the edges of the screen as the gun
  cooks, climbing to a red-orange ring at the top and pulsing through the cool-down.

### Under the hood

- **`GUN_SPECS`** (`enemies.ts`): `dmg` is the sheet's per-projectile multiple for each of the five
  mounts; the basic cannon's round is resized to be genuinely large and slow, and the rotary's
  cool-down is the sheet's 10 s. `Part.beam` tracks a laser mount's held-beam ramp; `LASER_RAMP`
  / `LASER_RAMP_MIN` drive the climb.
- **Rail range** (`engine.ts`): `GunSpec.aggroRange` marks the rail; the weapons loop resolves its
  range to `aggroRange(e)` rather than a constant. `aggroRange` is factored out of the notice
  check so the two can never disagree.
- **Laser beam** (`engine.ts`): the track mount takes its own branch — it deals `eDmg * dmg * ramp
  * dt` per tick, pushes a `beams` line to the ship, sparks at both ends, and decays its ramp when
  the line breaks.
- **Overheat visuals** (`render.ts`): `drawCannon` replaces the single muzzle glow with the stepped
  barrel ramp, rising shimmer, and the near-top shudder; `drawHeatVignette` adds the screen-edge
  warm ring.

## 1. v2.14.0 — Balance changes

- Balanced some stuff ig

### Under the hood

- **CANNON tree as a diagram** (`GameClient.tsx`): the Stinger is the root at the bottom, a trunk
  climbs to a bus and each tier 1 chassis hangs off it as a compact node — silhouette, name, state.
  A node opens into the full card (sheet line, damage/rate/reach, the component bill, the BUILD
  button) only while it is hovered or focused, and expands downward from the top row and upward from
  the root so it never leaves the panel. Taking a gun in a tier greys out the rest of that row
  (`.opacity-35 .grayscale`), which is the one-gun-per-tier rule made visible.
- **Upgrade nodes**: the fitted gun's tracks hang off a branch spine, each with its own glyph
  (`TrackIcon`) and `+1 / +5 / +10 / MAX` buttons. A size only renders if the track could ever take
  it (`max >= n`), and greys out the moment fewer levels remain or the credits are short. The old
  one-off `FIT` button on the single-level Barrels track is gone: Barrels reads like every other node.
  The UPGRADES tab follows the same rule and the global buy-size selector is gone.
- **Sheet catch-up for the tier 1 guns** (`data.ts`): Skewer **MK1** 300 dmg / 1.2 s (was 200 / 1.5),
  Peashooter **MK1** 35 / 0.1 s, Workhorse **MK1** 55 (300 overheated). Bills are common only now:
  Skewer 2 legs + antenna + head + 6 common cores + 500 CR, Peashooter 2 legs + 6 common cores +
  300 CR, Workhorse 2 legs + head + 5 common cores + 500 CR. The `pen` track is named
  **Penetration**.
- **Overheat** (`engine.ts`, `render.ts`): `CannonDef.heatMax` / `heatSpread` / `overheat`. A hot
  Workhorse hits harder (55 → 300 at a full gauge) and throws wider (spread x4); a full gauge jams
  the trigger for 3 s with `Player.jam`, draining the gauge on the clock. Only guns with `overheat`
  can jam, so the Stinger, Skewer and Peashooter still just glow. The HUD grows a heat bar that turns
  red and counts the cool-down down, and the jammed gun vents steam on the hull.
- **Twin barrels alternate, always** (`engine.ts`): one round per trigger no matter what the Barrels
  track says; the second barrel takes turns with the first instead of firing with it, and splits the
  heat build (`heatPerShot / barrels`), so the upgrade reaches further up the damage ramp before
  cooking.
- **Swat fix** (`engine.ts`): the "get off my hull" knockback was gated on the body's *radius*, so a
  body whose pieces were destroyed kept swatting the ship out of the empty space they used to fill.
  It now also requires `touching(e, 8)` — the ship must be on a solid piece that still exists.
  `swat.test.mts` (new) proves the intact body swats, a hole in the hull does not, a carcass of legs
  does not, and one surviving piece still does.

## 2. v2.13.1 — armour priced per body, twin barrels, one gun per tier

- **Armour HP** (`enemies.ts`): `KIND_HP.armor` is only a build-time weight now. `scaleArmour()`
  re-prices every plate after the body is built as `ARMOUR_HP_MUL[tier] x` the average of the body's
  non-armour pieces — **4 / 5.5 / 7 / 9** for rare → mythical per the sheet, continuing the ramp at
  2.5x common and 3.25x uncommon. One ratio is applied to every plate, so the `hpM` variants (eyes
  0.9x, Core Guard 1.6x/2.2x) keep their spread.
- **Alternating barrels** (`engine.ts`, `render.ts`): `Player.barrelRec[]` gives each barrel its own
  recoil spring, decayed at 6.5/s. A one-round trigger on the Workhorse kicks one barrel and the next
  trigger kicks the other; the flash is now drawn per barrel from `barrelRec` instead of on the barrel
  that was *about* to fire.
- **One gun per tier** (`data.ts`): `cannonBillProblem(save, cannon, freeParts, admin)` refuses a
  second chassis of the same tier with "One gun per tier — you already fly the X". The tree and
  `Game.buyCannonChassis()` both pass `admin.on`, which is the only way past it.
- `armour.test.mts` (new) walks every species at every tier and checks the plate/average ratio.

## 3. v2.13.0 — cannon art, recoil, heat and a twin-barrelled Workhorse

- **`CannonLook`** (`data.ts`): each chassis carries `look { len, bore, hue, style }`, `muzzles`,
  `kick` and `heat`. `render.ts` draws the fitted gun on the hull from that data
  (`drawCannon()`), and `GameClient`'s new `CannonIcon` draws the same silhouette in the tree, so
  the art in the menu and on the ship can never drift apart.
- **Recoil**: `Player.recoil` springs to 1 on every trigger and decays at 5.5/s; the gun slides back
  into its mount by `0.3 x len`, the hull is shoved by the chassis' own `kick` (Stinger 9, Peashooter
  3, Workhorse 16, Skewer 34 world units/s) and `muzzleFlash` lights the barrel that fired.
- **Heat**: `Player.heat` gains `CannonDef.heat` per trigger (0.012 spray … 0.34 lance) and bleeds at
  0.34/s. The bore glows above 0.18. The overheat lockout is deliberately **not** wired yet — this
  round lands the gauge, the glow and the fields it will read.
- **Muzzles**: rounds spawn at `CannonDef.muzzles` in ship space instead of one point on the nose.
  The Workhorse has two (±5.5), so a single-round trigger alternates barrels and the barrel upgrade
  fires both at once. Peashooter draws three spigots, the Skewer a shrouded lance, the Stinger a
  flared brake.
- Descriptions are the sheet's one-liners only; extra appended flavour removed. The Stinger now carries
  the sheet's line ("Everyone's gotta start somewhere.").
- Sheet catch-up: Peashooter damage 15 → **35** per seed, and it gained **Crit Chance** and
  **Crit Damage** tracks (`dmg, acc, speed, crit, critDmg`).
- `cannon.test.mts`: muzzle counts, alternating then paired fire, recoil/flash/heat on trigger, heat
  cooling, and the description texts.

## 4. v2.12.1 — legs, cores, heads and antennae

- Chassis bills are now built from legs, common cores, heads and antennae, with legs the bulk of
  every bill. Skewer: 2 legs + 1 antenna + 1 head + 1 uncommon core. Peashooter: 2 legs + 1 common
  core + 1 uncommon core. Workhorse: 2 legs + 1 head + 1 common core + 1 uncommon core.
- `PartBill` gained `name` and `label`: a head is a `segment` part whose name contains "Head" and an
  antenna is a `spike` part whose name contains "Antenna", so `partBillMatch()` filters on the part's
  own name as well as its kind. `PART_KIND_NAME` is gone; each bill line carries its own label.
- **Admin mode fix**: `cannonBillProblem(save, cannon, freeParts)` now takes the infinite-components
  flag. The CANNON tree passes `admin.on && admin.components`, so a gun can be built with an empty
  hold while the 300 credits are still charged (`adminCredits` covers those).

# Changelog — combat, plating and website pass

Everything below is implemented in the current build. Numbers are the actual constants used by
the simulation, not design targets.

## 5. v2.12.0 — the cannon tree, chassis bills and solid shields

- **Three tier 1 cannons** (`data.ts`): `CANNONS` now holds the free tier-0 **Stinger** plus
  **Skewer** (200 dmg, 1.5s, hitscan line drawn by `beam()`), **Peashooter** (15 dmg, 0.1s, 0.22 rad
  spread, 430 u/s) and **Workhorse** (45 dmg, 0.55s, 0.03 rad spread, 720 u/s). All three
  `requires: "sting"` and cost 300 credits plus a component bill.
- **Chassis bills** (`PartBill`): a kind + rarity + count, never a species. Skewer: 2 armour + 2 arm
  commons and 1 uncommon core. Peashooter: armour + arm + wing commons and 1 uncommon core.
  Workhorse: 2 armour + arm + segment commons and 1 uncommon core. `cannonBillProblem()` gates the
  build and `cannonBillPicks()` swallows the cheapest matching parts; `Game.buyCannonChassis()`
  charges the credits, consumes them and fits the gun.
- **Per-chassis tracks** (`CannonTrackId`): `dmg`, `rate`, `crit`, `critDmg`, `pen`, `acc`, `speed`,
  `barrels`, with each `CannonDef.tracks` choosing the ones it has. `SaveData.cannon` became
  `{ id, owned, lv: { [cannonId]: { [track]: level } } }`; `migrate()` folds the old flat map (and
  the pre-v2.10 global `dmg`/`rate` upgrades) into it and prunes tracks a chassis no longer carries.
- **Barrels cap at two**: one level, 6,000 x 1.6 = 9,600 credits on the Workhorse.
- **Crit is per gun**: `cannonCrit()` 5%/level (Skewer only), `cannonCritMul()` x2 + 0.25/level.
  `firePlayer()` rolls it once per trigger and applies it to rounds or the hitscan line.
- **Solid energy shields** (`engine.ts`): `shieldContact()` now lifts the hull back onto the outside
  face on *every* frame and cancels the inward velocity; only the discharge is gated by
  `p.hitT > 0.45`. The call site no longer skips the wall while the shock is cooling down, so a
  panel can no longer be tunnelled through.
- `cannon.test.mts` rewritten: tree order, bills, consumption, per-chassis levels, the barrel cap,
  crit/accuracy maths, both migration paths, and the wall holding with `hitT = 0`.

## 6. v2.11.0 — part-aware weapon targeting, weapons shop removed

- **Targeting** (`engine.ts`): new `anyPartInRange()`, `priorityPart()`, `aimPoint()` and
  `combatTarget()`. A crafted weapon engages when *any* living piece is inside its range
  (`dist - min(part.r, 90) <= range`), and fires at the piece chosen by the sheet's order — core,
  then shield generators/weapons, then the closest living piece. All `nearestEnemy(p.x, p.y, R(id))`
  calls in `fireWeapons`, the hardpoint aiming, flak lead, rail and the drones go through it.
- **Weapons shop removed** (`data.ts`): `barrels` and `crit` upgrade entries and the `weapons`
  category are gone; `Stats.barrels = 1`, `Stats.crit = 0`. The Upgrades tab now opens on Hull.
- **Cannon** per the updated sheet: chassis renamed to **Stinger**, and its only track is
  **Damage** (30 levels, `20 x 1.45^l`). The rate track is gone — `cannonRate()` returns
  `1 / interval`, so the 0.7s interval is a property of the gun. Existing damage levels still
  migrate; stale rate levels are ignored.
- New `target.test.mts`: fires on a piece in range while the hull centre is out of range, holds fire
  when every piece is out, and asserts the core → support → closest order.

## 7. v2.10.0 — the cannon tree

Per the cannon section of the sheet.

- **`CANNONS`** (data.ts): chassis table with `tier`, `dmg`, `interval`, `speed`, `range`, `cost`,
  `costMul`, `requires`. Tier 0 is `sting` / **Stinger Mk I** — 20 damage, 0.7s interval, 640u/s,
  820u reach, free. Only the starter exists; the tree renders a locked tier 1 slot above it.
- **Per-cannon tracks**: `CANNON_TRACKS` = Bore Calibration (dmg, 30 levels, 20×1.45^l) and
  Autoloader (rate, 12 levels, 40×1.5^l), priced through the chassis `costMul`. The global `dmg` and
  `rate` upgrade entries are gone; `migrate()` copies old levels onto `save.cannon.lv`, so nobody
  loses progress. `computeStats` reads the fitted chassis for damage, rate, bolt speed and reach.
- **Engine**: `buyCannon(track, n)`, `cannon()`, `selectCannon(id)`; the cannon's bolt carries
  `boom: 1`, which fires a small `areaDamage(x, y, 34, dmg*0.3)` charge plus a ring and sparks where
  it lands.
- **Render**: the base-cannon round is a filled 5.4u glowing slug with a white core and a four-segment
  tapering tail, instead of a line tracer.
- **UI**: new CANNON tab in the hangar — tree on the left (tier 0 node at the bottom, stats live),
  the fitted gun's two tracks on the right with +1/+5/MAX.
- **Shields as walls**: `shieldInfoAt()` now returns the panel geometry, and `shieldContact()` places
  the hull back on the outside face (`r + thick + SHIP_R + 2`) after the shock, so nothing can pass
  through a live panel.

## 8. v2.9.0 — the balance sheet lands

Applied from the owner's design sheet; every value and where it lives is recorded in
[`docs/BALANCE.md`](./BALANCE.md).

- **Aggro** (`engine.ts`): `AGGRO_TIER_MUL = [1, 1, 3, 4, 5, 5]` on top of
  `AGGRO_RANGE = [140, 200, 320, 450, 590, 760]`. Measured notice radius: 66 / 99 / 1004 / 1873 /
  3062 / 3912u. Commons and uncommons are still neutral until hit.
- **Piece health** (`data.ts` `HP_MUL`): `[1, 3.75, 15, 70.5, 423, 3426.3]`. `enemies.ts` gains
  `SpeciesDef.hp` (one normal piece at common), `KIND_HP` replaces the flat `HP_BASE`, and armour
  plates are `x9` a normal piece per the sheet.
- **Enemy damage** (`enemies.ts` `SpeciesDef.dmg`, `engine.ts`): `e.eDmg = spd.dmg * DMG_MUL[tier]`.
  `GUN_SPECS` now uses the sheet multipliers: gun 0.4→0.5, scatter 0.2→1.2, minigun 0.05→0.2,
  heavy 1.8→**17**, laser unchanged. The minigun got its 10 s burst and 5 s cooldown
  (`Enemy.mgHeat` / `mgCool`).
- **Shield shock** (`engine.ts`): `SHIELD_SHOCK_MUL = 25`, capped at 85% of max hull so a body
  charging a full-health ship cannot delete it outright.
- **Player** (`data.ts`): starts at 100 hull; `hull = 100 * 1.19^level` (was 1.22), shield core
  `60 * 1.22^(level-1)` (was 1.28); plating 25→18 base / 1.5→1.4 growth, shield core 120→90 / 1.45,
  nano repair 70→55 / 1.5, reactive armour 90→70 / 1.55, dampers 100→80 / 1.65. Starting cannon is
  `CANNON_DMG = 20` on `CANNON_INTERVAL = 0.7` (was 10 damage at 4/s).
- **Rename**: every "nest" in code, UI copy and docs is now "base".

## 9. v2.8.0 — neutral commons, front-loaded shields, quieter FX and credits

### Aggro
- `AGGRO_RANGE = [140, 200, 320, 450, 590, 760]`, `AGGRO_SIZE = 0.16` (was `[360 … 1060]` at 0.22).
  Measured notice radius: 66 / 99 / 364 / 523 / 702 / 872u for tiers 0-5 (tier 0-1 values are only
  reachable once provoked — see below).
- `NEUTRAL_TIER = 1`: commons and uncommons never open a fight. `trackDamage()` sets `e.provoked`
  (`PROVOKE_T = 9s`) when the player lands a hit, which turns the proximity rule on and widens the
  notice range ×2.1 while it lasts.
- Leash stays `1.15x` notice range; losing aggro still clears `e.act` and re-arms `e.gap`.

### Shields
- `loadout()` packs `nSh = tier` panels across the leading `front = 3.6 rad` arc (body-local 0 = front)
  instead of spreading them around the ring, each widened to `slot * 0.62` (arc) or the chord length
  ×1.12 (bar) so neighbours overlap. Tier 5 carries 5 panels and seals ±80°; the tail stays open.
- `shieldStyle()` no longer sweeps non-boss panels (a sweeping front wall opens and closes gaps on its
  own). Boss keeps 0.35 rad/s.
- New `shieldContact()` in the player step: touching a live panel deals `eDmg * 1.5` as **energy**
  damage (skips kinetic plating), knocks the ship back `760 + tier * 70`, sparks, shakes and starts an
  `p.hitT > 0.45` gate so it cannot be applied per frame.

### Credits
- `dropCreditValue()` throws `1` coin per break (`2` at 60+ credits) instead of 1-5; `CREDIT_DROP_CAP`
  dropped from 160 to 24.
- Landings accumulate into `creditBatch` (window `CREDIT_BATCH_T = 0.5s`) and publish
  `hud.creditPop = { v, s }`: `v` is the whole collection, `s = clamp(0.55 + 0.72 * log10(1 + v), 1, 3.6)`.
- HUD shows "+1.2k" drifting off the counter (`.credit-float`) and the coin pops at `--pop` scaled
  (`creditPop` keyframes now read the variable). Flying coins also start heavier with value.

### FX budget
- `ringFx()` is cosmetic-only and returns early past `RING_FX_CAP = 22` live rings; damaging rings are
  pushed by `shockwave()` directly and are never dropped.
- `shellHit()` no longer paints a ring per plate hit (sparks only, 5 particles instead of 8).
- `killEnemy()` runs at most two `explode(..., cascade)` cascades; the rest of the body just sparks.

### Input / misc
- Esc opens the settings panel when nothing else is up; it still closes settings, the base menu, admin
  or the bestiary first.
- `src/app/icon.svg` geometry wrapped in `translate(32 32) scale(0.7) translate(-32 -32)` so the
  mantis fits the tab icon instead of being cropped.

## 10. v2.7.0 — aggro ranges, deploy standby screen, transparent icon

### Aggro by rarity
- `AGGRO_RANGE = [360, 460, 580, 720, 880, 1060]` for tiers 0-5, plus `min(radius, 700) * 0.22`;
  the old formula was `(650 + radius * 1.2) * (1 + 0.12 * tier)` with a 2.4-5.4x leash, which let even
  a common trail you across the map.
- The leash is now `1.18x` the notice range, so leaving the range ends the chase on the next tick:
  `e.aggro = false`, `e.act = null` (no half-finished lunge) and `e.gap >= 0.5`. Lost-aggression bugs
  fall back to the existing wander code, which walks them home once they are more than 700u out.
- The boss gets `1.6x` notice range and a `2.4x` leash so it still hunts the middle of the map.

### Deploy standby screen
- `GET /api/update-status` compares `VERCEL_GIT_COMMIT_SHA` with the repo's HEAD commit on the same
  branch (GitHub API, 45 s in-memory cache, silent on failure). On a local build without Vercel's git
  env it reports `tracking: false`.
- `UpdateGuard` (mounted in the root layout, so every page has it) polls that endpoint every 8 s and on
  visibility/pageshow. A newer commit puts up "PAUSING GAMEPLAY FOR UPDATE · PLEASE STAND BY",
  dispatches `wof:updating` (GameClient sets `game.paused = true`, blurs input and calls `beaconSave()`)
  and keeps holding until the new build is live. If the build's `VERSION` no longer matches the
  bundle, the tab reloads into the new build once (`?v=` cache buster, sessionStorage guard).
  A push that never gets deployed gives up after four minutes so the game is not walled off.
- `VersionGuard` is gone; its cache/service-worker cleanup moved into `UpdateGuard`.

### Icon
- `src/app/icon.svg` dropped the dark rounded tile and its rim: the mantis now sits on a transparent
  background.

### Database
- The `pg` pool is sized for serverless (`max: 5`, 30 s idle timeout, `allowExitOnIdle`) so a pooled
  Neon connection string is safe to attach.

## 11. v2.6.0 — guest runs, mantis icon, magnet cap at mass 7

### Guests are anonymous and non-persistent
- The title screen no longer offers a name to guests: the field is greyed and reads
  `GuestNNN`, a random 3-digit tag kept in `sessionStorage` (`wof.guest.v1`) so it is stable for
  the life of the tab. Clicking it opens the ACCOUNT dialog.
- A guest run lives in memory only. `Game.persistent = false` plus `Game.saveSink = writeGuestSave`
  means `persist()` writes to a module-level object instead of `localStorage`, `pushServer()` and
  `beaconSave()` return immediately, and `/api/save` is never called. The title screen's store has
  the same split (`volatileStore`), so toggling settings as a guest changes nothing on disk.
- Settings → USERNAME is disabled while signed out (`nameLocked`), with a one-line hint.
- Accounts are unchanged and still autosave: `persist()` every 5 s, `pushServer()` every 20 s, on
  leaving the run, and on tab close via `sendBeacon`.

### Icon and title
- `src/app/icon.svg` is generated from the game's own geometry: `buildEnemy(mantis, tier 5, seed 7)`
  polygons (armour, segments, scythes and legs; shields and spikes dropped), rotated -35°, scaled to
  fill a 64x64 rounded tile with a dark background and a soft neon bloom.
- Both `layout.tsx` and `play/page.tsx` now title the tab `wofgue`.

### Component handling
- `PICKUP_MASS = 7` in `engine.ts` gates both the magnet drag (`st.magnet > 0 && mass <= 7`) and the
  contact scoop (`mass <= 7`), and `render.ts` only draws magnet tethers to parts under the cap.
  Anything heavier must be harpooned and towed.

### Cloud path proof
- `src/server/auth-store.ts` holds the account/save SQL against any Postgres, and
  `cloud-path.test.mts` runs it on an in-memory Postgres (`pg-mem`): table creation, unique
  usernames, password validation, login, wrong password, save round-trip through `jsonb` and the
  upsert all pass. Attaching `DATABASE_URL` to the Vercel project is the only step left for
  cross-device accounts and saves.

## 12. v2.5.0 — accounts, neon ladybug, real name on the tab

### Accounts
- `src/server/auth.ts` + `/api/auth/{register,login,logout,me}`: usernames are unique (case-insensitive
  `name_key`), passwords are `scrypt` hashes with a 16-byte per-user salt, and comparison is constant-time.
  The session is a `wof_session` cookie: http-only, sameSite=lax, 30 days, HMAC-SHA256 signed payload
  (`AUTH_SECRET`, falling back to a dev secret), `secure` in production.
- `users` was added to `src/db/schema.ts`; `ensureSchema()` creates the table with `create table if not
  exists` on the first auth call, so a fresh Postgres needs no migration step.
- `src/game/accounts.ts` is the one client API (`register`, `signIn`, `signOut`, `resolveSession`,
  `saveKeyFor`, `adoptGuestSave`). It asks `/api/auth/me` whether the host has a database: if yes the
  server does the hashing, if no the same form registers a browser account (PBKDF2-SHA256, 120k rounds,
  16-byte salt, only the hash is written to `wof.accounts.v1`).
- Saves are per profile: guest stays on `neon-hive-save-v1`, accounts get `neon-hive-save-v1::<user id>`
  locally and the server row is keyed by the user id. `/api/save` now ignores the request id when a
  session cookie is present, so a signed-in player can only read and write their own save.
  `adoptGuestSave()` seeds a new account from the guest slot so signing up never loses progress.
- The title screen shows a small `@username / LOG OUT` chip top-right, or `LOG IN` when signed out; the
  ACCOUNT modal holds the LOG IN / CREATE ACCOUNT form. In-game the handle rides next to AUTO in the top
  strip.

### Site identity
- `src/app/play/page.tsx` metadata title is now `wofgue.io` (it still said `Neon Hive — Play`), matching
  the root layout. The historical changelog title "Neon Hive expansion" was renamed.
- `src/app/icon.svg` is a neon ladybug — crimson shell with a cyan rim and glow, dark head, cyan legs and
  antennae with lit tips — served by Next's icon convention at `/icon.svg` with `sizes="any"`.

## 13. v2.4.0 — neon credit chip, bestiary by rarity

### Credit chip
- `CreditCoin` (HUD) and `drawCreditFlights` (canvas) now draw the same neon hexagon: gold radial face, `#7df9ff` rim, square hole punched through the middle, corner ticks and a drop-shadow glow. It reads as currency without breaking the neon palette.
- The coin keeps a constant screen size at any zoom, since both the icon and the flight are drawn in screen space.

### Bestiary: one entry per rarity
- The catalog is now `32 species x 6 rarities = 192 entries`. Each species block holds six chips (one per rarity), each with that tier's own silhouette, its rarity colour, a three-letter label and a lit/unlit state.
- An entry lights up only when that species has been killed at that rarity (`bestiary[id] >= tier`, from the persisted `save.bestiary`), so a mythic kill lights all six chips while a rare kill lights three.
- The detail card is now tier-specific: rarity banner, parts, hull, radius, hull-shell layers (`tier - 1` from rare), shield panels (`tier - 1` from epic), mounts, speed, turn, pack size and the drop rarities that tier actually yields.
- The header counts both: species discovered and rarity entries filled in.

## 14. v2.3.0 — salvage on contact, cash on the counter

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
- Removed: the bottom-left toast stack, the `● online · fps · wheel = zoom` readout, the `CANNON ONLINE/OFFLINE` label and the `HOSTILES IN BASE RANGE` banner.
- The discovery banner is now one short line (`NEW · <name>`); the AUTO/OVERDRIVE/ADMIN pills stay because they are interactive state.
- Help text updated to match: light parts scoop on contact, credits fly straight in.

## 15. v2.2.1 — shield panels ride outside the armour

- Panels were sized off body scale alone, which put them *inside* the plating on anything above rare (a mythical dragonfly's plates reach ~1,167u while the panel ring sat at ~497u).
- `makeEnemy` now measures, per panel, how far the torso plates reach along that panel's own ray (ray/circle exit distance over every `segment` and `armor` part, including its `plateGrow` slab thickness) and pushes `shieldR` out past it with a `max(28u, 6%)` margin.
- The result is a wall that hugs the hull instead of a single distant circle: a mythical dragonfly's four panels now sit at 497/858/1016/497u depending on the direction, and every one of them is outside the armour.
- Legs and wings are deliberately excluded from the measurement — they stick far past the hull, and a ring out there would float in empty space. A plated limb can therefore poke through the shield line, which reads as an exposed weak point.

## 16. v2.2.0 — shield projectors throw walls, not bubbles

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

## 17. v2.1.3 — energy vs plating, and the overfly swat

### Energy only loses 20% to plating
- `SHELL_TAKE.laser`: 0.22 → **0.8**. Beams (and the thermal cutter, which shares the `laser` source) now put 80% of their damage into the slabs; kinetic 0.3, missile 0.32, explosive 0.4, shock 0.15 and DoT 0.1 are unchanged.
- This is the intended answer to high-rarity hulls shrugging off energy builds: energy already ignores bubble shields, so it is now the anti-plating branch too.

### Overflying a body gets you swatted
- New per-enemy `swatCd` (1.4s) and `engine.swat()`: when the ship is inside the hull footprint — `dist < clamp(enemy.radius * 0.5, 45, 260) + SHIP_R` — the body reacts the same frame, before the player can act.
- Effect: `2.2 × eDmg` with knockback of `1,500 + 90 × tier` u/s away from the core, `shake >= 30`, a 1300 u/s shock ring plus twin spark bursts. Cooldown-gated so it cannot chain-stun a player.
- Suppressed in the safe zone and on stunned bodies.

## 18. v2.1.2 — legs cripple, legendary and mythical legs get plating

### Crippling
- `LEG_CRIPPLE_FRAC = 0.35` and `legHealthy(p)`: a leg part below 35% of its max HP no longer counts. `damagePart` recomputes mobility whenever a leg takes damage, so the penalty applies the moment a limb crosses the threshold — no need to destroy it.
- `refreshMobility` now works per **limb** (`roleGroups.leg`, one group per leg chain): a limb is crippled when its surviving parts hold ≤35% of the limb's max HP. Crippled limbs drop out of `mobility` and `turnFrac`; with every limb crippled the body can neither walk (`mobility 0`) nor turn (`turnFrac 0`).
- `Enemy.crippledLegs[group]` freezes the walk cycle for that limb (`g.ang *= exp(-7·dt)`) while healthy limbs keep stepping. Species with ungrouped leg parts fall back to per-part counting.

### Leg plating
- `Enemy.legPlate` = `tier - 3` from legendary up (0 below), i.e. 1 slab layer at legendary, 2 at mythical.
- `plateAt` treats leg parts as plated when `legPlate > 0` and grows their slabs with `plateGrow(p.r, legPlate)`, so shots on a plated limb are swallowed by the hull shell stack rather than hitting the leg directly.
- The shell envelope (`shellR`) now includes the plated limbs, so beams and blasts respect them too.
- `render.ts` draws the leg slabs with their own layer count (body keeps `e.shells.length`) and dims/desaturates crippled limbs.

## 19. v2.1.1 — heavy cannons are hitscan, legs steer again

### Heavy Cannon is hitscan
- `GUN_SPECS.heavy` sets `hitscan: true`, range 1200u, and drops the 0.9 homing (there is nothing left to home with).
- `engine.heavyShot()` draws a line from the muzzle to the first thing it meets (base or ship), applies `1.8 × eDmg` without travel time, paints a tracer in `this.beams`, and still applies the 260u/s recoil shove on the shooter.
- A ship hit adds a 150u impact ring, two spark bursts, knockback along the line, and raises `this.shake` to at least 34 — the heaviest shake in the game (normal hits cap around 14). A miss produces no damage and no shake.

### Legs steer again
- Restored `Enemy.turnFrac` (`clamp(aliveLegs / legCount, 0, 1)`, serpentine rigs pinned to 1), recomputed in `refreshMobility`.
- `updateEnemies` uses `turnMul = e.turnFrac` and `runAct`'s `turnTo` scales by it, so charges and swings respect broken legs too. Zero legs means no turning at all.
- Rarity scaling from 2.0.8 is unchanged.

## 20. v2.1.0 — enemy weapon overhaul

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

## 21. v2.0.9 — legs no longer drag the turn rate

### Turning is a pure species stat
- Removed `Enemy.turnFrac` and the leg-fraction logic added in 2.0.8. `updateEnemies` uses `turnMul = 1`, and `runAct`'s `turnTo` is back to `e.turn * rate` with no limb scaling.
- `refreshMobility` still rebuilds `mobility` from surviving legs/wings, so a de-legged body still crawls (or stops, if it has no wings); it simply keeps its full turn rate.
- Rarity scaling from 2.0.8 is unchanged: `TIER_TURN = [1, 1, 1, 1, 0.9, 0.8]`.

## 22. v2.0.8 — enemies that can actually turn

### Turn rate by rarity
- `makeEnemy` built turn as `spd.turn / ((1 + tier * 1.05) * (1 + radius / (size * 6)))`. The size term is constant across tiers (radius scales with `b.size`), so the whole rarity penalty was the `1 + 1.05·tier` divisor: 4.2x at epic, 6.3x at mythical.
- New `TIER_TURN = [1, 1, 1, 1, 0.9, 0.8]`: common through epic share the species rate, legendary is 10% slower and mythical 20% slower. Mythic dragonfly turn went from 0.34 to 1.47 rad/s (a 180° swing in ~2.1s rather than ~10.5s).

### Legs steer
- `Enemy.turnFrac` (new field, initialised to 1) is recomputed in `refreshMobility` from the share of `leg` parts still alive: `clamp(aliveLegs / legCount, 0, 1)`. Serpentine rigs (`id === "serpent"`) and bodies with no legs keep 1.
- `updateEnemies` uses `turnMul = e.turnFrac` (was `0.3 + 0.7 * mobility`, which left a legless body steering at 30%). `runAct`'s `turnTo` multiplies by `turnFrac` too, so charge/swing wind-ups respect it. With every leg destroyed the body cannot rotate at all, and `mobility` already drops to 0 so it cannot walk either.

### Admin spawner memory
- `AdminPanel` seeds `spawn` state lazily from `localStorage["wof-admin-spawn"]` (`{ id, tier }`, matched back to the species by id) and writes it back whenever the selection changes, so the panel reopens on the last enemy and rarity picked.

## 23. v2.0.7 — plating you can see and hit

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

## 24. v2.0.6 — real armour plating, proximity cannon

### Plating is an extra armour layer
- Each `ShellLayer` now holds `SHELL_HP_FRAC` (0.6) of the enemy's total part hull instead of the old `5 * HP_MUL[tier]`, which was under 1% of hull. Layers remain `tier - 1`, so tier 2 = 1 layer, tier 5 = 4 layers. A 1,573,120 HP mythical now carries 4 × 943,872 HP of plating.
- `SHELL_TAKE` became a per-source table: kinetic 0.30, missile 0.32, explosive 0.40, laser 0.22, shock 0.15, dot 0.10. Beams and shockwaves chip plates now instead of being permanently walled by them.
- `shellHit` multiplies the plate loss by `stats.breaker` (Plate Breaker, up to 2.5x) for player damage.
- A shattered layer's shockwave deals `e.eDmg * 1.25` to nearby enemies instead of `layer.max * 0.75`, which at the new plate HP would have wiped every enemy on screen.

### Plating is visible
- `drawEnemy` draws plating in its own pass before the body: a dark underlay grown 2.4u past the slab, a solid filled top face (`hsla` steel tinted to the species hue, brightening as integrity drops), a bright rim, and one faint ridge per extra layer. Growth is `4 + 5 × (layers - 1)` capped at 0.9 × part radius.
- Old code drew a single translucent 2px stroke per body part; that is gone.

### Base cannon
- `updateTurret` sets `basePowerT = BASE_POWER_IDLE` whenever `nearestEnemy(BASE.x, BASE.y, BASE.aggroR)` finds anything, so the cannon powers up as soon as any enemy enters the 1,760u alert band and stays up 120s after the band clears.
- `hurtBase` no longer touches `basePowerT`. The instant retaliation kill on the attacker is unchanged, as is the rare+ targeting rule.

## 25. v2.0.5 — admin test range

### Test range
- `AdminState` gains a `sandbox` flag (session-only: `readAdminFlags` always returns `false` for it and `writeAdminFlags` leaves it out of `wof-admin-flags`).
- `adminTestRange(true)` clears `enemies`, `eprojs` and `mines`, teleports the ship to the outer ring at `atan2(-BASE.y, -BASE.x) × (WORLD_R - 900)` — the point farthest from the base — caps hull/shield, clears status effects and snaps the camera. It also forces admin mode on. `adminTestRange(false)` restores the saved pre-teleport position and lets the world resume.
- While `admin.sandbox` is set, the update loop skips `seedWorld()` and the `manageChunks()` tick entirely, `seedWorld()` early-returns, and the boss-spawn branch in `updateEnemies` is suppressed. Nothing spawns on its own.

### Spawner
- `adminSpawn(spi, tier, n)` takes any index from `SPECIES_LIST` and any rarity 0–5, places up to 20 copies in a line perpendicular to the aim, 520–1,100u toward the cursor (clamped inside `WORLD_R - 40`), marks them `aggro = true` and reports `SPAWNED n × NAME · RARITY`.
- `adminClearEnemies()` empties enemies, hostile projectiles and mines in one call.
- Both are gated on `admin.on`; species and rarity pickers live in the admin panel's new TEST RANGE section, with SPAWN, SPAWN ×5 and CLEAR buttons.

## 26. v2.0.4 — energy shields are hard walls

### Enemy energy shields
- Shields no longer have a charge to drain. `SHIELD_STRIP` (0.08) is deleted; blocked hits change nothing about the bubble, so `shieldDown`, the 4s collapse, the 40% re-arm and the 15%/s regeneration never trigger. A bubble lives until its Shield Generator part is destroyed.
- Only `energy`, `shock` and `thermal` damage passes through a bubble. Kinetic, physical, explosive and corrosive projectiles and beams stop at the hex edge and deal nothing to the shield or the hull.
- `tryHit` and `beam` share the same rule: energy family breaks out of the bubble check and continues to the parts; everything else returns/ends the beam with a cyan impact ring.
- The "SHIELD DOWN" toast and its collapse/re-arm branches are removed.

### Rail Sniper
- The rail beam is now fired with `bypass = false`, so it is stopped by enemy energy shields like any other kinetic weapon. The Shield-Bypass Laser keeps `bypass = true` and is the only weapon that ignores bubbles. Hull shells still stop the rail.

### Documentation
- `DMG_INFO` tooltips, `docs/STATS.md` damage-type table and the bubble rules paragraph all describe the new behaviour.

## 27. v2.0.3 — particle budget pass

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

## 28. v2.0.2 — kinetic shields, quieter inner rings and the stat compendium

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

## 29. v2.0.1 — max-zoom performance and the white mythical pile

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

## 30. v2.0 — bulk upgrades, persistent admin, component shockwaves, global vision

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

## 31. v1.9 — construct player, whole-map spawns, credit drops and base retaliation

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

### Base retaliation and cannon power
- `hurtBase` sets `basePowerT = 120` and instantly calls `killEnemy(src, ..., byBase=true)` on
  the attacker that damaged the hull. Such kills grant no bestiary credit and drop nothing.
- `updateTurret` refuses to acquire targets while `basePowerT <= 0`; the barrel idles and the
  renderer dims the turret. Damage restarts the 120s window, so the cannon sleeps again after
  two quiet minutes.
- HUD exposes `basePowered`; the base panel shows CANNON ONLINE / OFFLINE.
- Any enemy projectile crossing `BASE.r × 0.82` still damages the hull, so stray fire can
  trigger retaliation without enemies deliberately targeting the base.

### Base vision (superseded in v2.0)
- v1.9 applied a 1.3x camera pull-back only inside `BASE.aggroR` (1,760u) and exposed
  `baseVision` to the HUD. v2.0 makes the 1.3x baseline global and removes both the gate and the
  HUD chip.

## 32. v1.8 — turret system rework, detailed ship, rotating mounts

### Enemies hunt the ship, not the base
- Removed every base-targeting branch from `updateEnemy`: no `baseEngaged` aggro override, no base-aimed
  projectiles (`tgtBase`), no 2.6× base charge, no docking-apron exemption, no hull gnawing and no
  forced 1.6 rad/s turn floor.
- `BASE.aggroR` (1,760u) is now purely the base's defence-alert radius and the retention zone for
  enemies chasing the player through it. Enemies follow the player normally at every distance, so they
  can be drawn into turret range instead of switching to the base.
- The base hull remains solid for stray fire: any enemy projectile that crosses `BASE.r × 0.82` now
  damages the structure, regardless of what it was aimed at. Base defences and the 120s repair
  lockout are unchanged, and base-owned kills still grant no bestiary credit.

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

## 33. v1.6.1 — stable preview, solid bestiary cards, compact cores

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

## 34. v1.7.1 — four-times turret damage, no bestiary credit for base kills

### Point-defence damage
- `MINI_DMG` is now **72**, up from 18 (exactly 4×). Fire cadence stays **0.24s**, tracer speed
  1,450u/s and range 850u, so six turrets put out roughly 1,800 raw dps when all have targets.
- Plating still absorbs 70% of each physical tracer (`SHELL_TAKE = 0.3`), and energy shields still
  do not stop kinetic fire.

### Bestiary credit
- `killEnemy(e, x, y, byBase)` now receives an explicit base-kill flag, propagated from
  `breakPart(..., byBase)` and from `damagePart(..., fromBase)`.
- A kill never updates `save.bestiary` or sets the discovery banner when **either** the finishing
  blow came from the base defences **or** `baseDmg × 2 > dmgTaken`. This covers the siege cannon,
  the six hex turrets and core breaks caused by either.
- Player-credited kills still update the bestiary, best-rarity record and discovery banner.
  `save.kills` continues to count every kill.

## 35. v1.7 — hex point turrets, legendary siege shells, 120s repair lockout

### Aggro leash
- `BASE.aggroR` is now **1,760u**, exactly `turretR × 1.1` (1,600 × 1.1). Mobs switch from the
  player to the base only when they are already inside the siege cannon's envelope, instead of the
  old 2,240u (×1.4). The orange leash ring and the "BASE UNDER ATTACK" check both use the new value.

### Six hex point-defence turrets
- Six small turrets sit on the existing hex pylons at `BASE.r` (260u), one every 60°.
- Each turret spins up toward its target (5 rad/s), idles by slowly rotating, and fires a fast
  (`1,450u/s`) cyan tracer every **0.24s** for **18 damage** (raised to **72** in v1.7.1) at anything inside **850u**
  (`BASE.smallR`). Tracers lead moving targets, last 0.85s and hit plating before hull.
- Point-turret damage is physical/kinetic: armour shells absorb 30%, shields still ignore it.
- They do **not** wake the siege cannon; the cannon only reacts to rare+ enemies.
- Every sixth of the base's **maximum** integrity lost destroys one turret (`baseDamageTaken`
  divided by `baseMaxHp / 6`). A 100-damage chunk kills one, three 100-damage chunks kill three,
  and all six are gone when the base dies. Damage is cumulative, so repairs never bring a turret
  back. The HUD draws six teal pips beside the base bar.

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
  actual hull removed for mythical chunks) and point-turret damage are attributed to the base.
- `maybeDrop` returns immediately when `baseDmg × 2 > dmgTaken` (strict majority). Loose parts that
  already broke off that enemy are scrubbed from the world when it dies, so a base-majority kill
  leaves nothing behind. Player-majority kills still drop normally.

### Repair lockout
- Any hit that deals integrity damage sets `baseHitT = 120`; the 2%/s repair only starts once that
  timer reaches zero. Low-tier hits that deal 0 damage do not reset it.

## 36. v1.6 — base siege cannon and a destructible base

### Siege cannon
- The base now carries a permanently fitted cannon. Stats: **range 1,600u**, shell speed 650,
  **7-second reload**, 1.8 rad/s traverse. It picks the nearest enemy in range and holds that
  target until it dies or leaves the leash.
- One shell **incinerates any enemy of epic tier or below** outright, burning through plating and
  energy shields (it is a physical incendiary shell, not an energy weapon).
- Legendary and mythical enemies only lose a proportional chunk of hull (120,000 damage spread over
  their remaining parts), so they cannot be held off — one legendary reaches the base in a few
  seconds and ends the run.
- Recoil is deliberately huge: the barrel slides back 36u, a hot muzzle flash and six spikes
  appear, a shock ring leaves the base, the mount ring expands, plasma vents behind the barrel and
  the camera kicks 26 (scaled down when the player is far away).
- Only one shell is in flight at a time because the 7s reload is longer than the ~2.5s flight.

### Base aggro and destruction
- Enemies whose centre is within `turretR × 1.4 = 2,240u` of the base switch their target to the
  base and ignore the ship completely (their shots carry a `tgtBase` flag and only collide with the
  base). They charge at **2.6× normal speed**, then ram and fire at the hull.
- The base has **600 integrity**. Incoming damage scales by attacker tier:
  common ×0, uncommon ×0.01, rare ×0.4, epic ×1, legendary ×1.6, mythical ×2.4. Ambient trash
  therefore cannot erode it; one epic that reaches the hull does ~140 dps, two epics overwhelm the
  cannon's one-target-at-a-time 7s cycle, and a legendary/mythical kills it in about 2 seconds.
- Integrity regenerates 2%/s after 7 seconds without a hit. A slim teal `⬢` bar joins the player
  bars while the base is nearby or damaged, and `⬢ BASE UNDER ATTACK` appears when rare+ enemies
  are inside the leash.
- At zero integrity: every enemy in the world is vaporised, all loose and stored components are
  lost (`save.inventory = []`), half the credits are removed, the penalties are saved immediately,
  and after a 3-second `BASE DESTROYED` overlay the client routes back to the title screen. The
  next run places the base elsewhere.

### Base placement
- `BASE_RING` is 13,900–15,300u — the same outer (common) ring, never an inner zone and never near
  the world edge. A module-level last position guarantees consecutive runs are at least 3,000u
  apart. The camera, player spawn, docking, recall, safe zone, spawning exclusion and minimap dot
  all read the mutated `BASE` position.

## 37. v1.5 — moth lag, bestiary hover cards, visible loadout

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

## 38. v1.4 — bestiary, damage types and visible plating

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

## 39. v1.3 — crowd, cores, plating and firing discipline

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

## 40. Title screen, settings, changelog and versioning (v1.2)

- **Title screen is the loading screen.** `WOFGUE.IO` is the whole design: a very large, tightly
  tracked wordmark (`clamp(2.9rem, 14.5vw, 10.5rem)`) with a neon glow, modelled on florr.io's
  full-screen logo. There is no username label and no tagline — only the wordmark, the name field,
  PLAY, the SETTINGS / CHANGELOG links and the version at the bottom.
- **Neon grid backdrop** (`Backdrop.tsx`, a canvas): the same 100u/500u grid the game draws, at
  92/460 screen pixels with a slow drift, a cyan central glow and a vignette. Small geometric
  insects (beetles, moths, centipedes, mantises, 7–20 px) drift across it with a soft pulse and
  wrap at the edges. `prefers-reduced-motion` freezes the animation.
- The grid and insects are cosmetic only: `pointer-events: none`, `aria-hidden`, and no link to
  the simulation.

## 41. Title screen, settings, changelog and versioning (v1.1)

- **Wofgue.io start screen** (`/`): the title, a username field on top (pre-filled when a name is
  already saved, empty on a fresh browser), a full-width **PLAY** button, **SETTINGS** and
  **CHANGELOG** buttons side by side, and the version number in small text at the bottom.
  The game itself is still `/play`; the in-game `⌂` returns here.
- **Play requires a username.** An empty name focuses the field and shows "Enter a username to play."
  The name is stored in the local save and pushed to the shared map as before.
- **Real settings panel** (`src/components/SettingsPanel.tsx`), shared by the title screen and the
  in-game gear button (`⚙`, bottom right) and the Base → SYSTEM tab. It contains every setting:

  | Setting | Key | Default | Effect |
  | --- | --- | --- | --- |
  | Automatic crafted weapons | `autoFire` | `true` | Crafted weapons fire on their own (B still toggles) |
  | Component hover info | `showCompInfo` | `true` | Name / rarity / value / mass card under the cursor |
  | Auto-sell docked components | `autoSell` | `false` | Sell on arrival instead of storing |
  | Username | `name` | `""` | Shown to other pilots, max 16 characters |
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

## 42. Missile targeting (Homing Missile Launcher)

| Rule | Implementation |
| --- | --- |
| Marking | Right-click an enemy piece. The cursor is hit-tested against every part polygon; the part under the pointer becomes the lock. |
| Harpoon coexistence | If no launcher is equipped **or** the cursor is not over an enemy, right-click fires the tether exactly as before. Marking never consumes a tether. |
| Automatic fire | While a mark exists the launcher fires without any mouse button held, one missile per `1.7s / (0.7 + 0.3·eff)`. |
| Re-targeting | Right-clicking a different piece replaces the mark and resets the launcher reload to a full cycle. Re-clicking the same piece does not reset it. |
| Flight | Precision missiles (`kind 4`) ignore **all** collision — other enemies, shields, armour shells and other pieces of the same body — and steer to the marked piece's current world position at 9 rad/s, accelerating to 1,500 u/s. |
| Impact | Damage is applied directly to the marked piece (`3.1 × base cannon damage × efficiency`), plus a small 74u splash. |
| Lost marks | If the marked piece is destroyed or dislocated (severed), or the enemy dies, the mark clears and `TARGET LOST` is shown. In-flight missiles revert to ordinary warheads. |

## 43. Automatic crafted weapons

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

## 44. Armour plating (epic and above)

- Epic / legendary / mythical enemies gain **1 / 2 / 3** thin grey shell layers.
- Each layer has `5 × HP_MUL[tier]` HP: **400** (epic), **1,800** (legendary), **8,000** (mythical) per layer.
- Kinetic, missile, flak and explosive damage is reduced by **70%** against plating.
- **Lasers and shockwaves do zero damage and are stopped** — beams terminate on the shell, shock
  AoE is absorbed, EMP stuns but does not burn, chain lightning and sonic do nothing.
- Precision missiles (right-click marks) bypass plating entirely and strike the marked piece.
- Layers break one at a time with a grey particle burst; the HUD shows a pip per remaining layer.
- Long-bodied species (centipede, snake) use their segmented armour instead of a bubble shell.

## 45. Spawn pressure

Per-zone densities and caps are listed in section 0 (v1.3). In short: the outer rings are the
busiest (2.6 enemies/chunk, cap 56), the core is the calmest (0.9/chunk, cap 28), a top-up pass
refills to ~85% of the local cap, and a visibility floor guarantees 2–4 enemies on screen. Spawns
still avoid the base safe zone and usually the area within 1,200u of the player (the visibility
floor may place one at the edge of the screen).

## 46. Serpentine bodies

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

## 47. UI and tone

- Removed the **HANGAR** lettering and its subtitle from the base; replaced with a hex sigil.
- Removed the **CRIPPLED** / **IMMOBILISED** warnings entirely.
- Removed all text from the health/shield/boost bars (both player HUD and enemy bars).
- Tether indicators are now bare harpoon glyphs; colour alone encodes ready / flying / hooked /
  reel-in, with load and cable-integrity slices.
- The base panel title is an icon; the base prompt is a hex button; `SHIP DESTROYED` is now
  `CORE DESTROYED` and "rebuilding at hangar" is "reforming at the base".
- Copy switched away from ship language ("craft", "base", "integrity", "username").

## 48. Website and save codes

- `/` is now the Wofgue.io title screen (username, PLAY, SETTINGS, CHANGELOG, version); the old
  feature grid, how-to-play and controls-table site is gone, and save-code entry lives in SETTINGS.
- The game moved to **`/play`**; the in-game `⌂` button returns to it.
- **Save code format:** `NH1-<checksum base36>-<base64 JSON>`; checksum is a 31× rolling hash mod
  1,000,003. Invalid or truncated codes fail closed.
- Export copies the code to the clipboard from **SETTINGS** (title screen, gear button or Base →
  SYSTEM); paste a code there to restore.
- Restoring validates and checksums the code, writes it to the local save and updates the title
  screen immediately.
- Server-side profiles (`/api/save`) still work when `DATABASE_URL` is configured; without a
  database the browser is the vault.

## 49. Compatibility and migration

- Save version stays **2**; `autoFire` is additive and defaults to `true`.
- Components whose species was `"World Serpent"` are migrated to `"Snake"` so old crafting
  requirements still match.
- `encodeSave` / `decodeSave` are exported from `src/game/data.ts`.

## 50. Verification

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
