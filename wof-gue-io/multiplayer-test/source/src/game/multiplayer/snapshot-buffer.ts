/** Experimental client-side interpolation for authoritative prototype views.
 * It never predicts combat, changes the server state, or extrapolates beyond
 * received samples. Rendering and reconnection are not integrated yet. */
export type RenderBody = { id: string | number; x: number; y: number; angle: number };
export type RenderSnapshot<T extends RenderBody> = { sequence: number; time: number; bodies: T[] };
const angleBetween = (a: number, b: number, t: number) => a + Math.atan2(Math.sin(b-a), Math.cos(b-a)) * t;
export class SnapshotBuffer<T extends RenderBody> {
  private frames: RenderSnapshot<T>[] = [];
  constructor(readonly capacity = 32) {
    if (!Number.isSafeInteger(capacity) || capacity < 2 || capacity > 512) throw new Error('Invalid snapshot capacity');
  }
  clear(): void { this.frames = []; }
  push(frame: RenderSnapshot<T>): boolean {
    if (!frame || !Number.isSafeInteger(frame.sequence) || frame.sequence < 0 || !Number.isFinite(frame.time) || frame.time < 0 || !Array.isArray(frame.bodies)) return false;
    const last=this.frames.at(-1);
    if (last && (frame.sequence <= last.sequence || frame.time <= last.time)) return false;
    const seen=new Set<string|number>();
    for (const body of frame.bodies) {
      if (!body || !((typeof body.id==='string' && body.id.length>0) || (typeof body.id==='number' && Number.isSafeInteger(body.id))) || seen.has(body.id) || !Number.isFinite(body.x) || !Number.isFinite(body.y) || !Number.isFinite(body.angle)) return false;
      seen.add(body.id);
    }
    // Copy the frame so caller mutations cannot change past geometry.
    this.frames.push(structuredClone(frame));
    if (this.frames.length>this.capacity) this.frames.shift();
    return true;
  }
  sample(time: number): T[] {
    if (!Number.isFinite(time)) throw new Error('Invalid sample time');
    if (!this.frames.length) return [];
    let before=this.frames[0], after=this.frames.at(-1)!;
    if (time<=before.time) return structuredClone(before.bodies);
    if (time>=after.time) return structuredClone(after.bodies);
    for (let i=1;i<this.frames.length;i++) if (this.frames[i].time>=time) {before=this.frames[i-1];after=this.frames[i];break;}
    const t=(time-before.time)/(after.time-before.time), prior=new Map(before.bodies.map(b=>[b.id,b]));
    // Use latest authoritative membership and other fields; only positions and
    // rotation interpolate. Discrete health/parts never invent fractional state.
    return structuredClone(after.bodies.map(body=>{
      const old=prior.get(body.id);if (!old) return body;
      return {...body,x:old.x+(body.x-old.x)*t,y:old.y+(body.y-old.y)*t,angle:angleBetween(old.angle,body.angle,t)};
    }));
  }
}
