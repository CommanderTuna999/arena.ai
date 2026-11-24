/** Authoritative world-effect adapter for People's Liberation.
 * No client data or rendering callback can create or execute an effect. The
 * game supplies enemy references and damage/kill functions in its own context,
 * so the normal kill, credit and multiplayer attribution paths remain in use. */
import {liberationEffectPlan,type LiberationCharacter,type LiberationLevels} from './peoples-liberation';

export type LiberationEnemy={id:number;x:number;y:number;radius:number;tier:number;dead:boolean};
export interface LiberationWorld<E extends LiberationEnemy>{
  /** Snapshot of the authoritative world; the executor copies it before use. */
  enemies:readonly E[];
  /** Fully immobilize and prevent *all* attacks for the given duration. */
  freeze(enemy:E,seconds:number):void;
  /** Apply damage once to the enemy core using the world's owner context. */
  damageCore(enemy:E,damage:number):void;
  /** Destroy the core using the normal defeat/drop and attribution path. */
  destroyCore(enemy:E):void;
  /** Start the golden disassembly visual without bypassing kill attribution. */
  ripApart(enemy:E):void;
}
/** Effects operate once per enemy whose body intersects the blast radius, not
 * once per component. IDs are deduplicated defensively. The result is useful
 * for tests/telemetry only; it is not an award or a network acknowledgement. */
export function executeLiberationEffect<E extends LiberationEnemy>(world:LiberationWorld<E>,kind:LiberationCharacter,x:number,y:number,levels:LiberationLevels={},damageMultiplier=1):number[]{
 if(!Number.isFinite(x)||!Number.isFinite(y)||!['定','死','爆','天'].includes(kind)||!Number.isFinite(damageMultiplier)||damageMultiplier<0)throw Error('Invalid Liberation effect');
 const effect=liberationEffectPlan(kind,levels),seen=new Set<number>(),affected:number[]=[];
 for(const enemy of [...world.enemies]){
  if(!enemy || enemy.dead || !Number.isSafeInteger(enemy.id)||seen.has(enemy.id)||![enemy.x,enemy.y,enemy.radius].every(Number.isFinite)||enemy.radius<0||!Number.isSafeInteger(enemy.tier)||enemy.tier<0||enemy.tier>6)continue;
  seen.add(enemy.id);
  if(Math.hypot(enemy.x-x,enemy.y-y)>effect.radius+enemy.radius)continue;
  if(kind==='爆' && enemy.tier>effect.explosionMaxTier)continue;
  affected.push(enemy.id);
  switch(kind){
   case '定': world.freeze(enemy,effect.freezeSeconds);break;
   case '死': world.damageCore(enemy,effect.damage*effect.coreMultiplier*damageMultiplier);break;
   case '爆': world.destroyCore(enemy);break;
   case '天': world.ripApart(enemy);world.destroyCore(enemy);break;
  }
 }
 return affected;
}
