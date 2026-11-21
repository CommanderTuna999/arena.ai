import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { ensureTables, type Db } from "@/server/auth-store";

/*
 * Server-side accounts.
 *
 * Passwords are salted scrypt hashes (see passwords.ts) and a signed, http-only
 * cookie carries the session. The database is optional: without DATABASE_URL
 * the auth routes answer `no-db` and the client falls back to accounts kept in
 * the browser. Attaching any Postgres upgrades every account and save to the
 * cloud with no code change — the tables are created on first use.
 */

export {
  createAccount, ensureTables, loadSaveRow, storeSaveRow, verifyAccount,
  type AccountResult, type AuthUser, type Db,
} from "@/server/auth-store";

export {
  hashPassword, nameKey, newSalt, newUserId, sameHash,
  validateName, validatePassword,
} from "@/server/passwords";

export const SESSION_COOKIE = "wof_session";
const SESSION_DAYS = 30;
const MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
const SECRET = process.env.AUTH_SECRET || "wof-local-dev-secret-do-not-ship";

export type User = { id: string; name: string };

/* --------------------------------------------------------------- schema */

let schemaOk: boolean | null = null;

export async function ensureSchema(): Promise<boolean> {
  if (!db) return false;
  if (schemaOk !== null) return schemaOk;
  try {
    await ensureTables(db as unknown as Db);
    schemaOk = true;
  } catch {
    schemaOk = false;
  }
  return schemaOk;
}

/* --------------------------------------------------------------- session */

function sign(body: string) {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function issueToken(user: User) {
  const body = Buffer.from(
    JSON.stringify({ id: user.id, name: user.name, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | null | undefined): User | null {
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

export async function currentUser(): Promise<User | null> {
  try {
    const jar = await cookies();
    return verifyToken(jar.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function startSession(user: User) {
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
