import { DamageLedger } from './damage-ledger';

/** Server-internal reward planning, not a pickup or persistence implementation.
 * Part IDs are opportunities to run the existing drop rules, not guaranteed
 * drops. Record each eligible component when broken, including the core; keep
 * them private until the enemy is defeated and final damage totals are known.
 * The caller must roll each opportunity independently for each recipient and
 * persist awards atomically/idempotently before making them claimable. */
export class LootEntitlements {
  private readonly parts = new Set<number>();
  private finished: Array<{ pilotId: string; partIds: number[] }> | null = null;
  constructor(private readonly damage: DamageLedger, private readonly ultra: boolean) {}
  recordPart(partId: number): void {
    if (this.finished) throw new Error('Encounter already finished');
    if (!Number.isSafeInteger(partId) || partId < 0) throw new Error('Invalid part');
    this.parts.add(partId);
  }
  /** Repeated reads return the same finalized eligibility, without exposing
   * mutable internal arrays. No RNG or inventory writes happen in this method. */
  finalize(): Array<{ pilotId: string; partIds: number[] }> {
    if (!this.finished) {
      const partIds = [...this.parts];
      this.finished = this.damage.eligible(this.ultra).map(pilotId => ({ pilotId, partIds: [...partIds] }));
    }
    return this.finished.map(({ pilotId, partIds }) => ({ pilotId, partIds: [...partIds] }));
  }
}
