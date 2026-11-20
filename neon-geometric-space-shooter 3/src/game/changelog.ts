/*
 * Version history shown by the CHANGELOG button on the title screen.
 *
 * Versioning rules (keep these when shipping):
 *   X.Y        — feature releases. Bump Y for a batch of new content or systems.
 *   X.Y.Z      — fixes, balance tweaks and small quality-of-life changes.
 *   Every shipped change must bump VERSION, add a dated entry at the TOP of
 *   CHANGELOG and mirror the details in docs/CHANGELOG.md.
 */

export const VERSION = "2.0";

export interface ChangeEntry {
  version: string;
  /** human-readable release date */
  date: string;
  title: string;
  points: string[];
}

export const CHANGELOG: ChangeEntry[] = [
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
