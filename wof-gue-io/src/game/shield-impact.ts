/** Cosmetic-only shield impacts. Never used for collision, damage or saves. */
type Impact = {x:number;y:number;at:number};
const impacts = new WeakMap<object, Impact[]>();
export function recordShieldImpact(owner:object,x:number,y:number,at:number) {
  if (![x,y,at].every(Number.isFinite)) return;
  const old=impacts.get(owner) ?? [];
  // Refresh a nearby hit instead of layering identical effects on top.
  const i=old.findIndex(p=>(p.x-x)**2+(p.y-y)**2<16);
  if(i>=0)old.splice(i,1);
  old.push({x,y,at}); if(old.length>8)old.splice(0,old.length-8);
  impacts.set(owner,old);
}
export function shieldImpacts(owner:object,now:number):readonly Impact[] {
  const old=impacts.get(owner); if(!old)return [];
  const active=old.filter(v=>now>=v.at && now-v.at<0.8);
  if(active.length)impacts.set(owner,active);else impacts.delete(owner);
  return active;
}
/** Stable hexagonal grid: overlapping hit areas illuminate each cell once. */
export function shieldCells(owner:object,now:number,size:number) {
  const r=Math.max(5,Math.min(20,size));
  const cells=new Map<string,{q:number;s:number;alpha:number}>();
  const directions=[[0,0],[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
  for(const hit of shieldImpacts(owner,now)) {
    // Round fractional axial coordinates to the closest hex.
    const fq=(Math.sqrt(3)/3*hit.x-hit.y/3)/r, fs=(2*hit.y/3)/r, fy=-fq-fs;
    let q=Math.round(fq), s=Math.round(fs), y=Math.round(fy);
    const dq=Math.abs(q-fq), ds=Math.abs(s-fs), dy=Math.abs(y-fy);
    if(dq>ds&&dq>dy)q=-s-y;else if(ds>dy)s=-q-y;else y=-q-s;
    const fade=Math.max(0,1-(now-hit.at)/0.8);
    directions.forEach(([x,z],i)=>{
      const a=q+x,b=s+z,k=`${a},${b}`,alpha=fade*(i?0.4:1),previous=cells.get(k);
      if(!previous||previous.alpha<alpha)cells.set(k,{q:a,s:b,alpha});
    });
  }
  return [...cells.values()];
}
export function drawShieldImpacts(ctx:CanvasRenderingContext2D,owner:object,cx:number,cy:number,now:number,size:number,color:string) {
  const r=Math.max(5,Math.min(20,size)),cells=shieldCells(owner,now,r);if(!cells.length)return;
  ctx.save();ctx.lineJoin='round';ctx.shadowColor=color;
  for(const cell of cells){
    const x=cx+Math.sqrt(3)*r*(cell.q+cell.s/2),y=cy+1.5*r*cell.s,alpha=cell.alpha;
    ctx.beginPath();for(let k=0;k<6;k++){const a=Math.PI/6+k*Math.PI/3,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(!k)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();
    ctx.globalAlpha=alpha*.10;ctx.fillStyle=color;ctx.fill();
    ctx.globalAlpha=alpha*.65;ctx.strokeStyle=color;ctx.lineWidth=Math.max(0.8,r*.08);ctx.shadowBlur=alpha*5;ctx.stroke();
  }
  ctx.restore();
}
