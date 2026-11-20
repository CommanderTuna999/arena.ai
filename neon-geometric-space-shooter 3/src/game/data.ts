import { clamp, fmtNum } from "./math";

/* ---------- world constants ---------- */
export const WORLD_R = 16000;
export const BASE = { x: 0, y: 15000, r: 260, dock: 175, safe: 950 };
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

/* ---------- crafting ---------- */
export type Slot = "weapon" | "shield" | "armor" | "optics" | "utility";
export interface Recipe {
  id: string;
  name: string;
  slot: Slot;
  desc: string;
  difficulty: number;
  n: number;
  need?: { cats: Category[]; count: number };
}

export const RECIPES: Recipe[] = [
  { id: "pulse", name: "Pulse Turret", slot: "weapon", difficulty: 1, n: 3, desc: "Auto-targeting turret. Fires at the nearest enemy piece on its own." },
  { id: "scatter", name: "Scatter Driver", slot: "weapon", difficulty: 2, n: 4, need: { cats: ["limb", "plate"], count: 1 }, desc: "Short-range shotgun burst on your fire button." },
  { id: "missile", name: "Seeker Pod", slot: "weapon", difficulty: 3, n: 5, need: { cats: ["weapon", "shield"], count: 1 }, desc: "Launches homing missiles with splash damage." },
  { id: "lance", name: "Arc Lance", slot: "weapon", difficulty: 4, n: 6, need: { cats: ["core"], count: 1 }, desc: "Piercing beam that melts through armour layers." },
  { id: "deflector", name: "Deflector Array", slot: "shield", difficulty: 1, n: 3, desc: "Large shield pool that recharges after a short delay." },
  { id: "absorber", name: "Absorber Core", slot: "shield", difficulty: 2, n: 4, need: { cats: ["plate"], count: 1 }, desc: "Smaller shield that recharges extremely fast." },
  { id: "reflector", name: "Mirror Barrier", slot: "shield", difficulty: 3, n: 5, need: { cats: ["shield", "core", "wing"], count: 1 }, desc: "Shield that reflects enemy bolts back at them." },
  { id: "plating", name: "Hull Plating Kit", slot: "armor", difficulty: 1, n: 3, need: { cats: ["plate", "body"], count: 1 }, desc: "Adds a large chunk of extra hull." },
  { id: "reactive", name: "Reactive Lattice", slot: "armor", difficulty: 3, n: 5, need: { cats: ["plate"], count: 2 }, desc: "Cuts all incoming damage." },
  { id: "thorn", name: "Thorn Mesh", slot: "armor", difficulty: 2, n: 4, need: { cats: ["limb"], count: 1 }, desc: "When hit, emits a shockwave that damages nearby enemy pieces." },
  { id: "lens", name: "Wide-Field Optics", slot: "optics", difficulty: 2, n: 4, need: { cats: ["wing", "core"], count: 1 }, desc: "Unlocks mouse-wheel zoom out. Better efficiency zooms further." },
  { id: "recall", name: "Recall Beacon", slot: "utility", difficulty: 4, n: 6, need: { cats: ["core"], count: 1 }, desc: "Press T to channel a teleport back to base." },
];
export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const SLOT_NAME: Record<Slot, string> = { weapon: "Weapon", shield: "Shield", armor: "Armour", optics: "Optics", utility: "Utility" };

export function craftEfficiency(r: Recipe, comps: Comp[]) {
  if (!comps.length) return 0;
  const avg = comps.reduce((s, c) => s + c.tier + (c.kind === "core" ? 0.5 : 0), 0) / comps.length;
  const raw = (0.6 + 0.3 * avg) * (1 - 0.05 * (r.difficulty - 1));
  return Math.max(0.3, raw);
}

export function recipeProblem(r: Recipe, comps: Comp[]): string | null {
  if (comps.length !== r.n) return `Needs exactly ${r.n} components`;
  if (r.need) {
    const have = comps.filter((c) => r.need!.cats.includes(KIND_CAT[c.kind])).length;
    if (have < r.need.count) return `Needs ${r.need.count}x ${r.need.cats.map((c) => CAT_NAME[c]).join("/")}`;
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

/* ---------- save ---------- */
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
  autoSell: boolean;
}

export function newSave(): SaveData {
  return {
    v: 1, ts: Date.now(), name: "Pilot-" + Math.floor(1000 + Math.random() * 9000),
    credits: 60, earned: 0, kills: 0, seq: 1, upgrades: {}, inventory: [], crafted: [],
    equip: { weapon: [null, null, null], shield: null, armor: null, optics: null, utility: null }, autoSell: false,
  };
}

export function migrate(raw: unknown): SaveData {
  const d = newSave();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<SaveData>;
  return {
    ...d,
    ...r,
    upgrades: { ...(r.upgrades ?? {}) },
    inventory: Array.isArray(r.inventory) ? r.inventory : [],
    crafted: Array.isArray(r.crafted) ? r.crafted : [],
    equip: { ...d.equip, ...(r.equip ?? {}), weapon: [0, 1, 2].map((i) => r.equip?.weapon?.[i] ?? null) },
  };
}

/* ---------- derived stats ---------- */
export interface Stats {
  dmg: number; rate: number; barrels: number; pierce: number; crit: number; breaker: number; coreMul: number; frag: number;
  bulletSpeed: number; bulletRange: number;
  hull: number; regen: number; armor: number; reactive: number; thorn: number;
  shieldMax: number; shieldRegen: number; shieldDelay: number; reflect: boolean; dampers: number;
  thrust: number; accel: number; boostMul: number; boostRegen: number; hasBoost: boolean;
  hCount: number; hStr: number; hRange: number; hHp: number; hSpeed: number; towRelief: number;
  sellMul: number; dropChance: number; luck: number; cargo: number;
  zoomMin: number; tpTime: number; tpCd: number;
  weapons: { rid: string; eff: number }[];
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
  const weapons: { rid: string; eff: number }[] = [];

  for (const wid of s.equip.weapon) {
    const it = find(wid);
    if (it) weapons.push({ rid: it.rid, eff: it.eff });
  }
  const sh = find(s.equip.shield);
  if (sh) {
    if (sh.rid === "deflector") { shieldMax += hull * 0.45 * sh.eff; }
    if (sh.rid === "absorber") { shieldMax += hull * 0.22 * sh.eff; shieldRegen = 0.5; shieldDelay = 1.6; }
    if (sh.rid === "reflector") { shieldMax += hull * 0.32 * sh.eff; reflect = true; }
  }
  const ar = find(s.equip.armor);
  if (ar) {
    if (ar.rid === "plating") hull *= 1 + 0.35 * ar.eff;
    if (ar.rid === "reactive") reactive = clamp(0.12 * ar.eff, 0, 0.6);
    if (ar.rid === "thorn") { thorn = ar.eff; hull *= 1 + 0.1 * ar.eff; }
  }
  const op = find(s.equip.optics);
  const zoomMin = op ? clamp(1 / (1 + 0.4 * op.eff), 0.28, 1) : 1;
  const ut = find(s.equip.utility);
  const tpTime = ut && ut.rid === "recall" ? clamp(6 / (0.6 + 0.5 * ut.eff), 2, 6) : 0;
  const tpCd = ut && ut.rid === "recall" ? clamp(100 / (0.5 + 0.5 * ut.eff), 20, 100) : 0;

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
    regen: 0.005 * L("regen"),
    armor: 0.035 * L("armor"),
    reactive,
    thorn,
    shieldMax,
    shieldRegen,
    shieldDelay,
    reflect,
    dampers: 0.12 * L("dampers"),
    thrust: 450 + 40 * L("thrust"),
    accel: 1500 + 200 * L("handling"),
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
    weapons,
  };
}
