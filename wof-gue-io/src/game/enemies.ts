import { TAU, polyArea, polyCentroid, mulberry32 } from "./math";
import { HP_MUL, SIZE_GROWTH, type PartKind } from "./data";

/* ---------------------------------------------------------------------------
 * BESTIARY — QUICK STATS (tier 0 → 5 scaling is global, see data.ts HP_MUL / DMG_MUL)
 *   Small flyers (Worker Ant, Honeybee, Mosquito, Yellowjacket, Ladybug): speed 190–260,
 *     turn 3.4–4.2, 1–2 abilities, pack 1–2.
 *   Beetles (Bombardier, Rhino, Stag, Tiger, Dung, Jewel): speed 120–180, turn 2.4–3.2,
 *     heavy armour layers, 2–4 abilities, pack 1.
 *   Long-bodied (Centipede, Snake): bodyWave enabled, 12+3t / 40+5t segments,
 *     turn 2.8 / 3.6, no leg-based mobility loss.
 *   Snake (boss): zone 5 only, one alive, 430 speed, 3.6 turn, 65 segments at t5,
 *     guaranteed mythical drops, 120s respawn timer (150s when killed from the chunk spawn).
 *   Body plan sizes: BASE_SIZE 28px, x1.65 per tier; part HP = base * HP_MUL[tier].
 *   Epic+ (tier 3+) non-serpentine species gain plating shells: t3=1, t4=2, t5=3,
 *     each 10*HP_MUL[tier] HP, kinetic hits take 30%, lasers/shockwaves take 0.
 * ------------------------------------------------------------------------- */

export const BASE_SIZE = 28;

export interface Part {
  id: number;
  kind: PartKind;
  name: string;
  poly: number[];
  cx: number;
  cy: number;
  r: number;
  area: number;
  hp: number;
  maxHp: number;
  layer: number;
  links: number[];
  g: number;
  /** index along a curving body (-1 for ordinary parts) */
  seg: number;
  alive: boolean;
  hurt: number;
  barT: number;
  style: number;
  stroke: string;
  fill: string;
  glow: boolean;
  wpn: "" | GunKind | "missile";
  muzzle: number;
  shieldR: number;
  /** 0 = curved arc panel, 1 = straight bar */
  shieldKind: 0 | 1;
  /** arc half-angle in radians, or bar half-length in world units */
  shieldSpan: number;
  /** base facing of the projected shield, in body-local space */
  shieldAng: number;
  /** radians per second the projection sweeps around the body */
  shieldSpin: number;
  shieldHp: number;
  shieldMax: number;
  shieldDown: number;
  shieldHit: number;
  cd: number;
  /** seconds a laser mount has held its beam on the player (0 = off, ramps damage) */
  beam: number;
}

export type GroupRole = "leg" | "wing" | "arm" | "mandible" | "tail" | "turret" | "sway";
export interface Group {
  px: number;
  py: number;
  ang: number;
  role: GroupRole;
  sign: number;
  phase: number;
  amp: number;
}

/** enemy turret kinds; "''" on every part that is not a weapon */
export type GunKind = "gun" | "scatter" | "heavy" | "laser" | "minigun";

export interface GunSpec {
  name: string;
  /** firing range in world units */
  range: number;
  /** base cooldown before the 4%-per-tier rate bonus */
  cd: number;
  /** damage as a multiple of the enemy's contact damage */
  dmg: number;
  speed: number;
  /** projectile radius at tier 0 */
  r: number;
  life: number;
  hue: number;
  pellets?: number;
  /** total spread in radians */
  spread?: number;
  homing?: number;
  /** energy damage: ignores the kinetic shield archetype */
  energy?: boolean;
  /** fires an instant line instead of a travelling projectile */
  hitscan?: boolean;
  type: ProjType;
  /** firing shove backwards, in u/s */
  recoil?: number;
  /** seconds it can hold the trigger before it has to cool down (minigun) */
  burst?: number;
  /** seconds spent cooling once the burst runs dry */
  cool?: number;
  /** a held beam instead of a projectile: damage is dealt every tick while it
   *  tracks the player, and the ramp climbs while it stays on (laser) */
  track?: boolean;
  /** range is the mount's own aggro radius rather than a fixed number (rail) */
  aggroRange?: boolean;
}

export const GUN_SPECS: Record<GunKind, GunSpec> = {
  /* Damage is a multiple of the species' own hit, per attachment, and every one
   * of these is per projectile (the laser's per tick, the rail's per slug). The
   * sheet's shape notes are part of the spec: the basic cannon throws a very,
   * very large and very slow round, the scatter a large slow spread, the rotary
   * a fast small one that has to cool for ten seconds, the rail a hitscan slug
   * out to the body's own aggro range, and the laser a held tracking beam. */
  gun:     { name: "Gun Turret",     range: 900,  cd: 1.35, dmg: 0.5,  speed: 300,  r: 14, life: 3.2,  hue: 8,   type: "bolt" },
  minigun: { name: "Rotary Gun",     range: 700,  cd: 0.16, dmg: 0.2,  speed: 720,  r: 3,  life: 0.9,  hue: 48,  spread: 0.16, type: "bolt", burst: 10, cool: 10 },
  scatter: { name: "Scatter Cannon", range: 700,  cd: 2.6,  dmg: 1.2,  speed: 420,  r: 9,  life: 1.4,  hue: 32,  pellets: 7, spread: 0.5, type: "pellet" },
  heavy:   { name: "Heavy Rail Cannon", range: 1200, cd: 5.0, dmg: 17, speed: 950, r: 12, life: 1.7,  hue: 356, type: "slug", recoil: 260, hitscan: true, aggroRange: true },
  laser:   { name: "Laser Emitter",  range: 1000, cd: 2.4,  dmg: 1.0,  speed: 1500, r: 6,  life: 0.45, hue: 188, energy: true, type: "laser", track: true },
};

/** base ability cooldown by rarity tier, per the sheet's 17/12/8/3/1.75/1s */
export const ABILITY_INTERVALS = [17, 12, 8, 3, 1.75, 1];

/** how long a laser mount has to hold the beam before it reaches full damage */
export const LASER_RAMP = 3;
/** the beam's damage multiplier when it first touches down, and at full ramp */
export const LASER_RAMP_MIN = 0.35;

export type AbilityType = "swing" | "charge" | "shoot" | "nova" | "ring" | "pull" | "spit" | "cloud" | "summon" | "blink" | "drain" | "grab" | "beam" | "domain" | "sting";
export type ProjType = "bolt" | "missile" | "web" | "orb" | "wave" | "hook" | "glob" | "pellet" | "slug" | "laser";
export interface AbilityDef {
  type: AbilityType;
  name: string;
  minTier: number;
  /** base cooldown; falls back to the tier-based interval when omitted */
  cd?: number;
  wind: number;
  dmg: number;
  minS?: number;
  maxS?: number;
  minP?: number;
  maxP?: number;
  role?: "arm" | "mandible" | "tail" | "leg" | "wing";
  needs?: string;
  n?: number;
  ns?: number;
  spread?: number;
  speed?: number;
  life?: number;
  size?: number;
  slow?: number;
  slowT?: number;
  poison?: number;
  homing?: number;
  pierce?: boolean;
  dur?: number;
  kind?: ProjType;
  atPlayer?: boolean;
  /** grab: how many chomps/stings to deal while holding the player */
  chomps?: number;
  /** grab: seconds between each chomp */
  chompCd?: number;
  /** grab: how long the enemy holds the player */
  hold?: number;
  /** grab: speed of the closing lunge toward the player during wind-up */
  lunge?: number;
  /** shoot: the web drops a floor web zone on landing instead of just hitting */
  webDrop?: boolean;
  /** shoot: the web is tethered to the spider and reels the ship in on hit */
  tether?: boolean;
  /** beam: how many beams to fire */
  beams?: number;
  /** beam: rotation speed in rad/s */
  beamSpin?: number;
}

export interface Mount {
  sec: Sec;
  host: number;
  core?: boolean;
}

export interface SpeciesDef {
  id: string;
  name: string;
  hue: number;
  flying: boolean;
  speed: number;
  turn: number;
  ranged: boolean;
  keep: number;
  muzzle: number;
  armed: { gun: boolean; missile: boolean; shield: boolean };
  /** signature turret this species mounts; defaults to the plain gun */
  gunType?: GunKind;
  /** hit points of one normal (body) piece at common rarity; the sheet in docs/BALANCE.md */
  hp: number;
  /** damage of one common-rarity hit before attachment multipliers */
  dmg: number;
  pack: number[];
  abilities: AbilityDef[];
  build: (b: Builder, tier: number) => Mount[];
  /** zoneTier range this species spawns in (0 = outer/common, 5 = centre/mythical) */
  minZone?: number;
  maxZone?: number;
  /** unique boss: at most one alive, centre only, mythical drops */
  boss?: boolean;
  /** its shields bounce player shots back */
  reflectShell?: boolean;
  /** serpentine body: lateral wave applied to parts tagged with a segment index */
  bodyWave?: { amp: number; k: number; speed: number };
}

interface Sec {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  n: number;
}

/* ---------------- geometry helpers (unit space, +x forward) ---------------- */
const ell = (cx: number, cy: number, rx: number, ry: number, n = 8, rot = 0): number[] => {
  const out: number[] = [];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push(cx + x * c - y * s, cy + x * s + y * c);
  }
  return out;
};
const secPoly = (s: Sec) => ell(s.cx, s.cy, s.rx, s.ry, s.n);
const secSector = (s: Sec, f0: number, f1: number, k0: number, k1: number) => {
  const out: number[] = [];
  for (let k = k0; k <= k1; k++) {
    const a = (k / s.n) * TAU;
    out.push(s.cx + Math.cos(a) * s.rx * f1, s.cy + Math.sin(a) * s.ry * f1);
  }
  for (let k = k1; k >= k0; k--) {
    const a = (k / s.n) * TAU;
    out.push(s.cx + Math.cos(a) * s.rx * f0, s.cy + Math.sin(a) * s.ry * f0);
  }
  return out;
};
const taper = (ax: number, ay: number, bx: number, by: number, wa: number, wb: number) => {
  const dx = bx - ax, dy = by - ay;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  return [ax + nx * wa, ay + ny * wa, bx + nx * wb, by + ny * wb, bx - nx * wb, by - ny * wb, ax - nx * wa, ay - ny * wa];
};
const mirror = (p: number[]) => {
  const o: number[] = [];
  for (let i = 0; i < p.length; i += 2) o.push(p[i], -p[i + 1]);
  return o;
};
const saw = (ax: number, ay: number, bx: number, by: number, wa: number, wb: number, teeth: number, tl: number, side: number) => {
  const dx = bx - ax, dy = by - ay;
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * side, ny = (dx / l) * side;
  const w = (t: number) => wa + (wb - wa) * t;
  const P = (t: number, off: number) => [ax + dx * t + nx * off, ay + dy * t + ny * off];
  const pts: number[] = [ax - nx * wa, ay - ny * wa, bx - nx * wb, by - ny * wb, bx + nx * wb, by + ny * wb];
  for (let k = teeth; k >= 1; k--) {
    const tip = (k - 0.2) / teeth;
    const notch = (k - 1) / teeth;
    pts.push(...P(Math.min(1, tip), w(tip) + tl), ...P(notch, w(notch) * 0.9));
  }
  return pts;
};
const turretPoly = (cx: number, cy: number, r: number, len: number, bw: number) => {
  const h = 0.866 * r;
  const pts = [0.5 * r, -h, 0.5 * r, -bw, len, -bw, len, bw, 0.5 * r, bw, 0.5 * r, h, -0.5 * r, h, -r, 0, -0.5 * r, -h];
  const o: number[] = [];
  for (let i = 0; i < pts.length; i += 2) o.push(cx + pts[i], cy + pts[i + 1]);
  return o;
};

/* ---------------- colours ---------------- */
function colorsFor(kind: PartKind, hue: number, style: number) {
  const dl = style === 1 ? -10 : style >= 2 ? 10 : 0;
  const h = (x: number) => Math.round((((hue + x) % 360) + 360) % 360);
  switch (kind) {
    case "core": return { stroke: "#ffffff", fill: `hsla(${h(180)},100%,60%,0.95)`, glow: true };
    case "segment": return { stroke: `hsl(${h(0)},95%,${58 + dl}%)`, fill: `hsla(${h(0)},80%,${22 + dl / 2}%,0.9)`, glow: style >= 3 };
    case "armor": return { stroke: `hsl(${h(25)},100%,${68 + dl}%)`, fill: `hsla(${h(25)},85%,${30 + dl}%,0.82)`, glow: false };
    case "leg": return { stroke: `hsl(${h(0)},70%,${46 + dl}%)`, fill: `hsla(${h(0)},60%,14%,0.92)`, glow: false };
    case "arm": return { stroke: `hsl(${h(40)},100%,${65 + dl}%)`, fill: `hsla(${h(40)},80%,${26 + dl}%,0.88)`, glow: false };
    case "wing": return { stroke: `hsla(${h(60)},90%,72%,0.85)`, fill: `hsla(${h(60)},90%,55%,0.14)`, glow: false };
    case "weapon": return { stroke: "hsl(8,100%,64%)", fill: "hsla(8,85%,28%,0.95)", glow: true };
    case "shield": return { stroke: "hsl(190,100%,68%)", fill: "hsla(190,90%,38%,0.7)", glow: true };
    default: return { stroke: `hsl(${h(25)},100%,76%)`, fill: `hsla(${h(25)},100%,46%,0.85)`, glow: false };
  }
}

/** How each kind of piece compares to the species' normal piece. Armour's weight
 *  here is only a starting point: once the body is built, every armour piece is
 *  re-priced against the body's own average piece health (see scaleArmour), so
 *  its real ratio is the rarity figure below. */
const KIND_HP: Record<PartKind, number> = { core: 2.5, segment: 1, armor: 1, leg: 0.5, arm: 1.33, wing: 0.5, weapon: 1.83, shield: 2.17, spike: 0.42 };

/** Armour is worth this multiple of the body's average piece, by rarity:
 *  common, uncommon, rare, epic, legendary, mythical. The sheet fixes rare to
 *  mythic at 4 / 5.5 / 7 / 9; common and uncommon continue the ramp below. */
export const ARMOUR_HP_MUL = [2.5, 3.25, 4, 5.5, 7, 9];

/* ---------------- builder ---------------- */
export class Builder {
  parts: Part[] = [];
  groups: Group[] = [];
  coreId = 0;
  readonly S: number;
  constructor(public tier: number, public hue: number, public rng: () => number, public baseHp = 12) {
    this.S = BASE_SIZE * Math.pow(SIZE_GROWTH, tier);
  }

  add(kind: PartKind, name: string, poly: number[], o: { layer?: number; hpM?: number; g?: number; links?: number[]; style?: number; seg?: number } = {}) {
    const S = this.S;
    const p = poly.map((v) => v * S);
    const [cx, cy] = polyCentroid(p);
    let r = 0;
    for (let i = 0; i < p.length; i += 2) r = Math.max(r, Math.hypot(p[i] - cx, p[i + 1] - cy));
    const style = o.style ?? 0;
    const col = colorsFor(kind, this.hue, style);
    const hp = this.baseHp * KIND_HP[kind] * HP_MUL[this.tier] * (o.hpM ?? 1);
    const id = this.parts.length;
    this.parts.push({
      id, kind, name, poly: p, cx, cy, r, area: polyArea(p), hp, maxHp: hp,
      layer: o.layer ?? 1, links: [], g: o.g ?? -1, seg: o.seg ?? -1, alive: true, hurt: 0, barT: 0, style,
      stroke: col.stroke, fill: col.fill, glow: col.glow || (kind === "segment" && style >= 3),
      wpn: "", muzzle: 0, shieldR: 0, shieldKind: 0, shieldSpan: 0, shieldAng: 0, shieldSpin: 0, shieldHp: 0, shieldMax: 0, shieldDown: 0, shieldHit: 0, cd: 1 + this.rng() * 2, beam: 0,
    });
    if (o.links) for (const l of o.links) this.link(id, l);
    return id;
  }
  link(a: number, b: number) {
    if (a === b) return;
    if (!this.parts[a].links.includes(b)) this.parts[a].links.push(b);
    if (!this.parts[b].links.includes(a)) this.parts[b].links.push(a);
  }
  group(px: number, py: number, role: GroupRole, sign = 1, amp = 0.4, phase = 0) {
    this.groups.push({ px: px * this.S, py: py * this.S, ang: 0, role, sign, phase, amp });
    return this.groups.length - 1;
  }
  sec(name: string, s: Sec, o: { hpM?: number; layer?: number; style?: number; seg?: number } = {}) {
    return this.add("segment", name, secPoly(s), { layer: o.layer ?? 1, hpM: o.hpM, style: o.style, seg: o.seg });
  }
  core(s: Sec, host: number, nbrs: number[], seg = -1) {
    /* Compact weak point tucked under the body. Layer 0 means the segments and
     * plates draw over it, so the core only shows through gaps instead of
     * swallowing the insect's silhouette. */
    const r = Math.max(0.24, Math.min(s.rx, s.ry) * 0.36);
    const id = this.add("core", "Core", ell(s.cx, s.cy, r, r, 6, Math.PI / 6), { layer: 0, links: [host, ...nbrs], seg });
    if (this.tier >= 2) this.add("armor", "Core Guard", ell(s.cx, s.cy, r * 1.55, r * 1.55, 6), { layer: 6, links: [host], hpM: 1.6, style: 1, seg });
    if (this.tier >= 4) this.add("armor", "Core Guard", ell(s.cx, s.cy, r * 1.12, r * 1.12, 6, Math.PI / 6), { layer: 7, links: [host], hpM: 2.2, style: 2, seg });
    this.coreId = id;
    return id;
  }
  armor(s: Sec, host: number, o: { name: string; layers: number; edges: number; style?: number; hpM?: number; seg?: number }) {
    const ids: number[] = [];
    for (let L = 0; L < o.layers; L++) {
      const f1 = 1.05 - 0.3 * L;
      const f0 = Math.max(0.12, f1 - 0.45);
      for (let k0 = 0; k0 < s.n; k0 += o.edges) {
        const k1 = Math.min(s.n, k0 + o.edges);
        ids.push(this.add("armor", o.name, secSector(s, f0, f1, k0, k1), { layer: 4 + L, hpM: (o.hpM ?? 1) * (1 + 0.2 * L), links: [host], style: o.style ?? L % 2, seg: o.seg }));
      }
    }
    return ids;
  }
  spikes(s: Sec, host: number, o: { every: number; len: number; name?: string; seg?: number }) {
    for (let k = 0; k < s.n; k += o.every) {
      const a0 = (k / s.n) * TAU, a1 = ((k + 1) / s.n) * TAU, am = (a0 + a1) / 2;
      const poly = [
        s.cx + Math.cos(a0) * s.rx * 0.98, s.cy + Math.sin(a0) * s.ry * 0.98,
        s.cx + Math.cos(am) * s.rx * (1 + o.len), s.cy + Math.sin(am) * s.ry * (1 + o.len),
        s.cx + Math.cos(a1) * s.rx * 0.98, s.cy + Math.sin(a1) * s.ry * 0.98,
      ];
      this.add("spike", o.name ?? "Spine", poly, { layer: 5, links: [host], hpM: 0.8, seg: o.seg });
    }
  }
}

/* ---------------- shared limb builders ---------------- */
function leg(
  b: Builder, host: number, sx: number, sy: number, side: number, angs: number[], lens: number[], w: number, name: string,
  o: { phase?: number; amp?: number; split?: number; layer?: number; kind?: PartKind; role?: GroupRole; seg?: number } = {},
) {
  const gi = b.group(sx, sy * side, o.role ?? "leg", side, o.amp ?? 0.32, o.phase ?? 0);
  let x = sx, y = sy;
  let prev = host;
  const sp = o.split ?? 1;
  for (let i = 0; i < lens.length; i++) {
    for (let k = 0; k < sp; k++) {
      const L = lens[i] / sp;
      const nx = x + Math.cos(angs[i]) * L, ny = y + Math.sin(angs[i]) * L;
      const prog = (i + k / sp) / lens.length;
      const wa = w * (1 - 0.35 * prog), wb = w * (1 - 0.35 * (prog + 1 / (lens.length * sp)));
      const bx = x - Math.cos(angs[i]) * wa * 0.9, by = y - Math.sin(angs[i]) * wa * 0.9;
      const poly = taper(bx, by, nx, ny, wa, wb);
      const id = b.add(o.kind ?? "leg", name, side > 0 ? poly : mirror(poly), { layer: o.layer ?? 0, g: gi, links: [prev], seg: o.seg });
      prev = id;
      x = nx; y = ny;
    }
  }
  return gi;
}
function legPair(b: Builder, host: number, sx: number, sy: number, angs: number[], lens: number[], w: number, name: string, o: { phase?: number; split?: number; amp?: number; seg?: number } = {}) {
  leg(b, host, sx, sy, 1, angs, lens, w, name, { ...o, phase: o.phase ?? 0 });
  leg(b, host, sx, sy, -1, angs, lens, w, name, { ...o, phase: (o.phase ?? 0) + Math.PI });
}
function antennae(b: Builder, host: number, ax: number, ay: number, angs: number[], lens: number[], w = 0.05, seg = -1) {
  for (const side of [1, -1]) leg(b, host, ax, ay, side, angs, lens, w, "Antenna", { kind: "spike", layer: 2, role: "sway", amp: 0.14, phase: side * 1.3, seg });
}
function mandibles(b: Builder, host: number, pivotX: number, pivotY: number, poly: number[], name: string, hpM = 1, seg = -1) {
  for (const side of [1, -1]) {
    const gi = b.group(pivotX, pivotY * side, "mandible", side, 0.1, 0);
    b.add("arm", name, side > 0 ? poly : mirror(poly), { layer: 2, g: gi, links: [host], hpM, seg });
  }
}
function wingPart(b: Builder, host: number, ax: number, ay: number, side: number, poly: number[], name: string, amp = 0.22, phase = 0, hpM = 1) {
  const gi = b.group(ax, ay * side, "wing", side, amp, phase);
  return b.add("wing", name, side > 0 ? poly : mirror(poly), { layer: 0.5, g: gi, links: [host], hpM });
}
function wingSub(b: Builder, wingId: number, host: number, ax: number, ay: number, side: number, cx: number, cy: number, rx: number, ry: number, rot: number, name: string, style = 0) {
  // armour plate that rides on a wing (shares the wing's animation group)
  const w = b.parts[wingId];
  const poly = ell(cx, cy, rx, ry, 6, rot);
  b.add("armor", name, side > 0 ? poly : mirror(poly), { layer: 1.5, g: w.g, links: [wingId], style, hpM: 1.1 });
  void host; void ax; void ay;
}

/* ---------------- loadout: guns / missiles / shield generators ---------------- */
/** stable per-species number, used to give each species its own shield layout */
const idHash = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; };

/** Which shape this species projects: flyers and serpents get curved panels,
 *  walkers get straight bars. Panels are wide enough to overlap their neighbours
 *  so a formation reads as one wall instead of a fence. */
function shieldStyle(sp: SpeciesDef, S: number) {
  const arc = sp.flying || !!sp.bodyWave;
  /* Only the boss sweeps: a rotating front formation would open and close gaps
   * on its own, which turns aiming into a lottery. */
  const spin = sp.boss ? 0.35 : 0;
  return { bar: !arc, span: arc ? 0.9 : 1.5 * S, r: 1.45 * S, spin };
}

const GUN_ROLL: { kind: GunKind; w: number[] }[] = [
  { kind: "gun", w: [0.45, 0.3, 0.2] },
  { kind: "minigun", w: [0.2, 0.2, 0.2] },
  { kind: "scatter", w: [0.2, 0.2, 0.2] },
  { kind: "laser", w: [0.1, 0.15, 0.2] },
  { kind: "heavy", w: [0.05, 0.15, 0.2] },
];
/** weapon picked for a body that normally carries no gun; heavier gear shows up deeper in */
function randomGunKind(roll: number, tier: number): GunKind {
  const col = tier >= 5 ? 2 : tier >= 4 ? 1 : 0;
  let sum = 0;
  for (const g of GUN_ROLL) sum += g.w[col];
  let x = roll * sum;
  for (const g of GUN_ROLL) { x -= g.w[col]; if (x <= 0) return g.kind; }
  return "gun";
}

function loadout(b: Builder, mounts: Mount[], sp: SpeciesDef) {
  const t = b.tier;
  const armed = sp.armed;
  /* Guns and shield generators used to be hard-coded per species. Now every body
   * that does not carry one by design still rolls for it once the mounts exist
   * (epic and up), so a Mantis can turn up with a rotary gun and a shield panel. */
  const chanceGun = t >= 3 && !armed.gun && b.rng() < 0.12 + 0.06 * t;
  const chanceShield = t >= 3 && !armed.shield && b.rng() < 0.1 + 0.05 * t;
  const nGun = (armed.gun || chanceGun) && t >= 3 ? t - 2 : 0;
  const nMis = armed.missile && t >= 4 ? t - 3 : 0;
  const nSh = (armed.shield || chanceShield) && t >= 3 ? t : 0;
  if (!nGun && !nMis && !nSh) return;
  const kind: GunKind = sp.gunType ?? (chanceGun ? randomGunKind(b.rng(), t) : "gun");

  type Cand = { x: number; y: number; host: number; r: number };
  const pairs: Cand[] = [];
  const centers: Cand[] = [];
  for (const m of mounts) {
    const mn = Math.min(m.sec.rx, m.sec.ry);
    if (mn < 0.3) continue;
    const offs = m.sec.rx >= 0.8 ? [-0.4, 0.4] : [0];
    for (const o of offs) pairs.push({ x: m.sec.cx + o * m.sec.rx, y: m.sec.ry * 0.55, host: m.host, r: mn * 0.3 });
    if (!m.core) centers.push({ x: m.sec.cx - m.sec.rx * 0.4, y: 0, host: m.host, r: mn * 0.3 });
  }
  pairs.sort((a, b2) => b2.r - a.r);
  let pi = 0;
  const turret = (c: Cand, side: number, missile: boolean) => {
    const spec = missile ? null : GUN_SPECS[kind];
    const bulky = kind === "heavy" || kind === "scatter";
    const r = c.r * (missile ? 1.15 : bulky ? 1.25 : 1);
    const len = missile ? r * 1.5 : r * (kind === "laser" ? 2.5 : kind === "heavy" ? 2.4 : 2.0);
    const bw = missile ? r * 0.5 : r * (kind === "laser" ? 0.14 : kind === "heavy" ? 0.28 : 0.18);
    const gi = b.group(c.x, c.y * side, "turret", side, 0, 0);
    const poly = turretPoly(c.x, c.y, r, len, bw);
    const id = b.add("weapon", missile ? "Missile Pod" : spec!.name, side > 0 ? poly : mirror(poly), { layer: 8, g: gi, links: [c.host] });
    const p = b.parts[id];
    p.wpn = missile ? "missile" : kind;
    p.muzzle = len * b.S;
    if (spec) {
      /* tint the barrel so the weapon reads at a glance */
      p.stroke = `hsl(${spec.hue},100%,${spec.energy ? 74 : 66}%)`;
      p.fill = `hsla(${spec.hue},90%,${spec.energy ? 40 : 28}%,0.95)`;
      p.glow = true;
    }
  };
  for (let i = 0; i < nGun && pi < pairs.length; i++, pi++) { turret(pairs[pi], 1, false); turret(pairs[pi], -1, false); }
  for (let i = 0; i < nMis && pi < pairs.length; i++, pi++) { turret(pairs[pi], 1, true); turret(pairs[pi], -1, true); }
  if (nSh > 0) {
    /* Panels are load-bearing wall, not decoration: they are packed across the
     * leading arc so the body is sealed head-on and the flanks/tail stay open.
     * Body-local angle 0 is "in front", so the formation is centred there and
     * each panel is widened to overlap its neighbours. */
    const style = shieldStyle(sp, b.S);
    const ring = 0.95;
    const front = 3.6;                      // radians of leading arc covered (~206 degrees)
    const slot = front / nSh;
    for (let i = 0; i < nSh; i++) {
      const a = -front / 2 + (i + 0.5) * slot;
      const px = Math.cos(a) * ring, py = Math.sin(a) * ring;
      const id = b.add("shield", "Shield Generator", ell(px, py, 0.26, 0.2, 6, a), { layer: 8, links: [b.coreId], style: 2 });
      const p = b.parts[id];
      p.shieldKind = style.bar ? 1 : 0;
      /* straight bars are sized by chord length so they meet the next panel;
       * curved panels get a hair over half the slot on each side */
      p.shieldSpan = style.bar
        ? Math.max(style.span, Math.sin(slot / 2) * 1.45 * b.S * 1.12)
        : Math.max(style.span, slot * 0.62);
      p.shieldAng = a;
      p.shieldSpin = style.spin;
      p.shieldR = style.r;
      p.shieldMax = p.shieldHp = p.maxHp * 3;
    }
  }
}

const P = Math.PI;

/* ---------------- species ---------------- */
const SPECIES: SpeciesDef[] = [
  /* 0 ─ DRAGONFLY */
  {
    id: "dragonfly", hp: 19, dmg: 30, gunType: "laser", name: "Dragonfly", hue: 188, flying: true, speed: 210, turn: 3.4, ranged: true, keep: 330, muzzle: 2.2,
    armed: { gun: true, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "charge", name: "Dash", minTier: 0, wind: 0.4, dmg: 1, speed: 620, dur: 0.4, minP: 150, maxS: 2, maxP: 900 },
      { type: "shoot", name: "Spray", minTier: 0, wind: 0.5, dmg: 5, n: 4, ns: 1, spread: 0.6, speed: 220, life: 3, size: 11, kind: "orb", maxS: 2, maxP: 900 },
      { type: "grab", name: "Chomp", minTier: 3, wind: 0.5, dmg: 7, chomps: 4, chompCd: 0.8, hold: 3, maxS: 4, maxP: 500, lunge: 950 },
      { type: "ring", name: "Shockwave", minTier: 4, wind: 0.7, dmg: 8, size: 6, speed: 520, maxS: 4, maxP: 300 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0);
      const hd: Sec = { cx: 1.9, cy: 0, rx: 0.45, ry: 0.5, n: 8 };
      const tho: Sec = { cx: 0.85, cy: 0, rx: 0.65, ry: 0.52, n: 8 };
      const M = Math.min(8, 3 + t);
      const abdLen = 3.4;
      const sp = abdLen / M;
      const mounts: Mount[] = [];
      const iT = b.sec("Thorax", tho, { hpM: 1.3 });
      const iH = b.sec("Head", hd);
      b.link(iT, iH);
      let prev = iT;
      const abds: number[] = [];
      for (let i = 0; i < M; i++) {
        const cx = 0.3 - sp * (i + 0.5) + sp * 0.15;
        const tf = i / Math.max(1, M - 1);
        const s: Sec = { cx, cy: 0, rx: sp * 0.82, ry: 0.27 - 0.1 * tf, n: 6 };
        const id = b.sec("Tail Segment", s, { style: i % 2 });
        b.link(prev, id);
        prev = id;
        abds.push(id);
        if (i === 0) mounts.push({ sec: { ...s, rx: 0.5, ry: 0.4 }, host: id });
      }
      // eyes
      for (const side of [1, -1]) {
        const poly = ell(1.98, 0.36, 0.32, 0.27, 6);
        b.add("armor", "Compound Eye", side > 0 ? poly : mirror(poly), { layer: 3, links: [iH], style: 2, hpM: 0.9 });
      }
      // wings (4)
      for (const side of [1, -1]) {
        for (let k = 0; k < 2; k++) {
          const ax = 1.0 - k * 0.45, ay = 0.3;
          const ang = 1.45 + k * 0.25;
          const len = 1.6 - k * 0.15;
          const poly = ell(ax + Math.cos(ang) * len * 0.92, ay + Math.sin(ang) * len * 0.92, len, 0.33, 8, ang);
          const w = wingPart(b, iT, ax, ay, side, poly, "Wing", 0.2, k * 1.7 + (side > 0 ? 0 : P));
          if (t >= 2) {
            for (const f of [0.45, 0.8]) {
              wingSub(b, w, iT, ax, ay, side, ax + Math.cos(ang) * len * 0.92 * (f * 1.4), ay + Math.sin(ang) * len * 0.92 * (f * 1.4), 0.34, 0.2, ang, "Wing Vein Plate", 1);
            }
          }
        }
      }
      legPair(b, iT, 1.0, 0.3, [1.1, 0.7], [0.55, 0.6], 0.07, "Leg", { split: lg });
      legPair(b, iT, 0.7, 0.35, [1.5, 1.3], [0.55, 0.6], 0.07, "Leg", { split: lg, phase: P });
      b.core(tho, iT, [iH, abds[0]]);
      b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: t >= 3 ? 1 : 2 });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 4 });
      if (t >= 1) for (let i = 0; i < M; i += t >= 3 ? 1 : 2) b.add("armor", "Tail Plate", ell(0.3 - sp * (i + 0.5) + sp * 0.15, 0, sp * 0.5, 0.16, 6), { layer: 4, links: [abds[i]], style: 2, hpM: 0.9 });
      antennae(b, iH, 2.15, 0.2, [0.9, 0.4], [0.5, 0.5]);
      mounts.push({ sec: tho, host: iT, core: true }, { sec: hd, host: iH });
      return mounts;
    },
  },

  /* 1 ─ SCORPION */
  {
    id: "scorpion", hp: 25, dmg: 34, gunType: "scatter", name: "Scorpion", hue: 2, flying: false, speed: 115, turn: 2.4, ranged: false, keep: 0, muzzle: 2.6,
    armed: { gun: true, missile: false, shield: false }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "grab", name: "Pincer Grab", minTier: 0, wind: 0.5, dmg: 2, chompCd: 0.8, hold: 2, maxS: 3.5, lunge: 850 },
      { type: "sting", name: "Tail Sting", minTier: 3, wind: 0.7, dmg: 3.6, dur: 1.4, lunge: 850, maxS: 3.5, poison: 0.3 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const abd: Sec = { cx: -0.5, cy: 0, rx: 1.3, ry: 0.82, n: 10 };
      const car: Sec = { cx: 0.95, cy: 0, rx: 0.8, ry: 0.74, n: 8 };
      const iA = b.sec("Abdomen", abd, { hpM: 1.4 });
      const iC = b.sec("Carapace", car, { hpM: 1.3 });
      b.link(iA, iC);
      for (let k = 0; k < 4; k++) {
        const ang = [1.2, 1.55, 1.9, 2.3][k];
        legPair(b, k < 2 ? iC : iA, [1.2, 0.8, 0.1, -0.5][k], 0.55, [ang, ang + 0.3], [0.6, 0.7], 0.11, "Leg", { split: lg, phase: k % 2 ? P : 0 });
      }
      b.core(car, iC, [iA]);
      b.armor(abd, iA, { name: "Tergite Plate", layers: pl, edges: ed });
      b.armor(car, iC, { name: "Carapace Plate", layers: 1, edges: ed });
      // claws
      for (const side of [1, -1]) {
        const gi = b.group(1.4, 0.5 * side, "arm", side, 0.05, 0);
        const arm = taper(1.4, 0.5, 2.15, 1.0, 0.22, 0.2);
        const a = b.add("arm", "Claw Arm", side > 0 ? arm : mirror(arm), { layer: 2, g: gi, links: [iC] });
        const palm = ell(2.55, 0.92, 0.48, 0.38, 6);
        const pm = b.add("arm", "Claw Palm", side > 0 ? palm : mirror(palm), { layer: 2.2, g: gi, links: [a], hpM: 1.2 });
        const f1 = taper(2.85, 1.05, 3.75, 0.82, 0.15, 0.04);
        const f2 = taper(2.85, 0.78, 3.7, 0.45, 0.15, 0.04);
        b.add("arm", "Pincer", side > 0 ? f1 : mirror(f1), { layer: 2.1, g: gi, links: [pm] });
        b.add("arm", "Pincer", side > 0 ? f2 : mirror(f2), { layer: 2.1, g: gi, links: [pm] });
        if (t >= 2) {
          const guard = ell(2.45, 0.92, 0.3, 0.24, 6);
          b.add("armor", "Claw Guard", side > 0 ? guard : mirror(guard), { layer: 2.5, g: gi, links: [pm], style: 1 });
        }
      }
      // tail curled over the back
      const N = 4 + Math.min(4, t);
      const tg = b.group(-1.55, 0, "tail", 1, 0.05, 0);
      let prev = iA;
      let px = -1.55, py = 0;
      for (let i = 1; i <= N; i++) {
        const f = i / N;
        const x = -1.55 + f * 3.4;
        const y = 0.3 * Math.sin(f * P);
        const poly = taper(px - 0.08, py, x, y, 0.3 - 0.1 * (i - 1) / N, 0.3 - 0.1 * i / N);
        prev = b.add("segment", "Tail Segment", poly, { layer: 5, g: tg, links: [prev], style: i % 2 ? 2 : 0, hpM: 0.9 });
        px = x; py = y;
      }
      b.add("spike", "Stinger", [px - 0.05, -0.2, px + 0.9, 0, px - 0.05, 0.2], { layer: 5.2, g: tg, links: [prev], hpM: 1.2 });
      if (t >= 2) b.spikes(abd, iA, { every: 2, len: 0.22 });
      return [{ sec: abd, host: iA }, { sec: car, host: iC, core: true }];
    },
  },

  /* 2 ─ SPIDER */
  {
    id: "spider", hp: 19, dmg: 50, name: "Widow Spider", hue: 272, flying: false, speed: 140, turn: 2.8, ranged: true, keep: 300, muzzle: 2.2,
    armed: { gun: false, missile: true, shield: false }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "shoot", name: "Web", minTier: 0, wind: 0.5, dmg: 0.4, n: 1, speed: 380, life: 2, size: 14, slow: 0.4, slowT: 3, poison: 0.2, kind: "web", minP: 120, maxS: 2, maxP: 900, webDrop: true },
      { type: "shoot", name: "Web Volley", minTier: 0, wind: 0.5, dmg: 0.3, n: 3, spread: 0.2, speed: 680, life: 1.5, size: 7, kind: "web", minP: 120, maxS: 2, maxP: 900, tether: true },
      { type: "grab", name: "Bite", minTier: 4, wind: 0.4, dmg: 1.67, chompCd: 1, hold: 3, maxS: 3, maxP: 500, lunge: 950 },
      { type: "pull", name: "Pull", minTier: 4, wind: 0.5, dmg: 17, speed: 760, minP: 250, maxS: 2, maxP: 900 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const cef: Sec = { cx: 0.65, cy: 0, rx: 0.8, ry: 0.74, n: 8 };
      const abd: Sec = { cx: -0.95, cy: 0, rx: 1.0, ry: 0.94, n: 10 };
      const iA = b.sec("Abdomen", abd, { hpM: 1.5 });
      const iC = b.sec("Cephalothorax", cef, { hpM: 1.3 });
      b.link(iA, iC);
      const L = [
        { sx: 1.0, sy: 0.3, a: [0.8, 0.55, 0.95], ph: 0 },
        { sx: 0.7, sy: 0.5, a: [1.25, 1.1, 1.5], ph: P },
        { sx: 0.3, sy: 0.6, a: [1.7, 1.8, 2.1], ph: 0 },
        { sx: -0.1, sy: 0.55, a: [2.1, 2.4, 2.7], ph: P },
      ];
      for (const l of L) legPair(b, iC, l.sx, l.sy, l.a, [0.8, 1.2, 1.0], 0.12, "Leg", { split: lg, phase: l.ph });
      b.core(cef, iC, [iA]);
      b.armor(abd, iA, { name: "Abdomen Plate", layers: pl, edges: ed });
      b.armor(cef, iC, { name: "Carapace Plate", layers: 1, edges: ed });
      mandibles(b, iC, 1.35, 0.15, [1.4, 0.05, 1.85, 0.34, 2.4, 0.3, 2.15, 0.12, 1.9, 0.04], "Fang", 1.1);
      for (const side of [1, -1]) {
        const e = ell(1.15, 0.22, 0.14, 0.14, 6);
        b.add("armor", "Eye Cluster", side > 0 ? e : mirror(e), { layer: 3.5, links: [iC], style: 2, hpM: 0.6 });
      }
      if (t >= 1) b.add("spike", "Spinneret", [-1.85, -0.2, -2.6, 0, -1.85, 0.2], { layer: 2, links: [iA] });
      if (t >= 2) b.spikes(abd, iA, { every: 2, len: 0.2 });
      return [{ sec: abd, host: iA }, { sec: cef, host: iC, core: true }];
    },
  },

  /* 3 ─ LUNA MOTH */
  {
    id: "moth", hp: 20, dmg: 20, name: "Luna Moth", hue: 236, flying: true, speed: 130, turn: 2.6, ranged: true, keep: 380, muzzle: 1.4,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "shoot", name: "Shot Burst", minTier: 0, wind: 0.4, dmg: 2, n: 5, spread: 1.2, speed: 600, life: 1.2, size: 5, kind: "bolt", maxS: 2, maxP: 800 },
      { type: "beam", name: "Rotating Lasers", minTier: 3, wind: 0.6, dmg: 1, beams: 4, beamSpin: 1.5, dur: 4, maxS: 4, maxP: 200 },
      { type: "shoot", name: "Missiles", minTier: 4, wind: 0.6, dmg: 3, n: 20, spread: 0.3, speed: 480, life: 3, size: 9, homing: 2.5, kind: "missile", maxS: 2, maxP: 900 },
      { type: "domain", name: "Domain", minTier: 5, wind: 1.0, dmg: 0.1, dur: 180, maxS: 5, maxP: 200 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const tho: Sec = { cx: 0.35, cy: 0, rx: 0.65, ry: 0.6, n: 8 };
      const abd: Sec = { cx: -0.85, cy: 0, rx: 0.85, ry: 0.5, n: 8 };
      const hd: Sec = { cx: 1.2, cy: 0, rx: 0.38, ry: 0.42, n: 6 };
      const iA = b.sec("Abdomen", abd, { hpM: 1.2 });
      const iT = b.sec("Thorax", tho, { hpM: 1.3 });
      const iH = b.sec("Head", hd);
      b.link(iA, iT); b.link(iT, iH);
      for (const side of [1, -1]) {
        const fore = [0.3, 0.3, 1.0, 0.5, 0.85, 2.0, -0.3, 2.5, -1.3, 1.6, -0.9, 0.4];
        const hind = [-0.3, 0.3, -0.2, 1.2, -1.2, 1.9, -2.1, 1.3, -1.6, 0.3];
        wingPart(b, iT, 0.1, 0.3, side, hind, "Hindwing", 0.14, 1);
        const fw = wingPart(b, iT, 0.2, 0.3, side, fore, "Forewing", 0.18, 0, 1.2);
        if (t >= 1) wingSub(b, fw, iT, 0, 0, side, -0.15, 1.4, 0.3, 0.3, 0, "Eyespot", 2);
        for (let k = 0; k < Math.min(t, 4); k++) wingSub(b, fw, iT, 0, 0, side, 0.55 - 0.45 * k, 0.95 + 0.4 * k, 0.28, 0.2, 0.6, "Wing Scale Plate", 1);
      }
      legPair(b, iT, 0.8, 0.3, [1.2, 0.8], [0.45, 0.5], 0.06, "Leg");
      legPair(b, iT, 0.4, 0.35, [1.6, 1.4], [0.45, 0.5], 0.06, "Leg", { phase: P });
      legPair(b, iT, 0.0, 0.35, [2.0, 2.2], [0.45, 0.5], 0.06, "Leg");
      b.core(tho, iT, [iA, iH]);
      b.armor(abd, iA, { name: "Abdomen Plate", layers: pl, edges: ed });
      b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: ed });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 3 });
      antennae(b, iH, 1.45, 0.2, [0.8, 0.5], [0.55, 0.55], 0.06);
      if (t >= 2) b.spikes(abd, iA, { every: 2, len: 0.2 });
      return [{ sec: abd, host: iA }, { sec: tho, host: iT, core: true }];
    },
  },

  /* 4 ─ MANTIS */
  {
    id: "mantis", hp: 31, dmg: 29, name: "Mantis", hue: 92, flying: false, speed: 120, turn: 3.0, ranged: false, keep: 0, muzzle: 2.0,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "swing", name: "Scythe Strike", minTier: 0, cd: 2.2, wind: 0.5, dmg: 2.4, maxS: 3.2, role: "arm", needs: "Raptor Blade" },
      { type: "charge", name: "Lunge", minTier: 1, cd: 6, wind: 0.5, dmg: 2, speed: 820, dur: 0.35, minP: 150, maxP: 600 },
      { type: "shoot", name: "Blade Wave", minTier: 2, cd: 5, wind: 0.5, dmg: 1.5, n: 1, ns: 0.4, spread: 0.3, speed: 520, life: 1.5, size: 14, pierce: true, kind: "wave", minP: 150, maxP: 800 },
      { type: "nova", name: "Whirling Blades", minTier: 4, cd: 10, wind: 0.8, dmg: 1, n: 10, ns: 1, speed: 380, life: 1.6, size: 9, kind: "wave", maxP: 600 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0) + (t >= 5 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const abd: Sec = { cx: -1.4, cy: 0, rx: 1.2, ry: 0.5, n: 8 };
      const tho: Sec = { cx: 0.35, cy: 0, rx: 1.15, ry: 0.44, n: 8 };
      const hd: Sec = { cx: 1.8, cy: 0, rx: 0.4, ry: 0.52, n: 6 };
      const iA = b.sec("Abdomen", abd, { hpM: 1.2 });
      const iT = b.sec("Thorax", tho, { hpM: 1.4 });
      const iH = b.sec("Head", hd);
      b.link(iA, iT); b.link(iT, iH);
      legPair(b, iT, 0.1, 0.3, [1.65, 1.95], [0.85, 1.0], 0.1, "Leg", { split: lg });
      legPair(b, iT, -0.5, 0.3, [1.8, 2.3], [0.85, 1.0], 0.1, "Leg", { split: lg, phase: P });
      legPair(b, iA, -1.3, 0.3, [2.0, 2.6], [0.85, 1.0], 0.1, "Leg", { split: lg });
      b.core(tho, iT, [iA, iH]);
      b.armor(abd, iA, { name: "Abdomen Plate", layers: pl, edges: ed });
      b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: ed });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 3 });
      for (const side of [1, -1]) {
        const wc = ell(-1.5, 0.21, 1.35, 0.3, 8);
        b.add("armor", "Wing Case", side > 0 ? wc : mirror(wc), { layer: 3, links: [iA], style: 1 });
        // raptorial arms
        const gi = b.group(1.0, 0.35 * side, "arm", side, 0.05, 0);
        const up = taper(1.0, 0.3, 1.95, 0.88, 0.22, 0.17);
        const upId = b.add("arm", "Raptor Arm", side > 0 ? up : mirror(up), { layer: 2, g: gi, links: [iT] });
        const blade = saw(1.95, 0.88, 3.15, 0.5, 0.18, 0.1, 3 + Math.floor(t / 2), 0.17, -1);
        b.add("arm", "Raptor Blade", side > 0 ? blade : mirror(blade), { layer: 2.1, g: gi, links: [upId], hpM: 1.2 });
        if (t >= 2) {
          const guard = taper(1.2, 0.42, 1.8, 0.8, 0.12, 0.1);
          b.add("armor", "Arm Guard", side > 0 ? guard : mirror(guard), { layer: 2.5, g: gi, links: [upId], style: 1 });
        }
        if (t >= 4) {
          const guard2 = taper(2.1, 0.86, 2.8, 0.62, 0.08, 0.06);
          b.add("armor", "Blade Guard", side > 0 ? guard2 : mirror(guard2), { layer: 2.6, g: gi, links: [upId], style: 2 });
        }
      }
      antennae(b, iH, 2.0, 0.22, [0.8, 0.3], [0.7, 0.7], 0.04);
      if (t >= 2) b.spikes(abd, iA, { every: 2, len: 0.2 });
      return [{ sec: abd, host: iA }, { sec: tho, host: iT, core: true }];
    },
  },

  /* 5 ─ CENTIPEDE */
  {
    id: "centipede", hp: 20, dmg: 35, name: "Centipede", hue: 335, flying: false, speed: 170, turn: 2.8, ranged: false, keep: 0, muzzle: 3.0,
    armed: { gun: false, missile: false, shield: false }, pack: [1, 1, 1, 1, 1, 1],
    bodyWave: { amp: 0.22, k: 0.8, speed: 6 },
    abilities: [
      { type: "swing", name: "Forcipule Bite", minTier: 0, cd: 2, wind: 0.4, dmg: 1.8, maxS: 3.6, role: "mandible", needs: "Forcipule" },
      { type: "charge", name: "Rush", minTier: 0, cd: 5, wind: 0.4, dmg: 1.5, speed: 540, dur: 0.9, minP: 220, maxP: 900 },
      { type: "shoot", name: "Venom Spray", minTier: 1, cd: 5, wind: 0.4, dmg: 0.5, n: 5, ns: 0.8, spread: 0.9, speed: 500, life: 0.9, size: 6, poison: 0.15, kind: "bolt", maxP: 520 },
      { type: "nova", name: "Venom Ring", minTier: 3, cd: 10, wind: 0.8, dmg: 0.6, n: 14, ns: 2, speed: 380, life: 1.5, size: 7, poison: 0.15, kind: "bolt", maxP: 600 },
    ],
    build(b, t) {
      const N = 12 + 3 * t;
      const L = 9 + 0.8 * t;
      const sp = L / N;
      const c = Math.floor(N / 2);
      const ids: number[] = [];
      const secs: Sec[] = [];
      for (let i = 0; i < N; i++) {
        const last = i === N - 1;
        const cx = -L / 2 + sp * (i + 0.5);
        const ry = 0.36 + 0.14 * (i / (N - 1));
        const s: Sec = last ? { cx: cx + sp * 0.15, cy: 0, rx: Math.max(0.34, sp * 0.95), ry: 0.5, n: 8 } : { cx, cy: 0, rx: sp * 1.18, ry, n: 6 };
        secs.push(s);
        ids.push(b.sec(last ? "Head" : "Body Segment", s, { style: i % 2, hpM: last ? 1.2 : 1, seg: i }));
        if (i > 0) b.link(ids[i - 1], ids[i]);
      }
      for (let i = 0; i < N - 1; i++) {
        const dl = Math.min(2, 1 + (t >= 3 ? 1 : 0));
        legPair(b, ids[i], secs[i].cx, 0.22, [1.25, 1.75], [0.42, 0.46], 0.055, "Leg", { split: dl, phase: i * 0.7, amp: 0.4, seg: i });
      }
      b.core(secs[c], ids[c], [ids[c - 1], ids[c + 1]], c);
      for (let i = 0; i < N; i++) {
        if (i === c) { b.armor(secs[i], ids[i], { name: "Tergite", layers: 1, edges: 3, seg: i }); continue; }
        b.armor(secs[i], ids[i], { name: i === N - 1 ? "Cranial Plate" : "Tergite", layers: t >= 3 ? 2 : 1, edges: 3, style: i % 2, seg: i });
      }
      const hs = secs[N - 1];
      mandibles(b, ids[N - 1], hs.cx + hs.rx * 0.8, 0.2, [hs.cx + hs.rx * 0.7, 0.05, hs.cx + hs.rx * 1.1, 0.34, hs.cx + hs.rx * 1.6, 0.28, hs.cx + hs.rx * 1.35, 0.1, hs.cx + hs.rx * 1.0, 0.03], "Forcipule", 1.2, N - 1);
      antennae(b, ids[N - 1], hs.cx + hs.rx * 0.6, 0.3, [0.8, 0.4], [0.6, 0.6], 0.04, N - 1);
      return [];
    },
  },

  /* 6 ─ HORNET */
  {
    id: "wasp", hp: 20, dmg: 37, gunType: "minigun", name: "Hornet", hue: 52, flying: true, speed: 190, turn: 3.6, ranged: false, keep: 0, muzzle: 1.8,
    armed: { gun: true, missile: true, shield: false }, pack: [2, 2, 1, 1, 1, 1],
    abilities: [
      { type: "swing", name: "Mandible Snap", minTier: 0, cd: 2, wind: 0.35, dmg: 1.2, maxS: 2.2, role: "mandible", needs: "Mandible" },
      { type: "charge", name: "Hornet Dive", minTier: 0, cd: 5, wind: 0.5, dmg: 1.6, speed: 900, dur: 0.45, poison: 0.25, minP: 150, maxP: 800 },
      { type: "shoot", name: "Stinger Volley", minTier: 1, cd: 4, wind: 0.35, dmg: 0.7, n: 3, ns: 0.5, spread: 0.35, speed: 620, life: 1.3, size: 5, poison: 0.2, kind: "bolt", minP: 150, maxP: 750 },
      { type: "nova", name: "Stinger Burst", minTier: 3, cd: 10, wind: 0.8, dmg: 0.6, n: 12, ns: 1.5, speed: 440, life: 1.4, size: 5, kind: "bolt", maxP: 600 },
    ],
    build(b, t) {
      const lg = 1 + (t >= 3 ? 1 : 0);
      const abd: Sec = { cx: -1.45, cy: 0, rx: 1.25, ry: 0.66, n: 8 };
      const tho: Sec = { cx: 0.2, cy: 0, rx: 0.65, ry: 0.6, n: 8 };
      const hd: Sec = { cx: 1.1, cy: 0, rx: 0.45, ry: 0.52, n: 8 };
      const iA = b.sec("Abdomen", abd, { hpM: 1.4 });
      const iT = b.sec("Thorax", tho, { hpM: 1.3 });
      const iH = b.sec("Head", hd);
      b.link(iA, iT); b.link(iT, iH);
      legPair(b, iT, 0.55, 0.3, [1.1, 0.7], [0.5, 0.6], 0.07, "Leg", { split: lg });
      legPair(b, iT, 0.2, 0.4, [1.6, 1.5], [0.5, 0.6], 0.07, "Leg", { split: lg, phase: P });
      legPair(b, iT, -0.2, 0.4, [2.0, 2.3], [0.5, 0.6], 0.07, "Leg", { split: lg });
      b.core(tho, iT, [iA, iH]);
      b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: t >= 3 ? 1 : 2 });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 4 });
      // abdomen stripes
      const stripes = Math.min(8, 3 + t);
      const x0 = -2.7, x1 = -0.2;
      for (let i = 0; i < stripes; i++) {
        const xa = x0 + ((x1 - x0) * i) / stripes, xb = x0 + ((x1 - x0) * (i + 1)) / stripes;
        const top: number[] = [], bot: number[] = [];
        for (let k = 0; k <= 3; k++) {
          const x = xa + ((xb - xa) * k) / 3;
          const u = (x - abd.cx) / abd.rx;
          const hy = abd.ry * 0.98 * Math.sqrt(Math.max(0.02, 1 - u * u));
          top.push(x, hy);
          bot.unshift(x, -hy);
        }
        b.add("armor", "Abdomen Band", [...top, ...bot], { layer: 4, links: [iA], style: i % 2 ? 1 : 2, hpM: 1.1 });
      }
      b.add("spike", "Stinger", [-2.55, -0.2, -3.55, 0, -2.55, 0.2], { layer: 2, links: [iA], hpM: 1.2 });
      for (const side of [1, -1]) {
        const eye = ell(1.2, 0.34, 0.2, 0.2, 6);
        b.add("armor", "Compound Eye", side > 0 ? eye : mirror(eye), { layer: 3, links: [iH], style: 2, hpM: 0.8 });
        const fw = wingPart(b, iT, 0.25, 0.4, side, ell(0.25 + Math.cos(1.9) * 1.3, 0.4 + Math.sin(1.9) * 1.3, 1.5, 0.5, 8, 1.9), "Forewing", 0.25, side > 0 ? 0 : P);
        wingPart(b, iT, -0.05, 0.4, side, ell(-0.05 + Math.cos(2.4) * 0.9, 0.4 + Math.sin(2.4) * 0.9, 1.0, 0.35, 8, 2.4), "Hindwing", 0.25, side > 0 ? 1 : 1 + P);
        if (t >= 2) wingSub(b, fw, iT, 0, 0, side, 0.25 + Math.cos(1.9) * 1.6, 0.4 + Math.sin(1.9) * 1.6, 0.55, 0.28, 1.9, "Wing Plate", 1);
      }
      mandibles(b, iH, 1.4, 0.15, [1.35, 0.06, 1.65, 0.3, 2.05, 0.28, 1.85, 0.1, 1.6, 0.03], "Mandible");
      antennae(b, iH, 1.4, 0.25, [0.9, 0.4], [0.5, 0.5], 0.04);
      if (t >= 3) b.spikes(abd, iA, { every: 2, len: 0.15 });
      return [{ sec: abd, host: iA }, { sec: tho, host: iT, core: true }];
    },
  },

  /* 7 ─ SCARAB BEETLE */
  {
    id: "beetle", hp: 36, dmg: 20, gunType: "scatter", name: "Scarab", hue: 140, flying: false, speed: 110, turn: 2.8, ranged: false, keep: 0, muzzle: 2.8,
    armed: { gun: true, missile: true, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "swing", name: "Mandible Crush", minTier: 0, cd: 2.4, wind: 0.45, dmg: 1.8, maxS: 2.7, role: "mandible", needs: "Mandible" },
      { type: "charge", name: "Ram", minTier: 0, cd: 7, wind: 0.8, dmg: 2.6, speed: 560, dur: 0.6, minP: 200, maxP: 750 },
      { type: "ring", name: "Quake Stomp", minTier: 2, cd: 9, wind: 0.9, dmg: 1.6, size: 6, speed: 420, maxS: 3.8 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0) + (t >= 5 ? 1 : 0), lg = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const abd: Sec = { cx: -0.8, cy: 0, rx: 1.35, ry: 1.1, n: 10 };
      const tho: Sec = { cx: 0.7, cy: 0, rx: 0.8, ry: 0.82, n: 8 };
      const hd: Sec = { cx: 1.6, cy: 0, rx: 0.55, ry: 0.6, n: 6 };
      const iA = b.sec("Abdomen", abd, { hpM: 1.5 });
      const iT = b.sec("Thorax", tho, { hpM: 1.3 });
      const iH = b.sec("Head", hd);
      b.link(iA, iT); b.link(iT, iH);
      legPair(b, iT, 1.0, 0.45, [1.1, 0.6], [0.9, 1.0], 0.17, "Leg", { split: lg });
      legPair(b, iT, 0.35, 0.6, [1.5, 1.45], [0.95, 1.05], 0.17, "Leg", { split: lg, phase: P });
      legPair(b, iA, -0.55, 0.75, [1.95, 2.3], [1.0, 1.1], 0.17, "Leg", { split: lg });
      b.core(tho, iT, [iA, iH]);
      b.armor(abd, iA, { name: "Elytron Plate", layers: pl, edges: ed });
      b.armor(tho, iT, { name: "Pronotum Plate", layers: 1, edges: ed });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 3 });
      mandibles(b, iH, 1.85, 0.22, [1.78, 0.1, 2.05, 0.42, 2.5, 0.58, 2.95, 0.4, 2.62, 0.3, 2.28, 0.28, 2.05, 0.1], "Mandible", 1.2);
      if (t >= 2) b.add("spike", "Horn", [1.9, -0.14, 2.8, 0, 1.9, 0.14], { layer: 3, links: [iH], hpM: 1.5 });
      if (t >= 2) b.spikes(abd, iA, { every: 2, len: 0.2 });
      if (t >= 4) b.spikes(tho, iT, { every: 2, len: 0.2 });
      return [{ sec: abd, host: iA }, { sec: tho, host: iT, core: true }, { sec: hd, host: iH }];
    },
  },

  /* 8 ─ SOLDIER ANT */
  {
    id: "ant", hp: 27, dmg: 25, gunType: "minigun", name: "Soldier Ant", hue: 28, flying: false, speed: 150, turn: 3.4, ranged: false, keep: 0, muzzle: 3.0,
    armed: { gun: true, missile: false, shield: false }, pack: [4, 3, 2, 1, 1, 1],
    abilities: [
      { type: "swing", name: "Mandible Crush", minTier: 0, cd: 2, wind: 0.4, dmg: 1.6, maxS: 3.1, role: "mandible", needs: "Mandible" },
      { type: "spit", name: "Formic Acid", minTier: 0, cd: 5, wind: 0.45, dmg: 0.7, speed: 500, size: 1.3, minP: 150, maxP: 750 },
      { type: "cloud", name: "Formic Haze", minTier: 2, cd: 9, wind: 0.6, dmg: 0.5, size: 3.2, slow: 0.6, maxS: 3.2 },
      { type: "nova", name: "Acid Burst", minTier: 4, cd: 10, wind: 0.8, dmg: 0.7, n: 12, ns: 1.5, speed: 380, life: 1.5, size: 8, kind: "bolt", maxP: 600 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), lg = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const gas: Sec = { cx: -1.15, cy: 0, rx: 1.0, ry: 0.82, n: 10 };
      const pet: Sec = { cx: -0.2, cy: 0, rx: 0.3, ry: 0.28, n: 6 };
      const tho: Sec = { cx: 0.55, cy: 0, rx: 0.65, ry: 0.5, n: 8 };
      const hd: Sec = { cx: 1.55, cy: 0, rx: 0.58, ry: 0.52, n: 8 };
      const iG = b.sec("Gaster", gas, { hpM: 1.4 });
      const iP = b.sec("Petiole", pet, { hpM: 0.8, layer: 1.1 });
      const iT = b.sec("Thorax", tho, { hpM: 1.3 });
      const iH = b.sec("Head", hd);
      b.link(iG, iP); b.link(iP, iT); b.link(iT, iH);
      legPair(b, iT, 0.95, 0.3, [1.1, 0.7], [1.0, 1.2], 0.08, "Leg", { split: lg });
      legPair(b, iT, 0.55, 0.35, [1.6, 1.5], [1.0, 1.2], 0.08, "Leg", { split: lg, phase: P });
      legPair(b, iT, 0.15, 0.35, [2.0, 2.4], [1.0, 1.2], 0.08, "Leg", { split: lg });
      b.core(tho, iT, [iP, iH]);
      b.armor(gas, iG, { name: "Gaster Plate", layers: pl, edges: ed });
      b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: ed });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 4 });
      for (const side of [1, -1]) {
        const gi = b.group(2.0, 0.28 * side, "mandible", side, 0.1, 0);
        const m = saw(2.0, 0.3, 3.05, 0.12, 0.14, 0.07, 3, 0.15, -1);
        b.add("arm", "Mandible", side > 0 ? m : mirror(m), { layer: 2, g: gi, links: [iH], hpM: 1.2 });
      }
      antennae(b, iH, 1.9, 0.3, [1.0, 0.2], [0.8, 0.8], 0.04);
      if (t >= 2) b.spikes(gas, iG, { every: 2, len: 0.18 });
      return [{ sec: gas, host: iG }, { sec: tho, host: iT, core: true }];
    },
  },

  /* 9 ─ FIREFLY */
  {
    id: "firefly", hp: 24, dmg: 21, gunType: "laser", name: "Firefly", hue: 305, flying: true, speed: 125, turn: 2.8, ranged: true, keep: 340, muzzle: 1.7,
    armed: { gun: true, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "shoot", name: "Glow Orb", minTier: 0, cd: 3, wind: 0.4, dmg: 0.8, n: 1, ns: 0.4, spread: 0.5, speed: 300, life: 4.5, size: 9, homing: 1.2, slow: 0.8, slowT: 1, kind: "orb", maxP: 850 },
      { type: "ring", name: "Flash Pulse", minTier: 1, cd: 8, wind: 0.8, dmg: 1.4, size: 5, speed: 480, maxS: 4 },
      { type: "charge", name: "Flash Dive", minTier: 2, cd: 7, wind: 0.6, dmg: 1.6, speed: 780, dur: 0.5, minP: 200, maxP: 700 },
      { type: "nova", name: "Firework", minTier: 3, cd: 10, wind: 0.8, dmg: 0.7, n: 14, ns: 2, speed: 360, life: 1.8, size: 8, homing: 0.4, kind: "orb", maxP: 600 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      const el: Sec = { cx: -0.35, cy: 0, rx: 1.15, ry: 0.68, n: 8 };
      const lan: Sec = { cx: -1.75, cy: 0, rx: 0.58, ry: 0.5, n: 6 };
      const pro: Sec = { cx: 0.8, cy: 0, rx: 0.6, ry: 0.62, n: 8 };
      const hd: Sec = { cx: 1.5, cy: 0, rx: 0.36, ry: 0.42, n: 6 };
      const iE = b.sec("Elytra Body", el, { hpM: 1.4 });
      const iL = b.sec("Lantern", lan, { style: 3, hpM: 1.2, layer: 1.2 });
      const iP = b.sec("Pronotum", pro, { hpM: 1.2 });
      const iH = b.sec("Head", hd);
      b.link(iE, iL); b.link(iE, iP); b.link(iP, iH);
      for (const side of [1, -1]) {
        wingPart(b, iE, -0.5, 0.5, side, ell(-0.5 + Math.cos(2.3) * 1.2, 0.5 + Math.sin(2.3) * 1.2, 1.35, 0.36, 8, 2.3), "Hindwing", 0.22, side > 0 ? 0 : P);
      }
      legPair(b, iP, 0.9, 0.3, [1.1, 0.7], [0.5, 0.6], 0.07, "Leg", { split: lg });
      legPair(b, iE, 0.2, 0.5, [1.6, 1.5], [0.5, 0.6], 0.07, "Leg", { split: lg, phase: P });
      legPair(b, iE, -0.6, 0.55, [2.0, 2.3], [0.5, 0.6], 0.07, "Leg", { split: lg });
      b.core(el, iE, [iL, iP]);
      b.armor(el, iE, { name: "Elytron Plate", layers: 1, edges: ed });
      b.armor(pro, iP, { name: "Pronotum Plate", layers: pl, edges: ed });
      b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 3 });
      if (t >= 1) b.armor(lan, iL, { name: "Lantern Frame", layers: 1, edges: 3, style: 2, hpM: 0.9 });
      antennae(b, iH, 1.7, 0.2, [0.9, 0.4], [0.5, 0.5], 0.04);
      if (t >= 3) b.spikes(pro, iP, { every: 2, len: 0.2 });
      return [{ sec: el, host: iE, core: true }, { sec: pro, host: iP }, { sec: lan, host: iL }];
    },
  },

  /* ================================================================
     EXPANSION BESTIARY
     ================================================================ */

  /* 10 ─ WORKER ANT */
  {
    id: "workerant", hp: 27, dmg: 25, name: "Worker Ant", hue: 22, flying: false, speed: 165, turn: 3.8, ranged: false, keep: 0, muzzle: 2.6,
    armed: { gun: false, missile: false, shield: false }, pack: [4, 4, 3, 2, 1, 1], minZone: 0, maxZone: 2,
    abilities: [
      { type: "swing", name: "Mandible Crush", minTier: 1, cd: 2.1, wind: 0.4, dmg: 1.4, maxS: 2.9, role: "mandible", needs: "Mandible" },
      { type: "summon", name: "Call Swarm", minTier: 2, cd: 15, wind: 0.7, dmg: 0, n: 2, maxS: 2 },
      { type: "cloud", name: "Formic Haze", minTier: 3, cd: 10, wind: 0.6, dmg: 0.4, size: 2.6, slow: 0.6, maxS: 2.8 },
    ],
    build(b, t) {
      const lg = 1 + (t >= 2 ? 1 : 0) + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildAnt(b, t, { gaster: [-1.2, 1.0, 0.8], tho: [0.55, 0.62, 0.48], hd: [1.5, 0.56, 0.5], legSplit: lg, plateLayers: 1 + (t >= 3 ? 1 : 0), edges: ed, mandible: 1, spikes: t >= 2 });
    },
  },

  /* 11 ─ HONEYBEE */
  {
    id: "honeybee", hp: 25, dmg: 35, name: "Honeybee", hue: 44, flying: true, speed: 175, turn: 3.6, ranged: false, keep: 0, muzzle: 1.9,
    armed: { gun: false, missile: false, shield: false }, pack: [3, 3, 2, 1, 1, 1], minZone: 0, maxZone: 2,
    abilities: [
      { type: "spit", name: "Venom Sting", minTier: 1, cd: 4.5, wind: 0.4, dmg: 0.8, speed: 520, size: 1.2, poison: 0.3, maxP: 520 },
      { type: "charge", name: "Sting Dive", minTier: 2, cd: 6, wind: 0.5, dmg: 1.5, speed: 850, dur: 0.4, poison: 0.25, minP: 150, maxP: 750 },
      { type: "nova", name: "Pollen Burst", minTier: 3, cd: 11, wind: 0.8, dmg: 0.5, n: 10, ns: 1.4, speed: 420, life: 1.4, size: 5, poison: 0.18, kind: "bolt", maxP: 600 },
    ],
    build(b, t) {
      const lg = 1 + (t >= 2 ? 1 : 0);
      return buildFlyer(b, t, { abd: [-1.4, 1.15, 0.62], tho: [0.25, 0.62, 0.56], hd: [1.1, 0.44, 0.5], wingPairs: 1, wingLen: 1.35, legs: 3, legSplit: lg, stripes: 4 + t, stinger: true, pincer: true, plates: 1 + (t >= 3 ? 1 : 0) });
    },
  },

  /* 12 ─ GRASSHOPPER */
  {
    id: "grasshopper", hp: 27, dmg: 27, name: "Grasshopper", hue: 104, flying: false, speed: 155, turn: 3.2, ranged: false, keep: 0, muzzle: 2.4,
    armed: { gun: false, missile: false, shield: false }, pack: [2, 2, 2, 1, 1, 1], minZone: 0, maxZone: 2,
    abilities: [
      { type: "charge", name: "Leaping Charge", minTier: 1, cd: 5.5, wind: 0.6, dmg: 1.8, speed: 980, dur: 0.45, minP: 180, maxP: 900 },
      { type: "swing", name: "Kick", minTier: 2, cd: 3.4, wind: 0.35, dmg: 1.5, maxS: 3.1, role: "leg", needs: "Hind Leg" },
      { type: "shoot", name: "Spit Seeds", minTier: 3, cd: 5, wind: 0.4, dmg: 0.5, n: 3, ns: 0.4, spread: 0.4, speed: 480, life: 1.3, size: 5, kind: "bolt", minP: 200, maxP: 800 },
    ],
    build(b, t) {
      const lg = 1 + (t >= 2 ? 1 : 0);
      return buildFlyer(b, t, { abd: [-1.5, 1.35, 0.55], tho: [0.2, 0.72, 0.5], hd: [1.25, 0.42, 0.46], wingPairs: 1, wingLen: 1.2, wingsOut: false, legs: 3, legSplit: lg, hind: 1.9, plates: 1, edges: t >= 3 ? 1 : 2, eyes: true });
    },
  },

  /* 13 ─ COCKROACH */
  {
    id: "cockroach", hp: 27, dmg: 27, name: "Cockroach", hue: 12, flying: false, speed: 190, turn: 3.5, ranged: false, keep: 0, muzzle: 2.4,
    armed: { gun: false, missile: false, shield: false }, pack: [3, 3, 2, 2, 1, 1], minZone: 0, maxZone: 2,
    abilities: [
      { type: "charge", name: "Shell Bash", minTier: 1, cd: 4.5, wind: 0.5, dmg: 1.6, speed: 760, dur: 0.5, minP: 160, maxP: 700 },
      { type: "ring", name: "Wing Flare", minTier: 2, cd: 9, wind: 0.7, dmg: 1, size: 4.5, speed: 460, maxS: 3.4 },
      { type: "spit", name: "Scuttle Acid", minTier: 3, cd: 6, wind: 0.4, dmg: 0.5, speed: 460, size: 1.4, maxP: 700 },
    ],
    build(b, t) {
      const lg = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.9, 1.5, 0.72], tho: [0.7, 0.85, 0.6], hd: [1.6, 0.5, 0.5], legSplit: lg, plateLayers: 2 + (t >= 3 ? 1 : 0), edges: ed, mandible: 0.8, antenna: true });
    },
  },

  /* 14 ─ MOSQUITO */
  {
    id: "mosquito", hp: 20, dmg: 28, name: "Mosquito", hue: 330, flying: true, speed: 220, turn: 4.2, ranged: false, keep: 0, muzzle: 2.2,
    armed: { gun: false, missile: false, shield: false }, pack: [3, 3, 2, 2, 1, 1], minZone: 0, maxZone: 2,
    abilities: [
      { type: "drain", name: "Blood Drain", minTier: 1, cd: 5, wind: 0.5, dmg: 0.55, dur: 1.6, maxS: 2.4, maxP: 380 },
      { type: "charge", name: "Dive", minTier: 2, cd: 6, wind: 0.4, dmg: 1.2, speed: 880, dur: 0.35, poison: 0.3, minP: 150, maxP: 700 },
      { type: "nova", name: "Swarm Bite", minTier: 3, cd: 9, wind: 0.7, dmg: 0.4, n: 8, ns: 1.2, speed: 440, life: 1.3, size: 4, poison: 0.2, kind: "bolt", maxP: 520 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.1, 0.95, 0.42], tho: [0.3, 0.5, 0.42], hd: [1.0, 0.36, 0.36], wingPairs: 1, wingLen: 1.15, wingWidth: 0.24, legs: 3, legSplit: 1 + (t >= 3 ? 1 : 0), stripe: false, proboscis: 0.85, plates: 1, edges: 2, eyes: true });
    },
  },

  /* 15 ─ BOMBARDIER BEETLE */
  {
    id: "bombardier", hp: 37, dmg: 20, gunType: "scatter", name: "Bombardier Beetle", hue: 28, flying: false, speed: 120, turn: 2.9, ranged: true, keep: 300, muzzle: 2.8,
    armed: { gun: true, missile: true, shield: false }, pack: [1, 1, 1, 1, 1, 1], minZone: 1, maxZone: 3,
    abilities: [
      { type: "spit", name: "Chemical Spray", minTier: 1, cd: 5, wind: 0.45, dmg: 0.7, speed: 520, size: 1.7, maxP: 640 },
      { type: "cloud", name: "Acid Puddle", minTier: 2, cd: 9, wind: 0.5, dmg: 0.55, size: 3, slow: 0.7, atPlayer: true, maxP: 720 },
      { type: "shoot", name: "Boiling Jet", minTier: 3, cd: 6, wind: 0.5, dmg: 0.55, n: 4, ns: 0.6, spread: 0.7, speed: 500, life: 1.3, size: 6, poison: 0.2, kind: "bolt", minP: 150, maxP: 720 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.85, 1.3, 1.0], tho: [0.7, 0.82, 0.78], hd: [1.55, 0.52, 0.56], legSplit: 1 + (t >= 2 ? 1 : 0), plateLayers: pl, edges: ed, mandible: 1.1, drumsticks: true });
    },
  },

  /* 16 ─ RHINOCEROS BEETLE */
  {
    id: "rhino", hp: 40, dmg: 20, gunType: "heavy", name: "Rhinoceros Beetle", hue: 210, flying: false, speed: 105, turn: 2.2, ranged: false, keep: 0, muzzle: 2.9,
    armed: { gun: true, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 1, maxZone: 3,
    abilities: [
      { type: "charge", name: "Horn Charge", minTier: 1, cd: 7, wind: 0.9, dmg: 3.2, speed: 620, dur: 0.6, minP: 200, maxP: 800 },
      { type: "swing", name: "Horn Toss", minTier: 2, cd: 3, wind: 0.5, dmg: 2.2, maxS: 3.4, role: "mandible", needs: "Mandible" },
      { type: "ring", name: "Ground Slam", minTier: 3, cd: 10, wind: 0.9, dmg: 2, size: 5.5, speed: 420, maxS: 4 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.75, 1.3, 1.05], tho: [0.72, 0.9, 0.85], hd: [1.65, 0.58, 0.62], legSplit: 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), plateLayers: pl, edges: ed, horn: 1.4 + 0.2 * t, hornFork: true, mandible: 1.2, eyes: true });
    },
  },

  /* 17 ─ YELLOWJACKET */
  {
    id: "yellowjacket", hp: 25, dmg: 38, gunType: "minigun", name: "Yellowjacket", hue: 50, flying: true, speed: 200, turn: 3.9, ranged: true, keep: 300, muzzle: 2.0,
    armed: { gun: true, missile: false, shield: false }, pack: [2, 2, 2, 1, 1, 1], minZone: 1, maxZone: 3,
    abilities: [
      { type: "shoot", name: "Venom Darts", minTier: 1, cd: 4, wind: 0.4, dmg: 0.65, n: 3, ns: 0.5, spread: 0.35, speed: 600, life: 1.4, size: 5, slow: 0.7, slowT: 1.2, poison: 0.2, kind: "bolt", minP: 180, maxP: 800 },
      { type: "swing", name: "Stinger Thrust", minTier: 2, cd: 2.6, wind: 0.35, dmg: 1.8, maxS: 2.6, role: "tail", needs: "Stinger" },
      { type: "charge", name: "Dive Bomb", minTier: 3, cd: 7, wind: 0.5, dmg: 1.8, speed: 900, dur: 0.45, poison: 0.25, minP: 150, maxP: 800 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.55, 1.3, 0.68], tho: [0.15, 0.62, 0.58], hd: [1.05, 0.44, 0.5], wingPairs: 1, wingLen: 1.3, legs: 3, legSplit: 1 + (t >= 3 ? 1 : 0), stripes: 5 + t, stinger: true, plates: 1 + (t >= 3 ? 1 : 0), pincer: true });
    },
  },

  /* 18 ─ LADYBUG */
  {
    id: "ladybug", hp: 25, dmg: 25, name: "Ladybug", hue: 355, flying: true, speed: 135, turn: 3.0, ranged: true, keep: 280, muzzle: 2.0,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 1, maxZone: 3,
    abilities: [
      { type: "cloud", name: "Spore Cloud", minTier: 1, cd: 8, wind: 0.6, dmg: 0.45, size: 2.9, slow: 0.6, maxS: 3.2 },
      { type: "ring", name: "Repel Pulse", minTier: 2, cd: 8, wind: 0.7, dmg: 1.1, size: 5, speed: 440, maxS: 3.6 },
      { type: "nova", name: "Spore Burst", minTier: 3, cd: 10, wind: 0.8, dmg: 0.4, n: 12, ns: 1.5, speed: 360, life: 1.6, size: 6, poison: 0.15, kind: "orb", homing: 0.6, maxP: 620 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 2 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.65, 1.35, 1.05], tho: [0.75, 0.75, 0.75], hd: [1.55, 0.48, 0.5], legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0), round: true, plateLayers: pl, edges: ed, elytra: true, mandible: 0.7, antenna: true });
    },
  },

  /* 19 ─ STAG BEETLE */
  {
    id: "stag", hp: 37, dmg: 23, name: "Stag Beetle", hue: 20, flying: false, speed: 120, turn: 2.6, ranged: false, keep: 0, muzzle: 2.8,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 1, maxZone: 3,
    abilities: [
      { type: "swing", name: "Pincer Grab", minTier: 1, cd: 2.8, wind: 0.5, dmg: 2.4, maxS: 3.2, role: "mandible", needs: "Pincer" },
      { type: "pull", name: "Toss", minTier: 2, cd: 10, wind: 0.6, dmg: 0.7, speed: 780, minP: 220, maxP: 800 },
      { type: "charge", name: "Goring Rush", minTier: 3, cd: 7, wind: 0.7, dmg: 2.6, speed: 700, dur: 0.55, minP: 200, maxP: 800 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-1.1, 1.35, 0.82], tho: [0.6, 0.85, 0.72], hd: [1.55, 0.55, 0.55], legSplit: 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), plateLayers: pl, edges: ed, pincer: 1.5 + 0.15 * t, eyes: true, horn: 0.5 });
    },
  },

  /* 20 ─ CARPENTER ANT */
  {
    id: "carpenter", hp: 28, dmg: 22, name: "Carpenter Ant", hue: 16, flying: false, speed: 135, turn: 3.0, ranged: false, keep: 0, muzzle: 2.8,
    armed: { gun: true, missile: false, shield: true }, pack: [2, 2, 2, 1, 1, 1], minZone: 2, maxZone: 4,
    abilities: [
      { type: "swing", name: "Crushing Bite", minTier: 1, cd: 2.2, wind: 0.45, dmg: 2.2, maxS: 3, role: "mandible", needs: "Mandible" },
      { type: "ring", name: "Quake Stomp", minTier: 2, cd: 9, wind: 0.8, dmg: 1.6, size: 5, speed: 440, maxS: 3.6 },
      { type: "summon", name: "Call Colony", minTier: 3, cd: 16, wind: 0.8, dmg: 0, n: 3, maxS: 2.5 },
    ],
    build(b, t) {
      const lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildAnt(b, t, { gaster: [-1.3, 1.05, 0.85], tho: [0.55, 0.7, 0.55], hd: [1.55, 0.62, 0.56], legSplit: lg, plateLayers: 2 + (t >= 4 ? 1 : 0), edges: ed, mandible: 1.5, spikes: t >= 2 });
    },
  },

  /* 21 ─ CICADA */
  {
    id: "cicada", hp: 25, dmg: 20, name: "Cicada", hue: 168, flying: true, speed: 140, turn: 3.0, ranged: true, keep: 340, muzzle: 1.8,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 2, maxZone: 4,
    abilities: [
      { type: "ring", name: "Sonic Screech", minTier: 1, cd: 8, wind: 0.75, dmg: 1.4, size: 6, speed: 520, maxS: 4.2 },
      { type: "nova", name: "Resonance", minTier: 2, cd: 10, wind: 0.8, dmg: 0.6, n: 14, ns: 1.6, speed: 380, life: 1.5, size: 7, kind: "wave", maxP: 600 },
      { type: "cloud", name: "Chorus Field", minTier: 3, cd: 11, wind: 0.7, dmg: 0.5, size: 3.4, slow: 0.7, atPlayer: true, maxP: 800 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.25, 1.15, 0.55], tho: [0.25, 0.7, 0.55], hd: [1.2, 0.55, 0.55], wingPairs: 1, wingLen: 1.6, wingWidth: 0.34, legs: 3, legSplit: 1 + (t >= 3 ? 1 : 0), plates: 1 + (t >= 2 ? 1 : 0), edges: t >= 3 ? 1 : 2, eyes: true });
    },
  },

  /* 22 ─ ASSASSIN BUG */
  {
    id: "assassin", hp: 23, dmg: 47, name: "Assassin Bug", hue: 340, flying: false, speed: 185, turn: 3.4, ranged: false, keep: 0, muzzle: 2.6,
    armed: { gun: false, missile: false, shield: false }, pack: [1, 1, 1, 1, 1, 1], minZone: 2, maxZone: 4,
    abilities: [
      { type: "drain", name: "Piercing Proboscis", minTier: 1, cd: 5, wind: 0.45, dmg: 0.7, dur: 1.8, maxS: 2.6, maxP: 460 },
      { type: "swing", name: "Fang Slash", minTier: 2, cd: 2.4, wind: 0.4, dmg: 2, maxS: 2.8, role: "mandible", needs: "Proboscis" },
      { type: "charge", name: "Ambush Lunge", minTier: 3, cd: 6, wind: 0.5, dmg: 2.2, speed: 900, dur: 0.4, minP: 180, maxP: 700 },
    ],
    build(b, t) {
      const ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.95, 0.95, 0.55], tho: [0.55, 0.55, 0.45], hd: [1.45, 0.4, 0.38], legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0), plateLayers: 1 + (t >= 3 ? 1 : 0), edges: ed, snout: 1.1, mandible: 0.6, slim: true, eyes: true });
    },
  },

  /* 23 ─ TIGER BEETLE */
  {
    id: "tiger", hp: 34, dmg: 25, name: "Tiger Beetle", hue: 86, flying: false, speed: 230, turn: 4.0, ranged: false, keep: 0, muzzle: 2.7,
    armed: { gun: false, missile: true, shield: false }, pack: [1, 1, 1, 1, 1, 1], minZone: 2, maxZone: 4,
    abilities: [
      { type: "charge", name: "Dash", minTier: 1, cd: 3.5, wind: 0.3, dmg: 1.4, speed: 1000, dur: 0.32, minP: 200, maxP: 900 },
      { type: "charge", name: "Second Dash", minTier: 2, cd: 4, wind: 0.3, dmg: 1.5, speed: 1000, dur: 0.32, minP: 200, maxP: 900 },
      { type: "swing", name: "Sickle Jaws", minTier: 3, cd: 2.2, wind: 0.35, dmg: 2.1, maxS: 2.8, role: "mandible", needs: "Mandible" },
    ],
    build(b, t) {
      const ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.95, 1.15, 0.68], tho: [0.65, 0.72, 0.62], hd: [1.55, 0.55, 0.5], legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), plateLayers: 1 + (t >= 3 ? 1 : 0), edges: ed, mandible: 1.3, slim: true, eyes: true, spikes: t >= 3 });
    },
  },

  /* 24 ─ MOLE CRICKET */
  {
    id: "molecricket", hp: 25, dmg: 28, name: "Mole Cricket", hue: 34, flying: false, speed: 130, turn: 3.0, ranged: false, keep: 0, muzzle: 2.8,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 2, maxZone: 4,
    abilities: [
      { type: "blink", name: "Burrow Ambush", minTier: 1, cd: 8, wind: 0.6, dmg: 1.2, maxP: 700 },
      { type: "swing", name: "Digger Claws", minTier: 2, cd: 2.6, wind: 0.45, dmg: 2, maxS: 3, role: "leg", needs: "Hind Leg" },
      { type: "ring", name: "Earth Shock", minTier: 3, cd: 10, wind: 0.9, dmg: 1.8, size: 6, speed: 420, maxS: 4 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.35, 1.3, 0.78], tho: [0.2, 0.78, 0.62], hd: [1.3, 0.52, 0.5], wingPairs: 0, legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0), hind: 2.1, plates: 2, edges: t >= 3 ? 1 : 2, eyes: false });
    },
  },

  /* 25 ─ KATYDID */
  {
    id: "katydid", hp: 25, dmg: 25, name: "Katydid", hue: 118, flying: true, speed: 165, turn: 3.3, ranged: true, keep: 320, muzzle: 2.2,
    armed: { gun: false, missile: false, shield: false }, pack: [1, 1, 1, 1, 1, 1], minZone: 2, maxZone: 5,
    abilities: [
      { type: "shoot", name: "Leaf Shards", minTier: 1, cd: 4.5, wind: 0.4, dmg: 0.7, n: 3, ns: 0.5, spread: 0.4, speed: 540, life: 1.5, size: 7, pierce: true, kind: "wave", minP: 180, maxP: 800 },
      { type: "blink", name: "Camo Shift", minTier: 2, cd: 9, wind: 0.4, dmg: 0.6, maxP: 600 },
      { type: "nova", name: "Shard Storm", minTier: 3, cd: 10, wind: 0.8, dmg: 0.5, n: 12, ns: 1.4, speed: 460, life: 1.3, size: 7, kind: "wave", maxP: 600 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.5, 1.35, 0.5], tho: [0.2, 0.7, 0.48], hd: [1.22, 0.42, 0.44], wingPairs: 2, wingLen: 1.7, wingWidth: 0.3, legs: 3, legSplit: 1 + (t >= 3 ? 1 : 0), hind: 1.7, plates: 1, edges: 2, eyes: true });
    },
  },

  /* 26 ─ DUNG BEETLE */
  {
    id: "dung", hp: 35, dmg: 20, gunType: "heavy", name: "Dung Beetle", hue: 32, flying: false, speed: 92, turn: 2.0, ranged: false, keep: 0, muzzle: 3.2,
    armed: { gun: true, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 3, maxZone: 5,
    abilities: [
      { type: "charge", name: "Rolling Slam", minTier: 1, cd: 8, wind: 1, dmg: 3.4, speed: 560, dur: 0.7, minP: 220, maxP: 900 },
      { type: "spit", name: "Boulder Toss", minTier: 2, cd: 6, wind: 0.6, dmg: 0.9, speed: 420, size: 2.4, maxP: 800 },
      { type: "ring", name: "Impact Wave", minTier: 3, cd: 11, wind: 1, dmg: 2.4, size: 7, speed: 400, maxS: 4.4 },
    ],
    build(b, t) {
      const pl = 2 + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.9, 1.6, 1.35], tho: [0.75, 1.0, 1.0], hd: [1.85, 0.6, 0.62], legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0) + (t >= 3 ? 1 : 0), plateLayers: pl, edges: ed, horn: 0.8, mandible: 1.4, spikes: true, eyes: true });
    },
  },

  /* 27 ─ ATLAS MOTH */
  {
    id: "atlas", hp: 30, dmg: 30, name: "Atlas Moth", hue: 266, flying: true, speed: 115, turn: 2.4, ranged: true, keep: 420, muzzle: 1.6,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 3, maxZone: 5,
    abilities: [
      { type: "ring", name: "Wind Gust", minTier: 1, cd: 8, wind: 0.8, dmg: 1.3, size: 7, speed: 480, maxS: 4.6 },
      { type: "cloud", name: "Slow Powder", minTier: 2, cd: 10, wind: 0.7, dmg: 0.5, size: 4, slow: 0.8, atPlayer: true, maxP: 900 },
      { type: "pull", name: "Downdraft", minTier: 3, cd: 13, wind: 0.7, dmg: 0.8, speed: 700, minP: 300, maxP: 900 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.35, 1.1, 0.75], tho: [0.25, 0.75, 0.7], hd: [1.25, 0.45, 0.5], wingPairs: 2, wingLen: 2.4, wingWidth: 0.8, legs: 3, legSplit: 1 + (t >= 3 ? 1 : 0), plates: 1 + (t >= 3 ? 1 : 0), edges: 2, eyespots: true, antenna: true });
    },
  },

  /* 28 ─ WEEVIL */
  {
    id: "weevil", hp: 25, dmg: 25, gunType: "heavy", name: "Weevil", hue: 196, flying: false, speed: 110, turn: 2.8, ranged: false, keep: 0, muzzle: 3.4,
    armed: { gun: true, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 3, maxZone: 5,
    abilities: [
      { type: "swing", name: "Drill Strike", minTier: 1, cd: 3, wind: 0.55, dmg: 2.6, maxS: 3.4, role: "mandible", needs: "Snout" },
      { type: "charge", name: "Boring Charge", minTier: 2, cd: 8, wind: 0.8, dmg: 2.8, speed: 640, dur: 0.6, minP: 200, maxP: 800 },
      { type: "ring", name: "Drill Shock", minTier: 3, cd: 10, wind: 0.9, dmg: 1.8, size: 6, speed: 440, maxS: 4 },
    ],
    build(b, t) {
      const pl = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.95, 1.25, 0.95], tho: [0.65, 0.8, 0.78], hd: [1.5, 0.5, 0.5], legs: 3, legSplit: 1 + (t >= 3 ? 1 : 0), plateLayers: pl, edges: ed, snout: 1.6, mandible: 0, horn: 0.4, eyes: true });
    },
  },

  /* 29 ─ LOCUST */
  {
    id: "locust", hp: 16, dmg: 29, gunType: "minigun", name: "Locust", hue: 72, flying: true, speed: 205, turn: 3.4, ranged: false, keep: 0, muzzle: 2.6,
    armed: { gun: true, missile: true, shield: false }, pack: [2, 2, 2, 2, 1, 1], minZone: 3, maxZone: 5,
    abilities: [
      { type: "charge", name: "Swarm Rush", minTier: 1, cd: 5, wind: 0.4, dmg: 1.5, speed: 950, dur: 0.4, minP: 180, maxP: 850 },
      { type: "summon", name: "Summon Swarm", minTier: 2, cd: 14, wind: 0.6, dmg: 0, n: 3, maxS: 2.5 },
      { type: "nova", name: "Wing Storm", minTier: 3, cd: 10, wind: 0.7, dmg: 0.5, n: 14, ns: 1.6, speed: 480, life: 1.4, size: 6, kind: "wave", maxP: 640 },
    ],
    build(b, t) {
      return buildFlyer(b, t, { abd: [-1.5, 1.4, 0.6], tho: [0.2, 0.72, 0.55], hd: [1.25, 0.46, 0.48], wingPairs: 2, wingLen: 1.6, wingWidth: 0.3, legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0), hind: 1.8, stripes: t >= 2 ? 3 : 0, plates: 1, edges: 2, mandible: 1, spikes: t >= 4 });
    },
  },

  /* 30 ─ JEWEL BEETLE */
  {
    id: "jewel", hp: 40, dmg: 25, gunType: "laser", name: "Jewel Beetle", hue: 152, flying: true, speed: 170, turn: 3.2, ranged: true, keep: 360, muzzle: 2.4,
    armed: { gun: true, missile: true, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 4, maxZone: 5,
    reflectShell: true,
    abilities: [
      { type: "shoot", name: "Prismatic Beam", minTier: 1, cd: 5, wind: 0.5, dmg: 1.1, n: 1, ns: 0.3, spread: 0.1, speed: 760, life: 1.5, size: 8, pierce: true, kind: "wave", minP: 200, maxP: 950 },
      { type: "nova", name: "Refraction", minTier: 2, cd: 9, wind: 0.7, dmg: 0.7, n: 16, ns: 1.8, speed: 420, life: 1.7, size: 7, kind: "wave", maxP: 700 },
      { type: "ring", name: "Prism Pulse", minTier: 3, cd: 11, wind: 0.8, dmg: 2, size: 6, speed: 480, maxS: 4 },
    ],
    build(b, t) {
      const pl = 2 + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
      return buildBeetle(b, t, { abd: [-0.8, 1.35, 1.05], tho: [0.72, 0.88, 0.85], hd: [1.65, 0.55, 0.58], legs: 3, legSplit: 1 + (t >= 2 ? 1 : 0), plateLayers: pl, edges: ed, horn: 0.9, hornFork: true, mandible: 1.2, eyes: true, spikes: true, elytra: true, reflective: true });
    },
  },

  /* 31 ─ WORLD SERPENT (boss) */
  {
    id: "serpent", hp: 80, dmg: 100, gunType: "laser", name: "Snake", hue: 285, flying: false, speed: 430, turn: 3.6, ranged: false, keep: 0, muzzle: 3.0,
    armed: { gun: true, missile: true, shield: true }, pack: [1, 1, 1, 1, 1, 1], minZone: 5, maxZone: 5, boss: true,
    bodyWave: { amp: 0.5, k: 0.42, speed: 2.4 },
    abilities: [
      { type: "swing", name: "Tail Sweep", minTier: 1, cd: 4, wind: 0.8, dmg: 4.5, maxS: 5, role: "tail", needs: "Tail Barb" },
      { type: "nova", name: "Venom Ring", minTier: 2, cd: 9, wind: 0.9, dmg: 0.9, n: 20, ns: 2, speed: 460, life: 1.8, size: 9, poison: 0.3, kind: "bolt", maxP: 900 },
      { type: "charge", name: "Serpent Rush", minTier: 3, cd: 10, wind: 1, dmg: 4, speed: 760, dur: 0.9, minP: 400, maxP: 1400 },
      { type: "spit", name: "Venom Glob", minTier: 4, cd: 7, wind: 0.6, dmg: 1.4, speed: 520, size: 3, maxP: 1000 },
    ],
    build(b, t) {
      return buildSnake(b, t, 40 + 5 * t);
    },
  },
];



/* ---------------- body-plan helper builders ---------------- */
interface BeetleOpts {
  abd?: [number, number, number];
  tho?: [number, number, number];
  hd?: [number, number, number];
  legs?: number;
  legSplit?: number;
  plateLayers?: number;
  edges?: number;
  horn?: number;
  hornFork?: boolean;
  pincer?: number;
  mandible?: number;
  spikes?: boolean;
  elytra?: boolean;
  eyes?: boolean;
  snout?: number;
  antenna?: boolean;
  drumsticks?: boolean;
  slim?: boolean;
  round?: boolean;
  reflective?: boolean;
}

function buildBeetle(b: Builder, t: number, o: BeetleOpts = {}): Mount[] {
  const [acx, arx, ary] = o.abd ?? [-0.8, 1.35, 1.1];
  const [tcx, trx, tryv] = o.tho ?? [0.7, 0.8, 0.82];
  const [hcx, hrx, hry] = o.hd ?? [1.6, 0.55, 0.6];
  const abd: Sec = { cx: acx, cy: 0, rx: arx, ry: ary, n: 10 };
  const tho: Sec = { cx: tcx, cy: 0, rx: trx, ry: tryv, n: 8 };
  const hd: Sec = { cx: hcx, cy: 0, rx: hrx, ry: hry, n: 6 };
  const iA = b.sec("Abdomen", abd, { hpM: 1.5 });
  const iT = b.sec("Thorax", tho, { hpM: 1.3 });
  const iH = b.sec("Head", hd);
  b.link(iA, iT); b.link(iT, iH);
  const legs = o.legs ?? 3;
  const split = o.legSplit ?? 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0);
  for (let i = 0; i < legs; i++) {
    const f = legs === 1 ? 0.5 : i / (legs - 1);
    legPair(b, iT, tcx + trx * 0.5 - f * trx * 1.5, o.slim ? 0.4 : 0.52, [1.05 + f * 0.85, 0.95 + f * 1.05], [0.82, 0.92], o.slim ? 0.12 : 0.16, "Leg", { split, phase: i % 2 ? P : 0 });
  }
  b.core(tho, iT, [iA, iH]);
  b.armor(abd, iA, { name: "Elytron Plate", layers: o.plateLayers ?? 1 + (t >= 3 ? 1 : 0), edges: o.edges ?? (t >= 3 ? 1 : 2), style: o.reflective ? 2 : undefined });
  b.armor(tho, iT, { name: "Pronotum Plate", layers: 1, edges: o.edges ?? 2 });
  b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 3 });
  if (o.elytra) {
    for (const side of [1, -1]) {
      const wc = ell(acx + 0.05, ary * 0.5, arx * 0.72, ary * 0.34, 8);
      b.add("armor", "Elytron", side > 0 ? wc : mirror(wc), { layer: 2.8, links: [iA], style: o.reflective ? 3 : 1, hpM: 1.2 });
    }
  }
  if (o.pincer) {
    const s = o.pincer;
    for (const side of [1, -1]) {
      const gi = b.group(hcx + hrx * 0.4, 0.2 * side, "mandible", side, 0.1, 0);
      const m = saw(hcx + hrx * 0.4, 0.22, hcx + hrx * 0.4 + s, 0.06, 0.16, 0.07, 3 + Math.floor(t / 2), 0.15, -1);
      b.add("arm", "Pincer", side > 0 ? m : mirror(m), { layer: 2, g: gi, links: [iH], hpM: 1.4 });
    }
  } else if (o.mandible !== 0) {
    const sc = o.mandible ?? 1;
    const x0 = hcx + hrx * 0.45;
    mandibles(b, iH, x0, 0.18, [x0 - 0.05, 0.05, x0 + 0.35 * sc, 0.3 * sc, x0 + 0.85 * sc, 0.32 * sc, x0 + 0.55 * sc, 0.12, x0 + 0.1, 0.03], "Mandible", 1.1);
  }
  if (o.horn) {
    const x0 = hcx + hrx * 0.35, len = o.horn;
    if (o.hornFork) {
      for (const side of [1, -1]) {
        b.add("spike", "Forked Horn", [x0, 0.07 * side, x0 + len * 0.65, 0.3 * side, x0 + len, 0.14 * side, x0 + len * 0.35, 0], { layer: 3, links: [iH], hpM: 1.7 });
      }
    } else {
      b.add("spike", "Horn", [x0, -0.16, x0 + len, 0, x0, 0.16], { layer: 3, links: [iH], hpM: 1.6 });
    }
  }
  if (o.snout) {
    const x0 = hcx + hrx * 0.7;
    b.add("segment", "Snout", taper(x0, 0, x0 + o.snout, 0, hrx * 0.55, hrx * 0.2), { layer: 2, links: [iH], hpM: 1.3 });
  }
  if (o.eyes !== false) {
    for (const side of [1, -1]) {
      const e = ell(hcx + hrx * 0.35, hry * 0.55, 0.18, 0.16, 6);
      b.add("armor", "Compound Eye", side > 0 ? e : mirror(e), { layer: 3, links: [iH], style: 2, hpM: 0.7 });
    }
  }
  if (o.spikes !== false && t >= 2) b.spikes(abd, iA, { every: 2, len: 0.18 });
  if (o.antenna !== false) antennae(b, iH, hcx + hrx * 0.7, 0.25, o.drumsticks ? [1.0, 0.6, 0.5] : [0.9, 0.4], o.drumsticks ? [0.4, 0.3, 0.25] : [0.5, 0.5], 0.045);
  return [{ sec: abd, host: iA }, { sec: tho, host: iT, core: true }, { sec: hd, host: iH }];
}

interface AntOpts {
  gaster?: [number, number, number];
  petiole?: [number, number, number];
  tho?: [number, number, number];
  hd?: [number, number, number];
  legs?: number;
  legSplit?: number;
  plateLayers?: number;
  edges?: number;
  mandible?: number;
  spikes?: boolean;
}

function buildAnt(b: Builder, t: number, o: AntOpts = {}): Mount[] {
  const [gcx, grx, gry] = o.gaster ?? [-1.15, 1.0, 0.82];
  const [pcx, prx, pry] = o.petiole ?? [-0.2, 0.3, 0.28];
  const [tcx, trx, tryv] = o.tho ?? [0.55, 0.65, 0.5];
  const [hcx, hrx, hry] = o.hd ?? [1.55, 0.58, 0.52];
  const gas: Sec = { cx: gcx, cy: 0, rx: grx, ry: gry, n: 10 };
  const pet: Sec = { cx: pcx, cy: 0, rx: prx, ry: pry, n: 6 };
  const tho: Sec = { cx: tcx, cy: 0, rx: trx, ry: tryv, n: 8 };
  const hd: Sec = { cx: hcx, cy: 0, rx: hrx, ry: hry, n: 8 };
  const iG = b.sec("Gaster", gas, { hpM: 1.4 });
  const iP = b.sec("Petiole", pet, { hpM: 0.8, layer: 1.1 });
  const iT = b.sec("Thorax", tho, { hpM: 1.3 });
  const iH = b.sec("Head", hd);
  b.link(iG, iP); b.link(iP, iT); b.link(iT, iH);
  const legs = o.legs ?? 3;
  const split = o.legSplit ?? 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0);
  for (let i = 0; i < legs; i++) {
    const f = legs === 1 ? 0.5 : i / (legs - 1);
    legPair(b, iT, tcx + trx * 0.7 - f * trx * 1.5, 0.32, [1.1 + f * 0.9, 1.0 + f * 1.2], [0.95, 1.1], 0.09, "Leg", { split, phase: f > 0.4 && f < 0.6 ? P : 0 });
  }
  b.core(tho, iT, [iP, iH]);
  b.armor(gas, iG, { name: "Gaster Plate", layers: o.plateLayers ?? 1 + (t >= 3 ? 1 : 0), edges: o.edges ?? (t >= 3 ? 1 : 2) });
  b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: o.edges ?? 2 });
  b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 4 });
  const sc = o.mandible ?? 1.1;
  for (const side of [1, -1]) {
    const gi = b.group(hcx + hrx * 0.5, hrx * 0.5 * side, "mandible", side, 0.1, 0);
    const m = saw(hcx + hrx * 0.5, hrx * 0.55, hcx + hrx * 0.5 + 1.0 * sc, hrx * 0.2, 0.14, 0.07, 3, 0.15, -1);
    b.add("arm", "Mandible", side > 0 ? m : mirror(m), { layer: 2, g: gi, links: [iH], hpM: 1.3 });
  }
  antennae(b, iH, hcx + hrx * 0.9, hrx * 0.6, [1.0, 0.2], [0.8, 0.8], 0.045);
  if (o.spikes) b.spikes(gas, iG, { every: 2, len: 0.18 });
  return [{ sec: gas, host: iG }, { sec: tho, host: iT, core: true }];
}

interface FlyerOpts {
  abd?: [number, number, number];
  tho?: [number, number, number];
  hd?: [number, number, number];
  wingPairs?: number;
  wingLen?: number;
  wingWidth?: number;
  wingsOut?: boolean;
  legs?: number;
  legSplit?: number;
  stripes?: number;
  stripe?: boolean;
  stinger?: boolean;
  pincer?: boolean;
  plates?: number;
  edges?: number;
  hind?: number;
  eyes?: boolean;
  antenna?: boolean;
  proboscis?: number;
  mandible?: number;
  spikes?: boolean;
  eyespots?: boolean;
}

function buildFlyer(b: Builder, t: number, o: FlyerOpts = {}): Mount[] {
  const [acx, arx, ary] = o.abd ?? [-1.45, 1.25, 0.66];
  const [tcx, trx, tryv] = o.tho ?? [0.2, 0.65, 0.6];
  const [hcx, hrx, hry] = o.hd ?? [1.1, 0.45, 0.52];
  const abd: Sec = { cx: acx, cy: 0, rx: arx, ry: ary, n: 8 };
  const tho: Sec = { cx: tcx, cy: 0, rx: trx, ry: tryv, n: 8 };
  const hd: Sec = { cx: hcx, cy: 0, rx: hrx, ry: hry, n: 8 };
  const iA = b.sec("Abdomen", abd, { hpM: 1.4 });
  const iT = b.sec("Thorax", tho, { hpM: 1.3 });
  const iH = b.sec("Head", hd);
  b.link(iA, iT); b.link(iT, iH);
  const legs = o.legs ?? 3;
  const split = o.legSplit ?? 1 + (t >= 3 ? 1 : 0);
  for (let i = 0; i < legs; i++) {
    const f = legs === 1 ? 0.5 : i / (legs - 1);
    if (o.hind && i === legs - 1) {
      legPair(b, iA, acx + arx * 0.35, 0.45, [1.9, 2.5], [1.0, 1.2 * o.hind], 0.2, "Hind Leg", { split, phase: P, amp: 0.26 });
      continue;
    }
    legPair(b, iT, tcx + trx * 0.6 - f * trx * 1.4, 0.36, [1.1 + f * 0.8, 0.9 + f * 1.2], [0.5, 0.6], 0.07, "Leg", { split, phase: i % 2 ? P : 0 });
  }
  b.core(tho, iT, [iA, iH]);
  b.armor(abd, iA, { name: "Abdomen Plate", layers: o.plates ?? 1, edges: o.edges ?? (t >= 3 ? 1 : 2) });
  b.armor(tho, iT, { name: "Thorax Plate", layers: 1, edges: o.edges ?? 2 });
  b.armor(hd, iH, { name: "Cranial Plate", layers: 1, edges: 4 });
  const stripes = o.stripe === false ? 0 : o.stripes ?? 0;
  if (stripes > 0) {
    for (let i = 0; i < stripes; i++) {
      const xa = acx - arx * 0.92 + ((arx * 1.84) * i) / stripes;
      const xb = acx - arx * 0.92 + ((arx * 1.84) * (i + 1)) / stripes;
      const top: number[] = [], bot: number[] = [];
      for (let k = 0; k <= 3; k++) {
        const x = xa + ((xb - xa) * k) / 3;
        const u = (x - acx) / arx;
        const hy = ary * 0.98 * Math.sqrt(Math.max(0.02, 1 - u * u));
        top.push(x, hy);
        bot.unshift(x, -hy);
      }
      b.add("armor", "Abdomen Band", [...top, ...bot], { layer: 4, links: [iA], style: i % 2 ? 1 : 2, hpM: 1.1 });
    }
  }
  const pairs = o.wingPairs ?? 1;
  if (pairs > 0 && o.wingsOut !== false) {
    for (const side of [1, -1]) {
      for (let k = 0; k < pairs; k++) {
        const ax = tcx + trx * 0.3 - k * trx * 0.5, ay = tryv * 0.55;
        const ang = 1.45 + k * 0.3;
        const len = (o.wingLen ?? 1.6) * (1 - k * 0.18);
        const wid = o.wingWidth ?? 0.33;
        const poly = ell(ax + Math.cos(ang) * len * 0.85, ay + Math.sin(ang) * len * 0.85, len, wid, 8, ang);
        const w = wingPart(b, iT, ax, ay, side, poly, k ? "Hindwing" : "Forewing", 0.2, k * 1.7 + (side > 0 ? 0 : P));
        if (o.eyespots && k === 0 && t >= 1) wingSub(b, w, iT, 0, 0, side, ax + Math.cos(ang) * len * 0.9, ay + Math.sin(ang) * len * 0.9, wid * 0.7, wid * 0.55, ang, "Eyespot", 2);
        if (t >= 3) wingSub(b, w, iT, 0, 0, side, ax + Math.cos(ang) * len * 1.2, ay + Math.sin(ang) * len * 1.2, wid * 0.6, wid * 0.4, ang, "Wing Vein Plate", 1);
      }
    }
  }
  if (o.stinger) {
    b.add("spike", "Stinger", [acx - arx * 0.85, -0.16, acx - arx * 1.7, 0, acx - arx * 0.85, 0.16], { layer: 2, links: [iA], hpM: 1.3 });
  }
  if (o.proboscis) {
    const x0 = hcx + hrx * 0.6;
    b.add("spike", "Proboscis", taper(x0, 0, x0 + o.proboscis, 0, 0.09, 0.03), { layer: 2, links: [iH], hpM: 1 });
  }
  if (o.pincer) mandibles(b, iH, hcx + hrx * 0.5, 0.18, [hcx + hrx * 0.4, 0.05, hcx + hrx * 0.8, 0.28, hcx + hrx * 1.3, 0.24, hcx + hrx * 1.0, 0.1, hcx + hrx * 0.6, 0.03], "Mandible", 1.1);
  if (o.mandible) { const x0 = hcx + hrx * 0.45, sc = o.mandible; mandibles(b, iH, x0, 0.18, [x0 - 0.05, 0.05, x0 + 0.35 * sc, 0.3 * sc, x0 + 0.85 * sc, 0.32 * sc, x0 + 0.55 * sc, 0.12, x0 + 0.1, 0.03], "Mandible", 1.1); }
  if (o.eyes !== false) antennae(b, iH, hcx + hrx * 0.7, 0.2, [0.9, 0.4], [0.5, 0.5], 0.04);
  if (o.spikes || t >= 2) b.spikes(abd, iA, { every: 2, len: 0.16 });
  return [{ sec: abd, host: iA }, { sec: tho, host: iT, core: true }];
}

function buildSnake(b: Builder, t: number, n: number): Mount[] {
  /* The snake is a genuine chain: 40 + 5*t segments (65 at mythical), total
     length L = 7 + 0.3*n body units (~26.5 at tier 5, about 9,100 world px,
     ~5.4x the original boss). Raise the 0.3 to lengthen it.
     Segments overlap so the travelling wave reads as one continuous body. */
  const L = 7 + 0.3 * n;
  const sp = L / n;
  const ids: number[] = [];
  const secs: Sec[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const cx = -L / 2 + sp * (i + 0.5);
    const ry = i === n - 1 ? 0.6 : 0.24 + 0.3 * Math.sin(Math.PI * Math.min(1, f * 1.05));
    const s: Sec = { cx, cy: 0, rx: sp * 1.35, ry, n: i === n - 1 ? 8 : 6 };
    secs.push(s);
    ids.push(b.sec(i === n - 1 ? "Head" : "Body Segment", s, { style: i % 2, hpM: i === n - 1 ? 2.2 : 1.7, seg: i }));
    if (i > 0) b.link(ids[i - 1], ids[i]);
  }
  const c = Math.floor(n * 0.4);
  b.core(secs[c], ids[c], [ids[c - 1], ids[c + 1]], c);
  for (let i = 0; i < n; i++) {
    b.armor(secs[i], ids[i], { name: i === n - 1 ? "Cranial Plate" : i === c ? "Heart Guard" : "Scale Plate", layers: i === c ? 1 : t >= 3 ? 2 : 1, edges: 3, style: i % 2, seg: i });
  }
  for (let i = 2; i < n - 2; i += 3) b.spikes(secs[i], ids[i], { every: 2, len: 0.3, seg: i });
  const h = secs[n - 1], hi = ids[n - 1];
  mandibles(b, hi, h.cx + h.rx * 0.5, 0.3, [h.cx + h.rx * 0.5, 0.1, h.cx + h.rx * 0.95, 0.5, h.cx + h.rx * 1.5, 0.62, h.cx + h.rx * 1.9, 0.28, h.cx + h.rx * 1.2, 0.2], "Fang", 1.9, n - 1);
  for (const side of [1, -1]) {
    const e = ell(h.cx + h.rx * 0.25, 0.5 * side, 0.26, 0.2, 6);
    b.add("armor", "Serpent Eye", side > 0 ? e : mirror(e), { layer: 4, links: [hi], style: 2, hpM: 1, seg: n - 1 });
  }
  const tail = secs[0];
  b.add("spike", "Tail Barb", [tail.cx - tail.rx * 0.9, -0.22, tail.cx - tail.rx * 1.9, 0, tail.cx - tail.rx * 0.9, 0.22], { layer: 2, links: [ids[0]], hpM: 1.3, seg: 0 });
  // fins along the back
  for (let i = 3; i < n - 2; i += 4) b.spikes(secs[i], ids[i], { every: 1, len: 0.45, seg: i });
  return [{ sec: h, host: hi, core: true }, { sec: secs[c], host: ids[c] }];
}

/* species id → spawn zone range (existing roster) */
const ZONES: Record<string, [number, number]> = {
  dragonfly: [0, 4], scorpion: [0, 3], spider: [0, 4], moth: [0, 4], mantis: [0, 4],
  centipede: [0, 3], wasp: [0, 4], beetle: [0, 5], ant: [0, 4], firefly: [1, 5],
};
for (const sp of SPECIES) {
  const z = ZONES[sp.id];
  if (z) { sp.minZone = z[0]; sp.maxZone = z[1]; }
  else { sp.minZone ??= 0; sp.maxZone ??= 5; }
}

export const SPECIES_LIST = SPECIES;
export const SPECIES_COUNT = SPECIES.length;

export interface BuiltEnemy {
  parts: Part[];
  groups: Group[];
  order: number[];
  coreId: number;
  radius: number;
  size: number;
  legCount: number;
  wingCount: number;
}

/** Re-price the plating: every armour piece becomes `factor x` the average of the
 *  body's other pieces, so a rare body's plates are 4x its normal pieces and a
 *  mythical one's are 9x. The spread inside the armour (Core Guard layers, the
 *  hpM variants) is kept by scaling every plate by the same ratio. */
function scaleArmour(parts: Part[], tier: number, baseHp: number) {
  const t = Math.max(0, Math.min(ARMOUR_HP_MUL.length - 1, tier));
  let sum = 0, n = 0, plates = 0;
  for (const p of parts) {
    if (p.kind === "armor") { plates++; continue; }
    sum += p.maxHp; n++;
  }
  if (!plates || !n) return;
  const want = ARMOUR_HP_MUL[t] * (sum / n);
  const ratio = want / (baseHp * KIND_HP.armor * HP_MUL[t]);
  for (const p of parts) if (p.kind === "armor") p.hp = p.maxHp = p.maxHp * ratio;
}

export function buildEnemy(speciesIdx: number, tier: number, seed: number): BuiltEnemy {
  const sp = SPECIES[speciesIdx];
  const rng = mulberry32(seed);
  const b = new Builder(tier, sp.hue, rng, sp.hp);
  const mounts = sp.build(b, tier);
  loadout(b, mounts, sp);
  scaleArmour(b.parts, tier, sp.hp);
  const order = b.parts.map((_, i) => i).sort((a, c) => b.parts[a].layer - b.parts[c].layer || a - c);
  let radius = 0;
  let legCount = 0, wingCount = 0;
  for (const p of b.parts) {
    for (let i = 0; i < p.poly.length; i += 2) radius = Math.max(radius, Math.hypot(p.poly[i], p.poly[i + 1]));
    if (p.kind === "leg") legCount++;
    if (p.kind === "wing") wingCount++;
  }
  return { parts: b.parts, groups: b.groups, order, coreId: b.coreId, radius, size: b.S, legCount, wingCount };
}
