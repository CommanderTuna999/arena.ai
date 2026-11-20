# Neon Hive — Expansion Implementation Plan

Status: **implemented** on branch `arena/aad8e5ab-arena-ai`.
This document is both the plan and the record of what shipped. Every phase below is complete and verified.

## Scope summary

| Area | Planned | Delivered |
| --- | --- | --- |
| New enemy species | ~20 unique + 5 modified + 1 Snake boss | 22 new species (32 total) + World Serpent boss |
| New craftable weapons | 15–20 | 15 new (19 total) |
| New craftable shields | 5–10 | 7 new (10 total) |
| New craftable armours | 5–10 | 8 new (11 total) |
| Utility items | Teleporter, Magnet, Zoom Optics | Recall Beacon, Component Magnet, Wide-Field Optics |
| Active ability hotbar | 5 slots (Z/X/C/V/F) | 5 slots, 8 craftable abilities |
| Admin panel | Infinite credits/health/damage/components | Collapsible panel on `` ` `` with all four flags |
| Enemy behaviour | Ability gating, flee prevention, turn scaling | Tier-gated abilities, tier-scaled aggro/leash, radius-scaled turn rate |
| Crafting overhaul | Species-specific requirements | `species` requirements on 33 recipes + 51 recipes total |

## Phase 1 — Data layer (`src/game/data.ts`) ✅

- `ActiveAbilitySlot` type and `abilitySlots: ActiveAbilitySlot[5]` in `SaveData` (v2, migrated from v1).
- `Recipe.slot` gained `"ability"`; recipes gained optional `species` requirement and `wpn` display data.
- **19 weapons**, **10 shields**, **11 armours**, **2 optics/utility**, **8 active abilities** (51 recipes).
- Species requirements on 33 of the 51 recipes reference real enemy names (e.g. *Homing Missile Launcher* needs a Bombardier Beetle or Yellowjacket part).
- Admin mode lives on the `Game` instance only (never written to the save).
- Zoom is craftable-only (`zoomMin === 1` until Wide-Field Optics is equipped).
- `computeStats()` handles every new item's effects: kinetic/dodge/nova-on-shield-break/null-field/prismatic shields, chitin/carapace/nano-weave/ablative/titan/exoskeleton/venom-guard/scale-mail armour, magnet utility and per-slot active abilities.

## Phase 2 — Bestiary (`src/game/enemies.ts`) ✅

Shared body-plan builders keep 32 species readable:

- `buildBeetle()` — armoured beetle chassis (elytra, horns, pincers, snouts)
- `buildAnt()` — gaster / petiole / thorax / head
- `buildFlyer()` — winged thorax, striping, stingers, oversized hind legs, proboscis
- `buildSnake()` — chained segments with dorsal spikes, armoured scales and a fanged head

New species: Worker Ant, Honeybee, Grasshopper, Cockroach, Mosquito, Bombardier Beetle, Rhinoceros Beetle, Yellowjacket, Ladybug, Stag Beetle, Carpenter Ant, Cicada, Assassin Bug, Tiger Beetle, Mole Cricket, Katydid, Dung Beetle, Atlas Moth, Weevil, Locust, Jewel Beetle and the **World Serpent**.

- `minZone` / `maxZone` on every species; spawn weights are filtered by the local `zoneTier`.
- Ability gating is central in `makeEnemy`: tier 0 has none, tier 1 one, tier 2 two, and so on.
- Turn rate scales down with both tier and body radius, so huge creatures turn like capital ships.
- Boss rules: one alive at a time, only in the mythical core, guaranteed tier-5 (mythical) drops, 150 s respawn.
- Jewel Beetle has `reflectShell`; its shields bounce player rounds back.

## Phase 3 — Engine (`src/game/engine.ts`) ✅

- All 19 weapon systems: auto turret, shotgun, seeker pod, arc lance, lock-on homing launcher, shield-bypass laser, heavy MG, EMP cannon, plasma cutter, acid sprayer (melt + DoT), chain lightning, flak airburst, rail sniper, gravity well, mine layer, orbiting drones, venom injector, sonic cone, cluster rockets.
- Projectiles carry `dot`, `melt`, `flak` and `split` payloads; enemies track `dot`, `melt`, `slow` and `stun`.
- Five ability slots bound to **Z X C V F**, independent cooldowns, effect scaling from crafting efficiency.
- Admin flags short-circuit purchases, crafting, damage and incoming damage; `+1,000,000 CR` helper.
- New enemy acts: `summon` (call a swarm), `blink` (burrow/ambush teleport), `drain` (proboscis lifesteal).
- Component magnet, mines, wells, drones and lock-on all integrate with the existing simulation loop.

## Phase 4 — Rendering (`src/game/render.ts`) ✅

Gravity-well swirls, magnet field lines, armed/blinking mines, drone escorts, missile/flak/cluster tracers, lock-on crosshair brackets, slow/melt/stun enemy auras, Aegis barrier and overdrive rings, plus automatic rendering of every new anatomy.

## Phase 5 — UI (`src/components/GameClient.tsx`) ✅

- Admin panel on `` ` `` (or the `ADMIN` button): master switch, four flags, ALL ON/OFF, credit dump.
- Ability hotbar on the right edge with key caps, cooldown countdowns, ready glow and click-to-inspect descriptions.
- Crafting UI understands species requirements, shows them on the recipe card, marks matching components, and auto-fill respects both category and species needs.
- Loadout has dedicated Z/X/C/V/F ability selects; crafting auto-equips abilities into free slots.
- HUD shows `LOCK`, `OVERDRIVE` and `ADMIN` states; help panel documents the new keys.

## Verification performed

- `tsc --noEmit`, `eslint .`, and `next build` all pass.
- Headless simulation harness: all 32 species built at tiers 0–5, all 51 recipes crafted, all 19 weapons fired, all 8 abilities cast, every zone visited including the boss arena, ~4,400 frames simulated with rendering — no exceptions.
- Mechanic assertions: save migration, lock-on, homing launch, EMP stun, magnet pull, zone gating, tier-0 ability gating, boss mythical drops, single-boss rule, admin invulnerability.

## 2.0 balance / feel pass (current build)

A second pass reworked combat and tone; see `docs/CHANGELOG.md` for the full table of numbers.

- Missile launcher now uses **right-click marks** and precision missiles that ignore everything in
  their path; the tether still owns right-click when no launcher is fitted or the cursor is empty.
- All crafted weapons are **automatic** (toggle with B or the AUTO pill); HMG, bypass laser and arc
  lance damage was cut sharply.
- **Armour plating** for epic+ enemies: 1/2/3 thin grey shells, 30% kinetic damage taken, complete
  immunity to lasers and shockwaves; precision missiles bypass it.
- Spawn density cut ~4x with a hard cap of 18 and slower chunk evaluation.
- Centipede and snake got true segmented bodies with a travelling wave; the snake is now called
  **Snake** and is roughly five times longer; the centipede is roughly 2.5× longer and curves.
- All bar text, "CRIPPLED"/"IMMOBILISED", base "HANGAR" lettering and harpoon status words removed.
- `/` is the Wofgue.io title screen (callsign, PLAY, SETTINGS, CHANGELOG, version), `/play` is the
  game, and self-contained **save codes** (NH1-…) move progress between browsers.
- The snake boss is disabled for now (`SNAKE_ENABLED = false`); the species stays in the bestiary.

## Deviations from the original plan

- The ability HUD is React (like the rest of the HUD) rather than canvas-drawn in `render.ts`; this keeps the hotbar crisp and clickable.
- Total delivered line count is ~5,600 rather than ~7,300 because the new body-plan helpers removed duplication in species definitions.
- Weapon recipes use a generic stat line instead of bespoke prose for the 15 new weapons.
