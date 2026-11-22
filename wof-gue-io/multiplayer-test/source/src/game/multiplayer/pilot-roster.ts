import { Game, type PilotPhaseContext } from '../engine';
import { newSave } from '../data';
import { InputBuffer } from './input';
import { applyPlayerInput } from './apply-input';

/** Experimental server-owned collection of pilot phases. This is NOT a complete
 * world server: enemy AI, projectiles, damage attribution, rewards, sessions,
 * snapshots and persistence still need multiplayer integration. It is not
 * exposed to production traffic. IDs and saved equipment must eventually come
 * from authenticated server sessions, never from untrusted input frames. */
export class PilotRoster {
  private readonly pilots = new Map<string, PilotPhaseContext>();
  private readonly inputs = new InputBuffer();
  constructor(private readonly world: Game, readonly capacity = 64) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 1024) throw new Error('Invalid pilot capacity');
  }
  get size() { return this.pilots.size; }
  add(id: string, verifiedName = 'Pilot'): boolean {
    if (!/^[A-Za-z0-9_.-]{1,32}$/.test(verifiedName) || !id || this.pilots.has(id) || this.pilots.size >= this.capacity) return false;
    // Test/default ship only. This does not accept a client-submitted save.
    const save = newSave(); save.name = verifiedName;
    const pilot = new Game(save, id);
    this.pilots.set(id, pilot.pilotPhaseContext());
    return true;
  }
  remove(id: string): boolean { this.inputs.remove(id); return this.pilots.delete(id); }
  receive(id: string, frame: unknown, nowMs: number): boolean {
    return this.pilots.has(id) && this.inputs.receive(id, frame, nowMs);
  }
  /** Internal diagnostic, never an acknowledgement that a frame was applied. */
  receivedSequence(id: string): number { return this.inputs.receivedSequence(id); }
  /** Read-only by convention; intended for the server's future snapshot code,
   * never serialize the save, inputs, or live references to clients. */
  get(id: string): PilotPhaseContext | undefined { return this.pilots.get(id); }
  /** Internal simulation contexts, not a network snapshot. */
  contexts(): readonly PilotPhaseContext[] { return [...this.pilots.values()]; }
  /** Fresh, deliberately minimal public state. No save data or live references
   * leave the simulation, and sequence lets clients reconcile their inputs. */
  snapshot() {
    return Array.from(this.pilots, ([id, pilot]) => ({
      id, name: pilot.save.name || 'Pilot', x: pilot.player.x, y: pilot.player.y,
      angle: pilot.player.a, hp: pilot.player.hp, shield: pilot.player.shield,
      dead: pilot.player.dead, inputSequence: this.inputs.sequence(id),
    }));
  }
  step(dt: number, nowMs: number) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05 || !Number.isFinite(nowMs)) throw new Error('Invalid pilot step');
    for (const [id, pilot] of this.pilots) {
      // World operates temporarily as this pilot so input-to-world aiming uses
      // that pilot's position and camera, then restores the prior context.
      const adapter = { player: pilot.player, cam: pilot.cam, input: pilot.input,
        w: this.world.w, h: this.world.h } as Game;
      const frame = this.inputs.get(id, nowMs);
      applyPlayerInput(adapter, frame);
      this.world.stepPilotPhase(pilot, dt);
      this.inputs.markApplied(id, frame.seq);
    }
  }
}
