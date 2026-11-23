import { Game } from '../engine';
import { SimulationClock } from './clock';
import { PilotRoster } from './pilot-roster';
import type { CombatHarness } from './combat-harness';

/** Experimental in-process room; optionally runs the incomplete combat
 * harness. This is deliberately NOT a production game server: complete world
 * logic, rewards, saves and authentication are not implemented.
 * A transport must authenticate players and allocate opaque session IDs before
 * calling join; clients must never be allowed to choose another session's ID. */
export class PilotRoom {
  readonly roster: PilotRoster;
  private readonly clock = new SimulationClock();
  private readonly limits = new Map<string, { start: number; count: number }>();
  constructor(world: Game, capacity = 64, readonly maxInputsPerSecond = 60, private readonly combat?: CombatHarness) {
    if (!Number.isSafeInteger(maxInputsPerSecond) || maxInputsPerSecond < 1 || maxInputsPerSecond > 1000) throw new Error('Invalid input rate');
    if (combat && (combat.world !== world || combat.roster.capacity !== capacity)) throw new Error('Mismatched combat room');
    this.roster = combat?.roster ?? new PilotRoster(world, capacity);
  }
  join(sessionId: string, verifiedName = 'Pilot'): boolean { return this.roster.add(sessionId, verifiedName); }
  leave(sessionId: string): boolean { this.limits.delete(sessionId); this.combat?.demoLoot.remove(sessionId); return this.roster.remove(sessionId); }
  input(sessionId: string, frame: unknown, nowMs: number): boolean {
    if (!Number.isFinite(nowMs) || !this.roster.get(sessionId)) return false;
    let limit = this.limits.get(sessionId);
    if (limit && nowMs < limit.start) return false;
    if (!limit || nowMs - limit.start >= 1000) {
      limit = { start: nowMs, count: 0 };
      this.limits.set(sessionId, limit);
    }
    // Count malformed frames as well; otherwise they can bypass the rate limit.
    if (++limit.count > this.maxInputsPerSecond) return false;
    return this.roster.receive(sessionId, frame, nowMs);
  }
  advance(nowMs: number): number {
    return this.clock.advance(nowMs, dt => this.combat ? this.combat.step(dt, nowMs) : this.roster.step(dt, nowMs));
  }
  demoLoot(sessionId:string) {return this.roster.get(sessionId) ? this.combat?.demoLoot.list(sessionId) ?? [] : []; }
  snapshot() { return this.roster.snapshot(); }
  /** Debug-only world view; does not contain enough data for the real client. */
  sharedSnapshot(interestRadius?: number) { return this.combat?.snapshot(interestRadius) ?? null; }
}
