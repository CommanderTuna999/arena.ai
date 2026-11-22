import assert from "node:assert/strict";
import { BASE, ZONE_EDGES, zoneAt, zoneTier } from "./src/game/data";
import { MAP_CELL, MAP_GRID, MAP_RADIUS, walkable } from "./src/game/world";
assert.equal(zoneAt(BASE.x, BASE.y), 0);
for (let i=0;i<ZONE_EDGES.length;i++) {
  assert.equal(zoneTier(ZONE_EDGES[i]-1), i);
  assert.equal(zoneTier(ZONE_EDGES[i]), i+1);
  assert.equal(zoneAt(BASE.x + ZONE_EDGES[i], BASE.y), i+1);
}
const bands = new Set<number>();
for (let y=0;y<MAP_GRID.length;y++) for (let x=0;x<MAP_GRID.length;x++) if (MAP_GRID[y][x] === "1") bands.add(zoneAt((x+.5)*MAP_CELL-MAP_RADIUS,(y+.5)*MAP_CELL-MAP_RADIUS));
assert.deepEqual([...bands].sort(), [0,1,2,3,4,5]);
assert(walkable(BASE.x,BASE.y));
assert(MAP_RADIUS > 48000);
console.log("expanded map rarity checks passed");
