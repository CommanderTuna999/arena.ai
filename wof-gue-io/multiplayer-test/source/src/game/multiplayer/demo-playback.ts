/** Monotonic interpolation clock for the disposable demo. A late snapshot
 * must not rewind the camera or animation when network delivery is jittery. */
export class DemoPlayback {
  private newest = -Infinity;
  private receivedAt = 0;
  private rendered: number | null = null;
  private lastFrame = 0;
  constructor(private readonly delay = .18) {}
  sample(latest: number, nowMs: number): number {
    if (!Number.isFinite(latest) || !Number.isFinite(nowMs)) throw Error('Invalid playback time');
    if (latest > this.newest) { this.newest = latest; this.receivedAt = nowMs; }
    const desired = Math.min(this.newest, this.newest - this.delay + Math.max(0, nowMs - this.receivedAt) / 1000);
    if (this.rendered === null) this.rendered = desired;
    else {
      // Catch up gently after a hitch; never extrapolate or move backwards.
      const elapsed = Math.max(0, (nowMs - this.lastFrame) / 1000);
      this.rendered = Math.min(this.newest, Math.max(this.rendered, Math.min(desired, this.rendered + elapsed * 1.25)));
    }
    this.lastFrame = nowMs;
    return this.rendered;
  }
}
