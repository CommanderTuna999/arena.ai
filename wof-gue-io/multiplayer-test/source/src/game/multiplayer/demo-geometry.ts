/** Disposable demo-only wire optimization. The part shape and visual metadata
 * are immutable after spawning; mutable health, animation and cooldown fields
 * are sent on every snapshot. WebSocket messages are ordered, and each connection
 * starts with an empty cache. Invisible enemies are evicted on both ends. */
export type Geometry = Map<number, Map<number, Record<string, any>>>;
export function packGeometry(world: any, previous: Geometry): { world: any; cache: Geometry } {
  const cache: Geometry = new Map();
  const enemies = world.enemies.map((enemy: any) => {
    const prior = previous.get(enemy.id), partsCache = new Map();
    const parts = enemy.parts.map((part: any) => {
      const stored = prior?.get(part.id);
      partsCache.set(part.id, stored ?? part);
      if (!stored) return part;
      const {id,hp,maxHp,alive,hurt,barT,muzzle,shieldHp,shieldDown,shieldHit,cd,beam} = part;
      return {id,hp,maxHp,alive,hurt,barT,muzzle,shieldHp,shieldDown,shieldHit,cd,beam};
    });
    cache.set(enemy.id, partsCache);
    return { ...enemy, parts };
  });
  return { world: { ...world, enemies }, cache };
}
export function unpackGeometry(world: any, previous: Geometry): { world: any; cache: Geometry } | null {
  if (!Array.isArray(world?.enemies)) return null;
  const cache: Geometry = new Map(), enemies = [];
  for (const enemy of world.enemies) {
    if (!enemy || !Number.isSafeInteger(enemy.id) || cache.has(enemy.id) || !Array.isArray(enemy.parts)) return null;
    const prior = previous.get(enemy.id), partsCache = new Map(), parts = [];
    for (const part of enemy.parts) {
      if (!part || !Number.isSafeInteger(part.id) || partsCache.has(part.id)) return null;
      let geometry = prior?.get(part.id);
      if (Array.isArray(part.poly) && Array.isArray(part.links)) geometry = part;
      else if (part.poly !== undefined || part.links !== undefined || !geometry) return null;
      partsCache.set(part.id, geometry);
      parts.push({ ...geometry, ...part });
    }
    cache.set(enemy.id, partsCache);
    enemies.push({ ...enemy, parts });
  }
  return { world: { ...world, enemies }, cache };
}
