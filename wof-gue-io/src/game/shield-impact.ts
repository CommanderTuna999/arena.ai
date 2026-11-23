/** Cosmetic-only shield impacts. Never used for collision, damage or saves. */
type Impact = {x:number;y:number;at:number};
const impacts = new WeakMap<object, Impact[]>();
export function recordShieldImpact(owner:object,x:number,y:number,at:number) {
  if (![x,y,at].every(Number.isFinite)) return;
  const old=impacts.get(owner) ?? [];
  // Cap repeated beams and keep the freshest impacts only.
  old.push({x,y,at}); if(old.length>8)old.splice(0,old.length-8);
  impacts.set(owner,old);
}
export function shieldImpacts(owner:object,now:number):readonly Impact[] {
  const old=impacts.get(owner); if(!old)return [];
  const active=old.filter(v=>now>=v.at && now-v.at<0.8);
  if(active.length)impacts.set(owner,active);else impacts.delete(owner);
  return active;
}
/** A cluster of seven honeycomb cells, fading from a bright impact to nothing. */
export function drawShieldImpacts(ctx:CanvasRenderingContext2D,owner:object,cx:number,cy:number,now:number,size:number,color:string) {
  const hits=shieldImpacts(owner,now); if(!hits.length)return;
  const r=Math.max(5,Math.min(20,size));
  ctx.save();ctx.lineJoin='round';ctx.shadowColor=color;
  for(const hit of hits){
    const fade=Math.max(0,1-(now-hit.at)/0.8);
    for(let i=-1;i<6;i++){
      const a=i*Math.PI/3, dist=i<0?0:Math.sqrt(3)*r;
      const x=cx+hit.x+Math.cos(a)*dist, y=cy+hit.y+Math.sin(a)*dist;
      const alpha=fade*(i<0?1:0.45);
      ctx.beginPath(); for(let k=0;k<6;k++) { const v=Math.PI/6+k*Math.PI/3, px=x+Math.cos(v)*r,py=y+Math.sin(v)*r; if(!k)ctx.moveTo(px,py);else ctx.lineTo(px,py); }ctx.closePath();
      ctx.globalAlpha=alpha*.14;ctx.fillStyle=color;ctx.fill();
      ctx.globalAlpha=alpha*.85;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,r*.11);ctx.shadowBlur=fade*8;ctx.stroke();
    }
  }
  ctx.restore();
}
