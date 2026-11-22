import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

type TicketUser = { id: string; name: string };
type Payload = TicketUser & { aud: string; iat: number; exp: number; nonce: string };
const MAX_TTL = 60_000, SKEW = 5000;
const validUser = (v: TicketUser) => typeof v.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v.id)
  && typeof v.name === 'string' && /^[A-Za-z0-9_.-]{1,32}$/.test(v.name);

/** Server-only short-lived handoff ticket, separate from the site's session
 * cookie. The issuer must first authenticate the account; the game service must
 * accept tickets only over TLS and only as a first message, never in URLs/logs.
 * This primitive is not connected to production. A shared atomic replay store
 * is required when running more than one server process. */
export class TicketAuthority {
  private readonly key: Buffer;
  constructor(secret: string, readonly audience: string) {
    this.key = Buffer.from(secret, 'utf8');
    if (this.key.length < 32 || !/^[A-Za-z0-9_-]{1,80}$/.test(audience)) throw new Error('Invalid ticket configuration');
  }
  private mac(body: string): Buffer { return createHmac('sha256', this.key).update(`wof-multiplayer-v1.${body}`).digest(); }
  issue(user: TicketUser, nowMs: number, ttlMs = 30_000): string {
    if (!validUser(user) || !Number.isSafeInteger(nowMs) || !Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > MAX_TTL || !Number.isSafeInteger(nowMs + ttlMs)) throw new Error('Invalid ticket request');
    const payload: Payload = { id:user.id, name:user.name, aud:this.audience, iat:nowMs, exp:nowMs+ttlMs, nonce:randomBytes(16).toString('base64url') };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${this.mac(body).toString('base64url')}`;
  }
  verify(token: unknown, nowMs: number): Payload | null {
    if (typeof token !== 'string' || token.length > 1024 || !Number.isSafeInteger(nowMs)) return null;
    const pieces = token.split('.');
    if (pieces.length !== 2 || !pieces.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return null;
    const [body, macText] = pieces;
    const mac = Buffer.from(macText,'base64url');
    // Require a canonical encoding, then constant-time compare fixed lengths.
    if (mac.toString('base64url') !== macText || mac.length !== 32 || !timingSafeEqual(mac,this.mac(body))) return null;
    try {
      const decoded = Buffer.from(body,'base64url');
      if (decoded.toString('base64url') !== body) return null;
      const p = JSON.parse(decoded.toString('utf8')) as Payload;
      if (!p || !validUser(p) || p.aud !== this.audience || !Number.isSafeInteger(p.iat) || !Number.isSafeInteger(p.exp)
        || p.exp <= p.iat || p.exp-p.iat > MAX_TTL || p.iat > nowMs+SKEW || nowMs >= p.exp
        || typeof p.nonce !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(p.nonce)) return null;
      return p;
    } catch { return null; }
  }
}

/** In-process only; never rely on this for cross-instance replay protection. */
export class TicketReplayGuard {
  private readonly used = new Map<string, number>();
  constructor(private readonly authority: TicketAuthority, private readonly limit = 10_000) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Invalid replay limit');
  }
  consume(token: unknown, nowMs: number): TicketUser | null {
    const payload = this.authority.verify(token,nowMs);
    if (!payload) return null;
    for (const [nonce, expiry] of this.used) if (expiry <= nowMs) this.used.delete(nonce);
    if (this.used.has(payload.nonce) || this.used.size >= this.limit) return null;
    this.used.set(payload.nonce,payload.exp);
    return { id:payload.id, name:payload.name };
  }
}
