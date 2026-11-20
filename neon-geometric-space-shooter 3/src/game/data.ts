import { clamp, fmtNum } from "./math";

/* ---------- world constants ---------- */
export const WORLD_R = 16000;
/* The nest drifts around the outer ring every run: the x/y below are only the
 * initial fallback, Game.placeBase() moves it before the player spawns. */
export const BASE = { x: 0, y: 15000, r: 260, dock: 175, safe: 950, turretR: 1600, aggroR: 2240 };
/** radius band the nest may occupy — the outer (common) ring only */
export const BASE_RING = { min: 13900, max: 15300 };
/** structural integrity of the nest; high-tier enemies chew through this fast */
export const BASE_MAX_HP = 600;
/** incoming damage multiplier by attacker tier (common … mythical) */
export const BASE_TAKE = [0, 0.01, 0.4, 1, 1.6, 2.4];
export const SHIP_R = 15;
/** distance-from-centre thresholds: tier = index of first threshold the distance is under (mythical first) */
export const ZONE_EDGES = [2200, 4800, 7800, 10600, 13200]; // mythical, legendary, epic, rare, uncommon, else common

export function zoneTier(distFromCentre: number) {
  for (let i = 0; i < ZONE_EDGES.length; i++) if (distFromCentre < ZONE_EDGES[i]) return 5 - i;
  return 0;
}

/* ---------- rarities ---------- */
export const RARITIES = [
  { id: "common", name: "Common", color: "#9db4c9" },
  { id: "uncommon", name: "Uncommon", color: "#45ff8a" },
  { id: "rare", name: "Rare", color: "#3fa9ff" },
  { id: "epic", name: "Epic", color: "#c45cff" },
  { id: "legendary", name: "Legendary", color: "#ffb21f" },
  { id: "mythical", name: "Mythical", color: "#ff3d73" },
] as const;

export const SIZE_GROWTH = 1.65;
export const HP_MUL = [1, 4, 18, 80, 360, 1600];
export const DMG_MUL = [1, 3, 9, 27, 81, 243];

/* ---------- parts / components ---------- */
export type PartKind = "core" | "segment" | "armor" | "leg" | "arm" | "wing" | "weapon" | "shield" | "spike";
export type Category = "core" | "plate" | "body" | "limb" | "wing" | "weapon" | "shield";
export const KIND_CAT: Record<PartKind, Category> = {
  core: "core", segment: "body", armor: "plate", leg: "limb", arm: "limb", wing: "wing", weapon: "weapon", shield: "shield", spike: "plate",
};
export const CAT_NAME: Record<Category, string> = {
  core: "Core", plate: "Plate", body: "Body", limb: "Limb", wing: "Wing", weapon: "Weapon", shield: "Shield",
};

export interface Comp {
  id: string;
  species: string;
  name: string;
  kind: PartKind;
  tier: number;
  poly: number[];
  area: number;
  mass: number;
  hue: number;
  value: number;
}

export function compValue(area: number, tier: number, kind: PartKind) {
  const base = (10 + 1.1 * Math.sqrt(area)) * Math.pow(3.6, tier) * 1.6;
  return Math.round(base * (kind === "core" ? 3 : 1));
}
export const compMass = (area: number) => Math.max(0.2, area / 900);

/* ---------- upgrades ---------- */
export type UpCat = "weapons" | "hull" | "mobility" | "harpoon" | "salvage";
export interface UpgradeDef {
  id: string;
  name: string;
  cat: UpCat;
  desc: string;
  max: number;
  base: number;
  growth: number;
  fmt: (l: number) => string;
}

export const UPGRADES: UpgradeDef[] = [
  { id: "dmg", name: "Cannon Damage", cat: "weapons", desc: "Raw damage per shot.", max: 30, base: 20, growth: 1.45, fmt: (l) => `${fmtNum(10 * Math.pow(1.2, l))} dmg` },
  { id: "rate", name: "Fire Rate", cat: "weapons", desc: "Shots per second.", max: 12, base: 40, growth: 1.5, fmt: (l) => `${(4 + 0.7 * l).toFixed(1)}/s` },
  { id: "barrels", name: "Extra Barrels", cat: "weapons", desc: "Fire a fan of additional shots.", max: 4, base: 150, growth: 2.6, fmt: (l) => `${1 + l} barrel${l ? "s" : ""}` },
  { id: "pierce", name: "Piercing Rounds", cat: "weapons", desc: "Shots punch through extra pieces (-20% damage each).", max: 5, base: 120, growth: 2.2, fmt: (l) => `+${l} pierce` },
  { id: "crit", name: "Targeting Matrix", cat: "weapons", desc: "Chance for 2.5x critical hits.", max: 10, base: 60, growth: 1.55, fmt: (l) => `${5 + 4 * l}% crit` },
  { id: "breaker", name: "Plate Breaker", cat: "weapons", desc: "Bonus damage to armour plates & shield generators.", max: 10, base: 80, growth: 1.6, fmt: (l) => `+${15 * l}% vs plates` },
  { id: "coreseek", name: "Core Seeker", cat: "weapons", desc: "Bonus damage to enemy cores.", max: 8, base: 90, growth: 1.7, fmt: (l) => `+${20 * l}% vs cores` },
  { id: "frag", name: "Fragmentation Rounds", cat: "weapons", desc: "Hits splash into neighbouring pieces.", max: 6, base: 200, growth: 1.9, fmt: (l) => (l ? `${18 + 9 * l}px splash` : "none") },
  { id: "velocity", name: "Rail Coils", cat: "weapons", desc: "Faster, longer-ranged shots.", max: 8, base: 50, growth: 1.5, fmt: (l) => `+${l * 10}% speed` },

  { id: "hull", name: "Hull Plating", cat: "hull", desc: "Maximum hull integrity.", max: 30, base: 25, growth: 1.5, fmt: (l) => `${fmtNum(100 * Math.pow(1.22, l))} HP` },
  { id: "regen", name: "Nano Repair", cat: "hull", desc: "Hull regenerates every second.", max: 10, base: 70, growth: 1.6, fmt: (l) => `${(0.5 * l).toFixed(1)}%/s` },
  { id: "armor", name: "Reactive Armour", cat: "hull", desc: "Flat percentage damage reduction.", max: 14, base: 90, growth: 1.7, fmt: (l) => `-${(3.5 * l).toFixed(1)}% dmg` },
  { id: "shield", name: "Energy Shield Core", cat: "hull", desc: "A recharging shield layer. Level 1 unlocks it.", max: 25, base: 120, growth: 1.55, fmt: (l) => (l ? `${fmtNum(60 * Math.pow(1.28, l - 1))} shield` : "locked") },
  { id: "dampers", name: "Inertial Dampers", cat: "hull", desc: "Resist slows, snares and pulls from enemies.", max: 6, base: 100, growth: 1.8, fmt: (l) => `${12 * l}% resist` },

  { id: "thrust", name: "Thrusters", cat: "mobility", desc: "Top speed.", max: 12, base: 40, growth: 1.5, fmt: (l) => `${450 + 40 * l} u/s` },
  { id: "handling", name: "Handling Jets", cat: "mobility", desc: "Acceleration and agility.", max: 10, base: 45, growth: 1.45, fmt: (l) => `${1500 + 200 * l} accel` },
  { id: "boost", name: "Afterburner", cat: "mobility", desc: "Hold SHIFT for a speed burst. Level 1 unlocks it.", max: 8, base: 150, growth: 1.8, fmt: (l) => (l ? `x${(1.7 + 0.1 * (l - 1)).toFixed(1)} burst` : "locked") },

  { id: "hcount", name: "Launcher Bays", cat: "harpoon", desc: "Number of harpoons you can have out at once.", max: 3, base: 100, growth: 3, fmt: (l) => `${1 + l} harpoon${l ? "s" : ""}` },
  { id: "hstr", name: "Cable Tensile Strength", cat: "harpoon", desc: "Weight each harpoon can tow before it snaps.", max: 16, base: 30, growth: 1.55, fmt: (l) => `${fmtNum(5 * Math.pow(1.42, l))} load` },
  { id: "hrange", name: "Launcher Range", cat: "harpoon", desc: "How far the harpoon flies.", max: 10, base: 40, growth: 1.45, fmt: (l) => `${380 + 60 * l} u` },
  { id: "hhp", name: "Cable Armouring", cat: "harpoon", desc: "Durability of the cable against enemy attacks.", max: 12, base: 50, growth: 1.5, fmt: (l) => `${fmtNum(40 * Math.pow(1.35, l))} HP` },
  { id: "hspeed", name: "Winch Motor", cat: "harpoon", desc: "Launch speed, reel speed and less towing drag.", max: 8, base: 60, growth: 1.5, fmt: (l) => `${1000 + 140 * l} u/s` },

  { id: "value", name: "Salvage Contracts", cat: "salvage", desc: "Credits received when selling components.", max: 20, base: 50, growth: 1.5, fmt: (l) => `x${(1 + 0.25 * l).toFixed(2)}` },
  { id: "drops", name: "Scavenger Drones", cat: "salvage", desc: "Chance for pieces to drop components.", max: 10, base: 60, growth: 1.55, fmt: (l) => `${30 + 4 * l}% drop` },
  { id: "luck", name: "Rarity Scanner", cat: "salvage", desc: "Better rarity rolls on dropped components.", max: 8, base: 100, growth: 1.7, fmt: (l) => `+${l * 5}% luck` },
  { id: "cargo", name: "Cargo Bay", cat: "salvage", desc: "Storage capacity for components.", max: 8, base: 80, growth: 1.7, fmt: (l) => `${24 + 12 * l} slots` },
];

export const UP_CATS: { id: UpCat; name: string; color: string }[] = [
  { id: "weapons", name: "Weapons", color: "#ff4d6d" },
  { id: "hull", name: "Hull", color: "#4dffb4" },
  { id: "mobility", name: "Mobility", color: "#ffe14d" },
  { id: "harpoon", name: "Harpoon", color: "#4dd2ff" },
  { id: "salvage", name: "Salvage", color: "#c77dff" },
];

export const upgradeCost = (u: UpgradeDef, level: number) => Math.round(u.base * Math.pow(u.growth, level));

/* ---------- crafting ----------
 * BALANCE REFERENCE (all damage values are multiples of the player's base cannon
 * damage, st.dmg = 10 * 1.2^dmgLevel. Cooldowns are seconds at 100% efficiency;
 * crafted efficiency scales both damage and cooldown: cd / (0.7 + 0.3*eff)).
 *
 * WEAPONS (19)
 *   pulse   0.60 dmg / 0.45s   auto turret, nearest target within 650u
 *   scatter 0.55 x6 / 0.75s    shotgun cone, 6 pellets, short range
 *   missile 2.20 x2 / 1.50s    homing seeker pod, splash
 *   lance   0.22 / 0.12s       beam, pierces 2+ pieces, stops on plating
 *   homing  3.10 / 1.70s       right-click mark, ignores everything en route
 *   bypass  0.16 / 0.10s       auto beam, ignores shields, stopped by plating
 *   hmg     0.10 / 0.075s      high rate, wide spread, weak per hit
 *   emp     1.40 / 2.60s       AoE stun 1.8s, radius 620u
 *   cutter  1.10 / 0.18s       short plasma arc (175u), 1+ pierce
 *   acid    0.30 x3 / 0.16s    corrosive, +32% melt per hit + 1.6 dps dot
 *   chain   1.60 / 0.80s       arcs through 5 pieces, -25% per jump
 *   flak    1.30 / 0.90s       airburst at cursor, 125u splash
 *   rail    2.40 / 1.40s       beam, 1500u, pierces 12
 *   gravity 2.80 / 3.20s       well drags enemies for 1.15s then implodes
 *   mines   2.50 / 1.10s       proximity mine, 150u, armed after 0.7s
 *   drones  0.40 / 0.55s       two orbiting drones, auto fire
 *   venom   0.45 x2 / 0.35s    3.2 dps stacking venom
 *   sonic   0.60 / 1.60s       cone stun 1.5s, 540u, shove
 *   cluster 1.70 / 2.20s       rocket splits into 4 bomblets
 *
 * SHIELDS (10): deflector 45% hull, absorber 22% fast, reflector 32% + reflect,
 *   kinetic 38% +30% flat reduction, phase 25% +12% dodge, ward 30% fast regen,
 *   shell 20% + nova on break, overcharge 70% slow, nullfield 35% + projectile
 *   swallow, prismatic 40% + reflect + dodge.
 * ARMOUR (11): plating +35% hull, reactive -12% damage, thorn shockwave,
 *   chitin +25% hull +2% armour, carapace +55% hull -6% speed,
 *   nanoweave +12% hull +0.4%/s regen, ablative -8% damage, titan +90% hull
 *   -12% speed, exoskeleton +12% thrust, venomguard 20% poison resist,
 *   scalemail +18% hull +3% armour.
 * ABILITIES (8): EMP 14s, salvo 12s, repair 22s, blink 9s, barrier 18s,
 *   overdrive 26s, timewarp 24s, shockwave 16s (see ABILITY_LIST below).
 */

export type Slot = "weapon" | "shield" | "armor" | "optics" | "utility" | "ability";
export interface Recipe {
  id: string;
  name: string;
  slot: Slot;
  desc: string;
  difficulty: number;
  n: number;
  need?: { cats?: Category[]; count: number };
  species?: { names: string[]; count: number };
  /** rough per-shot damage (as a multiple of base cannon damage) and cooldown, for weapons & abilities */
  wpn?: { dmg: number; cd: number };
}

export const RECIPES: Recipe[] = [
  /* ---------------- weapons ---------------- */
  { id: "pulse", name: "Pulse Turret", slot: "weapon", difficulty: 1, n: 3, wpn: { dmg: 0.6, cd: 0.45 }, desc: "Auto-targeting turret. Fires at the nearest enemy piece on its own." },
  { id: "scatter", name: "Scatter Driver", slot: "weapon", difficulty: 2, n: 4, need: { cats: ["limb", "plate"], count: 1 }, wpn: { dmg: 0.55, cd: 0.75 }, desc: "Short-range shotgun burst on your fire button." },
  { id: "missile", name: "Seeker Pod", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["weapon", "shield"], count: 1 }, wpn: { dmg: 2.2, cd: 1.5 }, desc: "Launches homing missiles with splash damage." },
  { id: "lance", name: "Arc Lance", slot: "weapon", difficulty: 4, n: 6, need: { cats: ["core"], count: 1 }, wpn: { dmg: 0.22, cd: 0.12 }, desc: "Piercing beam. Strong against soft targets, stopped dead by armour plating." },
  { id: "homing", name: "Homing Missile Launcher", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["weapon"], count: 1 }, species: { names: ["Bombardier Beetle", "Yellowjacket"], count: 1 }, wpn: { dmg: 3.1, cd: 1.8 }, desc: "Right-click any enemy piece to mark it. Missiles fly straight through everything else to that exact spot." },
  { id: "bypass", name: "Shield-Bypass Laser", slot: "weapon", difficulty: 5, n: 7, need: { cats: ["core", "weapon"], count: 1 }, species: { names: ["Jewel Beetle", "Firefly"], count: 1 }, wpn: { dmg: 0.16, cd: 0.1 }, desc: "Auto-firing beam that ignores shield generators but cannot cut through armour plating." },
  { id: "hmg", name: "Heavy Machine Gun", slot: "weapon", difficulty: 2, n: 4, need: { cats: ["weapon", "limb"], count: 1 }, wpn: { dmg: 0.1, cd: 0.08 }, desc: "Very high rate of fire, wide spray, weak per hit. Good for stripping light enemies." },
  { id: "emp", name: "EMP Cannon", slot: "weapon", difficulty: 4, n: 6, need: { cats: ["core", "shield"], count: 1 }, species: { names: ["Cicada", "Firefly"], count: 1 }, wpn: { dmg: 1.4, cd: 2.6 }, desc: "Pulse that stuns every enemy within a wide radius." },
  { id: "cutter", name: "Plasma Cutter", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["plate", "weapon"], count: 1 }, wpn: { dmg: 1.1, cd: 0.18 }, desc: "Short, searing plasma arc that shreds plates at point-blank range." },
  { id: "acid", name: "Acid Sprayer", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["body", "limb"], count: 1 }, species: { names: ["Soldier Ant", "Worker Ant", "Bombardier Beetle"], count: 1 }, wpn: { dmg: 0.3, cd: 0.16 }, desc: "Cone of corrosive globs. Melts armour so every following hit lands harder." },
  { id: "chain", name: "Chain Lightning", slot: "weapon", difficulty: 4, n: 6, need: { cats: ["core", "wing"], count: 1 }, species: { names: ["Firefly", "Jewel Beetle"], count: 1 }, wpn: { dmg: 1.6, cd: 0.8 }, desc: "Arcs between up to five nearby pieces, losing power with every jump." },
  { id: "flak", name: "Flak Cannon", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["plate", "body"], count: 1 }, wpn: { dmg: 1.3, cd: 0.9 }, desc: "Lobs airburst shells that detonate near the target point." },
  { id: "rail", name: "Rail Sniper", slot: "weapon", difficulty: 5, n: 7, need: { cats: ["core", "weapon"], count: 1 }, species: { names: ["Tiger Beetle", "Assassin Bug"], count: 1 }, wpn: { dmg: 2.4, cd: 1.4 }, desc: "Hypervelocity slug that pierces the enemy line — but not plating." },
  { id: "gravity", name: "Gravity Bomb", slot: "weapon", difficulty: 5, n: 7, need: { cats: ["core", "body"], count: 1 }, species: { names: ["Dung Beetle", "Atlas Moth"], count: 1 }, wpn: { dmg: 2.8, cd: 3.2 }, desc: "Collapses a gravity well that drags enemies in, then implodes." },
  { id: "mines", name: "Mine Layer", slot: "weapon", difficulty: 2, n: 4, need: { cats: ["plate", "weapon"], count: 1 }, species: { names: ["Weevil", "Scarab"], count: 1 }, wpn: { dmg: 2.5, cd: 1.1 }, desc: "Drops proximity mines behind you that shred anything that follows." },
  { id: "drones", name: "Swarm Drones", slot: "weapon", difficulty: 4, n: 6, need: { cats: ["wing", "core"], count: 1 }, species: { names: ["Honeybee", "Yellowjacket", "Hornet"], count: 1 }, wpn: { dmg: 0.4, cd: 0.55 }, desc: "Deploys two orbiting drones that fire at nearby enemies." },
  { id: "venom", name: "Venom Injector", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["limb", "weapon"], count: 1 }, species: { names: ["Assassin Bug", "Wasp", "Mosquito"], count: 1 }, wpn: { dmg: 0.45, cd: 0.35 }, desc: "Fast darts that inject a stacking venom that eats enemies from inside." },
  { id: "sonic", name: "Sonic Disruptor", slot: "weapon", difficulty: 4, n: 6, need: { cats: ["wing", "core"], count: 1 }, species: { names: ["Cicada", "Katydid", "Locust"], count: 1 }, wpn: { dmg: 0.6, cd: 1.6 }, desc: "Cone of concussive sound that stuns and shoves everything in front of you." },
  { id: "cluster", name: "Cluster Rockets", slot: "weapon", difficulty: 5, n: 7, need: { cats: ["weapon", "shield"], count: 1 }, species: { names: ["Bombardier Beetle", "Rhinoceros Beetle"], count: 1 }, wpn: { dmg: 1.7, cd: 2.2 }, desc: "Rockets that burst into a shower of bomblets on impact." },

  /* ---------------- shields ---------------- */
  { id: "deflector", name: "Deflector Array", slot: "shield", difficulty: 1, n: 3, desc: "Large shield pool that recharges after a short delay." },
  { id: "absorber", name: "Absorber Core", slot: "shield", difficulty: 2, n: 4, need: { cats: ["plate"], count: 1 }, desc: "Smaller shield that recharges extremely fast." },
  { id: "reflector", name: "Mirror Barrier", slot: "shield", difficulty: 3, n: 5, need: { cats: ["shield", "core", "wing"], count: 1 }, desc: "Shield that reflects enemy bolts back at them." },
  { id: "kinetic", name: "Kinetic Barrier", slot: "shield", difficulty: 2, n: 4, need: { cats: ["plate", "body"], count: 1 }, desc: "Heavy barrier that flattens all incoming damage while it holds." },
  { id: "phase", name: "Phase Shield", slot: "shield", difficulty: 4, n: 6, need: { cats: ["wing", "core"], count: 1 }, species: { names: ["Cicada", "Atlas Moth"], count: 1 }, desc: "Flickers out of phase, dodging a share of every incoming hit." },
  { id: "ward", name: "Regenerating Ward", slot: "shield", difficulty: 3, n: 5, need: { cats: ["body"], count: 1 }, species: { names: ["Ladybug", "Firefly"], count: 1 }, desc: "Modest shield that knits itself back together almost immediately." },
  { id: "shell", name: "Reactive Shell", slot: "shield", difficulty: 4, n: 6, need: { cats: ["plate", "shield"], count: 1 }, species: { names: ["Rhinoceros Beetle", "Cockroach"], count: 1 }, desc: "When the shield collapses it detonates, shredding nearby enemies." },
  { id: "overcharge", name: "Overcharge Shield", slot: "shield", difficulty: 5, n: 7, need: { cats: ["core", "shield"], count: 1 }, species: { names: ["Jewel Beetle", "Firefly"], count: 1 }, desc: "Enormous shield pool with a very slow recharge." },
  { id: "nullfield", name: "Null Field", slot: "shield", difficulty: 5, n: 7, need: { cats: ["core", "wing"], count: 1 }, species: { names: ["Moth", "Atlas Moth"], count: 1 }, desc: "Periodically swallows every enemy projectile that touches it." },
  { id: "prismatic", name: "Prismatic Barrier", slot: "shield", difficulty: 5, n: 7, need: { cats: ["wing", "shield", "core"], count: 1 }, species: { names: ["Jewel Beetle"], count: 1 }, desc: "Reflects bolts, dodges hits and adds a solid shield pool." },

  /* ---------------- armour ---------------- */
  { id: "plating", name: "Hull Plating Kit", slot: "armor", difficulty: 1, n: 3, need: { cats: ["plate", "body"], count: 1 }, desc: "Adds a large chunk of extra hull." },
  { id: "reactive", name: "Reactive Lattice", slot: "armor", difficulty: 3, n: 5, need: { cats: ["plate"], count: 2 }, desc: "Cuts all incoming damage." },
  { id: "thorn", name: "Thorn Mesh", slot: "armor", difficulty: 2, n: 4, need: { cats: ["limb"], count: 1 }, desc: "When hit, emits a shockwave that damages nearby enemy pieces." },
  { id: "chitin", name: "Chitin Plating", slot: "armor", difficulty: 2, n: 4, need: { cats: ["plate"], count: 1 }, species: { names: ["Cockroach", "Worker Ant"], count: 1 }, desc: "Light chitin layers: extra hull and a little flat damage reduction." },
  { id: "carapace", name: "Carapace Shell", slot: "armor", difficulty: 3, n: 5, need: { cats: ["plate", "body"], count: 1 }, species: { names: ["Rhinoceros Beetle", "Dung Beetle", "Scarab"], count: 1 }, desc: "Massive hull bonus at the cost of top speed." },
  { id: "nanoweave", name: "Nano-weave Mesh", slot: "armor", difficulty: 4, n: 6, need: { cats: ["wing", "body"], count: 1 }, species: { names: ["Atlas Moth", "Widow Spider"], count: 1 }, desc: "Self-repairing weave that continuously regenerates hull." },
  { id: "ablative", name: "Ablative Coating", slot: "armor", difficulty: 3, n: 5, need: { cats: ["plate", "shield"], count: 1 }, species: { names: ["Cockroach", "Weevil"], count: 1 }, desc: "Sacrificial coating that absorbs a big share of every hit." },
  { id: "titan", name: "Titan Frame", slot: "armor", difficulty: 5, n: 7, need: { cats: ["body", "plate"], count: 2 }, species: { names: ["Dung Beetle", "Snake"], count: 1 }, desc: "Colossal armour frame: the biggest hull bonus in the game, heavy as lead." },
  { id: "exoskeleton", name: "Exoskeleton Rig", slot: "armor", difficulty: 3, n: 5, need: { cats: ["limb"], count: 2 }, species: { names: ["Grasshopper", "Tiger Beetle", "Mole Cricket"], count: 1 }, desc: "Servo-assisted exoskeleton: agility and acceleration instead of bulk." },
  { id: "venomguard", name: "Venom Guard", slot: "armor", difficulty: 4, n: 6, need: { cats: ["plate", "limb"], count: 1 }, species: { names: ["Assassin Bug", "Yellowjacket", "Centipede"], count: 1 }, desc: "Neutralises toxins and adds a small hull bonus." },
  { id: "scalemail", name: "Scale Mail", slot: "armor", difficulty: 4, n: 6, need: { cats: ["plate", "wing"], count: 1 }, species: { names: ["Snake", "Jewel Beetle", "Ladybug"], count: 1 }, desc: "Overlapping scales: solid hull and all-round damage reduction." },

  /* ---------------- optics / utility ---------------- */
  { id: "lens", name: "Wide-Field Optics", slot: "optics", difficulty: 2, n: 4, need: { cats: ["wing", "core"], count: 1 }, desc: "Unlocks mouse-wheel zoom out. Better efficiency zooms further." },
  { id: "recall", name: "Recall Beacon", slot: "utility", difficulty: 4, n: 6, need: { cats: ["core"], count: 1 }, desc: "Press T to channel a teleport back to base." },
  { id: "magnet", name: "Component Magnet", slot: "utility", difficulty: 3, n: 5, need: { cats: ["core", "body"], count: 1 }, species: { names: ["Worker Ant", "Honeybee"], count: 1 }, desc: "Passively drags loose components toward your craft from a wide radius." },

  /* ---------------- active abilities (Z / X / C / V / F) ---------------- */
  { id: "ab_emp", name: "EMP Burst", slot: "ability", difficulty: 3, n: 5, need: { cats: ["core", "shield"], count: 1 }, species: { names: ["Cicada", "Firefly"], count: 1 }, desc: "Discharges an electromagnetic ring that stuns every enemy around you." },
  { id: "ab_salvo", name: "Missile Salvo", slot: "ability", difficulty: 4, n: 6, need: { cats: ["weapon"], count: 1 }, desc: "Fires a full ring of homing missiles at nearby enemies." },
  { id: "ab_repair", name: "Nano Repair Field", slot: "ability", difficulty: 3, n: 5, need: { cats: ["body", "core"], count: 1 }, species: { names: ["Worker Ant", "Carpenter Ant"], count: 1 }, desc: "Instantly restores a large chunk of hull and tops up your shield." },
  { id: "ab_blink", name: "Phase Blink", slot: "ability", difficulty: 4, n: 6, need: { cats: ["wing", "core"], count: 1 }, species: { names: ["Cicada", "Katydid", "Mantis"], count: 1 }, desc: "Teleports you a long way in the direction you are facing." },
  { id: "ab_barrier", name: "Aegis Barrier", slot: "ability", difficulty: 3, n: 5, need: { cats: ["shield"], count: 1 }, desc: "Projects a temporary overshield that absorbs damage before your hull." },
  { id: "ab_overdrive", name: "Overdrive", slot: "ability", difficulty: 5, n: 7, need: { cats: ["core", "weapon"], count: 1 }, species: { names: ["Tiger Beetle", "Hornet"], count: 1 }, desc: "Overclocks your weapons: far more damage and fire rate for a few seconds." },
  { id: "ab_timewarp", name: "Time Warp", slot: "ability", difficulty: 5, n: 7, need: { cats: ["core", "wing"], count: 1 }, species: { names: ["Atlas Moth", "Luna Moth"], count: 1 }, desc: "Warps local time, slowing every enemy nearby to a crawl." },
  { id: "ab_shockwave", name: "Shockwave", slot: "ability", difficulty: 4, n: 6, need: { cats: ["plate", "body"], count: 1 }, species: { names: ["Dung Beetle", "Scarab"], count: 1 }, desc: "Blasts everything around you outward and tears it apart." },
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/* ---------- weapon engagement ranges ----------
 * Range is a role, not a flat number: cutters and shotguns fight at knife range,
 * machine guns hold the mid line, and the rail gun is the long-range option.
 * fireWeapons() and the range overlay both read this table, so the circles the
 * player sees are exactly the distances the guns will shoot.
 * Auto-fire additionally refuses targets outside the visible screen.
 */
export const WEAPON_RANGE: Record<string, number> = {
  cutter: 190,
  lance: 330,
  acid: 400,
  scatter: 420,
  sonic: 470,
  pulse: 560,
  venom: 560,
  emp: 560,
  hmg: 650,
  bypass: 700,
  chain: 780,
  flak: 800,
  gravity: 800,
  mines: 800,
  missile: 850,
  homing: 900,
  cluster: 950,
  rail: 1150,
};

/** Range-circle colour by weapon role (also used in the crafting icons). */
export const WEAPON_TINT: Record<string, string> = {
  cutter: "#ff5c8a", lance: "#7df9ff", bypass: "#7df9ff", rail: "#7df9ff", emp: "#7df9ff", chain: "#7df9ff", sonic: "#7df9ff",
  pulse: "#ffd24d", scatter: "#ffd24d", hmg: "#ffd24d", flak: "#ffd24d",
  missile: "#ff7a5c", cluster: "#ff7a5c", mines: "#ff7a5c", gravity: "#ff7a5c",
  acid: "#9dff6a", venom: "#9dff6a",
  homing: "#ff5cf0",
};

/* ---------- damage types ----------
 * Every weapon deals exactly one kind; shields and armour list what they block.
 * Enemy energy shields stop energy/shock/thermal completely but physical rounds
 * (kinetic, explosive, corrosive) pass straight through them.
 */
export type DmgKind = "kinetic" | "energy" | "explosive" | "shock" | "corrosive" | "thermal" | "physical";
export interface DmgInfo { name: string; color: string; note: string }
export const DMG_INFO: Record<DmgKind, DmgInfo> = {
  kinetic: { name: "Kinetic", color: "#ffd24d", note: "solid rounds; plating reduces it to 30%" },
  energy: { name: "Energy", color: "#7df9ff", note: "lasers and beams; plating blocks it, energy shields block it" },
  explosive: { name: "Explosive", color: "#ff7a5c", note: "blast damage; plating reduces it to 30%" },
  shock: { name: "Shock", color: "#c77dff", note: "electrical arcs; plating blocks it, energy shields block it" },
  corrosive: { name: "Corrosive", color: "#9dff6a", note: "acid; melts plating and bypasses energy shields" },
  thermal: { name: "Thermal", color: "#ff8ad6", note: "plasma heat; energy shields block it" },
  physical: { name: "Physical", color: "#c3ccd6", note: "blunt impacts and collisions" },
};

export const WEAPON_DMG: Record<string, DmgKind> = {
  pulse: "energy", scatter: "kinetic", missile: "explosive", lance: "energy", homing: "explosive",
  bypass: "energy", hmg: "kinetic", emp: "shock", cutter: "thermal", acid: "corrosive", chain: "shock",
  flak: "explosive", rail: "kinetic", gravity: "shock", mines: "explosive", drones: "kinetic",
  venom: "corrosive", sonic: "shock", cluster: "explosive",
};

/** What a crafted item deals, or which damage kinds it blocks. */
export function damageProfile(r: Recipe): { deals?: DmgKind; blocks?: DmgKind[] } {
  if (r.slot === "weapon") return { deals: WEAPON_DMG[r.id] ?? "kinetic" };
  if (r.slot === "shield") {
    const blocks: DmgKind[] = ["energy", "thermal"];
    if (["kinetic", "phase", "ward", "reflector", "prismatic", "nullfield"].includes(r.id)) blocks.push("kinetic");
    if (["kinetic", "prismatic"].includes(r.id)) blocks.push("explosive");
    return { blocks };
  }
  if (r.slot === "armor") {
    const blocks: DmgKind[] = ["kinetic", "physical"];
    if (["ablative", "nanoweave", "scalemail"].includes(r.id)) blocks.push("explosive");
    if (["titan", "carapace", "chitin"].includes(r.id)) blocks.push("corrosive");
    return { blocks };
  }
  if (r.slot === "ability") return { deals: r.id.includes("shockwave") ? "physical" : r.id.includes("overdrive") ? "kinetic" : "shock" };
  return {};
}
export const SLOT_NAME: Record<Slot, string> = { weapon: "Weapon", shield: "Shield", armor: "Armour", optics: "Optics", utility: "Utility", ability: "Ability" };

export function craftEfficiency(r: Recipe, comps: Comp[]) {
  if (!comps.length) return 0;
  const avg = comps.reduce((s, c) => s + c.tier + (c.kind === "core" ? 0.5 : 0), 0) / comps.length;
  const raw = (0.6 + 0.3 * avg) * (1 - 0.05 * (r.difficulty - 1));
  return Math.max(0.3, raw);
}

export function recipeProblem(r: Recipe, comps: Comp[]): string | null {
  if (comps.length !== r.n) return `Needs exactly ${r.n} components`;
  if (r.need?.cats) {
    const have = comps.filter((c) => r.need!.cats!.includes(KIND_CAT[c.kind])).length;
    if (have < r.need.count) return `Needs ${r.need.count}x ${r.need.cats.map((c) => CAT_NAME[c]).join("/")}`;
  }
  if (r.species) {
    const have = comps.filter((c) => r.species!.names.includes(c.species)).length;
    if (have < r.species.count) return `Needs ${r.species.count}x part from ${r.species.names.join(" / ")}`;
  }
  return null;
}

export interface Crafted {
  id: string;
  rid: string;
  eff: number;
}
export interface Equip {
  weapon: (string | null)[];
  shield: string | null;
  armor: string | null;
  optics: string | null;
  utility: string | null;
}

/* ---------- active abilities ---------- */
export const ABILITY_KEYS = ["Z", "X", "C", "V", "F"] as const;
/** one of the five hotbar slots; holds a crafted ability item id or null */
export type ActiveAbilitySlot = string | null;
export const ABILITY_CODES = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyF"] as const;

export interface AbilitySpec {
  id: string;
  name: string;
  desc: string;
  cd: number;
  dur: number;
  icon: string;
  color: string;
}

export const ABILITY_LIST: AbilitySpec[] = [
  { id: "ab_emp", name: "EMP Burst", desc: "Stuns every enemy within 760 units for 2.6s.", cd: 14, dur: 2.6, icon: "◉", color: "#7df9ff" },
  { id: "ab_salvo", name: "Missile Salvo", desc: "Launches 10 homing missiles at the nearest enemies.", cd: 12, dur: 0, icon: "➤", color: "#ffb04d" },
  { id: "ab_repair", name: "Nano Repair", desc: "Restores 35% hull and refills 60% of your shield.", cd: 22, dur: 0, icon: "✚", color: "#7dffb4" },
  { id: "ab_blink", name: "Phase Blink", desc: "Teleports 520 units along your heading.", cd: 9, dur: 0, icon: "⟫", color: "#c77dff" },
  { id: "ab_barrier", name: "Aegis Barrier", desc: "Absorbs damage with a temporary 2.5s overshield.", cd: 18, dur: 2.5, icon: "⬡", color: "#4dd2ff" },
  { id: "ab_overdrive", name: "Overdrive", desc: "+120% damage and +80% fire rate for 6s.", cd: 26, dur: 6, icon: "⚡", color: "#ffe14d" },
  { id: "ab_timewarp", name: "Time Warp", desc: "Slows all enemies within 900 units by 75% for 4s.", cd: 24, dur: 4, icon: "◷", color: "#ff7ad9" },
  { id: "ab_shockwave", name: "Shockwave", desc: "Deals heavy damage and knocks enemies away from you.", cd: 16, dur: 0, icon: "◎", color: "#ff6b81" },
];
export const ABILITY_BY_ID: Record<string, AbilitySpec> = Object.fromEntries(ABILITY_LIST.map((a) => [a.id, a]));

/* ---------- save ----------
 * Persistent player settings (see Nest / Settings panel):
 *   autoFire     — crafted weapons fire on their own when a target is in range (default true)
 *   showCompInfo — hover tooltip on loose components: name, rarity, value, mass (default true)
 *   showRanges   — translucent coloured circles showing each fitted weapon's range (default false)
 *   autoSell     — sell docked components automatically
 * Version history lives in src/game/changelog.ts (semantic: 1.x features, 1.0.x fixes).
 */
export interface SaveData {
  v: number;
  ts: number;
  name: string;
  credits: number;
  earned: number;
  kills: number;
  seq: number;
  upgrades: Record<string, number>;
  inventory: Comp[];
  crafted: Crafted[];
  equip: Equip;
  abilitySlots: ActiveAbilitySlot[];
  autoSell: boolean;
  /** crafted weapons fire themselves when an enemy is in range (toggle with B) */
  autoFire: boolean;
  /** show name, rarity, value and mass when hovering a loose component */
  showCompInfo: boolean;
  /** draw a translucent coloured ring for every fitted weapon's range */
  showRanges: boolean;
  /** bestiary: species id -> highest tier defeated (missing = never seen) */
  bestiary: Record<string, number>;
}

export function newSave(): SaveData {
  return {
    v: 2, ts: Date.now(), name: "",
    credits: 60, earned: 0, kills: 0, seq: 1, upgrades: {}, inventory: [], crafted: [],
    equip: { weapon: [null, null, null], shield: null, armor: null, optics: null, utility: null },
    abilitySlots: [null, null, null, null, null], autoSell: false, autoFire: true, showCompInfo: true, showRanges: false, bestiary: {},
  };
}

export function migrate(raw: unknown): SaveData {
  const d = newSave();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<SaveData>;
  const abilitySlots = [0, 1, 2, 3, 4].map((i) => r.abilitySlots?.[i] ?? null);
  return {
    ...d,
    ...r,
    v: 2,
    upgrades: { ...(r.upgrades ?? {}) },
    inventory: Array.isArray(r.inventory)
      ? r.inventory.map((c) => (c && c.species === "World Serpent" ? { ...c, species: "Snake" } : c))
      : [],
    crafted: Array.isArray(r.crafted) ? r.crafted : [],
    equip: { ...d.equip, ...(r.equip ?? {}), weapon: [0, 1, 2].map((i) => r.equip?.weapon?.[i] ?? null) },
    abilitySlots,
    autoFire: r.autoFire ?? true,
    showCompInfo: r.showCompInfo ?? true,
    showRanges: r.showRanges ?? false,
    bestiary: { ...(r.bestiary ?? {}) },
  };
}

/* ---------- shareable save codes ----------
 * Format: NH1-<checksum base36>-<base64 of the UTF-8 JSON save>.
 * Codes are self-contained: paste one into another browser to resume exactly.
 * The checksum is a 31x rolling hash mod 1,000,003; corruption fails closed.
 */
export const SAVE_CODE_PREFIX = "NH1";

function saveHash(s: string) {
  let x = 7;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 1_000_003;
  return x;
}
function b64encode(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(b: string) {
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeSave(save: SaveData): string {
  const json = JSON.stringify(save);
  return `${SAVE_CODE_PREFIX}-${saveHash(json).toString(36)}-${b64encode(json)}`;
}

export function decodeSave(code: string): SaveData | null {
  try {
    const parts = code.trim().replace(/\s+/g, "").split("-");
    if (parts.length !== 3 || parts[0] !== SAVE_CODE_PREFIX) return null;
    const json = b64decode(parts[2]);
    if (saveHash(json).toString(36) !== parts[1]) return null;
    const raw = JSON.parse(json) as unknown;
    return migrate(raw);
  } catch {
    return null;
  }
}

/* ---------- derived stats ---------- */
export interface Stats {
  dmg: number; rate: number; barrels: number; pierce: number; crit: number; breaker: number; coreMul: number; frag: number;
  bulletSpeed: number; bulletRange: number;
  hull: number; regen: number; armor: number; reactive: number; thorn: number; poisonResist: number;
  shieldMax: number; shieldRegen: number; shieldDelay: number; reflect: boolean; dampers: number;
  dodge: number; kinetic: number; novaOnHit: number; nullField: number;
  thrust: number; accel: number; boostMul: number; boostRegen: number; hasBoost: boolean;
  hCount: number; hStr: number; hRange: number; hHp: number; hSpeed: number; towRelief: number;
  sellMul: number; dropChance: number; luck: number; cargo: number;
  zoomMin: number; tpTime: number; tpCd: number;
  magnet: number; magnetRange: number;
  weapons: { rid: string; eff: number }[];
  abilities: { rid: string; eff: number }[];
}

export function computeStats(s: SaveData): Stats {
  const L = (id: string) => s.upgrades[id] ?? 0;
  const find = (id: string | null) => (id ? s.crafted.find((c) => c.id === id) : undefined);
  let hull = 100 * Math.pow(1.22, L("hull"));
  const baseDmg = 10 * Math.pow(1.2, L("dmg"));
  let shieldMax = L("shield") ? 60 * Math.pow(1.28, L("shield") - 1) : 0;
  let shieldRegen = 0.18;
  let shieldDelay = 4;
  let reflect = false;
  let reactive = 0;
  let thorn = 0;
  let armor = 0.035 * L("armor");
  let regen = 0.005 * L("regen");
  let dodge = 0;
  let kinetic = 0;
  let novaOnHit = 0;
  let nullField = 0;
  let poisonResist = 0;
  let thrust = 450 + 40 * L("thrust");
  let accel = 1500 + 200 * L("handling");
  const weapons: { rid: string; eff: number }[] = [];

  for (const wid of s.equip.weapon) {
    const it = find(wid);
    if (it) weapons.push({ rid: it.rid, eff: it.eff });
  }
  const abilities: { rid: string; eff: number }[] = [];
  for (const aid of s.abilitySlots) {
    const it = find(aid);
    if (it && RECIPE_BY_ID[it.rid]?.slot === "ability") abilities.push({ rid: it.rid, eff: it.eff });
  }

  const sh = find(s.equip.shield);
  if (sh) {
    const f = sh.eff;
    switch (sh.rid) {
      case "deflector": shieldMax += hull * 0.45 * f; break;
      case "absorber": shieldMax += hull * 0.22 * f; shieldRegen = 0.5; shieldDelay = 1.6; break;
      case "reflector": shieldMax += hull * 0.32 * f; reflect = true; break;
      case "kinetic": shieldMax += hull * 0.38 * f; kinetic = clamp(0.3 * f, 0.1, 0.6); break;
      case "phase": shieldMax += hull * 0.25 * f; dodge = clamp(0.12 * f, 0, 0.5); break;
      case "ward": shieldMax += hull * 0.3 * f; shieldRegen = 0.9; shieldDelay = 1.2; break;
      case "shell": shieldMax += hull * 0.2 * f; novaOnHit = f; break;
      case "overcharge": shieldMax += hull * 0.7 * f; shieldRegen = 0.07; shieldDelay = 8; break;
      case "nullfield": shieldMax += hull * 0.35 * f; nullField = f; break;
      case "prismatic": shieldMax += hull * 0.4 * f; reflect = true; dodge += clamp(0.05 * f, 0, 0.3); break;
    }
  }
  const ar = find(s.equip.armor);
  if (ar) {
    const f = ar.eff;
    switch (ar.rid) {
      case "plating": hull *= 1 + 0.35 * f; break;
      case "reactive": reactive = clamp(0.12 * f, 0, 0.6); break;
      case "thorn": { thorn = f; hull *= 1 + 0.1 * f; break; }
      case "chitin": hull *= 1 + 0.25 * f; armor += 0.02 * f; break;
      case "carapace": hull *= 1 + 0.55 * f; thrust *= 1 - clamp(0.06 * f, 0, 0.35); break;
      case "nanoweave": hull *= 1 + 0.12 * f; regen += 0.004 * f; break;
      case "ablative": reactive += clamp(0.08 * f, 0, 0.5); break;
      case "titan": hull *= 1 + 0.9 * f; thrust *= 1 - clamp(0.12 * f, 0, 0.5); break;
      case "exoskeleton": thrust *= 1 + 0.12 * f; accel *= 1 + 0.1 * f; break;
      case "venomguard": poisonResist = clamp(0.2 * f, 0, 0.9); hull *= 1 + 0.08 * f; break;
      case "scalemail": armor += 0.03 * f; hull *= 1 + 0.18 * f; break;
    }
  }
  const op = find(s.equip.optics);
  const zoomMin = op ? clamp(1 / (1 + 1.96 * op.eff), 0.056, 1) : 1;
  const ut = find(s.equip.utility);
  const tpTime = ut && ut.rid === "recall" ? clamp(6 / (0.6 + 0.5 * ut.eff), 2, 6) : 0;
  const tpCd = ut && ut.rid === "recall" ? clamp(100 / (0.5 + 0.5 * ut.eff), 20, 100) : 0;
  const magnet = ut && ut.rid === "magnet" ? 1 : 0;
  const magnetRange = magnet ? 420 + 320 * ut!.eff : 0;

  return {
    dmg: baseDmg,
    rate: 4 + 0.7 * L("rate"),
    barrels: 1 + L("barrels"),
    pierce: L("pierce"),
    crit: 0.05 + 0.04 * L("crit"),
    breaker: 1 + 0.15 * L("breaker"),
    coreMul: 1 + 0.2 * L("coreseek"),
    frag: L("frag") ? 18 + 9 * L("frag") : 0,
    bulletSpeed: 900 * (1 + 0.1 * L("velocity")),
    bulletRange: 760 * (1 + 0.08 * L("velocity")),
    hull,
    regen,
    armor,
    reactive,
    thorn,
    poisonResist,
    shieldMax,
    shieldRegen,
    shieldDelay,
    reflect,
    dampers: 0.12 * L("dampers"),
    dodge,
    kinetic,
    novaOnHit,
    nullField,
    thrust,
    accel,
    boostMul: 1.7 + 0.1 * Math.max(0, L("boost") - 1),
    boostRegen: 14 + 3 * L("boost"),
    hasBoost: L("boost") > 0,
    hCount: 1 + L("hcount"),
    hStr: 5 * Math.pow(1.42, L("hstr")),
    hRange: 380 + 60 * L("hrange"),
    hHp: 40 * Math.pow(1.35, L("hhp")),
    hSpeed: 1000 + 140 * L("hspeed"),
    towRelief: 0.06 * L("hspeed"),
    sellMul: 1 + 0.25 * L("value"),
    dropChance: 0.3 + 0.04 * L("drops"),
    luck: 0.05 * L("luck"),
    cargo: 24 + 12 * L("cargo"),
    zoomMin,
    tpTime,
    tpCd,
    magnet,
    magnetRange,
    weapons,
    abilities,
  };
}
