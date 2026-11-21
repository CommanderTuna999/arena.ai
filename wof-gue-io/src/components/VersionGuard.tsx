"use client";

import { useEffect } from "react";
import { VERSION } from "@/game/changelog";

const RELOAD_KEY = "wof-version-reload";

/*
 * Keeps the preview from getting stuck on a cached bundle.
 *
 *  - purges Cache Storage and any legacy service worker once per mount
 *  - compares this bundle's VERSION with the live server at /api/version
 *  - if the server is newer, hard-navigates once (with a cache-busting query)
 *    instead of letting bfcache resurrect an old page forever
 */
export default function VersionGuard() {
  useEffect(() => {
    let dead = false;

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

    const check = async () => {
      if (dead) return;
      try {
        const res = await fetch(`/api/version?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { version?: string };
        if (!j.version || j.version === VERSION) return;
        let last = "";
        try { last = sessionStorage.getItem(RELOAD_KEY) ?? ""; } catch { /* ignore */ }
        if (last === j.version) return;
        try { sessionStorage.setItem(RELOAD_KEY, j.version); } catch { /* ignore */ }
        const u = new URL(window.location.href);
        u.searchParams.set("v", j.version);
        window.location.replace(u.toString());
      } catch { /* offline previews are fine */ }
    };

    const onShow = (e: PageTransitionEvent) => { if (e.persisted) void check(); };
    const onVis = () => { if (document.visibilityState === "visible") void check(); };
    void check();
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true;
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
