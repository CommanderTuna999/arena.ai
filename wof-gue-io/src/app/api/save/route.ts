import { db } from "@/db";
import { currentUser, ensureSchema, loadSaveRow, storeSaveRow } from "@/server/auth";
import type { Db } from "@/server/auth-store";

export const dynamic = "force-dynamic";

const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

/** A signed-in player only ever reads and writes their own row. */
export async function GET(req: Request) {
  const signed = await currentUser();
  const id = signed ? signed.id : new URL(req.url).searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) return Response.json({ ok: false, error: "bad id" }, { status: 400 });
  /* no database on this host: the client keeps its save locally */
  if (!(await ensureSchema()) || !db) return Response.json({ ok: true, save: null, db: false });
  try {
    const save = await loadSaveRow(db as unknown as Db, id);
    return Response.json({ ok: true, save });
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
    if (!(await ensureSchema()) || !db) return Response.json({ ok: true, stored: false, db: false });
    const name = String(signed?.name ?? body.name ?? "Pilot").slice(0, 16);
    const kills = Math.max(0, Math.floor(Number(body.save.kills) || 0));
    await storeSaveRow(db as unknown as Db, id, name, body.save as unknown as Record<string, unknown>, kills);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "db" }, { status: 500 });
  }
}
