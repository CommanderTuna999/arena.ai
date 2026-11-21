"use client";

import { useEffect, useState } from "react";
import { VERSION } from "@/game/changelog";

/*
 * Standby screen for a deploy.
 *
 *  - /api/update-status says a newer commit exists than the one this build was
 *    made from -> a push is on its way, so the game is paused and the site says
 *    so until the new build takes over.
 *  - once the live build's VERSION no longer matches this bundle, the tab is
 *    stale: keep the same screen up and reload into the new build.
 *  - if the update never lands (a push with no deploy behind it) the overlay
 *    gives up after four minutes rather than walling the game off forever.
 *
 * It also cleans up caches and any stray service worker so a reload really does
 * fetch the new bundle.
 */

const RELOAD_KEY = "wof-version-reload";
const STALE_LIMIT_MS = 4 * 60 * 1000;
const POLL_MS = 8000;

type State = { text: string } | null;

export default function UpdateGuard() {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    let dead = false;
    let reloading = false;
    let waitingSince = 0;

    try {
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => { void caches.delete(k); })).catch(() => {});
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then((regs) => regs.forEach((r) => { void r.unregister(); }))
          .catch(() => {});
      }
    } catch { /* storage may be unavailable */ }

    const show = (text: string) => {
      setState((prev) => (prev && prev.text === text ? prev : { text }));
    };
    const hold = (text: string) => {
      show(text);
      window.dispatchEvent(new Event("wof:updating"));
    };
    const release = () => {
      setState(null);
      window.dispatchEvent(new Event("wof:resume"));
    };

    const check = async () => {
      if (dead || reloading) return;
      try {
        const res = await fetch(`/api/update-status?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok || dead) return;
        const j = (await res.json()) as { updating?: boolean; version?: string };

        /* A stale bundle is the one case worth interrupting for: the server has
         * already moved on, so this tab reloads into the new build. */
        if (j.version && j.version !== VERSION) {
          let last = "";
          try { last = sessionStorage.getItem(RELOAD_KEY) ?? ""; } catch { /* ignore */ }
          if (last === j.version) return; // already tried once; do not loop
          hold("Pausing gameplay for update - please stand by");
          reloading = true;
          try { sessionStorage.setItem(RELOAD_KEY, j.version); } catch { /* ignore */ }
          const u = new URL(window.location.href);
          u.searchParams.set("v", j.version);
          window.setTimeout(() => { if (!dead) window.location.replace(u.toString()); }, 900);
          return;
        }

        if (j.updating) {
          if (!waitingSince) waitingSince = Date.now();
          if (Date.now() - waitingSince < STALE_LIMIT_MS) {
            hold("Pausing gameplay for update - please stand by");
            return;
          }
        }
        waitingSince = 0;
        release();
      } catch { /* offline: say nothing */ }
    };

    const onVis = () => { if (document.visibilityState === "visible") void check(); };
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) void check(); };
    void check();
    const timer = window.setInterval(() => { void check(); }, POLL_MS);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onShow);
    return () => {
      dead = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-[#04050c]/96 px-6 font-mono backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at center, rgba(77,255,210,0.12), transparent 62%)" }} />
      <div className="relative flex max-w-[34rem] flex-col items-center gap-5 text-center">
        <div className="text-[11px] tracking-[0.42em] text-cyan-300/70">WOFGUE</div>
        <div className="text-[clamp(1.05rem,4.4vw,1.7rem)] font-black uppercase leading-tight tracking-[0.14em] uppercase text-white [text-shadow:0_0_18px_rgba(77,255,210,0.45)]">
          {state.text}
        </div>
        <div className="h-[3px] w-56 overflow-hidden rounded-sm bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-sm bg-cyan-300 shadow-[0_0_16px_rgba(77,255,210,0.8)]" />
        </div>
      </div>
    </div>
  );
}
