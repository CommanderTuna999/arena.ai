/*
 * Version history shown by the CHANGELOG button on the title screen.
 *
 * Versioning rules (keep these when shipping):
 *   X.Y        — feature releases. Bump Y for a batch of new content or systems.
 *   X.Y.Z      — fixes, balance tweaks and small quality-of-life changes.
 *   Every shipped change must bump VERSION, add a dated entry at the TOP of
 *   CHANGELOG and mirror the details in docs/CHANGELOG.md.
 */

export const VERSION = "1.3";

export interface ChangeEntry {
  version: string;
  /** human-readable release date */
  date: string;
  title: string;
  points: string[];
}

export const CHANGELOG: ChangeEntry[] = [
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
