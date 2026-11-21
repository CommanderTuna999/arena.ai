import { db } from "@/db";
import { createAccount, ensureSchema, startSession, validateName, validatePassword } from "@/server/auth";
import type { Db } from "@/server/auth-store";

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

  if (!(await ensureSchema()) || !db) return Response.json({ ok: false, error: "no-db" });

  try {
    const res = await createAccount(db as unknown as Db, String(body.name), String(body.password));
    if (!res.ok) return Response.json({ ok: false, error: res.error }, { status: 409 });
    await startSession(res.user);
    return Response.json({ ok: true, user: res.user });
  } catch {
    return Response.json({ ok: false, error: "db" }, { status: 500 });
  }
}
