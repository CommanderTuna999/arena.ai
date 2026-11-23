import { buildEnemy, SPECIES_LIST, type GunKind, type SpeciesDef } from './enemies';
import { baseComponentRates } from './drop-roll';
import type { PartKind } from './data';

export interface BestiaryDrop { name:string; kind:PartKind; minCount:number; maxCount:number; rates:ReturnType<typeof baseComponentRates>; poly:number[] }
const cache=new Map<string,BestiaryDrop[]>();
/** Enumerate the builder's finite optional loadouts, not just one random seed.
 * Body geometry itself is deterministic per species/tier; seed only affects
 * cooldowns and the optional loadout rolls. Counts describe spawned pieces,
 * not a promise of drops or a probability of any one loadout appearing. */
export function bestiaryDrops(sp:SpeciesDef,tier:number):BestiaryDrop[] {
 const key=`${sp.id}:${tier}`,cached=cache.get(key);if(cached)return cached;
 const index=SPECIES_LIST.indexOf(sp);if(index<0 || !Number.isInteger(tier) || tier<0 || tier>6)throw Error('Invalid bestiary species or tier');
 const guns: (GunKind|null)[]=tier>=3 && !sp.armed.gun ? [null,'gun','minigun','scatter','heavy','laser'] : [null];
 const shields=tier>=3 && !sp.armed.shield ? [false,true] : [false];
 const variants:Map<string,{name:string;kind:PartKind;count:number;poly:number[]}>[]=[];
 for(const gun of guns)for(const shield of shields){
  const built=buildEnemy(index,tier,7,{optionalGun:gun!==null,optionalShield:shield,gunKind:gun??'gun'});
  const parts=new Map<string,{name:string;kind:PartKind;count:number;poly:number[]}>();
  for(const p of built.parts){const key=JSON.stringify([p.kind,p.name]);const found=parts.get(key);if(found)found.count++;else parts.set(key,{name:`${sp.name} ${p.name}`,kind:p.kind,count:1,poly:p.poly.map((v,i)=>+(v-(i%2===0?p.cx:p.cy)).toFixed(1))});}
  variants.push(parts);
 }
 const all=new Map<string,{name:string;kind:PartKind;poly:number[]}>();
 for(const variant of variants)for(const [key,part] of variant)all.set(key,part);
 const result=[...all].map(([key,part])=>{
  const counts=variants.map(v=>v.get(key)?.count??0);
  return {name:part.name,kind:part.kind,poly:part.poly,minCount:Math.min(...counts),maxCount:Math.max(...counts),rates:baseComponentRates(tier,part.kind,!!sp.boss)};
 });
 cache.set(key,result);return result;
}
