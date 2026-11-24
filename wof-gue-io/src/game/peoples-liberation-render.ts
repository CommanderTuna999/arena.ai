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
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Multiple tilted halo paths rotate independently; each path has its own
 // phase and bright tracer, rather than a single flat circle around the hull.
 if(!active && stage!=='armour'){
  for(let ring=0;ring<7;ring++){
   const r=76+ring*29,tilt=.5+ring*.055,rotation=ring*.56;
   const center=s.haloCenters?.[ring]??{x,y};ctx.save();ctx.translate(center.x,center.y);ctx.rotate(rotation);ctx.scale(1,tilt);
   ctx.strokeStyle=color(.12+ring*.017);ctx.lineWidth=(.8+ring*.08)/z;
   ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle=color(.7);ctx.lineWidth=1.5/z;ctx.beginPath();ctx.arc(0,0,r,s.phase*(ring%2?-.45:.55)+ring*.71,s.phase*(ring%2?-.45:.55)+ring*.71+.22);ctx.stroke();ctx.restore();
  }
 }
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
 if(s.linkFlash>0&&s.links.length){let px=x,py=y;ctx.strokeStyle=color(.5+.4*clamp(s.linkFlash/.32));ctx.lineWidth=2.5/z;ctx.beginPath();ctx.moveTo(px,py);for(const i of s.links){if(i<0||i>=n)continue;const center=s.haloCenters?.[i%7]??{x,y};[px,py]=liberationDronePosition(i,n,s.phase,center.x,center.y);ctx.lineTo(px,py);}ctx.stroke();}
 // Draw densely packed individual turret silhouettes; elites are visibly
 // distinct shielded spearheads. Armour form follows the same turret geometry.
 for(let i=0;i<n;i++){
  const center=s.haloCenters?.[i%7]??{x,y};let [dx,dy]=liberationDronePosition(i,n,s.phase,center.x,center.y);const elite=i<LIBERATION_ELITES;
  if(elite && locked && !active && stage==='idle') [dx,dy]=liberationElitePosition(i,s.phase*.7,target!.x,target!.y,Math.max(48,target!.radius+34)-Math.max(0,Math.sin(t*5+i*.5))*22);
  if(stage==='armour'||stage==='dispersing'){
   const a=i*Math.PI*2/n+s.phase*.12,r=71;
   const q=stage==='dispersing'?1-smooth(s.elapsed/.8):smooth(s.elapsed/2);
   dx=mix(dx,x+Math.cos(a)*r,q);dy=mix(dy,y+Math.sin(a)*r,q);
  }
  if(points){dx=mix(dx,x+points[i][0]*230*expansion,formation);dy=mix(dy,y+points[i][1]*230*expansion,formation);}
  const a=elite&&locked&&!active&&stage==='idle'?Math.atan2(target!.y-dy,target!.x-dx):Math.atan2(dy-y,dx-x),lit=s.drones[i]||active,scale=elite?1.55:1;
  ctx.save();ctx.translate(dx,dy);ctx.rotate(a);ctx.scale(scale,scale);ctx.globalAlpha=lit?.92:.4;
  ctx.fillStyle=lit?'#4c0a1b':'#170b10';ctx.strokeStyle=lit?'#ff3650':'#68303b';ctx.lineWidth=1/z;
  ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(2,-4);ctx.lineTo(-6,-4);ctx.lineTo(-9,0);ctx.lineTo(-6,4);ctx.lineTo(2,4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=lit?'#fff0dc':'#54202a';ctx.beginPath();ctx.arc(0,0,1.8,0,Math.PI*2);ctx.fill();
  if(elite){ctx.strokeStyle='#ffc3b8';ctx.lineWidth=1.3/z;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(22,0);ctx.moveTo(15,-2);ctx.lineTo(22,0);ctx.lineTo(15,2);ctx.stroke();ctx.strokeStyle=color(.65);ctx.beginPath();ctx.arc(-1,0,8,-1.1,1.1);ctx.stroke();}
  ctx.restore();
 }
 // Brief animated drone-chain bindings after the freeze flash. The visual
 // target is supplied by the world; this overlay never changes enemy state.
 if(selected==='定' && stage==='armour' && s.elapsed<1.7 && target){
  const opacity=1-smooth(s.elapsed/1.7);ctx.save();ctx.strokeStyle=color(.8*opacity);ctx.lineWidth=2/z;
  for(let strand=0;strand<3;strand++){ctx.beginPath();for(let j=0;j<=20;j++){
   const angle=j/20*Math.PI*2+strand*2*Math.PI/3+t*.8,r=target.radius+10+5*Math.sin(j*1.7+t*9+strand),px=target.x+Math.cos(angle)*r,py=target.y+Math.sin(angle)*r*.55+Math.sin(angle*2+strand)*12;
   if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }ctx.stroke();}ctx.restore();
 }
 // The broken configuration retains coherent luminous stroke paths and
 // expands before a flash; no font-dependent missing-glyph squares.
 if(selected&&(slam||expanding)){
  ctx.save();ctx.translate(x,y);ctx.scale(230*expansion,230*expansion);ctx.strokeStyle=selected==='天'?'rgba(255,214,100,.95)':'rgba(255,80,90,.95)';ctx.lineWidth=(3+flare*2)/(230*z);ctx.shadowColor=selected==='天'?'#ffd966':'#ff334d';ctx.shadowBlur=18/z;
  for(const path of STROKES[selected]){ctx.beginPath();ctx.moveTo(path[0][0],path[0][1]);for(let i=1;i<path.length;i++)ctx.lineTo(path[i][0],path[i][1]);ctx.stroke();}ctx.restore();
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
