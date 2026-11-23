import { DamageLedger, type DamageLedgerSnapshot } from './damage-ledger';

/** Server-internal reward planning, not a pickup or persistence implementation.
 * Part IDs are opportunities to run the existing drop rules, not guaranteed
 * drops. Record each eligible component when broken, including the core; keep
 * them private until the enemy is defeated and final damage totals are known.
 * The caller must roll each opportunity independently for each recipient and
 * persist awards atomically/idempotently before making them claimable. */
export type LootEntitlementsSnapshot = {version:2; ultra:boolean; damage:DamageLedgerSnapshot; parts:number[]; finished:Array<{pilotId:string;partIds:number[]}>|null; finalDamage:DamageLedgerSnapshot|null};
export class LootEntitlements {
  private readonly parts = new Set<number>();
  private finished: Array<{ pilotId: string; partIds: number[] }> | null = null;
  private finalDamage: DamageLedgerSnapshot | null = null;
  constructor(private readonly damage: DamageLedger, private readonly ultra: boolean) {}
  recordPart(partId: number): void {
    if (this.finished) throw new Error('Encounter already finished');
    if (!Number.isSafeInteger(partId) || partId < 0) throw new Error('Invalid part');
    this.parts.add(partId);
  }
  /** Mutable server-internal ledger, for rebuilding shared ownership after recovery. */
  ledger():DamageLedger {return this.damage;}
  /** Server-only checkpoint fragment; no rolls or inventory are included. */
  snapshot():LootEntitlementsSnapshot {
    const result:LootEntitlementsSnapshot={version:2,ultra:this.ultra,damage:this.damage.snapshot(),parts:[...this.parts],finished:this.finished?.map(p=>({pilotId:p.pilotId,partIds:[...p.partIds]})) ?? null,finalDamage:this.finalDamage ? DamageLedger.fromSnapshot(this.finalDamage).snapshot() : null};
    LootEntitlements.fromSnapshot(result);return result;
  }
  static fromSnapshot(value:unknown):LootEntitlements {
    if(!value || typeof value!=='object')throw Error('Invalid loot checkpoint');
    const v=value as LootEntitlementsSnapshot;
    if(v.version!==2 || typeof v.ultra!=='boolean' || !Array.isArray(v.parts) || v.parts.length>10000 || !(v.finished===null || Array.isArray(v.finished)))throw Error('Invalid loot checkpoint');
    const damage=DamageLedger.fromSnapshot(v.damage),loot=new LootEntitlements(damage,v.ultra);
    for(const part of v.parts){if(!Number.isSafeInteger(part)||part<0||loot.parts.has(part))throw Error('Invalid loot checkpoint');loot.parts.add(part);}
    if(v.finished===null && v.finalDamage!==null)throw Error('Invalid loot checkpoint');
    if(v.finished!==null){
      const frozen=DamageLedger.fromSnapshot(v.finalDamage);
      const previous=frozen.snapshot(), current=damage.snapshot();
      // Contributions can increase after finalization, but the earlier frozen
      // ledger must be a prefix of the same insertion-ordered ledger.
      if(previous.total>current.total || previous.pilots.length>current.pilots.length || previous.pilots.some((p,i)=>p.pilotId!==current.pilots[i].pilotId || p.damage>current.pilots[i].damage))throw Error('Invalid loot checkpoint');
      // Environmental damage cannot decrease to make room for extra pilot
      // damage. Permit only normal floating-point summation tolerance.
      const oldPilot=previous.pilots.reduce((sum,p)=>sum+p.damage,0);
      const newPilot=current.pilots.reduce((sum,p)=>sum+p.damage,0);
      if(!Number.isFinite(oldPilot)||!Number.isFinite(newPilot)||(newPilot-oldPilot)>(current.total-previous.total)+Math.max(1,current.total)*1e-12)throw Error('Invalid loot checkpoint');
      const expected=frozen.eligible(v.ultra);
      if(v.finished.length!==expected.length || Array.from(v.finished).some((p,i)=>p?.pilotId!==expected[i]))throw Error('Invalid loot checkpoint');
      loot.finalDamage=previous;
      if(v.finished.length>10000 || (!v.ultra && v.finished.length>1))throw Error('Invalid loot checkpoint');
      const pilots=new Set(damage.contributions().map(x=>x.pilotId)),seen=new Set<string>();
      loot.finished=Array.from(v.finished,p=>{
        if(!p || typeof p.pilotId!=='string' || !pilots.has(p.pilotId) || seen.has(p.pilotId) || !Array.isArray(p.partIds) || p.partIds.length!==v.parts.length || Array.from(p.partIds).some((id,i)=>id!==v.parts[i]))throw Error('Invalid loot checkpoint');
        seen.add(p.pilotId);return {pilotId:p.pilotId,partIds:[...p.partIds]};
      });
    }
    return loot;
  }
  /** Repeated reads return the same finalized eligibility, without exposing
   * mutable internal arrays. No RNG or inventory writes happen in this method. */
  finalize(): Array<{ pilotId: string; partIds: number[] }> {
    if (!this.finished) {
      const partIds = [...this.parts];
      this.finalDamage = this.damage.snapshot();
      this.finished = this.damage.eligible(this.ultra).map(pilotId => ({ pilotId, partIds: [...partIds] }));
    }
    return this.finished.map(({ pilotId, partIds }) => ({ pilotId, partIds: [...partIds] }));
  }
}
