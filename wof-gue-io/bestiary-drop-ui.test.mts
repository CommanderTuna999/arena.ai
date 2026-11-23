import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DropsDialog} from './src/components/Bestiary';
import {bestiaryDrops} from './src/game/bestiary-drops';
import {SPECIES_LIST,buildEnemy} from './src/game/enemies';
import {readFileSync} from 'node:fs';
const sp=SPECIES_LIST.find(s=>s.name==='Widow Spider')!, tier=6;
const drops=bestiaryDrops(sp,tier);const html=renderToStaticMarkup(React.createElement(DropsDialog,{sp,tier,onClose:()=>{}}));
assert(html.includes('role="dialog"')&&html.includes('aria-modal="true"'));
assert(html.includes('Widow Spider Missile Pod'));assert(html.includes('Mythical</span><span>100%'));assert(html.includes('Ultra</span><span>2%'));assert(html.includes('Ultra</span><span>10%'));
assert.equal((html.match(/<polygon /g)??[]).length,drops.length,'one actual piece illustration per named drop');
assert.equal((html.match(/<linearGradient id=/g)??[]).length,drops.length,'ultra images have separate gradient identifiers');
for(const [i,s] of SPECIES_LIST.entries())for(const t of [0,3,6]){
 const candidates=[] as any[];for(const gun of [null,'gun','minigun','scatter','heavy','laser'] as const)for(const shield of [false,true])candidates.push(...buildEnemy(i,t,7,{optionalGun:gun!==null,optionalShield:shield,gunKind:gun??'gun'}).parts);
 for(const d of bestiaryDrops(s,t)){
  assert(d.poly.length>=6&&d.poly.length%2===0&&d.poly.every(Number.isFinite));
  assert(candidates.some(p=>`${s.name} ${p.name}`===d.name&&p.kind===d.kind&&p.poly.every((v:number,j:number)=>+(v-(j%2===0?p.cx:p.cy)).toFixed(1)===d.poly[j])&&p.poly.length===d.poly.length),`${d.name} must use a real component polygon`);
 }
}
const source=readFileSync('src/components/Bestiary.tsx','utf8');assert(source.includes('VIEW DROPS'));assert(source.includes('setDropView({id:sp.id,tier:hover.tier})'));assert(source.includes('if(e.target===e.currentTarget)onClose()'));assert(source.includes("e.key==='Escape'"));
console.log('Drop dialog displays genuine component shapes and distinct rates');
