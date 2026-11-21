"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Game, type Hud } from "@/game/engine";
import { render } from "@/game/render";
import {
  ABILITY_LIST, CAT_NAME, DMG_INFO, KIND_CAT, RARITIES, RECIPES, RECIPE_BY_ID, SLOT_NAME, UPGRADES, UP_CATS, craftEfficiency, damageProfile, migrate, newSave, recipeProblem, upgradeCost,
  type Comp, type Recipe, type SaveData, type Slot, type UpCat,
} from "@/game/data";
import { clamp, fmtNum } from "@/game/math";
import { SPECIES_LIST } from "@/game/enemies";
import SettingsPanel from "@/components/SettingsPanel";
import RecipeIcon from "@/components/RecipeIcon";
import Bestiary, { BeeIcon } from "@/components/Bestiary";

const SAVE_KEY = "neon-hive-save-v1";
const PID_KEY = "neon-hive-pid";

function getPid() {
  let id = localStorage.getItem(PID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(PID_KEY, id);
  }
  return id;
}

async function loadSave(pid: string): Promise<SaveData> {
  let local: SaveData | null = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) local = migrate(JSON.parse(raw));
  } catch { /* ignore */ }
  let remote: SaveData | null = null;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`/api/save?id=${encodeURIComponent(pid)}`, { signal: ctrl.signal });
    clearTimeout(to);
    if (res.ok) {
      const j = (await res.json()) as { save: unknown };
      if (j.save) remote = migrate(j.save);
    }
  } catch { /* ignore */ }
  if (local && remote) return local.ts >= remote.ts ? local : remote;
  return local ?? remote ?? newSave();
}

export default function GameClient() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const creditRef = useRef<HTMLDivElement | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const gameRef2 = useRef<Game | null>(null);
  useEffect(() => { gameRef2.current = game; }, [game]);

  /** Leave the run, but never lose the run: write the local save before routing. */
  const goHome = () => {
    const g = gameRef2.current;
    if (g) { g.persist(true); void g.pushServer(); }
    router.push("/");
  };
  /* Losing the nest ends the run: the engine has already applied the penalties
   * and saved them, so all that is left is the ride back to the title screen. */
  useEffect(() => {
    if (!hud?.baseLost) return;
    const t = setTimeout(() => {
      const g = gameRef2.current;
      if (g) { g.persist(true); void g.pushServer(); }
      router.push("/");
    }, 3000);
    return () => clearTimeout(t);
  }, [hud?.baseLost, router]);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bestiaryOpen, setBestiaryOpen] = useState(false);
  const menuRef = useRef(false);
  const adminRef = useRef(false);
  const settingsRef = useRef(false);
  const bestiaryRef = useRef(false);
  useEffect(() => { menuRef.current = menu; }, [menu]);
  useEffect(() => { adminRef.current = adminOpen; }, [adminOpen]);
  useEffect(() => { settingsRef.current = settingsOpen; }, [settingsOpen]);
  useEffect(() => { bestiaryRef.current = bestiaryOpen; }, [bestiaryOpen]);

  useEffect(() => {
    let raf = 0;
    let stopped = false;
    let hudTimer: ReturnType<typeof setInterval> | undefined;
    const cleanups: (() => void)[] = [];

    (async () => {
      const pid = getPid();
      const save = await loadSave(pid);
      if (stopped) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const game = new Game(save, pid);
      gameRef.current = game;
      setGame(game);
      if (!localStorage.getItem("neon-hive-help")) setHelp(true);

      /* the credit counter lives in the DOM, so the engine needs its screen
       * position to aim the coin flights at it */
      const measureCredit = () => {
        const r = creditRef.current?.getBoundingClientRect();
        if (r && r.width > 0) game.setCreditHud(r.left + 12, r.top + r.height / 2);
      };
      const resize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = window.innerWidth, h = window.innerHeight;
        canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + "px"; canvas.style.height = h + "px";
        game.resize(w, h, dpr);
        measureCredit();
      };
      resize();
      window.addEventListener("resize", resize);
      cleanups.push(() => window.removeEventListener("resize", resize));

      const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      const kd = (e: KeyboardEvent) => {
        if (isTyping(e.target)) return;
        if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
        if (e.code === "KeyE") {
          if (menuRef.current) { setMenu(false); return; }
          if (game.nearBase()) { game.blur(); setMenu(true); }
          return;
        }
        if (e.code === "Backquote") { e.preventDefault(); setMenu(false); setAdminOpen((v) => !v); game.blur(); return; }
        if (e.code === "Escape") { setMenu(false); setAdminOpen(false); setSettingsOpen(false); setBestiaryOpen(false); return; }
        if (menuRef.current || adminRef.current || settingsRef.current || bestiaryRef.current) return;
        if (!e.repeat) game.keyDown(e.code);
        else game.input.keys.add(e.code);
      };
      const ku = (e: KeyboardEvent) => game.keyUp(e.code);
      window.addEventListener("keydown", kd);
      window.addEventListener("keyup", ku);
      window.addEventListener("blur", () => game.blur());
      cleanups.push(() => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); });

      const mm = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); game.input.mx = e.clientX - r.left; game.input.my = e.clientY - r.top; };
      const md = (e: MouseEvent) => { mm(e); e.preventDefault(); game.mouseDown(e.button); };
      const mu = (e: MouseEvent) => game.mouseUp(e.button);
      const cm = (e: Event) => e.preventDefault();
      const wh = (e: WheelEvent) => { e.preventDefault(); game.wheel(e.deltaY); };
      canvas.addEventListener("mousemove", mm);
      canvas.addEventListener("mousedown", md);
      window.addEventListener("mouseup", mu);
      canvas.addEventListener("contextmenu", cm);
      canvas.addEventListener("wheel", wh, { passive: false });
      cleanups.push(() => {
        canvas.removeEventListener("mousemove", mm); canvas.removeEventListener("mousedown", md);
        window.removeEventListener("mouseup", mu); canvas.removeEventListener("contextmenu", cm); canvas.removeEventListener("wheel", wh);
      });

      const vis = () => { if (document.visibilityState === "hidden") game.beaconSave(); };
      const unload = () => game.beaconSave();
      document.addEventListener("visibilitychange", vis);
      window.addEventListener("pagehide", unload);
      cleanups.push(() => { document.removeEventListener("visibilitychange", vis); window.removeEventListener("pagehide", unload); game.beaconSave(); });

      let last = performance.now();
      const loop = (now: number) => {
        const dt = (now - last) / 1000;
        last = now;
        game.update(dt);
        render(game, ctx);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      setHud(game.hud());
      hudTimer = setInterval(() => { setHud(game.hud()); measureCredit(); }, 100);
      void game.pushServer();
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (hudTimer) clearInterval(hudTimer);
      cleanups.forEach((c) => c());
    };
  }, []);

  const closeHelp = () => { localStorage.setItem("neon-hive-help", "1"); setHelp(false); };

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#04050c] font-mono text-cyan-100">
      <canvas ref={canvasRef} className="block cursor-crosshair" />
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,10,0.65) 100%)" }} />
      {!hud && <div className="absolute inset-0 grid place-items-center text-xl tracking-[0.4em] text-cyan-300">LOADING SAVE…</div>}
      {hud && game && <Hud_ hud={hud} creditRef={creditRef} onOpen={() => { game.blur(); setAdminOpen(false); setMenu(true); }} onHelp={() => setHelp(true)} onAdmin={() => { game.blur(); setMenu(false); setAdminOpen(true); }} onToggleAuto={() => game.toggleAutoFire()} onSettings={() => { game.blur(); setSettingsOpen(true); }} onBestiary={() => { game.blur(); setBestiaryOpen(true); }} onHome={goHome} />}
      {hud && game && adminOpen && <AdminPanel game={game} hud={hud} onClose={() => setAdminOpen(false)} />}
      {hud && game && menu && <Hangar game={game} hud={hud} onClose={() => setMenu(false)} />}
      {game && bestiaryOpen && <Bestiary bestiary={game.save.bestiary ?? {}} onClose={() => { setBestiaryOpen(false); game.blur(); }} />}
      {game && settingsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div className="flex max-h-[88dvh] w-[min(94vw,32rem)] flex-col rounded-md border border-cyan-300/40 bg-[#060a18]/97 shadow-[0_0_50px_rgba(77,255,210,0.18)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="text-sm font-black tracking-[0.28em] text-cyan-200">SETTINGS</div>
              <button onClick={() => setSettingsOpen(false)} className="rounded-sm border border-white/25 px-3 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10">CLOSE</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4"><Settings game={game} /></div>
          </div>
        </div>
      )}
      {help && <Help onClose={closeHelp} />}
    </div>
  );
}

/* ---------------------------------------------------------------- HUD */
function Bar({ v, max, color, h = 10 }: { v: number; max: number; color: string; h?: number }) {
  const f = clamp(max > 0 ? v / max : 0, 0, 1);
  return (
    <div className="relative w-56 overflow-hidden rounded-sm border border-white/20 bg-black/50" style={{ height: h + 6 }}>
      <div className="absolute inset-y-0 left-0 transition-[width] duration-100" style={{ width: `${f * 100}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
    </div>
  );
}

/** Neon credit chip: a glowing hexagonal coin with a square hole cut through it. */
function CreditCoin({ size = 18 }: { size?: number }) {
  const outer = "30,16 23,28.12 9,28.12 2,16 9,3.88 23,3.88";
  const inner = "26,16 21,24.66 11,24.66 6,16 11,7.34 21,7.34";
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="block" style={{ filter: "drop-shadow(0 0 4px rgba(255,225,77,0.8))" }}>
      <defs>
        <linearGradient id="coinFace" x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#fff8cf" />
          <stop offset="38%" stopColor="#ffd24d" />
          <stop offset="72%" stopColor="#e0a728" />
          <stop offset="100%" stopColor="#9c7010" />
        </linearGradient>
        <mask id="coinHole">
          <rect width="32" height="32" fill="#fff" />
          <rect x="11.9" y="11.9" width="8.2" height="8.2" rx="0.6" fill="#000" />
        </mask>
      </defs>
      <polygon points={outer} fill="url(#coinFace)" mask="url(#coinHole)" stroke="#ffe98a" strokeWidth="0.9" strokeLinejoin="miter" />
      <polygon points={inner} fill="none" stroke="#7df9ff" strokeWidth="0.8" strokeLinejoin="miter" opacity="0.7" />
      <rect x="11.9" y="11.9" width="8.2" height="8.2" rx="0.6" fill="none" stroke="#7df9ff" strokeWidth="0.9" opacity="0.9" />
      <path d="M16 3.88v1.9M16 26.22v1.9" stroke="#fff8cf" strokeWidth="0.7" strokeLinecap="round" opacity="0.55" />
      <path d="M6.2 10.1l1.7 1M24.1 20.9l1.7 1" stroke="#fff8cf" strokeWidth="0.7" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** Harpoon state as a bare glyph: colour carries the status, no words. */
function HarpoonGlyph({ state, load, hp }: { state: number; load: number; hp: number }) {
  const col = state === 0 ? "#2f6f66" : state === 1 ? "#7df9ff" : state === 2 ? (load > 0.9 ? "#ff4d6d" : "#ffd24d") : "#ff9d6e";
  return (
    <div className="relative h-7 w-9 rounded-sm border border-white/10 bg-black/40" title="Tether">
      <svg viewBox="0 0 36 28" className="absolute inset-0 h-full w-full">
        <g stroke={col} strokeWidth="2" strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 3px ${col})` }}>
          <path d="M5 14h18" />
          <path d="M23 14l5-5M23 14l5 5M23 14l4 0" />
          <path d="M5 14l3-3M5 14l3 3" />
        </g>
        {state === 2 && <rect x="2" y="25" width={32 * clamp(load, 0, 1)} height="2" fill={load > 0.9 ? "#ff4d6d" : "#ffd24d"} />}
        {state !== 0 && <rect x="2" y="1" width={32 * clamp(hp, 0, 1)} height="1.5" fill="#ff6b81" opacity="0.75" />}
      </svg>
    </div>
  );
}

function Hud_({ hud, creditRef, onOpen, onHelp, onAdmin, onSettings, onBestiary, onHome, onToggleAuto }: { hud: Hud; creditRef: React.RefObject<HTMLDivElement | null>; onOpen: () => void; onHelp: () => void; onAdmin: () => void; onSettings: () => void; onBestiary: () => void; onHome: () => void; onToggleAuto: () => void }) {
  const hpCol = hud.hp / hud.maxHp > 0.5 ? "#2dffa0" : hud.hp / hud.maxHp > 0.25 ? "#ffd24d" : "#ff4d6d";
  const [selAb, setSelAb] = useState<number | null>(null);
  return (
    <>
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
        <button onClick={onHome} title="Save and return to the title screen" className="grid h-8 w-8 place-items-center rounded-sm border border-white/20 bg-black/60 text-xs text-white/60 transition hover:scale-110 hover:bg-white/10 active:scale-95">⌂</button>
        <button onClick={onSettings} title="Settings" className="grid h-8 w-8 place-items-center rounded-sm border border-cyan-300/40 bg-black/60 text-cyan-200 transition hover:scale-110 hover:bg-cyan-400/20 active:scale-95">⚙</button>
        <button onClick={onAdmin} title="Admin panel (`)" className="rounded-sm border border-fuchsia-300/50 bg-black/60 px-2 py-1 text-[11px] text-fuchsia-200 transition hover:scale-110 hover:bg-fuchsia-400/20 active:scale-95">`</button>
        <button onClick={onHelp} title="Controls" className="grid h-8 w-8 place-items-center rounded-sm border border-cyan-300/40 bg-black/60 text-cyan-200 transition hover:scale-110 hover:bg-cyan-400/20 active:scale-95">?</button>
        <button onClick={onBestiary} title="Bestiary" className="grid h-8 w-8 place-items-center rounded-sm border-2 border-yellow-300/70 bg-yellow-300/10 text-yellow-200 shadow-[0_0_12px_rgba(255,225,77,0.25)] transition hover:scale-110 hover:bg-yellow-300/25 active:scale-95">
          <BeeIcon size={20} />
        </button>
      </div>

      <div className="pointer-events-none absolute left-3 top-16 flex flex-col gap-1.5">
        <Bar v={hud.hp} max={hud.maxHp} color={hpCol} h={12} />
        {hud.maxShield > 0 && <Bar v={hud.shield} max={hud.maxShield} color="#4dd2ff" h={8} />}
        {hud.hasBoost && <Bar v={hud.boost} max={100} color="#ff9d4d" h={6} />}
        {(hud.baseNear || hud.baseHp < hud.baseMaxHp) && !hud.baseLost && (
          <div className="flex items-center gap-1.5" title={`Nest integrity · ${hud.baseTurrets.filter(Boolean).length}/6 defence turrets`}>
            <span className="text-[11px] leading-none text-emerald-300 drop-shadow-[0_0_6px_#4dffd2]">⬢</span>
            <Bar v={hud.baseHp} max={hud.baseMaxHp} color={hud.baseHp / hud.baseMaxHp > 0.5 ? "#4dffd2" : hud.baseHp / hud.baseMaxHp > 0.25 ? "#ffd24d" : "#ff4d6d"} h={7} />
            <span className="flex gap-0.5">
              {hud.baseTurrets.map((alive, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-[1px]"
                  style={{ background: alive ? "#4dffd2" : "#4a1c24", boxShadow: alive ? "0 0 4px #4dffd2" : "none" }}
                />
              ))}
            </span>
          </div>
        )}
        <div ref={creditRef} className="mt-1 flex items-center gap-1.5 text-sm font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(255,225,77,0.7)]">
          <span key={hud.creditTick} className="credit-pop inline-flex drop-shadow-[0_0_6px_rgba(255,210,77,0.8)]"><CreditCoin size={17} /></span>
          <span>{fmtNum(hud.credits)}</span>
        </div>
        <div className="flex gap-1.5">
          {hud.harp.map((h, i) => <HarpoonGlyph key={i} state={h.state} load={h.load} hp={h.hp} />)}
        </div>
        {hud.tp.has && (
          <div className="flex items-center gap-1.5 text-fuchsia-300" title="Recall beacon">
            <span className="text-sm">⌁</span>
            <div className="h-1 w-20 overflow-hidden rounded-sm bg-black/60">
              <div className="h-full" style={{ width: `${hud.tp.ch > 0 ? hud.tp.ch * 100 : hud.tp.cd > 0 ? 100 - (hud.tp.cd / Math.max(1, hud.tp.max)) * 100 : 100}%`, background: hud.tp.ch > 0 ? "#ff7ad9" : hud.tp.cd > 0 ? "#7a3f6a" : "#c77dff" }} />
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-2 text-[11px]">
        <button
          onClick={onToggleAuto}
          className="pointer-events-auto rounded-sm border px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
          style={{ borderColor: hud.autoFire ? "#7dffb4" : "#64748b", color: hud.autoFire ? "#7dffb4" : "#94a3b8", background: "rgba(0,0,0,0.55)" }}
          title="Toggle automatic crafted weapons (B)"
        >
          AUTO {hud.autoFire ? "ON" : "OFF"}
        </button>
        {hud.overdrive && <span className="font-bold text-yellow-300">⚡ OVERDRIVE</span>}
        {hud.admin.on && <span className="font-bold text-fuchsia-300">ADMIN</span>}
      </div>

      {hud.discovery && (
        <div className="pointer-events-none absolute left-1/2 top-12 z-20 -translate-x-1/2 rounded-sm border border-yellow-300/60 bg-black/70 px-3 py-1 text-center text-[11px] font-bold tracking-[0.18em] text-yellow-200">
          NEW · <span className="text-yellow-100">{hud.discovery.name}</span>
        </div>
      )}

      {/* ability hotbar */}
      <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {hud.abilities.map((a, i) => {
          const frac = a.empty ? 0 : clamp(a.cd / Math.max(0.01, a.max), 0, 1);
          return (
            <button
              key={a.key}
              onClick={() => setSelAb(selAb === i ? null : i)}
              className="pointer-events-auto relative grid h-12 w-12 place-items-center rounded-sm border bg-black/60 text-lg"
              style={{ borderColor: a.empty ? "rgba(255,255,255,0.15)" : a.ready ? a.color : "rgba(255,255,255,0.2)", color: a.empty ? "#475569" : a.color, boxShadow: a.ready && !a.empty ? `0 0 12px ${a.color}66` : undefined }}
              title={a.name}
            >
              <span className="pointer-events-none absolute left-0.5 top-0 text-[8px] font-bold text-white/60">{a.key}</span>
              <span className="leading-none">{a.icon}</span>
              {!a.empty && frac > 0 && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/70 text-[10px] font-bold text-white/80">{Math.ceil(a.cd)}</span>
              )}
            </button>
          );
        })}
        {selAb !== null && hud.abilities[selAb] && (
          <div className="w-44 rounded-sm border border-cyan-300/40 bg-black/80 p-2 text-[10px] leading-tight text-cyan-100">
            <div className="font-bold" style={{ color: hud.abilities[selAb].color }}>{hud.abilities[selAb].name}</div>
            <div className="text-white/60">[{hud.abilities[selAb].key}] {hud.abilities[selAb].ready ? "ready" : `recharging ${Math.ceil(hud.abilities[selAb].cd)}s`}</div>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {hud.lock && <span title="Target marked" className="rounded-sm border border-amber-400/70 bg-black/70 px-2 py-1 text-xs text-amber-300">◎</span>}
      </div>

      {hud.nearBase && !hud.dead && (
        <button onClick={onOpen} title="Open nest (E)" className="absolute bottom-16 left-1/2 grid h-11 w-11 -translate-x-1/2 animate-pulse place-items-center rounded-full border-2 border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(77,255,210,0.5)] hover:bg-cyan-400/30">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" />
            <path d="M12 8.2l4 2.3v4.6l-4 2.3-4-2.3v-4.6z" />
          </svg>
        </button>
      )}
      {hud.baseLost && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-[#180404]/85">
          <div className="max-w-[92vw] text-center">
            <div className="text-4xl font-black tracking-[0.28em] text-red-400 drop-shadow-[0_0_26px_#ff2d55] sm:text-6xl">NEST DESTROYED</div>
            <div className="mt-4 text-sm font-bold text-orange-200 sm:text-base">ALL STORED COMPONENTS LOST · HALF YOUR CREDITS INCINERATED</div>
            <div className="mt-2 text-xs tracking-[0.18em] text-white/45">THE SWARM IS ASH · RETURNING TO TITLE {Math.max(1, Math.ceil(hud.baseLostT))}…</div>
          </div>
        </div>
      )}
      {hud.dead && !hud.baseLost && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-red-950/40">
          <div className="text-center">
            <div className="text-4xl font-black tracking-[0.3em] text-red-400 drop-shadow-[0_0_20px_#ff2d55]">CORE DESTROYED</div>
            <div className="mt-2 text-red-200">Reforming at the nest in {Math.ceil(hud.respawn)}…</div>
          </div>
        </div>
      )}
      {hud.hold > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2">
          <div className="h-1 w-24 overflow-hidden rounded-sm bg-black/60"><div className="h-full bg-red-400" style={{ width: `${Math.round(clamp(hud.hold, 0, 1) * 100)}%` }} /></div>
        </div>
      )}
    </>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["WASD / Arrows", "Fly"],
    ["Mouse", "Aim"],
    ["Left click / SPACE", "Fire the base cannon (kinetic; energy shields stop it)"],
    ["Right click", "Mark a target (missile launcher) or fire the tether"],
    ["B", "Toggle automatic crafted weapons"],
    ["Hold R over hooked part", "Release harpoon"],
    ["SHIFT", "Afterburner (upgrade)"],
    ["T", "Recall beacon (craftable)"],
    ["E", "Open the nest at your base"],
    ["Nest cannon", "Dormant until the nest is hit, then online for 120s; only tracks rare+ targets and one-shots legendaries"],
    ["Nest retaliation", "Any insect that damages the nest is instantly destroyed — no swarming the hull"],
    ["Nest targeting", "Insects hunt your ship, never the nest — they will follow you straight through turret range, and stray fire can still scar the hull"],
    ["Credits", "Broken enemy parts throw credit coins straight into your counter — nothing to pick up"],
    ["Hex turrets", "Six fast, weak point-defence turrets; one dies for every 1/6 of nest integrity lost"],
    ["Mouse wheel", "Zoom out (craftable optics)"],
    ["Z X C V F", "Fire equipped active abilities"],
    ["` (backtick)", "Admin panel (infinite resources)"],
    ["Bee button", "Bestiary — discovered species, stats and drops"],
  ];
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="max-h-full w-full max-w-xl overflow-auto rounded-md border border-cyan-300/60 bg-[#060a18]/95 p-6 shadow-[0_0_40px_rgba(77,255,210,0.25)]">
        <h1 className="text-center text-3xl font-black tracking-[0.25em] text-cyan-200 drop-shadow-[0_0_14px_#4dffd2]">WOFGUE.IO</h1>
        <p className="mt-2 text-center text-xs text-cyan-100/70">Hunt geometric insects. Strip their plating, shear their limbs, then break the core.</p>
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {rows.map(([k, v]) => (<><div key={k} className="text-yellow-300">{k}</div><div key={v}>{v}</div></>))}
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-cyan-100/80">
          <li>Destroyed pieces drop components. Light parts (mass 14 or less) are scooped into storage the moment you touch them.</li>
          <li>Heavy pieces need the tether: tow them into the <b className="text-yellow-300">yellow hex</b> at the nest.</li>
          <li>Too heavy? Stronger cables, more harpoons on one part, or a better winch help. Overloaded cables snap.</li>
          <li>Sell components for credits or store them to craft weapons, shields, armour, optics, utilities and active abilities.</li>
          <li>Rare and above enemies wear grey armour layers around their parts; the deeper the zone, the more layers. Energy shields (blue hexes) swallow lasers and shock completely, but solid rounds pass through them.</li>
          <li>The nest only repairs after <b className="text-cyan-200">120s</b> without damage. Enemies finished mostly by the nest or its hex turrets drop no components.</li>
          <li>Hover a loose component to read its name, rarity, value and mass. Turn that off in ⚙ SETTINGS.</li>
          <li>Danger rises toward the centre of the map: bigger, deadlier, more layered enemies. Your progress autosaves.</li>
        </ul>
        <button onClick={onClose} className="mt-5 w-full rounded-sm border-2 border-cyan-300 bg-cyan-400/20 py-2 font-bold tracking-widest text-cyan-100 hover:bg-cyan-400/40">LAUNCH</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Hangar */
type Tab = "upgrades" | "craft" | "storage" | "loadout" | "settings";

function CompIcon({ c, size = 44 }: { c: Comp; size?: number }) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < c.poly.length; i += 2) { minx = Math.min(minx, c.poly[i]); maxx = Math.max(maxx, c.poly[i]); miny = Math.min(miny, c.poly[i + 1]); maxy = Math.max(maxy, c.poly[i + 1]); }
  const w = maxx - minx || 1, h = maxy - miny || 1, s = Math.max(w, h);
  const pts: string[] = [];
  for (let i = 0; i < c.poly.length; i += 2) pts.push(`${((c.poly[i] - minx) / s) * 40 + 4 + (40 - (w / s) * 40) / 2},${((c.poly[i + 1] - miny) / s) * 40 + 4 + (40 - (h / s) * 40) / 2}`);
  const col = RARITIES[c.tier].color;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: `drop-shadow(0 0 4px ${col})` }}>
      <polygon points={pts.join(" ")} fill={col + "30"} stroke={col} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

function Hangar({ game, hud, onClose }: { game: Game; hud: Hud; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("upgrades");
  const tabs: [Tab, string][] = [["upgrades", "UPGRADES"], ["craft", "CRAFTING"], ["storage", `STORAGE ${hud.inv}/${hud.cargo}`], ["loadout", "LOADOUT"], ["settings", "SYSTEM"]];
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 p-2 sm:p-6">
      <div className="flex h-full max-h-[760px] w-full max-w-5xl flex-col rounded-md border border-cyan-300/60 bg-[#060a18]/97 shadow-[0_0_50px_rgba(77,255,210,0.2)]">
        <div className="flex items-center gap-2 border-b border-cyan-300/30 p-2">
          <div className="px-2" title="Nest">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" />
              <path d="M12 8.2l4 2.3v4.6l-4 2.3-4-2.3v-4.6z" />
            </svg>
          </div>
          <div className="flex flex-1 flex-wrap gap-1">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`rounded-sm border px-3 py-1 text-xs font-bold tracking-wider ${tab === id ? "border-cyan-300 bg-cyan-400/25 text-white" : "border-white/15 text-cyan-200/70 hover:bg-white/10"}`}>{label}</button>
            ))}
          </div>
          <div className="px-2 text-sm font-bold text-yellow-300">{fmtNum(game.save.credits)} CR</div>
          <button onClick={onClose} className="rounded-sm border border-red-400/60 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20">CLOSE [E]</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {tab === "upgrades" && <Upgrades game={game} />}
          {tab === "craft" && <Craft game={game} />}
          {tab === "storage" && <Storage game={game} />}
          {tab === "loadout" && <Loadout game={game} />}
          {tab === "settings" && <Settings game={game} />}
        </div>
      </div>
    </div>
  );
}

function Upgrades({ game }: { game: Game }) {
  const [cat, setCat] = useState<UpCat>("weapons");
  const [qty, setQty] = useState<1 | 5 | 10 | "max">(1);
  const save = game.save;
  const free = game.admin.on && game.admin.credits;
  const qtyOptions: (1 | 5 | 10 | "max")[] = [1, 5, 10, "max"];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {UP_CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="rounded-sm border px-3 py-1 text-xs font-bold tracking-wider" style={{ borderColor: cat === c.id ? c.color : "rgba(255,255,255,0.15)", color: c.color, background: cat === c.id ? c.color + "22" : "transparent" }}>{c.name.toUpperCase()}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-sm border border-white/10 bg-white/[0.03] px-1.5 py-1">
          <span className="mr-1 text-[9px] font-bold tracking-[0.18em] text-white/40">BUY</span>
          {qtyOptions.map((q) => (
            <button key={q} onClick={() => setQty(q)} className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${qty === q ? "border-cyan-300 bg-cyan-400/25 text-white" : "border-white/15 text-cyan-200/60 hover:bg-white/10"}`}>
              {q === "max" ? "MAX" : `${q}×`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {UPGRADES.filter((u) => u.cat === cat).map((u) => {
          const l = save.upgrades[u.id] ?? 0;
          const maxed = l >= u.max;
          const room = u.max - l;
          const want = qty === "max" ? room : Math.min(qty, room);
          let n = 0, total = 0, fullTotal = 0;
          for (let k = 0; k < want; k++) {
            const c = free ? 0 : upgradeCost(u, l + k);
            fullTotal += c;
            if (free || total + c <= save.credits) { total += c; n++; }
          }
          const can = !maxed && (qty === "max" ? n > 0 : n === want);
          const color = UP_CATS.find((c) => c.id === u.cat)!.color;
          const label = maxed ? "MAX" : qty === "max" ? (n ? `MAX ${n}× · ${fmtNum(total)} CR` : `${fmtNum(upgradeCost(u, l))} CR`) : `${want}× · ${fmtNum(fullTotal)} CR`;
          return (
            <div key={u.id} className="rounded-sm border border-white/15 bg-white/[0.03] p-2.5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold" style={{ color }}>{u.name}</div>
                <div className="text-[11px] text-white/60">LV {l}/{u.max}</div>
              </div>
              <div className="text-[11px] text-white/60">{u.desc}</div>
              <div className="mt-1.5 flex gap-px">
                {Array.from({ length: u.max }).map((_, i) => <div key={i} className="h-1.5 flex-1" style={{ background: i < l ? color : "rgba(255,255,255,0.1)" }} />)}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs text-cyan-100">{u.fmt(l)}{!maxed && <span className="text-emerald-300"> → {u.fmt(l + 1)}</span>}</div>
                <button disabled={!can} onClick={() => game.buy(u.id, qty === "max" ? room : want)} title={qty === "max" ? "Buy as many levels as you can afford" : `Buy ${want} level(s)`} className={`rounded-sm border px-3 py-1 text-xs font-bold ${can ? "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30" : "border-white/10 text-white/30"}`}>
                  {label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function stars(n: number) { return "★".repeat(n) + "☆".repeat(5 - n); }

function effectText(game: Game, r: Recipe, eff: number) {
  const st = game.stats;
  const e = eff;
  if (r.slot === "ability") {
    const spec = ABILITY_LIST.find((a) => a.id === r.id);
    if (spec) return `${spec.desc} · ${(spec.cd / (0.7 + 0.3 * e)).toFixed(0)}s cooldown`;
  }
  switch (r.id) {
    case "pulse": return `Auto turret: ${fmtNum(st.dmg * 0.6 * e)} dmg every 0.45s`;
    case "scatter": return `6 pellets x ${fmtNum(st.dmg * 0.55 * e)} dmg`;
    case "missile": return `2 homing missiles x ${fmtNum(st.dmg * 2.2 * e)} dmg + splash`;
    case "lance": return `Beam ~${fmtNum(st.dmg * 0.45 * e * 8.3)} dps, pierces ${2 + Math.floor(e)} pieces`;
    case "deflector": return `+${fmtNum(st.hull * 0.45 * e)} shield`;
    case "absorber": return `+${fmtNum(st.hull * 0.22 * e)} shield, fast recharge`;
    case "reflector": return `+${fmtNum(st.hull * 0.32 * e)} shield, reflects bolts`;
    case "plating": return `+${Math.round(35 * e)}% max hull`;
    case "reactive": return `-${Math.round(clamp(12 * e, 0, 60))}% damage taken`;
    case "thorn": return `Hit shockwave ${fmtNum(st.dmg * 3 * e)} dmg, +${Math.round(10 * e)}% hull`;
    case "lens": return `Zoom out to ${clamp(1 / (1 + 1.96 * e), 0.056, 1).toFixed(2)}x (${Math.round(1 / clamp(1 / (1 + 1.96 * e), 0.056, 1))}x range)`;
    case "recall": return `Channel ${clamp(6 / (0.6 + 0.5 * e), 2, 6).toFixed(1)}s, cooldown ${Math.round(clamp(100 / (0.5 + 0.5 * e), 20, 100))}s`;
    case "magnet": return `Pulls loose parts from ${Math.round(420 + 320 * e)} units`;
    case "kinetic": return `+${fmtNum(st.hull * 0.38 * e)} shield, -${Math.round(clamp(30 * e, 10, 60))}% damage while it holds`;
    case "phase": return `+${fmtNum(st.hull * 0.25 * e)} shield, ${Math.round(clamp(12 * e, 0, 50))}% dodge`;
    case "ward": return `+${fmtNum(st.hull * 0.3 * e)} shield with near-instant recharge`;
    case "shell": return `+${fmtNum(st.hull * 0.2 * e)} shield, explodes when it breaks`;
    case "overcharge": return `+${fmtNum(st.hull * 0.7 * e)} shield, very slow recharge`;
    case "nullfield": return `+${fmtNum(st.hull * 0.35 * e)} shield, swallows enemy shots`;
    case "prismatic": return `+${fmtNum(st.hull * 0.4 * e)} shield, reflects bolts + dodge`;
    case "chitin": return `+${Math.round(25 * e)}% hull, -${(2 * e).toFixed(1)}% extra`;
    case "carapace": return `+${Math.round(55 * e)}% hull, slower engines`;
    case "nanoweave": return `+${(0.4 * e).toFixed(1)}%/s hull regen, +${Math.round(12 * e)}% hull`;
    case "ablative": return `-${Math.round(clamp(8 * e, 0, 50))}% damage taken`;
    case "titan": return `+${Math.round(90 * e)}% hull, much slower`;
    case "exoskeleton": return `+${Math.round(12 * e)}% thrust, +${Math.round(10 * e)}% accel`;
    case "venomguard": return `${Math.round(clamp(20 * e, 0, 90))}% poison resist, +${Math.round(8 * e)}% hull`;
    case "scalemail": return `+${Math.round(18 * e)}% hull, -${(3 * e).toFixed(1)}% damage`;
    default: return r.wpn ? `${fmtNum(st.dmg * r.wpn.dmg * e)} dmg · ${(r.wpn.cd / (0.7 + 0.3 * e)).toFixed(2)}s` : r.desc;
  }
}

function Craft({ game }: { game: Game }) {
  const [rid, setRid] = useState<string>(RECIPES[0].id);
  const [sel, setSel] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const r = RECIPE_BY_ID[rid];
  const inv = game.save.inventory;
  const chosen = sel.map((id) => inv.find((c) => c.id === id)).filter((c): c is Comp => !!c);
  const eff = craftEfficiency(r, chosen);
  const problem = recipeProblem(r, chosen);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= r.n ? s : [...s, id]));
  const autoFill = () => {
    const sorted = [...inv].sort((a, b) => b.tier - a.tier || b.mass - a.mass);
    const pick: Comp[] = [];
    if (r.need) {
      for (const c of sorted) if (pick.length < r.need.count && r.need.cats?.includes(KIND_CAT[c.kind])) pick.push(c);
    }
      if (r.species) {
      let have = pick.filter((c) => r.species!.names.includes(c.species)).length;
      for (const c of sorted) {
        if (have >= r.species.count || pick.length >= r.n) break;
        if (r.species.names.includes(c.species) && !pick.includes(c)) { pick.push(c); have++; }
      }
    }
    for (const c of sorted) if (pick.length < r.n && !pick.includes(c)) pick.push(c);
    setSel(pick.map((c) => c.id));
  };
  const doCraft = () => {
    const res = game.craft(rid, sel);
    if (res) setMsg(res); else { setMsg(`Crafted ${r.name}!`); setSel([]); }
  };
  const slots: Slot[] = ["weapon", "shield", "armor", "optics", "utility", "ability"];
  return (
    <div className="grid gap-3 md:grid-cols-[260px_1fr]">
      <div className="space-y-2">
        {slots.map((s) => (
          <div key={s}>
            <div className="mb-1 text-[10px] font-bold tracking-widest text-white/50">{SLOT_NAME[s].toUpperCase()}</div>
            {RECIPES.filter((x) => x.slot === s).map((x) => (
              <button key={x.id} onClick={() => { setRid(x.id); setSel([]); setMsg(""); }} className={`mb-1 flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left text-xs ${rid === x.id ? "border-yellow-300 bg-yellow-300/15" : "border-white/15 hover:bg-white/10"}`}>
                <RecipeIcon id={x.id} slot={x.slot} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-1"><span className="truncate font-bold text-cyan-100">{x.name}</span><span className="shrink-0 text-yellow-300">{stars(x.difficulty)}</span></div>
                  <div className="text-[10px] text-white/50">{x.n} components</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div>
        <div className="rounded-sm border border-yellow-300/40 bg-yellow-300/5 p-3">
          <div className="flex items-center gap-3">
            <RecipeIcon id={r.id} slot={r.slot} size={54} />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-black leading-tight text-yellow-200">{r.name}</div>
              <div className="text-yellow-300">Difficulty {stars(r.difficulty)}</div>
            </div>
          </div>
          <div className="text-xs text-white/70">{r.desc}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
            {(() => {
              const prof = damageProfile(r);
              return (
                <>
                  {prof.deals && <span className="rounded-sm border px-1.5 py-0.5 font-bold" style={{ borderColor: DMG_INFO[prof.deals].color + "88", color: DMG_INFO[prof.deals].color }}>DEALS {DMG_INFO[prof.deals].name.toUpperCase()}</span>}
                  {prof.blocks?.map((b) => <span key={b} className="rounded-sm border border-white/20 px-1.5 py-0.5 font-bold text-white/65">BLOCKS {DMG_INFO[b].name.toUpperCase()}</span>)}
                  {prof.deals && <span className="text-white/35">{DMG_INFO[prof.deals].note}</span>}
                </>
              );
            })()}
          </div>
          <div className="mt-1 text-xs text-cyan-200">
            Needs {r.n} components{r.need ? ` (at least ${r.need.count}x ${(r.need.cats ?? []).map((c) => CAT_NAME[c]).join(" or ")})` : ""}
            {r.species ? ` · ${r.species.count}x from ${r.species.names.join(" / ")}` : ""}.
          </div>
          <div className="mt-2 text-sm">
            Efficiency: <b className={eff >= 1.2 ? "text-emerald-300" : "text-yellow-200"}>{chosen.length ? `${Math.round(eff * 100)}%` : "—"}</b>
            {chosen.length > 0 && <span className="ml-2 text-xs text-emerald-200">{effectText(game, r, eff)}</span>}
          </div>
          <div className="text-[10px] text-white/40">Efficiency = 60% + 30% per average component rarity tier (cores count +½), minus 5% per difficulty step. Better recipes need more parts.</div>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={autoFill} className="rounded-sm border border-cyan-300/60 px-3 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20">AUTO-FILL BEST</button>
            <button onClick={() => setSel([])} className="rounded-sm border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10">CLEAR</button>
            <button disabled={!!problem && !game.admin.components} onClick={doCraft} className={`ml-auto rounded-sm border-2 px-5 py-1.5 text-sm font-black tracking-widest ${problem ? "border-white/10 text-white/30" : "border-yellow-300 bg-yellow-300/20 text-yellow-100 hover:bg-yellow-300/40"}`}>CRAFT</button>
          </div>
          <div className="mt-1 text-xs text-red-300">{problem && (chosen.length > 0 || !game.admin.components) ? problem : ""}{game.admin.components && <span className="text-fuchsia-300"> admin: free crafting</span>}{msg && <span className="text-emerald-300"> {msg}</span>}</div>
        </div>
        <div className="mb-1 mt-3 text-[10px] font-bold tracking-widest text-white/50">SELECT COMPONENTS ({sel.length}/{r.n})</div>
        {inv.length === 0 && <div className="text-sm text-white/50">No components stored. Harpoon drops back to base first!</div>}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {inv.map((c) => {
            const on = sel.includes(c.id);
            const col = RARITIES[c.tier].color;
            const need = !!r.need?.cats?.includes(KIND_CAT[c.kind]) || !!r.species?.names.includes(c.species);
            return (
              <button key={c.id} onClick={() => toggle(c.id)} className="flex items-center gap-2 rounded-sm border p-1.5 text-left" style={{ borderColor: on ? "#ffe14d" : col + "66", background: on ? "rgba(255,225,77,0.15)" : "rgba(255,255,255,0.03)" }}>
                <CompIcon c={c} size={36} />
                <div className="min-w-0 text-[10px] leading-tight">
                  <div className="truncate font-bold" style={{ color: col }}>{c.name}</div>
                  <div className="text-white/50">{RARITIES[c.tier].name} · {CAT_NAME[KIND_CAT[c.kind]]}{need ? " ✓" : ""}</div>
                  {r.species?.names.includes(c.species) && <div className="truncate text-fuchsia-300/80">required species</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Storage({ game }: { game: Game }) {
  const [below, setBelow] = useState(0);
  const inv = game.save.inventory;
  const mul = game.stats.sellMul;
  const total = inv.filter((c) => c.tier <= below).reduce((s, c) => s + Math.round(c.value * mul), 0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] p-2 text-xs">
        <span>Storage {inv.length}/{game.stats.cargo}</span>
        <span className="text-white/40">|</span>
        <span>Sell everything up to</span>
        <select value={below} onChange={(e) => setBelow(Number(e.target.value))} className="rounded-sm border border-white/20 bg-black px-1 py-0.5">
          {RARITIES.map((r, i) => <option key={r.id} value={i}>{r.name}</option>)}
        </select>
        <button onClick={() => game.sellBelow(below)} className="rounded-sm border border-yellow-300 bg-yellow-300/15 px-3 py-1 font-bold text-yellow-200 hover:bg-yellow-300/30">SELL ALL (+{fmtNum(total)} CR)</button>
        <label className="ml-auto flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={game.save.autoSell} onChange={(e) => game.setAutoSell(e.target.checked)} /> Auto-sell docked components</label>
      </div>
      {inv.length === 0 && <div className="py-10 text-center text-white/50">Nothing stored. Shoot enemy pieces, harpoon the glowing components and drag them into the yellow hex.</div>}
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {[...inv].sort((a, b) => b.tier - a.tier || b.value - a.value).map((c) => {
          const col = RARITIES[c.tier].color;
          return (
            <div key={c.id} className="flex items-center gap-2 rounded-sm border p-2" style={{ borderColor: col + "77", background: col + "0d" }}>
              <CompIcon c={c} size={52} />
              <div className="min-w-0 flex-1 text-[11px] leading-tight">
                <div className="truncate font-bold" style={{ color: col }}>{c.name}</div>
                <div className="text-white/60">{RARITIES[c.tier].name} · {CAT_NAME[KIND_CAT[c.kind]]}</div>
                <div className="text-white/40">Weight {fmtNum(c.mass)}</div>
              </div>
              <button onClick={() => game.sellComp(c.id)} className="rounded-sm border border-yellow-300/70 px-2 py-1 text-[11px] font-bold text-yellow-200 hover:bg-yellow-300/25">SELL<br />{fmtNum(Math.round(c.value * mul))}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlotSel({ game, slot, idx, value, title }: { game: Game; slot: Slot; idx: number; value: string | null; title: string }) {
  const items = game.save.crafted;
  const opts = items.filter((i) => RECIPE_BY_ID[i.rid]?.slot === slot);
  return (
    <div className="flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] p-2 text-xs">
      <div className="w-24 font-bold text-cyan-200">{title}</div>
      <select value={value ?? ""} onChange={(e) => game.equip(slot, idx, e.target.value || null)} className="min-w-0 flex-1 rounded-sm border border-white/20 bg-black px-1 py-1">
        <option value="">— empty —</option>
        {opts.map((i) => <option key={i.id} value={i.id}>{RECIPE_BY_ID[i.rid].name} ({Math.round(i.eff * 100)}%)</option>)}
      </select>
    </div>
  );
}

function Loadout({ game }: { game: Game }) {
  const save = game.save;
  const items = save.crafted;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold tracking-widest text-white/50">EQUIPPED</div>
        {[0, 1, 2].map((i) => <SlotSel key={i} game={game} slot="weapon" idx={i} value={save.equip.weapon[i]} title={`Weapon ${i + 1}`} />)}
        <SlotSel game={game} slot="shield" idx={0} value={save.equip.shield} title="Shield" />
        <SlotSel game={game} slot="armor" idx={0} value={save.equip.armor} title="Armour" />
        <SlotSel game={game} slot="optics" idx={0} value={save.equip.optics} title="Optics" />
        <SlotSel game={game} slot="utility" idx={0} value={save.equip.utility} title="Utility" />
        <div className="mt-2 text-[10px] font-bold tracking-widest text-white/50">ACTIVE ABILITIES</div>
        {["Z", "X", "C", "V", "F"].map((k, i) => <SlotSel key={k} game={game} slot="ability" idx={i} value={save.abilitySlots[i]} title={`[${k}] Ability`} />)}
        <div className="mt-2 rounded-sm border border-white/10 p-2 text-[11px] text-white/60">
          Integrity {fmtNum(game.stats.hull)} · Shield {fmtNum(game.stats.shieldMax)} · Damage taken -{Math.round((1 - (1 - game.stats.armor) * (1 - game.stats.reactive)) * 100)}% · Zoom {game.stats.zoomMin.toFixed(2)}x
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold tracking-widest text-white/50">CRAFTED ITEMS ({items.length})</div>
        {items.length === 0 && <div className="text-sm text-white/50">Nothing crafted yet. Store components, then visit the Crafting tab.</div>}
        {items.map((i) => {
          const r = RECIPE_BY_ID[i.rid];
          return (
            <div key={i.id} className="flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] p-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-yellow-200">{r.name} <span className="text-white/50">· {SLOT_NAME[r.slot]}</span></div>
                <div className="text-white/60">{Math.round(i.eff * 100)}% efficiency · {effectText(game, r, i.eff)}</div>
              </div>
              <button onClick={() => game.scrap(i.id)} className="rounded-sm border border-red-400/50 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20">SCRAP</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Settings({ game }: { game: Game }) {
  const apply = (fn: () => void) => {
    fn();
    game.persist(true);
    void game.pushServer();
  };
  return (
    <SettingsPanel
      save={game.save}
      onAutoFire={(v) => { game.setAutoFire(v); }}
      onShowCompInfo={(v) => { game.setShowCompInfo(v); }}
      onShowRanges={(v) => { game.setShowRanges(v); }}
      onAutoSell={(v) => { game.setAutoSell(v); }}
      onName={(v) => { game.setName(v); }}
      onReset={() => apply(() => game.hardReset(newSave()))}
      onRestore={(save) => apply(() => game.hardReset(save))}
    />
  );
}

/* ---------------------------------------------------------------- Admin */
function AdminPanel({ game, hud, onClose }: { game: Game; hud: Hud; onClose: () => void }) {
  const a = hud.admin;
  /* Remember the last species/rarity picked in the spawner: spawning the same
   * test subject over and over should not need two dropdown clicks each time.
   * The panel only mounts after a click, so reading storage here is client-only. */
  const [spawn, setSpawn] = useState<{ spi: number; tier: number }>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("wof-admin-spawn") : null;
      if (!raw) return { spi: 0, tier: 2 };
      const o = JSON.parse(raw) as { id?: string; tier?: number };
      const idx = o.id ? SPECIES_LIST.findIndex((sp) => sp.id === o.id) : -1;
      const tv = typeof o.tier === "number" ? clamp(Math.round(o.tier), 0, 5) : 2;
      return { spi: idx >= 0 ? idx : 0, tier: tv };
    } catch { return { spi: 0, tier: 2 }; }
  });
  const spi = spawn.spi, tier = spawn.tier;
  const setSpi = (v: number) => setSpawn((cur) => ({ ...cur, spi: v }));
  const setTier = (v: number) => setSpawn((cur) => ({ ...cur, tier: v }));
  useEffect(() => {
    try {
      window.localStorage.setItem("wof-admin-spawn", JSON.stringify({ id: SPECIES_LIST[spi]?.id, tier }));
    } catch { /* storage unavailable */ }
  }, [spi, tier]);
  const rows: [keyof typeof a, string, string][] = [
    ["credits", "Infinite Credits", "Upgrades cost nothing and crafting stays affordable."],
    ["health", "Infinite Health", "Hull and shield are pinned at maximum."],
    ["damage", "Infinite Damage", "Every shot deals 100x damage."],
    ["components", "Infinite Components", "Craft anything without spending components."],
  ];
  return (
    <div className="absolute left-3 top-24 z-40 max-h-[calc(100vh-7rem)] w-80 overflow-y-auto rounded-md border border-fuchsia-400/60 bg-[#0b0714]/95 p-3 text-xs shadow-[0_0_30px_rgba(255,122,217,0.25)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black tracking-[0.25em] text-fuchsia-300">ADMIN</div>
        <button onClick={onClose} className="rounded-sm border border-white/25 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10">CLOSE [`]</button>
      </div>
      <label className="mt-2 flex cursor-pointer items-center justify-between rounded-sm border border-fuchsia-300/30 bg-fuchsia-500/10 px-2 py-1.5">
        <span className="font-bold text-fuchsia-200">Enable admin mode</span>
        <input type="checkbox" checked={a.on} onChange={(e) => game.setAdmin("on", e.target.checked)} />
      </label>
      <div className={`mt-2 space-y-1 ${a.on ? "" : "opacity-50"}`}>
        {rows.map(([key, label, desc]) => (
          <label key={key} className="flex cursor-pointer items-start gap-2 rounded-sm border border-white/10 bg-white/[0.03] p-1.5" title={desc}>
            <input type="checkbox" className="mt-0.5" disabled={!a.on} checked={a[key]} onChange={(e) => game.setAdmin(key, e.target.checked)} />
            <span>
              <span className="block font-bold text-white/85">{label}</span>
              <span className="block text-[10px] leading-tight text-white/45">{desc}</span>
            </span>
          </label>
        ))}
      </div>
      <div className={`mt-2 rounded-sm border border-fuchsia-300/30 bg-fuchsia-500/5 p-2 ${a.on ? "" : "opacity-50"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-[0.2em] text-fuchsia-200">TEST RANGE</span>
          <span className={`text-[9px] ${a.sandbox ? "text-emerald-300" : "text-white/35"}`}>{a.sandbox ? "EMPTY MAP" : "LIVE MAP"}</span>
        </div>
        <button
          disabled={!a.on}
          onClick={() => game.adminTestRange(!a.sandbox)}
          className={`mt-1 w-full rounded-sm border px-2 py-1 text-[10px] font-black tracking-wide ${a.sandbox ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/30" : "border-fuchsia-300/60 bg-fuchsia-400/15 text-fuchsia-100 hover:bg-fuchsia-400/30"} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {a.sandbox ? "LEAVE EMPTY MAP" : "TELEPORT TO EMPTY MAP"}
        </button>
        <div className="mt-2 flex gap-1">
          <select
            value={spi}
            disabled={!a.on}
            onChange={(e) => setSpi(Number(e.target.value))}
            className="min-w-0 flex-1 rounded-sm border border-white/15 bg-[#120a1e] px-1 py-1 text-[10px] text-white/85"
          >
            {SPECIES_LIST.map((s, i) => (
              <option key={s.id} value={i}>{s.name}{s.boss ? " (boss)" : ""}</option>
            ))}
          </select>
          <select
            value={tier}
            disabled={!a.on}
            onChange={(e) => setTier(Number(e.target.value))}
            className="w-24 rounded-sm border border-white/15 bg-[#120a1e] px-1 py-1 text-[10px] text-white/85"
          >
            {RARITIES.map((r, i) => <option key={r.id} value={i}>{r.name}</option>)}
          </select>
        </div>
        <div className="mt-1 flex gap-1">
          <button disabled={!a.on} onClick={() => game.adminSpawn(spi, tier, 1)} className="flex-1 rounded-sm border border-fuchsia-300/50 bg-fuchsia-400/15 px-2 py-1 text-[10px] font-black text-fuchsia-100 hover:bg-fuchsia-400/30 disabled:opacity-40">SPAWN</button>
          <button disabled={!a.on} onClick={() => game.adminSpawn(spi, tier, 5)} className="flex-1 rounded-sm border border-fuchsia-300/50 bg-fuchsia-400/15 px-2 py-1 text-[10px] font-black text-fuchsia-100 hover:bg-fuchsia-400/30 disabled:opacity-40">SPAWN ×5</button>
          <button disabled={!a.on} onClick={() => game.adminClearEnemies()} className="rounded-sm border border-white/20 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10 disabled:opacity-40">CLEAR</button>
        </div>
        <div className="mt-1 text-[9px] leading-tight text-white/35">Empty map disables all ambient seeding, top-up and the visibility floor. Spawns appear toward the cursor.</div>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => game.adminAll(true)} className="flex-1 rounded-sm border border-fuchsia-300/50 bg-fuchsia-400/15 px-2 py-1 text-[10px] font-bold text-fuchsia-200 hover:bg-fuchsia-400/30">ALL ON</button>
        <button onClick={() => game.adminAll(false)} className="flex-1 rounded-sm border border-white/20 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10">ALL OFF</button>
      </div>
      <button onClick={() => game.adminCredits(1_000_000)} className="mt-2 w-full rounded-sm border border-yellow-300 bg-yellow-300/15 px-2 py-1 text-[11px] font-black text-yellow-200 hover:bg-yellow-300/30">+1,000,000 CR</button>
      <div className="mt-2 text-[9px] leading-tight text-white/35">Admin stays on when you return home. Flags are kept in this tab, not in your pilot save.</div>
    </div>
  );
}
