import { db } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export async function GET(req: Request) {
  /* A signed-in player always reads their own row, whatever the query says. */
  const signed = await currentUser();
  const id = signed ? signed.id : new URL(req.url).searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) return Response.json({ ok: false, error: "bad id" }, { status: 400 });
  /* no database on this host: the client keeps its save locally */
  if (!db) return Response.json({ ok: true, save: null, db: false });
  try {
    const rows = await db.select().from(players).where(eq(players.id, id)).limit(1);
    if (!rows.length) return Response.json({ ok: true, save: null });
    return Response.json({ ok: true, save: rows[0].save });
  } catch {
    return Response.json({ ok: false, error: "db" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 400_000) return Response.json({ ok: false, error: "too large" }, { status: 413 });
    const body = JSON.parse(text) as { id?: string; name?: string; save?: { kills?: number } };
    const signed = await currentUser();
    const id = signed ? signed.id : body.id;
    if (!id || !ID_RE.test(id) || !body.save || typeof body.save !== "object") {
      return Response.json({ ok: false, error: "bad request" }, { status: 400 });
    }
    if (!db) return Response.json({ ok: true, stored: false, db: false });
    const name = String(signed?.name ?? body.name ?? "Pilot").slice(0, 16);
    const kills = Math.max(0, Math.floor(Number(body.save.kills) || 0));
    await db
      .insert(players)
      .values({ id, name, save: body.save, kills, updatedAt: new Date() })
      .onConflictDoUpdate({ target: players.id, set: { name, save: body.save, kills, updatedAt: new Date() } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "db" }, { status: 500 });
  }
}
