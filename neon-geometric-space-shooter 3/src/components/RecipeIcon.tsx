"use client";

import { ABILITY_BY_ID, WEAPON_TINT, type Slot } from "@/game/data";

/*
 * Hand-drawn SVG previews for the crafting menu. Every recipe gets a real
 * silhouette rather than a text placeholder: turrets look like turrets, pods
 * look like pods, armour looks like layered plate. Icons are neon line art so
 * they match the in-game renderer.
 */

const SLOT_COLOR: Record<Slot, string> = {
  weapon: "#ffd24d",
  shield: "#7df9ff",
  armor: "#c3ccd6",
  optics: "#9dff6a",
  utility: "#c0a8ff",
  ability: "#ff7ad9",
};

export default function RecipeIcon({ id, slot, size = 40, color }: { id: string; slot: Slot; size?: number; color?: string }) {
  const col = color ?? (slot === "weapon" ? WEAPON_TINT[id] ?? SLOT_COLOR.weapon : SLOT_COLOR[slot]);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={col} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 4px ${col}55)` }}>
      <rect x="1" y="1" width="46" height="46" rx="3" stroke={`${col}2e`} fill="#00000000" strokeWidth="1" />
      {slot === "weapon" ? <Weapon id={id} col={col} /> : null}
      {slot === "shield" ? <Shield col={col} /> : null}
      {slot === "armor" ? <Armour col={col} /> : null}
      {slot === "optics" ? <Optics col={col} /> : null}
      {slot === "utility" ? <Utility id={id} col={col} /> : null}
      {slot === "ability" ? <Ability id={id} col={col} /> : null}
    </svg>
  );
}

function Weapon({ id, col }: { id: string; col: string }) {
  const fill = `${col}22`;
  switch (id) {
    case "pulse":
      return (
        <g>
          <rect x="14" y="20" width="18" height="12" rx="2" fill={fill} />
          <path d="M32 23h8v6h-8M20 32v4M26 32v4" />
          <circle cx="20" cy="26" r="2.4" fill={col} stroke="none" />
          <path d="M36 18l4 4-4 4" />
        </g>
      );
    case "scatter":
      return (
        <g>
          <rect x="12" y="20" width="14" height="12" rx="2" fill={fill} />
          <path d="M26 21l14-5M26 26l16-1M26 31l14 5" />
          <path d="M14 32v4M20 32v4" />
        </g>
      );
    case "missile":
    case "homing":
    case "cluster":
      return (
        <g>
          <rect x="10" y="16" width="20" height="16" rx="3" fill={fill} />
          <circle cx="16" cy="21" r="2.1" /><circle cx="24" cy="21" r="2.1" />
          <circle cx="16" cy="27" r="2.1" /><circle cx="24" cy="27" r="2.1" />
          {id === "homing" ? <path d="M32 12h10v10M42 12l-8 8" /> : <path d="M30 24h12M38 20l4 4-4 4" />}
          {id === "cluster" ? <path d="M34 34l3 3M40 34l3 3M37 38l3 3" /> : null}
        </g>
      );
    case "lance":
    case "bypass":
    case "rail":
      return (
        <g>
          <path d="M10 24h12" />
          <path d="M22 18l6 6-6 6z" fill={fill} />
          {id === "rail" ? (
            <>
              <path d="M30 19h12M30 29h12" />
              <path d="M33 24h7" strokeDasharray="2 3" />
              <circle cx="43" cy="19" r="1.5" fill={col} stroke="none" /><circle cx="43" cy="29" r="1.5" fill={col} stroke="none" />
            </>
          ) : id === "bypass" ? (
            <>
              <path d="M30 24h12" strokeDasharray={id === "bypass" ? "5 3" : undefined} />
              <path d="M32 15l4 4-4 4M32 25l4 4-4 4" opacity="0.7" />
            </>
          ) : (
            <>
              <path d="M30 24h12" />
              <path d="M31 18l-4 6 4 6M37 18l4 6-4 6" opacity="0.75" />
            </>
          )}
        </g>
      );
    case "hmg":
      return (
        <g>
          <rect x="12" y="18" width="14" height="16" rx="2" fill={fill} />
          <path d="M26 20h14M26 25h14M26 30h14M26 35h9" />
          <circle cx="17" cy="26" r="2.3" fill={col} stroke="none" />
        </g>
      );
    case "emp":
      return (
        <g>
          <circle cx="24" cy="24" r="5" fill={fill} />
          <circle cx="24" cy="24" r="10" strokeDasharray="4 3" />
          <circle cx="24" cy="24" r="15" opacity="0.55" />
          <path d="M24 6v3M24 39v3M6 24h3M39 24h3" />
        </g>
      );
    case "cutter":
      return (
        <g>
          <path d="M12 30l12-12 4 4-12 12z" fill={fill} />
          <path d="M27 16l8-6M30 20l9-3" />
          <path d="M12 34l-4 4" />
        </g>
      );
    case "acid":
    case "venom":
      return (
        <g>
          <path d="M14 18h16l-6 12H20z" fill={fill} />
          <path d="M22 30v4" />
          <circle cx="22" cy="37" r="2.2" fill={col} stroke="none" />
          <circle cx="32" cy="34" r="1.5" fill={col} stroke="none" />
          <circle cx="36" cy="29" r="1.2" fill={col} stroke="none" />
        </g>
      );
    case "chain":
      return (
        <g>
          <path d="M27 6L16 25h8l-4 15 12-21h-8z" fill={fill} />
          <path d="M10 14l4 4M38 32l-4 4" opacity="0.6" />
        </g>
      );
    case "flak":
      return (
        <g>
          <rect x="12" y="22" width="16" height="10" rx="2" fill={fill} />
          <path d="M28 27h8" />
          <circle cx="36" cy="17" r="1.6" fill={col} stroke="none" />
          <circle cx="40" cy="24" r="1.4" fill={col} stroke="none" />
          <circle cx="35" cy="33" r="1.6" fill={col} stroke="none" />
          <path d="M38 27l4 3" strokeDasharray="2 2" />
        </g>
      );
    case "gravity":
      return (
        <g>
          <circle cx="24" cy="24" r="3" fill={col} stroke="none" />
          <circle cx="24" cy="24" r="8" strokeDasharray="4 3" />
          <circle cx="24" cy="24" r="14" opacity="0.6" />
          <path d="M24 8v3M24 37v3M8 24h3M37 24h3" opacity="0.6" />
        </g>
      );
    case "mines":
      return (
        <g>
          <circle cx="24" cy="26" r="7" fill={fill} />
          <path d="M24 14v5M24 33v5M11 26h5M32 26h5M15 17l3 3M33 35l-3-3M33 17l-3 3M15 35l3-3" />
        </g>
      );
    case "drones":
      return (
        <g>
          <path d="M24 14l8 20-8-4-8 4z" fill={fill} />
          <circle cx="24" cy="24" r="2" fill={col} stroke="none" />
          <path d="M12 12h6M30 12h6M12 36h6M30 36h6" opacity="0.6" />
        </g>
      );
    case "sonic":
      return (
        <g>
          <circle cx="16" cy="24" r="3" fill={fill} />
          <path d="M23 15a13 13 0 010 18M28 11a19 19 0 010 26M33 8a25 25 0 010 32" opacity="0.8" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="12" y="20" width="18" height="10" rx="2" fill={fill} />
          <path d="M30 23h7v4h-7" />
        </g>
      );
  }
}

function Shield({ col }: { col: string }) {
  return (
    <g>
      <path d="M24 6l13 7v12c0 7-6 12-13 17-7-5-13-10-13-17V13z" fill={`${col}18`} />
      <path d="M24 13l7 4v8c0 4-3 7-7 10-4-3-7-6-7-10v-8z" opacity="0.8" />
      <circle cx="24" cy="24" r="2.2" fill={col} stroke="none" />
    </g>
  );
}

function Armour({ col }: { col: string }) {
  return (
    <g>
      <path d="M12 14l12-6 12 6v7L24 27 12 21z" fill={`${col}20`} />
      <path d="M12 23l12 6 12-6v7l-12 6-12-6z" fill={`${col}12`} opacity="0.9" />
      <path d="M12 32l12 6 12-6" opacity="0.55" />
    </g>
  );
}

function Optics({ col }: { col: string }) {
  return (
    <g>
      <circle cx="22" cy="24" r="10" fill={`${col}14`} />
      <circle cx="22" cy="24" r="5" />
      <circle cx="22" cy="24" r="1.8" fill={col} stroke="none" />
      <path d="M32 14l6-6M32 34l6 6M35 24h7" />
      <path d="M18 14l-2-4M26 14l2-4" opacity="0.7" />
    </g>
  );
}

function Utility({ id, col }: { id: string; col: string }) {
  if (id === "magnet") {
    return (
      <g>
        <path d="M16 12v12a8 8 0 0016 0V12" fill={`${col}18`} />
        <path d="M12 12h8M28 12h8" />
        <path d="M24 30v8M20 34l4 4 4-4" opacity="0.7" />
      </g>
    );
  }
  if (id === "recall") {
    return (
      <g>
        <path d="M24 8l10 10-10 10-10-10z" fill={`${col}18`} />
        <path d="M24 20v18M18 32l6 6 6-6" />
        <circle cx="24" cy="18" r="2.4" fill={col} stroke="none" />
      </g>
    );
  }
  return (
    <g>
      <circle cx="24" cy="24" r="8" fill={`${col}18`} />
      <circle cx="24" cy="24" r="3" />
      <path d="M24 8v6M24 34v6M8 24h6M34 24h6M13 13l4 4M31 31l4 4M35 13l-4 4M17 31l-4 4" />
    </g>
  );
}

function Ability({ id, col }: { id: string; col: string }) {
  const glyph = ABILITY_BY_ID[id]?.icon ?? "✦";
  return (
    <g>
      <path d="M24 7l5 9 10 2-7 8 2 10-10-5-10 5 2-10-7-8 10-2z" fill={`${col}18`} />
      <text x="24" y="29" textAnchor="middle" fontSize="13" fill={col} stroke="none">{glyph}</text>
    </g>
  );
}
