"use client";
import { useEffect, useState } from 'react';
/** Heuristic only: exact limits vary with device, rendering and browser quota. */
export const LARGE_INVENTORY_WARNING = 1000;
export function StorageWarning({ count }: { count: number }) {
  // Capture the amount on entry; crossing the threshold later must not nag.
  const [visible, setVisible] = useState(() => count >= LARGE_INVENTORY_WARNING);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);
  return visible ? <div role="status" className="pointer-events-none absolute left-1/2 top-20 z-[80] w-[min(90vw,32rem)] -translate-x-1/2 rounded border border-yellow-300/60 bg-black/90 px-4 py-3 text-center text-sm text-yellow-200">Large component storage may slow the game or exceed browser save space on some devices.</div> : null;
}
