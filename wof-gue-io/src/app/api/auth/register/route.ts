import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  ensureSchema, hashPassword, nameKey, newSalt, newUserId, startSession,
  validateName, validatePassword, type AuthUser,
} from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { name?: unknown; password?: unknown };
  } catch {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }
  const badName = validateName(body.name);
  if (badName) return Response.json({ ok: false, error: badName }, { status: 400 });
  const badPass = validatePassword(body.password);
  if (badPass) return Response.json({ ok: false, error: badPass }, { status: 400 });

  if (!(await ensureSchema()) || !db) return Response.json({ ok: false, error: "no-db" }, { status: 200 });

  const name = String(body.name).trim();
  const key = nameKey(name);
  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.nameKey, key)).limit(1);
    if (existing.length) return Response.json({ ok: false, error: "taken" }, { status: 409 });
    const salt = newSalt();
    const id = newUserId();
    await db.insert(users).values({ id, name, nameKey: key, salt, hash: hashPassword(String(body.password), salt) });
    const user: AuthUser = { id, name };
    await startSession(user);
    return Response.json({ ok: true, user });
  } catch {
    /* unique violation racing another registration, or the table is missing */
    return Response.json({ ok: false, error: "taken" }, { status: 409 });
  }
}
