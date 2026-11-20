import { TAU, polyArea, polyCentroid, mulberry32 } from "./math";
import { HP_MUL, SIZE_GROWTH, type PartKind } from "./data";

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
  alive: boolean;
  hurt: number;
  barT: number;
  style: number;
  stroke: string;
  fill: string;
  glow: boolean;
  wpn: "" | "gun" | "missile";
  muzzle: number;
  shieldR: number;
  shieldHp: number;
  shieldMax: number;
  shieldDown: number;
  shieldHit: number;
  cd: number;
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

export type AbilityType = "swing" | "charge" | "shoot" | "nova" | "ring" | "pull" | "spit" | "cloud";
export type ProjType = "bolt" | "missile" | "web" | "orb" | "wave" | "hook" | "glob";
export interface AbilityDef {
  type: AbilityType;
  name: string;
  minTier: number;
  cd: number;
  wind: number;
  dmg: number;
  minS?: number;
  maxS?: number;
  minP?: number;
  maxP?: number;
  role?: "arm" | "mandible" | "tail";
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
  pack: number[];
  abilities: AbilityDef[];
  build: (b: Builder, tier: number) => Mount[];
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

const HP_BASE: Record<PartKind, number> = { core: 30, segment: 12, armor: 16, leg: 6, arm: 16, wing: 6, weapon: 22, shield: 26, spike: 5 };

/* ---------------- builder ---------------- */
export class Builder {
  parts: Part[] = [];
  groups: Group[] = [];
  coreId = 0;
  readonly S: number;
  constructor(public tier: number, public hue: number, public rng: () => number) {
    this.S = BASE_SIZE * Math.pow(SIZE_GROWTH, tier);
  }

  add(kind: PartKind, name: string, poly: number[], o: { layer?: number; hpM?: number; g?: number; links?: number[]; style?: number } = {}) {
    const S = this.S;
    const p = poly.map((v) => v * S);
    const [cx, cy] = polyCentroid(p);
    let r = 0;
    for (let i = 0; i < p.length; i += 2) r = Math.max(r, Math.hypot(p[i] - cx, p[i + 1] - cy));
    const style = o.style ?? 0;
    const col = colorsFor(kind, this.hue, style);
    const hp = HP_BASE[kind] * HP_MUL[this.tier] * (o.hpM ?? 1);
    const id = this.parts.length;
    this.parts.push({
      id, kind, name, poly: p, cx, cy, r, area: polyArea(p), hp, maxHp: hp,
      layer: o.layer ?? 1, links: [], g: o.g ?? -1, alive: true, hurt: 0, barT: 0, style,
      stroke: col.stroke, fill: col.fill, glow: col.glow || (kind === "segment" && style >= 3),
      wpn: "", muzzle: 0, shieldR: 0, shieldHp: 0, shieldMax: 0, shieldDown: 0, shieldHit: 0, cd: 1 + this.rng() * 2,
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
  sec(name: string, s: Sec, o: { hpM?: number; layer?: number; style?: number } = {}) {
    return this.add("segment", name, secPoly(s), { layer: o.layer ?? 1, hpM: o.hpM, style: o.style });
  }
  core(s: Sec, host: number, nbrs: number[]) {
    const r = Math.max(0.24, Math.min(s.rx, s.ry) * 0.36);
    const id = this.add("core", "Core", ell(s.cx, s.cy, r, r, 6, Math.PI / 6), { layer: 3, links: [host, ...nbrs] });
    if (this.tier >= 2) this.add("armor", "Core Guard", ell(s.cx, s.cy, r * 1.55, r * 1.55, 6), { layer: 6, links: [host], hpM: 1.6, style: 1 });
    if (this.tier >= 4) this.add("armor", "Core Guard", ell(s.cx, s.cy, r * 1.12, r * 1.12, 6, Math.PI / 6), { layer: 7, links: [host], hpM: 2.2, style: 2 });
    this.coreId = id;
    return id;
  }
  armor(s: Sec, host: number, o: { name: string; layers: number; edges: number; style?: number; hpM?: number }) {
    const ids: number[] = [];
    for (let L = 0; L < o.layers; L++) {
      const f1 = 1.05 - 0.3 * L;
      const f0 = Math.max(0.12, f1 - 0.45);
      for (let k0 = 0; k0 < s.n; k0 += o.edges) {
        const k1 = Math.min(s.n, k0 + o.edges);
        ids.push(this.add("armor", o.name, secSector(s, f0, f1, k0, k1), { layer: 4 + L, hpM: (o.hpM ?? 1) * (1 + 0.2 * L), links: [host], style: o.style ?? L % 2 }));
      }
    }
    return ids;
  }
  spikes(s: Sec, host: number, o: { every: number; len: number; name?: string }) {
    for (let k = 0; k < s.n; k += o.every) {
      const a0 = (k / s.n) * TAU, a1 = ((k + 1) / s.n) * TAU, am = (a0 + a1) / 2;
      const poly = [
        s.cx + Math.cos(a0) * s.rx * 0.98, s.cy + Math.sin(a0) * s.ry * 0.98,
        s.cx + Math.cos(am) * s.rx * (1 + o.len), s.cy + Math.sin(am) * s.ry * (1 + o.len),
        s.cx + Math.cos(a1) * s.rx * 0.98, s.cy + Math.sin(a1) * s.ry * 0.98,
      ];
      this.add("spike", o.name ?? "Spine", poly, { layer: 5, links: [host], hpM: 0.8 });
    }
  }
}

/* ---------------- shared limb builders ---------------- */
function leg(
  b: Builder, host: number, sx: number, sy: number, side: number, angs: number[], lens: number[], w: number, name: string,
  o: { phase?: number; amp?: number; split?: number; layer?: number; kind?: PartKind; role?: GroupRole } = {},
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
      const id = b.add(o.kind ?? "leg", name, side > 0 ? poly : mirror(poly), { layer: o.layer ?? 0, g: gi, links: [prev] });
      prev = id;
      x = nx; y = ny;
    }
  }
  return gi;
}
function legPair(b: Builder, host: number, sx: number, sy: number, angs: number[], lens: number[], w: number, name: string, o: { phase?: number; split?: number; amp?: number } = {}) {
  leg(b, host, sx, sy, 1, angs, lens, w, name, { ...o, phase: o.phase ?? 0 });
  leg(b, host, sx, sy, -1, angs, lens, w, name, { ...o, phase: (o.phase ?? 0) + Math.PI });
}
function antennae(b: Builder, host: number, ax: number, ay: number, angs: number[], lens: number[], w = 0.05) {
  for (const side of [1, -1]) leg(b, host, ax, ay, side, angs, lens, w, "Antenna", { kind: "spike", layer: 2, role: "sway", amp: 0.14, phase: side * 1.3 });
}
function mandibles(b: Builder, host: number, pivotX: number, pivotY: number, poly: number[], name: string, hpM = 1) {
  for (const side of [1, -1]) {
    const gi = b.group(pivotX, pivotY * side, "mandible", side, 0.1, 0);
    b.add("arm", name, side > 0 ? poly : mirror(poly), { layer: 2, g: gi, links: [host], hpM });
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
function loadout(b: Builder, mounts: Mount[], armed: SpeciesDef["armed"]) {
  const t = b.tier;
  const nGun = armed.gun && t >= 3 ? t - 2 : 0;
  const nMis = armed.missile && t >= 4 ? t - 3 : 0;
  const nSh = armed.shield && t >= 3 ? t - 2 : 0;
  if (!nGun && !nMis && !nSh) return;

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
    const r = c.r * (missile ? 1.15 : 1);
    const len = missile ? r * 1.5 : r * 2.0;
    const bw = missile ? r * 0.5 : r * 0.18;
    const gi = b.group(c.x, c.y * side, "turret", side, 0, 0);
    const poly = turretPoly(c.x, c.y, r, len, bw);
    const id = b.add("weapon", missile ? "Missile Pod" : "Gun Turret", side > 0 ? poly : mirror(poly), { layer: 8, g: gi, links: [c.host] });
    const p = b.parts[id];
    p.wpn = missile ? "missile" : "gun";
    p.muzzle = len * b.S;
  };
  for (let i = 0; i < nGun && pi < pairs.length; i++, pi++) { turret(pairs[pi], 1, false); turret(pairs[pi], -1, false); }
  for (let i = 0; i < nMis && pi < pairs.length; i++, pi++) { turret(pairs[pi], 1, true); turret(pairs[pi], -1, true); }
  for (let i = 0; i < nSh; i++) {
    const c = centers[i] ?? pairs[pi++];
    if (!c) break;
    const id = b.add("shield", "Shield Generator", ell(c.x, c.y, c.r * 1.1, c.r * 1.1, 6), { layer: 8, links: [c.host], style: 2 });
    const p = b.parts[id];
    p.shieldR = 1.9 * b.S * (1 + 0.1 * i);
    p.shieldMax = p.shieldHp = p.maxHp * 3;
  }
}

const P = Math.PI;

/* ---------------- species ---------------- */
const SPECIES: SpeciesDef[] = [
  /* 0 ─ DRAGONFLY */
  {
    id: "dragonfly", name: "Dragonfly", hue: 188, flying: true, speed: 210, turn: 3.4, ranged: true, keep: 330, muzzle: 2.2,
    armed: { gun: true, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "shoot", name: "Ion Bolt", minTier: 0, cd: 1.8, wind: 0.3, dmg: 0.7, n: 1, ns: 0.3, spread: 0.15, speed: 700, life: 1.4, size: 6, slow: 0.75, slowT: 1.2, kind: "bolt", maxP: 950 },
      { type: "charge", name: "Strafe Run", minTier: 1, cd: 7, wind: 0.5, dmg: 1.5, speed: 880, dur: 0.5, minP: 220, maxP: 750 },
      { type: "shoot", name: "Fan Burst", minTier: 2, cd: 6, wind: 0.5, dmg: 0.6, n: 5, ns: 0.6, spread: 0.9, speed: 600, life: 1.2, size: 6, kind: "bolt", maxP: 800 },
      { type: "nova", name: "Wing Shear", minTier: 3, cd: 10, wind: 0.8, dmg: 0.7, n: 10, ns: 1.5, speed: 420, life: 1.6, size: 7, kind: "wave", maxP: 600 },
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
    id: "scorpion", name: "Scorpion", hue: 2, flying: false, speed: 115, turn: 2.4, ranged: false, keep: 0, muzzle: 2.6,
    armed: { gun: true, missile: false, shield: false }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "swing", name: "Pincer Clamp", minTier: 0, cd: 2.6, wind: 0.5, dmg: 2, maxS: 3.5, role: "arm", needs: "Pincer" },
      { type: "swing", name: "Tail Lash", minTier: 0, cd: 4.2, wind: 0.6, dmg: 2.6, maxS: 3.9, role: "tail", needs: "Stinger", poison: 0.3 },
      { type: "shoot", name: "Venom Bolt", minTier: 1, cd: 4.5, wind: 0.4, dmg: 0.9, n: 1, ns: 0.5, spread: 0.3, speed: 560, life: 1.5, size: 7, poison: 0.25, kind: "bolt", minP: 200, maxP: 800 },
      { type: "pull", name: "Claw Grapple", minTier: 2, cd: 11, wind: 0.5, dmg: 0.5, speed: 760, minP: 260, maxP: 800 },
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
    id: "spider", name: "Widow Spider", hue: 272, flying: false, speed: 140, turn: 2.8, ranged: true, keep: 300, muzzle: 2.2,
    armed: { gun: false, missile: true, shield: false }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "shoot", name: "Web Shot", minTier: 0, cd: 6, wind: 0.5, dmg: 0.4, n: 1, speed: 460, life: 1.8, size: 12, slow: 0.5, slowT: 2.5, kind: "web", minP: 120, maxP: 800 },
      { type: "swing", name: "Fang Strike", minTier: 0, cd: 2, wind: 0.4, dmg: 1.7, maxS: 2.3, role: "mandible", needs: "Fang" },
      { type: "spit", name: "Acid Glob", minTier: 1, cd: 7, wind: 0.5, dmg: 0.6, speed: 480, size: 1.5, maxP: 800 },
      { type: "pull", name: "Silk Line", minTier: 2, cd: 12, wind: 0.5, dmg: 0.5, speed: 760, minP: 250, maxP: 850 },
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
    id: "moth", name: "Luna Moth", hue: 236, flying: true, speed: 130, turn: 2.6, ranged: true, keep: 380, muzzle: 1.4,
    armed: { gun: false, missile: false, shield: true }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "cloud", name: "Scale Dust", minTier: 0, cd: 8, wind: 0.6, dmg: 0.4, size: 2.8, slow: 0.55, atPlayer: true, maxP: 700 },
      { type: "shoot", name: "Spore Orbs", minTier: 1, cd: 5, wind: 0.5, dmg: 0.8, n: 2, ns: 0.5, spread: 0.7, speed: 260, life: 4, size: 9, homing: 1.6, slow: 0.8, slowT: 1, kind: "orb", maxP: 800 },
      { type: "pull", name: "Lunar Lure", minTier: 2, cd: 12, wind: 0.6, dmg: 0.5, speed: 700, minP: 250, maxP: 800 },
      { type: "ring", name: "Gust Pulse", minTier: 3, cd: 9, wind: 0.9, dmg: 1.2, size: 6, speed: 460, maxS: 4 },
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
    id: "mantis", name: "Mantis", hue: 92, flying: false, speed: 120, turn: 3.0, ranged: false, keep: 0, muzzle: 2.0,
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
    id: "centipede", name: "Centipede", hue: 335, flying: false, speed: 170, turn: 2.2, ranged: false, keep: 0, muzzle: 3.0,
    armed: { gun: false, missile: false, shield: false }, pack: [1, 1, 1, 1, 1, 1],
    abilities: [
      { type: "swing", name: "Forcipule Bite", minTier: 0, cd: 2, wind: 0.4, dmg: 1.8, maxS: 3.6, role: "mandible", needs: "Forcipule" },
      { type: "charge", name: "Rush", minTier: 0, cd: 5, wind: 0.4, dmg: 1.5, speed: 540, dur: 0.9, minP: 220, maxP: 900 },
      { type: "shoot", name: "Venom Spray", minTier: 1, cd: 5, wind: 0.4, dmg: 0.5, n: 5, ns: 0.8, spread: 0.9, speed: 500, life: 0.9, size: 6, poison: 0.15, kind: "bolt", maxP: 520 },
      { type: "nova", name: "Venom Ring", minTier: 3, cd: 10, wind: 0.8, dmg: 0.6, n: 14, ns: 2, speed: 380, life: 1.5, size: 7, poison: 0.15, kind: "bolt", maxP: 600 },
    ],
    build(b, t) {
      const N = 5 + 2 * t;
      const L = 5.2;
      const sp = L / N;
      const c = Math.floor(N / 2);
      const ids: number[] = [];
      const secs: Sec[] = [];
      for (let i = 0; i < N; i++) {
        const last = i === N - 1;
        const cx = -L / 2 + sp * (i + 0.5);
        const ry = 0.42 + 0.12 * (i / (N - 1));
        const s: Sec = last ? { cx: cx + sp * 0.15, cy: 0, rx: Math.max(0.42, sp * 0.8), ry: 0.58, n: 8 } : { cx, cy: 0, rx: sp * 0.82, ry, n: 6 };
        secs.push(s);
        ids.push(b.sec(last ? "Head" : "Body Segment", s, { style: i % 2, hpM: last ? 1.2 : 1 }));
        if (i > 0) b.link(ids[i - 1], ids[i]);
      }
      for (let i = 0; i < N - 1; i++) {
        const dl = Math.min(2, 1 + (t >= 3 ? 1 : 0));
        legPair(b, ids[i], secs[i].cx, 0.25, [1.25, 1.75], [0.5, 0.55], 0.06, "Leg", { split: dl, phase: i * 0.7, amp: 0.4 });
      }
      b.core(secs[c], ids[c], [ids[c - 1], ids[c + 1]]);
      for (let i = 0; i < N; i++) {
        if (i === c) { b.armor(secs[i], ids[i], { name: "Tergite", layers: 1, edges: 3 }); continue; }
        b.armor(secs[i], ids[i], { name: i === N - 1 ? "Cranial Plate" : "Tergite", layers: t >= 3 ? 2 : 1, edges: 3, style: i % 2 });
      }
      const hs = secs[N - 1];
      mandibles(b, ids[N - 1], hs.cx + hs.rx * 0.8, 0.2, [hs.cx + hs.rx * 0.7, 0.05, hs.cx + hs.rx * 1.1, 0.34, hs.cx + hs.rx * 1.6, 0.28, hs.cx + hs.rx * 1.35, 0.1, hs.cx + hs.rx * 1.0, 0.03], "Forcipule", 1.2);
      antennae(b, ids[N - 1], hs.cx + hs.rx * 0.6, 0.3, [0.8, 0.4], [0.6, 0.6], 0.04);
      return [];
    },
  },

  /* 6 ─ HORNET */
  {
    id: "wasp", name: "Hornet", hue: 52, flying: true, speed: 190, turn: 3.6, ranged: false, keep: 0, muzzle: 1.8,
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
    id: "beetle", name: "Scarab", hue: 140, flying: false, speed: 110, turn: 2.8, ranged: false, keep: 0, muzzle: 2.8,
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
    id: "ant", name: "Soldier Ant", hue: 28, flying: false, speed: 150, turn: 3.4, ranged: false, keep: 0, muzzle: 3.0,
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
    id: "firefly", name: "Firefly", hue: 305, flying: true, speed: 125, turn: 2.8, ranged: true, keep: 340, muzzle: 1.7,
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
];

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

export function buildEnemy(speciesIdx: number, tier: number, seed: number): BuiltEnemy {
  const sp = SPECIES[speciesIdx];
  const rng = mulberry32(seed);
  const b = new Builder(tier, sp.hue, rng);
  const mounts = sp.build(b, tier);
  loadout(b, mounts, sp.armed);
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
