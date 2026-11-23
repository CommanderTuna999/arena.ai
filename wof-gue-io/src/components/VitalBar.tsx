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

/** A compact instrument panel. Patterns stay fixed as the illuminated fill
 * recedes, so damage reveals the same physical plates or shield cells. */
export function VitalBar({ kind, label, value, max, color }: {
  kind: "health" | "shield"; label: string; value: number; max: number; color: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pattern = `vital-pattern-${id}`, clip = `vital-clip-${id}`, gradient = `vital-glow-${id}`;
  const fraction = vitalFraction(value, max);
  return (
    <svg className="block w-56 max-w-[calc(100vw-1.5rem)]" viewBox="0 0 224 30" role="img"
      aria-label={`${label}: ${fmtNum(value)} of ${fmtNum(max)}`}>
      <defs>
        <clipPath id={clip}><path d="M33 4 H216 L221 9 V21 L216 26 H33 L28 21 V9 Z" /></clipPath>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" />
          <stop offset=".34" stopColor={color} stopOpacity=".18" />
          <stop offset="1" stopColor="#001018" stopOpacity=".62" />
        </linearGradient>
        {kind === "shield" ? (
          <pattern id={pattern} width="20" height="18" patternUnits="userSpaceOnUse">
            <path d="M5 0 H15 L20 9 L15 18 H5 L0 9 Z" fill="none" stroke="#e8ffff" strokeOpacity=".5" strokeWidth=".8" />
            <path d="M6 2 H14 L17.5 9" fill="none" stroke="#fff" strokeOpacity=".23" strokeWidth=".8" />
          </pattern>
        ) : (
          <pattern id={pattern} width="32" height="22" patternUnits="userSpaceOnUse">
            <path d="M-8 0 H15 L23 11 L15 22 H-8 L0 11 Z M15 0 H39 L47 11 L39 22 H15 L23 11 Z" fill="none" stroke="#051711" strokeOpacity=".78" strokeWidth="1.5" />
            <path d="M1 10 L8 2 H14 L21 10 M24 10 L30 2 H38" fill="none" stroke="#fff" strokeOpacity=".42" strokeWidth="1" />
            <path d="M1 13 L8 20 H14 M24 13 L30 20 H38" fill="none" stroke="#001811" strokeOpacity=".45" strokeWidth="1" />
          </pattern>
        )}
      </defs>
      {/* Inactive well remains visible at zero; the fill is independently clipped. */}
      <path d="M32 2 H217 L223 8 V22 L217 28 H32 L26 22 V8 Z" fill="#071019" stroke="#8db2bb" strokeOpacity=".52" strokeWidth="1" />
      <g clipPath={`url(#${clip})`}>
        <rect x="28" y="4" width="193" height="22" fill="#050b10" />
        <rect x="28" y="4" width={193 * fraction} height="22" fill={color} style={{ transition: "width 100ms linear" }} />
        <rect x="28" y="4" width={193 * fraction} height="22" fill={`url(#${gradient})`} style={{ transition: "width 100ms linear" }} />
        <rect x="28" y="4" width={193 * fraction} height="22" fill={`url(#${pattern})`} style={{ transition: "width 100ms linear" }} />
        <path d="M30 5 H220" stroke="#fff" strokeOpacity=".18" />
      </g>
      <path d="M3 8 L8 3 H22 L27 8 V22 L22 27 H8 L3 22 Z" fill="#0b1720" stroke={color} strokeWidth="1.3" />
      {kind === "shield" ? (
        <path d="M15 6 L22 10 V19 L15 23 L8 19 V10 Z M15 9 L19.5 11.5 V17.5 L15 20 L10.5 17.5 V11.5 Z" fill="none" stroke={color} strokeWidth="1.2" />
      ) : (
        <path d="M8 10 L15 6 L22 10 L20 19 L15 23 L10 19 Z M8.5 11 L15 15 L21.5 11 M15 15 V22" fill="none" stroke={color} strokeWidth="1.2" />
      )}
      <text x="38" y="18.4" fill="#fff" fontSize="8" fontWeight="800" letterSpacing="1.2" style={{ paintOrder: "stroke", stroke: "#071018", strokeWidth: 2.8, strokeLinejoin: "round" }}>{label.toUpperCase()}</text>
      <text x="213" y="18.4" textAnchor="end" fill="#fff" fontSize="8.5" fontWeight="700" style={{ paintOrder: "stroke", stroke: "#071018", strokeWidth: 3, strokeLinejoin: "round" }}>{fmtNum(value)} / {fmtNum(max)}</text>
    </svg>
  );
}
