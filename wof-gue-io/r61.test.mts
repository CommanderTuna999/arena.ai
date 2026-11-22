import assert from 'node:assert/strict';
import { HP_MUL, DMG_MUL, RARITIES, rollUltra, newSave } from './src/game/data';
import { ARMOUR_HP_MUL, buildEnemy, SPECIES_LIST } from './src/game/enemies';
import { Game } from './src/game/engine';
assert.equal(RARITIES[6].color,'#000000');assert.equal(HP_MUL[6],HP_MUL[5]*135);assert.equal(ARMOUR_HP_MUL[6],16);
assert.equal(DMG_MUL[6], DMG_MUL[5]*135);
assert.equal(rollUltra(5,.00499),6);assert.equal(rollUltra(5,.005),5);assert.equal(rollUltra(4,0),4);
for(let i=0;i<SPECIES_LIST.length;i++) {
 const m=buildEnemy(i,5,12),u=buildEnemy(i,6,12);
 assert(Math.abs(u.size/m.size-3)<1e-9);
 assert(u.parts.every(p=>Number.isFinite(p.maxHp)&&p.maxHp>0),`${SPECIES_LIST[i].name} finite health`);
 const normals=u.parts.filter(p=>p.kind!=='armor');const armor=u.parts.filter(p=>p.kind==='armor');
 if(armor.length && normals.length) {
  // First generic armour plate has 16 times average normal health; variants retain their own multiplier.
  const mean=normals.reduce((n,p)=>n+p.maxHp,0)/normals.length;
  assert(armor.some(p=>p.maxHp/mean > 10 && p.maxHp/mean < 40), `${SPECIES_LIST[i].name} armor scaling`);
 }
 const mCore=m.parts[m.coreId],uCore=u.parts[u.coreId];assert(Math.abs(uCore.maxHp/mCore.maxHp-135)<1e-8);
}
const g=new Game(newSave(),'test') as any;g.admin.on=true;g.adminSpawn(0,6,1);
const e=g.enemies[0];const mythic=g.makeEnemy(0,5,e.x,e.y,'test',12);assert.equal(e.eDmg/mythic.eDmg,135);assert.equal(e.tier,6);assert(g.toasts.some((t:any)=>t.msg.includes('has spawned!')));
const original=Math.random;try {
 Math.random=()=>.5;g.maybeDrop(e,e.parts[e.coreId],e.x,e.y);assert.equal(g.comps.length,1);assert.equal(g.comps[0].c.tier,5);
 Math.random=()=>0;g.maybeDrop(e,e.parts[e.coreId],e.x,e.y);assert.deepEqual(g.comps.slice(-2).map((c:any)=>c.c.tier),[5,6]);
 g.save.name='Ace';g.killEnemy(e,e.x,e.y);assert(g.toasts.some((t:any)=>t.msg.includes('was defeated by Ace!')));
 assert.equal(g.save.bestiary[e.spd.id],6);
} finally {Math.random=original;}
console.log('Ultra rarity tests passed');
