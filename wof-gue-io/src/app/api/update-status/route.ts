import { VERSION } from "@/game/changelog";

export const dynamic = "force-dynamic";

/*
 * "Is a new build on its way?" - the one thing a running deployment cannot know
 * on its own. The repo's HEAD is compared with the commit this build was made
 * from, so the moment a change is pushed the live site can put up a standby
 * screen instead of quietly serving yesterday's code.
 *
 * Everything is best effort: no Vercel git metadata (local dev, static export)
 * or an unreachable GitHub simply means "nothing to report".
 */

const OWNER = process.env.VERCEL_GIT_REPO_OWNER;
const REPO = process.env.VERCEL_GIT_REPO_SLUG;
const BRANCH = process.env.VERCEL_GIT_COMMIT_REF;
const SHA = process.env.VERCEL_GIT_COMMIT_SHA;
const CACHE_MS = 45_000;

let cache: { at: number; head: string | null } = { at: 0, head: null };

async function headSha(): Promise<string | null> {
  if (Date.now() - cache.at < CACHE_MS) return cache.head;
  let head: string | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/commits/${BRANCH}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "wofgue-update-check" },
      cache: "no-store",
    });
    if (res.ok) {
      const j = (await res.json()) as { sha?: string };
      head = typeof j.sha === "string" ? j.sha : null;
    }
  } catch { /* offline or rate limited: report nothing */ }
  cache = { at: Date.now(), head };
  return head;
}

export async function GET() {
  const base = { version: VERSION, sha: SHA ?? null, branch: BRANCH ?? null };
  if (!OWNER || !REPO || !SHA) {
    return Response.json({ ok: true, tracking: false, updating: false, ...base }, { headers: { "cache-control": "no-store" } });
  }
  const head = await headSha();
  return Response.json(
    { ok: true, tracking: true, updating: Boolean(head && head !== SHA), head, ...base },
    { headers: { "cache-control": "no-store, max-age=0, must-revalidate" } },
  );
}
