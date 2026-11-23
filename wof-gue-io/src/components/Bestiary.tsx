"use client";

import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import { RARITIES } from "@/game/data";
import { bestiaryDrops, type BestiaryDrop } from "@/game/bestiary-drops";
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
  carpenter: "Builds furniture, ruins yours. The base is load-bearing and it knows it.",
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

/* Ask 6: every attack in the bestiary is shown as a single word. */
const SHORT: Record<string, string> = {
  "Acid Burst": "Burst", "Acid Puddle": "Puddle", "Ambush Lunge": "Lunge",
  "Bite": "Bite", "Blade Wave": "Wave", "Blood Drain": "Drain",
  "Boiling Jet": "Jet", "Boring Charge": "Charge", "Boulder Toss": "Toss",
  "Burrow Ambush": "Burrow", "Call Colony": "Summon", "Call Swarm": "Summon",
  "Camo Shift": "Camo", "Chemical Spray": "Spray", "Chomp": "Chomp",
  "Chorus Field": "Field", "Crushing Bite": "Bite", "Dash": "Dash",
  "Digger Claws": "Claws", "Dive Bomb": "Dive", "Dive": "Dive",
  "Domain": "Domain", "Downdraft": "Gust", "Drill Shock": "Shock",
  "Drill Strike": "Strike", "Earth Shock": "Shock", "Fang Slash": "Slash",
  "Firework": "Burst", "Flash Dive": "Dive", "Flash Pulse": "Pulse",
  "Forcipule Bite": "Bite", "Formic Acid": "Acid", "Formic Haze": "Haze",
  "Glow Orb": "Orb", "Goring Rush": "Rush", "Ground Slam": "Slam",
  "Horn Charge": "Charge", "Horn Toss": "Toss", "Hornet Dive": "Dive",
  "Impact Wave": "Wave", "Kick": "Kick", "Leaf Shards": "Shards",
  "Leaping Charge": "Charge", "Lunge": "Lunge", "Mandible Crush": "Crush",
  "Mandible Snap": "Snap", "Missiles": "Missiles", "Piercing Proboscis": "Pierce",
  "Pincer Grab": "Grab", "Pollen Burst": "Burst", "Prism Pulse": "Pulse",
  "Prismatic Beam": "Beam", "Pull": "Pull", "Quake Stomp": "Stomp",
  "Ram": "Ram", "Refraction": "Refract", "Repel Pulse": "Pulse",
  "Resonance": "Resonance", "Rolling Slam": "Slam", "Rotating Lasers": "Lasers",
  "Rush": "Rush", "Scuttle Acid": "Acid", "Scythe Strike": "Strike",
  "Second Dash": "Dash", "Serpent Rush": "Rush", "Shard Storm": "Storm",
  "Shell Bash": "Bash", "Shockwave": "Shock", "Shot Burst": "Burst",
  "Sickle Jaws": "Jaws", "Slow Powder": "Powder", "Sonic Screech": "Screech",
  "Spit Seeds": "Seeds", "Spore Burst": "Burst", "Spore Cloud": "Cloud",
  "Spray": "Spray", "Sting Dive": "Sting", "Stinger Burst": "Burst",
  "Stinger Thrust": "Sting", "Stinger Volley": "Volley", "Summon Swarm": "Summon",
  "Swarm Bite": "Bite", "Swarm Rush": "Rush", "Tail Sting": "Sting",
  "Tail Sweep": "Sweep", "Toss": "Toss", "Venom Darts": "Darts",
  "Venom Glob": "Glob", "Venom Ring": "Ring", "Venom Spray": "Spray",
  "Venom Sting": "Sting", "Web Volley": "Volley", "Web": "Web",
  "Whirling Blades": "Blades", "Wind Gust": "Gust", "Wing Flare": "Flare",
  "Wing Storm": "Storm",
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

// A shared world-space frame keeps all species and rarities at the same scale.
let mythicExtent = 0;
function referenceExtent() {
  if (!mythicExtent) for (const species of SPECIES_LIST) {
    const b = bounds(preview(species, 5).parts);
    mythicExtent = Math.max(mythicExtent, Math.abs(b.x), Math.abs(b.y), Math.abs(b.x + b.w), Math.abs(b.y + b.h));
  }
  return mythicExtent;
}
function BugArt({ sp, tier, seen, size }: { sp: SpeciesDef; tier: number; seen: boolean; size: number }) {
  const built = preview(sp, tier);
  const extent = referenceExtent() * 0.3;
  return (
    <svg width={size} height={size} viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`} aria-hidden="true">
      {built.parts.map((p, i) => (
        <polygon
          key={i}
          points={Array.from({ length: p.poly.length / 2 }, (_, k) => `${p.poly[k * 2]},${p.poly[k * 2 + 1]}`).join(" ")}
          fill={seen ? p.fill : "#05070c"}
          stroke={seen ? p.stroke : "#131a24"}
          strokeWidth={Math.max(0.8, built.radius * (seen ? 0.016 : 0.012))}
        />
      ))}
    </svg>
  );
}

interface Hover { id: string; tier: number; x: number; y: number; w: number; h: number }

export default function Bestiary({ bestiary, onClose }: { bestiary: Record<string, number>; onClose: () => void }) {
  const discovered = useMemo(() => SPECIES_LIST.filter((s) => bestiary[s.id] !== undefined).length, [bestiary]);
  /* every species is catalogued once per rarity, so there are six entries each */
  const entries = useMemo(() => SPECIES_LIST.reduce((a, s) => a + (bestiary[s.id] === undefined ? 0 : bestiary[s.id] + 1), 0), [bestiary]);
  const total = SPECIES_LIST.length * RARITIES.length;
  const [hover, setHover] = useState<Hover | null>(null);
  const [dropView, setDropView] = useState<{ id:string; tier:number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = null; };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setHover(null), 300); };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const sp = hover ? SPECIES_LIST.find((s) => s.id === hover.id) ?? null : null;
  const seen = sp && hover ? (bestiary[sp.id] ?? -1) >= hover.tier : false;
  const dropSpecies = dropView ? SPECIES_LIST.find((s) => s.id === dropView.id) : undefined;

  const show = (e: MouseEvent<HTMLButtonElement>, id: string, tier: number) => {
    cancelClose();
    lastTrigger.current = e.currentTarget;
    const r = e.currentTarget.getBoundingClientRect();
    const w = Math.min(360, window.innerWidth - 16);
    const h = 380;
    let x = r.right + 10;
    if (x + w > window.innerWidth - 8) x = r.left - w - 10;
    if (x < 8) x = 8;
    let y = r.top;
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    setHover({ id, tier, x, y, w, h });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-2 backdrop-blur-sm sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[94dvh] w-[min(97vw,74rem)] flex-col rounded-md border border-yellow-300/40 bg-[#060a18] shadow-[0_0_50px_rgba(255,210,77,0.16)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BeeIcon size={26} />
            <div>
              <div className="text-base font-black tracking-[0.28em] text-yellow-200">BESTIARY</div>
              <div className="text-[11px] text-white/40">{discovered}/{SPECIES_LIST.length} species · {entries}/{total} rarity entries · hover one for detail</div>
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
                    const best = bestiary[s.id];
                    const known = best !== undefined;
                    return (
                      <div key={s.id} className="rounded-sm border border-white/10 bg-[#080e1c] p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                        <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
                          <span className={`truncate text-[9px] font-bold tracking-[0.16em] ${known ? "text-cyan-100/85" : "text-white/25"}`}>
                            {known ? s.name.toUpperCase() : "???"}
                          </span>
                          <span className="shrink-0 text-[8px] tabular-nums text-white/30">{known ? best + 1 : 0}/{RARITIES.length}</span>
                        </div>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((k) => {
                            const tierKnown = known && best >= k;
                            const active = hover?.id === s.id && hover.tier === k;
                            const col = k === 6 ? "#bcbcbc" : RARITIES[k].color;
                            return (
                              <button
                                key={k}
                                onMouseEnter={(e) => show(e, s.id, k)}
                                onFocus={(e) => show(e as unknown as MouseEvent<HTMLButtonElement>, s.id, k)}
                                onClick={(e) => show(e, s.id, k)}
                                onMouseLeave={scheduleClose}
                                onBlur={scheduleClose}
                                title={tierKnown ? `${s.name} · ${RARITIES[k].name}` : `${RARITIES[k].name} · not yet defeated`}
                                className="relative grid h-[3.4rem] w-[2.55rem] place-items-center overflow-hidden rounded-sm border transition"
                                style={{
                                  borderColor: active ? col : tierKnown ? col + "88" : "#1b2230",
                                  background: active ? "#1a2033" : tierKnown ? "#0d1526" : "#070b14",
                                  boxShadow: active ? `0 0 12px ${col}55` : tierKnown ? `inset 0 0 10px ${col}22` : undefined,
                                }}
                              >
                                <BugArt sp={s} tier={k} seen={tierKnown} size={34} />
                                <span className="absolute inset-x-0 bottom-0 text-center text-[7px] font-bold tracking-[0.1em]" style={{ color: tierKnown ? (k === 6 ? "#000000" : col) : "#33404f", background: tierKnown && k === 6 ? "linear-gradient(110deg, #fff, #777)" : undefined }}>
                                  {RARITIES[k].name.slice(0, 3).toUpperCase()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {sp && hover && (
        <div role="region" aria-label={`${sp.name} bestiary details`} tabIndex={0} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} onFocus={cancelClose} onBlur={scheduleClose} onKeyDown={(e) => { if (e.key === "Escape") setHover(null); }} className="fixed z-[60] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-md border border-yellow-300/50 bg-[#070b1a] p-3 shadow-[0_10px_40px_rgba(0,0,0,0.7)]" style={{ left: hover.x, top: hover.y, width: hover.w, maxHeight: `min(85dvh, calc(100dvh - ${hover.y + 8}px))` }}>
          {!seen ? (
            <div className="grid place-items-center gap-2 py-6 text-center">
              <BugArt sp={sp} tier={hover.tier} seen={false} size={96} />
              <div className="text-sm font-black" style={{ color: hover.tier === 6 ? "#000000" : RARITIES[hover.tier].color, background: hover.tier === 6 ? "linear-gradient(110deg, #fff, #777)" : undefined }}>{RARITIES[hover.tier].name.toUpperCase()}</div>
              <div className="text-[11px] text-white/45">
                {bestiary[sp.id] === undefined
                  ? "Kill this species once to fill in its entries."
                  : `Not yet killed at ${RARITIES[hover.tier].name.toLowerCase()} rarity.`}
              </div>
            </div>
          ) : (
            <EntryInfo sp={sp} tier={hover.tier} onViewDrops={() => { cancelClose(); setDropView({id:sp.id,tier:hover.tier}); setHover(null); }} />
          )}
        </div>
      )}
      {dropSpecies && dropView && <DropsDialog sp={dropSpecies} tier={dropView.tier} onClose={() => { setDropView(null); lastTrigger.current?.focus(); }} />}
    </div>
  );
}

function EntryInfo({ sp, tier, onViewDrops }: { sp: SpeciesDef; tier: number; onViewDrops: () => void }) {
  const built = preview(sp, tier);
  const hull = Math.round(built.parts.reduce((a, p) => a + p.maxHp, 0));
  const shells = tier >= 2 && !sp.bodyWave ? tier - 1 : 0;
  const panels = tier >= 3 ? tier - 1 : 0;
  const guns = built.parts.filter((p) => p.wpn === "gun").length + built.parts.filter((p) => p.wpn === "missile").length;
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="shrink-0 overflow-hidden rounded-sm border border-white/10 bg-[#0a1020] p-1" style={{ borderColor: RARITIES[tier].color + "66" }}>
          <BugArt sp={sp} tier={tier} seen size={84} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black leading-tight text-yellow-200">{sp.name}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{familyOf(sp.id)}</div>
          <div className="mt-1 text-[10px] text-white/40">Rarity</div>
          <div className="text-xs font-black tracking-[0.14em]" style={{ color: tier === 6 ? "#000000" : RARITIES[tier].color, background: tier === 6 ? "linear-gradient(110deg, #fff, #777)" : undefined }}>{RARITIES[tier].name.toUpperCase()}</div>
        </div>
      </div>
      <p className="mt-2 border-l-2 border-yellow-300/40 pl-2 text-[11px] italic leading-snug text-white/65">{FLAVOUR[sp.id] ?? "No field notes yet."}</p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
        <Stat k="Parts" v={built.parts.length} />
        <Stat k="Hull" v={fmtNum(hull)} />
        <Stat k="Radius" v={`${Math.round(built.radius)}u`} />
        <Stat k="Shells" v={shells || "—"} />
        <Stat k="Panels" v={panels || "—"} />
        <Stat k="Mounts" v={guns || "—"} />
        <Stat k="Speed" v={Math.round(sp.speed)} />
        <Stat k="Turn" v={sp.turn.toFixed(1)} />
        <Stat k="Pack" v={sp.pack[Math.min(tier, 5)]} />
      </div>
      <div className="mt-1.5 text-[10px] leading-snug text-white/45">Abilities: {sp.abilities.filter((a) => a.minTier <= tier).map((a) => SHORT[a.name] ?? a.name).join(", ") || "none"}</div>
      <button type="button" onClick={onViewDrops} className="mt-3 w-full rounded-sm border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-xs font-bold tracking-wider text-cyan-100 hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">VIEW DROPS</button>
    </div>
  );
}

/** Representative of a real piece produced by the enemy builder. As in
 * inventory, the illustration is fitted to its frame rather than to scale. */
function DropIcon({ drop, tier }: { drop: BestiaryDrop; tier: number }) {
  const gradientId = useId();
  const poly = drop.poly;
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  for (let i=0;i<poly.length;i+=2) { minX=Math.min(minX,poly[i]); maxX=Math.max(maxX,poly[i]); minY=Math.min(minY,poly[i+1]); maxY=Math.max(maxY,poly[i+1]); }
  const w=maxX-minX,h=maxY-minY,scale=40/Math.max(w,h,1);
  const points=Array.from({length:poly.length/2},(_,i)=>`${4+(48-8-w*scale)/2+(poly[2*i]-minX)*scale},${4+(48-8-h*scale)/2+(poly[2*i+1]-minY)*scale}`).join(" ");
  const col=tier===6?"#dedede":RARITIES[tier].color;
  return <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" className="shrink-0 rounded border border-white/10 bg-[#070c19]">
    <defs><linearGradient id={gradientId}><stop stopColor="#ffffff"/><stop offset="0.5" stopColor="#777"/><stop offset="1" stopColor="#fafafa"/></linearGradient></defs>
    <polygon points={points} fill={tier===6?`url(#${gradientId})`:col+"30"} stroke={col} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>;
}

export function DropsDialog({ sp, tier, onClose }: { sp:SpeciesDef; tier:number; onClose:()=>void }) {
  const drops=bestiaryDrops(sp,tier);
  const closeButton=useRef<HTMLButtonElement>(null);
  const scrollArea=useRef<HTMLDivElement>(null);
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-3" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}} onKeyDown={(e)=>{if(e.key==='Escape'){e.stopPropagation();onClose();} else if(e.key==='Tab'){e.preventDefault();if(e.target===closeButton.current)scrollArea.current?.focus();else closeButton.current?.focus();}}}>
    <section role="dialog" aria-modal="true" aria-labelledby="bestiary-drops-title" className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-cyan-300/40 bg-[#070b1a] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div><h2 id="bestiary-drops-title" className="text-sm font-black tracking-[0.12em] text-cyan-100">{sp.name.toUpperCase()} · {RARITIES[tier].name.toUpperCase()} DROPS</h2><p className="mt-1 text-[11px] leading-snug text-white/50">Base chance per eligible piece. Break parts for salvage; base-majority kills yield none. Optional loadouts vary. Salvage upgrades affect ordinary rates, not boss or Ultra rates. Images show representative piece shapes.</p></div>
        <button ref={closeButton} type="button" autoFocus onClick={onClose} className="shrink-0 rounded-sm border border-white/25 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10">CLOSE</button>
      </header>
      <div ref={scrollArea} tabIndex={0} aria-label="Component drops list" className="min-h-0 overflow-y-auto overscroll-contain p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {drops.map((d)=><div key={`${d.kind}:${d.name}`} className="flex gap-2 rounded-sm border border-white/10 bg-[#0a1020] p-2 text-[11px]">
            <DropIcon drop={d} tier={tier}/><div className="min-w-0 flex-1"><div className="font-bold text-cyan-100">{d.name}</div><div className="text-white/40">{d.minCount===d.maxCount?`${d.maxCount} pieces`:d.minCount===0?`Optional, up to ${d.maxCount}`:`${d.minCount}–${d.maxCount} pieces`}</div>
              {d.rates.map((r)=><div key={r.tier} className="flex justify-between gap-2 text-white/70"><span style={{color:r.tier===6?"#e6e6e6":RARITIES[r.tier].color}}>{RARITIES[r.tier].name}</span><span>{formatPercent(r.chance)}</span></div>)}
            </div></div>)}
        </div>
      </div>
    </section>
  </div>;
}

function familyOf(id: string) {
  return FAMILIES.find((f) => f.ids.includes(id))?.name ?? "Unknown";
}

function formatPercent(chance: number) {
  return `${Number((chance * 100).toFixed(2))}%`;
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
