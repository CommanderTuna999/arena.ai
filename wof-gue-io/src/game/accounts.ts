/*
 * Player accounts, client side.
 *
 * The game prefers real accounts: when the host has a database, /api/auth/*
 * stores the username and a scrypt hash server-side and a signed cookie keeps
 * the session. Without a database (static export, a plain `next start`, the
 * hosted build with no Postgres attached) the exact same login form creates
 * accounts in this browser instead, hashed with PBKDF2 so the plaintext
 * password is never written anywhere. Everything below hides which of the two
 * is in play behind one small API.
 */

import type { SaveData } from "./data";

export type Session = { id: string; name: string; server: boolean };

export const GUEST_SAVE_KEY = "neon-hive-save-v1";
const SESSION_KEY = "wof.session.v1";
const ACCOUNTS_KEY = "wof.accounts.v1";
const PBKDF2_ROUNDS = 120_000;
const GUEST_TAG_KEY = "wof.guest.v1";

type LocalAccount = { id: string; name: string; salt: string; hash: string; rounds: number };

/* ------------------------------------------------------------- storage */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* private mode, ignore */ }
}

function accounts(): Record<string, LocalAccount> {
  return readJson<Record<string, LocalAccount>>(ACCOUNTS_KEY, {});
}

function keyOf(name: string) {
  return name.trim().toLowerCase();
}

/* --------------------------------------------------------------- guest */

/**
 * Guests never pick a name and never keep progress: each browser tab is handed
 * a stable throwaway tag (Guest100-Guest999) and the run lives in memory only.
 */
export function guestName(): string {
  const roll = () => String(100 + Math.floor(Math.random() * 900));
  try {
    const raw = sessionStorage.getItem(GUEST_TAG_KEY);
    if (raw && /^\d{3}$/.test(raw)) return `Guest${raw}`;
    const tag = roll();
    sessionStorage.setItem(GUEST_TAG_KEY, tag);
    return `Guest${tag}`;
  } catch {
    return `Guest${roll()}`;
  }
}

/* A guest's run is held here for the life of the page and is never written to
 * disk or to the server, so a reload starts the guest over. */
let guestSave: SaveData | null = null;

export function readGuestSave(): SaveData | null {
  return guestSave;
}

export function writeGuestSave(save: SaveData) {
  guestSave = save;
}

/* ------------------------------------------------------------- hashing */

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function pbkdf2(password: string, salt: string, rounds: number) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: rounds, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------- session */

export function readSession(): Session | null {
  const s = readJson<Session | null>(SESSION_KEY, null);
  if (!s || typeof s.id !== "string" || typeof s.name !== "string") return null;
  return { id: s.id, name: s.name, server: Boolean(s.server) };
}

function storeSession(s: Session | null) {
  if (s) writeJson(SESSION_KEY, s);
  else {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }
}

let cached: Session | null | undefined;

/** The session for this browser: local first, then the server cookie. */
export async function resolveSession(): Promise<Session | null> {
  if (cached !== undefined) return cached;
  const local = readSession();
  if (local && !local.server) { cached = local; return local; }
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (res.ok) {
      const j = (await res.json()) as { user?: { id: string; name: string } | null };
      if (j.user) {
        const s: Session = { id: j.user.id, name: j.user.name, server: true };
        storeSession(s);
        cached = s;
        return s;
      }
    }
  } catch { /* offline: fall through to whatever is local */ }
  if (local?.server) storeSession(null);
  cached = local && !local.server ? local : null;
  return cached;
}

/** Is this host keeping accounts in a database? */
export async function cloudAccounts(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return false;
    const j = (await res.json()) as { db?: boolean };
    return Boolean(j.db);
  } catch {
    return false;
  }
}

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  "bad-name": "3-16 characters, letters, numbers, _ . or - only.",
  "bad-pass": "Passwords need at least 6 characters.",
  taken: "That username is taken.",
  "bad-login": "Wrong username or password.",
  "no-db": "Accounts are not available here.",
  offline: "Could not reach the server.",
};

export function authMessage(code: string) {
  return MESSAGES[code] ?? "Something went wrong. Try again.";
}

/* --------------------------------------------------------- register/login */

export async function register(name: string, password: string): Promise<AuthResult> {
  const clean = name.trim();
  if (await cloudAccounts()) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: clean, password }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; user?: { id: string; name: string } };
      if (j.ok && j.user) {
        const s: Session = { id: j.user.id, name: j.user.name, server: true };
        storeSession(s);
        cached = s;
        return { ok: true, session: s };
      }
      if (j.error && j.error !== "no-db") return { ok: false, error: j.error };
    } catch {
      return { ok: false, error: "offline" };
    }
  }
  return registerLocal(clean, password);
}

export async function signIn(name: string, password: string): Promise<AuthResult> {
  const clean = name.trim();
  if (await cloudAccounts()) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: clean, password }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; user?: { id: string; name: string } };
      if (j.ok && j.user) {
        const s: Session = { id: j.user.id, name: j.user.name, server: true };
        storeSession(s);
        cached = s;
        return { ok: true, session: s };
      }
      if (j.error && j.error !== "no-db") return { ok: false, error: j.error };
    } catch {
      return { ok: false, error: "offline" };
    }
  }
  return loginLocal(clean, password);
}

async function registerLocal(name: string, password: string): Promise<AuthResult> {
  if (!/^[A-Za-z0-9_.-]{3,16}$/.test(name)) return { ok: false, error: "bad-name" };
  if (password.length < 6 || password.length > 128) return { ok: false, error: "bad-pass" };
  const all = accounts();
  const key = keyOf(name);
  if (all[key]) return { ok: false, error: "taken" };
  const salt = randomSalt();
  const hash = await pbkdf2(password, salt, PBKDF2_ROUNDS);
  const id = `usr_local_${key.replace(/[^a-z0-9]/g, "")}${randomSalt().slice(0, 6)}`;
  all[key] = { id, name, salt, hash, rounds: PBKDF2_ROUNDS };
  writeJson(ACCOUNTS_KEY, all);
  const s: Session = { id, name, server: false };
  storeSession(s);
  cached = s;
  return { ok: true, session: s };
}

async function loginLocal(name: string, password: string): Promise<AuthResult> {
  const acc = accounts()[keyOf(name)];
  if (!acc) return { ok: false, error: "bad-login" };
  const hash = await pbkdf2(password, acc.salt, acc.rounds || PBKDF2_ROUNDS);
  if (hash !== acc.hash) return { ok: false, error: "bad-login" };
  const s: Session = { id: acc.id, name: acc.name, server: false };
  storeSession(s);
  cached = s;
  return { ok: true, session: s };
}

export async function signOut() {
  const s = readSession();
  cached = null;
  storeSession(null);
  if (s?.server) {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
  }
}

/* ---------------------------------------------------------------- saves */

export function saveKeyFor(s: Session | null) {
  return s ? `${GUEST_SAVE_KEY}::${s.id}` : GUEST_SAVE_KEY;
}

/**
 * A brand new account starts from whatever the guest profile had, so signing up
 * never throws away progress made before the account existed.
 */
export function adoptGuestSave(s: Session) {
  try {
    const key = saveKeyFor(s);
    if (localStorage.getItem(key) !== null) return;
    const guest = localStorage.getItem(GUEST_SAVE_KEY);
    if (guest) localStorage.setItem(key, guest);
  } catch { /* ignore */ }
}
