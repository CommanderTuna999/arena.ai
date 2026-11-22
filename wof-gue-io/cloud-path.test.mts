/*
 * Runs the cloud account + save SQL against an in-memory Postgres (pg-mem).
 * This is the path that only comes alive once a real database is attached, so
 * it is worth proving before then.
 */
import { newDb } from "pg-mem";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

import * as store from "./src/server/auth-store";
import * as pass from "./src/server/passwords";

const mem = newDb();
const { Pool } = mem.adapters.createPg();
const raw = new Pool();

/* pg-mem refuses any query config that carries a `types.getTypeParser`, which
 * drizzle always attaches. Strip it: the harness compares plain values. */
const pool = new Proxy(raw, {
  get(target, prop, recv) {
    if (prop === "query") {
      return async (cfg: unknown, values?: unknown) => {
        if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
          return (target.query as (c: unknown, v?: unknown) => unknown)(cfg, values);
        }
        const rest = { ...(cfg as Record<string, unknown>) };
        const wantsArrays = rest.rowMode === "array";
        delete rest.types;
        delete rest.rowMode; /* pg-mem has no rowMode support */
        const res = (await (target.query as (c: unknown, v?: unknown) => Promise<{
          rows: Record<string, unknown>[];
          fields?: { name: string }[];
        }>)(rest, values));
        if (wantsArrays) {
          const names = res.fields && res.fields.length
            ? res.fields.map((f) => f.name)
            : Object.keys(res.rows[0] ?? {});
          res.rows = res.rows.map((r) => names.map((n) => r[n]));
        }
        return res;
      };
    }
    const v = Reflect.get(target, prop, recv);
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
  },
});

const db = drizzle(pool as unknown as ConstructorParameters<typeof drizzle>[0]);
const D = db as unknown as Parameters<typeof store.ensureTables>[0];

const assert = (c: boolean, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };

/* Note: pg-mem trips over a repeated `create table if not exists` (it flags the
 * skipped column nodes), so the tables are created once here. In production
 * ensureSchema() caches the result and runs this exactly once per process. */
await db.execute(sql`select 1`);
await store.ensureTables(D);
assert(true, "schema created");

const a = await store.createAccount(D, "Pilot", "hunter22");
assert(a.ok, "account created");
if (!a.ok) throw new Error("stop");
const id = a.user.id;

const dup = await store.createAccount(D, "pilot", "different1");
assert(!dup.ok && dup.error === "taken", "duplicate username rejected (case-insensitive)");
const shortPass = await store.createAccount(D, "Other", "123");
assert(!shortPass.ok && shortPass.error === "bad-pass", "short password rejected");
const badName = await store.createAccount(D, "no spaces here", "hunter22");
assert(!badName.ok && badName.error === "bad-name", "invalid username rejected");

const good = await store.verifyAccount(D, "PILOT", "hunter22");
assert(good.ok && good.user.id === id, "login works, case-insensitive");
const bad = await store.verifyAccount(D, "Pilot", "wrongpass");
assert(!bad.ok && bad.error === "bad-login", "wrong password rejected");
const ghost = await store.verifyAccount(D, "Nobody", "hunter22");
assert(!ghost.ok && ghost.error === "bad-login", "unknown account rejected");

assert((await store.loadSaveRow(D, id)) === null, "no save row before the first write");

const save = { credits: 1234, kills: 7, v: 2, bestiary: { mantis: 4 } };
await store.storeSaveRow(D, id, "Pilot", save, 7);
assert(JSON.stringify(await store.loadSaveRow(D, id)) === JSON.stringify(save), "save round-trips through jsonb");

await store.storeSaveRow(D, id, "Pilot", { credits: 9999, kills: 8 }, 8);
assert(((await store.loadSaveRow(D, id)) as { credits: number }).credits === 9999, "second write updates the row");

const h1 = pass.hashPassword("hunter22", pass.newSalt());
const h2 = pass.hashPassword("hunter22", pass.newSalt());
assert(h1 !== h2, "salt makes two identical passwords hash differently");
console.log("\ncloud path: all checks passed");
