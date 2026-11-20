import type { NextConfig } from "next";
import { VERSION } from "./src/game/changelog";

/* STATIC_EXPORT=1 produces a fully static build in `out/` (see scripts/export-static.sh).
 * The API route handlers are moved aside for that build, so the page degrades to
 * localStorage saves + save codes instead of server profiles. */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // allow the sandbox preview proxy (and local host) to load dev assets
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
  ...(staticExport
    ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } }
    : {
        /* A build id tied to the release means a rebuilt preview cannot reuse a
         * previous page's client chunks. Production chunk names are already
         * content-hashed; this also invalidates the document itself. */
        generateBuildId: async () => `wof-${VERSION}`,
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
                { key: "X-Wof-Version", value: VERSION },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
