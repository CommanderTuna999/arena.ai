#!/usr/bin/env python3
"""Render the real game grid and rarity thresholds as a labelled PNG (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math, re
root = Path(__file__).resolve().parents[1]
world = (root / 'src/game/world.ts').read_text()
data = (root / 'src/game/data.ts').read_text()
rows = re.findall(r'  "([01]+)",', world)
radius = int(re.search(r'MAP_RADIUS = (\d+)', world).group(1))
base = tuple(map(int, re.search(r'BASE = \{ x: (\d+), y: (\d+)', data).groups()))
edges = list(map(int, re.search(r'ZONE_EDGES = \[([^]]+)', data).group(1).split(',')))
colors = re.findall(r'\{ id: "(?:common|uncommon|rare|epic|legendary|mythical)", name: "[^"]+", color: "(#[0-9a-fA-F]+)"', data)
assert len(colors) == 6 and len(rows) == len(rows[0])
N=len(rows); cell=7; size=N*cell
im=Image.new('RGB',(size+360,size+160),'#090d17'); d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F=lambda n: ImageFont.truetype(font,n)
B=lambda n: ImageFont.truetype(bold,n)
d.text((32,20),'WOFGUE  /  WORLD MAP',font=B(25),fill='#eff9ff')
d.text((33,58),'Walkable areas coloured by distance from the base',font=F(15),fill='#a9bdcb')
ox,oy=32,100; d.rectangle((ox-2,oy-2,ox+size+1,oy+size+1),fill='#1a2636')
for y,row in enumerate(rows):
 for x,v in enumerate(row):
  if v=='0': c='#111722'
  else:
   wx=(x+.5)*2*radius/N-radius; wy=(y+.5)*2*radius/N-radius
   tier=sum(math.hypot(wx-base[0],wy-base[1])>=edge for edge in edges)
   c=colors[tier]
  d.rectangle((ox+x*cell,oy+y*cell,ox+(x+1)*cell-1,oy+(y+1)*cell-1),fill=c)
bx=ox+(base[0]+radius)/(2*radius)*size; by=oy+(base[1]+radius)/(2*radius)*size
r=10;d.ellipse((bx-r-3,by-r-3,bx+r+3,by+r+3),fill='#101722');d.ellipse((bx-r,by-r,bx+r,by+r),fill='#ffffff');d.ellipse((bx-5,by-5,bx+5,by+5),fill='#101722')
x=ox+size+32; d.text((x,110),'RARITY ZONES',font=B(18),fill='#eff9ff')
labels=['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHICAL']
for i,name in enumerate(labels):
 y=154+i*62;d.rounded_rectangle((x,y,x+25,y+25),radius=4,fill=colors[i]);d.text((x+38,y-1),name,font=B(15),fill='#f2f5fa')
 low=0 if i==0 else edges[i-1]; high=edges[i] if i<len(edges) else None
 dist=f'{low//1000}k–{high//1000}k units' if high else f'{low//1000}k+ units'
 d.text((x+38,y+21),dist,font=F(12),fill='#a9bdcb')
d.text((x,550),'BASE',font=B(16),fill='#ffffff');d.text((x,578),'White ring marks the start.\nDark areas are walls.\n\nRarity bands are distance-based;\nindividual enemy rarities can vary.\n\nThe far reaches leave room for\nfuture rarity tiers.',font=F(13),fill='#a9bdcb',spacing=5)
output=root/'docs/rarity-map.png';output.parent.mkdir(exist_ok=True);im.save(output,optimize=True)
print(output)
