#!/usr/bin/env python3
"""Generate a new, original maze: connected thick walls and connected floor."""
from pathlib import Path
from collections import deque
import random
N=160; rng=random.Random(47218); bx=by=123
g=[[0 if x<8 or y<8 or x>=N-8 or y>=N-8 else 1 for x in range(N)] for y in range(N)]
def component(start,value):
 seen={start};q=deque([start])
 while q:
  x,y=q.popleft()
  for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
   a,b=x+dx,y+dy
   if 0<=a<N and 0<=b<N and g[b][a]==value and (a,b) not in seen:seen.add((a,b));q.append((a,b))
 return len(seen)
def valid():
 zeros=sum(row.count(0) for row in g);ones=N*N-zeros
 return component((0,0),0)==zeros and component((bx,by),1)==ones
walls=0
def divide(x0,y0,x1,y1,depth=0):
 global walls
 w=x1-x0+1;h=y1-y0+1
 if depth>=5 or min(w,h)<35 or max(w,h)<65:return
 for _ in range(18):
  horiz=(h>w*1.15) if w>h*1.15 or h>w*1.15 else bool(rng.randrange(2))
  if (h if horiz else w)<65:continue
  if horiz:
   y=rng.randrange(y0+24,y1-23)
   if abs(y-by)<20 and x0<=bx+15 and x1>=bx-15:continue
   gap=rng.randrange(x0+13,x1-12)
   cells=[(x,yy) for x in range(x0-1,x1+2) for yy in range(y-7,y+8) if abs(x-gap)>10]
  else:
   x=rng.randrange(x0+24,x1-23)
   if abs(x-bx)<20 and y0<=by+15 and y1>=by-15:continue
   gap=rng.randrange(y0+13,y1-12)
   cells=[(xx,y) for y in range(y0-1,y1+2) for xx in range(x-7,x+8) if abs(y-gap)>10]
  changes=[(xx,yy) for xx,yy in cells if g[yy][xx]]
  for xx,yy in changes:g[yy][xx]=0
  if not valid():
   for xx,yy in changes:g[yy][xx]=1
   continue
  walls+=1
  if horiz:divide(x0,y0,x1,y-8,depth+1);divide(x0,y+8,x1,y1,depth+1)
  else:divide(x0,y0,x-8,y1,depth+1);divide(x+8,y0,x1,y1,depth+1)
  return
divide(8,8,151,151)
# Thick attached branches add curved-room structure without isolated walls.
spurs=0
for _ in range(1800):
 if spurs >= 20: break
 x=rng.randrange(12,148);y=rng.randrange(12,148)
 if g[y][x] != 0:continue
 dx,dy=rng.choice(((1,0),(-1,0),(0,1),(0,-1)))
 length=rng.randrange(14,30);cells=set()
 for i in range(length):
  for lateral in range(-7,8):
   xx=x+dx*i+dy*lateral;yy=y+dy*i+dx*lateral
   if 8<=xx<N-8 and 8<=yy<N-8:cells.add((xx,yy))
 if len(cells)<length*12:continue
 if any((xx-bx)**2+(yy-by)**2<18**2 for xx,yy in cells):continue
 changes=[(xx,yy) for xx,yy in cells if g[yy][xx]]
 if len(changes)<100:continue
 for xx,yy in changes:g[yy][xx]=0
 if not valid():
  for xx,yy in changes:g[yy][xx]=1
  continue
 spurs+=1
# Round convex corners of solid regions, only when connectivity is preserved.
# Two-cell chamfers approximate smooth curves without disconnecting either side.
for _ in range(2):
 candidates=[]
 for y in range(8,N-8):
  for x in range(8,N-8):
   if not g[y][x] and any(g[y+dy][x] and g[y][x+dx] for dx,dy in ((1,1),(1,-1),(-1,1),(-1,-1))):
    candidates.append((x,y))
 rng.shuffle(candidates)
 for x,y in candidates:
  g[y][x]=1
  if not valid(): g[y][x]=0
assert valid()
path=Path(__file__).resolve().parents[1]/'src/game/world.ts'
with path.open('w') as f:
 f.write('/** Original labyrinth with connected thick walls and connected walkable corridors. */\nexport const MAP_RADIUS = 90000;\nexport const MAP_GRID = [\n')
 for row in g:f.write('  "'+''.join(map(str,row))+'",\n')
 f.write('''] as const;
export const MAP_CELL = 2 * MAP_RADIUS / MAP_GRID.length;
export function walkable(x: number, y: number): boolean {
  const col = Math.floor((x + MAP_RADIUS) / MAP_CELL);
  const row = Math.floor((y + MAP_RADIUS) / MAP_CELL);
  return row >= 0 && row < MAP_GRID.length && col >= 0 && col < MAP_GRID.length && MAP_GRID[row][col] === "1";
}
''')
print('thick partitions',walls,'branches',spurs,'walkable',sum(map(sum,g)))
