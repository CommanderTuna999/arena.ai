import { randomUUID } from 'node:crypto';
import { compMass, compValue, type Comp } from '../data';
import { rollComponentTiers } from '../drop-roll';
import type { Enemy } from '../engine';

type Plan = { pilotId: string; partIds: number[] };
const copy = (c: Comp): Comp => ({ ...c, poly: [...c.poly] });

/** Experimental in-memory private rewards, not durable and not an auth boundary.
 * Caller must resolve an authenticated stable account to pilotId. A production
 * implementation needs an atomic, idempotent DB transaction before confirming
 * claims, plus a secure authenticated pickup protocol. Never expose this vault
 * directly to untrusted clients or use it for real account progression yet. */
export class PrivateLootVault {
  private readonly settled = new WeakSet<Enemy>();
  private readonly pending = new Map<string, Comp[]>();
  private readonly issuedIds = new Set<string>();
  private readonly settlements = new WeakMap<Enemy, Array<{ ownerId: string; component: Comp }>>();
  constructor(private readonly rng: () => number = Math.random, private readonly id: () => string = randomUUID) {}
  settle(enemy: Enemy, plans: readonly Plan[], dropChanceFor: (pilotId: string) => number | undefined): boolean {
    if (!enemy.dead) throw new Error('Enemy is still alive');
    if (this.settled.has(enemy)) return false;
    const seen = new Set<string>();
    const chances = new Map<string, number>();
    // Validate the entire plan before drawing any rolls or changing the vault.
    for (const plan of plans) {
      const chance = dropChanceFor(plan.pilotId);
      if (!plan.pilotId || seen.has(plan.pilotId) || chance === undefined || !Number.isFinite(chance) || chance < 0) throw new Error('Invalid loot recipient');
      seen.add(plan.pilotId); chances.set(plan.pilotId, chance);
      const ids = new Set<number>();
      for (const id of plan.partIds) {
        if (!Number.isSafeInteger(id) || ids.has(id) || !enemy.parts.some(p => p.id === id)) throw new Error('Invalid loot part');
        ids.add(id);
      }
    }
    const generated = new Map<string, Comp[]>();
    const usedIds = new Set<string>();
    for (const plan of plans) {
      const chance = chances.get(plan.pilotId)!;
      const result: Comp[] = [];
      for (const partId of plan.partIds) {
        const part = enemy.parts.find(p => p.id === partId)!;
        for (const tier of rollComponentTiers(enemy.tier, part.kind, !!enemy.spd.boss, chance, 1, this.rng)) {
          const id = this.id();
          if (!id || usedIds.has(id) || this.issuedIds.has(id)) throw new Error('Duplicate component id');
          usedIds.add(id);
          result.push({ id, species: enemy.spd.name, name: `${enemy.spd.name} ${part.name}`, kind: part.kind, tier,
            poly: part.poly.map((v,i)=>+(v-(i%2===0?part.cx:part.cy)).toFixed(1)), area:part.area,
            mass:compMass(part.area), hue:enemy.spd.hue, value:compValue(part.area,tier,part.kind) });
        }
      }
      generated.set(plan.pilotId, result);
    }
    for (const [pilotId, items] of generated) this.pending.set(pilotId, [...(this.pending.get(pilotId) ?? []), ...items]);
    for (const id of usedIds) this.issuedIds.add(id);
    this.settlements.set(enemy, Array.from(generated, ([ownerId, items]) => items.map(component => ({ ownerId, component: copy(component) }))).flat());
    this.settled.add(enemy);
    return true;
  }
  /** Immutable-by-copy encounter batch for an experimental persistence queue. */
  settlement(enemy: Enemy): Array<{ ownerId: string; component: Comp }> | null {
    return this.settlements.get(enemy)?.map(({ownerId,component})=>({ownerId,component:copy(component)})) ?? null;
  }
  /** Copies only: callers cannot mutate the server's reward records. */
  peek(pilotId: string): Comp[] { return (this.pending.get(pilotId) ?? []).map(copy); }
  /** In-memory only: do not call until a future persistent transaction commits. */
  acknowledge(pilotId: string, itemId: string): boolean {
    const items = this.pending.get(pilotId); if (!items) return false;
    const index = items.findIndex(item => item.id === itemId); if (index < 0) return false;
    items.splice(index, 1); if (!items.length) this.pending.delete(pilotId); return true;
  }
}
