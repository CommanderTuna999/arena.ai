/** State, balance and geometry for the Tier 4 People's Liberation cannon.
 * World damage and rendering are delegated to their respective adapters. */
export type LiberationCharacter = '定'|'死'|'爆'|'天';
export type LiberationStage = 'idle'|'forming'|'brightening'|'slamming'|'expanding'|'recharging';
export const LIBERATION_BASE_DRONES=150;
export const LIBERATION_ELITES=15;
export const LIBERATION_DRONE_DAMAGE=7_000_000;
export const LIBERATION_ORB_DAMAGE=777_000_000;
// "15000% of base health" means 150 × the unupgraded starting hull (100).
export const LIBERATION_DOME_MAX=15_000;
export const LIBERATION_INTERVAL=2;
export const LIBERATION_BASE_RANGE=1600;
export const LIBERATION_RECHARGE_SECONDS=5;

export type LiberationLevels={drones?:number;orbChance?:number;orbRange?:number;blastRarity?:number;freezeDuration?:number;activationSpeed?:number;dmg?:number;coreDmg?:number};
export type LiberationState={
  drones:boolean[]; // true = ready; false = exhausted
  phase:number; haloCenters:{x:number;y:number}[]|null; lastHaloPlayer:{x:number;y:number}|null; stage:LiberationStage; elapsed:number; selected:LiberationCharacter|null;
  dome:number; domeDelay:number; recharge:number; eliteApproach:number;
  lockEnemy:number|null; scanEnemy:number|null; scanElapsed:number; scanDuration:number; scanParts:number[];
  links:number[]; linkFlash:number; elitesClock:number; activationSerial:number;
};
const level=(n:number|undefined,max:number)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n!))):0;
const sample=(rng:()=>number)=>{const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Invalid random value');return n;};
export function liberationDroneCount(lv:LiberationLevels={}){return LIBERATION_BASE_DRONES+level(lv.drones,15);}
/** Extra drones add two percentage points to 天, proportionally reducing the
 * other three equal probabilities so that the distribution remains valid. */
export function liberationWeights(lv:LiberationLevels={}):Record<LiberationCharacter,number>{
 const heaven=.1+.02*level(lv.drones,15),other=(1-heaven)/3;
 return {'定':other,'死':other,'爆':other,'天':heaven};
}
export function chooseLiberationCharacter(lv:LiberationLevels={},rng:()=>number=Math.random):LiberationCharacter{
 const n=sample(rng),w=liberationWeights(lv),other=w['定'];return n<other?'定':n<other*2?'死':n<other*3?'爆':'天';
}
/** Provisional upgrade scaling where levels were not specified: +4.5 points
 * of activation chance per level to +45 at level ten; +1 second freeze per
 * level; Epic → Legendary → Mythical; 5% faster formation per speed level. */
export const liberationOrbChance=(lv:LiberationLevels={})=>.3+.045*level(lv.orbChance,10);
export const liberationOrbRange=(lv:LiberationLevels={})=>LIBERATION_BASE_RANGE*(1+.1*level(lv.orbRange,10));
export const liberationFreezeSeconds=(lv:LiberationLevels={})=>10+level(lv.freezeDuration,10);
export const liberationExplosionMaxTier=(lv:LiberationLevels={})=>Math.min(5,3+level(lv.blastRarity,2));
export const liberationOrbDamage=(lv:LiberationLevels={})=>LIBERATION_ORB_DAMAGE*Math.pow(1.2,level(lv.dmg,30));
export const liberationCoreMultiplier=(lv:LiberationLevels={})=>1+.75*level(lv.coreDmg,10);
export const liberationFormationSeconds=(lv:LiberationLevels={})=>2/(1+.05*level(lv.activationSpeed,10));
export function createLiberation(lv:LiberationLevels={}):LiberationState{return {
 drones:Array(liberationDroneCount(lv)).fill(true),phase:0,haloCenters:null,lastHaloPlayer:null,stage:'idle',elapsed:0,selected:null,
 dome:LIBERATION_DOME_MAX,domeDelay:0,recharge:0,eliteApproach:0,
 lockEnemy:null,scanEnemy:null,scanElapsed:0,scanDuration:0,scanParts:[],links:[],linkFlash:0,elitesClock:0,activationSerial:0,
};}
/** Read-only ordered links chosen from ready drones, without duplicates.
 * Fewer than five remaining drones can still fire; a completely dark swarm
 * must activate the sun instead. Each linked drone contributes one base unit. */
export function chooseLiberationLinks(state:LiberationState,rng:()=>number=Math.random):number[]{
 const available=state.drones.flatMap((ready,i)=>ready?[i]:[]);if(!available.length)return [];
 const count=Math.min(available.length,5+Math.floor(sample(rng)*6)),chosen:number[]=[];
 for(let i=0;i<count;i++){const j=Math.floor(sample(rng)*available.length);chosen.push(available[j]);available.splice(j,1);}
 return chosen;
}
export function spendLiberationLinks(state:LiberationState,links:readonly number[]):boolean{
 if(state.stage!=='idle'||!links.length||links.length>10||new Set(links).size!==links.length||links.some(i=>!Number.isSafeInteger(i)||i<0||!state.drones[i]))return false;
 for(const i of links)state.drones[i]=false;state.links=[...links];state.linkFlash=.32;return true;
}
/** A single incoming instance consumes one ready drone, regardless of size. */
export function absorbLiberationHit(state:LiberationState,damage:number,rng:()=>number=Math.random):number{
 if(!Number.isFinite(damage)||damage<=0)return 0;
 const available=state.drones.flatMap((ready,i)=>ready?[i]:[]);
 if(available.length){state.drones[available[Math.floor(sample(rng)*available.length)]]=false;return 0;}
 let remaining=damage;
 if(state.dome>0&&remaining>0){const n=Math.min(state.dome,remaining);state.dome-=n;remaining-=n;state.domeDelay=4;}
 return remaining;
}
/** Activation may be rolled per shot or forced by a fully dark swarm. Once
 * started it cannot retrigger until the post-sun recharge has completed. */
export function beginLiberationSun(state:LiberationState,lv:LiberationLevels={},rng:()=>number=Math.random,force=false):boolean{
 if(state.stage!=='idle')return false;
 if(!force&&state.drones.some(Boolean)&&sample(rng)>=liberationOrbChance(lv))return false;
 state.selected=chooseLiberationCharacter(lv,rng);state.stage='forming';state.elapsed=0;state.links=[];return true;
}
/** Advance one bounded frame. Returns the selected world effect exactly once;
 * the caller owns damage, freeze, targeting, visibility and authoritative RNG. */
export function tickLiberation(state:LiberationState,dt:number,hullMax:number,lv:LiberationLevels={}):LiberationCharacter|null{
 if(!Number.isFinite(dt)||dt<0||dt>.25||!Number.isFinite(hullMax)||hullMax<0)throw Error('Invalid Liberation frame');
 state.phase+=dt*(state.stage==='forming'||state.stage==='brightening'?3:1.5);state.linkFlash=Math.max(0,state.linkFlash-dt);
 state.domeDelay=Math.max(0,state.domeDelay-dt);if(!state.domeDelay)state.dome=Math.min(LIBERATION_DOME_MAX,state.dome+50*dt);
 if(state.scanEnemy!==null)state.scanElapsed+=dt;
 if(state.stage==='idle')return null;
 state.elapsed+=dt;
 if(state.stage==='forming'&&state.elapsed>=liberationFormationSeconds(lv)){state.stage='brightening';state.elapsed=0;}
 else if(state.stage==='brightening'&&state.elapsed>=1){state.stage='slamming';state.elapsed=0;}
 else if(state.stage==='slamming'&&state.elapsed>=.3){state.stage='expanding';state.elapsed=0;}
 else if(state.stage==='expanding'&&state.elapsed>=.45){
  const effect=state.selected;state.stage='recharging';state.elapsed=0;state.recharge=0;state.drones.fill(false);state.activationSerial++;return effect;
 } else if(state.stage==='recharging'){
  const previous=Math.floor(state.drones.length*state.recharge/LIBERATION_RECHARGE_SECONDS+1e-9);
  state.recharge=Math.min(LIBERATION_RECHARGE_SECONDS,state.recharge+dt);
  const current=Math.floor(state.drones.length*state.recharge/LIBERATION_RECHARGE_SECONDS+1e-9);
  for(let i=previous;i<current;i++){const next=state.drones.indexOf(false);if(next<0)break;state.drones[next]=true;}
  if(state.recharge>=LIBERATION_RECHARGE_SECONDS){state.drones.fill(true);state.stage='idle';state.elapsed=0;state.selected=null;}
 }
 return null;
}
/** Seven rotating halos with staggered tilt and trailing-center offsets; all
 * turrets and effects use the same world-space positions. */
export function liberationDronePosition(index:number,count:number,phase:number,x:number,y:number):[number,number]{
 const rings=7,ring=index%rings,slot=Math.floor(index/rings),slots=Math.ceil((count-ring)/rings);
 const angle=slot/Math.max(1,slots)*Math.PI*2+phase*(ring%2?-.45:.55)+ring*.71;
 const radius=76+ring*29,tilt=.50+ring*.055,rotation=ring*.56;
 const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius*tilt;
 return [x+px*Math.cos(rotation)-py*Math.sin(rotation),y+px*Math.sin(rotation)+py*Math.cos(rotation)];
}

/** A cursor-contact scan snapshots living component IDs. World integration
 * must verify the target still exists before locking or applying any attacks. */
export function beginLiberationScan(state:LiberationState,enemyId:number,parts:readonly {id:number;alive:boolean}[],duration:number):boolean{
 if(state.stage!=='idle'||!Number.isSafeInteger(enemyId)||!Number.isFinite(duration)||duration<=0||duration>60)return false;
 const ids=parts.filter(p=>p.alive).map(p=>p.id);
 if(!ids.length||ids.length>10000||ids.some(id=>!Number.isSafeInteger(id)||id<0)||new Set(ids).size!==ids.length)return false;
 state.scanEnemy=enemyId;state.scanParts=ids;state.scanElapsed=0;state.scanDuration=duration;return true;
}
export function finishLiberationScan(state:LiberationState,targetAlive:boolean):boolean{
 if(state.scanEnemy===null||state.scanElapsed<state.scanDuration)return false;
 state.lockEnemy=targetAlive?state.scanEnemy:null;state.eliteApproach=0;state.elitesClock=0;state.scanEnemy=null;state.scanParts=[];return targetAlive;
}
/** Elite guard spin: phase normally advances 1.5 rad/s, so this is 4.5 rad/s. */
export function liberationGuardAngle(index:number,phase:number){return index/LIBERATION_ELITES*Math.PI*2+phase*3;}
export function liberationElitePosition(index:number,phase:number,x:number,y:number,radius:number):[number,number]{
 if(!Number.isSafeInteger(index)||index<0||index>=LIBERATION_ELITES)throw Error('Invalid elite index');
 const a=index/LIBERATION_ELITES*Math.PI*2+phase;
 return [x+Math.cos(a)*radius,y+Math.sin(a)*radius];
}
export type LiberationEffectPlan={kind:LiberationCharacter;radius:number;damage:number;coreMultiplier:number;freezeSeconds:number;explosionMaxTier:number};
/** A descriptor only: callers must execute effects in the authoritative world
 * and must not trust a client-submitted plan. */
export function liberationEffectPlan(kind:LiberationCharacter,lv:LiberationLevels={}):LiberationEffectPlan{
 return {kind,radius:liberationOrbRange(lv),damage:liberationOrbDamage(lv),coreMultiplier:liberationCoreMultiplier(lv),freezeSeconds:liberationFreezeSeconds(lv),explosionMaxTier:liberationExplosionMaxTier(lv)};
}

/** Seven separate damped anchors give the halos physical lag. A teleport or
 * respawn resets them rather than stretching them across the map. */
export function moveLiberationHalos(state:LiberationState,dt:number,x:number,y:number){
 if(![dt,x,y].every(Number.isFinite)||dt<0||dt>.25)throw Error('Invalid halo frame');
 const prev=state.lastHaloPlayer;
 if(!state.haloCenters||!prev||Math.hypot(x-prev.x,y-prev.y)>900)state.haloCenters=Array.from({length:7},()=>({x,y}));
 else state.haloCenters.forEach((p,i)=>{const f=1-Math.exp(-(8-i*.65)*dt);p.x+=(x-p.x)*f;p.y+=(y-p.y)*f;const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy),limit=50+i*16;if(d>limit){p.x=x+dx*limit/d;p.y=y+dy*limit/d;}});
 state.lastHaloPlayer={x,y};
}
