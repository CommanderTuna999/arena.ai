import assert from 'node:assert/strict';
import {SPECIES_LIST,buildEnemy} from './src/game/enemies';
import {bestiaryDrops} from './src/game/bestiary-drops';
import {baseComponentRates,rollComponentTiers} from './src/game/drop-roll';
import {readFileSync} from 'node:fs';
const spider=SPECIES_LIST.find(s=>s.name==='Widow Spider')!;
const epic=bestiaryDrops(spider,4);
assert(epic.some(d=>d.name==='Widow Spider Missile Pod'&&d.kind==='weapon'),'actual named pod is listed');
assert(epic.some(d=>d.name==='Widow Spider Leg'&&d.kind==='leg'),'limbs are not omitted');
assert(epic.some(d=>d.name==='Widow Spider Shield Generator'&&d.minCount===0),'optional loadouts are included');
assert(epic.some(d=>d.name==='Widow Spider Rotary Gun'&&d.minCount===0),'random turret variants are included');
assert.deepEqual(baseComponentRates(0,'core',false),[{tier:0,chance:.55}]);
assert(Math.abs(baseComponentRates(0,'leg',false)[0].chance-.035)<1e-12);assert.equal(baseComponentRates(0,'leg',false)[1].chance,.3);
assert.deepEqual(baseComponentRates(6,'core',false),[{tier:5,chance:1},{tier:6,chance:.1}]);
assert.deepEqual(baseComponentRates(6,'weapon',false),[{tier:5,chance:1},{tier:6,chance:.02}]);
assert.deepEqual(baseComponentRates(4,'leg',true),[{tier:5,chance:1}]);
assert.deepEqual(rollComponentTiers(6,'core',false,100,1,()=>.099),[5,6]);assert.deepEqual(rollComponentTiers(6,'core',false,100,1,()=>.10),[5]);
assert.deepEqual(rollComponentTiers(6,'weapon',false,100,1,()=>.019),[5,6]);assert.deepEqual(rollComponentTiers(6,'weapon',false,100,1,()=>.02),[5]);
for(const [i,sp] of SPECIES_LIST.entries())for(let tier=0;tier<=6;tier++){
 const drops=bestiaryDrops(sp,tier),names=new Map(drops.map(d=>[`${d.kind}:${d.name}`,d]));
 for(const seed of [0,7,33,999]){
  const actual=new Map<string,number>();for(const p of buildEnemy(i,tier,seed).parts){const key=`${p.kind}:${sp.name} ${p.name}`;actual.set(key,(actual.get(key)??0)+1);}
  for(const [key,count] of actual){const d=names.get(key);assert(d,`${sp.name} tier ${tier}: missing ${key}`);assert(count>=d.minCount&&count<=d.maxCount,`${key} count`);}
  for(const [key,d] of names)assert((actual.get(key)??0)>=d.minCount,`${key} minimum count`);
 }
}
const ui=readFileSync('src/components/Bestiary.tsx','utf8');assert(ui.includes('overflow-y-auto overscroll-contain'));assert(ui.includes('d.rates.map'));assert(!ui.includes('Mythical 100% + Ultra'));
console.log('All enemy part names and optional loadouts are covered; separate component rates match drop rules');
