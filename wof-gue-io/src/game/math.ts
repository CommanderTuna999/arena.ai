export const TAU = Math.PI * 2;

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function angDiff(a: number, b: number) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d < -Math.PI) d += TAU;
  return d;
}

export function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, y: number, s = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export function pointInPoly(x: number, y: number, p: number[]) {
  let inside = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function distSegSq(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + dx * t - px, cy = ay + dy * t - py;
  return cx * cx + cy * cy;
}

/** 0 if inside, otherwise the distance to the nearest edge */
export function distToPoly(x: number, y: number, p: number[]) {
  if (pointInPoly(x, y, p)) return 0;
  let best = Infinity;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const d = distSegSq(x, y, p[j], p[j + 1], p[i], p[i + 1]);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

export function polyArea(p: number[]) {
  let a = 0;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) a += p[j] * p[i + 1] - p[i] * p[j + 1];
  return Math.abs(a) / 2;
}

export function polyCentroid(p: number[]): [number, number] {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const f = p[j] * p[i + 1] - p[i] * p[j + 1];
    a += f;
    cx += (p[j] + p[i]) * f;
    cy += (p[j + 1] + p[i + 1]) * f;
  }
  if (Math.abs(a) < 1e-9) {
    let sx = 0, sy = 0;
    const n = p.length / 2;
    for (let i = 0; i < p.length; i += 2) { sx += p[i]; sy += p[i + 1]; }
    return [sx / n, sy / n];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export function fmtNum(n: number) {
  if (!isFinite(n)) return "∞";
  const abs = Math.abs(n);
  if (abs < 1000) return abs < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.round(n).toString();
  const u = ["K", "M", "B", "T", "Qa", "Qi"];
  let i = -1;
  let v = abs;
  while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
  return (n < 0 ? "-" : "") + (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + u[i];
}
