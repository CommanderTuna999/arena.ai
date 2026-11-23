/** Shared visual sequencing for Revolutionary and Chairman targeting scans.
 * Snapshot the eligible IDs so animation timing never jumps as pieces break. */
export type TargetScan = {parts:number[]; elapsed:number; duration:number};
export function createTargetScan(parts:readonly {id:number;alive:boolean;kind:string}[]):TargetScan {
 const ids=parts.filter(p=>p.alive&&p.kind!=='core').map(p=>p.id);
 return {parts:ids,elapsed:0,duration:Math.max(.85,ids.length*.045)+.2};
}
export const scanFlashDuration = (scan:TargetScan) => Math.min(.2, scan.duration * .2);
export function scanPartIndex(scan:TargetScan):number {
 const sweep=scan.duration-scanFlashDuration(scan);
 if(!scan.parts.length||scan.elapsed>=sweep)return -1;
 return Math.min(scan.parts.length-1,Math.floor(Math.max(0,scan.elapsed)/sweep*scan.parts.length));
}
/** A brief red trail follows the currently scanned component. */
export function scanHighlight(scan:TargetScan,index:number):number {
 const active=scanPartIndex(scan);if(active<0)return 0;
 const delta=active-index;return delta<0||delta>3?0:[1,.65,.35,.15][delta];
}
