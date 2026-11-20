# Changelog — combat, plating and website pass

Everything below is implemented in the current build. Numbers are the actual constants used by
the simulation, not design targets.

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
