import { db } from "@/db";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

/** Who am I, and can this host keep accounts in a database? */
export async function GET() {
  const user = await currentUser();
  return Response.json({ ok: true, db: Boolean(db), user });
}
