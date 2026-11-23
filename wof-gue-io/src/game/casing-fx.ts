/** Cosmetic-only ejecta. Profiles are explicit: when adding a weapon, add its
 * spent round/cell here and emit it only when that weapon actually fires. */
export type CasingKind = 'small'|'shell'|'orb'|'core'|'vial';
type Shape = 'brass'|'battery'|'vial'|'cap';
export type CasingProfile = {shape:Shape; length:number; width:number; body:string; accent:string; bands:number; fins:number};
const P=(shape:Shape,length:number,width:number,body:string,accent:string,bands:number,fins=0):CasingProfile=>({shape,length,width,body,accent,bands,fins});
/** Dimensions are world units. A unique silhouette, markings and palette for
 * each weapon, even if two guns share a damage type. */
export const CASING_PROFILES: Readonly<Record<string,CasingProfile>> = {
 sting:P('brass',10,4,'#ba8b51','#ffe0a3',1),
 peashooter:P('brass',8,3,'#be944c','#ffe0a1',1),
 peashooter2:P('brass',10,3,'#9ca78b','#d7ebba',2),
 gatler:P('brass',7,3.8,'#b79552','#ffdd83',3),
 workhorse:P('brass',14,5,'#bd8750','#fbd19a',2),
 scattermk1:P('brass',11,8,'#974f39','#ffd488',2),
 skewer:P('brass',23,5,'#9eadae','#d7f8fa',1),
 skewer2:P('brass',28,6,'#718e9b','#c5ecff',3),
 'skewer2:energy':P('battery',25,8,'#35457b','#acb7ff',3,2),
 fencer:P('brass',19,3.5,'#8ba88c','#c7f5cd',2),
 'fencer:energy':P('battery',20,7,'#3e645a','#aeffd8',2,2),
 // The Mediator's discharged cell is a massive, long, violet power rod.
 mediator:P('battery',52,10,'#49335f','#e8baff',4,3),
 pulse:P('battery',11,7,'#735429','#fff181',1,1),
 scatter:P('brass',12,7,'#a65b3d','#ffdf98',1),
 hmg:P('brass',9,4,'#887e57','#f6d697',2),
 flak:P('brass',17,8,'#7e7553','#ffb45c',3),
 rail:P('brass',30,5,'#858c91','#ffe9a6',4),
 lance:P('battery',24,6,'#28516b','#7df9ff',2,1),
 bypass:P('battery',18,9,'#385d45','#b7ff7d',3,2),
 cutter:P('battery',13,8,'#713c5b','#ff8ad6',1,3),
 emp:P('battery',17,12,'#394c70','#a9dfff',4,2),
 chain:P('battery',20,8,'#503d79','#dfaeff',3,3),
 sonic:P('battery',14,10,'#3d6066','#a4ffff',2,4),
 gravity:P('battery',18,13,'#39345f','#c8a4ff',4,4),
 acid:P('vial',13,6,'#355d32','#b2ff6a',2),
 venom:P('vial',19,4,'#49613b','#d3ff8b',1),
 missile:P('cap',14,10,'#805b4b','#ffac7b',2,2),
 homing:P('cap',17,8,'#74516b','#ff8fe6',3,2),
 cluster:P('cap',19,11,'#805043','#ff986f',4,3),
 mines:P('cap',13,12,'#776b4b','#ffd17b',2,4),
 drones:P('brass',6,2.7,'#a88c62','#ffe7a6',1),
};
const FALLBACK:Record<CasingKind,CasingProfile>={
 small:P('brass',8,3,'#ad8a54','#ffe0a3',1),shell:P('brass',14,5,'#aa8051','#ffe0a3',2),
 core:P('battery',20,8,'#3c466e','#b9eaff',2,2),orb:P('battery',11,7,'#30596c','#a0ffff',1,1),vial:P('vial',13,5,'#435d32','#b2ff6a',2),
};
export function casingProfile(weapon:string,kind:CasingKind):CasingProfile {
 return ((kind==='core'||kind==='orb') && CASING_PROFILES[`${weapon}:energy`]) || CASING_PROFILES[weapon] || FALLBACK[kind];
}
type Casing = {x:number;y:number;vx:number;vy:number;angle:number;spin:number;at:number;kind:CasingKind;weapon:string;life:number;profile:CasingProfile};
const pools=new WeakMap<object,Casing[]>();
const sequences=new WeakMap<object,number>();
function noise(n:number){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
export function ejectCasing(owner:object,x:number,y:number,angle:number,at:number,kind:CasingKind,vx=0,vy=0,weapon='generic') {
 if(![x,y,angle,at,vx,vy].every(Number.isFinite))return;
 const seq=(sequences.get(owner)??0)+1;sequences.set(owner,seq);
 const a=noise(seq),b=noise(seq+17),c=noise(seq+37),side=angle+Math.PI/2+(a-.5)*.8,speed=55+b*105,back=15+c*45;
 const list=pools.get(owner)??[],profile=casingProfile(weapon,kind);
 list.push({x,y,vx:vx*.35+Math.cos(side)*speed-Math.cos(angle)*back,vy:vy*.35+Math.sin(side)*speed-Math.sin(angle)*back-(45+c*65),angle,spin:(a-.5)*18,at,kind,weapon,profile,life:(weapon==='mediator'?1.7:.75)+b*.4});
 if(list.length>48)list.splice(0,list.length-48);pools.set(owner,list);
}
export function casingsAt(owner:object,now:number):readonly Casing[]{
 const list=pools.get(owner)??[];let n=0;
 for(const q of list)if(now>=q.at&&now-q.at<q.life)list[n++]=q;
 list.length=n;if(!n)pools.delete(owner);return list;
}
/** Layered luminous geometry instead of canvas blur: bright batteries without
 * expensive shadows when rapid-fire guns are on screen. */
function drawProfile(ctx:CanvasRenderingContext2D,p:CasingProfile){
 const l=p.length,w=p.width;
 if(p.shape==='battery'){
  // Dark armored frame, colored glass, brilliant core and end terminals.
  ctx.fillStyle='#111a2a';ctx.fillRect(-l*.5,-w*.58,l,w*1.16);
  ctx.fillStyle=p.body;ctx.fillRect(-l*.43,-w*.46,l*.86,w*.92);
  ctx.fillStyle=p.accent;ctx.fillRect(-l*.37,-w*.23,l*.74,w*.46);
  ctx.fillStyle='#f6ffff';ctx.fillRect(-l*.32,-w*.065,l*.64,w*.13);
  ctx.fillStyle='#899bad';ctx.fillRect(-l*.5,-w*.58,l*.085,w*1.16);ctx.fillRect(l*.415,-w*.58,l*.085,w*1.16);
  ctx.fillStyle=p.body;
  for(let i=0;i<p.bands;i++){const x=-l*.3+(i+1)*l*.6/(p.bands+1);ctx.fillRect(x,-w*.48,Math.max(1,l*.025),w*.96);}
  ctx.fillStyle=p.accent;
  for(let i=0;i<p.fins;i++){const x=-l*.33+(i+1)*l*.66/(p.fins+1);ctx.fillRect(x,-w*.73,Math.max(1,l*.035),w*.2);ctx.fillRect(x,w*.53,Math.max(1,l*.035),w*.2);}
 }else if(p.shape==='vial'){
  ctx.fillStyle='#1c302c';ctx.fillRect(-l*.5,-w*.5,l,w);ctx.fillStyle=p.accent;ctx.fillRect(-l*.35,-w*.32,l*.66,w*.64);
  ctx.fillStyle='#efffbc';ctx.fillRect(-l*.27,-w*.23,l*.4,w*.1);ctx.fillStyle=p.body;ctx.fillRect(-l*.5,-w*.5,l*.15,w);ctx.fillRect(l*.34,-w*.5,l*.16,w);
  for(let i=0;i<p.bands;i++)ctx.fillRect(-l*.22+i*l*.2,-w*.5,1,w);
 }else if(p.shape==='cap'){
  ctx.fillStyle=p.body;ctx.fillRect(-l*.5,-w*.48,l,w*.96);ctx.fillStyle=p.accent;ctx.fillRect(-l*.4,-w*.2,l*.8,w*.4);
  ctx.fillStyle='#28313a';for(let i=0;i<p.bands;i++)ctx.fillRect(-l*.32+(i+1)*l*.64/(p.bands+1),-w*.48,1.5,w*.96);
  ctx.fillStyle=p.accent;for(let i=0;i<p.fins;i++)ctx.fillRect(-l*.4+(i+1)*l*.8/(p.fins+1),-w*.64,1.5,w*1.28);
 }else{
  ctx.fillStyle=p.body;ctx.fillRect(-l*.5,-w*.5,l,w);ctx.fillStyle=p.accent;ctx.fillRect(-l*.5,-w*.5,Math.max(1,l*.1),w);ctx.fillRect(-l*.36,-w*.37,l*.7,Math.max(.5,w*.13));
  ctx.fillStyle='#665447';for(let i=0;i<p.bands;i++)ctx.fillRect(l*.12+i*l*.08,-w*.5,Math.max(.6,l*.025),w);
 }
}
export function drawCasings(ctx:CanvasRenderingContext2D,owner:object,now:number){
 const list=casingsAt(owner,now);if(!list.length)return;ctx.save();
 for(const q of list){
  const age=now-q.at,drag=(1-Math.exp(-3*age))/3,alpha=Math.min(1,(q.life-age)*3);
  const x=q.x+q.vx*drag,y=q.y+q.vy*drag+110*age*age,angle=q.angle+age*q.spin;
  ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;drawProfile(ctx,q.profile);
  ctx.rotate(-angle);ctx.translate(-x,-y);
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
