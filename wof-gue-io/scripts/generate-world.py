#!/usr/bin/env python3
"""Generate a new, original maze: connected thick walls and connected floor."""
from pathlib import Path
from collections import deque
import random
N=160; rng=random.Random(47218); bx=by=123
g=[[0 if x<3 or y<3 or x>=N-3 or y>=N-3 else 1 for x in range(N)] for y in range(N)]
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
 if depth>=6 or min(w,h)<15 or max(w,h)<27:return
 for _ in range(18):
  horiz=(h>w*1.15) if w>h*1.15 or h>w*1.15 else bool(rng.randrange(2))
  if (h if horiz else w)<29:continue
  if horiz:
   y=rng.randrange(y0+11,y1-11)
   if abs(y-by)<11 and x0<=bx+10 and x1>=bx-10:continue
   gap=rng.randrange(x0+5,x1-4)
   cells=[(x,yy) for x in range(x0-1,x1+2) for yy in range(y-1,y+2) if abs(x-gap)>3]
  else:
   x=rng.randrange(x0+11,x1-11)
   if abs(x-bx)<11 and y0<=by+10 and y1>=by-10:continue
   gap=rng.randrange(y0+5,y1-4)
   cells=[(xx,y) for y in range(y0-1,y1+2) for xx in range(x-1,x+2) if abs(y-gap)>3]
  changes=[(xx,yy) for xx,yy in cells if g[yy][xx]]
  for xx,yy in changes:g[yy][xx]=0
  if not valid():
   for xx,yy in changes:g[yy][xx]=1
   continue
  walls+=1
  if horiz:divide(x0,y0,x1,y-2,depth+1);divide(x0,y+2,x1,y1,depth+1)
  else:divide(x0,y0,x-2,y1,depth+1);divide(x+2,y0,x1,y1,depth+1)
  return
divide(3,3,156,156)
# Extend irregular wall spurs from the existing network, never floating islands.
spurs = 0
for _ in range(1300):
 if spurs >= 55: break
 x=rng.randrange(5,155); y=rng.randrange(5,155)
 if g[y][x] != 0: continue
 dx,dy=rng.choice(((1,0),(-1,0),(0,1),(0,-1)))
 length=rng.randrange(5,16)
 cells=set()
 for i in range(length):
  for lateral in (-1,0,1):
   xx=x+dx*i+dy*lateral; yy=y+dy*i+dx*lateral
   if not (3<=xx<N-3 and 3<=yy<N-3): break
   cells.add((xx,yy))
 if len(cells)<length*2: continue
 if any((xx-bx)**2+(yy-by)**2 < 12**2 for xx,yy in cells):continue
 changes=[(xx,yy) for xx,yy in cells if g[yy][xx]]
 if len(changes) < 12: continue
 for xx,yy in changes:g[yy][xx]=0
 if not valid():
  for xx,yy in changes:g[yy][xx]=1
  continue
 spurs+=1
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
print('partitions',walls,'connected spurs',spurs,'walkable',sum(map(sum,g)))
