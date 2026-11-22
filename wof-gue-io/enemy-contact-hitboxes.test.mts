import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';import {SPECIES_LIST} from './src/game/enemies';import {distToPoly} from './src/game/math';
const g=new Game(newSave(),'test') as any;const sp=SPECIES_LIST.findIndex(s=>s.id==='scorpion');assert(sp>=0);
const e=g.makeEnemy(sp,0,-50000,-65000,'test',22);e.a=0;e.eDmg=100;
for(const p of e.parts)p.alive=p.name==='Pincer';
const p=e.parts.find((q:any)=>q.alive);const group=e.groups[p.g];group.ang=Math.sin(1)*.05; e.swatCd=100;e.speed=0;e.turn=0;e.abilCd.fill(100);
// Find a shallow overlap on the outer side of a rendered pincer, away from
// the other pincer. The separation step used to erase that overlap before damage.
let found=false;
for(let x=p.cx;x<p.cx+p.r+80&&!found;x+=.1){const y=p.cy;const d=distToPoly(x,y,p.poly);if(d<14.7||d>14.9)continue;
 const c=Math.cos(group.ang),s=Math.sin(group.ang),dx=x-group.px,dy=y-group.py;
 g.player.x=e.x+group.px+dx*c-dy*s;g.player.y=e.y+group.py+dx*s+dy*c;
 if(!g.touching(e,0))continue;
 const before=g.player.hp=1000;g.player.shield=0;g.stats.dodge=0;e.contactCd=0;
 const ex=g.player.x-e.x,ey=g.player.y-e.y;g.updateEnemy(e,.05,ex,ey,Math.hypot(ex,ey));
 assert(g.player.hp<before,'shallow rotated common scorpion pincer contact must hurt');found=true;
}
assert(found,'found an actual pincer overlap');
assert.equal(g.mapMode,2,'focused minimap is the initial mode');g.keyDown('KeyM');assert.equal(g.mapMode,0);g.keyDown('KeyM');assert.equal(g.mapMode,1);g.keyDown('KeyM');assert.equal(g.mapMode,2);
console.log('Rotated common scorpion pincer contact and focused map cycle pass');
// Check polygon centres across species and tiers, using the same group rotation
// as drawing. Excluded core, wing and leg contacts are intentional rules.
for(let i=0;i<SPECIES_LIST.length;i++)for(const tier of [0,3,5]){
 const enemy=g.makeEnemy(i,tier,-50000,-65000,'test',31);enemy.a=.6;enemy.bend=0;
 for(const q of enemy.parts){if(!q.alive||['core','wing','leg'].includes(q.kind))continue;
 const gr=q.g>=0?enemy.groups[q.g]:null;if(gr)gr.ang=.1;
 let x=q.cx,y=q.cy;if(gr){const dx=x-gr.px,dy=y-gr.py,c=Math.cos(gr.ang),s=Math.sin(gr.ang);x=gr.px+dx*c-dy*s;y=gr.py+dx*s+dy*c;}
 const c=Math.cos(enemy.a),s=Math.sin(enemy.a);g.player.x=enemy.x+x*c-y*s;g.player.y=enemy.y+x*s+y*c;
 assert(g.touching(enemy,0),`${enemy.spd.id} tier ${tier} ${q.name} centre should contact`);
 }
}
console.log('Damage-capable part centres checked across all species at common, epic and mythical tiers');
