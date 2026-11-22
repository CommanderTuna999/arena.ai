/** Untrusted input for the future server-owned world. This is deliberately not
 * a game state update: positions, health, damage and rewards never come from a
 * client frame. The module is not connected to the production game yet. */
export interface PlayerInput {
  seq: number;
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  boost: boolean;
  aim: number;
}
export const NEUTRAL_INPUT: Readonly<PlayerInput> = Object.freeze({ seq: -1, forward: false, backward: false, left: false, right: false, fire: false, boost: false, aim: 0 });

/** Only accept monotonically newer, bounded frames. Ignore extra properties;
 * they are never copied into simulation state. */
export function parseInput(value: unknown, lastSequence: number): PlayerInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.seq !== 'number' || !Number.isSafeInteger(v.seq) || v.seq < 0 || v.seq <= lastSequence) return null;
  if (typeof v.aim !== 'number' || !Number.isFinite(v.aim) || Math.abs(v.aim) > Math.PI * 2) return null;
  for (const key of ['forward', 'backward', 'left', 'right', 'fire', 'boost'] as const) if (typeof v[key] !== 'boolean') return null;
  return { seq: v.seq, aim: v.aim, forward: v.forward as boolean, backward: v.backward as boolean, left: v.left as boolean, right: v.right as boolean, fire: v.fire as boolean, boost: v.boost as boolean };
}

/** Track each connection independently. Inputs expire to neutral on connection
 * stalls, preventing ships from moving or firing forever after a disconnect. */
export class InputBuffer {
  private entries = new Map<string, { input: PlayerInput; receivedAt: number }>();
  private applied = new Map<string, number>();
  receive(id: string, frame: unknown, now: number): boolean {
    if (!Number.isFinite(now)) return false;
    const previous = this.entries.get(id);
    if (previous && now < previous.receivedAt) return false;
    const input = parseInput(frame, previous?.input.seq ?? -1);
    if (!input) return false;
    this.entries.set(id, { input, receivedAt: now });
    return true;
  }
  get(id: string, now: number, timeoutMs = 1000): Readonly<PlayerInput> {
    const entry = this.entries.get(id);
    return entry && now >= entry.receivedAt && now - entry.receivedAt <= timeoutMs ? entry.input : NEUTRAL_INPUT;
  }
  /** Last applied sequence, not merely received: suitable for reconciliation. */
  sequence(id: string): number { return this.applied.get(id) ?? -1; }
  receivedSequence(id: string): number { return this.entries.get(id)?.input.seq ?? -1; }
  markApplied(id: string, seq: number): void {
    if (seq >= 0 && seq <= this.receivedSequence(id) && seq > this.sequence(id)) this.applied.set(id, seq);
  }
  remove(id: string) { this.entries.delete(id); this.applied.delete(id); }
}
