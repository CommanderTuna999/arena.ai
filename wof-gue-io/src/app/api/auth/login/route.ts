import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSchema, hashPassword, nameKey, sameHash, startSession, type AuthUser } from "@/server/auth";

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
  if (!(await ensureSchema()) || !db) return Response.json({ ok: false, error: "no-db" }, { status: 200 });

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.nameKey, nameKey(body.name)))
      .limit(1);
    const row = rows[0];
    if (!row) return Response.json({ ok: false, error: "bad-login" }, { status: 401 });
    if (!sameHash(hashPassword(body.password, row.salt), row.hash)) {
      return Response.json({ ok: false, error: "bad-login" }, { status: 401 });
    }
    const user: AuthUser = { id: row.id, name: row.name };
    await startSession(user);
    return Response.json({ ok: true, user });
  } catch {
    return Response.json({ ok: false, error: "db" }, { status: 500 });
  }
}
