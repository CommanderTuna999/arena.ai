import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

/*
 * Password plumbing. Nothing here touches the database or a request, so it can
 * be exercised on its own.
 */

const NAME_RE = /^[A-Za-z0-9_.-]{3,16}$/;

export const MIN_PASS = 6;
export const MAX_PASS = 128;

export function nameKey(name: string) {
  return name.trim().toLowerCase();
}

export function validateName(name: unknown) {
  if (typeof name !== "string") return "bad-name";
  if (!NAME_RE.test(name.trim())) return "bad-name";
  return null;
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string") return "bad-pass";
  if (password.length < MIN_PASS || password.length > MAX_PASS) return "bad-pass";
  return null;
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
