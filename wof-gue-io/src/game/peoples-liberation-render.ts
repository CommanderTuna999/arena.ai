/** Rendering primitives for People's Liberation. Kept separate from the world
 * simulation: none of these functions can apply damage or choose targets. */
import {LIBERATION_ELITES,liberationDronePosition,liberationElitePosition,type LiberationCharacter,type LiberationState} from './peoples-liberation';

type Point=[number,number];
type Stroke=readonly Point[];
// Normalized stroke paths: geometry is shared by the forming drones and the
// luminous character that remains after the slam, rather than relying on a
// particular Chinese font being installed in a player's browser.
const STROKES:Record<LiberationCharacter,readonly Stroke[]>={
 '定':[
  [[-.58,-.54],[-.48,-.77],[.48,-.77],[.58,-.54]],[[0,-1],[0,-.77]],
  [[-.48,-.4],[.48,-.4]],[[-.37,-.12],[.39,-.12]],[[0,-.4],[0,.72]],
  [[-.29,.02],[-.35,.3],[-.55,.73]],[[0,.28],[.18,.52],[.55,.64]],
 ],
 '死':[
  [[-.68,-.8],[.62,-.8]],[[-.28,-.79],[-.35,-.42],[-.62,-.08]],
  [[-.4,-.43],[-.06,-.43],[-.1,.05],[-.32,.45],[-.63,.7]],
  [[.15,-.83],[.15,.42],[.23,.62],[.55,.62],[.63,.48]],
  [[.58,-.46],[.19,-.14]],
 ],
 '爆':[
  [[-.7,-.7],[-.7,.58]],[[-.94,-.33],[-.48,-.33]],[[-.9,.18],[-.46,.05]],
  [[-.37,-.84],[.48,-.84],[.48,-.49],[-.37,-.49],[-.37,-.84]],
  [[-.43,-.33],[.55,-.33]],[[-.48,-.05],[.58,-.05]],
  [[-.16,-.44],[-.16,.02]],[ [.25,-.44],[.25,.02] ],
  [[.05,-.02],[.05,.72]],[[-.36,.23],[-.15,.36]],[[-.4,.63],[-.08,.4]],
  [[.21,.34],[.48,.19]],[[.22,.39],[.56,.65]],
 ],
 '天':[
  [[-.62,-.76],[.62,-.76]],[[-.72,-.25],[.72,-.25]],
  [[0,-.76],[0,-.22],[-.12,.14],[-.36,.48],[-.7,.76]],
  [[0,-.22],[.18,.17],[.42,.49],[.72,.76]],
 ],
};
const distance=(a:Point,b:Point)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
/** Evenly allocate the drones across stroke lengths, including disconnected
 * strokes. Returned points are normalized in the square [-1,1]. */
export function liberationCharacterPoints(character:LiberationCharacter,count:number):Point[]{
 if(!Number.isSafeInteger(count)||count<0||count>1000)throw Error('Invalid swarm size');
 const segments:Array<{a:Point;b:Point;length:number}>=[];
 for(const stroke of STROKES[character])for(let j=1;j<stroke.length;j++)segments.push({a:stroke[j-1],b:stroke[j],length:distance(stroke[j-1],stroke[j])});
 const total=segments.reduce((a,s)=>a+s.length,0);const result:Point[]=[];
 for(let i=0;i<count;i++){
  let d=total*(i+.5)/Math.max(1,count),chosen=segments[segments.length-1];
  for(const segment of segments){if(d<=segment.length){chosen=segment;break;}d-=segment.length;}
  const f=Math.max(0,Math.min(1,d/chosen.length));result.push([chosen.a[0]+(chosen.b[0]-chosen.a[0])*f,chosen.a[1]+(chosen.b[1]-chosen.a[1])*f]);
 }
 return result;
}
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const q=clamp(x);return q*q*(3-2*q);};
const mix=(a:number,b:number,q:number)=>a+(b-a)*q;
const color=(alpha:number)=>`rgba(255,43,71,${clamp(alpha)})`;
export type LiberationRenderTarget={x:number;y:number;radius:number};
/** Draw the entire autonomous swarm in world space. The optional target is
 * already resolved by the caller from an authoritative lock ID. `screenSpan`
 * is the world-space width of the viewport for the expanding glyph effect. */
export function drawPeoplesLiberation(ctx:CanvasRenderingContext2D,s:LiberationState,x:number,y:number,t:number,z:number,screenSpan:number,target?:LiberationRenderTarget|null,formationSeconds=2){
 if(!Number.isFinite(z)||z<=0||!Number.isFinite(screenSpan)||screenSpan<=0)return;
 const n=s.drones.length;if(!n||n>1000)return;
 const selected=s.selected,stage=s.stage;
 const forming=stage==='forming',bright=stage==='brightening',slam=stage==='slamming',expanding=stage==='expanding';
 const active=forming||bright||slam||expanding;
 const points=selected&&active?liberationCharacterPoints(selected,n):null;
 const formation=forming?smooth(s.elapsed/Math.max(.01,formationSeconds)):active?1:0;
 const expansion=expanding?1+smooth(s.elapsed/.45)*(Math.max(1,screenSpan/470)-1):1;
 const flare=bright?clamp(s.elapsed):slam||expanding?1:forming?.35*formation:0;
 const locked=!!target&&s.lockEnemy!==null;
 const dronePosition=(i:number):Point=>{
  const center=s.haloCenters?.[i%7]??{x,y};let [dx,dy]=liberationDronePosition(i,n,s.phase,center.x,center.y);
  if(i<LIBERATION_ELITES&&!active){const a=i/LIBERATION_ELITES*Math.PI*2+s.phase*.12;dx=x+Math.cos(a)*72;dy=y+Math.sin(a)*72;
   if(locked){const [ex,ey]=liberationElitePosition(i,s.phase*.7,target!.x,target!.y,Math.max(48,target!.radius+34)-Math.max(0,Math.sin(t*5+i*.5))*22);const q=smooth(s.eliteApproach);dx=mix(dx,ex,q);dy=mix(dy,ey,q);}}
  return [dx,dy];
 };
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Dome and inner energy core. Use a single translucent dome, never stacked
 // shield images, so impact detail can be composed by the caller.
 if(s.dome>0){const f=clamp(s.dome/15000);ctx.fillStyle=color(.025+.035*f);ctx.strokeStyle=color(.35+.45*f);ctx.lineWidth=2/z;ctx.beginPath();ctx.arc(x,y,58,0,Math.PI*2);ctx.fill();ctx.stroke();}
 const sunR=25+flare*20,pulse=.85+.15*Math.sin(t*5);
 const glow=ctx.createRadialGradient(x,y,0,x,y,sunR*3);glow.addColorStop(0,`rgba(255,255,235,${.95*pulse})`);glow.addColorStop(.12,'rgba(255,140,125,.95)');glow.addColorStop(.36,'rgba(255,30,55,.55)');glow.addColorStop(1,'rgba(255,10,30,0)');
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,sunR*3,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#310815';ctx.strokeStyle='#ff5263';ctx.lineWidth=2/z;ctx.beginPath();ctx.arc(x,y,sunR,0,Math.PI*2);ctx.fill();ctx.stroke();
 for(let k=0;k<24;k++){const a=k*Math.PI/12+s.phase*.45,r=sunR*(1.1+(k%2)*.2);ctx.strokeStyle=color(.55+flare*.4);ctx.beginPath();ctx.moveTo(x+Math.cos(a)*sunR*.76,y+Math.sin(a)*sunR*.76);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke();}
 ctx.fillStyle='#ffd9c9';ctx.beginPath();ctx.arc(x,y,sunR*.34,0,Math.PI*2);ctx.fill();
 // Link traces are based on the exact authoritative drone indices selected by
 // the shot. One chain, followed by the weapon beam in the world renderer.
 if(s.linkFlash>0&&s.links.length){
  const nodes:Point[]=[[x,y]];
  for(const i of s.links){if(i<0||i>=n)continue;nodes.push(dronePosition(i));}
  const alpha=clamp(s.linkFlash/.32);
  for(let k=1;k<nodes.length;k++){
   const [ax,ay]=nodes[k-1],[bx,by]=nodes[k],dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(len<1)continue;
   const nx=-dy/len,ny=dx/len;
   // Layered conductor, twin rails, transverse braces and travelling sparks.
   ctx.strokeStyle=color(.14*alpha);ctx.lineWidth=12/z;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
   ctx.strokeStyle=color(.65*alpha);ctx.lineWidth=1.2/z;
   for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+dx*.16+nx*side*5,ay+dy*.16+ny*side*5);ctx.lineTo(ax+dx*.84+nx*side*5,ay+dy*.84+ny*side*5);ctx.lineTo(bx,by);ctx.stroke();}
   ctx.strokeStyle=`rgba(255,225,213,${.95*alpha})`;ctx.lineWidth=1.5/z;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
   const braces=Math.min(12,Math.max(2,Math.floor(len/22)));ctx.strokeStyle=color(.75*alpha);ctx.lineWidth=.8/z;
   for(let j=1;j<braces;j++){const q=j/braces,cx=ax+dx*q,cy=ay+dy*q;ctx.beginPath();ctx.moveTo(cx-nx*5,cy-ny*5);ctx.lineTo(cx+nx*5+dx/len*4,cy+ny*5+dy/len*4);ctx.stroke();}
   const q=(t*3+k*.27)%1,cx=ax+dx*q,cy=ay+dy*q;ctx.fillStyle=`rgba(255,242,215,${alpha})`;ctx.beginPath();ctx.arc(cx,cy,2.5/z,0,Math.PI*2);ctx.fill();
  }
 }
 // Draw densely packed individual turret silhouettes; elites are visibly
 // distinct shielded spearheads. Armour form follows the same turret geometry.
 for(let i=0;i<n;i++){
  let [dx,dy]=dronePosition(i);const elite=i<LIBERATION_ELITES;
  if(points){dx=mix(dx,x+points[i][0]*230*expansion,formation);dy=mix(dy,y+points[i][1]*230*expansion,formation);}
  const a=elite&&locked&&!active?Math.atan2(target!.y-dy,target!.x-dx):Math.atan2(dy-y,dx-x),lit=s.drones[i]||active,scale=elite?1.55:1;
  ctx.save();ctx.translate(dx,dy);ctx.rotate(a);ctx.scale(scale,scale);ctx.globalAlpha=lit?.92:.4;
  // A layered, angular siege-turret silhouette, with outboard fins,
  // mechanical rails and an exposed luminous reactor. No Chairman geometry.
  ctx.fillStyle=lit?'#330815':'#140b10';ctx.strokeStyle=lit?'#fa3551':'#61303c';ctx.lineWidth=.85/z;
  ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(6,-3);ctx.lineTo(3,-6);ctx.lineTo(-3,-5);ctx.lineTo(-7,-8);ctx.lineTo(-10,-6);ctx.lineTo(-7,-2);ctx.lineTo(-11,0);ctx.lineTo(-7,2);ctx.lineTo(-10,6);ctx.lineTo(-7,8);ctx.lineTo(-3,5);ctx.lineTo(3,6);ctx.lineTo(6,3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=lit?'#8b162a':'#35141c';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(2,-3.3);ctx.lineTo(-4,-2.6);ctx.lineTo(-7,0);ctx.lineTo(-4,2.6);ctx.lineTo(2,3.3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=lit?'#ff9a91':'#74404b';ctx.lineWidth=.65/z;ctx.beginPath();ctx.moveTo(-7,-5.7);ctx.lineTo(-3,-3.5);ctx.lineTo(3,-4.3);ctx.lineTo(6,-2);ctx.moveTo(-7,5.7);ctx.lineTo(-3,3.5);ctx.lineTo(3,4.3);ctx.lineTo(6,2);ctx.moveTo(4,-1);ctx.lineTo(11,-1);ctx.moveTo(4,1);ctx.lineTo(11,1);ctx.stroke();
  ctx.fillStyle=lit?'#fff1d7':'#54202a';ctx.beginPath();ctx.arc(-1,0,1.6,0,Math.PI*2);ctx.fill();
  if(elite){ctx.fillStyle=lit?'#ff6871':'#61303c';ctx.beginPath();ctx.moveTo(7,-2.5);ctx.lineTo(25,0);ctx.lineTo(7,2.5);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffe0c8';ctx.lineWidth=.8/z;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(24,0);ctx.moveTo(12,-1.5);ctx.lineTo(16,0);ctx.lineTo(12,1.5);ctx.stroke();ctx.strokeStyle=color(.65);ctx.lineWidth=1/z;ctx.beginPath();ctx.arc(-1,0,10,-1.15,1.15);ctx.stroke();ctx.beginPath();ctx.arc(-1,0,12,-.8,.8);ctx.stroke();}
  ctx.restore();
 }
 // Brief animated drone-chain bindings after the freeze flash. The visual
 // target is supplied by the world; this overlay never changes enemy state.
 if(selected==='定' && stage==='recharging' && s.elapsed<1.7 && target){
  const opacity=1-smooth(s.elapsed/1.7);ctx.save();ctx.strokeStyle=color(.8*opacity);ctx.lineWidth=2/z;
  for(let strand=0;strand<3;strand++){ctx.beginPath();for(let j=0;j<=20;j++){
   const angle=j/20*Math.PI*2+strand*2*Math.PI/3+t*.8,r=target.radius+10+5*Math.sin(j*1.7+t*9+strand),px=target.x+Math.cos(angle)*r,py=target.y+Math.sin(angle)*r*.55+Math.sin(angle*2+strand)*12;
   if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }ctx.stroke();}ctx.restore();
 }
 // The broken configuration retains coherent luminous stroke paths and
 // expands before a flash; no font-dependent missing-glyph squares.
 if(selected&&(slam||expanding)){
  ctx.save();ctx.translate(x,y);ctx.scale(230*expansion,230*expansion);
  const gold=selected==='天',unit=1/(230*z),trace=()=>{for(const path of STROKES[selected]){ctx.beginPath();ctx.moveTo(path[0][0],path[0][1]);for(let i=1;i<path.length;i++)ctx.lineTo(path[i][0],path[i][1]);ctx.stroke();}};
  // A broad engraved body, a bright inner conductor, and repeating inlaid
  // facets make each stroke read as a constructed character, not a thin font.
  ctx.strokeStyle=gold?'rgba(255,183,54,.18)':'rgba(255,20,54,.18)';ctx.lineWidth=28*unit;trace();
  ctx.strokeStyle=gold?'#9a4911':'#700b21';ctx.lineWidth=17*unit;trace();
  ctx.strokeStyle=gold?'#ffc65b':'#ff5269';ctx.lineWidth=11*unit;trace();
  ctx.strokeStyle=gold?'#fff3bc':'#ffe3d4';ctx.lineWidth=2.2*unit;trace();
  for(const path of STROKES[selected])for(let j=1;j<path.length;j++){
   const a=path[j-1],b=path[j],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(!len)continue;const nx=-dy/len,ny=dx/len,count=Math.max(1,Math.floor(len*12));
   ctx.strokeStyle=gold?'rgba(255,248,204,.75)':'rgba(255,207,194,.7)';ctx.lineWidth=unit;
   for(let k=1;k<count;k++){const q=k/count,cx=a[0]+dx*q,cy=a[1]+dy*q,w=5*unit;ctx.beginPath();ctx.moveTo(cx-nx*w,cy-ny*w);ctx.lineTo(cx+nx*w+dx/len*3*unit,cy+ny*w+dy/len*3*unit);ctx.stroke();}
   ctx.fillStyle=gold?'#fff2be':'#ffe6d8';ctx.beginPath();ctx.arc(a[0],a[1],2.2*unit,0,Math.PI*2);ctx.fill();
  }ctx.restore();
 }
 if(expanding && s.elapsed>.32){ctx.save();ctx.globalAlpha=.48*smooth((s.elapsed-.32)/.13);ctx.fillStyle=selected==='天'?'#fff4cb':'#fff3ed';ctx.fillRect(x-screenSpan,y-screenSpan,screenSpan*2,screenSpan*2);ctx.restore();}
 ctx.restore();
}

/** Short-lived moving bindings: each chain is made from individually drawn
 * drone links, fading away while the authoritative freeze can continue. */
export function drawLiberationChains(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,opacity:number,t:number,z:number){
 if(![x,y,radius,opacity,t,z].every(Number.isFinite)||radius<0||opacity<=0||z<=0)return;
 const r=Math.max(30,radius+12);ctx.save();ctx.lineWidth=1.4/z;ctx.strokeStyle=color(.72*opacity);
 for(let band=0;band<3;band++){
  let previous:Point|null=null;
  for(let j=0;j<24;j++){
   const angle=j/24*Math.PI*2+t*(band%2?-1.2:1.1)+band*2.1;
   const p:Point=[x+Math.cos(angle)*r,y+Math.sin(angle)*r*.55+Math.sin(angle*2+band)*r*.16];
   if(previous){ctx.beginPath();ctx.moveTo(previous[0],previous[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();}
   ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle);ctx.fillStyle=color(.85*opacity);ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(0,-2.5);ctx.lineTo(-4,0);ctx.lineTo(0,2.5);ctx.closePath();ctx.fill();ctx.restore();previous=p;
  }
 }
 ctx.restore();
}

export type LiberationRupture={x:number;y:number;angle:number;started:number;parts:Array<{poly:number[];cx:number;cy:number}>};
/** Golden force pulls the actual component polygons outwards, then crushes
 * them back towards the centre. The authoritative kill already happened; this
 * time-bounded copy is purely visual and cannot create duplicate rewards. */
export function drawLiberationRupture(ctx:CanvasRenderingContext2D,rupture:LiberationRupture,now:number,z:number){
 const age=now-rupture.started;if(age<0||age>1.3||z<=0)return;
 const out=age<.6?smooth(age/.6):1-smooth((age-.6)/.7);
 const fade=age<1?1:1-smooth((age-1)/.3);
 ctx.save();ctx.translate(rupture.x,rupture.y);ctx.rotate(rupture.angle);ctx.globalAlpha=fade;
 for(let i=0;i<rupture.parts.length;i++){
  const part=rupture.parts[i];if(part.poly.length<6)continue;
  const radial=Math.hypot(part.cx,part.cy)||1,spread=out*(55+(i%7)*12);
  ctx.save();ctx.translate(part.cx/radial*spread,part.cy/radial*spread);ctx.strokeStyle='#ffe181';ctx.fillStyle='rgba(255,176,45,.14)';ctx.lineWidth=2/z;
  ctx.beginPath();ctx.moveTo(part.poly[0],part.poly[1]);for(let j=2;j<part.poly.length;j+=2)ctx.lineTo(part.poly[j],part.poly[j+1]);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 ctx.restore();
}
