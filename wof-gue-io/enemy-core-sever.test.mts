import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';import {SPECIES_LIST,buildEnemy} from './src/game/enemies';
function inside(poly:number[],x:number,y:number,tol=1e-6){for(let i=0;i<poly.length;i+=2){const j=(i+2)%poly.length;const dx=poly[j]-poly[i],dy=poly[j+1]-poly[i+1];if(dx*(y-poly[i+1])-dy*(x-poly[i]) < -tol)return false;}return true;}
for(const species of SPECIES_LIST) for(let tier=0;tier<=6;tier++) {
 const built=buildEnemy(SPECIES_LIST.indexOf(species),tier,42);const core=built.parts[built.coreId];
 const host=core.links.map(id=>built.parts[id]).find(p=>p.kind==='segment'&&Math.hypot(p.cx-core.cx,p.cy-core.cy)<1e-5);assert(host,`${species.id} T${tier}: core host exists`);
 for(const part of [core,...built.parts.filter(p=>p.name==='Core Guard')]) for(let i=0;i<part.poly.length;i+=2)assert(inside(host.poly,part.poly[i],part.poly[i+1]),`${species.id} T${tier}: ${part.name} stays in host`);
 // The chosen regular hex is within 3% of the limiting host edge.
 assert(core.poly.some((_,i)=>i%2===0&&!inside(host.poly,core.cx+(core.poly[i]-core.cx)*1.04,core.cy+(core.poly[i+1]-core.cy)*1.04)),`${species.id} T${tier}: core nearly fills host`);
}
const g:any=new Game(newSave(),'sever'),e=g.makeEnemy(0,2,10000,10000,'test',7);
const core=e.parts[e.coreId];const chain=e.parts.filter((p:any)=>p.id!==e.coreId).slice(0,4);
for(const p of e.parts){p.links=[];if(p!==core&&!chain.includes(p))p.alive=false;}
for(const p of [core,...chain])p.alive=true;
function link(a:any,b:any){a.links.push(b.id);b.links.push(a.id)}
link(core,chain[0]);link(chain[0],chain[1]);link(chain[1],chain[2]);link(chain[2],chain[3]);
let drops=0;g.maybeDrop=()=>{drops++};chain[0].alive=false;g.checkSever(e,true);
assert(chain.slice(1).every((p:any)=>p.alive),'one broken joint does not drop healthy connected pieces');assert.equal(drops,0);
chain[2].alive=false;g.checkSever(e,true);assert(chain[1].alive,'piece before second broken joint stays');assert(!chain[3].alive,'two broken joints sever unsupported section');assert.equal(drops,1,'severed part still gets its drop roll');
g.checkSever(e,true);assert.equal(drops,1,'detached piece is not dropped twice');
console.log('Core geometry fits every species and rarity; healthy parts tolerate one broken joint');
