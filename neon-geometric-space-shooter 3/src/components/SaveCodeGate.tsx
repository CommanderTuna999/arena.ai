"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { decodeSave, newSave } from "@/game/data";

const SAVE_KEY = "neon-hive-save-v1";

/**
 * Landing-page save code gate.
 * - Paste a code: validates it, stores it locally and opens /play.
 * - No code yet: can mint a fresh pilot and jump in.
 */
export default function SaveCodeGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  const restore = () => {
    const save = decodeSave(code);
    if (!save) {
      setNote({ ok: false, msg: "That code could not be read. Check you copied the whole thing." });
      return;
    }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* storage may be blocked */ }
    setNote({ ok: true, msg: `Loaded ${save.name} — ${save.kills} kills. Entering the hive…` });
    router.push("/play");
  };

  const fresh = () => {
    try {
      // keep an existing local pilot; only mint one if this browser has none
      if (!localStorage.getItem(SAVE_KEY)) localStorage.setItem(SAVE_KEY, JSON.stringify(newSave()));
    } catch { /* ignore */ }
    router.push("/play");
  };

  return (
    <div className="rounded-sm border border-white/15 bg-black/50 p-3">
      <label className="text-[10px] font-bold tracking-[0.3em] text-cyan-200/70" htmlFor="save-code">SAVE CODE</label>
      <textarea
        id="save-code"
        value={code}
        onChange={(e) => { setCode(e.target.value); setNote(null); }}
        placeholder="NH1-…"
        spellCheck={false}
        className="mt-2 h-24 w-full resize-y rounded-sm border border-white/15 bg-[#04050c] p-2 font-mono text-[10px] leading-tight text-cyan-100/90 outline-none focus:border-cyan-300/60"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={restore}
          className="rounded-sm border border-cyan-300 bg-cyan-400/20 px-4 py-1.5 text-[11px] font-black tracking-widest text-cyan-100 transition hover:bg-cyan-400/35"
        >
          RESTORE &amp; PLAY
        </button>
        <button
          onClick={fresh}
          className="rounded-sm border border-white/20 px-4 py-1.5 text-[11px] tracking-widest text-white/60 transition hover:border-white/40 hover:text-white/85"
        >
          NEW PILOT
        </button>
      </div>
      {note && (
        <div className={`mt-2 text-[11px] ${note.ok ? "text-emerald-300" : "text-red-300"}`}>{note.msg}</div>
      )}
      <div className="mt-3 text-[10px] leading-relaxed text-white/35">
        Tip: export a code from the game&apos;s SYSTEM tab. Codes always start with NH1-.
      </div>
    </div>
  );
}
