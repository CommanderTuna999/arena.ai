"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { RARITIES, CAT_NAME, KIND_CAT } from "@/game/data";
import { buildEnemy, SPECIES_LIST, type SpeciesDef } from "@/game/enemies";
import { fmtNum } from "@/game/math";

/*
 * Bestiary. Entries stay black silhouettes until the player has killed that
 * species at least once (save.bestiary[id] = highest tier defeated). Hovering a
 * card pops the field note, stats and drop table next to that card.
 */

const FAMILIES: { name: string; ids: string[] }[] = [
  { name: "Ants, Bees & Wasps", ids: ["workerant", "ant", "honeybee", "yellowjacket", "wasp", "carpenter"] },
  { name: "Beetles", ids: ["beetle", "bombardier", "rhino", "ladybug", "stag", "tiger", "dung", "jewel", "weevil", "firefly"] },
  { name: "Moths, Flies & Drifters", ids: ["moth", "atlas", "mosquito", "dragonfly", "cicada"] },
  { name: "Leapers & Creepers", ids: ["grasshopper", "katydid", "locust", "molecricket", "cockroach"] },
  { name: "Hunters & Weavers", ids: ["spider", "scorpion", "mantis", "assassin"] },
  { name: "The Long Ones", ids: ["centipede"] },
  { name: "Legends", ids: ["serpent"] },
];

const FLAVOUR: Record<string, string> = {
  workerant: "Does all the work, gets none of the credit. Will absolutely call its friends.",
  ant: "A worker ant with a promotion and a bad attitude. The mandibles are not decorative.",
  honeybee: "Statistically a bee. Ethically a war crime.",
  yellowjacket: "Not a bee. Will not be accepting questions at this time.",
  wasp: "Flies like it pays rent here. Stings like it does not.",
  carpenter: "Builds furniture, ruins yours. The nest is load-bearing and it knows it.",
  beetle: "A classic. Shiny, stubborn, and unusually committed to ramming you.",
  bombardier: "Its defence mechanism is a chemistry experiment that went right.",
  rhino: "The horn is not compensation. The horn is the whole personality.",
  ladybug: "Looks friendly. Has one thousand children and no boundaries.",
  stag: "Those jaws are for lifting competitors, not for you. Probably.",
  tiger: "Fast, striped, and genuinely annoyed that you are still alive.",
  dung: "Rolls a ball of something unspeakable at surprising speed.",
  jewel: "Expensive carapace, cheap tactics. Very shiny when it explodes.",
  weevil: "A beetle that took the 'long snout' build seriously.",
  firefly: "Glows so you can see it coming. Still hits you anyway.",
  moth: "Navigates by moon and by grudge.",
  atlas: "Enormous wings, no sense of direction, all drama.",
  mosquito: "The most hated insect in the world, now with lasers.",
  dragonfly: "Four wings, zero patience. Intercepts everything.",
  cicada: "Has been underground for seventeen years and is furious about it.",
  grasshopper: "Jumps straight over your shots out of spite.",
  katydid: "Sounds like a leaf. Fights like a blender.",
  locust: "Arrives in numbers. Leaves nothing.",
  molecricket: "Digs, charges, and screams at a frequency you can feel.",
  cockroach: "You cannot kill it. You can only delay it.",
  spider: "Not an insect, but try telling it that while it webs your engines.",
  scorpion: "Eight legs, one very direct opinion about your hull.",
  mantis: "Religious about exactly one thing: dismantling your ship.",
  assassin: "A bug whose entire job description is you.",
  centipede: "Forty legs and every single one of them wants a turn.",
  serpent: "The long shadow in the middle of the map. Currently asleep.",
};

const cache = new Map<string, ReturnType<typeof buildEnemy>>();
function preview(sp: SpeciesDef, tier: number) {
  const key = `${sp.id}:${tier}`;
  let b = cache.get(key);
  if (!b) { b = buildEnemy(SPECIES_LIST.indexOf(sp), tier, 7); cache.set(key, b); }
  return b;
}

function bounds(parts: { poly: number[] }[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of parts) {
    for (let i = 0; i < p.poly.length; i += 2) {
      x0 = Math.min(x0, p.poly[i]); x1 = Math.max(x1, p.poly[i]);
      y0 = Math.min(y0, p.poly[i + 1]); y1 = Math.max(y1, p.poly[i + 1]);
    }
  }
  const pad = Math.max(6, (x1 - x0 + y1 - y0) * 0.06);
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

function BugArt({ sp, tier, seen, size }: { sp: SpeciesDef; tier: number; seen: boolean; size: number }) {
  const built = preview(sp, tier);
  const vb = bounds(built.parts);
  return (
    <svg width={size} height={size} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} aria-hidden="true">
      {built.parts.map((p, i) => (
        <polygon
          key={i}
          points={Array.from({ length: p.poly.length / 2 }, (_, k) => `${p.poly[k * 2]},${p.poly[k * 2 + 1]}`).join(" ")}
          fill={seen ? p.fill : "#05070c"}
          stroke={seen ? p.stroke : "#131a24"}
          strokeWidth={Math.max(0.8, vb.w * (seen ? 0.008 : 0.006))}
        />
      ))}
    </svg>
  );
}

interface Hover { id: string; x: number; y: number; w: number; h: number }

export default function Bestiary({ bestiary, onClose }: { bestiary: Record<string, number>; onClose: () => void }) {
  const discovered = useMemo(() => SPECIES_LIST.filter((s) => bestiary[s.id] !== undefined).length, [bestiary]);
  const [hover, setHover] = useState<Hover | null>(null);
  const sp = hover ? SPECIES_LIST.find((s) => s.id === hover.id) ?? null : null;
  const seen = sp ? bestiary[sp.id] !== undefined : false;

  const show = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    const r = e.currentTarget.getBoundingClientRect();
    const w = Math.min(360, window.innerWidth - 16);
    const h = 360;
    let x = r.right + 10;
    if (x + w > window.innerWidth - 8) x = r.left - w - 10;
    if (x < 8) x = 8;
    let y = r.top;
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    setHover({ id, x, y, w, h });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-2 backdrop-blur-sm sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[94dvh] w-[min(97vw,74rem)] flex-col rounded-md border border-yellow-300/40 bg-[#060a18] shadow-[0_0_50px_rgba(255,210,77,0.16)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BeeIcon size={26} />
            <div>
              <div className="text-base font-black tracking-[0.28em] text-yellow-200">BESTIARY</div>
              <div className="text-[11px] text-white/40">{discovered}/{SPECIES_LIST.length} species discovered · hover an entry for detail</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-sm border border-white/25 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10">CLOSE</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {FAMILIES.map((fam) => {
            const members = fam.ids.map((id) => SPECIES_LIST.find((s) => s.id === id)).filter((s): s is SpeciesDef => !!s);
            if (!members.length) return null;
            return (
              <section key={fam.name} className="mb-6">
                <div className="mb-2 text-[11px] font-bold tracking-[0.24em] text-white/45">{fam.name.toUpperCase()}</div>
                <div className="flex flex-wrap gap-2">
                  {members.map((s) => {
                    const t = bestiary[s.id];
                    const known = t !== undefined;
                    return (
                      <button
                        key={s.id}
                        onMouseEnter={(e) => show(e, s.id)}
                        onFocus={(e) => show(e as unknown as MouseEvent<HTMLButtonElement>, s.id)}
                        onClick={(e) => show(e, s.id)}
                        onMouseLeave={() => setHover(null)}
                        className={`relative flex w-[7.4rem] flex-col items-center gap-1.5 rounded-sm border p-2 shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition hover:scale-[1.04] ${hover?.id === s.id ? "border-yellow-300 bg-[#221c08]" : "border-white/15 bg-[#0b1224] hover:border-cyan-300/40 hover:bg-[#141d33]"}`}
                      >
                        <BugArt sp={s} tier={t ?? 0} seen={known} size={62} />
                        <span className={`w-full truncate text-center text-[10px] font-bold ${known ? "text-cyan-100" : "text-white/25"}`}>{known ? s.name : "???"}</span>
                        <span className="flex gap-px">
                          {[0, 1, 2, 3, 4, 5].map((k) => (
                            <span key={k} className="h-1.5 w-2.5" style={{ background: known && k <= t ? RARITIES[k].color : "#1b2230" }} />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {sp && hover && (
        <div className="pointer-events-none fixed z-[60] max-h-[80dvh] overflow-hidden rounded-md border border-yellow-300/50 bg-[#070b1a] p-3 shadow-[0_10px_40px_rgba(0,0,0,0.7)]" style={{ left: hover.x, top: hover.y, width: hover.w }}>
          {!seen ? (
            <div className="grid place-items-center gap-2 py-6 text-center">
              <BugArt sp={sp} tier={0} seen={false} size={96} />
              <div className="text-sm font-black text-white/35">UNDISCOVERED</div>
              <div className="text-[11px] text-white/40">Kill this species once to fill in its entry.</div>
            </div>
          ) : (
            <EntryInfo sp={sp} tier={bestiary[sp.id]} />
          )}
        </div>
      )}
    </div>
  );
}

function EntryInfo({ sp, tier }: { sp: SpeciesDef; tier: number }) {
  const built = preview(sp, tier);
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-sm border border-white/10 bg-[#0a1020] p-1">
          <BugArt sp={sp} tier={tier} seen size={84} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black leading-tight text-yellow-200">{sp.name}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{familyOf(sp.id)}</div>
          <div className="mt-1 text-[10px] text-white/50">Best rarity defeated</div>
          <div className="text-xs font-bold" style={{ color: RARITIES[tier].color }}>{RARITIES[tier].name}</div>
        </div>
      </div>
      <p className="mt-2 border-l-2 border-yellow-300/40 pl-2 text-[11px] italic leading-snug text-white/65">{FLAVOUR[sp.id] ?? "No field notes yet."}</p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
        <Stat k="Parts" v={built.parts.length} />
        <Stat k="Hull" v={fmtNum(Math.round(built.parts.reduce((a, p) => a + p.maxHp, 0)))} />
        <Stat k="Speed" v={Math.round(sp.speed)} />
        <Stat k="Turn" v={sp.turn.toFixed(1)} />
        <Stat k="Pack" v={sp.pack[tier]} />
        <Stat k="Zones" v={`${sp.minZone ?? 0}–${sp.maxZone ?? 5}`} />
      </div>
      <div className="mt-1.5 text-[10px] leading-snug text-white/45">Abilities: {sp.abilities.filter((a) => a.minTier <= tier).map((a) => a.name).join(", ") || "none"}</div>
      <div className="mt-2 text-[10px] font-bold tracking-[0.2em] text-white/40">DROPS</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {dropList(sp, tier).map((d) => (
          <span key={d.kind} className="rounded-sm border px-1.5 py-0.5 text-[10px] font-bold" style={{ borderColor: d.color + "88", color: d.color, background: d.color + "12" }}>
            {d.name} · {d.rarity}
          </span>
        ))}
      </div>
    </div>
  );
}

function familyOf(id: string) {
  return FAMILIES.find((f) => f.ids.includes(id))?.name ?? "Unknown";
}

function dropList(sp: SpeciesDef, tier: number) {
  const built = preview(sp, tier);
  const kinds = [...new Set(built.parts.filter((p) => p.kind !== "leg" || sp.bodyWave).map((p) => p.kind))];
  return kinds.map((kind) => {
    const r = kind === "core" ? tier : Math.max(0, tier - 1);
    return { kind, name: CAT_NAME[KIND_CAT[kind]], rarity: RARITIES[r].name, color: RARITIES[r].color };
  });
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-1 rounded-sm border border-white/10 bg-[#0a1020] px-1.5 py-0.5">
      <span className="text-white/40">{k}</span><span className="text-cyan-100">{v}</span>
    </div>
  );
}

export function BeeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffe14d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="14" rx="5" ry="6.4" fill="rgba(255,225,77,0.18)" />
      <path d="M9 11.5h6M8.7 14.5h6.6M9.2 17.5h5.6" opacity="0.85" />
      <path d="M8.5 9.5C6 5.5 3 5.5 3 8c0 2 2.5 2.6 5.5 2.2M15.5 9.5C18 5.5 21 5.5 21 8c0 2-2.5 2.6-5.5 2.2" />
      <path d="M10.5 8L9 6M13.5 8L15 6" />
      <path d="M12 20.4v2.2" />
    </svg>
  );
}
