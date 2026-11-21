import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/*
 * The database is optional. On a host without Postgres (Vercel previews, a
 * static export, a local play session) the API routes degrade to "no cloud
 * save" and the game keeps its progress in localStorage instead of throwing at
 * import time and taking the whole build down with it.
 */
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool: Pool | null = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({
      connectionString: databaseUrl,
      /* Serverless: many short-lived instances, so keep each one's pool small
       * and let idle clients go. A pooled Neon/Vercel connection string does the
       * real fan-in for us. */
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    }))
  : null;

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = pool ? drizzle(pool) : null;
