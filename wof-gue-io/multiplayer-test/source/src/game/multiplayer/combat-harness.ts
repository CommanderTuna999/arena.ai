import { Game } from '../engine';
import { PilotRoster } from './pilot-roster';
import { PrivateLootVault } from './private-loot';
import type { RewardWriteQueue } from '../../server/multiplayer-reward-queue';

/** Partial, offline integration harness, NOT a production world loop.
 * It advances pilot movement, one nearest-target enemy phase, enemy shots and
 * owned player shots in a shared world. Optional population is experimental.
 * It does NOT simulate
 * base systems, many other area attacks, enemy separation, abilities, durable loot delivery,
 * persistence, reconnection or client replication. Never expose it as live
 * multiplayer until those systems are implemented and security reviewed. */
export class CombatHarness {
  readonly roster: PilotRoster;
  private readonly dropChances = new Map<string, number>();
  constructor(readonly world: Game, capacity = 64, private readonly populate = false, readonly privateLoot = new PrivateLootVault(), private readonly rewards?: RewardWriteQueue, private readonly discardRewards = false) {
    this.roster = new PilotRoster(world, capacity);
    if (!discardRewards) world.enableExperimentalDamageTracking();
  }
  step(dt: number, nowMs: number): void {
    if (!Number.isFinite(dt) || dt <= 0 || dt > .05 || !Number.isFinite(nowMs)) throw new Error('Invalid combat step');
    // In this disposable guest demo, freeze the world when nobody is present.
    // Production worlds may require persistent timers and must not use this shortcut.
    if (this.discardRewards && this.roster.size === 0) return;
    this.world.t += dt;
    if (!this.discardRewards) for (const pilot of this.roster.contexts()) this.dropChances.set(pilot.pid, pilot.stats.dropChance);
    this.roster.step(dt, nowMs);
    const pilots = this.roster.contexts();
    if (this.populate) this.world.stepExperimentalPopulation(pilots, dt);
    // Snapshot the list so summoned enemies start updating on the next tick.
    for (const enemy of [...this.world.enemies]) this.world.stepEnemyAgainstPilots(enemy, pilots, dt);
    this.world.stepEnemyProjectilesAgainstPilots(pilots, dt);
    this.world.stepOwnedBullets(dt);
    this.world.stepHazardsAgainstPilots(pilots, dt);
    // Settle once after all damage this tick, then discard dead enemy bodies.
    // In-memory only: crash recovery and durable accounts remain unimplemented.
    for (const enemy of this.world.enemies) if (enemy.dead && !this.discardRewards) {
      const plan = this.world.experimentalLootReport(enemy);
      if (plan) {
        this.privateLoot.settle(enemy, plan, id => this.dropChances.get(id));
        // Queue copies the exact already-rolled batch. A failed write retries the
        // same IDs and outcomes; never reroll on retry. Process crashes before a
        // commit still need a durable world journal and are NOT handled here.
        this.rewards?.enqueue(String(enemy.id), this.privateLoot.settlement(enemy)!);
      }
    }
    this.world.enemies = this.world.enemies.filter(e => !e.dead);
  }
  /** Experimental full geometry view. Not production replication: bandwidth,
   * combat coverage, reconciliation, privacy and durable saves remain open. */
  snapshot(interestRadius?: number) {
    const pilots = this.roster.snapshot();
    // Avoid constructing and copying geometry for enemies no connected pilot
    // could receive. Filtering individual views still happens in transport.
    const near = (x: number, y: number, extent = 0) => interestRadius === undefined ||
      pilots.some(p => Math.hypot(p.x - x, p.y - y) <= interestRadius + Math.max(0, extent));
    return {
      time: this.world.t,
      pilots,
      bullets: this.world.bullets.filter(b => near(b.x,b.y)).map(b => ({ x:b.x, y:b.y, vx:b.vx, vy:b.vy, kind:b.kind, elem:b.elem, crit:b.crit })),
      enemyProjectiles: this.world.eprojs.filter(p => near(p.x,p.y,p.r)).map(p => ({ x:p.x, y:p.y, vx:p.vx, vy:p.vy, type:p.type, radius:p.r, hue:p.hue, speed:p.speed, tether:p.tether, srcId:p.src?.id })),
      puddles: this.world.puddles.filter(p => near(p.x,p.y,p.r)).map(p => ({ x:p.x, y:p.y, radius:p.r, arm:p.arm, life:p.life, max:p.max, hue:p.hue, web:p.web })),
      rings: this.world.rings.filter(r => near(r.x,r.y,r.r)).map(r => ({ x:r.x, y:r.y, radius:r.r, max:r.max, color:r.color, hurts:r.hurts })),
      enemies: this.world.enemies.filter(e => !e.dead && near(e.x,e.y,e.radius)).map(e => ({
        id:e.id, species:e.spd.id, speciesName:e.spd.name, tier:e.tier, x:e.x, y:e.y, angle:e.a, radius:e.radius, size:e.S,
        walk:e.walk, bend:e.bend ? {...e.bend} : null, aggro:e.aggro, barT:e.barT, legPlate:e.legPlate,
        shellHit:e.shellHit, shellR:e.shellR, shellMaxTotal:e.shellMaxTotal, shells:e.shells.map(s=>({...s})),
        slowT:e.slowT, melt:e.melt, stun:e.stun, domainT:e.domainT, buffT:e.buffT, buffHp:e.buffHp, buffMax:e.buffMax,
        act:e.act ? {...e.act, def:{...e.act.def}} : null,
        groups:e.groups.map(g=>({...g})), order:[...e.order],
        parts:e.parts.map(p=>({...p,poly:[...p.poly],links:[...p.links]})),
        shields:e.shields.map(s=>({partId:s.part.id,cx:s.cx,cy:s.cy,ang:s.ang,r:s.r,span:s.span,bar:s.bar,thick:s.thick})),
      })),
    };
  }
}
