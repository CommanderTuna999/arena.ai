# Changelog — combat, plating and website pass

Everything below is implemented in the current build. Numbers are the actual constants used by
the simulation, not design targets.

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

| Zone tier | 0 (outer) | 1 | 2 | 3 | 4 | 5 (core) |
| --- | --- | --- | --- | --- | --- | --- |
| Enemies per 1,500u chunk | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |

- **Every zone spawns at the same pressure.** The outer rings are no longer quieter than the core,
  and the core is no longer hand-thinned: `DENS = [1,1,1,1,1,1]` in `engine.ts`.
- Deep zones *feel* emptier only because their enemies are physically far larger; the spawn rules
  are identical. The live population is what changes, not the per-chunk rate.
- Hard population cap: **36** — the chunk pass simply stops adding enemies once 36 are alive, which
  is the lag guard on phones.
- Chunk evaluation every **1.0s**; chunks still spawn in a 5×5 neighbourhood.
- Spawns never occur within 1,200u of the player or 350u outside the base safe zone.
- Boss respawn timer stays **120s** on every spawn path; the snake is off (`SNAKE_ENABLED=false`),
  so the cap is never exceeded by a boss.

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
