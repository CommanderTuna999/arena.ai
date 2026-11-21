import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { players, users } from "@/db/schema";
import {
  hashPassword, nameKey, newSalt, newUserId, sameHash,
  validateName, validatePassword,
} from "@/server/passwords";

/*
 * Account and save rows, written against whatever Postgres the caller hands in.
 * Keeping the SQL here (instead of inside the route handlers) means the cloud
 * path can be run against an in-memory Postgres in a test harness, which is the
 * only way to know it works before a real database exists.
 */

export type Db = NodePgDatabase<Record<string, never>>;
export type AuthUser = { id: string; name: string };
export type AccountResult = { ok: true; user: AuthUser } | { ok: false; error: string };

/** Idempotent: a brand new database needs no migration step. */
export async function ensureTables(db: Db) {
  await db.execute(sql`
    create table if not exists users (
      id text primary key,
      name text not null,
      name_key text not null unique,
      salt text not null,
      hash text not null,
      created_at timestamptz not null default now()
    )
  `);
  await db.execute(sql`
    create table if not exists players (
      id text primary key,
      name text not null default 'Pilot',
      save jsonb not null,
      kills integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `);
}

export async function createAccount(db: Db, name: string, password: string): Promise<AccountResult> {
  const badName = validateName(name);
  if (badName) return { ok: false, error: badName };
  const badPass = validatePassword(password);
  if (badPass) return { ok: false, error: badPass };

  const clean = name.trim();
  const key = nameKey(clean);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.nameKey, key)).limit(1);
  if (existing.length) return { ok: false, error: "taken" };

  const salt = newSalt();
  const id = newUserId();
  try {
    await db.insert(users).values({ id, name: clean, nameKey: key, salt, hash: hashPassword(password, salt) });
  } catch {
    /* unique violation from a registration that raced this one */
    return { ok: false, error: "taken" };
  }
  return { ok: true, user: { id, name: clean } };
}

export async function verifyAccount(db: Db, name: string, password: string): Promise<AccountResult> {
  if (typeof name !== "string" || typeof password !== "string") return { ok: false, error: "bad-login" };
  const rows = await db.select().from(users).where(eq(users.nameKey, nameKey(name))).limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "bad-login" };
  if (!sameHash(hashPassword(password, row.salt), row.hash)) return { ok: false, error: "bad-login" };
  return { ok: true, user: { id: row.id, name: row.name } };
}

export async function loadSaveRow(db: Db, id: string) {
  const rows = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return rows.length ? rows[0].save : null;
}

export async function storeSaveRow(
  db: Db,
  id: string,
  name: string,
  save: Record<string, unknown>,
  kills: number,
) {
  await db
    .insert(players)
    .values({ id, name, save, kills, updatedAt: new Date() })
    .onConflictDoUpdate({ target: players.id, set: { name, save, kills, updatedAt: new Date() } });
}
