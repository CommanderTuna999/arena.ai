/** Server-side accounting for one enemy. Only actual HP/armour removed should
 * be recorded, after mitigation and overkill caps; never accept amounts from a
 * client. Base/environment damage contributes to the total, not to a pilot.
 * Session IDs here must be replaced by stable authenticated account IDs before
 * rewards can survive reconnects. */
export class DamageLedger {
  private readonly pilots = new Map<string, number>();
  private totalDamage = 0;
  record(pilotId: string | null, amount: number): void {
    if ((pilotId !== null && (typeof pilotId !== 'string' || !pilotId)) || !Number.isFinite(amount) || amount < 0) throw new Error('Invalid damage record');
    if (amount === 0) return;
    const total = this.totalDamage + amount;
    const pilotTotal = pilotId === null ? 0 : (this.pilots.get(pilotId) ?? 0) + amount;
    if (!Number.isFinite(total) || !Number.isFinite(pilotTotal)) throw new Error('Damage total overflow');
    this.totalDamage = total;
    if (pilotId !== null) this.pilots.set(pilotId, pilotTotal);
  }
  get total(): number { return this.totalDamage; }
  contributions(): ReadonlyArray<{ pilotId: string; damage: number }> {
    return Array.from(this.pilots, ([pilotId, damage]) => ({ pilotId, damage }));
  }
  /** Normal enemies: one highest contributor. Equal damage goes to the first
   * recorded contributor (stable insertion order). Ultra: every
   * pilot whose contribution is at least 5% of all recorded damage. */
  eligible(ultra: boolean): string[] {
    if (ultra) return Array.from(this.pilots, ([id, damage]) => ({ id, damage }))
      .filter(({ damage }) => damage >= this.totalDamage * 0.05).map(({ id }) => id);
    let best = 0, winner: string | undefined;
    for (const [id, damage] of this.pilots) if (damage > best) { best = damage; winner = id; }
    return winner === undefined ? [] : [winner];
  }
}
