"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Game, type Hud } from "@/game/engine";
import { render } from "@/game/render";
import {
  BASE, ULTRA_ZONE, zoneAt, ABILITY_LIST, CANNONS, CANNON_BY_ID, CAT_NAME, DMG_INFO, KIND_CAT, RARITIES, RECIPES, RECIPE_BY_ID, SLOT_NAME, UPGRADES, UP_CATS,
  cannonBillProblem, cannonDmg, cannonOwned, cannonRate, cannonTracks, cannonTrackCost, cannonTrackValue, craftEfficiency, damageProfile,
  migrate, newSave, partBillText, recipeProblem, upgradeCost,
  type CannonDef, type CannonTrackId, type Comp, type Recipe, type SaveData, type Slot, type UpCat,
} from "@/game/data";
import { clamp, fmtNum } from "@/game/math";
import { SPECIES_LIST } from "@/game/enemies";
import { MAP_GRID, MAP_CELL, MAP_RADIUS, isUltraZone } from "@/game/world";
import SettingsPanel from "@/components/SettingsPanel";
import RecipeIcon from "@/components/RecipeIcon";
import Bestiary, { BeeIcon } from "@/components/Bestiary";
import { guestName, readGuestSave, resolveSession, saveKeyFor, writeGuestSave } from "@/game/accounts";

const PID_KEY = "neon-hive-pid";

function getPid() {
  let id = localStorage.getItem(PID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(PID_KEY, id);
  }
  return id;
}

async function loadSave(pid: string, saveKey: string): Promise<SaveData> {
  let local: SaveData | null = null;
  try {
    const raw = localStorage.getItem(saveKey);
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
  const allowedEntry = useRef<boolean | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const creditRef = useRef<HTMLDivElement | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const gameRef2 = useRef<Game | null>(null);
  useEffect(() => { gameRef2.current = game; }, [game]);

  /** Leave the run, but never lose the run: write the local save before routing. */
  const goHome = () => {
    const g = gameRef2.current;
    if (g) { g.persist(true); void g.pushServer(); }
    router.push("/");
  };
  /* Losing the base ends the run: the engine has already applied the penalties
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
      if (allowedEntry.current === null) {
        allowedEntry.current = sessionStorage.getItem("wof-enter-game") === "1";
        sessionStorage.removeItem("wof-enter-game");
      }
      if (!allowedEntry.current) { router.replace("/"); return; }
      /* Accounts come first: a signed-in player plays their own save slot. */
      const sess = await resolveSession();
      if (stopped) return;
      setAccount(sess?.name ?? null);
      const pid = sess ? sess.id : getPid();
      const saveKey = saveKeyFor(sess);
      const save = sess ? await loadSave(pid, saveKey) : readGuestSave() ?? newSave();
      if (stopped) return;
      if (!sess) save.name = guestName();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const game = new Game(save, pid);
      game.localSaveKey = saveKey;
      /* Guests get a run that lives only in this page: no disk, no server. */
      game.persistent = Boolean(sess);
      if (!sess) game.saveSink = writeGuestSave;
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
        if (e.code === "Escape") {
          e.preventDefault();
          /* Esc is the settings key: it opens the panel, and closes whatever is
           * already up (settings first, then the other screens). */
          if (settingsRef.current) { setSettingsOpen(false); return; }
          if (menuRef.current || adminRef.current || bestiaryRef.current) {
            setMenu(false); setAdminOpen(false); setBestiaryOpen(false);
            return;
          }
          game.blur();
          setSettingsOpen(true);
          return;
        }
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

      /* The site pauses the sim while it swaps to a new build (see UpdateGuard). */
      const onUpdating = () => { game.paused = true; game.beaconSave(); };
      const onResume = () => { game.paused = false; };
      window.addEventListener("wof:updating", onUpdating);
      window.addEventListener("wof:resume", onResume);
      cleanups.push(() => {
        window.removeEventListener("wof:updating", onUpdating);
        window.removeEventListener("wof:resume", onResume);
      });

      const vis = () => { if (document.visibilityState === "hidden") game.beaconSave(); };
      const unload = () => game.beaconSave();
      const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) router.replace("/"); };
      window.addEventListener("pageshow", onPageShow);
      cleanups.push(() => window.removeEventListener("pageshow", onPageShow));
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
      {hud && game && <Hud_ hud={hud} creditRef={creditRef} onOpen={() => { game.blur(); setAdminOpen(false); setMenu(true); }} onHelp={() => setHelp(true)} onAdmin={() => { game.blur(); setMenu(false); setAdminOpen(true); }} onToggleAuto={() => game.toggleAutoFire()} onSettings={() => { game.blur(); setSettingsOpen(true); }} onBestiary={() => { game.blur(); setBestiaryOpen(true); }} onHome={goHome} account={account} />}
      {hud && <div aria-live="polite" className="pointer-events-none absolute bottom-4 left-4 z-[70] flex max-w-[min(34rem,85vw)] flex-col items-start gap-1.5">
        {hud.ultraNotices.map((notice) => <div key={notice.id} className="rounded-sm border border-white/60 px-3 py-1.5 text-sm font-black text-black shadow-lg" style={{ background: "linear-gradient(110deg, #ffffff, #cccccc 55%, #999999)" }}>{notice.msg}</div>)}
      </div>}
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

function Hud_({ hud, creditRef, onOpen, onHelp, onAdmin, onSettings, onBestiary, onHome, onToggleAuto, account }: { hud: Hud; creditRef: React.RefObject<HTMLDivElement | null>; onOpen: () => void; onHelp: () => void; onAdmin: () => void; onSettings: () => void; onBestiary: () => void; onHome: () => void; onToggleAuto: () => void; account: string | null }) {
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
        {/* the gauge only means something on a gun that cooks: damage climbs with
            it, and a full gauge is three seconds of dead trigger */}
        {hud.jamOf > 0 && (hud.heat > 0.02 || hud.jam > 0) && (
          <div className="flex items-center gap-1.5" title={hud.jam > 0 ? `Overheated - cooling ${hud.jam.toFixed(1)}s` : "Barrel heat: damage climbs as it heats"}>
            <span className={`text-[11px] leading-none ${hud.jam > 0 ? "text-red-400" : "text-amber-300/80"}`}>{hud.jam > 0 ? "⚠" : "▲"}</span>
            <div className={`relative w-28 overflow-hidden rounded-sm border bg-black/50 ${hud.jam > 0 ? "border-red-400/70" : "border-white/20"}`} style={{ height: 8 }}>
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-75"
                style={{
                  width: `${clamp(hud.heat, 0, 1) * 100}%`,
                  background: hud.jam > 0 ? "#ff4d6d" : hud.heat > 0.75 ? "#ff7a3d" : "#ffd24d",
                  boxShadow: `0 0 10px ${hud.jam > 0 ? "#ff4d6d" : "#ffb04d"}`,
                }}
              />
            </div>
            {hud.jam > 0 && <span className="text-[9px] font-black text-red-300">{hud.jam.toFixed(1)}s</span>}
          </div>
        )}
        {(hud.baseNear || hud.baseHp < hud.baseMaxHp) && !hud.baseLost && (
          <div className="flex items-center gap-1.5" title={`Base integrity · ${hud.baseTurrets.filter(Boolean).length}/6 defence turrets`}>
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
        <div ref={creditRef} className="relative mt-1 flex items-center gap-1.5 text-sm font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(255,225,77,0.7)]">
          <span
            key={hud.creditTick}
            className="credit-pop inline-flex drop-shadow-[0_0_6px_rgba(255,210,77,0.8)]"
            style={{ "--pop": hud.creditPop.s } as CSSProperties}
          >
            <CreditCoin size={17} />
          </span>
          <span>{fmtNum(hud.credits)}</span>
          {hud.creditPop.v > 0 && (
            <span
              key={`f${hud.creditPop.v}-${hud.creditTick}`}
              className="credit-float pointer-events-none absolute left-5 top-[-2px] whitespace-nowrap text-[13px] font-black text-yellow-200"
              style={{ "--pop": hud.creditPop.s } as CSSProperties}
            >
              +{fmtNum(hud.creditPop.v)}
            </span>
          )}
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
        {account && <span className="text-cyan-200/45">@{account}</span>}
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
        <button onClick={onOpen} title="Open base (E)" className="absolute bottom-16 left-1/2 grid h-11 w-11 -translate-x-1/2 animate-pulse place-items-center rounded-full border-2 border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(77,255,210,0.5)] hover:bg-cyan-400/30">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" />
            <path d="M12 8.2l4 2.3v4.6l-4 2.3-4-2.3v-4.6z" />
          </svg>
        </button>
      )}
      {hud.baseLost && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-[#180404]/85">
          <div className="max-w-[92vw] text-center">
            <div className="text-4xl font-black tracking-[0.28em] text-red-400 drop-shadow-[0_0_26px_#ff2d55] sm:text-6xl">BASE DESTROYED</div>
            <div className="mt-4 text-sm font-bold text-orange-200 sm:text-base">ALL STORED COMPONENTS LOST · HALF YOUR CREDITS INCINERATED</div>
            <div className="mt-2 text-xs tracking-[0.18em] text-white/45">THE SWARM IS ASH · RETURNING TO TITLE {Math.max(1, Math.ceil(hud.baseLostT))}…</div>
          </div>
        </div>
      )}
      {hud.dead && !hud.baseLost && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-red-950/40">
          <div className="text-center">
            <div className="text-4xl font-black tracking-[0.3em] text-red-400 drop-shadow-[0_0_20px_#ff2d55]">CORE DESTROYED</div>
            <div className="mt-2 text-red-200">Reforming at the base in {Math.ceil(hud.respawn)}…</div>
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
    ["E", "Open the base at your base"],
    ["ESC", "Settings: how the ship handles, the look, aim aids"],
    ["CANNON tab", "The tree reads bottom-up: the free Stinger sits at the bottom, then three tier 1 guns above it. A chassis costs credits plus a bill of named common parts and an uncommon core. Each gun keeps its own upgrades — only one is fitted"],
    ["Weapon aiming", "Crafted weapons fire while any piece of a body is in range. They go for the core first, then shield generators and guns, then whatever piece is closest"],
    ["Base cannon", "Dormant until the base is hit, then online for 120s; only tracks rare+ targets and one-shots legendaries"],
    ["Base retaliation", "Any insect that damages the base is instantly destroyed — no swarming the hull"],
    ["Base targeting", "Insects hunt your ship, never the base — they will follow you straight through turret range, and stray fire can still scar the hull"],
    ["Credits", "Broken enemy parts throw credit coins straight into your counter — nothing to pick up. Coins land as one collection, so a fat break reads as +1.2k"],
    ["Energy shields", "A solid panel wall across the front of most rare+ bodies: you cannot fly through it, only around it — the tail is the way in. Touching one shocks the hull and throws you off it"],
    ["Hex turrets", "Six fast, weak point-defence turrets; one dies for every 1/6 of base integrity lost"],
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
          <li>Destroyed pieces drop components. Only light parts (mass 7 or less) can be dragged by the magnet or scooped up on contact.</li>
          <li>Heavy pieces need the tether: tow them into the <b className="text-yellow-300">yellow hex</b> at the base.</li>
          <li>Too heavy? Stronger cables, more harpoons on one part, or a better winch help. Overloaded cables snap.</li>
          <li>Sell components for credits or store them to craft weapons, shields, armour, optics, utilities and active abilities.</li>
          <li>Rare and above enemies wear grey armour layers around their parts; the deeper the zone, the more layers. Energy shield panels stop solid rounds dead but let energy, shock and thermal straight through — shoot the gaps between the panels.</li>
          <li>The base only repairs after <b className="text-cyan-200">120s</b> without damage. Enemies finished mostly by the base or its hex turrets drop no components.</li>
          <li>Hover a loose component to read its name, rarity, value and mass. Turn that off in ⚙ SETTINGS.</li>
          <li>Danger rises toward the centre of the map: bigger, deadlier, more layered enemies. Accounts autosave; a guest run is never written down.</li>
        </ul>
        <button onClick={onClose} className="mt-5 w-full rounded-sm border-2 border-cyan-300 bg-cyan-400/20 py-2 font-bold tracking-widest text-cyan-100 hover:bg-cyan-400/40">LAUNCH</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Hangar */
type Tab = "cannon" | "upgrades" | "craft" | "storage" | "loadout" | "settings";

function CompIcon({ c, size = 44 }: { c: Comp; size?: number }) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < c.poly.length; i += 2) { minx = Math.min(minx, c.poly[i]); maxx = Math.max(maxx, c.poly[i]); miny = Math.min(miny, c.poly[i + 1]); maxy = Math.max(maxy, c.poly[i + 1]); }
  const w = maxx - minx || 1, h = maxy - miny || 1, s = Math.max(w, h);
  const pts: string[] = [];
  for (let i = 0; i < c.poly.length; i += 2) pts.push(`${((c.poly[i] - minx) / s) * 40 + 4 + (40 - (w / s) * 40) / 2},${((c.poly[i + 1] - miny) / s) * 40 + 4 + (40 - (h / s) * 40) / 2}`);
  const col = c.tier === 6 ? "#d0d0d0" : RARITIES[c.tier].color;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: `drop-shadow(0 0 4px ${col})` }}>
      {c.tier === 6 && <defs><linearGradient id="ultra-piece-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#454545" /><stop offset="40%" stopColor="#0a0a0a" /><stop offset="100%" stopColor="#000000" /></linearGradient></defs>}
      <polygon points={pts.join(" ")} fill={c.tier === 6 ? "url(#ultra-piece-gradient)" : col + "30"} stroke={col} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

function Hangar({ game, hud, onClose }: { game: Game; hud: Hud; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("upgrades");
  const tabs: [Tab, string][] = [["cannon", "CANNON"], ["upgrades", "UPGRADES"], ["craft", "CRAFTING"], ["storage", `STORAGE ${hud.inv}/${hud.cargo}`], ["loadout", "LOADOUT"], ["settings", "SYSTEM"]];
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 p-2 sm:p-6">
      <div className="flex h-full max-h-[760px] w-full max-w-5xl flex-col rounded-md border border-cyan-300/60 bg-[#060a18]/97 shadow-[0_0_50px_rgba(77,255,210,0.2)]">
        <div className="flex items-center gap-2 border-b border-cyan-300/30 p-2">
          <div className="px-2" title="Base">
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
          {tab === "cannon" && <CannonTree game={game} />}
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

/** The chassis as a side profile, drawn from the same `look` data the hull uses:
 *  fat bolt thrower, long lance, three spigots or a genuine twin. */
function CannonIcon({ c, className }: { c: CannonDef; className?: string }) {
  const { style, bore, len, hue } = c.look;
  const trim = `hsl(${hue} 92% 64%)`;
  const steel = "#0b1a26";
  const edge = `hsl(${hue} 70% 48%)`;
  const cy = 13;
  const x1 = Math.min(46, 10 + len);
  const barrel = (y: number, w: number, xEnd: number, key: string) => (
    <g key={key}>
      <rect x={10} y={y - w} width={Math.max(2, xEnd - 10)} height={w * 2} rx={0.8} fill={steel} stroke={edge} strokeWidth={0.7} />
      <line x1={12} y1={y} x2={xEnd - 1.5} y2={y} stroke={trim} strokeWidth={0.8} opacity={0.9} />
      <ellipse cx={xEnd} cy={y} rx={0.8} ry={w + 0.4} fill="none" stroke={trim} strokeWidth={0.7} />
    </g>
  );
  return (
    <svg viewBox="0 0 48 26" className={className} aria-hidden>
      {/* breech block bolted to the hull */}
      <path d={`M6 ${cy - bore - 2} L11 ${cy - bore - 3.4} L11 ${cy + bore + 3.4} L6 ${cy + bore + 2} Z`} fill={steel} stroke={edge} strokeWidth={0.7} />
      {style === "spray" && (
        <>
          {barrel(cy - 3.4, bore * 0.62, x1 - 2, "a")}
          {barrel(cy + 3.4, bore * 0.62, x1 - 2, "c")}
          {barrel(cy, bore * 0.72, x1, "b")}
        </>
      )}
      {style === "lance" && (
        <>
          <rect x={11} y={cy - bore - 2.6} width={Math.max(2, x1 - 16)} height={(bore + 2.6) * 2} fill="rgba(120,200,235,0.10)" stroke={`hsl(${hue} 80% 70% / 0.45)`} strokeWidth={0.6} />
          {barrel(cy, bore, x1, "a")}
          {[0, 1].map((k) => (
            <line key={k} x1={18 + k * 7} y1={cy - bore - 2.2} x2={18 + k * 7} y2={cy + bore + 2.2} stroke={trim} strokeWidth={1.1} />
          ))}
        </>
      )}
      {style === "twin" && (
        <>
          {c.muzzles.map((m, i) => barrel(cy + m.y, bore * 0.72, x1, `m${i}`))}
          <line x1={13} y1={cy + c.muzzles[0].y} x2={13} y2={cy + c.muzzles[c.muzzles.length - 1].y} stroke={edge} strokeWidth={1} />
        </>
      )}
      {style === "bolt" && (
        <>
          {barrel(cy, bore, x1 - 4, "a")}
          <path d={`M${x1 - 4} ${cy - bore - 2.4} L${x1 + 1} ${cy - bore - 3.6} L${x1 + 1} ${cy + bore + 3.6} L${x1 - 4} ${cy + bore + 2.4} Z`} fill={steel} stroke={edge} strokeWidth={0.7} />
        </>
      )}
    </svg>
  );
}

/* A small glyph for every upgrade node, so a branch is pictures and not just
 * words: a round for damage, a dial for rate, a seam for crit, a spike through
 * plating for penetration, a crosshair for accuracy, chevrons for speed and a
 * pair of tubes for the second barrel. */
function TrackIcon({ id, hue, className }: { id: CannonTrackId; hue: number; className?: string }) {
  const c = `hsl(${hue} 92% 66%)`;
  const dim = `hsl(${hue} 60% 40%)`;
  const g = (children: ReactNode) => (
    <svg viewBox="0 0 20 20" className={className} aria-hidden fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
  switch (id) {
    case "dmg": return g(<><circle cx="7" cy="10" r="3.4" fill={c} fillOpacity={0.25} /><path d="M12 10h5M14 7.6l2.4 2.4-2.4 2.4" /></>);
    case "rate": return g(<><circle cx="10" cy="10" r="6.2" stroke={dim} /><path d="M10 6.2V10l3 1.8" /></>);
    case "crit": return g(<><path d="M10 2.6l2 4.6 4.9.5-3.7 3.3 1.1 4.8-4.3-2.5-4.3 2.5 1.1-4.8L3.1 7.7l4.9-.5z" fill={c} fillOpacity={0.2} /></>);
    case "critDmg": return g(<><path d="M10 2.6l2 4.6 4.9.5-3.7 3.3 1.1 4.8-4.3-2.5-4.3 2.5 1.1-4.8L3.1 7.7l4.9-.5z" fill={c} fillOpacity={0.2} /><circle cx="10" cy="9.6" r="2" stroke="#fff8cf" /></>);
    case "pen": return g(<><path d="M2 10h8M7 6.6L10.6 10 7 13.4" /><path d="M12.5 3.5v13" stroke={dim} /><path d="M15 10h3.4" /></>);
    case "acc": return g(<><circle cx="10" cy="10" r="6" stroke={dim} /><circle cx="10" cy="10" r="2.4" /><path d="M10 1.6v3.4M10 15v3.4M1.6 10h3.4M15 10h3.4" /></>);
    case "speed": return g(<><path d="M3 5.6l5 4.4-5 4.4M9.6 5.6l5 4.4-5 4.4M16.2 5.6l2.2 4.4-2.2 4.4" stroke={dim} /><path d="M3 5.6l5 4.4-5 4.4" /></>);
    case "barrels": return g(<><rect x="3" y="5.4" width="14" height="3" rx="1" /><rect x="3" y="11.4" width="14" height="3" rx="1" /><path d="M17 6.9h1.6M17 12.9h1.6" /></>);
  }
}

/* Cannon tree, drawn as a tree: the free Stinger is the root at the bottom, a
 * trunk climbs to a bus, and every chassis of the next tier hangs off it as a
 * node. A node is small on purpose — its own silhouette, its name, its state —
 * and it only opens into the full card (the sheet's line, the numbers, the bill
 * and the build button) while you are on it. Take a gun in a tier and the rest
 * of that row greys out: one gun per tier is not a rule to be read, it is a row
 * that is no longer for sale. */
function CannonTree({ game }: { game: Game }) {
  const save = game.save;
  const fitted = CANNON_BY_ID[save.cannon?.id ?? ""] ?? CANNONS[0];
  const free = game.admin.on && game.admin.credits;
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const fittedLv = save.cannon?.lv?.[fitted.id] ?? {};
  const freeParts = game.admin.on && game.admin.components;

  /* one node: compact by default, the whole card while it is open */
  const node = (c: CannonDef, down: boolean, align: "left" | "mid" | "right") => {
    const owned = cannonOwned(save, c.id);
    const selected = fitted.id === c.id;
    const cl = save.cannon?.lv?.[c.id] ?? {};
    const problem = cannonBillProblem(save, c, freeParts, game.admin.on);
    /* the row is decided: everything else in it is out of the running */
    const dim = !owned && CANNONS.some((o) => o.id !== c.id && o.tier === c.tier && cannonOwned(save, o.id));
    const heats = (c.heatMax ?? 1) > 1;
    const hot = Math.round(cannonDmg(c, cl) * (c.heatMax ?? 1));
    const isOpen = open === c.id;
    return (
      <div
        key={c.id}
        className="relative"
        onMouseEnter={() => setOpen(c.id)}
        onMouseLeave={() => setOpen((v) => (v === c.id ? null : v))}
      >
        <button
          onClick={() => {
            setOpen((v) => (v === c.id ? null : c.id));
            if (owned) { game.selectCannon(c.id); setMsg(null); }
          }}
          title={owned ? `${c.name} — click to fit` : c.name}
          className={`flex h-[52px] w-full flex-col items-center justify-center gap-0 rounded-sm border px-0.5 transition duration-150 ${
            selected ? "border-yellow-300/80 bg-yellow-300/10 shadow-[0_0_20px_rgba(255,225,77,0.22)]"
              : owned ? "border-cyan-300/50 bg-cyan-400/5 hover:border-cyan-200/80 hover:bg-cyan-400/10"
                : dim ? "border-white/10 bg-black/30 opacity-35 grayscale"
                  : "border-white/20 bg-black/40 hover:border-white/45 hover:bg-white/5"
          } ${isOpen ? "scale-[1.05]" : ""}`}
        >
          <CannonIcon c={c} className="h-5 w-10 shrink-0" />
          <span className={`w-full truncate text-center text-[9px] font-black leading-tight tracking-wide ${selected ? "text-yellow-100" : owned ? "text-cyan-100" : "text-white/80"}`}>
            {c.name}
          </span>
          <span className="text-[7px] font-black tracking-[0.16em]">
            {selected ? <span className="text-yellow-300">FITTED</span>
              : owned ? <span className="text-cyan-300/80">OWNED</span>
                : <span className="text-white/30">T{c.tier}</span>}
          </span>
        </button>

        {isOpen && !dim && (
          <div
            className={`absolute z-40 w-[248px] ${align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"} ${
              down ? "top-full pt-1" : "bottom-full pb-1"
            }`}
          >
            <div className={`rounded-sm border bg-[#050e16]/97 p-2 shadow-[0_14px_44px_rgba(0,0,0,0.8)] ${selected ? "border-yellow-300/60" : owned ? "border-cyan-300/50" : "border-white/25"}`}>
              <div className="flex items-center gap-1.5">
                <CannonIcon c={c} className="h-6 w-12 shrink-0" />
                <span className={`min-w-0 flex-1 truncate text-[12px] font-black ${selected ? "text-yellow-100" : "text-white"}`}>{c.name}</span>
                <span className="shrink-0 rounded-sm border border-yellow-300/40 bg-yellow-300/10 px-1 py-0.5 text-[8px] font-black text-yellow-200">TIER {c.tier}</span>
              </div>
              <p className="mt-1 text-[10px] italic leading-snug text-white/55">&ldquo;{c.desc}&rdquo;</p>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/60">
                <span>
                  <b className="text-white/90">{fmtNum(cannonDmg(c, cl))}</b>
                  {heats && <> → <b className="text-orange-300">{fmtNum(hot)}</b> hot</>} dmg
                </span>
                <span><b className="text-white/90">{cannonRate(c, cl).toFixed(c.hitscan ? 2 : 1)}</b>/s</span>
                <span>{c.hitscan ? "hitscan" : `${c.range}u`}</span>
              </div>
              {owned ? (
                <button
                  onClick={() => { game.selectCannon(c.id); setMsg(null); setOpen(null); }}
                  disabled={selected}
                  className={`mt-1.5 w-full rounded-sm border px-2 py-1 text-[10px] font-black tracking-[0.16em] ${
                    selected ? "border-yellow-300/50 text-yellow-200/80" : "border-cyan-300 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/30"
                  }`}
                >
                  {selected ? "FITTED" : "FIT THIS GUN"}
                </button>
              ) : (
                <>
                  <div className="mt-1.5 space-y-0.5 rounded-sm border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] leading-tight text-white/50">
                    {c.parts.map((b, i) => <div key={`${b.kind}-${b.tier}-${i}`}>· {partBillText(b)}</div>)}
                    <div className="text-yellow-200/80">· {fmtNum(c.credits)} CR</div>
                  </div>
                  <button
                    onClick={() => { const m = game.buyCannonChassis(c.id); setMsg(m); }}
                    disabled={!!problem}
                    title={problem ?? `Build the ${c.name}`}
                    className={`mt-1.5 w-full rounded-sm border px-2 py-1 text-[10px] font-black tracking-[0.16em] ${
                      problem ? "border-white/10 text-white/25" : "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30"
                    }`}
                  >
                    {problem ? "LOCKED" : "BUILD"}
                  </button>
                  {problem && <div className="mt-1 text-[9px] leading-tight text-red-300/70">{problem}</div>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Allocate equal-width leaf slots, then centre each prerequisite over its
  // actual children. One SVG draws all connectors in the same coordinate space.
  type TreePoint = { c: CannonDef; x: number; depth: number; children: string[] };
  const points: TreePoint[] = [];
  let leaves = 0, deepest = 0;
  const layout = (c: CannonDef, depth: number, ancestors: Set<string>): number => {
    const next = new Set(ancestors).add(c.id);
    const children = CANNONS.filter((child) => child.requires === c.id && !next.has(child.id));
    deepest = Math.max(deepest, depth);
    const xs = children.map((child) => layout(child, depth + 1, next));
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : leaves++ + 0.5;
    points.push({ c, x, depth, children: children.map((child) => child.id) });
    return x;
  };
  CANNONS.filter((c) => !c.requires || !CANNON_BY_ID[c.requires]).forEach((c) => layout(c, 0, new Set()));
  const pointX = (p: TreePoint) => p.x / Math.max(leaves, 1) * 1000;
  const pointY = (p: TreePoint) => 10 + (deepest - p.depth) * 76;
  const height = 62 + deepest * 76;
  const byId = new Map(points.map((p) => [p.c.id, p]));

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ---- the tree ---- */}
      <div className="rounded-sm border border-white/10 bg-white/[0.02] p-3">
        <div className="mb-1 flex items-baseline justify-between">
          <div className="text-[10px] font-bold tracking-[0.22em] text-cyan-200/60">CANNON TREE</div>
        </div>
        {msg && <div className="mb-1 rounded-sm border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">{msg}</div>}
        <div className="relative mt-2 w-full" style={{ height }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            {points.flatMap((p) => p.children.map((id) => {
              const child = byId.get(id); if (!child) return null;
              const x1 = pointX(p), x2 = pointX(child);
              const y1 = pointY(p), y2 = pointY(child) + 52;
              const mid = (y1 + y2) / 2;
              return <path key={`${p.c.id}-${id}`} d={`M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`} fill="none" stroke="rgba(103,232,249,.42)" vectorEffect="non-scaling-stroke" />;
            }))}
          </svg>
          {points.map((p) => <div key={p.c.id} className="absolute" style={{ left: `${pointX(p) / 10}%`, top: pointY(p), width: `${Math.min(100 / Math.max(leaves, 1) - 0.7, 22)}%`, transform: "translateX(-50%)" }}>
            {node(p.c, true, p.x < 1.5 ? "left" : p.x > leaves - 1.5 ? "right" : "mid")}
          </div>)}
        </div>
      </div>

      {/* ---- the fitted gun's branch ---- */}
      <div className="rounded-sm border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-bold tracking-[0.22em] text-cyan-200/60">BRANCH · {fitted.name.toUpperCase()}</div>
          <div className="text-[10px] text-white/40">tier {fitted.tier}</div>
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.02] p-1.5">
          <CannonIcon c={fitted} className="h-10 w-20 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] leading-snug text-white/60">{fitted.desc}</p>
            <p className="mt-0.5 text-[10px] text-white/40">
              {fmtNum(cannonDmg(fitted, fittedLv))} dmg
              {fitted.heatMax && fitted.heatMax > 1 && <> · <span className="text-orange-300/80">{fmtNum(cannonDmg(fitted, fittedLv) * fitted.heatMax)} at full heat</span></>}
              {fitted.overheat ? ` · ${fitted.overheat}s cool-down` : ""}
            </p>
          </div>
        </div>

        <div className="relative mt-2 pl-3">
          {/* the branch spine every upgrade node hangs off */}
          <div className="absolute bottom-3 left-0 top-2 w-px bg-cyan-300/25" />
          <div className="grid gap-1.5">
            {cannonTracks(fitted).map((t) => {
              const l = fittedLv[t.id] ?? 0;
              const maxed = l >= t.max;
              const room = t.max - l;
              const price = free ? 0 : cannonTrackCost(fitted, t, l);
              const now = cannonTrackValue(fitted, t.id, l);
              const next = cannonTrackValue(fitted, t.id, Math.min(t.max, l + 1));
              /* a size only shows if the track could ever take it, and it greys
               * out the moment there is not enough of the track left */
              const sizes = [1, 5, 10].filter((n) => t.max >= n);
              const affordable = (n: number) => {
                let total = 0;
                for (let k = 0; k < n; k++) total += free ? 0 : cannonTrackCost(fitted, t, l + k);
                return free || save.credits >= total;
              };
              const buy = (n: number) => {
                let total = 0;
                for (let k = 0; k < n; k++) total += free ? 0 : cannonTrackCost(fitted, t, l + k);
                return `${n} level${n > 1 ? "s" : ""} for ${fmtNum(total)} CR`;
              };
              return (
                <div key={t.id} className="relative rounded-sm border border-white/15 bg-white/[0.03] p-2">
                  <div className="absolute -left-3 top-4 h-px w-3 bg-cyan-300/25" />
                  <div className="flex items-center gap-1.5">
                    <TrackIcon id={t.id} hue={fitted.look.hue} className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1 truncate text-[12px] font-bold text-yellow-200">{t.name}</div>
                    <div className="shrink-0 text-[10px] text-white/55">LV {l}/{t.max}</div>
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-white/50">{t.desc}</div>
                  <div className="mt-1 flex gap-px">
                    {Array.from({ length: t.max }).map((_, i) => (
                      <div key={i} className="h-1 flex-1" style={{ background: i < l ? "#ffd24d" : "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate text-[11px] text-cyan-100">{now}{!maxed && <span className="text-emerald-300"> → {next}</span>}</div>
                    <div className="flex shrink-0 gap-1">
                      {sizes.map((n) => {
                        const can = !maxed && room >= n && affordable(n);
                        return (
                          <button
                            key={n}
                            disabled={!can}
                            onClick={() => game.buyCannon(t.id, n)}
                            title={can ? buy(n) : room < n ? `only ${room} level${room === 1 ? "" : "s"} left` : "not enough credits"}
                            className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${can ? "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30" : "border-white/10 text-white/25"}`}
                          >
                            +{n}
                          </button>
                        );
                      })}
                      <button
                        disabled={maxed}
                        onClick={() => game.buyCannon(t.id, room)}
                        title={maxed ? "fully calibrated" : `all ${room} remaining level${room === 1 ? "" : "s"}`}
                        className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${maxed ? "border-white/10 text-white/25" : "border-cyan-300 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/30"}`}
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  <div className="mt-0.5 text-right text-[9px] text-white/35">{maxed ? "fully calibrated" : `${fmtNum(price)} CR per level`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Upgrades({ game }: { game: Game }) {
  const [cat, setCat] = useState<UpCat>("hull");
  const save = game.save;
  const free = game.admin.on && game.admin.credits;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {UP_CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="rounded-sm border px-3 py-1 text-xs font-bold tracking-wider" style={{ borderColor: cat === c.id ? c.color : "rgba(255,255,255,0.15)", color: c.color, background: cat === c.id ? c.color + "22" : "transparent" }}>{c.name.toUpperCase()}</button>
          ))}
        </div>
        <div className="text-[9px] font-bold tracking-[0.18em] text-white/30">ONE BUTTON PER SIZE · A SIZE THAT DOES NOT FIT IS GREYED</div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {UPGRADES.filter((u) => u.cat === cat).map((u) => {
          const l = save.upgrades[u.id] ?? 0;
          const maxed = l >= u.max;
          const room = u.max - l;
          const color = UP_CATS.find((c) => c.id === u.cat)!.color;
          /* a size only shows if the track could ever take it, and it greys out
           * the moment there is not enough of the track left to buy it */
          const sizes = [1, 5, 10].filter((n) => u.max >= n);
          const cost = (n: number) => {
            let total = 0;
            for (let k = 0; k < n; k++) total += free ? 0 : upgradeCost(u, l + k);
            return total;
          };
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
                <div className="min-w-0 truncate text-xs text-cyan-100">{u.fmt(l)}{!maxed && <span className="text-emerald-300"> → {u.fmt(l + 1)}</span>}</div>
                <div className="flex shrink-0 gap-1">
                  {sizes.map((n) => {
                    const price = cost(n);
                    const can = !maxed && room >= n && (free || save.credits >= price);
                    return (
                      <button
                        key={n}
                        disabled={!can}
                        onClick={() => game.buy(u.id, n)}
                        title={can ? `${n} level${n > 1 ? "s" : ""} for ${fmtNum(price)} CR` : room < n ? `only ${room} level${room === 1 ? "" : "s"} left` : "not enough credits"}
                        className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${can ? "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30" : "border-white/10 text-white/25"}`}
                      >
                        +{n}
                      </button>
                    );
                  })}
                  <button
                    disabled={maxed}
                    onClick={() => game.buy(u.id, room)}
                    title={maxed ? "maxed" : `all ${room} remaining level${room === 1 ? "" : "s"}`}
                    className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${maxed ? "border-white/10 text-white/25" : "border-cyan-300 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/30"}`}
                  >
                    MAX
                  </button>
                </div>
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
            const col = c.tier === 6 ? "#d0d0d0" : RARITIES[c.tier].color;
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
          const col = c.tier === 6 ? "#d0d0d0" : RARITIES[c.tier].color;
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
      nameLocked={!game.persistent}
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
function AdminMap({ game, enabled }: { game: Game; enabled: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const n = MAP_GRID.length;
    ctx.fillStyle = "#11121b"; ctx.fillRect(0, 0, n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (MAP_GRID[y][x] !== "1") continue;
      const wx = (x + .5) * MAP_CELL - MAP_RADIUS, wy = (y + .5) * MAP_CELL - MAP_RADIUS;
      ctx.fillStyle = isUltraZone(wx, wy) ? ULTRA_ZONE.color : RARITIES[zoneAt(wx, wy)].color;
      ctx.fillRect(x, y, 1, 1);
    }
    const mark = (x: number, y: number, color: string) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc((x + MAP_RADIUS) / (2 * MAP_RADIUS) * n, (y + MAP_RADIUS) / (2 * MAP_RADIUS) * n, 2.5, 0, Math.PI * 2); ctx.fill();
    };
    mark(BASE.x, BASE.y, "#36ffdb"); mark(game.player.x, game.player.y, "#ffffff");
    if (point) mark(point.x, point.y, "#ff00e6");
  }, [game, point]);
  return <div className="mt-2 rounded-sm border border-fuchsia-300/30 bg-fuchsia-500/5 p-2">
    <div className="text-[10px] font-black tracking-[0.2em] text-fuchsia-200">MAP TELEPORT</div>
    <canvas ref={canvas} width={MAP_GRID.length} height={MAP_GRID.length} aria-label="Select teleport destination on world map" role="img"
      className={`mt-2 w-full border border-white/20 [image-rendering:pixelated] ${enabled ? "cursor-crosshair" : "opacity-50"}`}
      onClick={(e) => { if (!enabled) return; const r=e.currentTarget.getBoundingClientRect();
        setPoint({ x: (clamp((e.clientX-r.left)/r.width,0,1)*2-1)*MAP_RADIUS, y: (clamp((e.clientY-r.top)/r.height,0,1)*2-1)*MAP_RADIUS }); }} />
    <div className="mt-1 text-[10px] text-white/55">{point ? `Selected: ${Math.round(point.x)}, ${Math.round(point.y)}${isUltraZone(point.x, point.y) ? " · ULTRA" : ""}` : "Select a destination on the map."}</div>
    <button disabled={!enabled || !point} onClick={() => { if (point) { game.adminTeleport(point.x, point.y); setPoint({ ...point }); } }} className="mt-1 w-full rounded-sm border border-fuchsia-300/60 bg-fuchsia-400/15 px-2 py-1 text-[10px] font-black text-fuchsia-100 hover:bg-fuchsia-400/30 disabled:opacity-40">TELEPORT</button>
  </div>;
}

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
      const tv = typeof o.tier === "number" ? clamp(Math.round(o.tier), 0, 6) : 2;
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
      <AdminMap game={game} enabled={a.on} />
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
