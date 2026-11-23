import type { CombatHarness } from './combat-harness';
import {segmentDistance} from './demo-beams';
type Snapshot = ReturnType<CombatHarness['snapshot']>;

/** Server-side interest filtering for prototype snapshots. It includes entire
 * enemy bodies when their bounding circle overlaps the view; it never removes
 * parts from a visible enemy. The caller must select a conservative server-set
 * radius covering the largest allowed viewport. This is not production client
 * replication, which still needs geometry, smoothing, deltas and resync. */
export function interestSnapshot(snapshot: Snapshot, pilotId: string, radius: number): Snapshot | null {
  if (!Number.isFinite(radius) || radius <= 0 || radius > 100_000) throw new Error('Invalid interest radius');
  const observer=snapshot.pilots.find(p => p.id===pilotId);
  if (!observer) return null;
  const near=(x:number,y:number,extent=0)=>Math.hypot(x-observer.x,y-observer.y)<=radius+Math.max(0,extent);
  return {
    time:snapshot.time,
    pilots:snapshot.pilots.filter(p=>p.id===pilotId||near(p.x,p.y)),
    enemies:snapshot.enemies.filter(e=>near(e.x,e.y,e.radius)),
    beams:(snapshot.beams ?? []).filter(b=>segmentDistance(observer.x,observer.y,b)<=radius),
    bullets:snapshot.bullets.filter(b=>near(b.x,b.y)),
    enemyProjectiles:snapshot.enemyProjectiles.filter(p=>near(p.x,p.y,p.radius)),
    puddles:snapshot.puddles.filter(p=>near(p.x,p.y,p.radius)),
    rings:snapshot.rings.filter(r=>near(r.x,r.y,r.radius)),
  };
}
