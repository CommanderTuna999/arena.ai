// Isolated copy of the live upgrade panel, limited to supported guest systems.
import {useState} from 'react';
import type {Game} from '../../../engine';
import {UPGRADES,UP_CATS,upgradeCost,type UpCat} from '../../../data';
import {fmtNum} from '../../../math';
export function ShipUpgrades({ game }: { game: Game }) {
  const [cat, setCat] = useState<UpCat>("hull");
  const save = game.save;
  const free = game.admin.on && game.admin.credits;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {UP_CATS.filter(c=>c.id==='hull'||c.id==='mobility').map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="rounded-sm border px-3 py-1 text-xs font-bold tracking-wider" style={{ borderColor: cat === c.id ? c.color : "rgba(255,255,255,0.15)", color: c.color, background: cat === c.id ? c.color + "22" : "transparent" }}>{c.name.toUpperCase()}</button>
          ))}
        </div>
        <div className="text-[9px] font-bold tracking-[0.18em] text-white/30">ONE BUTTON PER SIZE · A SIZE THAT DOES NOT FIT IS GREYED</div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {UPGRADES.filter((u) => u.cat === cat).map((u) => {
          const l = save.upgrades[u.id] ?? 0;
          const maxed = l >= u.max;
          const room = u.max - l;
          const color = UP_CATS.find((c) => c.id === u.cat)!.color;
          /* a size only shows if the track could ever take it, and it greys out
           * the moment there is not enough of the track left to buy it */
          const sizes = [1, 5, 10].filter((n) => u.max >= n);
          const cost = (n: number) => {
            let total = 0;
            for (let k = 0; k < n; k++) total += free ? 0 : upgradeCost(u, l + k);
            return total;
          };
          return (
            <div key={u.id} className="rounded-sm border border-white/15 bg-white/[0.03] p-2.5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold" style={{ color }}>{u.name}</div>
                <div className="text-[11px] text-white/60">LV {l}/{u.max}</div>
              </div>
              <div className="text-[11px] text-white/60">{u.desc}</div>
              <div className="mt-1.5 flex gap-px">
                {Array.from({ length: u.max }).map((_, i) => <div key={i} className="h-1.5 flex-1" style={{ background: i < l ? color : "rgba(255,255,255,0.1)" }} />)}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0 truncate text-xs text-cyan-100">{u.fmt(l)}{!maxed && <span className="text-emerald-300"> → {u.fmt(l + 1)}</span>}</div>
                <div className="flex shrink-0 gap-1">
                  {sizes.map((n) => {
                    const price = cost(n);
                    const can = !maxed && room >= n && (free || save.credits >= price);
                    return (
                      <button
                        key={n}
                        disabled={!can}
                        onClick={() => game.buy(u.id, n)}
                        title={can ? `${n} level${n > 1 ? "s" : ""} for ${fmtNum(price)} CR` : room < n ? `only ${room} level${room === 1 ? "" : "s"} left` : "not enough credits"}
                        className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${can ? "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30" : "border-white/10 text-white/25"}`}
                      >
                        +{n}
                      </button>
                    );
                  })}
                  <button
                    disabled={maxed}
                    onClick={() => game.buy(u.id, room)}
                    title={maxed ? "maxed" : `all ${room} remaining level${room === 1 ? "" : "s"}`}
                    className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${maxed ? "border-white/10 text-white/25" : "border-cyan-300 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/30"}`}
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
