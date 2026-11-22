import { PilotTransport, type PilotPeer } from './pilot-transport';
import { TicketReplayGuard } from './ticket';

/** Prototype authentication gate for a single process. It binds a socket to
 * the signed account ID before passing any input to PilotTransport. This is not
 * a complete public server: enforce TLS, origin checks, connection/handshake
 * limits, authenticated saves, and a shared atomic replay store first. Never
 * log tickets or put them in URLs. */
export class AuthenticatedPilotTransport {
  private readonly pending = new Map<PilotPeer, number>();
  private readonly active = new Set<PilotPeer>();
  constructor(private readonly transport: PilotTransport, private readonly tickets: TicketReplayGuard,
    private readonly handshakeTimeoutMs = 10_000, private readonly maxPending = 200) {
    if (!Number.isSafeInteger(handshakeTimeoutMs) || handshakeTimeoutMs < 1 ||
      !Number.isSafeInteger(maxPending) || maxPending < 1) throw new Error('Invalid handshake limits');
  }
  attach(peer: PilotPeer, nowMs: number): boolean {
    if (!Number.isSafeInteger(nowMs) || this.pending.has(peer) || this.active.has(peer) || this.pending.size >= this.maxPending) return false;
    this.pending.set(peer, nowMs + this.handshakeTimeoutMs); return true;
  }
  receive(peer: PilotPeer, text: string, nowMs: number): boolean {
    if (!Number.isSafeInteger(nowMs) || typeof text !== 'string' || Buffer.byteLength(text,'utf8') > 1024) return false;
    if (this.active.has(peer)) return this.transport.receive(peer,text,nowMs);
    const deadline = this.pending.get(peer);
    if (deadline === undefined) return false;
    if (nowMs >= deadline) { this.reject(peer, 'Authentication timed out'); return false; }
    let request: unknown;
    try { request = JSON.parse(text); } catch { this.reject(peer,'Invalid authentication'); return false; }
    if (!request || typeof request !== 'object' || Array.isArray(request) || (request as Record<string,unknown>).type !== 'authenticate') {
      this.reject(peer,'Authentication required'); return false;
    }
    const user = this.tickets.consume((request as Record<string,unknown>).ticket,nowMs);
    if (!user || !this.transport.attach(peer,user.id,user.name)) { this.reject(peer,'Authentication failed'); return false; }
    this.pending.delete(peer); this.active.add(peer); return true;
  }
  detach(peer: PilotPeer): void { this.pending.delete(peer); if (this.active.delete(peer)) this.transport.detach(peer); }
  expire(nowMs: number): void {
    if (!Number.isSafeInteger(nowMs)) throw new Error('Invalid time');
    for (const [peer, deadline] of this.pending) if (nowMs >= deadline) this.reject(peer,'Authentication timed out');
  }
  private reject(peer: PilotPeer, reason: string): void {
    this.detach(peer); try { peer.close(1008,reason); } catch {}
  }
}
