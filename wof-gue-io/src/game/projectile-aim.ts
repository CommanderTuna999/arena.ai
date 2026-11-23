/** Aim a constant-speed projectile at a constant-velocity target. If no
 * positive intercept exists, aim at the current position rather than away. */
export function interceptAngle(x: number, y: number, tx: number, ty: number, vx: number, vy: number, speed: number): number {
  const dx = tx - x, dy = ty - y;
  const a = vx * vx + vy * vy - speed * speed;
  const b = 2 * (dx * vx + dy * vy), c = dx * dx + dy * dy;
  let t = 0;
  if (Math.abs(a) < 1e-9) {
    if (b < 0) t = -c / b;
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const root = Math.sqrt(disc);
      const t1 = (-b - root) / (2 * a), t2 = (-b + root) / (2 * a);
      const valid = [t1, t2].filter(v => v >= 0 && Number.isFinite(v));
      if (valid.length) t = Math.min(...valid);
    }
  }
  return Math.atan2(dy + vy * t, dx + vx * t);
}
