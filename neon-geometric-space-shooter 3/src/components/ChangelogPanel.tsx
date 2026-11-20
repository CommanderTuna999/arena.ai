"use client";

import { CHANGELOG, VERSION } from "@/game/changelog";

/** Short release history shown from the title screen. Newest entry first. */
export default function ChangelogPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[88dvh] w-[min(94vw,40rem)] flex-col rounded-md border border-cyan-300/40 bg-[#060a18]/97 shadow-[0_0_50px_rgba(77,255,210,0.18)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-sm font-black tracking-[0.28em] text-cyan-200">CHANGELOG</div>
            <div className="text-[10px] text-white/40">current version v{VERSION}</div>
          </div>
          <button onClick={onClose} className="rounded-sm border border-white/25 px-3 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10">CLOSE</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <ol className="space-y-4">
            {CHANGELOG.map((entry, i) => (
              <li key={entry.version} className={i === 0 ? "rounded-sm border border-cyan-300/25 bg-cyan-400/[0.04] p-3" : "border-t border-white/10 pt-3"}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-base font-black text-cyan-200">v{entry.version}</span>
                  <span className="text-[10px] tracking-wider text-white/40">{entry.date}</span>
                  {i === 0 && <span className="rounded-sm border border-emerald-300/50 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-300">LATEST</span>}
                </div>
                <div className="mt-0.5 text-xs font-bold text-white/75">{entry.title}</div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-snug text-slate-300/70">
                  {entry.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
        <div className="border-t border-white/10 px-4 py-2 text-[10px] text-white/30">
          Versioning: 1.x for feature releases, 1.0.x for fixes. Updated with every release.
        </div>
      </div>
    </div>
  );
}
