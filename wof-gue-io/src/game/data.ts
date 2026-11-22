import { clamp, fmtNum } from "./math";

/* ---------- world constants ---------- */
export const WORLD_R = 60000;
/* The base is in the open lower-right starting region. */
/* turretR is the siege cannon's reach; aggroR (10% beyond it) is the base's
 * defence-alert radius and the band enemies are retained in while chasing the
 * player through it. Enemies never target the base itself. smallR is the
 * point-defence reach of the six hex turrets on the base ring. */
export const BASE = { x: 30000, y: 15000, r: 260, dock: 175, safe: 950, turretR: 1600, aggroR: 1760, smallR: 850 };
/** radius band the base may occupy — the outer (common) ring only */
export const BASE_RING = { min: 13900, max: 15300 };
/** structural integrity of the base; high-tier enemies chew through this fast */
export const BASE_MAX_HP = 600;
/** incoming damage multiplier by attacker tier (common … mythical) */
export const BASE_TAKE = [0, 0.01, 0.4, 1, 1.6, 2.4];
/** three radial hardpoints on the player construct: slot position + resting aim */
export const W_SLOTS = [
  { x: 0, y: -17, rest: -Math.PI / 2 },
  { x: 14.72, y: 8.5, rest: Math.PI / 6 },
  { x: -14.72, y: 8.5, rest: (5 * Math.PI) / 6 },
] as const;
export const SHIP_R = 15;
/** Minimum distance from the base for each successive rarity band.
 * Keep thresholds data-driven so future rarities can extend the map. */
export const ZONE_EDGES = [12000, 25000, 40000, 56000, 74000];
export function zoneTier(distanceFromBase: number) {
  return ZONE_EDGES.reduce((tier, edge) => tier + (distanceFromBase >= edge ? 1 : 0), 0);
}
export function zoneAt(x: number, y: number) {
  return zoneTier(Math.hypot(x - BASE.x, y - BASE.y));
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
/* Piece health by rarity, straight from the balance sheet: each step multiplies
 * the one below it (x3.75, x4, x4.7, x6, x8.1). */
export const HP_MUL = [1, 3.75, 15, 70.5, 423, 3426.3];
/** the starting cannon from the sheet (see CANNONS below): 20 damage, 0.7s interval */
export const CANNON_DMG = 20;
export const CANNON_INTERVAL = 0.7;
/* 2x baseline as of v2.0 — the 3x ratio between tiers is unchanged. */
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

/* Drop rates per part kind. This is the single source of truth: the bestiary
 * displays these numbers and the engine rolls exactly these (scaled only by
 * the player's salvage upgrade), so what is listed is what enemies follow.
 * Every non-core kind drops at ~5% at the enemy's own rarity; the core drops
 * at 90% (55% on commons). Commons additionally drop uncommon-tier components
 * at 30% — see maybeDrop() for the tier roll. */
export const KIND_DROP_RATE: Record<PartKind, number> = {
  core: 0.9, segment: 0.05, armor: 0.05, leg: 0.05, arm: 0.05, wing: 0.05, weapon: 0.05, shield: 0.05, spike: 0.05,
};
/** the uncommon drop rate commons roll for each non-core kind */
export const COMMON_UNCOMMON_RATE = 0.3;
/** the core drop rate on a common body (every other body keeps 0.9) */
export const COMMON_CORE_RATE = 0.55;
export const KIND_DROP_PCT = (k: PartKind) => `${Math.round(KIND_DROP_RATE[k] * 100)}%`;

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
  { id: "hull", name: "Hull Plating", cat: "hull", desc: "Maximum hull integrity.", max: 30, base: 18, growth: 1.4, fmt: (l) => `${fmtNum(100 * Math.pow(1.19, l))} HP` },
  { id: "regen", name: "Nano Repair", cat: "hull", desc: "Hull regenerates every second.", max: 10, base: 55, growth: 1.5, fmt: (l) => `${(0.5 * l).toFixed(1)}%/s` },
  { id: "armor", name: "Reactive Armour", cat: "hull", desc: "Flat percentage damage reduction.", max: 14, base: 70, growth: 1.55, fmt: (l) => `-${(3.5 * l).toFixed(1)}% dmg` },
  { id: "shield", name: "Energy Shield Core", cat: "hull", desc: "A recharging shield layer. Level 1 unlocks it.", max: 25, base: 90, growth: 1.45, fmt: (l) => (l ? `${fmtNum(60 * Math.pow(1.22, l - 1))} shield` : "locked") },

  { id: "thrust", name: "Thrusters", cat: "mobility", desc: "Top speed.", max: 12, base: 40, growth: 1.5, fmt: (l) => `${450 + 40 * l} u/s` },
  { id: "handling", name: "Handling Jets", cat: "mobility", desc: "Acceleration and agility.", max: 10, base: 45, growth: 1.45, fmt: (l) => `${1500 + 200 * l} accel` },
  { id: "boost", name: "Afterburner", cat: "mobility", desc: "Hold SHIFT for a speed burst. Level 1 unlocks it.", max: 8, base: 150, growth: 1.8, fmt: (l) => (l ? `x${(1.7 + 0.1 * (l - 1)).toFixed(1)} burst` : "locked") },

  { id: "hcount", name: "Launcher Bays", cat: "harpoon", desc: "Number of harpoons you can have out at once.", max: 3, base: 100, growth: 3, fmt: (l) => `${1 + l} harpoon${l ? "s" : ""}` },
  { id: "hstr", name: "Cable Tensile Strength", cat: "harpoon", desc: "Weight each harpoon can tow before it snaps.", max: 16, base: 30, growth: 1.55, fmt: (l) => `${fmtNum(5 * Math.pow(1.42, l))} load` },
  { id: "hrange", name: "Launcher Range", cat: "harpoon", desc: "How far the harpoon flies.", max: 10, base: 40, growth: 1.45, fmt: (l) => `${380 + 60 * l} u` },
  { id: "hhp", name: "Cable Armouring", cat: "harpoon", desc: "Durability of the cable against enemy attacks.", max: 12, base: 50, growth: 1.5, fmt: (l) => `${fmtNum(40 * Math.pow(1.35, l))} HP` },
  { id: "hspeed", name: "Winch Motor", cat: "harpoon", desc: "Launch speed, reel speed and less towing drag.", max: 8, base: 60, growth: 1.5, fmt: (l) => `${1000 + 140 * l} u/s` },

  { id: "value", name: "Salvage Contracts", cat: "salvage", desc: "Credits received when selling components.", max: 20, base: 50, growth: 1.5, fmt: (l) => `x${(1 + 0.25 * l).toFixed(2)}` },
  { id: "drops", name: "Scavenger Drones", cat: "salvage", desc: "Increases the chance of pieces dropping components.", max: 10, base: 60, growth: 1.55, fmt: (l) => `x${(1 + 0.25 * l).toFixed(2)} drop` },
  { id: "luck", name: "Rarity Scanner", cat: "salvage", desc: "Better rarity rolls on dropped components.", max: 8, base: 100, growth: 1.7, fmt: (l) => `+${l * 5}% luck` },
  { id: "cargo", name: "Cargo Bay", cat: "salvage", desc: "Storage capacity for components.", max: 8, base: 80, growth: 1.7, fmt: (l) => `${24 + 12 * l} slots` },
];

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

/* ---------- base cannons ----------
 * A cannon is a chassis plus its own upgrade tracks: two ships with different guns
 * do not share a bore size, so every track is per cannon, never global. The tree is
 * displayed bottom-up: the free Stinger sits at the bottom and every gun is bought
 * and upgraded while it is bolted to the hull.
 *
 * Chassis prices are paid twice over — credits and a component bill. Tier 1 guns ask
 * for a handful of common parts of a named kind plus one uncommon core, so the hull
 * you scrap for a new gun is a shopping list, not a pile. */
export type CannonTrackId = "dmg" | "rate" | "crit" | "critDmg" | "pen" | "acc" | "speed" | "barrels" | "armorDmg" | "energyChance" | "chargeRate" | "beamWidth";

export interface CannonTrack {
  id: CannonTrackId;
  name: string;
  desc: string;
  max: number;
  /** price of level 0, before the cannon's own multiplier */
  base: number;
  growth: number;
}

/** one line of a chassis bill: a kind of part, a rarity (tier index) and how many.
 *  `name` narrows a kind that covers several parts (a "Head" is a body segment, an
 *  "Antenna" is a spike), and `label` is what the tree prints. No species is ever
 *  named — every one of these reads "Common leg", not "Worker Ant leg". */
export interface PartBill {
  kind: PartKind;
  tier: number;
  count: number;
  /** substring the component's own name must contain ("Head", "Antenna") */
  name?: string;
  /** how the tree names this line: "2× Common leg" */
  label: string;
}

/** How a chassis is drawn — on the hull and in the tree icon, from the same data. */
export interface CannonLook {
  /** barrel length measured from the hull centre, in ship-space units */
  len: number;
  /** barrel bore (half-thickness) */
  bore: number;
  /** hue of the gun's energy trim */
  hue: number;
  /** silhouette: fat bolt thrower, long lance, stubby spray, paired barrels */
  style: "bolt" | "lance" | "spray" | "twin";
}

export interface CannonDef {
  id: string;
  name: string;
  /** tree row: 0 sits at the bottom of the tree */
  tier: number;
  desc: string;
  /** damage of one round before the damage track */
  dmg: number;
  /** seconds between rounds before the rate track */
  interval: number;
  /** round speed and reach, in world units */
  speed: number;
  range: number;
  /** hitscan guns draw an instant line instead of throwing a travelling round */
  hitscan?: boolean;
  /** spread of the muzzle, in radians, before the accuracy track */
  spread?: number;
  /** small charge that pops where the round lands (the Stinger's signature) */
  boom?: number;
  /** credits the tree charges for the chassis */
  credits: number;
  /** component bill, on top of the credits */
  parts: PartBill[];
  /** where rounds actually leave the gun, in ship space. Two entries means two
   *  barrels: a single-round trigger alternates between them, and the barrel
   *  upgrade fires both at once. */
  muzzles: { x: number; y: number }[];
  /** hull shove (world units/s) applied along the shot */
  kick: number;
  /** heat added per trigger, 0..1 of the gauge (split between the barrels of a
   *  twin, so a second barrel runs cooler). */
  heat: number;
  /** damage multiplier at a full gauge; 1 (or absent) means heat does not feed
   *  the round. The Workhorse reads 300/55 here: it chews harder as it cooks. */
  heatMax?: number;
  /** spread multiplier at a full gauge; a hot gun wanders. Absent means 1. */
  heatSpread?: number;
  /** seconds of forced cooling once the gauge fills; absent means the gun can
   *  never overheat. */
  overheat?: number;
  /** charge cannon: hold the fire button to build charge, release to fire a
   *  devastating beam whose damage scales with how long it was held. */
  charge?: boolean;
  /** seconds of holding needed to reach full charge */
  chargeTime?: number;
  /** the charged beam's damage is this multiple of the chassis's base damage */
  chargeDmg?: number;
  look: CannonLook;
  /** tracks this chassis owns, in display order */
  tracks: CannonTrackId[];
  /** every track price on this chassis is scaled by this */
  costMul: number;
  requires: string | null;
}

export const CANNONS: CannonDef[] = [
  {
    id: "sting", name: "Stinger", tier: 0,
    desc: "Everyone’s gotta start somewhere.",
    dmg: 20, interval: 0.7, speed: 640, range: 820, boom: 1,
    credits: 0, parts: [], tracks: ["dmg"], costMul: 1, requires: null,
    muzzles: [{ x: 19, y: 0 }], kick: 9, heat: 0.055, heatMax: 1, heatSpread: 1,
    look: { len: 20, bore: 5.2, hue: 188, style: "bolt" },
  },
  {
    id: "skewer", name: "Skewer MK1", tier: 1,
    desc: "Pretty accurate.",
    dmg: 300, interval: 1.2, speed: 0, range: 2400, hitscan: true,
    credits: 500,
    parts: [
      { kind: "leg", tier: 0, count: 2, label: "leg" },
      { kind: "spike", tier: 1, count: 1, name: "Antenna", label: "antenna" },
      { kind: "segment", tier: 0, count: 1, name: "Head", label: "head" },
      { kind: "core", tier: 1, count: 2, label: "core" },
    ],
    tracks: ["crit", "critDmg", "pen", "dmg"], costMul: 2.4, requires: "sting",
    muzzles: [{ x: 37, y: 0 }], kick: 34, heat: 0.34, heatMax: 1, heatSpread: 1,
    look: { len: 38, bore: 3.2, hue: 196, style: "lance" },
  },
  {
    id: "peashooter", name: "Peashooter MK1", tier: 1,
    desc: "Spray and pray, huh?",
    dmg: 35, interval: 0.1, speed: 430, range: 720, spread: 0.22,
    credits: 300,
    parts: [
      { kind: "leg", tier: 0, count: 2, label: "leg" },
      { kind: "core", tier: 1, count: 2, label: "core" },
    ],
    tracks: ["acc", "speed", "dmg", "crit", "critDmg"], costMul: 1, requires: "sting",
    muzzles: [{ x: 16, y: 0 }], kick: 3, heat: 0.012, heatMax: 1, heatSpread: 1,
    look: { len: 16, bore: 3.4, hue: 142, style: "spray" },
  },
  {
    id: "workhorse", name: "Workhorse MK1", tier: 1,
    desc: "Boring...",
    /* chews harder the hotter it gets and wanders the closer it is to cooking:
     * 55 a round cold, 300 at a full gauge, then three seconds of cooling */
    dmg: 55, interval: 0.55, speed: 720, range: 900, spread: 0.03,
    credits: 500,
    parts: [
      { kind: "leg", tier: 0, count: 2, label: "leg" },
      { kind: "segment", tier: 1, count: 1, name: "Head", label: "head" },
      { kind: "core", tier: 1, count: 1, label: "core" },
    ],
    tracks: ["dmg", "rate", "pen", "barrels"], costMul: 1.6, requires: "sting",
    /* a genuine twin: one round per trigger, alternating barrels, always */
    muzzles: [{ x: 25, y: -5.5 }, { x: 25, y: 5.5 }], kick: 16, heat: 0.08,
    heatMax: 300 / 55, heatSpread: 4, overheat: 3,
    look: { len: 26, bore: 4.6, hue: 34, style: "twin" },
  },
  {
    id: "skewer2", name: "Skewer MK2", tier: 2,
    desc: "Pretty accurate, now with more piercing.",
    /* a longer, harder-hitting lance: it still draws a hard hitscan line, but it
     * chews through armour and occasionally throws an energy shot that ignores
     * enemy shielding */
    dmg: 1200, interval: 2, speed: 0, range: 3000, hitscan: true,
    credits: 7000,
    parts: [
      { kind: "leg", tier: 3, count: 4, label: "leg" },
      { kind: "spike", tier: 3, count: 1, name: "Antenna", label: "antenna" },
      { kind: "segment", tier: 3, count: 1, name: "Head", label: "head" },
      { kind: "core", tier: 1, count: 5, label: "core" },
      { kind: "core", tier: 3, count: 1, label: "core" },
    ],
    tracks: ["crit", "critDmg", "pen", "dmg", "armorDmg", "energyChance"], costMul: 2.6, requires: "skewer",
    muzzles: [{ x: 46, y: 0 }], kick: 50, heat: 0, heatMax: 1, heatSpread: 1,
    look: { len: 50, bore: 4.0, hue: 204, style: "lance" },
  },
  {
    id: "fencer", name: "Fencer MK1", tier: 2,
    desc: "A few stabs, then bigger stab.",
    /* rapid hitscan jabs; every fifth round lands a charged energy shot that
     * hits far harder */
    dmg: 200, interval: 0.3, speed: 0, range: 2400, hitscan: true,
    credits: 10000,
    parts: [
      { kind: "weapon", tier: 3, count: 5, label: "weapon" },
      { kind: "spike", tier: 3, count: 2, name: "Antenna", label: "antenna" },
      { kind: "armor", tier: 3, count: 3, label: "plate" },
      { kind: "core", tier: 3, count: 3, label: "core" },
    ],
    tracks: ["crit", "critDmg", "pen", "dmg"], costMul: 2.4, requires: "skewer",
    muzzles: [{ x: 42, y: 0 }], kick: 12, heat: 0, heatMax: 1, heatSpread: 1,
    look: { len: 40, bore: 3.0, hue: 150, style: "lance" },
  },
  {
    id: "mediator", name: "Mediator MK1", tier: 2,
    desc: "Very impartial.",
    /* hold the fire button to charge a devastating energy beam, then release it:
     * the longer the hold, the harder the shot, and the recoil shoves the ship
     * hard backwards */
    dmg: 4000, interval: 0.5, speed: 0, range: 2600, hitscan: true,
    charge: true, chargeTime: 1, chargeDmg: 1,
    credits: 15000,
    parts: [
      { kind: "weapon", tier: 3, count: 7, label: "weapon" },
      { kind: "wing", tier: 3, count: 5, label: "wing" },
      { kind: "segment", tier: 4, count: 1, name: "Head", label: "head" },
      { kind: "core", tier: 3, count: 6, label: "core" },
      { kind: "weapon", tier: 4, count: 1, name: "scorpion", label: "scorpion weapon" },
    ],
    tracks: ["crit", "critDmg", "pen", "dmg", "chargeRate", "beamWidth"], costMul: 3.0, requires: "skewer",
    muzzles: [{ x: 44, y: 0 }], kick: 220, heat: 0, heatMax: 1, heatSpread: 1,
    look: { len: 48, bore: 4.4, hue: 280, style: "lance" },
  },
];
export const CANNON_BY_ID: Record<string, CannonDef> = Object.fromEntries(CANNONS.map((c) => [c.id, c]));

/** every track any gun can carry. A chassis picks the ones it actually has. */
export const CANNON_TRACKS: CannonTrack[] = [
  { id: "dmg", name: "Damage", desc: "Damage of every round this cannon fires.", max: 30, base: 20, growth: 1.45 },
  { id: "rate", name: "Fire Rate", desc: "Shortens the reload between shots.", max: 20, base: 45, growth: 1.5 },
  { id: "crit", name: "Crit Chance", desc: "Chance for a round to find a seam and hit far harder.", max: 15, base: 120, growth: 1.55 },
  { id: "critDmg", name: "Crit Damage", desc: "How hard a critical round lands.", max: 15, base: 90, growth: 1.5 },
  { id: "pen", name: "Penetration", desc: "Rounds punch through one more piece before stopping.", max: 8, base: 260, growth: 1.65 },
  { id: "acc", name: "Accuracy", desc: "Tightens the spray pattern.", max: 15, base: 40, growth: 1.45 },
  { id: "speed", name: "Projectile Speed", desc: "Faster rounds: less lead on a moving target.", max: 12, base: 55, growth: 1.45 },
  { id: "barrels", name: "Barrels", desc: "A second barrel. Rounds alternate between the two, so each barrel fires at half the rate and the gun runs cooler for longer.", max: 1, base: 6000, growth: 1 },
  { id: "armorDmg", name: "Armour Damage", desc: "Extra damage dealt to armour plating.", max: 10, base: 80, growth: 1.5 },
  { id: "energyChance", name: "Energy Shot Chance", desc: "Chance each shot throws an energy bolt that bypasses enemy shielding.", max: 10, base: 120, growth: 1.5 },
  { id: "chargeRate", name: "Charge Rate", desc: "The beam charges faster the longer it is held.", max: 10, base: 90, growth: 1.5 },
  { id: "beamWidth", name: "Beam Width", desc: "A wider energy beam, striking more of the target.", max: 8, base: 110, growth: 1.5 },
];
export const CANNON_TRACK_BY_ID: Record<string, CannonTrack> = Object.fromEntries(CANNON_TRACKS.map((t) => [t.id, t]));
/** the tracks a chassis actually carries, in display order */
export const cannonTracks = (c: CannonDef): CannonTrack[] =>
  c.tracks.map((id) => CANNON_TRACK_BY_ID[id]).filter((t): t is CannonTrack => !!t);

export const cannonTrackCost = (c: CannonDef, t: CannonTrack, level: number) =>
  Math.round(t.base * Math.pow(t.growth, level) * c.costMul);

const lvl = (lv: Record<string, number> | undefined, id: CannonTrackId) => lv?.[id] ?? 0;

/** damage of one round at the current damage-track level */
export const cannonDmg = (c: CannonDef, lv?: Record<string, number>) => c.dmg * Math.pow(1.2, lvl(lv, "dmg"));
/** rounds per second: chassis interval shortened by the fire-rate track */
export const cannonRate = (c: CannonDef, lv?: Record<string, number>) =>
  1 / (c.interval * Math.pow(0.94, lvl(lv, "rate")));
/** critical chance, 0 when the gun has no crit track */
export const cannonCrit = (lv?: Record<string, number>) => 0.05 * lvl(lv, "crit");
/** critical damage multiplier (2x base, +0.25 per crit-damage level) */
export const cannonCritMul = (lv?: Record<string, number>) => 2 + 0.25 * lvl(lv, "critDmg");
/** extra pieces a round passes through */
export const cannonPierce = (lv?: Record<string, number>) => lvl(lv, "pen");
/** rounds thrown per trigger: two at most, per the sheet's "Barrels (2)" */
export const cannonBarrels = (lv?: Record<string, number>) => 1 + Math.min(1, lvl(lv, "barrels"));
/** extra damage vs armour plating: a multiplier above 1 (1 + 12% a level) */
export const cannonArmorDmg = (lv?: Record<string, number>) => 1 + 0.12 * lvl(lv, "armorDmg");
/** chance a shot throws an energy bolt that bypasses shielding (Skewer MK2) */
export const cannonEnergyChance = (lv?: Record<string, number>) => clamp(0.25 + 0.05 * lvl(lv, "energyChance"), 0, 0.95);
/** how fast the charge beam builds (Mediator): a multiplier on charge speed */
export const cannonChargeRate = (lv?: Record<string, number>) => 1 + 0.1 * lvl(lv, "chargeRate");
/** how wide the energy beam strikes (Mediator): a multiplier on beam thickness */
export const cannonBeamWidth = (lv?: Record<string, number>) => 1 + 0.18 * lvl(lv, "beamWidth");
/** round speed at the current projectile-speed level */
export const cannonSpeed = (c: CannonDef, lv?: Record<string, number>) => c.speed * Math.pow(1.08, lvl(lv, "speed"));
/** muzzle spread in radians; the accuracy track tightens it by 10% a level */
export const cannonSpread = (c: CannonDef, lv?: Record<string, number>) => (c.spread ?? 0) * Math.pow(0.9, lvl(lv, "acc"));
/** damage multiplier at a given gauge level: 1 for every gun that does not cook */
export const cannonHeatDmg = (c: CannonDef, heat: number) =>
  1 + ((c.heatMax ?? 1) - 1) * clamp(heat, 0, 1);
/** spread multiplier at a given gauge level: a hot barrel wanders */
export const cannonHeatSpread = (c: CannonDef, heat: number) =>
  1 + ((c.heatSpread ?? 1) - 1) * clamp(heat, 0, 1);
/** a round's damage with the gauge where it is (the hull reads this for the HUD) */
export const cannonHotDmg = (c: CannonDef, lv: Record<string, number> | undefined, heat: number) =>
  cannonDmg(c, lv) * cannonHeatDmg(c, heat);
/** this chassis can jam at all? */
export const cannonJams = (c: CannonDef) => (c.overheat ?? 0) > 0;

/** the number a track shows at a given level (the UI prints now → next) */
export function cannonTrackValue(c: CannonDef, id: CannonTrackId, level: number): string {
  const one = { [id]: level } as Record<string, number>;
  switch (id) {
    case "dmg": return `${fmtNum(cannonDmg(c, one))} dmg`;
    case "rate": return `${cannonRate(c, one).toFixed(2)}/s`;
    case "crit": return `${Math.round(cannonCrit(one) * 100)}% crit`;
    case "critDmg": return `x${cannonCritMul(one).toFixed(2)} crit`;
    case "pen": return level ? `pierces ${level}` : "stops on impact";
    case "acc": return `${((cannonSpread(c, one) * 180) / Math.PI).toFixed(1)}° spread`;
    case "speed": return `${fmtNum(Math.round(cannonSpeed(c, one)))} u/s`;
    case "barrels": return `${cannonBarrels(one)} barrels`;
    case "armorDmg": return `+${Math.round((cannonArmorDmg(one) - 1) * 100)}% vs armour`;
    case "energyChance": return `${Math.round(cannonEnergyChance(one) * 100)}% energy shot`;
    case "chargeRate": return `${cannonChargeRate(one).toFixed(2)}x charge`;
    case "beamWidth": return `${cannonBeamWidth(one).toFixed(2)}x wide`;
  }
}

/* ---------- chassis bills ---------- */
/** "2× Common leg" — a kind and a rarity, never a species */
export const partBillText = (b: PartBill) =>
  `${b.count}× ${RARITIES[clamp(b.tier, 0, RARITIES.length - 1)].name} ${b.label}`;
/** does this component satisfy that bill line? */
export const partBillMatch = (x: Comp, b: PartBill) =>
  x.kind === b.kind && x.tier >= b.tier && (!b.name || x.name.toLowerCase().includes(b.name.toLowerCase()));

export const cannonOwned = (s: SaveData, id: string) => id === CANNONS[0].id || !!s.cannon?.owned?.includes(id);
/** what is standing between the pilot and this chassis (null = buildable).
 *  `freeParts` is admin mode's infinite components: the bill is skipped, the
 *  credit price is not (that is what the infinite-credits flag is for). */
export function cannonBillProblem(s: SaveData, c: CannonDef, freeParts = false, admin = false): string | null {
  if (cannonOwned(s, c.id)) return null;
  if (c.requires && !cannonOwned(s, c.requires)) {
    return `Requires the ${CANNON_BY_ID[c.requires]?.name ?? c.requires}`;
  }
  /* the sheet's rule: one gun per tier, so a tier 1 purchase is a choice, not a
   * shopping spree. Admin mode is the only way around it. */
  if (!admin) {
    const taken = CANNONS.find((o) => o.id !== c.id && o.tier === c.tier && cannonOwned(s, o.id));
    if (taken) return `One gun per tier — you already fly the ${taken.name}`;
  }
  if (s.credits < c.credits) return `Needs ${fmtNum(c.credits)} credits`;
  if (freeParts) return null;
  for (let i = 0; i < c.parts.length; i++) {
    const parts = c.parts.slice(0, i + 1);
    if (cannonBillPicks(s, { ...c, parts }).length < parts.reduce((n, b) => n + b.count, 0)) return `Needs ${partBillText(c.parts[i])}`;
  }
  return null;
}
/** the inventory ids a chassis purchase would consume: cheapest of each bill line first */
export function cannonBillPicks(s: SaveData, c: CannonDef): string[] {
  // Match individual bill slots to distinct inventory items. Augmenting paths
  // handle overlapping named/generic and minimum-rarity requirements correctly.
  const slots = c.parts.flatMap((b) => Array.from({ length: b.count }, () => b));
  const items = [...s.inventory].sort((a, b) => a.tier - b.tier || a.value - b.value);
  const assigned = new Map<string, number>();
  const match = (slot: number, seen: Set<string>): boolean => {
    for (const item of items) {
      if (seen.has(item.id) || !partBillMatch(item, slots[slot])) continue;
      seen.add(item.id);
      const previous = assigned.get(item.id);
      if (previous === undefined || match(previous, seen)) {
        assigned.set(item.id, slot);
        return true;
      }
    }
    return false;
  };
  for (let i = 0; i < slots.length; i++) match(i, new Set());
  return [...assigned.keys()];
}

export const UP_CATS: { id: UpCat; name: string; color: string }[] = [
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
 *   pulse   0.60 dmg / 0.45s   auto turret, nearest target within 560u
 *   scatter 0.55 x6 / 0.75s    shotgun cone, 6 pellets, short range
 *   missile 2.20 x2 / 1.50s    homing seeker pod, splash
 *   lance   0.22 / 0.12s       beam, pierces 2+ pieces, stops on plating
 *   homing  3.10 / 1.70s       right-click mark, ignores everything en route
 *   bypass  0.16 / 0.10s       auto beam, ignores shields, stopped by plating
 *   hmg     0.10 / 0.08s       high rate, wide spread, weak per hit
 *   emp     1.40 / 2.60s       AoE stun 1.8s, radius 620u
 *   cutter  1.10 / 0.18s       short plasma arc (175u), 1+ pierce
 *   acid    0.30 x3 / 0.16s    corrosive, +32% melt per hit + 1.6 dps dot
 *   chain   1.60 / 0.80s       arcs through 5 pieces, -25% per jump
 *   flak    1.30 / 0.90s       airburst at cursor, 125u splash
 *   rail    2.40 / 1.82s       beam, 1500u, pierces 12
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
  { id: "magnet", name: "Component Magnet", slot: "utility", difficulty: 3, n: 5, need: { cats: ["core", "body"], count: 1 }, species: { names: ["Worker Ant", "Honeybee"], count: 1 }, desc: "Passively drags light loose components (mass 7 or less) toward your craft from a wide radius." },

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
 * Enemy energy shields let energy, shock and thermal straight through, and stop
 * everything else dead. A blocked hit deals no damage and does not drain the
 * panel: it stays up until its shield-generator part is destroyed. Area effects
 * skip the panel check (see below); the Shield-Bypass Laser ignores panels, the
 * Rail Sniper does not.
 * Kinetic/explosive hull shells reduce incoming damage to 30%; lasers/shock do 0.
 */
export type DmgKind = "kinetic" | "energy" | "explosive" | "shock" | "corrosive" | "thermal" | "physical";
export interface DmgInfo { name: string; color: string; note: string }
export const DMG_INFO: Record<DmgKind, DmgInfo> = {
  kinetic: { name: "Kinetic", color: "#ffd24d", note: "solid rounds; stopped dead by energy shields; hull shells reduce it to 30%" },
  energy: { name: "Energy", color: "#7df9ff", note: "lasers and beams; passes through enemy energy shields; hull shells block it" },
  explosive: { name: "Explosive", color: "#ff7a5c", note: "blast damage; stopped by energy shields; plating reduces it to 30%" },
  shock: { name: "Shock", color: "#c77dff", note: "electrical arcs; passes through energy shields; hull shells block it" },
  corrosive: { name: "Corrosive", color: "#9dff6a", note: "acid; melts armour; stopped dead by energy shields" },
  thermal: { name: "Thermal", color: "#ff8ad6", note: "plasma heat; passes through enemy energy shields" },
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
 * Persistent player settings (see Base / Settings panel):
 *   autoFire     — crafted weapons fire on their own when a target is in range (default true)
 *   showCompInfo — hover tooltip on loose components: name, rarity, value, mass (default true)
 *   showRanges   — translucent coloured circles showing each fitted weapon's range (default false)
 *   autoSell     — sell docked components automatically
 * Version history lives in src/game/changelog.ts (semantic: 1.x features, 1.0.x fixes).
 */
export interface CannonSave {
  /** the chassis bolted to the hull right now */
  id: string;
  /** chassis bought from the tree; the free tier-0 gun is always in here */
  owned: string[];
  /** cannon id -> track id -> level */
  lv: Record<string, Record<string, number>>;
}

export interface SaveData {
  v: number;
  ts: number;
  name: string;
  credits: number;
  earned: number;
  kills: number;
  seq: number;
  upgrades: Record<string, number>;
  /** the cannon tree: which chassis are owned, which is bolted on, and every
   *  chassis' own track levels (nothing is shared between guns) */
  cannon: CannonSave;
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
    credits: 60, earned: 0, kills: 0, seq: 1, upgrades: {}, cannon: { id: CANNONS[0].id, owned: [CANNONS[0].id], lv: {} }, inventory: [], crafted: [],
    equip: { weapon: [null, null, null], shield: null, armor: null, optics: null, utility: null },
    abilitySlots: [null, null, null, null, null], autoSell: false, autoFire: true, showCompInfo: true, showRanges: false, bestiary: {},
  };
}

export function migrate(raw: unknown): SaveData {
  const d = newSave();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<SaveData>;
  const abilitySlots = [0, 1, 2, 3, 4].map((i) => r.abilitySlots?.[i] ?? null);
  /* v2.9 and earlier kept cannon damage and fire rate in the global upgrade map;
   * v2.11 and earlier kept one flat level map for the fitted gun. Both fold into
   * the per-cannon tree, and only tracks the chassis actually carries survive. */
  const legacy = r.upgrades ?? {};
  const saved = r.cannon as unknown as { id?: string; owned?: string[]; lv?: Record<string, unknown> } | undefined;
  const cannon: CannonSave = { id: CANNONS[0].id, owned: [CANNONS[0].id], lv: {} };
  if (saved) {
    if (saved.id && CANNON_BY_ID[saved.id]) cannon.id = saved.id;
    const rawLv = saved.lv ?? {};
    const vals = Object.values(rawLv);
    if (vals.every((v) => typeof v === "number")) {
      /* flat map: it described the fitted gun */
      const flat = Object.fromEntries(Object.entries(rawLv).filter(([, v]) => typeof v === "number")) as Record<string, number>;
      if (Object.keys(flat).length) cannon.lv[cannon.id] = flat;
    } else {
      for (const [cid, tracks] of Object.entries(rawLv)) {
        if (CANNON_BY_ID[cid] && tracks && typeof tracks === "object") cannon.lv[cid] = { ...(tracks as Record<string, number>) };
      }
    }
    if (Array.isArray(saved.owned)) {
      for (const id of saved.owned) if (CANNON_BY_ID[id]) cannon.owned.push(id);
    }
  }
  if (typeof legacy.dmg === "number") {
    const own = (cannon.lv[cannon.id] ??= {});
    if (own.dmg === undefined) own.dmg = legacy.dmg;
  }
  /* prune tracks the chassis no longer has (the Stinger lost its rate track) and
   * keep every gun that has levels in the owned list */
  for (const [cid, tracks] of Object.entries(cannon.lv)) {
    const def = CANNON_BY_ID[cid];
    if (!def) { delete cannon.lv[cid]; continue; }
    for (const k of Object.keys(tracks)) if (!def.tracks.includes(k as CannonTrackId)) delete tracks[k];
    if (def.tracks.every((k) => !tracks[k]) && !cannon.owned.includes(cid) && cid !== cannon.id) delete cannon.lv[cid];
  }
  cannon.owned = [...new Set([CANNONS[0].id, ...cannon.owned, ...Object.keys(cannon.lv)])].filter((id) => !!CANNON_BY_ID[id]);
  if (!cannon.owned.includes(cannon.id)) cannon.id = CANNONS[0].id;
  return {
    ...d,
    ...r,
    v: 2,
    cannon,
    upgrades: Object.fromEntries(Object.entries(legacy).filter(([k]) => UPGRADE_BY_ID[k])),
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
  /** main-cannon damage per round, rounds per second and rounds per trigger */
  dmg: number; rate: number; barrels: number;
  /** critical hit chance and multiplier (0 when the gun has no crit track) */
  crit: number; critMul: number;
  /** extra pieces a round passes through, and the muzzle spread in radians */
  pierce: number; spread: number;
  /** the Stinger's little impact charge (0 for every other chassis) */
  boom: number;
  /** hitscan guns draw a line instead of throwing a round */
  hitscan: boolean;
  /** round speed and reach, from the chassis and its projectile-speed track */
  bulletSpeed: number; bulletRange: number;
  /** the fitted chassis and everything the hull and the HUD need to draw it */
  cannonId: string; muzzles: { x: number; y: number }[]; kick: number; heatPerShot: number;
  /** how heat changes the gun: damage and spread multipliers at a full gauge,
   *  and the forced cool-down in seconds (0 = this gun never jams) */
  heatDmg: number; heatSpread: number; overheat: number;
  /** charge cannon (Mediator): hold to build, release to fire a beam */
  charge: boolean; chargeTime: number; chargeDmg: number;
  /** Skewer MK2: extra damage vs armour plating, and energy-shot bypass chance */
  armorDmg: number; energyChance: number;
  /** Mediator: charge-speed multiplier and beam-width multiplier */
  chargeRate: number; beamWidth: number;
  hull: number; regen: number; armor: number; reactive: number; thorn: number; poisonResist: number;
  shieldMax: number; shieldRegen: number; shieldDelay: number; reflect: boolean;
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
  let hull = 100 * Math.pow(1.19, L("hull"));
  /* the cannon carries its own upgrades; nothing here is shared with the shop */
  const cannon = CANNON_BY_ID[s.cannon?.id ?? ""] ?? CANNONS[0];
  const cl = s.cannon?.lv?.[cannon.id] ?? {};
  const baseDmg = cannonDmg(cannon, cl);
  let shieldMax = L("shield") ? 60 * Math.pow(1.22, L("shield") - 1) : 0;
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
    rate: cannonRate(cannon, cl),
    /* weapon-side tuning lives on the cannon itself: crit and barrels are tracks a
     * chassis may or may not carry, and the Stinger carries neither */
    barrels: cannonBarrels(cl),
    crit: cannonCrit(cl),
    critMul: cannonCritMul(cl),
    pierce: cannonPierce(cl),
    spread: cannonSpread(cannon, cl),
    boom: cannon.boom ?? 0,
    hitscan: !!cannon.hitscan,
    bulletSpeed: cannonSpeed(cannon, cl),
    bulletRange: cannon.range,
    cannonId: cannon.id,
    muzzles: cannon.muzzles,
    kick: cannon.kick,
    heatPerShot: cannon.heat,
    heatDmg: cannon.heatMax ?? 1,
    heatSpread: cannon.heatSpread ?? 1,
    overheat: cannon.overheat ?? 0,
    charge: !!cannon.charge,
    chargeTime: cannon.chargeTime ?? 1,
    chargeDmg: cannon.chargeDmg ?? 1,
    armorDmg: cannonArmorDmg(cl),
    energyChance: cannonEnergyChance(cl),
    chargeRate: cannonChargeRate(cl),
    beamWidth: cannonBeamWidth(cl),
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
    dropChance: 1 + 0.25 * L("drops"),
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
