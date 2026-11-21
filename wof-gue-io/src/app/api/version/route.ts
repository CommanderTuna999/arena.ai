import { VERSION } from "@/game/changelog";

/* The stale-preview watchdog polls this: it is always dynamic and never cached,
 * so a page running an old client bundle can notice the server has moved on. */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { version: VERSION },
    { headers: { "cache-control": "no-store, max-age=0, must-revalidate" } },
  );
}
