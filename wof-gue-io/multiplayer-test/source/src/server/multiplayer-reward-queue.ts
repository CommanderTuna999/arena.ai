import type { Comp } from '../game/data';
type Award = { ownerId: string; component: Comp };
interface Store { settle(worldId: string, encounterId: string, awards: readonly Award[]): Promise<'inserted'|'already-settled'> }
const copy = (awards: readonly Award[]): Award[] => awards.map(({ownerId,component})=>({ownerId,component:{...component,poly:[...component.poly]}}));
/** Prototype in-memory write queue for the server-owned reward outbox. Bounded,
 * serial and retryable, but NOT crash-safe until a durable world journal and
 * transactional account-save transfer exist. Never expose to the public yet. */
export class RewardWriteQueue {
  private readonly pending = new Map<string, Award[]>();
  private flushing: Promise<void> | null = null;
  constructor(private readonly store: Store, private readonly worldId: string, readonly limit = 1000) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(worldId) || !Number.isSafeInteger(limit) || limit < 1) throw new Error('Invalid reward queue');
  }
  get size() { return this.pending.size; }
  enqueue(encounterId: string, awards: readonly Award[]): void {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(encounterId)) throw new Error('Invalid encounter');
    const batch=copy(awards), previous=this.pending.get(encounterId);
    if (previous) { if (JSON.stringify(previous)!==JSON.stringify(batch)) throw new Error('Conflicting queued reward'); return; }
    if (this.pending.size >= this.limit) throw new Error('Reward queue full');
    this.pending.set(encounterId,batch);
  }
  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    const run = async () => {
      for (const [encounterId,batch] of this.pending) {
        await this.store.settle(this.worldId,encounterId,copy(batch));
        this.pending.delete(encounterId);
      }
    };
    this.flushing = run().finally(()=>{this.flushing=null;});
    return this.flushing;
  }
}
