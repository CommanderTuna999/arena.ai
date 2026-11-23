import type {TargetScan} from "./target-scan";
/** Chairman combat/visual constants. Transient per-pilot state is deliberately
 * not persisted and is not used by the experimental multiplayer authority. */
export const CHAIRMAN_SHIELD_MAX = 1000; // 1000% of the unupgraded 100 HP hull
export const CHAIRMAN_DRONE_COOLDOWN = 5;
export type ChairmanState = {
  drones:number[]; fireGlow:number[]; reload:number; phase:number;
  armourActive:boolean; armour:number; armourMax:number;
  haloCenters: {x:number;y:number}[] | null; lastHaloPlayer: {x:number;y:number} | null; shield:number; shieldDelay:number; flash:number;
  scan:(TargetScan & {enemyId:number; drone:number; aimX:number; aimY:number; manual:boolean})|null;
  charge:number; // 0 idle; negative one denotes the beginning of a charge
};
export const chairmanDroneCount = (level:number) => 15 + Math.max(0, Math.min(15, Math.floor(level || 0)));
export const chairmanOrbChance = (level:number) => Math.min(0.15, 0.05 + Math.max(0, Math.min(10, level || 0)) * 0.01);
export const chairmanCoreMul = (level:number) => 1 + 0.75 * Math.max(0, Math.min(10, level || 0));
export const chairmanOrbRadius = (level:number) => 1600 * (1 + 0.1 * Math.max(0, Math.min(10, level || 0)));
export const chairmanOrbDamage = (dmgLevel:number, dronesLevel:number) => 15000000 * Math.pow(1.2, Math.max(0, Math.min(30, dmgLevel || 0))) * (1 + .1 * Math.max(0, Math.min(15, dronesLevel || 0)));
export function createChairman():ChairmanState {return {drones:Array(15).fill(0),fireGlow:Array(15).fill(0),reload:0,phase:0,armourActive:false,armour:0,armourMax:0,haloCenters:null,lastHaloPlayer:null,shield:CHAIRMAN_SHIELD_MAX,shieldDelay:0,flash:0,scan:null,charge:0};}
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
  s.armourActive=true; s.armourMax=Math.max(0,hull)*10; s.armour=s.armourMax;
  s.scan=null; s.reload=CHAIRMAN_DRONE_COOLDOWN;
  s.drones=s.drones.map((_,i)=>CHAIRMAN_DRONE_COOLDOWN*(i+1)/s.drones.length);
}
export function disperseChairmanArmour(s:ChairmanState):boolean {
  if(!s.armourActive || s.reload>0 || s.drones.some(x=>x>0))return false;
  s.armourActive=false; s.armour=0; s.armourMax=0; return true;
}
export function syncChairman(s:ChairmanState,count:number) {
  while(s.drones.length<count){s.drones.push(s.armourActive?s.reload:0);s.fireGlow.push(0);}
  s.drones.length=count;s.fireGlow.length=count;
}
export function tickChairman(s:ChairmanState,dt:number) {
  // Accelerate continuously throughout the one-second sun charge.
  const start=Math.max(0,Math.min(1,s.charge));
  const end=s.charge>0?Math.min(1,s.charge+dt):0;
  s.phase+=dt*(1+8*(start+end)/2);
  s.reload=Math.max(0,s.reload-dt);
  s.drones=s.drones.map(x=>Number.isFinite(x)?Math.max(0,x-dt):x);
  s.fireGlow=s.fireGlow.map(x=>Math.max(0,x-dt));
  s.flash=Math.max(0,s.flash-dt);s.shieldDelay=Math.max(0,s.shieldDelay-dt);
  if(!s.shieldDelay)s.shield=Math.min(CHAIRMAN_SHIELD_MAX,s.shield+50*dt);
}
