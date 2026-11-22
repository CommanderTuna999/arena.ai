/** Disposable demo-only wire optimization. Enemy part polygons and links are
 * immutable after spawning. WebSocket messages are ordered, and each connection
 * starts with an empty cache. Invisible enemies are evicted on both ends. */
export type Geometry = Map<number, Map<number, { poly: number[]; links: number[] }>>;
export function packGeometry(world: any, previous: Geometry): { world: any; cache: Geometry } {
  const cache: Geometry = new Map();
  const enemies = world.enemies.map((enemy: any) => {
    const prior = previous.get(enemy.id), partsCache = new Map();
    const parts = enemy.parts.map((part: any) => {
      const stored = prior?.get(part.id);
      partsCache.set(part.id, stored ?? { poly: part.poly, links: part.links });
      if (!stored) return part;
      const { poly, links, ...dynamic } = part;
      return dynamic;
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
      if (Array.isArray(part.poly) && Array.isArray(part.links)) geometry = { poly: part.poly, links: part.links };
      else if (part.poly !== undefined || part.links !== undefined || !geometry) return null;
      partsCache.set(part.id, geometry);
      parts.push({ ...part, ...geometry });
    }
    cache.set(enemy.id, partsCache);
    enemies.push({ ...enemy, parts });
  }
  return { world: { ...world, enemies }, cache };
}
