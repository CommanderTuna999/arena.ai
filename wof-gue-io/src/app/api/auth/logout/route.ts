import { endSession } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await endSession();
  return Response.json({ ok: true });
}
