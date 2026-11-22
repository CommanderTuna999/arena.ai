"use client";

import { useState } from "react";
import { decodeSave, encodeSave, type SaveData } from "@/game/data";
import { fmtNum } from "@/game/math";
import { VERSION } from "@/game/changelog";

export interface SettingsPanelProps {
  save: SaveData;
  onAutoFire: (v: boolean) => void;
  onShowCompInfo: (v: boolean) => void;
  onShowRanges: (v: boolean) => void;
  onAutoSell: (v: boolean) => void;
  onName: (v: string) => void;
  /** Guests cannot choose a username: the field is shown read-only. */
  nameLocked?: boolean;
  onReset: () => void;
  onRestore: (s: SaveData) => void;
}

/**
 * All player-facing settings in one place. Used by the title screen and by the
 * in-game gear / Base → SYSTEM tab, so both always expose the same options.
 */
export default function SettingsPanel({ save, onAutoFire, onShowCompInfo, onShowRanges, onAutoSell, onName, onReset, onRestore, nameLocked = false }: SettingsPanelProps) {
  const [name, setName] = useState(save.name);
  const [confirm, setConfirm] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  const commitName = () => {
    onName(name.trim().slice(0, 16));
    setNote({ ok: true, msg: "Username saved." });
  };
  const exportCode = async () => {
    const c = encodeSave(save);
    setCode(c);
    try {
      await navigator.clipboard.writeText(c);
      setNote({ ok: true, msg: "Save code copied to the clipboard." });
    } catch {
      setNote({ ok: true, msg: "Copy the code below and keep it safe." });
    }
  };
  const restoreCode = () => {
    const s = decodeSave(code);
    if (!s) {
      setNote({ ok: false, msg: "That save code could not be read." });
      return;
    }
    onRestore(s);
    setName(s.name);
    setNote({ ok: true, msg: `Restored ${s.name || "an unnamed pilot"} — ${fmtNum(s.credits)} CR.` });
  };

  return (
    <div className="space-y-4 text-sm">
      <section>
        <div className="mb-1.5 text-[10px] font-bold tracking-[0.28em] text-white/45">USERNAME</div>
        <div className="flex gap-2">
          <input
            value={nameLocked ? "Guest" : name}
            disabled={nameLocked}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder="enter your name"
            className="h-10 min-w-0 flex-1 rounded-sm border border-white/20 bg-black/70 px-2.5 text-sm text-cyan-100 outline-none focus:border-cyan-300/70 disabled:border-white/10 disabled:bg-black/40 disabled:text-white/25"
          />
          {!nameLocked && (
            <button onClick={commitName} className="rounded-sm border border-cyan-300/60 px-3 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20">SAVE</button>
          )}
        </div>
        {nameLocked && <div className="mt-1.5 text-[10px] tracking-[0.16em] text-white/30">LOG IN TO PICK A USERNAME AND KEEP PROGRESS</div>}
      </section>

      <section className="space-y-1.5">
        <div className="mb-1.5 text-[10px] font-bold tracking-[0.28em] text-white/45">GAMEPLAY</div>
        <Toggle
          label="Automatic crafted weapons"
          hint="Crafted weapons fire on their own at anything in range (B)."
          checked={save.autoFire}
          onChange={onAutoFire}
        />
        <Toggle
          label="Component hover info"
          hint="Hover a loose component to see its name, rarity, value and mass."
          checked={save.showCompInfo}
          onChange={onShowCompInfo}
        />
        <Toggle
          label="Weapon range circles"
          hint="Draw a faint coloured ring for each fitted weapon's engagement range."
          checked={save.showRanges}
          onChange={onShowRanges}
        />
        <Toggle
          label="Auto-sell docked components"
          hint="Sell every component that reaches the base instead of storing it."
          checked={save.autoSell}
          onChange={onAutoSell}
        />
      </section>

      <section className="rounded-sm border border-cyan-300/25 bg-cyan-400/[0.04] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold tracking-[0.28em] text-cyan-200/80">SAVE CODE</div>
          <div className="flex gap-1.5">
            <button onClick={exportCode} className="rounded-sm border border-cyan-300/60 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/20">EXPORT</button>
            <button onClick={restoreCode} className="rounded-sm border border-yellow-300/60 px-2 py-1 text-[10px] font-bold text-yellow-200 hover:bg-yellow-300/20">RESTORE</button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => { setCode(e.target.value); setNote(null); }}
          placeholder="Paste a save code here, then press RESTORE."
          spellCheck={false}
          className="mt-2 h-20 w-full resize-y rounded-sm border border-white/15 bg-black/70 p-1.5 font-mono text-[10px] leading-tight text-cyan-100/90 outline-none focus:border-cyan-300/50"
        />
        <div className="text-[10px] leading-relaxed text-white/40">
          Codes are self-contained and checksummed. Move one to another browser or device to carry your base across.
        </div>
      </section>

      <section className="flex items-center justify-between gap-3 text-xs text-white/50">
        <span>Kills {fmtNum(save.kills)} · Earned {fmtNum(save.earned)} CR</span>
        <span className="text-white/30">v{VERSION}</span>
      </section>

      <section className="border-t border-white/10 pt-3">
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="rounded-sm border border-red-400/60 px-3 py-1 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20">
            RESET ALL PROGRESS
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-red-300">
            Really wipe everything?
            <button onClick={() => { onReset(); setConfirm(false); setNote({ ok: true, msg: "Progress reset." }); }} className="rounded-sm border border-red-400 bg-red-500/30 px-3 py-1 font-bold">YES, WIPE</button>
            <button onClick={() => setConfirm(false)} className="rounded-sm border border-white/30 px-3 py-1 text-white/70">Cancel</button>
          </div>
        )}
      </section>

      {note && <div className={`text-[11px] ${note.ok ? "text-emerald-300" : "text-red-300"}`}>{note.msg}</div>}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-start justify-between gap-3 rounded-sm border border-white/12 bg-white/[0.03] p-2.5 ${disabled ? "opacity-40" : "cursor-pointer"}`}>
      <span>
        <span className="block font-bold text-cyan-100">{label}</span>
        <span className="block text-[10px] leading-snug text-white/45">{hint}</span>
      </span>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-300" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
