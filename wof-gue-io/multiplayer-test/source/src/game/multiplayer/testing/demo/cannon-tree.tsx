// Isolated copy of the live game's CannonTree UI. All actions are sent to the demo server.
import {useState,type ReactNode} from 'react';
import type {Game} from '../../../engine';
import {CANNONS,CANNON_BY_ID,cannonBillProblem,cannonDmg,cannonOwned,cannonRate,cannonTracks,cannonTrackCost,cannonTrackValue,partBillText,type CannonDef,type CannonTrackId} from '../../../data';
import {fmtNum} from '../../../math';
function CannonIcon({ c, className }: { c: CannonDef; className?: string }) {
  if (c.id === "chairman") return <svg viewBox="0 0 48 26" className={className} aria-hidden>
    <ellipse cx="24" cy="13" rx="22" ry="10" fill="none" stroke="#e82743" strokeWidth=".8"/>
    <ellipse cx="24" cy="13" rx="16" ry="7" fill="none" stroke="#ff6375" strokeWidth=".7"/>
    {Array.from({length: 10}, (_, i) => { const a=i*Math.PI*2/10; return <circle key={i} cx={24+21*Math.cos(a)} cy={13+9*Math.sin(a)} r="1.3" fill="#ff344a"/>; })}
    <circle cx="24" cy="13" r="5.5" fill="#801025" stroke="#ff6671"/><circle cx="24" cy="13" r="2.5" fill="#ffb0a5"/>
  </svg>;
  const { style, bore, len, hue } = c.look;
  const trim = `hsl(${hue} 92% 64%)`;
  const steel = "#0b1a26";
  const edge = `hsl(${hue} 70% 48%)`;
  const cy = 13;
  const x1 = Math.min(46, 10 + len);
  const barrel = (y: number, w: number, xEnd: number, key: string) => (
    <g key={key}>
      <rect x={10} y={y - w} width={Math.max(2, xEnd - 10)} height={w * 2} rx={0.8} fill={steel} stroke={edge} strokeWidth={0.7} />
      <line x1={12} y1={y} x2={xEnd - 1.5} y2={y} stroke={trim} strokeWidth={0.8} opacity={0.9} />
      <ellipse cx={xEnd} cy={y} rx={0.8} ry={w + 0.4} fill="none" stroke={trim} strokeWidth={0.7} />
    </g>
  );
  return (
    <svg viewBox="0 0 48 26" className={className} aria-hidden>
      {/* breech block bolted to the hull */}
      <path d={`M6 ${cy - bore - 2} L11 ${cy - bore - 3.4} L11 ${cy + bore + 3.4} L6 ${cy + bore + 2} Z`} fill={steel} stroke={edge} strokeWidth={0.7} />
      {style === "spray" && (
        <>
          {barrel(cy - 3.4, bore * 0.62, x1 - 2, "a")}
          {barrel(cy + 3.4, bore * 0.62, x1 - 2, "c")}
          {barrel(cy, bore * 0.72, x1, "b")}
        </>
      )}
      {style === "lance" && (
        <>
          <rect x={11} y={cy - bore - 2.6} width={Math.max(2, x1 - 16)} height={(bore + 2.6) * 2} fill="rgba(120,200,235,0.10)" stroke={`hsl(${hue} 80% 70% / 0.45)`} strokeWidth={0.6} />
          {barrel(cy, bore, x1, "a")}
          {[0, 1].map((k) => (
            <line key={k} x1={18 + k * 7} y1={cy - bore - 2.2} x2={18 + k * 7} y2={cy + bore + 2.2} stroke={trim} strokeWidth={1.1} />
          ))}
        </>
      )}
      {style === "twin" && (
        <>
          {c.muzzles.map((m, i) => barrel(cy + m.y, bore * 0.72, x1, `m${i}`))}
          <line x1={13} y1={cy + c.muzzles[0].y} x2={13} y2={cy + c.muzzles[c.muzzles.length - 1].y} stroke={edge} strokeWidth={1} />
        </>
      )}
      {style === "bolt" && (
        <>
          {barrel(cy, bore, x1 - 4, "a")}
          <path d={`M${x1 - 4} ${cy - bore - 2.4} L${x1 + 1} ${cy - bore - 3.6} L${x1 + 1} ${cy + bore + 3.6} L${x1 - 4} ${cy + bore + 2.4} Z`} fill={steel} stroke={edge} strokeWidth={0.7} />
        </>
      )}
    </svg>
  );
}

/* A small glyph for every upgrade node, so a branch is pictures and not just
 * words: a round for damage, a dial for rate, a seam for crit, a spike through
 * plating for penetration, a crosshair for accuracy, chevrons for speed and a
 * pair of tubes for the second barrel. */
function TrackIcon({ id, hue, className }: { id: CannonTrackId; hue: number; className?: string }) {
  const c = `hsl(${hue} 92% 66%)`;
  const dim = `hsl(${hue} 60% 40%)`;
  const g = (children: ReactNode) => (
    <svg viewBox="0 0 20 20" className={className} aria-hidden fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
  switch (id) {
    case "dmg": return g(<><circle cx="7" cy="10" r="3.4" fill={c} fillOpacity={0.25} /><path d="M12 10h5M14 7.6l2.4 2.4-2.4 2.4" /></>);
    case "rate": return g(<><circle cx="10" cy="10" r="6.2" stroke={dim} /><path d="M10 6.2V10l3 1.8" /></>);
    case "crit": return g(<><path d="M10 2.6l2 4.6 4.9.5-3.7 3.3 1.1 4.8-4.3-2.5-4.3 2.5 1.1-4.8L3.1 7.7l4.9-.5z" fill={c} fillOpacity={0.2} /></>);
    case "critDmg": return g(<><path d="M10 2.6l2 4.6 4.9.5-3.7 3.3 1.1 4.8-4.3-2.5-4.3 2.5 1.1-4.8L3.1 7.7l4.9-.5z" fill={c} fillOpacity={0.2} /><circle cx="10" cy="9.6" r="2" stroke="#fff8cf" /></>);
    case "pen": return g(<><path d="M2 10h8M7 6.6L10.6 10 7 13.4" /><path d="M12.5 3.5v13" stroke={dim} /><path d="M15 10h3.4" /></>);
    case "spread":
    case "acc": return g(<><circle cx="10" cy="10" r="6" stroke={dim} /><circle cx="10" cy="10" r="2.4" /><path d="M10 1.6v3.4M10 15v3.4M1.6 10h3.4M15 10h3.4" /></>);
    case "speed": return g(<><path d="M3 5.6l5 4.4-5 4.4M9.6 5.6l5 4.4-5 4.4M16.2 5.6l2.2 4.4-2.2 4.4" stroke={dim} /><path d="M3 5.6l5 4.4-5 4.4" /></>);
    case "barrels": return g(<><rect x="3" y="5.4" width="14" height="3" rx="1" /><rect x="3" y="11.4" width="14" height="3" rx="1" /><path d="M17 6.9h1.6M17 12.9h1.6" /></>);
    case "drones": return g(<><circle cx="10" cy="10" r="6" stroke={dim}/><circle cx="10" cy="4" r="2" fill={c}/><circle cx="5" cy="13" r="2" fill={c}/><circle cx="15" cy="13" r="2" fill={c}/></>);
    case "coreDmg": return g(<><circle cx="10" cy="10" r="5"/><path d="M10 2v16M2 10h16"/></>);
    case "orbChance": return g(<><circle cx="10" cy="10" r="5" fill={c} fillOpacity={0.4}/><path d="M10 1v3M10 16v3M1 10h3M16 10h3"/></>);
    case "orbRange": return g(<><circle cx="10" cy="10" r="3"/><circle cx="10" cy="10" r="7" stroke={dim}/></>);
  }
}

/* Cannon tree, drawn as a tree: the free Stinger is the root at the bottom, a
 * trunk climbs to a bus, and every chassis of the next tier hangs off it as a
 * node. A node is small on purpose — its own silhouette, its name, its state —
 * and it only opens into the full card (the sheet's line, the numbers, the bill
 * and the purchase button) while you are on it. Take a gun in a tier and the rest
 * of that row greys out: one gun per tier is not a rule to be read, it is a row
 * that is no longer for sale. */
export function CannonTree({ game }: { game: Game }) {
  const save = game.save;
  const fitted = CANNON_BY_ID[game.stats.cannonId] ?? CANNONS[0];
  const free = game.admin.on && game.admin.credits;
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [branch, setBranch] = useState(false);
  const fittedLv = game.cannonViewLevels(fitted.id);
  const freeParts = game.admin.on && game.admin.components;

  /* one node: compact by default, the whole card while it is open */
  const node = (c: CannonDef, down: boolean, align: "left" | "mid" | "right") => {
    const purchased = cannonOwned(save, c.id);
    const owned = purchased || game.admin.on;
    const selected = fitted.id === c.id;
    const cl = save.cannon?.lv?.[c.id] ?? {};
    const problem = cannonBillProblem(save, c, freeParts, game.admin.on, free);
    /* the row is decided: everything else in it is out of the running */
    const dim = !game.admin.on && !owned && CANNONS.some((o) => o.id !== c.id && o.tier === c.tier && cannonOwned(save, o.id));
    const heats = (c.heatMax ?? 1) > 1;
    const hot = Math.round(cannonDmg(c, cl) * (c.heatMax ?? 1));
    const isOpen = open === c.id;
    return (
      <div
        key={c.id}
        className="relative"
        onMouseEnter={() => setOpen(c.id)}
        onMouseLeave={() => setOpen((v) => (v === c.id ? null : v))}
      >
        <button
          onClick={() => {
            if (owned) { game.selectCannon(c.id); setMsg(null); setOpen(null); setBranch(true); }
            else setOpen((v) => (v === c.id ? null : c.id));
          }}
          title={owned ? `${c.name} — view upgrades` : c.name}
          className={`flex h-[80px] w-full flex-col items-center justify-center gap-0 rounded-sm border px-0.5 transition duration-150 ${
            selected ? "border-yellow-300/80 bg-yellow-300/10 shadow-[0_0_20px_rgba(255,225,77,0.22)]"
              : owned ? "border-cyan-300/50 bg-cyan-400/5 hover:border-cyan-200/80 hover:bg-cyan-400/10"
                : dim ? "border-white/10 bg-black/30 opacity-35 grayscale"
                  : "border-white/20 bg-black/40 hover:border-white/45 hover:bg-white/5"
          } ${isOpen ? "scale-[1.05]" : ""}`}
        >
          <CannonIcon c={c} className="h-7 w-14 shrink-0" />
          <span className={`w-full whitespace-normal text-center text-[11px] font-black leading-tight tracking-wide ${selected ? "text-yellow-100" : owned ? "text-cyan-100" : "text-white/80"}`}>
            {c.name}
          </span>
          <span className="text-[7px] font-black tracking-[0.16em]">
            {selected ? <span className="text-yellow-300">EQUIPPED</span>
              : owned ? <span className="text-cyan-300/80">{cannonOwned(save, c.id) ? "OWNED" : "ADMIN TEST"}</span>
                : <span className="text-white/30">T{c.tier}</span>}
          </span>
        </button>

        {isOpen && (
          <div
            className={`absolute z-40 w-[248px] ${align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"} ${
              down ? "top-full pt-1" : "bottom-full pb-1"
            }`}
          >
            <div className={`rounded-sm border p-2 shadow-[0_14px_44px_rgba(0,0,0,0.8)] ${selected ? "border-yellow-300/60" : owned ? "border-cyan-300/50" : "border-white/25"}`} style={{ backgroundColor: "#050e16" }}>
              <div className="flex items-center gap-1.5">
                <CannonIcon c={c} className="h-6 w-12 shrink-0" />
                <span className={`min-w-0 flex-1 text-[12px] font-black ${selected ? "text-yellow-100" : "text-white"}`}>{c.name}</span>
                <span className="shrink-0 rounded-sm border border-yellow-300/40 bg-yellow-300/10 px-1 py-0.5 text-[8px] font-black text-yellow-200">TIER {c.tier}</span>
              </div>
              <p className="mt-1 text-[10px] italic leading-snug text-white/55">&ldquo;{c.desc}&rdquo;</p>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/60">
                <span>
                  <b className="text-white/90">{fmtNum(cannonDmg(c, cl))}</b>
                  {heats && <> → <b className="text-orange-300">{fmtNum(hot)}</b> hot</>} dmg
                </span>
                <span><b className="text-white/90">{cannonRate(c, cl).toFixed(c.hitscan ? 2 : 1)}</b>/s</span>
                <span>{c.hitscan ? "hitscan" : `${c.range}u`}</span>
              </div>
              {!purchased && <div className="mt-1.5 space-y-0.5 rounded-sm border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] leading-tight text-white/50">
                {c.parts.map((b, i) => <div key={`${b.kind}-${b.tier}-${i}`}>· {partBillText(b)}</div>)}
                <div className="text-yellow-200/80">· {fmtNum(c.credits)} CR</div>
              </div>}
              <button
                onClick={() => {
                  if (purchased) { game.selectCannon(c.id); setMsg(null); setOpen(null); }
                  else { const m = game.buyCannonChassis(c.id); setMsg(m ?? `Purchased ${c.name}`); }
                }}
                disabled={selected || (!purchased && !!problem)}
                title={selected ? `${c.name} is equipped` : purchased ? `Equip ${c.name}` : problem ?? `Purchase the ${c.name}`}
                className={`mt-1.5 w-full rounded-sm border px-2 py-1 text-[10px] font-black tracking-[0.16em] ${
                  (selected || (!purchased && !!problem)) ? "border-white/10 text-white/25" : "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30"
                }`}
              >
                {selected ? "EQUIPPED" : purchased ? "EQUIP" : "PURCHASE"}
              </button>
              {!purchased && problem && <div className="mt-1 text-[9px] leading-tight text-red-300/70">{problem}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Allocate equal-width leaf slots, then centre each prerequisite over its
  // actual children. One SVG draws all connectors in the same coordinate space.
  type TreePoint = { c: CannonDef; x: number; depth: number; children: string[] };
  const points: TreePoint[] = [];
  let leaves = 0, deepest = 0;
  const layout = (c: CannonDef, depth: number, ancestors: Set<string>): number => {
    const next = new Set(ancestors).add(c.id);
    const children = CANNONS.filter((child) => child.requires === c.id && !next.has(child.id));
    deepest = Math.max(deepest, depth);
    const xs = children.map((child) => layout(child, depth + 1, next));
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : leaves++ + 0.5;
    points.push({ c, x, depth, children: children.map((child) => child.id) });
    return x;
  };
  CANNONS.filter((c) => !c.requires || !CANNON_BY_ID[c.requires]).forEach((c) => layout(c, 0, new Set()));
  const pointX = (p: TreePoint) => p.x / Math.max(leaves, 1) * 1000;
  const pointY = (p: TreePoint) => 14 + (deepest - p.depth) * 142;
  const height = 96 + deepest * 142;
  const byId = new Map(points.map((p) => [p.c.id, p]));

  return (
    <div className="h-full min-h-0">
      {/* ---- the tree fills the cannon tab; no drag navigation yet ---- */}
      {!branch && <div className="relative z-20 min-h-full rounded-sm border border-white/10 bg-white/[0.02] p-3">
        <div className="mb-1 flex items-baseline justify-between">
          <div className="text-[10px] font-bold tracking-[0.22em] text-cyan-200/60">CANNON TREE</div>
        </div>
        {msg && <div className="mb-1 rounded-sm border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">{msg}</div>}
        <div className="overflow-x-auto pb-4">
        <div className="relative mt-2" style={{ height, width: `max(100%, ${Math.max(1, leaves) * 130}px)` }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            {points.flatMap((p) => p.children.map((id) => {
              const child = byId.get(id); if (!child) return null;
              const x1 = pointX(p), x2 = pointX(child);
              const y1 = pointY(p), y2 = pointY(child) + 80;
              const mid = (y1 + y2) / 2;
              return <path key={`${p.c.id}-${id}`} d={`M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`} fill="none" stroke="rgba(103,232,249,.42)" vectorEffect="non-scaling-stroke" />;
            }))}
          </svg>
          {points.map((p) => <div key={p.c.id} className="absolute" style={{ left: `${pointX(p) / 10}%`, top: pointY(p), width: `${Math.min(100 / Math.max(leaves, 1) - 0.7, 22)}%`, transform: "translateX(-50%)", zIndex: open === p.c.id ? 100 : 1 }}>
            {node(p.c, true, p.x < 1.5 ? "left" : p.x > leaves - 1.5 ? "right" : "mid")}
          </div>)}
        </div>
        </div>
      </div>}

      {/* ---- the selected gun's upgrades take over the cannon tab ---- */}
      {branch && <div className="min-h-full rounded-sm border border-white/10 bg-white/[0.02] p-3">
        <button onClick={() => { setBranch(false); setOpen(null); }} className="mb-3 rounded-sm border border-cyan-300/50 px-3 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-400/15">← BACK TO CANNON TREE</button>
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-bold tracking-[0.22em] text-cyan-200/60">BRANCH · {fitted.name.toUpperCase()}</div>
          <div className="text-[10px] text-white/40">tier {fitted.tier}</div>
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.02] p-1.5">
          <CannonIcon c={fitted} className="h-10 w-20 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] leading-snug text-white/60">{fitted.desc}</p>
            <p className="mt-0.5 text-[10px] text-white/40">
              {fmtNum(cannonDmg(fitted, fittedLv))} dmg
              {fitted.heatMax && fitted.heatMax > 1 && <> · <span className="text-orange-300/80">{fmtNum(cannonDmg(fitted, fittedLv) * fitted.heatMax)} at full heat</span></>}
              {fitted.overheat ? ` · ${fitted.overheat}s cool-down` : ""}
            </p>
          </div>
        </div>

        <div className="relative mt-2 pl-3">
          {/* the branch spine every upgrade node hangs off */}
          <div className="absolute bottom-3 left-0 top-2 w-px bg-cyan-300/25" />
          <div className="grid gap-1.5">
            {cannonTracks(fitted).map((t) => {
              const l = fittedLv[t.id] ?? 0;
              const maxed = l >= t.max;
              const room = t.max - l;
              const price = free ? 0 : cannonTrackCost(fitted, t, l);
              const now = cannonTrackValue(fitted, t.id, l);
              const next = cannonTrackValue(fitted, t.id, Math.min(t.max, l + 1));
              /* a size only shows if the track could ever take it, and it greys
               * out the moment there is not enough of the track left */
              const sizes = [1, 5, 10].filter((n) => t.max >= n);
              const affordable = (n: number) => {
                let total = 0;
                for (let k = 0; k < n; k++) total += free ? 0 : cannonTrackCost(fitted, t, l + k);
                return free || save.credits >= total;
              };
              const buy = (n: number) => {
                let total = 0;
                for (let k = 0; k < n; k++) total += free ? 0 : cannonTrackCost(fitted, t, l + k);
                return `${n} level${n > 1 ? "s" : ""} for ${fmtNum(total)} CR`;
              };
              return (
                <div key={t.id} className="relative rounded-sm border border-white/15 bg-white/[0.03] p-2">
                  <div className="absolute -left-3 top-4 h-px w-3 bg-cyan-300/25" />
                  <div className="flex items-center gap-1.5">
                    <TrackIcon id={t.id} hue={fitted.look.hue} className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1 truncate text-[12px] font-bold text-yellow-200">{t.name}</div>
                    <div className="shrink-0 text-[10px] text-white/55">LV {l}/{t.max}</div>
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-white/50">{t.desc}</div>
                  <div className="mt-1 flex gap-px">
                    {Array.from({ length: t.max }).map((_, i) => (
                      <div key={i} className="h-1 flex-1" style={{ background: i < l ? "#ffd24d" : "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate text-[11px] text-cyan-100">{now}{!maxed && <span className="text-emerald-300"> → {next}</span>}</div>
                    <div className="flex shrink-0 gap-1">
                      {sizes.map((n) => {
                        const can = !maxed && room >= n && affordable(n);
                        return (
                          <button
                            key={n}
                            disabled={!can}
                            onClick={() => game.buyCannon(t.id, n)}
                            title={can ? buy(n) : room < n ? `only ${room} level${room === 1 ? "" : "s"} left` : "not enough credits"}
                            className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${can ? "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30" : "border-white/10 text-white/25"}`}
                          >
                            +{n}
                          </button>
                        );
                      })}
                      <button
                        disabled={maxed}
                        onClick={() => game.buyCannon(t.id, room)}
                        title={maxed ? "fully calibrated" : `all ${room} remaining level${room === 1 ? "" : "s"}`}
                        className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${maxed ? "border-white/10 text-white/25" : "border-cyan-300 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/30"}`}
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  <div className="mt-0.5 text-right text-[9px] text-white/35">{maxed ? "fully calibrated" : `${fmtNum(price)} CR per level`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}
    </div>
  );
}
