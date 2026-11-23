import type {TargetScan} from "./target-scan";
/** Chairman combat/visual constants. Transient per-pilot state is deliberately
 * not persisted and is not used by the experimental multiplayer authority. */
export const CHAIRMAN_SHIELD_MAX = 1000; // 1000% of the unupgraded 100 HP hull
export const CHAIRMAN_DRONE_COOLDOWN = 5;
export const CHAIRMAN_ARMOUR_ANIMATION = 2;
export const CHAIRMAN_DISPERSE_ANIMATION = .7;
export const CHAIRMAN_OUTER_TRAVEL = 1.2;
export const CHAIRMAN_OUTER_RADIUS = 320;
export type ChairmanState = {
  drones:number[]; fireGlow:number[]; reload:number; phase:number;
  armourActive:boolean; armour:number; armourMax:number; armourBlend:number; armourDispersing:boolean; armourReturnPath:boolean; armourLostPieces:number;
  outerPhase:number; outerTravel:number[]; outerStart:({x:number;y:number;angle:number}|null)[]; sunLocked:boolean; sunRequested:boolean;
  haloCenters: {x:number;y:number}[] | null; lastHaloPlayer: {x:number;y:number} | null; shield:number; shieldDelay:number; flash:number;
  scan:(TargetScan & {enemyId:number; drone:number; aimX:number; aimY:number; manual:boolean})|null;
  charge:number; // 0 idle; negative one denotes the beginning of a charge
};
export const chairmanDroneCount = (level:number) => 15 + Math.max(0, Math.min(15, Math.floor(level || 0)));
export const chairmanOrbChance = (level:number) => Math.min(0.15, 0.05 + Math.max(0, Math.min(10, level || 0)) * 0.01);
export const chairmanCoreMul = (level:number) => 1 + 0.75 * Math.max(0, Math.min(10, level || 0));
export const chairmanOrbRadius = (level:number) => 1600 * (1 + 0.1 * Math.max(0, Math.min(10, level || 0)));
export const chairmanOrbDamage = (dmgLevel:number, dronesLevel:number) => 15000000 * Math.pow(1.2, Math.max(0, Math.min(30, dmgLevel || 0))) * (1 + .1 * Math.max(0, Math.min(15, dronesLevel || 0)));
export function createChairman():ChairmanState {return {drones:Array(15).fill(0),fireGlow:Array(15).fill(0),reload:0,phase:0,armourActive:false,armour:0,armourMax:0,armourBlend:0,armourDispersing:false,armourReturnPath:false,armourLostPieces:0,outerPhase:0,outerTravel:Array(15).fill(0),outerStart:Array(15).fill(null),sunLocked:false,sunRequested:false,haloCenters:null,lastHaloPlayer:null,shield:CHAIRMAN_SHIELD_MAX,shieldDelay:0,flash:0,scan:null,charge:0};}
export function chairmanPosition(index:number,count:number,phase:number,x:number,y:number):[number,number] {
  const ring=index%3, perRing=Math.ceil((count-ring)/3), pos=Math.floor(index/3);
  const angle=(ring===1?-phase:phase)*(0.75+ring*.18) + pos*2*Math.PI/Math.max(1,perRing)+ring*.7;
  const radius=94+ring*36+7*Math.sin(phase*2+ring*2);
  return [x+Math.cos(angle)*radius,y+Math.sin(angle)*radius];
}
/** Keep simulation, beams and rendering on the same trailing halo positions. */
export function chairmanHaloCenter(s:ChairmanState,ring:number,x:number,y:number):[number,number] {
  const center=s.haloCenters?.[ring]; return center?[center.x,center.y]:[x,y];
}
export function chairmanDronePosition(s:ChairmanState,index:number,x:number,y:number):[number,number] {
  const [cx,cy]=chairmanHaloCenter(s,index%3,x,y);
  return chairmanPosition(index,s.drones.length,s.phase,cx,cy);
}
/** Capture the drone's actual position when it goes dark, avoiding a jump. */
export function spendChairmanDrone(s:ChairmanState,index:number,x:number,y:number) {
  const [px,py]=s.armourActive ? chairmanArmourDronePosition(s,index,x,y) : chairmanDroneVisualPosition(s,index,x,y);
  const dx=px-x,dy=py-y;
  s.outerStart[index]={x:dx,y:dy,angle:Math.atan2(dy,dx)-s.outerPhase};
  s.outerTravel[index]=0;s.drones[index]=Infinity;
}
export function chairmanDroneVisualPosition(s:ChairmanState,index:number,x:number,y:number):[number,number] {
  const start=s.outerStart[index];
  if(!start || (!s.armourActive && s.drones[index]<=0)) return chairmanDronePosition(s,index,x,y);
  const t=Math.max(0,Math.min(1,s.outerTravel[index]/CHAIRMAN_OUTER_TRAVEL));
  const smooth=t*t*(3-2*t), a=start.angle+s.outerPhase;
  return [x+start.x+(Math.cos(a)*CHAIRMAN_OUTER_RADIUS-start.x)*smooth,
    y+start.y+(Math.sin(a)*CHAIRMAN_OUTER_RADIUS-start.y)*smooth];
}
/** Assemble from the outer orbit; on dispersal move smoothly back to the
 * ordinary trailing halo. Damage can reverse dispersal without a jump. */
export function chairmanArmourDronePosition(s:ChairmanState,index:number,x:number,y:number):[number,number] {
  const [ox,oy]=s.armourReturnPath ? chairmanDronePosition(s,index,x,y) : chairmanDroneVisualPosition(s,index,x,y);
  const angle=index*2*Math.PI/s.drones.length-Math.PI/2;
  const blend=Math.max(0,Math.min(1,s.armourBlend));
  const t=blend*blend*(3-2*blend);
  return [ox+(x+Math.cos(angle)*69-ox)*t,oy+(y+Math.sin(angle)*69-oy)*t];
}
/** Move each spent drone outward. Armour formation begins only once the last
 * one reaches the outer orbit. Sun charge pauses assembly until it resolves. */
export function updateChairmanSwarm(s:ChairmanState,dt:number,x:number,y:number,hull:number) {
  if(s.armourActive)return;
  for(let i=0;i<s.drones.length;i++) if(s.drones[i]>0) {
    if(!s.outerStart[i])spendChairmanDrone(s,i,x,y);
    s.outerTravel[i]=Math.min(CHAIRMAN_OUTER_TRAVEL,s.outerTravel[i]+Math.max(0,dt));
  }
  if(s.charge<=0 && s.drones.length>0 && s.drones.every(v=>v>0) && s.outerTravel.every(v=>v>=CHAIRMAN_OUTER_TRAVEL)) gatherChairmanArmour(s,hull);
}
/** Three independently damped anchors give the rings a lightweight trailing
 * motion. A hard leash bounds gameplay range; teleports reset instead of
 * dragging the drones across the map. */
export function moveChairmanHalos(s:ChairmanState,dt:number,x:number,y:number) {
  const last=s.lastHaloPlayer;
  if(!s.haloCenters || !last || Math.hypot(x-last.x,y-last.y)>900) {
    s.haloCenters=Array.from({length:3},()=>({x,y}));
  } else {
    const rates=[8,5.5,4], limits=[55,85,115];
    s.haloCenters.forEach((c,i)=>{
      const follow=1-Math.exp(-rates[i]*Math.max(0,dt));
      c.x+=(x-c.x)*follow;c.y+=(y-c.y)*follow;
      const dx=c.x-x,dy=c.y-y,d=Math.hypot(dx,dy),limit=limits[i];
      if(d>limit){c.x=x+dx*limit/d;c.y=y+dy*limit/d;}
    });
  }
  s.lastHaloPlayer={x,y};
}
/** All drones become a protective layer, charging sequentially over five seconds. */
export function gatherChairmanArmour(s:ChairmanState,hull:number) {
  s.armourActive=true; s.armourBlend=0; s.armourDispersing=false; s.armourReturnPath=false; s.armourLostPieces=0; s.armourMax=Math.max(0,hull)*10; s.armour=s.armourMax;
  s.scan=null; s.reload=CHAIRMAN_DRONE_COOLDOWN;
  s.drones=s.drones.map((_,i)=>CHAIRMAN_DRONE_COOLDOWN*(i+1)/s.drones.length);
}
/** A click starts the outward animation, not an instant teleport. */
export function disperseChairmanArmour(s:ChairmanState):boolean {
  if(!s.armourActive || s.armourDispersing || s.armourBlend<1 || s.reload>0 || s.drones.some(x=>x>0))return false;
  s.armourDispersing=true; s.armourReturnPath=true; return true;
}
/** Each whole armour segment lost sends its corresponding drone to the end
 * of the sequential recharge queue. Partial damage accumulates across hits. */
export function damageChairmanArmour(s:ChairmanState,damage:number):number {
  const absorbed=Math.min(s.armour,damage);
  s.armour-=absorbed;
  if(Number.isFinite(s.armourMax) && s.armourMax>0) {
    const lost=Math.min(s.drones.length,Math.floor((s.armourMax-s.armour)/s.armourMax*s.drones.length+1e-10));
    for(let i=s.armourLostPieces;i<lost;i++) {
      const queue=Math.max(0,...s.drones.filter((_,j)=>j!==i).filter(Number.isFinite));
      s.drones[i]=queue+CHAIRMAN_DRONE_COOLDOWN/s.drones.length;
    }
    if(lost>s.armourLostPieces) {
      s.reload=Math.max(s.reload,...s.drones.filter(Number.isFinite));
      s.armourDispersing=false;
    }
    s.armourLostPieces=lost;
  }
  return absorbed;
}
export function syncChairman(s:ChairmanState,count:number) {
  while(s.drones.length<count){s.drones.push(s.armourActive?s.reload:0);s.fireGlow.push(0);s.outerTravel.push(0);s.outerStart.push(null);}
  s.drones.length=count;s.fireGlow.length=count;s.outerTravel.length=count;s.outerStart.length=count;
}
export function tickChairman(s:ChairmanState,dt:number) {
  // Accelerate continuously throughout the one-second sun charge.
  const start=Math.max(0,Math.min(1,s.charge));
  const end=s.charge>0?Math.min(1,s.charge+dt):0;
  s.phase+=dt*(1+8*(start+end)/2);
  s.outerPhase+=dt*.35;
  if(s.armourActive && s.charge<=0) {
    s.armourBlend=Math.max(0,Math.min(1,s.armourBlend+(s.armourDispersing?-dt/CHAIRMAN_DISPERSE_ANIMATION:dt/CHAIRMAN_ARMOUR_ANIMATION)));
    if(s.armourDispersing && s.armourBlend<=0) {
      s.armourActive=false;s.armourDispersing=false;s.armourReturnPath=false;s.armour=0;s.armourMax=0;s.armourLostPieces=0;s.sunLocked=false;s.sunRequested=false;s.outerStart.fill(null);s.outerTravel.fill(0);
    } else if(!s.armourDispersing && s.armourBlend>=1) s.armourReturnPath=false;
  }
  s.reload=Math.max(0,s.reload-dt);
  s.drones=s.drones.map(x=>Number.isFinite(x)?Math.max(0,x-dt):x);
  s.fireGlow=s.fireGlow.map(x=>Math.max(0,x-dt));
  s.flash=Math.max(0,s.flash-dt);s.shieldDelay=Math.max(0,s.shieldDelay-dt);
  if(!s.shieldDelay)s.shield=Math.min(CHAIRMAN_SHIELD_MAX,s.shield+50*dt);
}
