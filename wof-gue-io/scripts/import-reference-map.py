#!/usr/bin/env python3
"""Convert the supplied map's light passages into the game's walkable grid."""
from pathlib import Path
from collections import deque
from PIL import Image
root=Path(__file__).resolve().parents[1]
n=160
im=Image.open(root/'assets/reference-map.png').convert('L').resize((n,n),Image.Resampling.LANCZOS)
grid=[[im.getpixel((x,y))>=128 and 0<x<n-1 and 0<y<n-1 for x in range(n)] for y in range(n)]
# Keep the component containing the starting room; tiny isolated decorative loops
# in the source are walls, not unreachable pockets.
start=(27,19); assert grid[start[1]][start[0]]
seen={start}; q=deque([start])
while q:
 x,y=q.popleft()
 for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
  if 0<=nx<n and 0<=ny<n and grid[ny][nx] and (nx,ny) not in seen: seen.add((nx,ny));q.append((nx,ny))
rows=[''.join('1' if (x,y) in seen else '0' for x in range(n)) for y in range(n)]
p=root/'src/game/world.ts';old=p.read_text();tail=old[old.index('export const MAP_CELL'):]
# Mark the large lower-right room, not the surrounding maze corridors.
allowed=lambda x,y: (y >= 116 and x >= 85) or (y >= 100 and x >= 100)
ultra={(145,145)}; q=deque(ultra)
while q:
 x,y=q.popleft()
 for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
  if (nx,ny) in seen and allowed(nx,ny) and (nx,ny) not in ultra: ultra.add((nx,ny));q.append((nx,ny))
ultra_rows=[''.join('1' if (x,y) in ultra else '0' for x in range(n)) for y in range(n)]
tail=tail.split('export const ULTRA_GRID')[0]
p.write_text('/** Walkable passages traced from the supplied map. */\nexport const MAP_RADIUS = 90000;\nexport const MAP_GRID = [\n'+''.join('  "'+r+'",\n' for r in rows)+'] as const;\n'+tail+'\nexport const ULTRA_GRID = [\n'+''.join('  "'+r+'",\n' for r in ultra_rows)+'] as const;\nexport function isUltraZone(x: number, y: number): boolean {\n  const col = Math.floor((x + MAP_RADIUS) / MAP_CELL), row = Math.floor((y + MAP_RADIUS) / MAP_CELL);\n  return ULTRA_GRID[row]?.[col] === "1";\n}\n')
print('ultra cells',len(ultra))
print('walkable cells',len(seen),'bottom-right', (145,145) in seen)
