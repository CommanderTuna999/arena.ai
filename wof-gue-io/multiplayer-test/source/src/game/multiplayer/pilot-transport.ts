import { PilotRoom } from './pilot-room';
import { interestSnapshot } from './interest';
import { packGeometry, type Geometry } from './demo-geometry';

/** Transport-neutral, EXPERIMENTAL pilot/combat-test protocol. A real server must
 * authenticate, bind an account to the connection, rate limit handshakes and
 * provide a durable shared world before exposing this to the Internet. Input
 * messages can never pick their own pilot ID. Optional combat is incomplete. */
export interface PilotPeer {
  readonly bufferedAmount: number;
  send(message: string): void;
  close(code: number, reason: string): void;
}
export class PilotTransport {
  private readonly peers = new Map<PilotPeer, string>();
  private snapshotSequence = 0;
  private readonly geometry = new Map<PilotPeer, Geometry>();
  private readonly peerRadii = new Map<PilotPeer, number>();
  private readonly congestedSince = new Map<PilotPeer, number>();
  private lastBroadcastMs = -Infinity;
  constructor(private readonly room: PilotRoom, private readonly maxBufferedBytes = 65536, private readonly interestRadius = 20_000, private readonly broadcastIntervalMs = 0, private readonly compactGeometry = false) {
    if (!Number.isFinite(broadcastIntervalMs) || broadcastIntervalMs < 0) throw new Error('Invalid broadcast interval');
    if (!Number.isSafeInteger(maxBufferedBytes) || maxBufferedBytes < 1 || !Number.isFinite(interestRadius) || interestRadius <= 0 || interestRadius > 100_000) throw new Error('Invalid transport limits');
  }
  attach(peer: PilotPeer, trustedSessionId: string, verifiedName = 'Pilot'): boolean {
    if (this.peers.has(peer) || !this.room.join(trustedSessionId, verifiedName)) return false;
    this.peers.set(peer, trustedSessionId);
    try { peer.send(JSON.stringify({ type: 'welcome', pilotId: trustedSessionId })); }
    catch { this.detach(peer); return false; }
    return true;
  }
  detach(peer: PilotPeer): void {
    const id = this.peers.get(peer);
    if (id === undefined) return;
    this.peers.delete(peer); this.congestedSince.delete(peer); this.geometry.delete(peer); this.peerRadii.delete(peer); this.room.leave(id);
  }
  /** Server-validated demo viewport only; cannot change identity or inputs. */
  setInterestRadius(peer: PilotPeer, radius: number): boolean {
    if (!this.peers.has(peer) || !Number.isFinite(radius) || radius < 1 || radius > 8000) return false;
    this.peerRadii.set(peer, radius); return true;
  }
  receive(peer: PilotPeer, text: string, nowMs: number): boolean {
    const id = this.peers.get(peer);
    if (id === undefined || typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > 1024) return false;
    let data: unknown;
    try { data = JSON.parse(text); } catch { return false; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const message = data as Record<string, unknown>;
    if (message.type !== 'input') return false;
    return this.room.input(id, message.frame, nowMs);
  }
  advance(nowMs: number): number {
    const steps = this.room.advance(nowMs);
    if (!steps || !this.peers.size || nowMs - this.lastBroadcastMs < this.broadcastIntervalMs) return steps;
    this.lastBroadcastMs = nowMs;
    const sharedRadius = Math.max(...Array.from(this.peers.keys(), p => this.peerRadii.get(p) ?? this.interestRadius));
    const shared = this.room.sharedSnapshot(sharedRadius);
    const sequence = this.snapshotSequence++;
    const pilotMessage = shared ? null : JSON.stringify({ type: 'pilot-snapshot', sequence, pilots: this.room.snapshot() });
    for (const [peer, pilotId] of this.peers) {
      try {
        // Snapshots supersede one another. Do not queue stale frames while a
        // network or compression backlog drains; disconnect only if it persists.
        if (peer.bufferedAmount > this.maxBufferedBytes) {
          const since = this.congestedSince.get(peer) ?? nowMs;
          this.congestedSince.set(peer, since);
          if (nowMs - since >= 15000) { peer.close(1013, 'Slow client'); this.detach(peer); }
          continue;
        }
        this.congestedSince.delete(peer);
        if (shared) {
          const view = interestSnapshot(shared, pilotId, this.peerRadii.get(peer) ?? this.interestRadius);
          if (!view) { peer.close(1011, 'Pilot missing'); this.detach(peer); }
          else if (this.compactGeometry) {
            const packed = packGeometry(view, this.geometry.get(peer) ?? new Map());
            peer.send(JSON.stringify({ type: 'world-snapshot', sequence, geometryCache: 1, world: packed.world }));
            this.geometry.set(peer, packed.cache);
          } else peer.send(JSON.stringify({ type: 'world-snapshot', sequence, world: view }));
        } else peer.send(pilotMessage!);
      } catch { this.detach(peer); try { peer.close(1011, 'Send failed'); } catch {} }
    }
    return steps;
  }
}
