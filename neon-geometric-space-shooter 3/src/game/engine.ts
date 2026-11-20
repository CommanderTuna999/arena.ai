import { TAU, angDiff, clamp, distToPoly, hash2, lerp, mulberry32, pointInPoly } from "./math";
import {
  ABILITY_BY_ID, BASE, DMG_MUL, HP_MUL, KIND_CAT, RECIPE_BY_ID, SHIP_R, UPGRADES, WORLD_R, compMass, compValue, computeStats, craftEfficiency,
  recipeProblem, upgradeCost, zoneTier, WEAPON_DMG, WEAPON_RANGE, type Comp, type DmgKind, type PartKind, type SaveData, type Slot, type Stats,
} from "./data";
import { SPECIES_LIST, buildEnemy, type AbilityDef, type Group, type Part, type ProjType, type SpeciesDef } from "./enemies";

/* ---------------------------------------------------------------------------
 * COMBAT & WORLD REFERENCE (live constants)
 *   Base cannon      : st.dmg per shot, rate 4 + 0.7/level, 1 + barrels shots.
 *   Crafted weapons  : fully automatic; damage = st.dmg * multiplier * efficiency.
 *                      B / AUTO pill toggles the rack (persisted in save.autoFire).
 *                      Each weapon has its own range (data.ts WEAPON_RANGE); auto-fire
 *                      never targets anything outside the current view.
 *   Precision missiles: right-click marks a part; kind-4 bullets ignore all collision
 *                      and hit that part for 3.1x base damage. Re-marking resets reload.
 *   Plating          : tier 2/3/4/5 get 1/2/3/4 grey layers of 5*HP_MUL[tier] HP.
 *                      Kinetic and explosive hits deal 30%; laser and shock deal 0.
 *                      Layers are drawn as solid grey copies of the part outlines.
 *   Energy shields   : blue hexes stop energy/shock/thermal completely and take no
 *                      damage from them; kinetic/explosive/corrosive pass through.
 *   Spawning         : per-zone density/cap [2.6/56, 2.2/50, 1.8/44, 1.4/38, 1.1/32,
 *                      0.9/28] per 1,500u chunk, chunk pass every 1.0s. A top-up pass
 *                      refills to ~85% of the local cap, and a visibility floor keeps
 *                      at least 4 enemies inside the view in the outer/mid rings
 *                      (2 in the deep rings).
 *   Body wave        : parts tagged seg >= 0 shift laterally by
 *                      amp * sin(walk*speed - seg*k); used for centipede and snake.
 * ------------------------------------------------------------------------- */
export const CH = 1500;
export const N_ROPE = 22;
/* Spawn pressure, indexed by zone tier (0 = outer/common … 5 = mythical core).
 * Early rings are crowded on purpose — players should always see a few enemies —
 * and every zone has its own population cap so the lag guard scales with the tier.
 * ZONE_DENS is enemies per 1,500u chunk per chunk pass. */
const ZONE_DENS = [2.6, 2.2, 1.8, 0.56, 0.44, 0.36];
const ZONE_CAP = [56, 48, 40, 22, 18, 15];
/** absolute ceiling across every zone; only a safety net */
const HARD_MAX = 60;
/** shells shave 70% off kinetic hits; lasers and shockwaves do nothing to them */
const SHELL_TAKE = 0.3;
/** The segmented snake boss is disabled for now; the species stays in the bestiary. */
const SNAKE_ENABLED = false;
const BOSS_SP = SNAKE_ENABLED ? SPECIES_LIST.findIndex((s) => s.boss) : -1;
const KIND_DROP: Record<PartKind, number> = { core: 1, segment: 1, armor: 0.8, leg: 0.6, arm: 1, wing: 0.6, weapon: 1.4, shield: 1.4, spike: 0.35 };

/* ---------------- entity types ---------------- */
export interface Act { i: number; def: AbilityDef; t: number; ph: number; hit: boolean; dir: number; fired: boolean }
export interface ShieldInfo { x: number; y: number; r: number; part: Part }
export interface Enemy {
  id: number; sp: number; spd: SpeciesDef; tier: number;
  x: number; y: number; a: number; vx: number; vy: number;
  S: number; radius: number; parts: Part[]; groups: Group[]; order: number[]; coreId: number;
  chunk: string; home: { x: number; y: number }; aggro: boolean; barT: number;
  speed: number; turn: number; mobility: number; legCount: number; wingCount: number;
  abil: AbilityDef[]; abilCd: number[]; gap: number; act: Act | null; stun: number;
  wander: { x: number; y: number; t: number }; roleGroups: Record<string, number[]>;
  walk: number; dead: boolean; eDmg: number; keep: number; strafe: number; strafeT: number;
  tags: Record<string, number>; shields: ShieldInfo[]; weaponParts: number[]; shieldParts: number[];
  dist: number; contactCd: number; hasChange: boolean;
  dot: number; dotT: number; melt: number; slowT: number; slowF: number;
  /** summon generation: 0 = natural spawn, children are +1 (hard stop at 2) */
  gen: number;
  /** outer armour plating, one entry per layer (higher tiers get more) */
  shells: ShellLayer[];
  /** plating hit flash timer */
  shellHit: number;
  /** radius of the plating shell */
  shellR: number;
  /** serpentine body wave (null for ordinary species) */
  bend: { amp: number; k: number; speed: number } | null;
}
export interface ShellLayer { hp: number; max: number }
export type DmgSrc = "kinetic" | "laser" | "shock" | "explosive" | "missile" | "dot";
export interface Bullet {
  x: number; y: number; vx: number; vy: number; life: number; dmg: number; pierce: number; hit: number[];
  kind: 0 | 1 | 2 | 3 | 4; target: Enemy | null; crit: boolean;
  /** what kind of damage this round carries (drives visuals + shield rules) */
  elem?: DmgKind;
  dot?: number; melt?: number; split?: number; flak?: boolean;
  /** kind 4 (precision missile): exact enemy piece it was fired at */
  lockE?: Enemy; lockP?: Part;
}
export interface EProj {
  x: number; y: number; vx: number; vy: number; life: number; dmg: number; r: number; hue: number; type: ProjType;
  homing: number; slow: number; slowT: number; poison: number; pierce: boolean; hp: number; speed: number; src: Enemy | null; puddle: { r: number; dps: number; slow: number } | null;
}
export interface Particle { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; max: number; size: number; shape: number; color: string; fill: boolean }
export interface Puddle { x: number; y: number; r: number; life: number; max: number; arm: number; dps: number; slow: number; hue: number }
export interface Ring { x: number; y: number; r: number; max: number; speed: number; dmg: number; hit: boolean; color: string; hurts: boolean }
export interface DebrisPiece { poly: number[]; stroke: string; fill: string }
export interface Debris { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; max: number; pieces: DebrisPiece[] }
export interface Beam { x1: number; y1: number; x2: number; y2: number; life: number; color?: string }
export interface LComp { id: number; c: Comp; x: number; y: number; vx: number; vy: number; a: number; va: number; r: number; hooks: number[]; stress: number; ttl: number; born: number }
export interface RopeNode { x: number; y: number; px: number; py: number }
export interface Harpoon {
  slot: number; state: 0 | 1 | 2 | 3; hx: number; hy: number; hvx: number; hvy: number; nodes: RopeNode[];
  len: number; hp: number; maxHp: number; comp: LComp | null; travelled: number; cool: number; taut: number; ang: number;
}
export interface Other { id: string; name: string; x: number; y: number; a: number; tx: number; ty: number; ta: number; seen: number }
export interface Toast { id: number; msg: string; color: string; t: number }
export interface Mine { x: number; y: number; vx: number; vy: number; arm: number; life: number; dmg: number; r: number }
export interface Drone { a: number; r: number; cd: number }
export interface Well { x: number; y: number; life: number; max: number; dmg: number; r: number }
export interface LockOn { e: Enemy; part: Part; t: number }
export interface AdminState { on: boolean; credits: boolean; health: boolean; damage: boolean; components: boolean }

export interface HudAbility { key: string; name: string; icon: string; color: string; cd: number; max: number; ready: boolean; active: boolean; empty: boolean }

export interface Player {
  x: number; y: number; vx: number; vy: number; a: number;
  hp: number; shield: number; boost: number; boosting: boolean;
  slowF: number; slowT: number; poison: number; poisonT: number;
  pull: { e: Enemy; t: number } | null; dead: boolean; respawn: number;
  fireCd: number; wCd: number[]; hitT: number; shieldT: number; flash: number; thornCd: number;
  tpT: number; tpCd: number; tow: number; thrust: number;
  barrier: number; barrierMax: number; barrierT: number; overT: number; nullCd: number;
}

export interface Hud {
  hp: number; maxHp: number; shield: number; maxShield: number; boost: number; hasBoost: boolean; credits: number;
  harp: { state: number; load: number; hp: number }[]; toasts: Toast[]; nearBase: boolean;
  tp: { has: boolean; ch: number; cd: number; max: number }; dead: boolean; respawn: number; x: number; y: number;
  online: number; zoomOn: boolean; inv: number; cargo: number; hold: number; rev: number; zoom: number; fps: number;
  abilities: HudAbility[]; admin: AdminState; lock: boolean; autoFire: boolean; overdrive: boolean;
  discovery: { name: string; t: number } | null;
}

export function biomeWeights(x: number, y: number): number[] {
  const d = Math.hypot(x, y);
  const th = Math.atan2(y, x);
  let u = th / TAU + 0.5 + 0.1 * Math.sin(d / 1700);
  u -= Math.floor(u);
  const n = SPECIES_LIST.length;
  const w: number[] = [];
  for (let i = 0; i < n; i++) {
    const h = (i + 0.5) / n;
    const dd = Math.abs(u - h);
    const cd = Math.min(dd, 1 - dd);
    w.push(Math.pow(Math.max(0.03, 1 - cd * n * 0.85), 1.5));
  }
  return w;
}
function pickSpecies(x: number, y: number, rng: () => number, zone: number) {
  const w = biomeWeights(x, y);
  for (let i = 0; i < w.length; i++) {
    const sp = SPECIES_LIST[i];
    /* unique bosses never enter the ordinary species lottery; they are spawned
     * only by the dedicated boss pass (disabled while SNAKE_ENABLED is false) */
    if (sp.boss) { w[i] = 0; continue; }
    if (zone < (sp.minZone ?? 0) || zone > (sp.maxZone ?? 5)) w[i] = 0;
  }
  let tot = 0;
  for (const v of w) tot += v;
  if (tot <= 0) return 0;
  let r = rng() * tot;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return w.length - 1;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const clampWorld = (x: number, y: number): [number, number] => {
  const d = Math.hypot(x, y);
  if (d <= WORLD_R - 40) return [x, y];
  const k = (WORLD_R - 40) / (d || 1);
  return [x * k, y * k];
};

export class Game {
  save: SaveData;
  stats: Stats;
  pid: string;
  w = 800; h = 600; dpr = 1;
  cam = { x: BASE.x, y: BASE.y - 120, z: 1 };
  zoom = 1;
  t = 0;
  rev = 0;
  fps = 60;
  input = { keys: new Set<string>(), mx: 0, my: 0, lmb: false, rHold: 0 };
  player: Player;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  eprojs: EProj[] = [];
  particles: Particle[] = [];
  puddles: Puddle[] = [];
  rings: Ring[] = [];
  debris: Debris[] = [];
  beams: Beam[] = [];
  comps: LComp[] = [];
  harpoons: Harpoon[] = [];
  others: Other[] = [];
  toasts: Toast[] = [];
  /** newly discovered species banner, shown at the top of the screen */
  discovery: { name: string; t: number } | null = null;
  chunks = new Set<string>();
  shake = 0;
  tintHue = 190;
  tintTarget = 190;
  holdComp: LComp | null = null;
  online = 1;
  lock: LockOn | null = null;
  mines: Mine[] = [];
  drones: Drone[] = [];
  wells: Well[] = [];
  admin: AdminState = { on: false, credits: false, health: false, damage: false, components: false };
  autoFire = true;
  private bossT = 12;
  aCd: number[] = [0, 0, 0, 0, 0];
  private idc = 1;
  private chunkT = 0;
  private saveT = 0;
  private serverT = 0;
  private netT = 0;
  private netBusy = false;
  private expDepth = 0;
  private dirty = false;
  private toastId = 1;
  private _w: [number, number] = [0, 0];
  private fpsAcc = 0;
  private fpsN = 0;
  private lastServerSave = 0;

  constructor(save: SaveData, pid: string) {
    this.save = save;
    this.pid = pid;
    this.stats = computeStats(save);
    this.player = {
      x: BASE.x, y: BASE.y - 200, vx: 0, vy: 0, a: -Math.PI / 2, hp: this.stats.hull, shield: this.stats.shieldMax, boost: 100, boosting: false,
      slowF: 1, slowT: 0, poison: 0, poisonT: 0, pull: null, dead: false, respawn: 0, fireCd: 0, wCd: [0, 0, 0], hitT: 99, shieldT: 0,
      flash: 0, thornCd: 0, tpT: 0, tpCd: 0, tow: 1, thrust: 0,
      barrier: 0, barrierMax: 0, barrierT: 0, overT: 0, nullCd: 0,
    };
    this.autoFire = save.autoFire !== false;
    this.syncHarpoons();
    this.cam.x = this.player.x;
    this.cam.y = this.player.y;
  }

  /* ---------------- misc helpers ---------------- */
  resize(w: number, h: number, dpr: number) { this.w = w; this.h = h; this.dpr = dpr; }
  toast(msg: string, color = "#7df9ff") {
    this.toasts.push({ id: this.toastId++, msg, color, t: 4 });
    if (this.toasts.length > 5) this.toasts.shift();
  }
  mouseWorld(): [number, number] {
    return [this.cam.x + (this.input.mx - this.w / 2) / this.cam.z, this.cam.y + (this.input.my - this.h / 2) / this.cam.z];
  }
  nearBase() { return Math.hypot(this.player.x - BASE.x, this.player.y - BASE.y) < BASE.r + 40; }
  inSafe() { return Math.hypot(this.player.x - BASE.x, this.player.y - BASE.y) < BASE.r + 90; }
  markDirty() { this.dirty = true; this.rev++; this.save.ts = Date.now(); }
  setAdmin(k: keyof AdminState, v: boolean) {
    (this.admin as unknown as Record<string, boolean>)[k] = v;
    if (k === "on" && v) this.toast("ADMIN MODE ONLINE", "#ff7ad9");
    if (k === "on" && !v) this.toast("Admin mode offline", "#9db4c9");
    this.rev++;
  }
  adminAll(v: boolean) {
    this.admin = { on: v || this.admin.on, credits: v, health: v, damage: v, components: v };
    this.rev++;
  }
  adminCredits(n = 1_000_000) {
    this.save.credits += n;
    this.markDirty();
  }
  private dmgMul() { return this.admin.on && this.admin.damage ? 100 : 1; }

  recompute() {
    const old = this.stats;
    this.stats = computeStats(this.save);
    const p = this.player;
    if (this.stats.hull !== old.hull) p.hp = Math.min(this.stats.hull, p.hp + Math.max(0, this.stats.hull - old.hull));
    p.hp = Math.min(p.hp, this.stats.hull);
    p.shield = Math.min(this.stats.shieldMax, p.shield + Math.max(0, this.stats.shieldMax - old.shieldMax));
    this.zoom = clamp(this.zoom, this.stats.zoomMin, 1);
    this.syncHarpoons();
  }
  private syncHarpoons() {
    const n = this.stats.hCount;
    while (this.harpoons.length < n) {
      const nodes: RopeNode[] = [];
      for (let i = 0; i < N_ROPE; i++) nodes.push({ x: 0, y: 0, px: 0, py: 0 });
      this.harpoons.push({ slot: this.harpoons.length, state: 0, hx: 0, hy: 0, hvx: 0, hvy: 0, nodes, len: 0, hp: 1, maxHp: 1, comp: null, travelled: 0, cool: 0, taut: 0, ang: 0 });
    }
    while (this.harpoons.length > n) { const h = this.harpoons.pop()!; if (h.comp) this.unhook(h); }
    for (const h of this.harpoons) h.maxHp = this.stats.hHp;
  }

  /* ---------------- UI facing actions ---------------- */
  buy(id: string) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) return false;
    const l = this.save.upgrades[id] ?? 0;
    if (l >= u.max) return false;
    const c = this.admin.on && this.admin.credits ? 0 : upgradeCost(u, l);
    if (this.save.credits < c) return false;
    this.save.credits -= c;
    this.save.upgrades[id] = l + 1;
    this.recompute();
    this.markDirty();
    return true;
  }
  sellComp(id: string) {
    const i = this.save.inventory.findIndex((c) => c.id === id);
    if (i < 0) return 0;
    const c = this.save.inventory[i];
    const v = Math.round(c.value * this.stats.sellMul);
    this.save.inventory.splice(i, 1);
    this.save.credits += v;
    this.save.earned += v;
    this.markDirty();
    return v;
  }
  sellBelow(maxTier: number) {
    let total = 0;
    for (const c of [...this.save.inventory]) if (c.tier <= maxTier) total += this.sellComp(c.id);
    return total;
  }
  craft(rid: string, ids: string[]) {
    const r = RECIPE_BY_ID[rid];
    if (!r) return "Unknown recipe";
    const free = this.admin.on && this.admin.components;
    const comps = ids.map((id) => this.save.inventory.find((c) => c.id === id)).filter((c): c is Comp => !!c);
    if (!free) {
      if (comps.length !== ids.length) return "Missing components";
      const prob = recipeProblem(r, comps);
      if (prob) return prob;
    }
    const eff = free && comps.length === 0 ? 1.5 : craftEfficiency(r, comps);
    this.save.inventory = this.save.inventory.filter((c) => !ids.includes(c.id));
    const item = { id: uid(), rid, eff };
    this.save.crafted.push(item);
    const eq = this.save.equip;
    if (r.slot === "weapon") { const i = eq.weapon.indexOf(null); if (i >= 0) eq.weapon[i] = item.id; }
    else if (r.slot === "ability") { const i = this.save.abilitySlots.indexOf(null); if (i >= 0) this.save.abilitySlots[i] = item.id; }
    else if (!eq[r.slot]) eq[r.slot] = item.id;
    this.recompute();
    this.markDirty();
    this.toast(`Crafted ${r.name} (${Math.round(eff * 100)}% efficiency)`, "#ffd24d");
    return null;
  }
  equip(slot: Slot, idx: number, id: string | null) {
    const eq = this.save.equip;
    if (slot === "ability") {
      if (id) for (let i = 0; i < 5; i++) if (this.save.abilitySlots[i] === id) this.save.abilitySlots[i] = null;
      this.save.abilitySlots[idx] = id;
      this.aCd[idx] = 0;
    } else if (slot === "weapon") {
      if (id) for (let i = 0; i < 3; i++) if (eq.weapon[i] === id) eq.weapon[i] = null;
      eq.weapon[idx] = id;
    } else eq[slot] = id;
    this.recompute();
    this.markDirty();
  }
  scrap(id: string) {
    const eq = this.save.equip;
    this.save.crafted = this.save.crafted.filter((c) => c.id !== id);
    for (let i = 0; i < 3; i++) if (eq.weapon[i] === id) eq.weapon[i] = null;
    for (let i = 0; i < 5; i++) if (this.save.abilitySlots[i] === id) this.save.abilitySlots[i] = null;
    for (const s of ["shield", "armor", "optics", "utility"] as const) if (eq[s] === id) eq[s] = null;
    this.recompute();
    this.markDirty();
  }
  setName(n: string) { this.save.name = n.slice(0, 16); this.markDirty(); }
  setAutoFire(v: boolean) { this.autoFire = v; this.save.autoFire = v; this.markDirty(); this.rev++; }
  setShowCompInfo(v: boolean) { this.save.showCompInfo = v; this.markDirty(); this.rev++; }
  setShowRanges(v: boolean) { this.save.showRanges = v; this.markDirty(); this.rev++; }
  /** loose component under the mouse (for the hover tooltip) */
  compUnderCursor(): LComp | null {
    const [mx, my] = this.mouseWorld();
    for (let i = this.comps.length - 1; i >= 0; i--) {
      const c = this.comps[i];
      const dx = mx - c.x, dy = my - c.y;
      if (dx * dx + dy * dy > (Math.max(c.r, 20) + 16) * (Math.max(c.r, 20) + 16)) continue;
      const ca = Math.cos(-c.a), sa = Math.sin(-c.a);
      if (pointInPoly(dx * ca - dy * sa, dx * sa + dy * ca, c.c.poly)) return c;
    }
    return null;
  }
  setAutoSell(v: boolean) { this.save.autoSell = v; this.markDirty(); }
  hardReset(save: SaveData) {
    this.save = save;
    this.recompute();
    this.player.hp = this.stats.hull;
    this.player.shield = this.stats.shieldMax;
    for (const c of [...this.comps]) c.hooks.length = 0;
    this.comps = [];
    this.mines = [];
    this.wells = [];
    this.drones = [];
    this.lock = null;
    this.aCd = [0, 0, 0, 0, 0];
    for (const h of this.harpoons) { h.state = 0; h.comp = null; }
    this.markDirty();
  }

  /* ---------------- saving / net ---------------- */
  localSaveKey = "neon-hive-save-v1";
  persist(force = false) {
    if (!this.dirty && !force) return;
    this.dirty = false;
    try { localStorage.setItem(this.localSaveKey, JSON.stringify(this.save)); } catch { /* ignore */ }
  }
  async pushServer() {
    this.lastServerSave = Date.now();
    try {
      await fetch("/api/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: this.pid, name: this.save.name || "Pilot", save: this.save }), keepalive: true });
    } catch { /* offline is fine */ }
  }
  beaconSave() {
    this.persist(true);
    try {
      const blob = new Blob([JSON.stringify({ id: this.pid, name: this.save.name || "Pilot", save: this.save })], { type: "application/json" });
      navigator.sendBeacon("/api/save", blob);
    } catch { /* ignore */ }
  }
  private async netTick() {
    if (this.netBusy) return;
    this.netBusy = true;
    try {
      const p = this.player;
      const res = await fetch("/api/presence", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: this.pid, name: this.save.name || "Pilot", x: Math.round(p.x), y: Math.round(p.y), a: +p.a.toFixed(2), dead: p.dead }),
      });
      if (res.ok) {
        const data = (await res.json()) as { players: { id: string; name: string; x: number; y: number; a: number }[]; online: number };
        this.online = data.online;
        const seen = new Set<string>();
        for (const o of data.players) {
          seen.add(o.id);
          const ex = this.others.find((q) => q.id === o.id);
          if (ex) { ex.tx = o.x; ex.ty = o.y; ex.ta = o.a; ex.name = o.name; ex.seen = this.t; }
          else this.others.push({ id: o.id, name: o.name, x: o.x, y: o.y, a: o.a, tx: o.x, ty: o.y, ta: o.a, seen: this.t });
        }
        this.others = this.others.filter((o) => seen.has(o.id));
      }
    } catch { /* ignore */ }
    this.netBusy = false;
  }

  /* ---------------- input ---------------- */
  keyDown(code: string) {
    this.input.keys.add(code);
    if (code === "KeyT") this.toggleRecall();
    if (code === "KeyB") this.toggleAutoFire();
    const ai = (["KeyZ", "KeyX", "KeyC", "KeyV", "KeyF"] as const).indexOf(code as never);
    if (ai >= 0) this.useAbility(ai);
  }
  keyUp(code: string) { this.input.keys.delete(code); }
  mouseDown(btn: number) {
    if (btn === 0) this.input.lmb = true;
    if (btn !== 2) return;
    // with a missile launcher fitted, right-click marks a precise target.
    // hovering empty space (or no launcher) still fires the harpoon.
    if (this.hasHoming() && this.markTarget()) return;
    this.fireHarpoon();
  }
  toggleAutoFire() { this.setAutoFire(!this.autoFire); }
  private hasHoming() { return this.stats.weapons.some((w) => w.rid === "homing"); }
  /** mark the enemy piece under the cursor; returns false if the cursor is empty */
  private markTarget() {
    const [mx, my] = this.mouseWorld();
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = mx - e.x, dy = my - e.y;
      if (dx * dx + dy * dy > (e.radius + 30) * (e.radius + 30)) continue;
      const ca = Math.cos(e.a), sa = Math.sin(e.a);
      const part = this.partAt(e, dx * ca + dy * sa, -dx * sa + dy * ca);
      if (!part) continue;
      const changed = !this.lock || this.lock.e !== e || this.lock.part !== part;
      this.lock = { e, part, t: 0 };
      if (changed) {
        // re-marking resets the launcher reload
        this.stats.weapons.forEach((w, i) => { if (w.rid === "homing") this.player.wCd[i] = 1.7 / (0.7 + 0.3 * w.eff); });
        const [wx, wy] = this.partWorld(e, part);
        for (let k = 0; k < 3; k++) this.ringFx(wx, wy, 34 + k * 14, "#ffb04d", 260);
        this.toast("Target marked", "#ffb04d");
      }
      return true;
    }
    return false;
  }
  mouseUp(btn: number) { if (btn === 0) this.input.lmb = false; }
  wheel(dy: number) {
    if (this.stats.zoomMin >= 1) return;
    this.zoom = clamp(this.zoom * (dy > 0 ? 0.9 : 1.1), this.stats.zoomMin, 1);
  }
  blur() { this.input.keys.clear(); this.input.lmb = false; }

  private abilityAt(i: number) {
    const id = this.save.abilitySlots[i];
    if (!id) return null;
    const it = this.save.crafted.find((c) => c.id === id);
    if (!it) return null;
    const spec = ABILITY_BY_ID[it.rid];
    if (!spec) return null;
    return { it, spec, eff: it.eff };
  }
  useAbility(i: number) {
    const a = this.abilityAt(i);
    const p = this.player, st = this.stats;
    if (!a) { this.toast("No ability in that slot", "#ff8a8a"); return; }
    if (p.dead) return;
    if (this.aCd[i] > 0) { this.toast(`${a.spec.name} recharging (${Math.ceil(this.aCd[i])}s)`, "#ffb36b"); return; }
    const cd = a.spec.cd / (0.7 + 0.3 * a.eff);
    const dur = a.spec.dur;
    const eff = a.eff;
    switch (a.spec.id) {
      case "ab_emp": {
        const R = 760;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.radius) {
            e.stun = Math.max(e.stun, dur * (0.7 + 0.3 * eff));
            if (!e.shells.length) this.damagePart(e, e.parts[e.coreId].alive ? e.parts[e.coreId] : e.parts[0], st.dmg * 1.5 * eff, 0, 0, "shock");
          }
        }
        this.ringFx(p.x, p.y, R, "#7df9ff", 900);
        this.burst(p.x, p.y, "#7df9ff", 26, 7, 420);
        this.shake = Math.max(this.shake, 10);
        break;
      }
      case "ab_salvo": {
        const targets = [...this.enemies].filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 1200).slice(0, 6);
        for (let k = 0; k < 10; k++) {
          const ang = (k / 10) * TAU;
          const t = targets[k % Math.max(1, targets.length)] ?? null;
          this.bullets.push({
            x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300,
            life: 3.4, dmg: st.dmg * 1.8 * eff * this.dmgMul(), pierce: 0, hit: [], kind: 1, target: t, crit: false,
          });
        }
        this.toast("Missile salvo away", "#ffb04d");
        break;
      }
      case "ab_repair": {
        p.hp = Math.min(st.hull, p.hp + st.hull * 0.35 * Math.min(1.6, eff));
        p.shield = Math.min(st.shieldMax, p.shield + st.shieldMax * 0.6);
        for (let k = 0; k < 20; k++) this.addParticle(p.x + (Math.random() - 0.5) * 60, p.y + (Math.random() - 0.5) * 60, 0, -90, "#7dffb4", 5, 0.9, 2);
        this.toast("Nano repair field", "#7dffb4");
        break;
      }
      case "ab_blink": {
        const dist = 520;
        const ox = p.x, oy = p.y;
        const [nx, ny] = clampWorld(p.x + Math.cos(p.a) * dist, p.y + Math.sin(p.a) * dist);
        p.x = nx; p.y = ny;
        p.vx += Math.cos(p.a) * 300; p.vy += Math.sin(p.a) * 300;
        this.burst(ox, oy, "#c77dff", 20, 7, 300);
        this.burst(p.x, p.y, "#c77dff", 20, 7, 300);
        break;
      }
      case "ab_barrier": {
        p.barrierMax = st.hull * (0.35 + 0.3 * eff);
        p.barrier = p.barrierMax;
        p.barrierT = dur;
        this.ringFx(p.x, p.y, 90, "#4dd2ff", 500);
        break;
      }
      case "ab_overdrive": {
        p.overT = dur;
        this.ringFx(p.x, p.y, 120, "#ffe14d", 600);
        this.toast("OVERDRIVE", "#ffe14d");
        break;
      }
      case "ab_timewarp": {
        for (const e of this.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < 900 + e.radius) { e.slowT = dur; e.slowF = Math.max(0.1, 0.25 - 0.05 * eff); }
        }
        this.ringFx(p.x, p.y, 900, "#ff7ad9", 700);
        this.toast("Time warp", "#ff7ad9");
        break;
      }
      case "ab_shockwave": {
        const R = 520;
        for (const e of this.enemies) {
          const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
          if (d < R + e.radius) {
            const f = (1 - clamp(d / (R + e.radius), 0, 1)) * 900;
            e.vx += (dx / d) * f; e.vy += (dy / d) * f;
            e.stun = Math.max(e.stun, 0.5);
          }
        }
        this.areaDamage(p.x, p.y, R, st.dmg * 5 * eff * this.dmgMul(), null, "shock");
        this.ringFx(p.x, p.y, R, "#ff6b81", 1000);
        this.burst(p.x, p.y, "#ff6b81", 30, 8, 520);
        this.shake = Math.max(this.shake, 14);
        break;
      }
    }
    this.aCd[i] = cd;
    this.toast(`${a.spec.name} engaged`, a.spec.color);
    this.markDirty();
  }

  private toggleRecall() {
    const p = this.player, st = this.stats;
    if (st.tpTime <= 0) { this.toast("Craft a Recall Beacon to teleport home", "#ff8a8a"); return; }
    if (p.tpT > 0) { p.tpT = 0; this.toast("Recall cancelled", "#ffb36b"); return; }
    if (p.tpCd > 0) { this.toast(`Beacon recharging (${Math.ceil(p.tpCd)}s)`, "#ffb36b"); return; }
    if (this.inSafe()) return;
    p.tpT = st.tpTime;
  }

  /* ---------------- harpoons ---------------- */
  private fireHarpoon() {
    const p = this.player;
    if (p.dead) return;
    const h = this.harpoons.find((q) => q.state === 0 && q.cool <= 0);
    if (!h) { this.toast("No harpoon ready", "#ff8a8a"); return; }
    const [mx, my] = this.mouseWorld();
    const ang = Math.atan2(my - p.y, mx - p.x);
    const sp = this.stats.hSpeed;
    h.state = 1;
    h.ang = ang;
    h.hx = p.x + Math.cos(ang) * 16; h.hy = p.y + Math.sin(ang) * 16;
    h.hvx = Math.cos(ang) * sp + p.vx * 0.4; h.hvy = Math.sin(ang) * sp + p.vy * 0.4;
    h.travelled = 0; h.comp = null; h.hp = this.stats.hHp; h.maxHp = this.stats.hHp; h.len = 30; h.taut = 0;
    const px = -Math.sin(ang), py = Math.cos(ang);
    for (let i = 0; i < N_ROPE; i++) {
      const n = h.nodes[i];
      n.x = p.x; n.y = p.y;
      const amp = Math.sin(i * 0.85) * 9 * (i / N_ROPE + 0.2);
      n.px = n.x - px * amp - Math.cos(ang) * 4; n.py = n.y - py * amp - Math.sin(ang) * 4;
    }
    for (let i = 0; i < 6; i++) this.addParticle(p.x, p.y, Math.cos(ang) * 200 + (Math.random() - 0.5) * 120, Math.sin(ang) * 200 + (Math.random() - 0.5) * 120, "#7df9ff", 4, 0.3, 3);
  }
  private unhook(h: Harpoon) {
    if (h.comp) { h.comp.hooks = h.comp.hooks.filter((s) => s !== h.slot); h.comp = null; }
  }
  private retract(h: Harpoon) {
    this.unhook(h);
    h.state = 3;
  }
  private snapHarpoon(h: Harpoon, why: string) {
    for (let i = 0; i < N_ROPE; i += 2) this.addParticle(h.nodes[i].x, h.nodes[i].y, (Math.random() - 0.5) * 240, (Math.random() - 0.5) * 240, i % 4 === 0 ? "#ff5d73" : "#7df9ff", 5, 0.7, 4);
    this.unhook(h);
    h.state = 0; h.cool = 2;
    this.shake = Math.max(this.shake, 5);
    this.toast(why, "#ff8a8a");
  }
  private stepRope(h: Harpoon, seg: number) {
    const n = h.nodes;
    const p = this.player;
    n[0].x = p.x; n[0].y = p.y; n[0].px = p.x; n[0].py = p.y;
    const last = n[N_ROPE - 1];
    last.x = h.hx; last.y = h.hy; last.px = h.hx; last.py = h.hy;
    for (let i = 1; i < N_ROPE - 1; i++) {
      const nd = n[i];
      const vx = (nd.x - nd.px) * 0.982, vy = (nd.y - nd.py) * 0.982;
      nd.px = nd.x; nd.py = nd.y; nd.x += vx; nd.y += vy;
    }
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < N_ROPE - 1; i++) {
        const a = n[i], b = n[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d > seg) {
          const diff = (d - seg) / d;
          const wa = i === 0 ? 0 : 1, wb = i + 1 === N_ROPE - 1 ? 0 : 1;
          const ws = wa + wb;
          if (ws === 0) continue;
          a.x += (dx * diff * wa) / ws; a.y += (dy * diff * wa) / ws;
          b.x -= (dx * diff * wb) / ws; b.y -= (dy * diff * wb) / ws;
        }
      }
    }
    for (let i = 1; i < N_ROPE - 1; i++) {
      const mx = (n[i - 1].x + n[i + 1].x) / 2, my = (n[i - 1].y + n[i + 1].y) / 2;
      n[i].x += (mx - n[i].x) * 0.07; n[i].y += (my - n[i].y) * 0.07;
    }
  }
  private updateHarpoons(dt: number) {
    const p = this.player, st = this.stats;
    for (const h of this.harpoons) {
      if (h.cool > 0) h.cool -= dt;
      if (h.state === 0) continue;
      if (p.dead) { this.retract(h); }
      if (h.state === 1) {
        h.hx += h.hvx * dt; h.hy += h.hvy * dt;
        h.travelled += Math.hypot(h.hvx, h.hvy) * dt;
        let hit: LComp | null = null;
        for (const c of this.comps) {
          const dx = h.hx - c.x, dy = h.hy - c.y;
          if (dx * dx + dy * dy > (c.r + 14) * (c.r + 14)) continue;
          const ca = Math.cos(-c.a), sa = Math.sin(-c.a);
          const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
          if (distToPoly(lx, ly, c.c.poly) < 12) { hit = c; break; }
        }
        const d = Math.hypot(h.hx - p.x, h.hy - p.y);
        if (hit) {
          h.state = 2; h.comp = hit; hit.hooks.push(h.slot);
          h.len = clamp(d, 60, st.hRange);
          this.shake = Math.max(this.shake, 3);
          for (let i = 0; i < 8; i++) this.addParticle(hit.x, hit.y, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, "#7df9ff", 5, 0.5, 4);
        } else if (h.travelled > st.hRange) h.state = 3;
        this.stepRope(h, Math.max(3, (d * 1.12 + 20) / (N_ROPE - 1)));
      } else if (h.state === 2) {
        const c = h.comp;
        if (!c || !this.comps.includes(c)) { h.state = 3; h.comp = null; continue; }
        h.hx = c.x; h.hy = c.y;
        const minLen = Math.max(70, c.r * 0.9 + 70);
        h.len = Math.max(minLen, h.len - st.hSpeed * 0.35 * dt);
        const d = Math.hypot(h.hx - p.x, h.hy - p.y);
        if (d > st.hRange * 1.7) { this.snapHarpoon(h, "Cable overstretched!"); continue; }
        if (h.hp <= 0) { this.snapHarpoon(h, "Cable severed!"); continue; }
        this.stepRope(h, Math.max(2, h.len / (N_ROPE - 1)));
      } else {
        const dx = p.x - h.hx, dy = p.y - h.hy;
        const d = Math.hypot(dx, dy);
        const sp = 1700 * dt;
        if (d < sp + 28) { h.state = 0; h.cool = 0.25; continue; }
        h.hx += (dx / d) * sp; h.hy += (dy / d) * sp;
        this.stepRope(h, Math.max(2, (d * 1.04 + 10) / (N_ROPE - 1)));
      }
    }
  }
  private updateComps(dt: number) {
    const p = this.player, st = this.stats;
    p.tow = 1;
    for (let i = this.comps.length - 1; i >= 0; i--) {
      const c = this.comps[i];
      c.ttl -= dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.a += c.va * dt;
      c.va *= Math.exp(-1.5 * dt);
      if (c.hooks.length) {
        const cap = c.hooks.length * st.hStr;
        const ratio = c.c.mass / cap;
        let taut = false;
        for (const slot of c.hooks) {
          const h = this.harpoons[slot];
          if (!h || h.state !== 2) continue;
          const dx = p.x - c.x, dy = p.y - c.y;
          const d = Math.hypot(dx, dy) || 1;
          const stretch = d - h.len;
          h.taut = clamp(stretch / 40, 0, 1);
          if (stretch > 0) {
            const f = (stretch * 38) / (1 + ratio * 2.5);
            c.vx += (dx / d) * f * dt; c.vy += (dy / d) * f * dt;
            if (stretch > 3) taut = true;
          }
        }
        const damp = Math.exp(-(1.4 + ratio * 2.2) * dt);
        c.vx *= damp; c.vy *= damp;
        if (taut) {
          p.tow = Math.min(p.tow, 1 / (1 + Math.min(2, ratio) * 0.75 * (1 - Math.min(0.5, st.towRelief))));
          if (ratio > 1) c.stress += dt * (0.8 + (ratio - 1) * 1.5);
          else c.stress = Math.max(0, c.stress - dt * 2);
        } else c.stress = Math.max(0, c.stress - dt * 1.5);
        if (c.stress >= 1) {
          const slot = c.hooks[c.hooks.length - 1];
          const h = this.harpoons[slot];
          c.stress = 0.35;
          if (h) this.snapHarpoon(h, c.hooks.length > 1 ? "A cable snapped under the load!" : "Too heavy! Cable snapped.");
          else c.hooks.pop();
        }
      } else {
        if (st.magnet > 0 && c.c.mass < 14) {
          const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
          if (d < st.magnetRange && d > 1) {
            const f = 780 * (1 - d / st.magnetRange);
            c.vx += (dx / d) * f * dt; c.vy += (dy / d) * f * dt;
          }
        }
        const damp = Math.exp(-1.3 * dt);
        c.vx *= damp; c.vy *= damp;
        c.stress = 0;
      }
      // docking
      if (Math.hypot(c.x - BASE.x, c.y - BASE.y) < BASE.dock) {
        for (const slot of [...c.hooks]) { const h = this.harpoons[slot]; if (h) this.retract(h); }
        this.comps.splice(i, 1);
        this.dockComp(c);
        continue;
      }
      if (c.ttl <= 0 && c.hooks.length === 0) { this.comps.splice(i, 1); }
    }
    // release with R
    const mw = this.mouseWorld();
    let target: LComp | null = null;
    if (this.input.keys.has("KeyR")) {
      for (const c of this.comps) {
        if (!c.hooks.length) continue;
        if (Math.hypot(mw[0] - c.x, mw[1] - c.y) < c.r + 30) { target = c; break; }
      }
    }
    if (target) {
      if (this.holdComp !== target) { this.holdComp = target; this.input.rHold = 0; }
      this.input.rHold += dt;
      if (this.input.rHold >= 0.6) {
        for (const slot of [...target.hooks]) { const h = this.harpoons[slot]; if (h) this.retract(h); }
        target.hooks.length = 0;
        this.holdComp = null; this.input.rHold = 0;
        this.toast("Harpoon released", "#9db4c9");
      }
    } else { this.holdComp = null; this.input.rHold = 0; }
  }
  private dockComp(c: LComp) {
    const comp = c.c;
    for (let i = 0; i < 14; i++) this.addParticle(c.x, c.y, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, "#7dffb4", 6, 0.8, Math.floor(Math.random() * 4));
    if (this.save.autoSell || this.save.inventory.length >= this.stats.cargo) {
      const v = Math.round(comp.value * this.stats.sellMul);
      this.save.credits += v; this.save.earned += v;
      this.toast(`${this.save.autoSell ? "Sold" : "Cargo full - sold"} ${comp.name} +${v}`, "#ffd24d");
    } else {
      this.save.inventory.push(comp);
      this.toast(`Stored ${comp.name}`, "#7dffb4");
    }
    this.markDirty();
  }

  /* ---------------- particles & fx ---------------- */
  addParticle(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number, shape: number, fill = true) {
    if (this.particles.length > 1500) return;
    this.particles.push({ x, y, vx, vy, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, life, max: life, size, shape, color, fill });
  }
  burst(x: number, y: number, color: string, count: number, size: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU, s = speed * (0.3 + Math.random() * 0.9);
      this.addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, size * (0.5 + Math.random()), 0.5 + Math.random() * 0.7, Math.floor(Math.random() * 5), Math.random() < 0.5);
    }
  }
  /** lateral offset of a body segment in enemy-local space (travelling wave) */
  private bendOff(e: Enemy, p: Part) {
    if (!e.bend || p.seg < 0) return 0;
    return e.bend.amp * Math.sin(e.walk * e.bend.speed - p.seg * e.bend.k);
  }
  private partWorld(e: Enemy, p: Part): [number, number] {
    let x = p.cx, y = p.cy;
    if (p.g >= 0) {
      const g = e.groups[p.g];
      const c = Math.cos(g.ang), s = Math.sin(g.ang);
      const dx = x - g.px, dy = y - g.py;
      x = g.px + dx * c - dy * s; y = g.py + dx * s + dy * c;
    }
    y += this.bendOff(e, p);
    const ca = Math.cos(e.a), sa = Math.sin(e.a);
    this._w[0] = e.x + x * ca - y * sa; this._w[1] = e.y + x * sa + y * ca;
    return this._w;
  }
  /** plating takes the hit instead of the body. Returns true if it absorbed it. */
  private shellHit(e: Enemy, dmg: number, src: DmgSrc) {
    const layer = e.shells[e.shells.length - 1];
    if (!layer) return false;
    const dealt = src === "laser" || src === "shock" ? 0 : dmg * SHELL_TAKE;
    layer.hp -= dealt;
    e.shellHit = 0.12;
    e.aggro = true;
    if (layer.hp <= 0) {
      e.shells.pop();
      const n = e.shells.length;
      this.ringFx(e.x, e.y, e.shellR + 10, "#c3ccd6", 520);
      this.burst(e.x, e.y, "#9aa7b4", 16, 5, 300);
      this.shake = Math.max(this.shake, 6);
    }
    return true;
  }
  ringFx(x: number, y: number, max: number, color: string, speed = 600) {
    this.rings.push({ x, y, r: 4, max, speed, dmg: 0, hit: true, color, hurts: false });
  }

  /* ---------------- enemies: creation ---------------- */
  private makeEnemy(spi: number, tier: number, x: number, y: number, key: string, seed: number): Enemy {
    const spd = SPECIES_LIST[spi];
    const b = buildEnemy(spi, tier, seed);
    const roleGroups: Record<string, number[]> = { arm: [], mandible: [], tail: [], leg: [], wing: [] };
    b.groups.forEach((g, i) => { if (roleGroups[g.role]) roleGroups[g.role].push(i); });
    // ability gating: tier 0 enemies have none, tier 1 has one, tier 2 two, and so on
    const gate = Math.min(tier, spd.abilities.length);
    const abil = spd.abilities.filter((a, i) => a.minTier <= tier && i < gate);
    const tags: Record<string, number> = {};
    const weaponParts: number[] = [], shieldParts: number[] = [];
    for (const p of b.parts) {
      tags[p.name] = (tags[p.name] ?? 0) + 1;
      if (p.wpn) weaponParts.push(p.id);
      if (p.shieldR > 0) shieldParts.push(p.id);
    }
    return {
      id: this.idc++, sp: spi, spd, tier, x, y, a: Math.random() * TAU, vx: 0, vy: 0, S: b.size, radius: b.radius,
      parts: b.parts, groups: b.groups, order: b.order, coreId: b.coreId, chunk: key, home: { x, y }, aggro: false, barT: 0,
      speed: spd.speed * (1 + 0.04 * tier), turn: spd.turn / ((1 + tier * 1.05) * (1 + b.radius / (b.size * 6))), mobility: 1, legCount: b.legCount, wingCount: b.wingCount,
      abil, abilCd: abil.map(() => 1 + Math.random() * 3), gap: 1, act: null, stun: 0, wander: { x, y, t: 0 }, roleGroups,
      walk: Math.random() * 6, dead: false, eDmg: 8 * DMG_MUL[tier], keep: spd.keep + b.radius * 0.9, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 2,
      tags, shields: [], weaponParts, shieldParts, dist: 9999, contactCd: 0, hasChange: false, gen: 0,
      dot: 0, dotT: 0, melt: 0, slowT: 0, slowF: 1,
      shells: Array.from({ length: tier >= 2 && !spd.bodyWave ? tier - 1 : 0 }, () => ({ hp: 5 * HP_MUL[tier], max: 5 * HP_MUL[tier] })),
      shellHit: 0, shellR: b.radius + 6,
      bend: spd.bodyWave ? { amp: spd.bodyWave.amp * b.size, k: spd.bodyWave.k, speed: spd.bodyWave.speed } : null,
    };
  }
  private spawnChunk(cx: number, cy: number, key: string) {
    const rng = mulberry32(hash2(cx, cy, 77));
    const ccx = (cx + 0.5) * CH, ccy = (cy + 0.5) * CH;
    if (Math.hypot(ccx, ccy) > WORLD_R + 300) return;
    const zt = zoneTier(Math.hypot(ccx, ccy));
    const cap = Math.min(HARD_MAX, ZONE_CAP[zt]);
    const room = this.enemies.length < cap;
    let n = room ? Math.floor(ZONE_DENS[zt]) : 0;
    if (room && rng() < ZONE_DENS[zt] - n) n++;
    for (let i = 0; i < n; i++) {
      if (this.enemies.length >= cap) break;
      const x = cx * CH + rng() * CH, y = cy * CH + rng() * CH;
      const d = Math.hypot(x, y);
      const rolls = [rng(), rng(), rng(), rng()];
      if (d > WORLD_R - 250) continue;
      if (Math.hypot(x - BASE.x, y - BASE.y) < BASE.safe + 350) continue;
      if (Math.hypot(x - this.player.x, y - this.player.y) < 1200) continue;
      const z2 = zoneTier(d);
      const r = rolls[0];
      const tier = Math.max(0, r < 0.55 ? z2 : r < 0.83 ? z2 - 1 : r < 0.95 ? z2 - 2 : z2 - 3);
      const spi = pickSpecies(x, y, () => rolls[1], z2);
      const pack = SPECIES_LIST[spi].pack[tier];
      for (let k = 0; k < pack; k++) {
        if (this.enemies.length >= cap) break;
        const ox = k === 0 ? 0 : Math.cos(k * 2.4) * (80 + k * 40), oy = k === 0 ? 0 : Math.sin(k * 2.4) * (80 + k * 40);
        this.enemies.push(this.makeEnemy(spi, tier, x + ox, y + oy, key, hash2(cx + k, cy + i, 5)));
      }
    }
    // a snake prowls the mythical core: at most one at a time
    if (zt >= 5 && BOSS_SP >= 0 && rng() < 0.55 && !this.bossAlive()) {
      const bx = cx * CH + rng() * CH, by = cy * CH + rng() * CH;
      const boss = this.makeEnemy(BOSS_SP, 5, bx, by, key, hash2(cx, cy, 999));
      boss.aggro = true;
      this.enemies.push(boss);
      this.bossT = 120;
      this.toast("A SNAKE EMERGES", "#c45cff");
      this.shake = Math.max(this.shake, 20);
    }
  }
  private bossAlive() { return this.enemies.some((e) => e.spd.boss && !e.dead); }
  private manageChunks() {
    const p = this.player;
    const pcx = Math.floor(p.x / CH), pcy = Math.floor(p.y / CH);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const key = `${pcx + dx},${pcy + dy}`;
      if (!this.chunks.has(key)) { this.chunks.add(key); this.spawnChunk(pcx + dx, pcy + dy, key); }
    }
    for (const key of [...this.chunks]) {
      const [a, b] = key.split(",").map(Number);
      if (Math.max(Math.abs(a - pcx), Math.abs(b - pcy)) > 3) this.chunks.delete(key);
    }
    this.enemies = this.enemies.filter((e) => this.chunks.has(e.chunk) || (e.aggro && e.dist < 4000));
    this.topUp();
    this.ensureNearby();
  }

  /** Refill the local population toward ~85% of the player's zone cap. */
  private topUp() {
    const p = this.player;
    const zt = zoneTier(Math.hypot(p.x, p.y));
    const target = Math.round(ZONE_CAP[zt] * 0.85);
    const add = Math.min(3, target - this.enemies.length);
    if (add <= 0) return;
    const keys = [...this.chunks];
    if (!keys.length) return;
    for (let k = 0; k < add; k++) {
      if (this.enemies.length >= HARD_MAX) return;
      const key = keys[Math.floor(Math.random() * keys.length)];
      const [cx, cy] = key.split(",").map(Number);
      for (let tries = 0; tries < 8; tries++) {
        const x = cx * CH + Math.random() * CH, y = cy * CH + Math.random() * CH;
        if (Math.hypot(x, y) > WORLD_R - 250) continue;
        if (Math.hypot(x - BASE.x, y - BASE.y) < BASE.safe + 350) continue;
        if (Math.hypot(x - p.x, y - p.y) < 900) continue;
        const z2 = zoneTier(Math.hypot(x, y));
        const tier = Math.max(0, z2 - (Math.random() < 0.55 ? 0 : 1));
        this.enemies.push(this.makeEnemy(pickSpecies(x, y, Math.random, z2), tier, x, y, key, hash2(cx + tries, cy, 21)));
        break;
      }
    }
  }

  /** Keep a few enemies inside the player's view, even after a killing spree. */
  private ensureNearby() {
    const p = this.player;
    const zt = zoneTier(Math.hypot(p.x, p.y));
    const want = zt >= 4 ? 2 : 4;
    const viewR = this.viewRadius();
    let have = 0;
    for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < viewR * 1.05) have++;
    let need = want - have;
    if (need <= 0) return;
    const base = clamp(viewR * 0.78, 300, 2200);
    while (need-- > 0 && this.enemies.length < HARD_MAX) {
      for (let tries = 0; tries < 8; tries++) {
        const a = Math.random() * TAU;
        const d = base * (0.8 + Math.random() * 0.4);
        const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        if (Math.hypot(x, y) > WORLD_R - 250) continue;
        if (Math.hypot(x - BASE.x, y - BASE.y) < BASE.safe + 350) continue;
        const z2 = zoneTier(Math.hypot(x, y));
        const key = `${Math.floor(x / CH)},${Math.floor(y / CH)}`;
        this.enemies.push(this.makeEnemy(pickSpecies(x, y, Math.random, z2), Math.max(0, z2 - 1), x, y, key, hash2(x | 0, y | 0, 31)));
        break;
      }
    }
  }

  /* ---------------- enemies: part damage ---------------- */
  partAt(e: Enemy, lx: number, ly: number): Part | null {
    /* The core is deliberately huge now, so it can overlap smaller parts.
     * Prefer any ordinary part under the cursor and fall back to the core:
     * the big core stays selectable where it sticks out, without stealing
     * clicks aimed at a leg or plate drawn on top of it. */
    let coreHit: Part | null = null;
    for (let k = e.order.length - 1; k >= 0; k--) {
      const p = e.parts[e.order[k]];
      if (!p.alive) continue;
      let x = lx, y = ly;
      if (p.g >= 0) {
        const g = e.groups[p.g];
        if (g.ang !== 0) {
          const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
          const dx = lx - g.px, dy = ly - g.py;
          x = g.px + dx * c - dy * s; y = g.py + dx * s + dy * c;
        }
      }
      if (p.seg >= 0 && e.bend) y -= this.bendOff(e, p);
      const ddx = x - p.cx, ddy = y - p.cy;
      if (ddx * ddx + ddy * ddy > p.r * p.r) continue;
      if (!pointInPoly(x, y, p.poly)) continue;
      if (p.kind === "core") { coreHit = p; continue; }
      return p;
    }
    return coreHit;
  }
  integrity(e: Enemy) {
    let cur = 0, max = 0;
    for (const p of e.parts) { max += p.maxHp; if (p.alive) cur += p.hp; }
    return max > 0 ? cur / max : 0;
  }
  damagePart(e: Enemy, p: Part, dmg: number, wx: number, wy: number, src: DmgSrc = "kinetic") {
    void src;
    p.hp -= dmg; p.hurt = 0.1; p.barT = 3.5; e.barT = 4;
    e.aggro = true;
    if (wx !== 0 || wy !== 0) for (let i = 0; i < 2; i++) this.addParticle(wx, wy, (Math.random() - 0.5) * 220, (Math.random() - 0.5) * 220, p.stroke, 2.5, 0.25, Math.floor(Math.random() * 3));
    if (p.hp <= 0 && p.alive) this.breakPart(e, p, true);
  }
  private refreshMobility(e: Enemy) {
    if (e.spd.id === "serpent") { e.mobility = 1; return; } // snakes have no legs to lose
    let legs = 0, wings = 0;
    for (const p of e.parts) { if (!p.alive) continue; if (p.kind === "leg") legs++; else if (p.kind === "wing") wings++; }
    if (e.spd.flying) {
      const wf = e.wingCount ? wings / e.wingCount : 0;
      const lf = e.legCount ? legs / e.legCount : 0;
      e.mobility = wf > 0 ? Math.max(0.3, wf) : lf > 0 ? 0.18 : 0;
    } else {
      const lf = e.legCount ? legs / e.legCount : 0;
      e.mobility = lf > 0 ? Math.max(0.2, lf) : 0;
    }
  }
  private breakPart(e: Enemy, p: Part, byPlayer: boolean) {
    if (!p.alive) return;
    p.alive = false; p.hp = 0;
    e.tags[p.name] = (e.tags[p.name] ?? 1) - 1;
    const [wx, wy] = this.partWorld(e, p);
    const px = wx, py = wy;
    const count = clamp(Math.round(5 + p.r / 5), 6, 34);
    this.burst(px, py, p.stroke, count, clamp(p.r * 0.2, 3, 26), 120 + p.r * 2.2);
    if (p.r > 30) this.ringFx(px, py, p.r * 1.8, p.stroke, 500);
    this.shake = Math.max(this.shake, Math.min(14, 2 + p.r / 18));
    if (p.kind === "core") { this.killEnemy(e, px, py); return; }
    if (p.kind === "weapon" || p.kind === "shield") this.explode(e, p, px, py, false);
    if (byPlayer) this.maybeDrop(e, p, px, py);
    this.refreshMobility(e);
    this.checkSever(e);
  }
  private checkSever(e: Enemy) {
    const seen = new Uint8Array(e.parts.length);
    const stack = [e.coreId];
    seen[e.coreId] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      for (const l of e.parts[i].links) if (!seen[l] && e.parts[l].alive) { seen[l] = 1; stack.push(l); }
    }
    const sev: Part[] = [];
    for (const p of e.parts) if (p.alive && !seen[p.id]) sev.push(p);
    if (!sev.length) return;
    const ca = Math.cos(e.a), sa = Math.sin(e.a);
    const pieces: DebrisPiece[] = [];
    let sx = 0, sy = 0;
    const worldPolys: number[][] = [];
    for (const p of sev) {
      const poly: number[] = [];
      const g = p.g >= 0 ? e.groups[p.g] : null;
      for (let i = 0; i < p.poly.length; i += 2) {
        let x = p.poly[i], y = p.poly[i + 1];
        if (g) { const c = Math.cos(g.ang), s = Math.sin(g.ang); const dx = x - g.px, dy = y - g.py; x = g.px + dx * c - dy * s; y = g.py + dx * s + dy * c; }
        y += this.bendOff(e, p);
        poly.push(e.x + x * ca - y * sa, e.y + x * sa + y * ca);
      }
      worldPolys.push(poly);
      for (let i = 0; i < poly.length; i += 2) { sx += poly[i]; sy += poly[i + 1]; }
    }
    let nPts = 0;
    for (const w of worldPolys) nPts += w.length / 2;
    const cx = sx / nPts, cy = sy / nPts;
    sev.forEach((p, i) => pieces.push({ poly: worldPolys[i].map((v, k) => (k % 2 === 0 ? v - cx : v - cy)), stroke: p.stroke, fill: p.fill }));
    const away = Math.atan2(cy - e.y, cx - e.x);
    this.debris.push({ x: cx, y: cy, vx: Math.cos(away) * 90 + e.vx, vy: Math.sin(away) * 90 + e.vy, rot: 0, vr: (Math.random() - 0.5) * 2.2, life: 1.3, max: 1.3, pieces });
    // largest severed part may drop
    let big = sev[0];
    for (const p of sev) { e.tags[p.name] = (e.tags[p.name] ?? 1) - 1; if (p.area > big.area) big = p; }
    for (const p of sev) p.alive = false;
    this.shake = Math.max(this.shake, 6);
    if (Math.random() < 0.65) { const w = this.partWorld(e, big); this.maybeDrop(e, big, w[0], w[1], 1.0); }
    this.refreshMobility(e);
  }
  private killEnemy(e: Enemy, x: number, y: number) {
    if (e.dead) return;
    e.dead = true;
    if (e.spd.boss) {
      this.bossT = 150;
      this.toast("THE WORLD SERPENT IS SLAIN", "#c54cff");
      this.shake = Math.max(this.shake, 24);
    }
    this.save.kills++;
    const firstSeen = this.save.bestiary[e.spd.id] === undefined;
    if (firstSeen || (this.save.bestiary[e.spd.id] ?? -1) < e.tier) this.save.bestiary[e.spd.id] = e.tier;
    if (firstSeen) {
      this.discovery = { name: e.spd.name, t: 5 };
    }
    this.dirty = true;
    let i = 0;
    for (const q of e.parts) {
      if (!q.alive) continue;
      q.alive = false;
      i++;
      const [wx, wy] = this.partWorld(e, q);
      if (e.parts.length < 70 || i % 2 === 0) this.burst(wx, wy, q.stroke, clamp(Math.round(q.r / 9), 3, 14), clamp(q.r * 0.16, 3, 22), 160 + q.r * 2);
      if (q.wpn || q.kind === "shield") this.explode(e, q, wx, wy, true);
    }
    this.ringFx(x, y, e.radius * 1.4, "#ffffff", 900);
    this.shake = Math.max(this.shake, 16);
    this.maybeDrop(e, e.parts[e.coreId], x, y);
  }
  private rollTier(etier: number, isCore: boolean) {
    const luck = this.stats.luck;
    if (isCore && Math.random() < 0.1 + luck * 0.2) return etier;
    const top = etier - 1;
    if (top < 0) return 0;
    let r = top;
    const q = 0.5 * (1 - luck);
    while (r > 0 && Math.random() < q) r--;
    return r;
  }
  private maybeDrop(e: Enemy, p: Part, x: number, y: number, mul = 1) {
    const isCore = p.kind === "core";
    const boss = !!e.spd.boss;
    const chance = boss ? 1 : isCore ? 0.92 : this.stats.dropChance * KIND_DROP[p.kind] * Math.min(1, 40 / e.parts.length) * mul;
    if (Math.random() > chance) return;
    const tier = boss ? 5 : this.rollTier(e.tier, isCore);
    const poly = p.poly.map((v, i) => +(v - (i % 2 === 0 ? p.cx : p.cy)).toFixed(1));
    const comp: Comp = {
      id: uid(), species: e.spd.name, name: `${e.spd.name} ${p.name}`, kind: p.kind, tier, poly, area: p.area,
      mass: compMass(p.area), hue: e.spd.hue, value: compValue(p.area, tier, p.kind),
    };
    const a = Math.random() * TAU, s = 60 + Math.random() * 120;
    this.comps.push({ id: this.idc++, c: comp, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, a: e.a, va: (Math.random() - 0.5) * 3, r: p.r, hooks: [], stress: 0, ttl: 160, born: this.t });
    if (this.comps.length > 90) {
      const i = this.comps.findIndex((c) => !c.hooks.length);
      if (i >= 0) this.comps.splice(i, 1);
    }
  }
  private explode(e: Enemy, p: Part, x: number, y: number, cascade: boolean) {
    const R = p.r * 3 + 40;
    const dmg = e.eDmg * (p.kind === "weapon" ? 1.8 : 1.3) * (cascade ? 0.5 : 1);
    const pl = this.player;
    const d = Math.hypot(pl.x - x, pl.y - y);
    if (d < R + SHIP_R) this.hurtPlayer(dmg * (1 - clamp(d / (R + SHIP_R), 0, 1) * 0.6), { kb: 500, kbx: (pl.x - x) / (d || 1), kby: (pl.y - y) / (d || 1) });
    this.ringFx(x, y, R, "#ff9d4d", 700);
    this.burst(x, y, "#ffb04d", clamp(Math.round(R / 14), 8, 30), clamp(R * 0.08, 4, 22), 260 + R);
    this.shake = Math.max(this.shake, Math.min(18, 6 + R / 40));
    if (cascade || this.expDepth > 3) return;
    this.expDepth++;
    this.areaDamage(x, y, R, p.maxHp * 0.5, p);
    this.expDepth--;
  }
  areaDamage(x: number, y: number, R: number, dmg: number, skip: Part | null, src: DmgSrc = "explosive") {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - y;
      if (dx * dx + dy * dy > (R + e.radius) * (R + e.radius)) continue;
      if (e.shells.length && Math.hypot(dx, dy) < R + e.shellR) { this.shellHit(e, dmg, src); continue; }
      for (const q of e.parts) {
        if (!q.alive || q === skip) continue;
        const w = this.partWorld(e, q);
        const d = Math.hypot(w[0] - x, w[1] - y);
        if (d < R + q.r * 0.5) this.damagePart(e, q, dmg * (1 - clamp(d / (R + 1), 0, 1) * 0.5), 0, 0);
      }
    }
  }

  /* ---------------- player damage ---------------- */
  hurtPlayer(dmg: number, o: { poison?: number; kb?: number; kbx?: number; kby?: number; dot?: boolean } = {}) {
    const p = this.player, st = this.stats;
    if (p.dead || this.inSafe()) return;
    if (this.admin.on && this.admin.health) { p.hp = st.hull; p.shield = st.shieldMax; return; }
    if (!o.dot && st.dodge > 0 && Math.random() < st.dodge) {
      this.addParticle(p.x + (Math.random() - 0.5) * 40, p.y + (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, "#c77dff", 4, 0.32, 3, false);
      return;
    }
    let d = dmg * (1 - st.armor) * (1 - st.reactive);
    if (st.kinetic > 0 && p.shield > 0) d *= 1 - st.kinetic;
    p.hitT = 0; p.shieldT = st.shieldDelay;
    if (p.barrier > 0) { const a = Math.min(p.barrier, d); p.barrier -= a; d -= a; }
    const shieldBefore = p.shield;
    if (p.shield > 0) { const a = Math.min(p.shield, d); p.shield -= a; d -= a; }
    if (shieldBefore > 0 && p.shield <= 0 && st.novaOnHit > 0) {
      this.ringFx(p.x, p.y, 300, "#ffb04d", 800);
      this.areaDamage(p.x, p.y, 300, st.dmg * 4 * st.novaOnHit, null);
      this.burst(p.x, p.y, "#ffb04d", 22, 7, 420);
    }
    p.hp -= d;
    if (o.poison) { p.poison = Math.max(p.poison, o.poison * (1 - st.poisonResist)); p.poisonT = 4; }
    if (o.kb) { const k = o.kb * (1 - st.dampers); p.vx += (o.kbx ?? 0) * k; p.vy += (o.kby ?? 0) * k; }
    if (!o.dot) {
      p.flash = 0.18;
      this.shake = Math.max(this.shake, clamp(d / (st.hull * 0.1) * 4, 2, 14));
      if (p.tpT > 0) { p.tpT = 0; this.toast("Recall interrupted!", "#ff8a8a"); }
      if (st.thorn > 0 && p.thornCd <= 0) { p.thornCd = 1.5; this.ringFx(p.x, p.y, 260, "#ff8a4d", 700); this.areaDamage(p.x, p.y, 260, st.dmg * 3 * st.thorn, null); }
    }
    if (p.hp <= 0) this.killPlayer();
  }
  private killPlayer() {
    const p = this.player;
    p.dead = true; p.hp = 0; p.respawn = 3; p.tpT = 0; p.pull = null;
    p.barrier = 0; p.barrierMax = 0; p.barrierT = 0; p.overT = 0;
    this.lock = null;
    this.wells = [];
    this.burst(p.x, p.y, "#7df9ff", 40, 10, 500);
    this.ringFx(p.x, p.y, 380, "#7df9ff", 800);
    this.shake = 20;
    for (const h of this.harpoons) if (h.state !== 0) { this.retract(h); }
    this.toast("Core destroyed — reforming at the nest...", "#ff6b81");
  }
  private respawnPlayer() {
    const p = this.player;
    p.dead = false; p.x = BASE.x; p.y = BASE.y - 180; p.vx = p.vy = 0; p.hp = this.stats.hull; p.shield = this.stats.shieldMax;
    p.poison = 0; p.slowT = 0; p.pull = null;
    p.barrier = 0; p.barrierMax = 0; p.barrierT = 0; p.overT = 0;
    this.cam.x = p.x; this.cam.y = p.y;
  }
  applySlow(f: number, t: number) {
    const r = this.stats.dampers;
    const ff = 1 - (1 - f) * (1 - r);
    this.player.slowF = Math.min(this.player.slowF, ff);
    this.player.slowT = Math.max(this.player.slowT, t * (1 - r * 0.5));
  }

  /* ---------------- projectiles ---------------- */
  spawnProj(src: Enemy, x: number, y: number, ang: number, d: AbilityDef, o: { type?: ProjType; speed?: number; life?: number; dmgMul?: number } = {}) {
    const speed = o.speed ?? d.speed ?? 500;
    const type = o.type ?? d.kind ?? "bolt";
    const size = (d.size ?? 6) * (1 + 0.14 * src.tier);
    this.eprojs.push({
      x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: o.life ?? d.life ?? 2, dmg: src.eDmg * d.dmg * (o.dmgMul ?? 1), r: size,
      hue: src.spd.hue, type, homing: d.homing ?? 0, slow: d.slow ?? 0, slowT: d.slowT ?? 1.5, poison: d.poison ? src.eDmg * d.poison : 0,
      pierce: !!d.pierce, hp: 1, speed, src, puddle: null,
    });
  }
  private updateEProjs(dt: number) {
    const p = this.player, st = this.stats;
    for (let i = this.eprojs.length - 1; i >= 0; i--) {
      const pr = this.eprojs[i];
      pr.life -= dt;
      if (pr.type === "missile") {
        const want = Math.atan2(p.y - pr.y, p.x - pr.x), cur = Math.atan2(pr.vy, pr.vx);
        const na = cur + clamp(angDiff(cur, want), -pr.homing * dt, pr.homing * dt);
        const sp = Math.min(pr.speed, Math.hypot(pr.vx, pr.vy) + 260 * dt);
        pr.vx = Math.cos(na) * sp; pr.vy = Math.sin(na) * sp;
        if (Math.random() < 0.6) this.addParticle(pr.x, pr.y, 0, 0, "#ffb04d", 3, 0.3, 3, false);
      } else if (pr.homing > 0) {
        const want = Math.atan2(p.y - pr.y, p.x - pr.x), cur = Math.atan2(pr.vy, pr.vx);
        const na = cur + clamp(angDiff(cur, want), -pr.homing * dt, pr.homing * dt);
        const sp = Math.hypot(pr.vx, pr.vy);
        pr.vx = Math.cos(na) * sp; pr.vy = Math.sin(na) * sp;
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      let dead = pr.life <= 0;
      if (!dead && pr.type !== "glob" && !p.dead) {
        const dd = Math.hypot(pr.x - p.x, pr.y - p.y);
        if (dd < pr.r + SHIP_R) {
          if (st.nullField > 0 && p.shield > 0 && p.nullCd <= 0 && Math.random() < 0.35 + 0.3 * st.nullField) {
            p.nullCd = 1.4 / (0.5 + st.nullField);
            p.shield = Math.max(0, p.shield - pr.dmg * 0.2);
            p.shieldT = st.shieldDelay;
            this.ringFx(pr.x, pr.y, 44, "#c77dff", 350);
            dead = true;
          } else if (st.reflect && p.shield > 0 && (pr.type === "bolt" || pr.type === "orb" || pr.type === "wave")) {
            p.shield = Math.max(0, p.shield - pr.dmg * 0.5);
            p.shieldT = st.shieldDelay;
            this.bullets.push({ x: pr.x, y: pr.y, vx: -pr.vx * 1.2, vy: -pr.vy * 1.2, life: 1.2, dmg: Math.max(st.dmg * 0.5, pr.dmg * 0.8), pierce: 0, hit: [], kind: 0, target: null, crit: false });
            this.ringFx(pr.x, pr.y, 40, "#7df9ff", 300);
            dead = true;
          } else if (pr.type === "hook") {
            if (!this.inSafe()) { p.pull = { e: pr.src!, t: 1.8 }; this.toast("Grabbed! Break free or fight!", "#ff8a8a"); }
            this.hurtPlayer(pr.dmg);
            dead = true;
          } else {
            this.hurtPlayer(pr.dmg, { poison: pr.poison, kb: pr.type === "missile" ? 250 : 0, kbx: pr.vx / (pr.speed || 1), kby: pr.vy / (pr.speed || 1) });
            if (pr.slow > 0) this.applySlow(pr.slow, pr.slowT);
            if (pr.type === "missile") { this.ringFx(pr.x, pr.y, 90, "#ffb04d", 500); this.burst(pr.x, pr.y, "#ffb04d", 10, 5, 260); }
            else this.burst(pr.x, pr.y, `hsl(${pr.hue},100%,65%)`, 4, 3, 160);
            if (!pr.pierce || pr.type === "missile") dead = true;
          }
        }
      }
      if (!dead) {
        for (const h of this.harpoons) {
          if (h.state === 0) continue;
          for (let k = 2; k < N_ROPE - 1; k += 2) {
            const nd = h.nodes[k];
            if (Math.abs(nd.x - pr.x) < pr.r + 6 && Math.abs(nd.y - pr.y) < pr.r + 6) {
              h.hp -= pr.dmg * 0.45;
              this.burst(nd.x, nd.y, "#ff5d73", 3, 3, 120);
              if (!pr.pierce) dead = true;
              break;
            }
          }
          if (dead) break;
        }
      }
      if (dead) {
        if (pr.type === "glob" && pr.puddle) this.puddles.push({ x: pr.x, y: pr.y, r: pr.puddle.r, life: 6, max: 6, arm: 0, dps: pr.puddle.dps, slow: pr.puddle.slow, hue: pr.hue });
        if (pr.type === "missile" && pr.life <= 0) this.burst(pr.x, pr.y, "#ffb04d", 6, 4, 180);
        this.eprojs.splice(i, 1);
      }
    }
  }

  /* ---------------- enemy AI ---------------- */
  private startAct(e: Enemy, i: number) {
    const def = e.abil[i];
    e.act = { i, def, t: 0, ph: 0, hit: false, dir: e.a, fired: false };
    e.abilCd[i] = def.cd * (0.85 + Math.random() * 0.3);
  }
  private alive(e: Enemy, name?: string) { return !name || (e.tags[name] ?? 0) > 0; }
  private chooseAct(e: Enemy, dist: number, toP: number) {
    const n = e.abil.length;
    if (!n) return;
    const start = Math.floor(Math.random() * n);
    const face = Math.abs(angDiff(e.a, toP));
    const d = dist - SHIP_R;
    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      const a = e.abil[i];
      if (e.abilCd[i] > 0) continue;
      if (!this.alive(e, a.needs)) continue;
      if (a.type === "swing" && !(e.roleGroups[a.role!] ?? []).length) continue;
      const minD = (a.minS ?? 0) * e.S + (a.minP ?? 0);
      let maxD = (a.maxS ?? 0) * e.S + (a.maxP ?? 0);
      if (!a.maxS && !a.maxP) maxD = Infinity;
      if (d < minD || d > maxD) continue;
      if ((a.type === "charge") && (e.mobility < 0.3 || face > 0.7)) continue;
      if (a.type === "swing" && face > 0.9) continue;
      if ((a.type === "shoot" || a.type === "pull" || a.type === "spit") && face > 1.1) continue;
      if (a.type === "pull" && this.player.pull) continue;
      this.startAct(e, i);
      return;
    }
  }
  private ease(t: number) { return t * t * (3 - 2 * t); }

  private runAct(e: Enemy, dt: number, toP: number, dist: number) {
    const a = e.act!, d = a.def, p = this.player;
    a.t += dt;
    const S = e.S;
    const turnTo = (rate: number) => { e.a += clamp(angDiff(e.a, toP), -e.turn * rate * dt, e.turn * rate * dt); };
    const damp = (k: number) => { const f = Math.exp(-k * dt); e.vx *= f; e.vy *= f; };
    const done = () => { e.act = null; e.gap = 0.4 + Math.random() * 0.6; };
    const mx = e.x + Math.cos(e.a) * e.spd.muzzle * S, my = e.y + Math.sin(e.a) * e.spd.muzzle * S;
    const aim = (speed: number): number => {
      const lt = (Math.hypot(p.x - mx, p.y - my) / speed) * 0.7;
      return Math.atan2(p.y + p.vy * lt - my, p.x + p.vx * lt - mx);
    };
    const count = () => Math.min(24, (d.n ?? 1) + Math.floor((d.ns ?? 0) * e.tier));
    switch (d.type) {
      case "swing": {
        const groups = e.roleGroups[d.role!] ?? [];
        const W = d.wind, ST = 0.2, R = 0.5;
        const sc = d.role === "mandible" ? 0.55 : 1;
        let ang = 0;
        if (a.t < W) { ang = 0.9 * this.ease(a.t / W); turnTo(0.7); }
        else if (a.t < W + ST) {
          const f = (a.t - W) / ST;
          ang = lerp(0.9, -1.0, f);
          if (!a.hit && this.swingHit(e, d)) {
            a.hit = true;
            const k = Math.hypot(p.x - e.x, p.y - e.y) || 1;
            this.hurtPlayer(e.eDmg * d.dmg, { poison: d.poison ? e.eDmg * d.poison : 0, kb: 420, kbx: (p.x - e.x) / k, kby: (p.y - e.y) / k });
            this.shake = Math.max(this.shake, 8);
          }
          this.swingRope(e, d);
        } else if (a.t < W + ST + R) { ang = lerp(-1.0, 0, this.ease((a.t - W - ST) / R)); }
        else { for (const gi of groups) e.groups[gi].ang = 0; done(); return; }
        for (const gi of groups) { const g = e.groups[gi]; g.ang = g.sign * ang * sc * (d.role === "tail" ? 1 : 1); }
        damp(2);
        break;
      }
      case "charge": {
        if (a.ph === 0) {
          turnTo(1.6); damp(5);
          if (a.t >= d.wind) { a.ph = 1; a.t = 0; a.dir = e.a; }
        } else if (a.ph === 1) {
          const sp = (d.speed ?? 600) * (0.5 + 0.5 * e.mobility);
          e.vx = Math.cos(a.dir) * sp; e.vy = Math.sin(a.dir) * sp;
          if (!a.hit && this.touching(e, 6)) {
            a.hit = true;
            this.hurtPlayer(e.eDmg * d.dmg, { poison: d.poison ? e.eDmg * d.poison : 0, kb: 600, kbx: Math.cos(a.dir), kby: Math.sin(a.dir) });
            this.shake = Math.max(this.shake, 10);
          }
          if (a.t >= (d.dur ?? 0.5)) { a.ph = 2; e.stun = 0.7; done(); }
        }
        break;
      }
      case "shoot": {
        turnTo(0.5); damp(4);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          const sp = d.speed ?? 500;
          const base = aim(sp);
          const n = count();
          const spread = d.spread ?? 0.3;
          for (let i = 0; i < n; i++) {
            const off = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
            this.spawnProj(e, mx, my, base + off, d, { life: d.life ?? ((d.maxP ?? 800) + 200) / sp });
          }
          this.burst(mx, my, `hsl(${e.spd.hue},100%,70%)`, 5, 3, 160);
        }
        if (a.t >= d.wind + 0.3) done();
        break;
      }
      case "nova": {
        turnTo(0.3); damp(5);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          const n = count();
          const off = Math.random() * TAU;
          for (let i = 0; i < n; i++) {
            const ang = off + (i / n) * TAU;
            this.spawnProj(e, e.x + Math.cos(ang) * e.radius * 0.35, e.y + Math.sin(ang) * e.radius * 0.35, ang, d, { life: d.life ?? 1.5 });
          }
          this.ringFx(e.x, e.y, 120 + S, `hsl(${e.spd.hue},100%,70%)`, 400);
          this.shake = Math.max(this.shake, 6);
        }
        if (a.t >= d.wind + 0.35) done();
        break;
      }
      case "ring": {
        damp(5); turnTo(0.3);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          this.rings.push({ x: e.x, y: e.y, r: e.radius * 0.5, max: Math.max(280, (d.size ?? 5) * S), speed: d.speed ?? 420, dmg: e.eDmg * d.dmg, hit: false, color: `hsl(${e.spd.hue},100%,68%)`, hurts: true });
          this.shake = Math.max(this.shake, 10);
        }
        if (a.t >= d.wind + 0.4) done();
        break;
      }
      case "pull": {
        turnTo(0.6); damp(4);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          const sp = d.speed ?? 700;
          this.spawnProj(e, mx, my, Math.atan2(p.y - my, p.x - mx), d, { type: "hook", life: ((d.maxP ?? 800) + 100) / sp });
        }
        if (a.t >= d.wind + 0.4) done();
        break;
      }
      case "spit": {
        turnTo(0.5); damp(4);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          const sp = d.speed ?? 480;
          const dd = Math.hypot(p.x - mx, p.y - my);
          const lt = clamp(dd / sp, 0.35, 2);
          const tx = p.x + p.vx * lt * 0.6, ty = p.y + p.vy * lt * 0.6;
          const ang = Math.atan2(ty - my, tx - mx);
          const dist2 = Math.hypot(tx - mx, ty - my);
          const life = Math.max(0.3, dist2 / sp);
          this.spawnProj(e, mx, my, ang, d, { type: "glob", life, speed: sp });
          const pr = this.eprojs[this.eprojs.length - 1];
          pr.puddle = { r: (d.size ?? 1.3) * S, dps: e.eDmg * d.dmg, slow: 0.6 };
          pr.r = 10 + S * 0.15;
        }
        if (a.t >= d.wind + 0.3) done();
        break;
      }
      case "summon": {
        turnTo(0.4); damp(4);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          /* Summons are capped hard: children cannot summon again (gen 2), and the
           * brood never pushes the world past the global ceiling. */
          if (e.gen < 2) {
            const room = Math.max(0, HARD_MAX - this.enemies.length);
            const n = Math.min(room, 4, Math.max(1, Math.round((d.n ?? 1) * (0.7 + 0.25 * e.tier))));
            for (let k = 0; k < n; k++) {
              const ang = (k / Math.max(1, n)) * TAU + Math.random() * 0.4;
              const child = this.makeEnemy(e.sp, Math.max(0, e.tier - 1), e.x + Math.cos(ang) * e.radius * 0.9, e.y + Math.sin(ang) * e.radius * 0.9, e.chunk, (Math.random() * 1e9) | 0);
              child.gen = e.gen + 1;
              child.aggro = true;
              this.enemies.push(child);
            }
          }
          this.ringFx(e.x, e.y, e.radius * 2.2, `hsl(${e.spd.hue},100%,68%)`, 520);
        }
        if (a.t >= d.wind + 0.5) done();
        break;
      }
      case "blink": {
        turnTo(0.5); damp(6);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          this.burst(e.x, e.y, `hsl(${e.spd.hue},100%,65%)`, 16, 6, 280);
          const ang = Math.random() * TAU;
          const rr = Math.min(700, (d.maxP ?? 600) * (0.55 + Math.random() * 0.45));
          e.x = p.x + Math.cos(ang) * rr;
          e.y = p.y + Math.sin(ang) * rr;
          e.vx = e.vy = 0;
          e.a = Math.atan2(p.y - e.y, p.x - e.x);
          this.burst(e.x, e.y, `hsl(${e.spd.hue},100%,65%)`, 20, 7, 320);
          if (Math.hypot(p.x - e.x, p.y - e.y) < e.radius + 140) {
            const k = Math.hypot(p.x - e.x, p.y - e.y) || 1;
            this.hurtPlayer(e.eDmg * (d.dmg ?? 0.5), { kb: 420, kbx: (p.x - e.x) / k, kby: (p.y - e.y) / k });
          }
        }
        if (a.t >= d.wind + 0.4) done();
        break;
      }
      case "drain": {
        turnTo(0.8); damp(2);
        const near = Math.hypot(p.x - e.x, p.y - e.y) < e.radius + 260 + e.S;
        if (a.t >= d.wind && near && !p.dead) {
          a.fired = true;
          const tick = e.eDmg * d.dmg * dt;
          this.hurtPlayer(tick, { dot: true });
          const alive = e.parts.filter((q) => q.alive && q.kind !== "leg" && q.kind !== "wing");
          const q = alive.length ? alive[Math.floor(Math.random() * alive.length)] : null;
          if (q) q.hp = Math.min(q.maxHp, q.hp + tick * 1.6);
          if (Math.random() < 0.5) {
            const col = `hsl(${e.spd.hue},100%,65%)`;
            const t = Math.random();
            this.addParticle(e.x + (p.x - e.x) * t, e.y + (p.y - e.y) * t, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, col, 3, 0.3, 3, false);
          }
        }
        if (a.t >= (d.dur ?? 1.5)) done();
        break;
      }
      case "cloud": {
        turnTo(0.5); damp(4);
        if (!a.fired && a.t >= d.wind) {
          a.fired = true;
          const lt = 0.6;
          const x = d.atPlayer ? p.x + p.vx * lt : e.x, y = d.atPlayer ? p.y + p.vy * lt : e.y;
          this.puddles.push({ x, y, r: (d.size ?? 3) * S, life: 6.5, max: 6.5, arm: d.atPlayer ? 0.8 : 0.5, dps: e.eDmg * d.dmg, slow: d.slow ?? 0.6, hue: e.spd.hue });
        }
        if (a.t >= d.wind + 0.3) done();
        break;
      }
    }
    void dist;
  }
  private swingHit(e: Enemy, d: AbilityDef) {
    const p = this.player;
    const dx = p.x - e.x, dy = p.y - e.y;
    const ca = Math.cos(e.a), sa = Math.sin(e.a);
    const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
    for (const q of e.parts) {
      if (!q.alive || q.g < 0) continue;
      const g = e.groups[q.g];
      if (g.role !== d.role) continue;
      const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
      const ddx = lx - g.px, ddy = ly - g.py;
      const x = g.px + ddx * c - ddy * s, y = g.py + ddx * s + ddy * c;
      if (Math.hypot(x - q.cx, y - q.cy) > q.r + SHIP_R + 4) continue;
      if (distToPoly(x, y, q.poly) < SHIP_R + 3) return true;
    }
    return false;
  }
  private swingRope(e: Enemy, d: AbilityDef) {
    const ca = Math.cos(e.a), sa = Math.sin(e.a);
    for (const h of this.harpoons) {
      if (h.state === 0) continue;
      for (let k = 2; k < N_ROPE - 1; k += 2) {
        const nd = h.nodes[k];
        const dx = nd.x - e.x, dy = nd.y - e.y;
        if (dx * dx + dy * dy > (e.radius + 20) * (e.radius + 20)) break;
        const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        for (const q of e.parts) {
          if (!q.alive || q.g < 0) continue;
          const g = e.groups[q.g];
          if (g.role !== d.role) continue;
          const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
          const ddx = lx - g.px, ddy = ly - g.py;
          if (pointInPoly(g.px + ddx * c - ddy * s, g.py + ddx * s + ddy * c, q.poly)) {
            h.hp -= e.eDmg * d.dmg * 0.04 + 0.5;
            this.burst(nd.x, nd.y, "#ff5d73", 2, 3, 100);
            break;
          }
        }
      }
    }
  }
  /** is the player's ship touching a solid part of this enemy? */
  private touching(e: Enemy, extra = 0) {
    const p = this.player;
    const dx = p.x - e.x, dy = p.y - e.y;
    if (dx * dx + dy * dy > (e.radius + SHIP_R + 20) * (e.radius + SHIP_R + 20)) return false;
    const ca = Math.cos(e.a), sa = Math.sin(e.a);
    const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
    for (const q of e.parts) {
      if (!q.alive || q.kind === "wing" || q.kind === "leg") continue;
      let x = lx, y = ly;
      if (q.g >= 0) { const g = e.groups[q.g]; const c = Math.cos(-g.ang), s = Math.sin(-g.ang); const ddx = lx - g.px, ddy = ly - g.py; x = g.px + ddx * c - ddy * s; y = g.py + ddx * s + ddy * c; }
      if (q.seg >= 0 && e.bend) y -= this.bendOff(e, q);
      if (Math.hypot(x - q.cx, y - q.cy) > q.r + SHIP_R + extra) continue;
      if (distToPoly(x, y, q.poly) < SHIP_R + extra) return true;
    }
    return false;
  }

  private updateEnemy(e: Enemy, dt: number, dx: number, dy: number, dist: number) {
    const p = this.player;
    for (const q of e.parts) { if (q.hurt > 0) q.hurt -= dt; if (q.barT > 0) q.barT -= dt; }
    if (e.barT > 0) e.barT -= dt;
    if (e.contactCd > 0) e.contactCd -= dt;
    if (e.melt > 0) e.melt = Math.max(0, e.melt - dt * 0.3);
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 1; }
    if (e.dotT > 0) {
      e.dotT -= dt;
      const alive = e.parts.filter((q) => q.alive);
      const q = alive.length ? alive[Math.floor(Math.random() * alive.length)] : null;
      if (q) this.damagePart(e, q, e.dot * dt, 0, 0);
      if (e.dotT <= 0) e.dot = 0;
    }
    const safe = this.inSafe() || p.dead;
    // higher tiers refuse to let you disengage: bigger aggro radius and a much longer leash
    const aggroR = (650 + Math.min(e.radius, 700) * 1.2) * (1 + 0.12 * e.tier);
    if (!e.aggro) { if (!safe && dist < aggroR) e.aggro = true; }
    else if (safe || dist > aggroR * (2.4 + 0.6 * e.tier)) e.aggro = false;
    for (let i = 0; i < e.abilCd.length; i++) if (e.abilCd[i] > 0) e.abilCd[i] -= dt;
    if (e.gap > 0) e.gap -= dt;

    const toP = Math.atan2(dy, dx);
    const sp = e.speed * e.mobility * (e.slowT > 0 ? e.slowF : 1) * (e.aggro && e.tier >= 3 ? 1 + 0.03 * e.tier : 1);
    const moving = Math.hypot(e.vx, e.vy) / (e.speed + 1);
    e.walk += dt * (3 + moving * 9);

    // group animation
    for (const g of e.groups) {
      switch (g.role) {
        case "leg": g.ang = Math.sin(e.walk + g.phase) * g.amp * Math.min(1, moving * 1.6 + 0.04); break;
        case "wing": g.ang = Math.sin(this.t * (e.spd.flying ? 24 : 7) + g.phase) * g.amp * g.sign * (e.spd.flying ? Math.max(0.3, e.mobility) : 0.2); break;
        case "sway": g.ang = Math.sin(this.t * 2 + g.phase) * g.amp; break;
        case "arm": case "mandible": case "tail":
          if (!(e.act && e.act.def.type === "swing" && e.act.def.role === g.role)) g.ang = Math.sin(this.t * 1.4 + g.phase + g.sign) * (g.role === "tail" ? 0.07 : 0.05) * g.sign;
          break;
        default: break;
      }
    }
    // shields
    e.shields.length = 0;
    for (const id of e.shieldParts) {
      const q = e.parts[id];
      if (!q.alive) continue;
      if (q.shieldDown > 0) { q.shieldDown -= dt; if (q.shieldDown <= 0) q.shieldHp = q.shieldMax * 0.4; }
      else {
        if (q.shieldHit > 0) q.shieldHit -= dt;
        else if (q.shieldHp < q.shieldMax) q.shieldHp = Math.min(q.shieldMax, q.shieldHp + q.shieldMax * 0.15 * dt);
        const w = this.partWorld(e, q);
        e.shields.push({ x: w[0], y: w[1], r: q.shieldR, part: q });
      }
    }
    // weapons
    for (const id of e.weaponParts) {
      const q = e.parts[id];
      if (!q.alive) continue;
      const g = e.groups[q.g];
      const w = this.partWorld(e, q);
      const wx = w[0], wy = w[1];
      if (e.aggro && !p.dead) {
        const aim = Math.atan2(p.y - wy, p.x - wx);
        const rel = angDiff(e.a, aim);
        g.ang += clamp(angDiff(g.ang, rel), -2.2 * dt, 2.2 * dt);
        q.cd -= dt;
        const dd = Math.hypot(p.x - wx, p.y - wy);
        const range = q.wpn === "gun" ? 900 : 1150;
        if (q.cd <= 0 && dd < range && Math.abs(angDiff(g.ang, rel)) < 0.22 && e.stun <= 0) {
          const dir = e.a + g.ang;
          const mx = wx + Math.cos(dir) * q.muzzle, my = wy + Math.sin(dir) * q.muzzle;
          if (q.wpn === "gun") {
            q.cd = (1.1 + Math.random() * 0.6) / (1 + 0.04 * e.tier);
            this.eprojs.push({ x: mx, y: my, vx: Math.cos(dir) * 560, vy: Math.sin(dir) * 560, life: 1.9, dmg: e.eDmg * 0.4, r: 5 + e.tier, hue: 8, type: "bolt", homing: 0, slow: 0, slowT: 0, poison: 0, pierce: false, hp: 1, speed: 560, src: e, puddle: null });
          } else {
            q.cd = 4.5 + Math.random() * 1.5;
            this.eprojs.push({ x: mx, y: my, vx: Math.cos(dir) * 200, vy: Math.sin(dir) * 200, life: 5, dmg: e.eDmg * 1.1, r: 8 + e.tier * 1.5, hue: 25, type: "missile", homing: 2.0, slow: 0, slowT: 0, poison: 0, pierce: false, hp: 1, speed: 330, src: e, puddle: null });
          }
          this.burst(mx, my, "#ff9d4d", 3, 3, 140);
        }
      } else g.ang *= Math.exp(-2 * dt);
    }

    // ---- behaviour / movement ----
    let tvx = 0, tvy = 0;
    let faceTo = e.a;
    let turnMul = 0.3 + 0.7 * e.mobility;
    if (e.stun > 0) { e.stun -= dt; e.vx *= Math.exp(-4 * dt); e.vy *= Math.exp(-4 * dt); }
    else if (e.act) {
      this.runAct(e, dt, toP, dist);
    } else {
      if (e.aggro && !p.dead) {
        const weave = e.bend ? Math.sin(this.t * (e.spd.boss ? 1.7 : 2.6) + e.id) * (e.spd.boss ? 0.22 : 0.12) : 0;
        faceTo = toP + weave;
        const nx = dx / (dist || 1), ny = dy / (dist || 1);
        if (e.spd.ranged) {
          e.strafeT -= dt;
          if (e.strafeT <= 0) { e.strafe = -e.strafe; e.strafeT = 1.5 + Math.random() * 2.5; }
          let radial = 0;
          if (dist < e.keep * 0.8) radial = -1; else if (dist > e.keep * 1.15) radial = 1;
          tvx = (nx * radial - ny * e.strafe * 0.7) * sp;
          tvy = (ny * radial + nx * e.strafe * 0.7) * sp;
        } else {
          const stop = e.S * 0.8 + SHIP_R;
          if (dist > stop) {
            const f = Math.max(0, Math.cos(angDiff(e.a, toP)));
            tvx = Math.cos(e.a) * sp * f; tvy = Math.sin(e.a) * sp * f;
          }
        }
        if (e.gap <= 0) this.chooseAct(e, dist, toP);
      } else {
        const w = e.wander;
        w.t -= dt;
        const hd = Math.hypot(e.x - e.home.x, e.y - e.home.y);
        if (w.t <= 0 || Math.hypot(e.x - w.x, e.y - w.y) < 40) {
          const a = Math.random() * TAU, r = Math.random() * 350;
          w.x = hd > 700 ? e.home.x : e.home.x + Math.cos(a) * r;
          w.y = hd > 700 ? e.home.y : e.home.y + Math.sin(a) * r;
          w.t = 3 + Math.random() * 4;
        }
        const ta = Math.atan2(w.y - e.y, w.x - e.x);
        faceTo = ta;
        const f = Math.max(0, Math.cos(angDiff(e.a, ta)));
        tvx = Math.cos(e.a) * sp * 0.3 * f; tvy = Math.sin(e.a) * sp * 0.3 * f;
      }
      const k = Math.min(1, dt * 3);
      e.vx += (tvx - e.vx) * k; e.vy += (tvy - e.vy) * k;
    }
    if (!e.act || e.act.def.type === "charge") { /* turning handled by act for others */ }
    if (!e.act) e.a += clamp(angDiff(e.a, faceTo), -e.turn * turnMul * dt, e.turn * turnMul * dt);
    e.x += e.vx * dt; e.y += e.vy * dt;

    // keep out of base safe zone
    const bd = Math.hypot(e.x - BASE.x, e.y - BASE.y);
    if (bd < BASE.safe) { e.x += ((e.x - BASE.x) / (bd || 1)) * 220 * dt; e.y += ((e.y - BASE.y) / (bd || 1)) * 220 * dt; }

    // contact with player
    if (!p.dead && dist < e.radius + SHIP_R + 30 && !this.inSafe()) {
      if (this.touching(e, 0)) {
        const k = dist || 1;
        p.x += (dx / k) * 140 * dt; p.y += (dy / k) * 140 * dt;
        p.vx += (dx / k) * 600 * dt; p.vy += (dy / k) * 600 * dt;
        if (e.contactCd <= 0) { e.contactCd = 0.7; this.hurtPlayer(e.eDmg * 0.25, { kb: 200, kbx: dx / k, kby: dy / k }); }
      }
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    // boss availability: one at a time, only while the player is in the mythical core
    this.bossT -= dt;
    if (BOSS_SP >= 0 && this.bossT <= 0 && !p.dead && !this.bossAlive() && Math.hypot(p.x, p.y) < 2500) {
      const ang = Math.random() * TAU, rr = 900 + Math.random() * 700;
      const boss = this.makeEnemy(BOSS_SP, 5, p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr, "boss", (Math.random() * 1e9) | 0);
      boss.aggro = true;
      this.enemies.push(boss);
      this.bossT = 120;
      this.toast("A SNAKE EMERGES", "#c45cff");
      this.shake = Math.max(this.shake, 16);
    }
    for (const e of this.enemies) {
      const dx = p.x - e.x, dy = p.y - e.y;
      e.dist = Math.hypot(dx, dy);
      if (e.dist > 3800 && !e.aggro) continue;
      this.updateEnemy(e, dt, dx, dy, e.dist);
    }
    // separation
    const n = this.enemies.length;
    for (let i = 0; i < n; i++) {
      const a = this.enemies[i];
      if (a.dist > 3000) continue;
      for (let j = i + 1; j < n; j++) {
        const b = this.enemies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = (Math.min(a.radius, 420) + Math.min(b.radius, 420)) * 0.55;
        const d2 = dx * dx + dy * dy;
        if (d2 < min * min && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = ((min - d) / min) * 90 * dt;
          const wa = b.radius / (a.radius + b.radius), wb = 1 - wa;
          a.x -= (dx / d) * push * wa * 2; a.y -= (dy / d) * push * wa * 2;
          b.x += (dx / d) * push * wb * 2; b.y += (dy / d) * push * wb * 2;
        }
      }
    }
    if (this.enemies.some((e) => e.dead)) this.enemies = this.enemies.filter((e) => !e.dead);
  }

  /* ---------------- player bullets ---------------- */
  private tryHit(b: Bullet): boolean {
    const st = this.stats;
    for (const pr of this.eprojs) {
      if (pr.type !== "missile") continue;
      if (Math.abs(pr.x - b.x) < pr.r + 4 && Math.abs(pr.y - b.y) < pr.r + 4) {
        pr.hp -= b.dmg; pr.life = pr.hp <= 0 ? 0 : pr.life;
        this.burst(pr.x, pr.y, "#ffb04d", 5, 3, 200);
        if (b.kind !== 1) return true;
      }
    }
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = b.x - e.x, dy = b.y - e.y;
      const rr = Math.max(e.radius, e.shellR) + 12;
      if (dx * dx + dy * dy > rr * rr) continue;
      if (e.shells.length && b.kind !== 4 && dx * dx + dy * dy < e.shellR * e.shellR) {
        this.shellHit(e, b.dmg, b.kind === 3 ? "explosive" : "kinetic");
        return true;
      }
      for (const s of e.shields) {
        if (s.part.alive && s.part.shieldHp > 0) {
          const sx = b.x - s.x, sy = b.y - s.y;
          if (sx * sx + sy * sy < s.r * s.r) {
            const energy = b.elem === "energy" || b.elem === "shock" || b.elem === "thermal";
            if (!energy) break; // physical rounds pass straight through energy shields
            if (e.spd.reflectShell) {
              this.eprojs.push({ x: b.x, y: b.y, vx: -b.vx * 0.9, vy: -b.vy * 0.9, life: 1.5, dmg: b.dmg * 0.6, r: 6, hue: e.spd.hue, type: "bolt", homing: 0, slow: 0, slowT: 0, poison: 0, pierce: false, hp: 1, speed: 620, src: e, puddle: null });
              this.ringFx(b.x, b.y, 46, "#7df9ff", 400);
              return true;
            }
            s.part.shieldHit = 3;
            e.aggro = true; e.barT = 3;
            this.addParticle(b.x, b.y, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, "#7df9ff", 4, 0.35, 3, false);
            this.ringFx(b.x, b.y, 40, "#7df9ff", 500);
            return true;
          }
        }
      }
      const ca = Math.cos(e.a), sa = Math.sin(e.a);
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      const p = this.partAt(e, lx, ly);
      if (!p) continue;
      const key = e.id * 100000 + p.id;
      if (b.hit.includes(key)) continue;
      b.hit.push(key);
      let dmg = b.dmg * (1 + e.melt);
      if (p.kind === "armor" || p.kind === "shield" || p.kind === "spike") dmg *= st.breaker;
      if (p.kind === "core") dmg *= st.coreMul;
      if (b.dot) { e.dot = Math.max(e.dot, b.dot); e.dotT = Math.max(e.dotT, 2.5); }
      if (b.melt) e.melt = Math.min(0.9, e.melt + b.melt);
      this.damagePart(e, p, dmg, b.x, b.y);
      if (st.frag > 0 && b.kind !== 1) {
        for (const q of e.parts) {
          if (!q.alive || q === p) continue;
          if (Math.hypot(q.cx - p.cx, q.cy - p.cy) < st.frag + q.r * 0.5) this.damagePart(e, q, dmg * 0.35, 0, 0);
        }
      }
      if (b.kind === 1) { this.areaDamage(b.x, b.y, 95, b.dmg * 0.6, null); this.ringFx(b.x, b.y, 95, "#ffb04d", 500); this.burst(b.x, b.y, "#ffb04d", 8, 4, 220); b.life = 0; return true; }
      if (b.kind === 3) { this.areaDamage(b.x, b.y, 120, b.dmg * 0.7, null); this.ringFx(b.x, b.y, 120, "#ffd24d", 600); this.burst(b.x, b.y, "#ffd24d", 12, 5, 300); return true; }
      if (b.pierce > 0) { b.pierce--; b.dmg *= 0.8; return false; }
      return true;
    }
    return false;
  }
  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      if (b.kind === 4) {
        const le = b.lockE, lq = b.lockP;
        if (!le || !lq || le.dead || !lq.alive || !this.enemies.includes(le)) {
          b.kind = 1; b.lockE = undefined; b.lockP = undefined; b.target = null;
        } else {
          const w = this.partWorld(le, lq);
          const want = Math.atan2(w[1] - b.y, w[0] - b.x), cur = Math.atan2(b.vy, b.vx);
          const na = cur + clamp(angDiff(cur, want), -9 * dt, 9 * dt);
          const sp = Math.min(1500, Math.hypot(b.vx, b.vy) + 1000 * dt);
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
          if (Math.hypot(w[0] - b.x, w[1] - b.y) < lq.r * 0.55 + 10) {
            this.damagePart(le, lq, b.dmg, w[0], w[1], "missile");
            this.areaDamage(w[0], w[1], 74, b.dmg * 0.35, lq, "explosive");
            this.ringFx(w[0], w[1], 74, "#ffb04d", 520);
            this.burst(w[0], w[1], "#ffb04d", 12, 5, 300);
            b.life = 0;
          }
        }
      }
      if (b.kind === 1) {
        if (!b.target || b.target.dead) b.target = this.nearestEnemy(b.x, b.y, 1100);
        if (b.target) {
          const want = Math.atan2(b.target.y - b.y, b.target.x - b.x), cur = Math.atan2(b.vy, b.vx);
          const na = cur + clamp(angDiff(cur, want), -4 * dt, 4 * dt);
          const sp = Math.min(760, Math.hypot(b.vx, b.vy) + 500 * dt);
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
        }
      }
      const dist = Math.hypot(b.vx, b.vy) * dt;
      const steps = Math.max(1, Math.ceil(dist / 10));
      let dead = b.life <= 0;
      for (let s = 0; s < steps && !dead; s++) {
        b.x += (b.vx * dt) / steps; b.y += (b.vy * dt) / steps;
        if (b.kind !== 4 && this.tryHit(b)) dead = true;
      }
      if (dead) {
        if (b.split && b.split > 0) {
          for (let k = 0; k < b.split; k++) {
            const ang = (k / b.split) * TAU + Math.random() * 0.5;
            this.bullets.push({ x: b.x, y: b.y, vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520, life: 0.7, dmg: b.dmg * 0.45, pierce: 0, hit: [], kind: 2, target: null, crit: false, dot: b.dot, melt: b.melt });
          }
          this.ringFx(b.x, b.y, 70, "#ffb04d", 500);
        }
        if (b.flak) { this.areaDamage(b.x, b.y, 125, b.dmg * 0.7, null); this.ringFx(b.x, b.y, 125, "#ffd24d", 700); this.burst(b.x, b.y, "#ffd24d", 12, 5, 300); }
        this.bullets.splice(i, 1);
      }
    }
  }
  private nearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null, bd = range;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - x, e.y - y) - Math.min(e.radius, 500) * 0.6;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  private beam(x: number, y: number, ang: number, len: number, dmg: number, pierce: number, bypass = false, src: DmgSrc = "laser", color = "#baffff") {
    const st = this.stats;
    const hits = new Set<number>();
    const cos = Math.cos(ang), sin = Math.sin(ang);
    let endLen = len;
    let pierced = 0;
    const cands = this.enemies.filter((e) => !e.dead && Math.hypot(e.x - x, e.y - y) < len + e.radius);
    outer: for (let d = 10; d <= len; d += 8) {
      const bx = x + cos * d, by = y + sin * d;
      for (const e of cands) {
        const dx = bx - e.x, dy = by - e.y;
        if (dx * dx + dy * dy > (e.radius + 6) * (e.radius + 6)) continue;
        if (e.shells.length && (bx - e.x) * (bx - e.x) + (by - e.y) * (by - e.y) < e.shellR * e.shellR) {
          this.shellHit(e, dmg, "laser");
          endLen = d;
          break outer;
        }
        if (!bypass) for (const s of e.shields) {
          if (s.part.alive && s.part.shieldHp > 0 && (bx - s.x) ** 2 + (by - s.y) ** 2 < s.r * s.r) {
            const energy = src === "laser" || src === "shock";
            if (!energy) break; // physical beams ignore energy shields
            s.part.shieldHit = 3;
            this.ringFx(bx, by, 42, "#7df9ff", 520);
            endLen = d; break outer;
          }
        }
        const ca = Math.cos(e.a), sa = Math.sin(e.a);
        const p = this.partAt(e, dx * ca + dy * sa, -dx * sa + dy * ca);
        if (!p) continue;
        const key = e.id * 100000 + p.id;
        if (hits.has(key)) continue;
        hits.add(key);
        let dm = dmg * (1 + e.melt);
        if (p.kind === "armor" || p.kind === "shield" || p.kind === "spike") dm *= st.breaker;
        if (p.kind === "core") dm *= st.coreMul;
        this.damagePart(e, p, dm, bx, by);
        pierced++;
        if (pierced > pierce) { endLen = d; break outer; }
      }
    }
    this.beams.push({ x1: x, y1: y, x2: x + cos * endLen, y2: y + sin * endLen, life: 0.12, color });
  }

  private firePlayer(dt: number) {
    const p = this.player, st = this.stats;
    if (p.dead) return;
    const want = this.input.lmb || this.input.keys.has("Space");
    p.fireCd -= dt;
    const base = p.a;
    if (want && p.fireCd <= 0 && !this.inSafe()) {
      p.fireCd = 1 / (st.rate * (p.overT > 0 ? 1.8 : 1));
      const n = st.barrels;
      for (let i = 0; i < n; i++) {
        const ang = base + (i - (n - 1) / 2) * 0.09;
        const crit = Math.random() < st.crit;
        this.bullets.push({ x: p.x + Math.cos(ang) * 18, y: p.y + Math.sin(ang) * 18, vx: Math.cos(ang) * st.bulletSpeed + p.vx * 0.3, vy: Math.sin(ang) * st.bulletSpeed + p.vy * 0.3, life: st.bulletRange / st.bulletSpeed, dmg: st.dmg * (crit ? 2.5 : 1) * (p.overT > 0 ? 2.2 : 1) * this.dmgMul(), pierce: st.pierce, hit: [], kind: 0, target: null, crit });
      }
      p.vx -= Math.cos(base) * 6; p.vy -= Math.sin(base) * 6;
    }
    this.fireWeapons(dt, base);
  }

  /* ---------------- crafted weapon firing systems ---------------- */
  private nearestEnemyExcept(x: number, y: number, range: number, skip: Set<number>): Enemy | null {
    let best: Enemy | null = null, bd = range;
    for (const e of this.enemies) {
      if (e.dead || skip.has(e.id)) continue;
      const d = Math.hypot(e.x - x, e.y - y) - Math.min(e.radius, 500) * 0.6;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  private empBlast(x: number, y: number, R: number, stun: number, dmg: number, color = "#7df9ff") {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - x, e.y - y) > R + e.radius) continue;
      e.stun = Math.max(e.stun, stun);
      if (e.shells.length) continue; // plating shrugs off the electrical burn
      const alive = e.parts.filter((q) => q.alive);
      const q = alive[Math.floor(Math.random() * alive.length)];
      if (q) this.damagePart(e, q, dmg, 0, 0);
    }
    this.ringFx(x, y, R, color, 900);
    this.burst(x, y, color, 18, 6, 380);
    this.shake = Math.max(this.shake, 8);
  }
  /** visible radius in world units (half the screen diagonal at the current zoom) */
  viewRadius() { return Math.hypot(this.w, this.h) / 2 / Math.max(0.04, this.cam.z); }

  /* Every crafted weapon is automatic: it picks its own target and fires when
   * something is in range. B (or the AUTO button) disables the whole rack.
   * Damage is always st.dmg (base cannon) * weapon multiplier * efficiency, so
   * weapon damage scales with the Cannon Damage upgrade and overdrive. */
  private fireWeapons(dt: number, base: number) {
    const p = this.player, st = this.stats;
    if (!this.autoFire || p.dead) return;
    const view = this.viewRadius() * 0.95;
    const R = (id: string) => Math.min(WEAPON_RANGE[id] ?? 600, view);
    if (p.wCd.length < st.weapons.length) p.wCd = [...p.wCd, ...new Array(st.weapons.length - p.wCd.length).fill(0)];
    st.weapons.forEach((w, i) => {
      p.wCd[i] -= dt;
      if (p.wCd[i] > 0 || this.inSafe()) return;
      const eff = w.eff;
      const cd = (c: number) => c / (0.7 + 0.3 * eff);
      const side = i === 1 ? -1 : 1;
      const ox = p.x + Math.cos(base + Math.PI / 2) * 14 * side;
      const oy = p.y + Math.sin(base + Math.PI / 2) * 14 * side;
      const dmg = st.dmg * (p.overT > 0 ? 2.2 : 1) * this.dmgMul();
      const shot = (x: number, y: number, ang: number, sp: number, life: number, d: number, kind: Bullet["kind"], extra: Partial<Bullet> = {}) => {
        this.bullets.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life, dmg: d, pierce: 0, hit: [], kind, target: null, crit: false, elem, ...extra });
      };
      const aim = (t: Enemy) => Math.atan2(t.y - oy, t.x - ox);
      const elem = WEAPON_DMG[w.rid] ?? "kinetic";
      switch (w.rid) {
        case "pulse": {
          const t = this.nearestEnemy(p.x, p.y, R("pulse"));
          if (!t) return;
          p.wCd[i] = cd(0.45);
          shot(ox, oy, aim(t), 1100, 0.8, dmg * 0.6 * eff, 0);
          break;
        }
        case "scatter": {
          const t = this.nearestEnemy(p.x, p.y, R("scatter"));
          if (!t) return;
          p.wCd[i] = cd(0.75);
          const a0 = aim(t);
          for (let k = 0; k < 6; k++) shot(ox, oy, a0 + (Math.random() - 0.5) * 0.42, 700 + Math.random() * 220, 0.42, dmg * 0.55 * eff, 2);
          break;
        }
        case "missile": {
          const t = this.nearestEnemy(p.x, p.y, R("missile"));
          if (!t) return;
          p.wCd[i] = cd(1.5);
          for (let k = 0; k < 2; k++) shot(ox, oy, aim(t) + (k ? 0.4 : -0.4), 260, 3.2, dmg * 2.2 * eff, 1, { target: t });
          break;
        }
        case "lance": {
          const t = this.nearestEnemy(p.x, p.y, R("lance"));
          if (!t) return;
          p.wCd[i] = cd(0.12);
          this.beam(p.x, p.y, aim(t), 320 + 80 * eff, dmg * 0.22 * eff, 2 + Math.floor(eff), false, "laser", "#7df9ff");
          break;
        }
        case "homing": {
          const lock = this.lock;
          if (!lock || lock.e.dead || !lock.part.alive) return;
          if (Math.hypot(lock.e.x - p.x, lock.e.y - p.y) > R("homing")) return;
          const wpos = this.partWorld(lock.e, lock.part);
          p.wCd[i] = cd(1.7);
          shot(ox, oy, Math.atan2(wpos[1] - oy, wpos[0] - ox), 360, 4.4, dmg * 3.1 * eff, 4, { lockE: lock.e, lockP: lock.part });
          break;
        }
        case "bypass": {
          const t = this.nearestEnemy(p.x, p.y, R("bypass"));
          if (!t) return;
          p.wCd[i] = cd(0.1);
          this.beam(p.x, p.y, aim(t), 420 + 90 * eff, dmg * 0.16 * eff, 3, true, "laser", "#b7ff7d");
          break;
        }
        case "hmg": {
          const t = this.nearestEnemy(p.x, p.y, R("hmg"));
          if (!t) return;
          p.wCd[i] = cd(0.075);
          shot(ox, oy, aim(t) + (Math.random() - 0.5) * 0.13, 1150, 0.55, dmg * 0.1 * eff, 0);
          break;
        }
        case "emp": {
          const t = this.nearestEnemy(p.x, p.y, R("emp"));
          if (!t) return;
          p.wCd[i] = cd(2.6);
          this.empBlast(p.x, p.y, 620, 1.8, dmg * 1.4 * eff);
          break;
        }
        case "cutter": {
          const t = this.nearestEnemy(p.x, p.y, R("cutter"));
          if (!t) return;
          p.wCd[i] = cd(0.18);
          this.beam(p.x, p.y, aim(t), 175 + 20 * eff, dmg * 1.1 * eff, 1 + Math.floor(eff), false, "laser", "#ff8ad6");
          break;
        }
        case "acid": {
          const t = this.nearestEnemy(p.x, p.y, R("acid"));
          if (!t) return;
          p.wCd[i] = cd(0.16);
          const a0 = aim(t);
          for (let k = 0; k < 3; k++) shot(ox, oy, a0 + (k - 1) * 0.11 + (Math.random() - 0.5) * 0.08, 540 + Math.random() * 80, 0.5, dmg * 0.3 * eff, 2, { melt: 0.32, dot: 1.6 * eff });
          break;
        }
        case "chain": {
          let cur = this.nearestEnemy(p.x, p.y, R("chain"));
          if (!cur) return;
          p.wCd[i] = cd(0.8);
          const seen = new Set<number>();
          let sx = p.x, sy = p.y;
          for (let k = 0; k < 5 && cur; k++) {
            if (cur.shells.length) { seen.add(cur.id); cur = this.nearestEnemyExcept(sx, sy, 520, seen); continue; }
            const alive = cur.parts.filter((q) => q.alive);
            const q = alive[Math.floor(Math.random() * alive.length)];
            if (!q) break;
            const wq = this.partWorld(cur, q);
            this.beams.push({ x1: sx, y1: sy, x2: wq[0], y2: wq[1], life: 0.12, color: "#c77dff" });
            this.damagePart(cur, q, dmg * 1.6 * eff * Math.pow(0.75, k), wq[0], wq[1], "shock");
            sx = wq[0]; sy = wq[1];
            seen.add(cur.id);
            cur = this.nearestEnemyExcept(sx, sy, 520, seen);
          }
          break;
        }
        case "flak": {
          const t = this.nearestEnemy(p.x, p.y, R("flak"));
          if (!t) return;
          p.wCd[i] = cd(0.9);
          const d0 = Math.hypot(t.x - ox, t.y - oy);
          shot(ox, oy, aim(t), 620, clamp(d0 / 620, 0.15, 1.4), dmg * 1.3 * eff, 3, { flak: true });
          break;
        }
        case "rail": {
          const t = this.nearestEnemy(p.x, p.y, R("rail"));
          if (!t) return;
          p.wCd[i] = cd(1.82);
          this.beam(p.x, p.y, aim(t), 1500, dmg * 2.4 * eff, 12, true, "kinetic", "#ffe9a6");
          this.shake = Math.max(this.shake, 5);
          break;
        }
        case "gravity": {
          const t = this.nearestEnemy(p.x, p.y, R("gravity"));
          if (!t) return;
          p.wCd[i] = cd(3.2);
          const [gx, gy] = clampWorld(t.x, t.y);
          this.wells.push({ x: gx, y: gy, life: 1.15, max: 1.15, dmg: dmg * 2.8 * eff, r: 230 });
          break;
        }
        case "mines": {
          const t = this.nearestEnemy(p.x, p.y, R("mines"));
          if (!t) return;
          p.wCd[i] = cd(1.1);
          const ang = base + Math.PI;
          this.mines.push({ x: p.x + Math.cos(ang) * 22, y: p.y + Math.sin(ang) * 22, vx: Math.cos(ang) * 160, vy: Math.sin(ang) * 160, arm: 0.7, life: 26, dmg: dmg * 2.5 * eff, r: 150 });
          break;
        }
        case "drones":
          break;
        case "venom": {
          const t = this.nearestEnemy(p.x, p.y, R("venom"));
          if (!t) return;
          p.wCd[i] = cd(0.35);
          const a0 = aim(t);
          for (let k = 0; k < 2; k++) shot(ox, oy, a0 + (k ? 0.05 : -0.05), 1000, 0.75, dmg * 0.45 * eff, 0, { dot: 3.2 * eff });
          break;
        }
        case "sonic": {
          const t = this.nearestEnemy(p.x, p.y, R("sonic"));
          if (!t) return;
          p.wCd[i] = cd(1.6);
          for (const e of this.enemies) {
            if (e.dead) continue;
            const dd = Math.hypot(e.x - p.x, e.y - p.y);
            if (dd > 540 + e.radius) continue;
            if (Math.abs(angDiff(p.a, Math.atan2(e.y - p.y, e.x - p.x))) > 0.8) continue;
            e.stun = Math.max(e.stun, 1.5);
            if (e.shells.length) continue;
            const alive = e.parts.filter((q) => q.alive);
            const q = alive[Math.floor(Math.random() * alive.length)];
            if (q) this.damagePart(e, q, dmg * 0.6 * eff, 0, 0, "shock");
          }
          this.ringFx(p.x, p.y, 240, "#c0ffff", 700);
          break;
        }
        case "cluster": {
          const t = this.nearestEnemy(p.x, p.y, R("cluster"));
          if (!t) return;
          p.wCd[i] = cd(2.2);
          shot(ox, oy, aim(t), 280, 3.2, dmg * 1.7 * eff, 1, { target: t, split: 4 });
          break;
        }
        default: break;
      }
    });
  }

  /* ---------------- crafted systems: mines, wells, drones, lock-on ---------------- */
  private updateMines(dt: number) {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      m.arm -= dt; m.life -= dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.vx *= Math.exp(-2.5 * dt); m.vy *= Math.exp(-2.5 * dt);
      let boom = false;
      if (m.arm <= 0) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - m.x, e.y - m.y) < m.r + e.radius * 0.4) { boom = true; break; }
        }
      }
      if (boom || m.life <= 0) {
        if (boom) {
          this.areaDamage(m.x, m.y, m.r, m.dmg, null);
          this.ringFx(m.x, m.y, m.r, "#ffb04d", 800);
          this.burst(m.x, m.y, "#ffb04d", 20, 6, 400);
          this.shake = Math.max(this.shake, 9);
        }
        this.mines.splice(i, 1);
      }
    }
  }
  private updateWells(dt: number) {
    for (let i = this.wells.length - 1; i >= 0; i--) {
      const w = this.wells[i];
      w.life -= dt;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = w.x - e.x, dy = w.y - e.y, d = Math.hypot(dx, dy);
        if (d > w.r + e.radius || d < 1) continue;
        const f = 1500 * (1 - clamp(d / (w.r + e.radius), 0, 1)) * dt / Math.max(1, e.radius / 40);
        e.vx += (dx / d) * f; e.vy += (dy / d) * f;
      }
      if (w.life <= 0) {
        this.areaDamage(w.x, w.y, w.r + 40, w.dmg, null);
        this.ringFx(w.x, w.y, w.r + 40, "#c45cff", 1000);
        this.burst(w.x, w.y, "#c45cff", 26, 8, 460);
        this.shake = Math.max(this.shake, 12);
        this.wells.splice(i, 1);
      }
    }
  }
  private droneEff() {
    const w = this.stats.weapons.find((q) => q.rid === "drones");
    return w ? w.eff : 0;
  }
  private updateDrones(dt: number) {
    const want = this.stats.weapons.some((w) => w.rid === "drones") ? 2 : 0;
    while (this.drones.length < want) this.drones.push({ a: (this.drones.length / Math.max(1, want)) * TAU, r: 48, cd: 0.4 });
    while (this.drones.length > want) this.drones.pop();
    const p = this.player, eff = this.droneEff();
    for (const d of this.drones) {
      d.a += 1.3 * dt;
      d.cd -= dt;
      if (d.cd > 0 || this.inSafe() || p.dead) continue;
      const x = p.x + Math.cos(d.a) * d.r, y = p.y + Math.sin(d.a) * d.r;
      const t = this.nearestEnemy(x, y, 720);
      if (!t) { d.cd = 0.3; continue; }
      d.cd = 0.55;
      const ang = Math.atan2(t.y - y, t.x - x);
      this.bullets.push({ x, y, vx: Math.cos(ang) * 1050, vy: Math.sin(ang) * 1050, life: 0.8, dmg: this.stats.dmg * 0.4 * eff * this.dmgMul(), pierce: 0, hit: [], kind: 0, target: null, crit: false });
    }
  }
  private updateLock(dt: number) {
    void dt;
    if (!this.lock) return;
    if (this.lock.e.dead || !this.lock.part.alive || !this.enemies.includes(this.lock.e)) {
      this.lock = null;
      this.toast("Target lost", "#ff8a8a");
    }
  }

  /* ---------------- main update ---------------- */
  update(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.05);
    this.t += dt;
    if (this.discovery) { this.discovery.t -= dt; if (this.discovery.t <= 0) this.discovery = null; }
    this.fpsAcc += dtRaw; this.fpsN++;
    if (this.fpsAcc > 0.5) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    const p = this.player, st = this.stats, k = this.input.keys;

    if (p.dead) {
      p.respawn -= dt;
      if (p.respawn <= 0) this.respawnPlayer();
    } else {
      // movement
      let ax = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
      let ay = (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) - (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0);
      const al = Math.hypot(ax, ay);
      if (al > 0) { ax /= al; ay /= al; }
      const wantBoost = (k.has("ShiftLeft") || k.has("ShiftRight")) && st.hasBoost && p.boost > 5 && al > 0;
      p.boosting = wantBoost;
      if (wantBoost) p.boost = Math.max(0, p.boost - 50 * dt);
      else p.boost = Math.min(100, p.boost + st.boostRegen * dt);
      if (p.slowT > 0) { p.slowT -= dt; if (p.slowT <= 0) p.slowF = 1; }
      let maxSp = st.thrust * p.slowF * p.tow * (wantBoost ? st.boostMul : 1);
      const rate = Math.min(1, (st.accel / Math.max(200, maxSp)) * dt);
      p.vx += (ax * maxSp - p.vx) * rate;
      p.vy += (ay * maxSp - p.vy) * rate;
      if (p.pull) {
        p.pull.t -= dt;
        const pe = p.pull.e;
        if (pe.dead || p.pull.t <= 0 || this.inSafe()) p.pull = null;
        else {
          const dx = pe.x - p.x, dy = pe.y - p.y, d = Math.hypot(dx, dy) || 1;
          if (d < pe.radius * 0.5) p.pull = null;
          else { const f = 1100 * (1 - st.dampers); p.vx += (dx / d) * f * dt; p.vy += (dy / d) * f * dt; }
        }
      }
      maxSp = Math.max(maxSp, 1);
      p.x += p.vx * dt; p.y += p.vy * dt;
      const rd = Math.hypot(p.x, p.y);
      if (rd > WORLD_R - 30) {
        const nx = p.x / rd, ny = p.y / rd;
        p.x = nx * (WORLD_R - 30); p.y = ny * (WORLD_R - 30);
        const vn = p.vx * nx + p.vy * ny;
        if (vn > 0) { p.vx -= nx * vn; p.vy -= ny * vn; }
      }
      const [mx, my] = this.mouseWorld();
      const want = Math.atan2(my - p.y, mx - p.x);
      p.a += clamp(angDiff(p.a, want), -14 * dt, 14 * dt);

      // status
      p.hitT += dt;
      if (p.flash > 0) p.flash -= dt;
      if (p.thornCd > 0) p.thornCd -= dt;
      if (p.poisonT > 0) { p.poisonT -= dt; this.hurtPlayer(p.poison * dt, { dot: true }); if (p.poisonT <= 0) p.poison = 0; }
      if (this.inSafe()) { p.hp = Math.min(st.hull, p.hp + st.hull * 0.5 * dt); p.shield = Math.min(st.shieldMax, p.shield + st.shieldMax * 0.6 * dt); p.poison = 0; p.slowF = 1; }
      else {
        if (st.regen > 0 && p.hp > 0) p.hp = Math.min(st.hull, p.hp + st.hull * st.regen * dt);
      }
      if (st.shieldMax > 0) {
        p.shieldT -= dt;
        if (p.shieldT <= 0) p.shield = Math.min(st.shieldMax, p.shield + st.shieldMax * st.shieldRegen * dt);
      } else p.shield = 0;
      if (p.shield > st.shieldMax) p.shield = st.shieldMax;
      // teleport
      if (p.tpCd > 0) p.tpCd -= dt;
      if (p.tpT > 0) {
        p.tpT -= dt;
        if (Math.random() < 0.5) this.addParticle(p.x + (Math.random() - 0.5) * 40, p.y + (Math.random() - 0.5) * 40, 0, -80, "#c77dff", 4, 0.6, 3);
        if (p.tpT <= 0) {
          p.tpT = 0; p.tpCd = st.tpCd;
          this.burst(p.x, p.y, "#c77dff", 30, 8, 400); this.ringFx(p.x, p.y, 300, "#c77dff", 900);
          for (const h of this.harpoons) if (h.state !== 0) this.retract(h);
          p.x = BASE.x; p.y = BASE.y - 220; p.vx = p.vy = 0;
          this.cam.x = p.x; this.cam.y = p.y;
          this.burst(p.x, p.y, "#c77dff", 30, 8, 400); this.ringFx(p.x, p.y, 300, "#c77dff", 900);
          this.toast("Recalled to base", "#c77dff");
        }
      }
      this.firePlayer(dt);
    }

    // world
    this.chunkT -= dt;
    if (this.chunkT <= 0) { this.chunkT = 1.0; this.manageChunks(); }
    this.updateEnemies(dt);
    this.updateEProjs(dt);
    this.updateBullets(dt);
    this.updateComps(dt);
    this.updateHarpoons(dt);
    this.updateMines(dt);
    this.updateWells(dt);
    this.updateDrones(dt);
    this.updateLock(dt);
    for (let i = 0; i < 5; i++) if (this.aCd[i] > 0) this.aCd[i] -= dt;
    if (p.barrierT > 0) { p.barrierT -= dt; if (p.barrierT <= 0) { p.barrier = 0; p.barrierMax = 0; } }
    if (p.overT > 0) p.overT -= dt;
    if (p.nullCd > 0) p.nullCd -= dt;
    if (this.admin.on && this.admin.health) { p.hp = st.hull; p.shield = st.shieldMax; }

    // puddles
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const q = this.puddles[i];
      if (q.arm > 0) q.arm -= dt; else {
        q.life -= dt;
        if (!p.dead && Math.hypot(p.x - q.x, p.y - q.y) < q.r + SHIP_R * 0.5) { this.hurtPlayer(q.dps * dt, { dot: true }); this.applySlow(q.slow, 0.4); }
      }
      if (q.life <= 0) this.puddles.splice(i, 1);
    }
    // rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.r += r.speed * dt;
      if (r.hurts && !r.hit && !p.dead) {
        const d = Math.hypot(p.x - r.x, p.y - r.y);
        if (Math.abs(d - r.r) < 26) {
          r.hit = true;
          this.hurtPlayer(r.dmg, { kb: 700, kbx: (p.x - r.x) / (d || 1), kby: (p.y - r.y) / (d || 1) });
        }
      }
      if (r.r >= r.max) this.rings.splice(i, 1);
    }
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt; d.vx *= Math.exp(-0.8 * dt); d.vy *= Math.exp(-0.8 * dt);
      if (d.life <= 0) {
        for (const pc of d.pieces) {
          let cx = 0, cy = 0;
          for (let j = 0; j < pc.poly.length; j += 2) { cx += pc.poly[j]; cy += pc.poly[j + 1]; }
          cx /= pc.poly.length / 2; cy /= pc.poly.length / 2;
          this.burst(d.x + cx, d.y + cy, pc.stroke, 3, 8, 160);
        }
        this.debris.splice(i, 1);
      }
    }
    for (let i = this.beams.length - 1; i >= 0; i--) { this.beams[i].life -= dt; if (this.beams[i].life <= 0) this.beams.splice(i, 1); }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) { this.particles.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
      const f = Math.exp(-2.2 * dt);
      q.vx *= f; q.vy *= f;
    }
    for (const o of this.others) {
      o.x = lerp(o.x, o.tx, Math.min(1, dt * 6)); o.y = lerp(o.y, o.ty, Math.min(1, dt * 6));
      o.a += angDiff(o.a, o.ta) * Math.min(1, dt * 8);
    }
    for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].t -= dt; if (this.toasts[i].t <= 0) this.toasts.splice(i, 1); }

    // biome tint
    const w = biomeWeights(p.x, p.y);
    let bi = 0;
    for (let i = 1; i < w.length; i++) if (w[i] > w[bi]) bi = i;
    this.tintTarget = SPECIES_LIST[bi].hue;
    this.tintHue += angDiff(this.tintHue * (Math.PI / 180), this.tintTarget * (Math.PI / 180)) * (180 / Math.PI) * Math.min(1, dt * 1.5);
    this.tintHue = ((this.tintHue % 360) + 360) % 360;

    // camera
    this.cam.z = lerp(this.cam.z, this.zoom, Math.min(1, dt * 8));
    this.cam.x += (p.x + p.vx * 0.12 - this.cam.x) * Math.min(1, dt * 7);
    this.cam.y += (p.y + p.vy * 0.12 - this.cam.y) * Math.min(1, dt * 7);
    this.shake = Math.max(0, this.shake - dt * 30);

    // saving / net
    this.saveT -= dt; this.serverT -= dt; this.netT -= dt;
    if (this.saveT <= 0) { this.saveT = 5; this.persist(); }
    if (this.serverT <= 0) { this.serverT = 20; void this.pushServer(); }
    if (this.netT <= 0) { this.netT = 0.7; void this.netTick(); }
  }

  hud(): Hud {
    const p = this.player, st = this.stats;
    return {
      hp: p.hp, maxHp: st.hull, shield: p.shield, maxShield: st.shieldMax, boost: p.boost, hasBoost: st.hasBoost, credits: this.save.credits,
      harp: this.harpoons.map((h) => ({ state: h.state, load: h.comp ? h.comp.c.mass / (h.comp.hooks.length * st.hStr) : 0, hp: h.hp / h.maxHp })),
      toasts: [...this.toasts], nearBase: this.nearBase(),
      tp: { has: st.tpTime > 0, ch: p.tpT > 0 ? 1 - p.tpT / st.tpTime : 0, cd: p.tpCd, max: st.tpCd },
      dead: p.dead, respawn: p.respawn, x: p.x, y: p.y, online: this.online, zoomOn: st.zoomMin < 1, inv: this.save.inventory.length, cargo: st.cargo,
      hold: this.input.rHold / 0.6, rev: this.rev, zoom: this.zoom, fps: this.fps,
      discovery: this.discovery ? { name: this.discovery.name, t: this.discovery.t } : null,
      abilities: ["Z", "X", "C", "V", "F"].map((key, i) => {
        const a = this.abilityAt(i);
        if (!a) return { key, name: "— empty —", icon: "·", color: "#64748b", cd: 0, max: 1, ready: false, active: false, empty: true };
        return { key, name: a.spec.name, icon: a.spec.icon, color: a.spec.color, cd: this.aCd[i], max: a.spec.cd / (0.7 + 0.3 * a.eff), ready: this.aCd[i] <= 0, active: false, empty: false };
      }),
      admin: { ...this.admin },
      lock: !!this.lock,
      autoFire: this.autoFire,
      overdrive: p.overT > 0,
    };
  }
}

export { KIND_CAT };
