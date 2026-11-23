/** Distance from a pilot to a beam segment: endpoint-only filtering hides long
 * shots which cross a viewport while both endpoints are outside it. */
export function segmentDistance(x:number,y:number,b:{x1:number;y1:number;x2:number;y2:number}):number {
  const dx=b.x2-b.x1,dy=b.y2-b.y1,length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,((x-b.x1)*dx+(y-b.y1)*dy)/length)) : 0;
  return Math.hypot(x-(b.x1+dx*t),y-(b.y1+dy*t));
}
