"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { migrate, newSave, type SaveData } from "@/game/data";
import { VERSION } from "@/game/changelog";
import SettingsPanel from "@/components/SettingsPanel";
import ChangelogPanel from "@/components/ChangelogPanel";

const SAVE_KEY = "neon-hive-save-v1";

/* ------------------------------------------------------------------ store
 * A tiny external store for the local save so the title screen can read it
 * during render (hydration-safe) and other tabs stay in sync.
 */
const SERVER_SAVE = newSave();
let clientSave: SaveData | null = null;
const listeners = new Set<() => void>();

function readLocal(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* storage may be unavailable */ }
  return newSave();
}

function currentSave(): SaveData {
  if (!clientSave) clientSave = readLocal();
  return clientSave;
}

function storeSave(save: SaveData) {
  clientSave = save;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SAVE_KEY) return;
    clientSave = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Wofgue.io title screen: callsign, Play, settings and changelog. */
export default function StartScreen() {
  const router = useRouter();
  const save = useSyncExternalStore(subscribe, currentSave, () => SERVER_SAVE);
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? save.name;
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState(false);
  const [changes, setChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = (next: SaveData) => storeSave(next);

  const play = () => {
    const n = name.trim().slice(0, 16);
    if (!n) {
      setErr("Enter a callsign to play.");
      inputRef.current?.focus();
      return;
    }
    persist({ ...save, name: n, ts: Date.now() });
    router.push("/play");
  };

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#04050c] px-5 py-10 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(77,255,210,0.16),transparent_55%),radial-gradient(circle_at_12%_85%,rgba(196,92,255,0.12),transparent_45%),radial-gradient(circle_at_90%_75%,rgba(255,61,115,0.1),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,249,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(125,249,255,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="w-full max-w-sm text-center">
        <h1 className="select-none text-[clamp(2.75rem,14vw,4.5rem)] font-black leading-none tracking-tight text-white">
          Wofgue<span className="text-cyan-300 drop-shadow-[0_0_28px_rgba(77,255,210,0.45)]">.io</span>
        </h1>
        <p className="mt-2 text-[9px] tracking-[0.42em] text-cyan-200/45">GEOMETRIC HUNTING GROUND</p>

        <div className="mt-9 text-left">
          <label htmlFor="callsign" className="mb-1.5 block text-[10px] font-bold tracking-[0.3em] text-white/45">CALLSIGN</label>
          <input
            id="callsign"
            ref={inputRef}
            value={name}
            maxLength={16}
            autoComplete="nickname"
            onChange={(e) => { setTypedName(e.target.value); setErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") play(); }}
            placeholder="enter your name"
            className="h-12 w-full rounded-sm border border-white/20 bg-black/60 px-3 text-center text-base tracking-wide text-cyan-100 outline-none transition placeholder:text-white/25 focus:border-cyan-300/70 focus:bg-black/80"
          />
          {err && <div className="mt-1.5 text-center text-[11px] text-red-300">{err}</div>}
        </div>

        <button
          onClick={play}
          className="mt-4 h-14 w-full rounded-sm border-2 border-cyan-300 bg-cyan-400/20 text-lg font-black tracking-[0.3em] text-white shadow-[0_0_32px_rgba(77,255,210,0.35)] transition hover:bg-cyan-400/35 active:scale-[0.99]"
        >
          PLAY
        </button>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setSettings(true)}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-sm border border-white/20 bg-black/40 text-[11px] font-bold tracking-widest text-cyan-100/70 transition hover:border-cyan-300/50 hover:text-cyan-100"
          >
            <GearIcon /> SETTINGS
          </button>
          <button
            onClick={() => setChanges(true)}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-sm border border-white/20 bg-black/40 text-[11px] font-bold tracking-widest text-cyan-100/70 transition hover:border-cyan-300/50 hover:text-cyan-100"
          >
            <ListIcon /> CHANGELOG
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[10px] tracking-[0.25em] text-white/25">
        v{VERSION}
      </div>

      {settings && (
        <Modal title="SETTINGS" onClose={() => setSettings(false)}>
          <SettingsPanel
            save={save}
            onAutoFire={(v) => persist({ ...save, autoFire: v, ts: Date.now() })}
            onShowCompInfo={(v) => persist({ ...save, showCompInfo: v, ts: Date.now() })}
            onAutoSell={(v) => persist({ ...save, autoSell: v, ts: Date.now() })}
            onName={(v) => { persist({ ...save, name: v, ts: Date.now() }); setTypedName(v); }}
            onReset={() => { persist(newSave()); setTypedName(""); }}
            onRestore={(s) => { persist(s); setTypedName(s.name); }}
          />
        </Modal>
      )}
      {changes && <ChangelogPanel onClose={() => setChanges(false)} />}
    </main>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[88dvh] w-[min(94vw,32rem)] flex-col rounded-md border border-cyan-300/40 bg-[#060a18]/97 shadow-[0_0_50px_rgba(77,255,210,0.18)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-black tracking-[0.28em] text-cyan-200">{title}</div>
          <button onClick={onClose} className="rounded-sm border border-white/25 px-3 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10">CLOSE</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  );
}
