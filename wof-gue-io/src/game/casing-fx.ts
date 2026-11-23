/** Cosmetic-only ejecta. Independent pseudo-randomness never changes combat RNG. */
export type CasingKind = 'small'|'shell'|'orb'|'core'|'vial';
type Casing = {x:number;y:number;vx:number;vy:number;angle:number;spin:number;at:number;kind:CasingKind;weapon:string;size:number;life:number;color:string};
const pools=new WeakMap<object,Casing[]>();
const sequences=new WeakMap<object,number>();
function noise(n:number){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function weaponHash(id:string){let h=0;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))|0;return h;}
export function ejectCasing(owner:object,x:number,y:number,angle:number,at:number,kind:CasingKind,vx=0,vy=0,weapon='generic') {
  if(![x,y,angle,at,vx,vy].every(Number.isFinite))return;
  const seq=(sequences.get(owner)??0)+1;sequences.set(owner,seq);
  const a=noise(seq), b=noise(seq+17), c=noise(seq+37), h=Math.abs(weaponHash(weapon));
  const side=angle+Math.PI/2+(a-.5)*.8, speed=55+b*105, back=15+c*45;
  const energy=kind==='core'||kind==='orb'||kind==='vial';
  const color=energy ? `hsl(${kind==='vial' ? 85+h%45 : 175+h%120} 65% 48%)` : `hsl(${30+h%24} 55% ${40+h%15}%)`;
  const list=pools.get(owner)??[];
  // Simulated height is represented by an upward launch and downward arc in screen space.
  list.push({x,y,vx:vx*.35+Math.cos(side)*speed-Math.cos(angle)*back,vy:vy*.35+Math.sin(side)*speed-Math.sin(angle)*back-(45+c*65),angle,spin:(a-.5)*18,at,kind,weapon,size:(kind==='small'?2.5:kind==='shell'?4.3:kind==='orb'?4.5:8)*(0.85+(h%7)*.05),life:.75+b*.4,color});
  if(list.length>48)list.splice(0,list.length-48);pools.set(owner,list);
}
export function casingsAt(owner:object,now:number):readonly Casing[]{
 const list=pools.get(owner)??[];let n=0;
 for(const q of list)if(now>=q.at&&now-q.at<q.life)list[n++]=q;
 list.length=n;if(!n)pools.delete(owner);return list;
}
export function drawCasings(ctx:CanvasRenderingContext2D,owner:object,now:number){
 const list=casingsAt(owner,now);if(!list.length)return;ctx.save();
 // No canvas shadows or per-particle save/restore: rapid fire must stay cheap.
 for(const q of list){
  const age=now-q.at, drag=(1-Math.exp(-3*age))/3, alpha=Math.min(1,(q.life-age)*3), s=q.size;
  const x=q.x+q.vx*drag,y=q.y+q.vy*drag+110*age*age;
  ctx.translate(x,y);ctx.rotate(q.angle+age*q.spin);ctx.globalAlpha=alpha;
  const energy=q.kind==='core'||q.kind==='orb'||q.kind==='vial';
  ctx.fillStyle=q.color;
  if(energy){ctx.fillRect(-s,-s*.65,s*2,s*1.3);ctx.fillStyle='#d7ffff';ctx.fillRect(-s*.18,-s*.5,s*.36,s);}
  else {ctx.fillRect(-s*1.2,-s*.5,s*2.4,s);ctx.fillStyle='#e4c28a';ctx.fillRect(-s*1.2,-s*.5,s*.3,s);}
  ctx.rotate(-(q.angle+age*q.spin));ctx.translate(-x,-y);
 }
 ctx.restore();
}
const limited=new WeakMap<object,Map<string,number>>();
/** Sustained beams consume one core per firing interval, not one per tick. */
export function ejectCasingLimited(owner:object,key:string,x:number,y:number,angle:number,at:number,vx=0,vy=0,weapon=key.split(':').at(-1)){
 let times=limited.get(owner);if(!times){times=new Map();limited.set(owner,times);}
 const previous=times.get(key);if(previous!==undefined&&at>=previous&&at-previous<1.5)return;
 times.set(key,at);ejectCasing(owner,x,y,angle,at,'core',vx,vy,weapon);
}
