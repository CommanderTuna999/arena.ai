/** Cosmetic-only ejecta. Bounded and excluded from saves and combat. */
export type CasingKind = 'small'|'shell'|'orb'|'core';
type Casing = {x:number;y:number;vx:number;vy:number;angle:number;at:number;kind:CasingKind};
const pools=new WeakMap<object,Casing[]>();
export function ejectCasing(owner:object,x:number,y:number,angle:number,at:number,kind:CasingKind,vx=0,vy=0) {
  if(![x,y,angle,at,vx,vy].every(Number.isFinite))return;
  const list=pools.get(owner)??[];
  const side=angle+Math.PI/2;
  list.push({x,y,vx:vx*.25+Math.cos(side)*110-Math.cos(angle)*40,vy:vy*.25+Math.sin(side)*110-Math.sin(angle)*40,angle,at,kind});
  if(list.length>120)list.splice(0,list.length-120);pools.set(owner,list);
}
export function casingsAt(owner:object,now:number):readonly Casing[]{
 const list=pools.get(owner)??[],active=list.filter(q=>now>=q.at&&now-q.at<1.5);
 if(active.length)pools.set(owner,active);else pools.delete(owner);return active;
}
export function drawCasings(ctx:CanvasRenderingContext2D,owner:object,now:number){
 const list=casingsAt(owner,now);if(!list.length)return;ctx.save();
 for(const q of list){
  const age=now-q.at, drag=(1-Math.exp(-2.2*age))/2.2, alpha=Math.min(1,(1.5-age)*2), core=q.kind==='core';
  const size=q.kind==='small'?3:q.kind==='shell'?5:q.kind==='orb'?5.5:10;
  ctx.save();ctx.translate(q.x+q.vx*drag,q.y+q.vy*drag);ctx.rotate(q.angle+age*(core?3:7));ctx.globalAlpha=alpha;
  const glow=q.kind==='orb'?'#7df9ff':core?'#c4a6ff':'#ffd17a';
  ctx.fillStyle=core?'#282238':q.kind==='orb'?'#29516a':'#a9793d';ctx.strokeStyle=glow;ctx.lineWidth=1.1;ctx.shadowColor=glow;ctx.shadowBlur=core?9:3;
  ctx.beginPath();ctx.rect(-size*1.15,-size*.52,size*2.3,size*1.04);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-size*.65,-size*.45);ctx.lineTo(-size*.65,size*.45);ctx.moveTo(size*.7,-size*.45);ctx.lineTo(size*.7,size*.45);ctx.stroke();
  if(core||q.kind==='orb'){ctx.fillStyle=glow;ctx.globalAlpha=alpha*.8;ctx.beginPath();ctx.arc(0,0,size*.26,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 ctx.restore();
}
const limited=new WeakMap<object,Map<string,number>>();
/** Sustained beams consume one core per firing interval, not one per tick. */
export function ejectCasingLimited(owner:object,key:string,x:number,y:number,angle:number,at:number,vx=0,vy=0){
 let times=limited.get(owner);if(!times){times=new Map();limited.set(owner,times);}
 const previous=times.get(key);if(previous!==undefined&&at>=previous&&at-previous<1.5)return;
 times.set(key,at);ejectCasing(owner,x,y,angle,at,'core',vx,vy);
}
