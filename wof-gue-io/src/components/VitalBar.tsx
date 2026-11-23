"use client";

import { useId } from "react";
import { fmtNum } from "../game/math";

/** Bounded even for infinite admin stats, so the SVG never gets NaN geometry. */
export function vitalFraction(value: number, max: number): number {
  if (Number.isNaN(value) || Number.isNaN(max) || max <= 0 || value <= 0) return 0;
  if (value === Infinity) return 1;
  if (max === Infinity) return 0;
  return Math.min(1, Math.max(0, value / max));
}

/** Compact neon gauges in the game's angular insect-and-shield style. The
 * patterns are fixed in place while the illuminated portion drains. */
export function VitalBar({ kind, label, value, max, color }: {
  kind: "health" | "shield"; label: string; value: number; max: number; color: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pattern = `vital-pattern-${id}`, clip = `vital-clip-${id}`, gradient = `vital-glow-${id}`;
  const fraction = vitalFraction(value, max);
  const health = kind === "health";
  return (
    <svg className="block w-56 max-w-[calc(100vw-1.5rem)]" viewBox="0 0 224 20" role="img"
      style={{ filter: `drop-shadow(0 0 3px ${color}55)` }}
      aria-label={`${label}: ${fmtNum(value)} of ${fmtNum(max)}`}>
      <defs>
        <clipPath id={clip}><path d="M7 3 H218 L222 7 V13 L218 17 H7 L2 13 V7 Z" /></clipPath>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".25" />
          <stop offset=".48" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={health ? "#11151a" : "#001019"} stopOpacity=".58" />
        </linearGradient>
        {health ? (
          <pattern id={pattern} width="28" height="14" patternUnits="userSpaceOnUse">
            {/* Overlapping, angular plates with bevels like insect carapace. */}
            <path d="M-7 0 H14 L22 7 L14 14 H-7 L1 7 Z M14 0 H35 L43 7 L35 14 H14 L22 7 Z" fill="none" stroke="#20272d" strokeOpacity=".9" strokeWidth="1.5" />
            <path d="M1 6 L7 1.5 H13 L19 6 M23 6 L29 1.5 H34" fill="none" stroke="#f4f9ff" strokeOpacity=".52" strokeWidth=".8" />
            <path d="M2 9 L7 12.5 H13 M24 9 L29 12.5 H34" fill="none" stroke="#252c33" strokeOpacity=".65" strokeWidth=".8" />
          </pattern>
        ) : (
          <pattern id={pattern} width="24" height="14" patternUnits="userSpaceOnUse">
            {/* Staggered cells share edges like the in-world shield honeycomb. */}
            <path d="M4 0 H12 L16 7 L12 14 H4 L0 7 Z M16 7 H24 L28 14 L24 21 H16 L12 14 Z M16 -7 H24 L28 0 L24 7 H16 L12 0 Z" fill="none" stroke="#e6ffff" strokeOpacity=".7" strokeWidth=".8" />
            <path d="M5 1.4 H11 L14 6.5 M17 8.4 H23" fill="none" stroke="#fff" strokeOpacity=".27" strokeWidth=".7" />
          </pattern>
        )}
      </defs>
      <path d="M6 1.5 H219 L223.5 6.5 V13.5 L219 18.5 H6 L.5 13.5 V6.5 Z" fill="#040b12" fillOpacity=".9" stroke={color} strokeOpacity=".48" strokeWidth="1" />
      <g clipPath={`url(#${clip})`}>
        <rect x="2" y="3" width="220" height="14" fill="#07121b" />
        <rect x="2" y="3" width="220" height="14" fill={`url(#${pattern})`} opacity=".12" />
        {/* The delayed white layer keeps its old width briefly after damage,
            then drains to the current level. Healing covers it immediately. */}
        <rect data-damage-trail="true" x="2" y="3" width={220 * fraction} height="14" fill="#fff" style={{ transition: "width 700ms ease-out 180ms" }} />
        <rect data-vital-fill="true" x="2" y="3" width={220 * fraction} height="14" fill={color} style={{ transition: "width 100ms linear" }} />
        <rect x="2" y="3" width={220 * fraction} height="14" fill={`url(#${gradient})`} style={{ transition: "width 100ms linear" }} />
        <rect x="2" y="3" width={220 * fraction} height="14" fill={`url(#${pattern})`} style={{ transition: "width 100ms linear" }} />
      </g>
      <path d="M7 2 H217 M7 18 H217" fill="none" stroke={color} strokeOpacity=".28" strokeWidth=".65" />
    </svg>
  );
}
