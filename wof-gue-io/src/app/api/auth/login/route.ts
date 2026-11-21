import { db } from "@/db";
import { ensureSchema, startSession, verifyAccount } from "@/server/auth";
import type { Db } from "@/server/auth-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { name?: unknown; password?: unknown };
  } catch {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }
  if (typeof body.name !== "string" || typeof body.password !== "string") {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }
  if (!(await ensureSchema()) || !db) return Response.json({ ok: false, error: "no-db" });

  try {
    const res = await verifyAccount(db as unknown as Db, body.name, body.password);
    if (!res.ok) return Response.json({ ok: false, error: res.error }, { status: 401 });
    await startSession(res.user);
    return Response.json({ ok: true, user: res.user });
  } catch {
    return Response.json({ ok: false, error: "db" }, { status: 500 });
  }
}
