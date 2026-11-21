"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { migrate, newSave, type SaveData } from "@/game/data";
import { VERSION } from "@/game/changelog";
import SettingsPanel from "@/components/SettingsPanel";
import ChangelogPanel from "@/components/ChangelogPanel";
import Backdrop from "@/components/Backdrop";
import AuthPanel from "@/components/AuthPanel";
import {
  GUEST_SAVE_KEY, resolveSession, saveKeyFor, signOut,
  type Session,
} from "@/game/accounts";

/* Which save this browser is showing: the guest profile, or the signed-in
 * profile's own slot. Signing in swaps the key and the store re-reads. */
let activeSaveKey = GUEST_SAVE_KEY;

/* ------------------------------------------------------------------ store
 * A tiny external store for the local save so the title screen can read it
 * during render (hydration-safe) and other tabs stay in sync.
 */
const SERVER_SAVE = newSave();
let clientSave: SaveData | null = null;
let clientRaw: string | null = null;
const listeners = new Set<() => void>();

function readLocal(): SaveData {
  try {
    const raw = localStorage.getItem(activeSaveKey);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* storage may be unavailable */ }
  return newSave();
}

function currentSave(): SaveData {
  /* Always compare against the stored string: the game writes the save while
   * unmounting on the way back to this screen, and a stale module-level cache
   * used to resurrect pre-run progress (wiping the run on the next PLAY). */
  let raw: string | null = null;
  try { raw = localStorage.getItem(activeSaveKey); } catch { /* storage may be unavailable */ }
  if (!clientSave || raw !== clientRaw) {
    clientRaw = raw;
    clientSave = readLocal();
  }
  return clientSave;
}

function storeSave(save: SaveData) {
  clientSave = save;
  try { clientRaw = JSON.stringify(save); localStorage.setItem(activeSaveKey, clientRaw); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== activeSaveKey) return;
    clientSave = null;
    clientRaw = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Point the store at another profile's save slot and re-read it. */
function activateKey(key: string) {
  if (key === activeSaveKey) return;
  activeSaveKey = key;
  clientSave = null;
  clientRaw = null;
  listeners.forEach((l) => l());
}

/** Wofgue.io title screen: callsign, Play, settings and changelog. */
export default function StartScreen() {
  const router = useRouter();
  const save = useSyncExternalStore(subscribe, currentSave, () => SERVER_SAVE);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState(false);
  const [changes, setChanges] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [sess, setSess] = useState<Session | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = typedName ?? (save.name || sess?.name || "");

  /* Signing in swaps the save slot under the title screen, so the store is
   * pointed at the right key as soon as the session is known. */
  const enterProfile = useCallback((next: Session | null) => {
    activateKey(saveKeyFor(next));
    setSess(next);
    setTypedName(null);
  }, []);

  useEffect(() => {
    let alive = true;
    void resolveSession().then((s) => { if (alive) enterProfile(s); });
    return () => { alive = false; };
  }, [enterProfile]);

  const logout = async () => {
    await signOut();
    enterProfile(null);
  };

  const persist = (next: SaveData) => storeSave(next);

  const play = () => {
    const n = name.trim().slice(0, 16);
    if (!n) {
      setErr("Enter a name to play.");
      inputRef.current?.focus();
      return;
    }
    persist({ ...save, name: n, ts: Date.now() });
    router.push("/play");
  };

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#04050c] px-6 py-12 text-slate-100">
      <Backdrop />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 text-[10px] tracking-[0.2em]">
        {sess ? (
          <>
            <span className="max-w-[9rem] truncate text-cyan-200/80" title="Signed in">@{sess.name}</span>
            <button
              onClick={() => void logout()}
              className="rounded-sm border border-white/15 px-2 py-1 font-bold text-white/35 transition hover:border-cyan-300/50 hover:text-cyan-200"
            >
              LOG OUT
            </button>
          </>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="rounded-sm border border-cyan-300/40 px-2.5 py-1 font-bold text-cyan-200/80 transition hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-100"
          >
            LOG IN
          </button>
        )}
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        <h1 className="select-none whitespace-nowrap text-center text-[clamp(2.9rem,14.5vw,10.5rem)] font-black uppercase leading-[0.82] tracking-[-0.055em] text-white [text-shadow:0_0_16px_rgba(125,249,255,0.35),0_0_70px_rgba(77,255,210,0.28),0_0_140px_rgba(77,255,210,0.16)]">
          WOFGUE<span className="text-cyan-300">.IO</span>
        </h1>

        <div className="mt-10 flex w-full max-w-[19rem] flex-col items-center sm:mt-12">
          <input
            id="name"
            ref={inputRef}
            aria-label="Name"
            value={name}
            maxLength={16}
            autoComplete="nickname"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => { setTypedName(e.target.value); setErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") play(); }}
            placeholder="name"
            className="h-11 w-full border-b border-white/25 bg-transparent px-2 text-center text-lg tracking-[0.18em] text-cyan-50 outline-none transition placeholder:tracking-[0.2em] placeholder:text-white/30 focus:border-cyan-300"
          />
          {err && <div className="mt-2 text-[11px] text-red-300">{err}</div>}

          <button
            onClick={play}
            className="mt-5 h-14 w-full rounded-sm border-2 border-cyan-300 bg-cyan-400/15 text-xl font-black tracking-[0.45em] text-white shadow-[0_0_34px_rgba(77,255,210,0.32)] transition hover:bg-cyan-400/30 active:scale-[0.99]"
          >
            PLAY
          </button>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => setSettings(true)}
              aria-label="Settings"
              title="Settings"
              className="grid h-11 w-11 place-items-center rounded-sm border border-white/20 bg-black/40 text-cyan-100/60 transition hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              <GearIcon />
            </button>
            <button
              onClick={() => setChanges(true)}
              aria-label="Changelog"
              title="Changelog"
              className="grid h-11 w-11 place-items-center rounded-sm border border-white/20 bg-black/40 text-cyan-100/60 transition hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              <DocIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-[10px] tracking-[0.25em] text-white/25">
        v{VERSION}
      </div>

      {settings && (
        <Modal title="SETTINGS" onClose={() => setSettings(false)}>
          <SettingsPanel
            save={save}
            onAutoFire={(v) => persist({ ...save, autoFire: v, ts: Date.now() })}
            onShowCompInfo={(v) => persist({ ...save, showCompInfo: v, ts: Date.now() })}
            onShowRanges={(v) => persist({ ...save, showRanges: v, ts: Date.now() })}
            onAutoSell={(v) => persist({ ...save, autoSell: v, ts: Date.now() })}
            onName={(v) => { persist({ ...save, name: v, ts: Date.now() }); setTypedName(v); }}
            onReset={() => { persist(newSave()); setTypedName(""); }}
            onRestore={(s) => { persist(s); setTypedName(s.name); }}
          />
        </Modal>
      )}
      {changes && <ChangelogPanel onClose={() => setChanges(false)} />}
      {authOpen && (
        <Modal title="ACCOUNT" onClose={() => setAuthOpen(false)}>
          <AuthPanel
            onDone={(next) => { setAuthOpen(false); enterProfile(next); }}
          />
        </Modal>
      )}
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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M6 2.8h7.4L18 7.4v13.8H6z" />
      <path d="M13.2 3v4.6H18" />
      <path d="M8.6 12h6.8M8.6 15.2h6.8M8.6 18.4h4.2" />
    </svg>
  );
}
