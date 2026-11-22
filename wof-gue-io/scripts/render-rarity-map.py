#!/usr/bin/env python3
"""Render the game's imported map and rarity zones."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import re,math
root=Path(__file__).resolve().parents[1]
world=(root/'src/game/world.ts').read_text(); data=(root/'src/game/data.ts').read_text()
rows=re.findall(r'  "([01]+)",',world); n=len(rows)//2; grid,ultra=rows[:n],rows[n:]
radius=int(re.search(r'MAP_RADIUS = (\d+)',world).group(1))
base=tuple(map(int,re.search(r'BASE = \{ x: (-?\d+), y: (-?\d+)',data).groups()))
edges=list(map(int,re.search(r'ZONE_EDGES = \[([^]]+)',data).group(1).split(',')))
colors=re.findall(r'\{ id: "(?:common|uncommon|rare|epic|legendary|mythical)", name: "[^"]+", color: "(#[0-9a-fA-F]+)"',data)
assert len(colors)==6 and len(grid)==len(ultra)==n
cell=6; size=n*cell; im=Image.new('RGB',(size+335,size+125),'#090d17');d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F=lambda x:ImageFont.truetype(font,x); B=lambda x:ImageFont.truetype(bold,x)
d.text((25,18),'WOFGUE / WORLD MAP',font=B(22),fill='white');d.text((25,49),'Rarity rises away from the top-left base',font=F(14),fill='#a9bdcb')
ox,oy=25,85
for y,row in enumerate(grid):
 for x,v in enumerate(row):
  if v=='0': c='#111722'
  elif ultra[y][x]=='1': c='#f2f7ff'
  else:
   wx=(x+.5)*2*radius/n-radius;wy=(y+.5)*2*radius/n-radius
   c=colors[sum(math.hypot(wx-base[0],wy-base[1])>=edge for edge in edges)]
  d.rectangle((ox+x*cell,oy+y*cell,ox+(x+1)*cell-1,oy+(y+1)*cell-1),fill=c)
bx=ox+(base[0]+radius)/(2*radius)*size;by=oy+(base[1]+radius)/(2*radius)*size
d.ellipse((bx-9,by-9,bx+9,by+9),fill='#07111a');d.ellipse((bx-6,by-6,bx+6,by+6),fill='#40ffcf')
x=ox+size+25;d.text((x,100),'RARITY ZONES',font=B(17),fill='white')
for i,name in enumerate(['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHICAL','ULTRA']):
 y=140+i*55;d.rounded_rectangle((x,y,x+23,y+23),radius=4,fill=(colors+['#f2f7ff'])[i]);d.text((x+34,y),name,font=B(14),fill='white')
d.text((x,555),'Green marker: base\nDark: walls\nUltra: mostly mythical\nenemies for now.',font=F(13),fill='#a9bdcb',spacing=6)
im.save(root/'docs/rarity-map.png',optimize=True)
