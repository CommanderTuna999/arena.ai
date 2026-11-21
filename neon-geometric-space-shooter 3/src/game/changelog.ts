/*
 * Version history shown by the CHANGELOG button on the title screen.
 *
 * Versioning rules (keep these when shipping):
 *   X.Y        — feature releases. Bump Y for a batch of new content or systems.
 *   X.Y.Z      — fixes, balance tweaks and small quality-of-life changes.
 *   Every shipped change must bump VERSION, add a dated entry at the TOP of
 *   CHANGELOG and mirror the details in docs/CHANGELOG.md.
 */

export const VERSION = "2.1.1";

export interface ChangeEntry {
  version: string;
  /** human-readable release date */
  date: string;
  title: string;
  points: string[];
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: "2.1.1",
    date: "21 Nov 2026",
    title: "Heavy cannons and broken legs",
    points: [
      "The Heavy Cannon is now hitscan: a 1,200u instant line instead of a travelling slug, so there is nothing to outrun. It still kicks the shooter backwards and still hits for 1.8x contact damage.",
      "Heavy Cannon impacts on the ship kick the camera hard on top of the usual hit shake, and get a bigger blast ring and spark burst.",
      "Destroyed legs drag the turn rate down again: turn speed is multiplied by the share of legs still attached, so half the legs means half the turn rate, and a legless body cannot turn at all. Rarity still only bends turning for legendary (0.9x) and mythical (0.8x).",
    ],
  },
  {
    version: "2.1.0",
    date: "21 Nov 2026",
    title: "Enemy weapon overhaul",
    points: [
      "Retired five cannon upgrades: Piercing Rounds, Plate Breaker, Core Seeker, Fragmentation Rounds and Rail Coils. Old saves drop those levels; the main cannon now has damage, rate, barrels and crit only and is due a rework.",
      "Every enemy can now turn up armed. Bodies that never carry a gun or a shield generator by design roll for one from epic upward: gun chance 12% + 6%/tier, shield chance 10% + 5%/tier (30%/25% at epic, 42%/35% at mythical).",
      "Four new turrets: Scatter Cannon (7 large, slow kinetic pellets), Heavy Cannon (5s reload, 1.8x contact damage, 950u/s homing slug, kicks the hull backwards), Laser Emitter (1,500u/s energy lance that ignores kinetic shields) and Rotary Gun (fast, weak kinetic spray with a short engagement range).",
      "Signature guns: Hornets, Soldier Ants, Yellowjackets and Locusts carry rotary guns; Scorpions, Scarabs and Bombardiers mount scatter cannons; Rhinos, Dung Beetles and Weevils get heavy cannons; Dragonflies, Fireflies, Jewel Beetles and the Serpent use lasers.",
    ],
  },
  {
    version: "2.0.9",
    date: "21 Nov 2026",
    title: "Legs no longer drag the turn rate",
    points: [
      "Turning is a pure species stat again: the leg-damage penalty from 2.0.8 is gone. Losing half the legs, or all of them, leaves the turn rate untouched.",
      "Legs still drive walking speed (mobility), so a shredded body still slows to a crawl, it just keeps its full steering.",
    ],
  },
  {
    version: "2.0.8",
    date: "21 Nov 2026",
    title: "Enemies that can actually turn",
    points: [
      "Rarity no longer divides turn rate: common through epic all turn at the species rate (the old formula divided it by up to 4.2x), legendary turns at 0.9x and mythical at 0.8x. A mythical now swings around in about two seconds instead of ten.",
      "Legs are now the steering: each destroyed leg part scales the turn rate down in proportion to the legs still attached. Half the legs gone means half the turn rate, and a legless body cannot turn at all (it also cannot walk). Serpentine bodies have no legs and keep steering normally.",
      "The admin spawner remembers the species and rarity you last picked (browser storage), so reopening the panel lands on the same test subject.",
    ],
  },
  {
    version: "2.0.7",
    date: "21 Nov 2026",
    title: "Plating you can actually see (and hit)",
    points: [
      "Armour slabs stand ~4x thicker again: 20u base + 10u per extra layer + 26% of the plate's own radius, capped at 1.9x the part. They are now gunmetal plates with a bevelled lip, a bright outer rim and one ridge per layer, instead of a pale outline.",
      "Shots now stop on the plating itself. The old collision was a single circle around the whole silhouette, so on winged or leggy species rounds vanished in empty air well before the armour; bullets and beams test the actual slab shapes (with a capped shell radius for the broad phase), so they visibly strike steel.",
      "Plate hits throw a spark burst and a flash ring, and fast rounds get intermediate-position samples so they cannot tunnel straight through a thin slab between frames.",
      "Fixed a separate ring bug: a fast shockwave could jump past the ship between frames (the old +-26u band test), so shell-break blasts now always register on the way out.",
    ],
  },
  {
    version: "2.0.6",
    date: "21 Nov 2026",
    title: "Real armour plating, proximity cannon",
    points: [
      "Enemy plating is now a genuine second health bar instead of a token outline. Every layer holds 60% of the enemy's total hull, and tier 2/3/4/5 carry 1/2/3/4 layers, so a mythical body brings 3.8M points of armour to the fight.",
      "Every damage type now wears the plates down: bullets 30% of their damage, missiles and flak 40%, beams 22%, area blasts 40% and shockwaves 15% (EMP, chain lightning and sonic still skip shelled enemies). Plate Breaker multiplies that by up to 2.5x, and a shattered layer's shockwave now scales with the enemy's own bite instead of its plate HP, so it cannot nuke a screen.",
      "Plating is drawn as solid steel slabs: a dark underlay for thickness, a filled top face tinted to the species, a bright rim, and one ridge per remaining layer. It sits under the whole body, darkens as it is chewed up, and no longer reads as a thin outline.",
      "The nest's siege cannon is now proximity-fused: any enemy inside the nest's 1,760u alert band powers it, and it stays online for 120s after the band clears. Taking damage no longer powers it; the retaliation blast still erases whatever hit the hull.",
    ],
  },
  {
    version: "2.0.5",
    date: "21 Nov 2026",
    title: "Admin test range",
    points: [
      "The admin panel gains a TEST RANGE section. TELEPORT TO EMPTY MAP drops the ship on a blank stretch of the outer ring, directly opposite the nest, and switches off every ambient spawn: world seeding, chunk top-up, the visibility floor and the boss pass all stay silent until you leave.",
      "Enemies, hostile projectiles and mines are wiped on entry; LEAVING EMPTY MAP puts the ship back where it stood (or at the nest if the run never seeded) and normal spawning resumes.",
      "A spawner picks any enemy species and any rarity from Common to Mythical, spawning one or five copies toward the cursor at 520–1,100u. Hand-spawned enemies are hostile immediately, and the world serpent can be summoned by hand even though its ambient boss pass stays disabled.",
      "CLEAR wipes the test range in one press. The test-range flag is session-only: a reload always returns to the live hive, and spawning is ignored unless admin mode is on.",
    ],
  },
  {
    version: "2.0.4",
    date: "21 Nov 2026",
    title: "Energy shields are hard walls",
    points: [
      "Enemy energy shields no longer have charge to strip. A blocked hit deals no damage and the bubble never depletes, collapses, re-arms or regenerates: it stays up until its Shield Generator part is destroyed.",
      "Only energy, shock and thermal damage passes through a bubble. Kinetic, physical, explosive and corrosive rounds and beams now stop dead at the hex edge with a cyan flash instead of chipping the shield or slipping through.",
      "The Rail Sniper no longer ignores energy shields. Only the Shield-Bypass Laser bypasses bubbles, and the rail is still stopped by hull shells.",
      "Damage-type tooltips and the stat compendium now describe the new rule; the old 8% strip constant is gone.",
    ],
  },
  {
    version: "2.0.3",
    date: "21 Nov 2026",
    title: "Particle budget pass",
    points: [
      "Particles are now pooled and recycled, and expired sparks are removed with a swap-pop instead of shifting the whole array. A busy fight no longer allocates and discards thousands of throwaway records.",
      "Sparks spawned outside the camera view are rejected immediately, the live budget drops from 1,500 to 900 at far zoom, and bursts emit 45% fewer sparks there. Close-up effects keep their full count.",
      "Small particles are drawn as one-pixel point sprites rather than three-, four- and six-sided paths. Particles under 2.5 screen pixels, or any particle at far zoom, take the cheap path; large close-up pieces keep their full shapes.",
      "Particle stroke/fill styles are cached between adjacent sparks, so a same-coloured burst no longer changes canvas state for every particle.",
    ],
  },
  {
    version: "2.0.2",
    date: "21 Nov 2026",
    title: "Kinetic shields, a much quieter inner map, and a full stat compendium",
    points: [
      "The base cannon now carries kinetic damage explicitly. Enemy energy-shield bubbles stop kinetic rounds instead of letting them pass through: each hit strips 8% of the generator's shield, the bubble collapses for 4s at zero, then re-arms at 40% capacity. Explosive and corrosive rounds still slip through, and bypass beams still ignore bubbles.",
      "Epic and higher zones spawn far less. Spawn weight is now 2.6 / 2.2 / 1.8 / 0.32 / 0.16 / 0.075 per chunk (was 2.6 / 2.2 / 1.8 / 0.56 / 0.44 / 0.36), local caps are 56 / 48 / 40 / 14 / 8 / 4 (was 56 / 48 / 40 / 18 / 10 / 5), and the seed-probability floor dropped from 38% to 3%.",
      "The visibility floor in legendary and mythical zones now spawns rare-tier enemies at most, so it cannot refill the core with legendaries. Each higher inner ring holds fewer residents than the one outside it.",
      "The complete enemy, weapon, shield, armour, optics, utility, ability and upgrade stat compendium now lives in docs/STATS.md.",
    ],
  },
  {
    version: "2.0.1",
    date: "21 Nov 2026",
    title: "Max-zoom performance pass and a cleaner mythical centre",
    points: [
      "Enemy detail now scales with both screen size and camera zoom. Close insects keep their full bodies; mid zoom drops plating and fine limbs; fully zoomed out turns every insect into a cheap species-coloured marker.",
      "Shield plating is drawn as a single species-tinted rim under the body instead of stacked grey fills. Dense mythical packs no longer merge into a white blob, and small plates can no longer float over wings as grey hexes.",
      "Large enemies separate using their real body sizes, melee insects stop at the edge of their own body, and the legendary/mythical population caps are lower. The centre of the map no longer piles a dozen titans on top of each other.",
      "Canvas shadows are limited to small on-screen pieces. Enemy projectiles, particles, loose components and credit motes all switch to cheap markers at far zoom.",
    ],
  },
  {
    version: "2.0",
    date: "21 Nov 2026",
    title: "Bulk upgrades, persistent admin, exploding components and global vision",
    points: [
      "Admin mode now stays enabled when you press HOME and return to the title screen. Its flags live in this tab's session storage and are never written into your pilot save.",
      "Upgrade cards have 1x / 5x / 10x / MAX buy buttons. MAX purchases as many levels as your credits allow, and every button shows the full price before you commit.",
      "Broken enemy weapons and shield parts now detonate in a visible shockwave. The expanding blast damages the breaking enemy's own hull, other enemies and the player as it sweeps past.",
      "Enemy plating layers also burst into a shockwave when their shield breaks, instead of vanishing silently.",
      "The 1.3x vision increase is now the global baseline instead of only applying inside the nest's alert ring. Optics still zoom out from there.",
      "Enemy damage is doubled at every rarity. The existing 3x step between rarity tiers is unchanged.",
    ],
  },
  {
    version: "1.9",
    date: "21 Nov 2026",
    title: "Circular player construct, whole-map spawns, credit drops and a retaliating nest",
    points: [
      "The player is no longer a ship. It is a circular construct with three pumping gimbal arms, counter-rotating armour rings, eight orbiting ring segments, three sensor motes and a forward iris — all visibly animated.",
      "Its three weapons sit on radial hardpoints at 120 degrees, rest pointing outward and rotate to track their firing direction.",
      "Every walkable chunk is populated at run start, so enemies exist across the whole map immediately and stay where they spawned. Rarity bands keep their density curve.",
      "Breaking an enemy part shakes loose 1-4 credit motes worth ~4% of the part's component value; they home in and are collected automatically.",
      "Any enemy that damages the nest is instantly destroyed. Base damage powers the siege cannon for 120 seconds; it goes dormant again after two quiet minutes.",
      "Inside the nest's 1,760u alert ring the camera pulls back for 1.3x player vision, and the HUD shows cannon status.",
    ],
  },
  {
    version: "1.8",
    date: "21 Nov 2026",
    title: "Turret-system rework, a far more detailed ship and rotating weapon mounts",
    points: [
      "Enemies no longer target the nest: they will not charge it, aim at it or gnaw on its hull. They now chase the ship straight through the 1,760u defence ring, so the cannon and hex turrets engage them inside turret range.",
      "The nest is still solid — stray rounds that cross its hull damage the structure, and the HUD now reads HOSTILES IN NEST RANGE instead of NEST UNDER ATTACK.",
      "The player ship is rebuilt from layered hull plates, swept wings with inset armour, a glass canopy, a fixed nose cannon, a reactor spine, engine block, tail fins, running lights, vents, rivets and panel seams.",
      "Every fitted weapon now sits on a rotating hex hardpoint and tracks the direction it fires, swinging smoothly back to the nose when it has no target.",
    ],
  },
  {
    version: "1.7.1",
    date: "20 Nov 2026",
    title: "Hex turrets hit four times harder and stop granting bestiary credit",
    points: [
      "Point-defence tracers now deal 4x damage: 18 -> 72 per shot, with the same 0.24s cadence and 850u range.",
      "Kills finished by the nest cannon or its hex turrets no longer unlock bestiary entries or show discovery banners; only player-credited kills count.",
    ],
  },
  {
    version: "1.7",
    date: "20 Nov 2026",
    title: "Hex turrets, legendary siege shells and a 120s repair lockout",
    points: [
      "Enemies now switch to the nest at 1,760u — just 10% past the cannon's 1,600u reach.",
      "Six small turrets ride the nest's hex pylons, spinning to Track and firing weak, fast tracers at anything within 850u.",
      "The siege cannon stays offline until a rare or better enters range. Its shell now one-shots legendaries; mythicals survive at 45% hull.",
      "Enemies finished mostly by the nest or its turrets drop no components at all.",
      "The nest only repairs after 120 seconds without taking damage.",
      "One hex turret is destroyed for every sixth of the nest's integrity lost; the HUD shows the remaining turrets.",
    ],
  },
  {
    version: "1.6.1",
    date: "20 Nov 2026",
    title: "Stable preview, solid bestiary cards, compact cores",
    points: [
      "The live preview is now served from a fresh production build with versioned chunk names, no-store headers and a self-healing version watchdog, so it can no longer fall back to an old 1.1 page.",
      "Bestiary entry cards and the hover detail card are fully opaque: the arena behind them no longer shows through.",
      "Enemy cores are compact again and tucked underneath the body, so segments and plating cover them instead of the core swallowing the silhouette.",
    ],
  },
  {
    version: "1.6",
    date: "20 Nov 2026",
    title: "Nest siege cannon and a destructible base",
    points: [
      "The nest mounts a slow siege cannon: one shell incinerates any enemy up to epic tier.",
      "Every shot kicks the barrel back hard, with a muzzle blast, plasma vent and camera shake.",
      "Insects inside 1.4x the cannon's reach charge the nest and ignore your ship.",
      "The nest has hull integrity; legendaries and mythicals tear through it in seconds.",
      "If the nest dies, every stored component and half your credits are lost, the blast kills every insect and the run ends at the title screen.",
      "The nest now appears in a different spot in the outer ring on every run.",
    ],
  },
  {
    version: "1.5",
    date: "20 Nov 2026",
    title: "Moth lag, roomier bestiary, visible loadout",
    points: [
      "Fixed the massive lag around the big white moth (huge shield/part blurs).",
      "Bestiary is larger and scrolls; hover cards pop up over the entry.",
      "Weapons, shields, armour, optics and utilities now show on the player hull.",
      "Added glow, charge and shield-arc effects to fitted hardware.",
    ],
  },
  {
    version: "1.4",
    date: "20 Nov 2026",
    title: "Bestiary, damage types and grey plating",
    points: [
      "Returning home now saves the run before leaving.",
      "Summoning insects can no longer clone themselves forever.",
      "Armour is a solid grey layer around parts; higher rarities get more layers.",
      "Energy shields block energy completely, but physical rounds pass through.",
      "Weapons show their damage type; attacks look different by type.",
      "New bestiary (bee button) with families, stats, drops and silhouettes.",
      "Rail reload 30% slower, deep-zone spawns 60% lower, zoom 30% shorter.",
    ],
  },
  {
    version: "1.3",
    date: "20 Nov 2026",
    title: "Crowded rings, huge cores, clearer guns",
    points: [
      "Settings and changelog on the title screen are now icon buttons.",
      "Outer zones spawn far more enemies, with a separate cap for every zone.",
      "At least a few enemies are kept inside the view at all times.",
      "Cores are 10x larger; armour plating now hugs every part outline in grey.",
      "Wide-Field Optics zoom out seven times further.",
      "Auto-fire never shoots off-screen; every weapon has its own range.",
      "New setting: coloured weapon range circles. Crafting menu has item art.",
    ],
  },
  {
    version: "1.2",
    date: "20 Nov 2026",
    title: "Bigger title, denser world",
    points: [
      "Title screen rebuilt: a huge WOFGUE.IO wordmark over the game's neon grid.",
      "Small geometric insects drift across the title background.",
      "Removed the callsign label and the tagline — just the name field and Play.",
      "Every zone now spawns at the same rate; the population cap is 36.",
      "Deeper zones feel emptier only because their enemies are far larger.",
    ],
  },
  {
    version: "1.1",
    date: "20 Nov 2026",
    title: "Title screen, settings and hover info",
    points: [
      "New title screen: Wofgue.io, callsign entry, Play, settings and changelog.",
      "Real settings panel (title screen and in-game) with every option in one place.",
      "Hover a loose component to see its name, rarity, value and mass — toggleable.",
      "The snake boss is disabled for now.",
      "Responsive layout for phones, tablets and desktop browsers.",
      "Save codes can be exported and restored from settings.",
    ],
  },
  {
    version: "1.0.1",
    date: "20 Nov 2026",
    title: "Combat and world pass",
    points: [
      "Missiles mark exact pieces on right-click and ignore everything en route.",
      "Crafted weapons fire automatically; B toggles the rack.",
      "Epic+ enemies wear grey plating: kinetic damage only, immune to lasers and shock.",
      "Lower, capped enemy population; centipede and snake bodies curve and are much longer.",
      "Removed bar text, CRIPPLED/IMMOBILISED and the HANGAR lettering.",
    ],
  },
  {
    version: "1.0",
    date: "19 Nov 2026",
    title: "Neon Hive expansion",
    points: [
      "22 new insect species plus a segmented boss, for 32 in total.",
      "51 recipes: 19 weapons, 10 shields, 11 armours, optics, utilities and 8 abilities.",
      "Ability hotbar on Z/X/C/V/F, admin sandbox, new crafting and loadout screens.",
    ],
  },
];
