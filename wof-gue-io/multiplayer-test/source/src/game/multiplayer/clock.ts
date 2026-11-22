/** Fixed-step clock for the future server simulation. On overload we discard
 * excess elapsed time rather than simulate an unbounded backlog or pass a
 * giant dt to combat. This clock is not wired into the live game. */
export class SimulationClock {
  private accumulator = 0;
  private last: number | null = null;
  constructor(readonly stepSeconds = 1 / 30, readonly maxSteps = 5) {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0 || !Number.isSafeInteger(maxSteps) || maxSteps < 1) throw new Error('Invalid clock configuration');
  }
  advance(nowMs: number, tick: (dt: number) => void): number {
    if (!Number.isFinite(nowMs)) throw new Error('Invalid time');
    if (this.last === null) { this.last = nowMs; return 0; }
    if (nowMs < this.last) return 0;
    this.accumulator += Math.min((nowMs - this.last) / 1000, this.stepSeconds * this.maxSteps);
    this.last = nowMs;
    let steps = 0;
    while (this.accumulator + 1e-10 >= this.stepSeconds && steps < this.maxSteps) {
      this.accumulator -= this.stepSeconds;
      tick(this.stepSeconds); steps++;
    }
    if (steps === this.maxSteps) this.accumulator = Math.min(this.accumulator, this.stepSeconds);
    return steps;
  }
}
