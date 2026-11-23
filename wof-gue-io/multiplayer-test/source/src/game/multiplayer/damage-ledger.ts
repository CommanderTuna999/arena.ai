/** Server-side accounting for one enemy. Only actual HP/armour removed should
 * be recorded, after mitigation and overkill caps; never accept amounts from a
 * client. Base/environment damage contributes to the total, not to a pilot.
 * Session IDs here must be replaced by stable authenticated account IDs before
 * rewards can survive reconnects. */
export type DamageLedgerSnapshot = {version:1; total:number; pilots:Array<{pilotId:string;damage:number}>};
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
  /** Server-only checkpoint fragment. It preserves contribution insertion
   * order, which is the deterministic tie-breaker for ordinary enemies. */
  snapshot():DamageLedgerSnapshot {const result:DamageLedgerSnapshot={version:1,total:this.totalDamage,pilots:this.contributions().map(x=>({...x}))};DamageLedger.fromSnapshot(result);return result;}
  static fromSnapshot(value:unknown):DamageLedger {
    if(!value || typeof value!=='object')throw Error('Invalid damage checkpoint');
    const v=value as DamageLedgerSnapshot;
    if(v.version!==1 || !Number.isFinite(v.total) || v.total<0 || !Array.isArray(v.pilots) || v.pilots.length>10000)throw Error('Invalid damage checkpoint');
    const ledger=new DamageLedger();let sum=0;
    for(const p of v.pilots){
      if(!p || typeof p.pilotId!=='string' || !p.pilotId || p.pilotId.length>128 || ledger.pilots.has(p.pilotId) || !Number.isFinite(p.damage) || p.damage<=0)throw Error('Invalid damage checkpoint');
      sum+=p.damage;if(!Number.isFinite(sum))throw Error('Invalid damage checkpoint');ledger.pilots.set(p.pilotId,p.damage);
    }
    // Allow only tiny floating point summation error from grouping pilot totals.
    if(sum>v.total+Math.max(1,v.total)*1e-12)throw Error('Invalid damage checkpoint');
    ledger.totalDamage=v.total;return ledger;
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
