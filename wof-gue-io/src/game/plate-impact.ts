/** Armor flash is local to the piece struck, not the entire shared layer. */
const hits=new WeakMap<object,number>();
export function recordPlateHit(part:object,time:number){if(Number.isFinite(time))hits.set(part,time);}
export function plateHitIntensity(part:object,time:number){const at=hits.get(part);return at===undefined?0:Math.max(0,1-(time-at)/.15);}
