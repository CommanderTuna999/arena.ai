export const dynamic = "force-dynamic";

interface Pilot {
  id: string;
  name: string;
  x: number;
  y: number;
  a: number;
  seen: number;
}

const g = globalThis as typeof globalThis & { __neonPilots?: Map<string, Pilot> };
const pilots = (g.__neonPilots ??= new Map<string, Pilot>());

const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const TTL = 6000;
const VIEW = 4200;

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { id?: string; name?: string; x?: number; y?: number; a?: number; dead?: boolean };
    if (!b.id || !ID_RE.test(b.id)) return Response.json({ players: [], online: 1 }, { status: 400 });
    const now = Date.now();
    const x = Number(b.x) || 0;
    const y = Number(b.y) || 0;
    if (b.dead) pilots.delete(b.id);
    else pilots.set(b.id, { id: b.id, name: String(b.name ?? "Pilot").slice(0, 16), x, y, a: Number(b.a) || 0, seen: now });
    for (const [k, p] of pilots) if (now - p.seen > TTL) pilots.delete(k);
    const players = [...pilots.values()]
      .filter((p) => p.id !== b.id && Math.hypot(p.x - x, p.y - y) < VIEW)
      .slice(0, 30)
      .map(({ id, name, x: px, y: py, a }) => ({ id, name, x: px, y: py, a }));
    return Response.json({ players, online: pilots.size + (b.dead ? 1 : 0) });
  } catch {
    return Response.json({ players: [], online: 1 }, { status: 400 });
  }
}
