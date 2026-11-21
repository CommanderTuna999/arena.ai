import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/db";

/*
 * Accounts.
 *
 * Passwords are stored as scrypt hashes with a per-user salt; the browser never
 * gets the hash back. A signed, http-only cookie carries the session.
 *
 * The database is optional on this host. When there is no Postgres the auth
 * routes answer `no-db` and the client falls back to accounts kept in the
 * browser (still salted + PBKDF2 hashed, just local to that device). Everything
 * upgrades to real cloud accounts the moment DATABASE_URL exists.
 */

export const SESSION_COOKIE = "wof_session";
const SESSION_DAYS = 30;
const MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
const SECRET = process.env.AUTH_SECRET || "wof-local-dev-secret-do-not-ship";

export type AuthUser = { id: string; name: string };

const NAME_RE = /^[A-Za-z0-9_.-]{3,16}$/;

export function nameKey(name: string) {
  return name.trim().toLowerCase();
}

export function validateName(name: unknown) {
  if (typeof name !== "string") return "bad-name";
  const n = name.trim();
  if (!NAME_RE.test(n)) return "bad-name";
  return null;
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string") return "bad-pass";
  if (password.length < 6 || password.length > 128) return "bad-pass";
  return null;
}

/* ---------------------------------------------------------------- schema */

let schemaOk: boolean | null = null;

export async function ensureSchema(): Promise<boolean> {
  if (!db) return false;
  if (schemaOk !== null) return schemaOk;
  try {
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
    schemaOk = true;
  } catch {
    schemaOk = false;
  }
  return schemaOk;
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function newSalt() {
  return randomBytes(16).toString("hex");
}

export function sameHash(a: string, b: string) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  if (x.length !== y.length || x.length === 0) return false;
  return timingSafeEqual(x, y);
}

export function newUserId() {
  return `usr_${randomUUID().replace(/-/g, "")}`;
}

/* --------------------------------------------------------------- session */

function sign(body: string) {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function issueToken(user: AuthUser) {
  const body = Buffer.from(
    JSON.stringify({ id: user.id, name: user.name, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | null | undefined): AuthUser | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      id?: string; name?: string; exp?: number;
    };
    if (!payload.id || !payload.name) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}

export async function currentUser(): Promise<AuthUser | null> {
  try {
    const jar = await cookies();
    return verifyToken(jar.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function startSession(user: AuthUser) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, issueToken(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function dbReady() {
  return Boolean(db);
}
