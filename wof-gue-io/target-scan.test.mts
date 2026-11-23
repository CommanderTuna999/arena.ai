import assert from 'node:assert/strict';
import {createTargetScan,scanPartIndex,scanHighlight} from './src/game/target-scan';
const parts=Array.from({length:45},(_,id)=>({id,alive:true,kind:id===44?'core':'leg'}));const s=createTargetScan(parts);
assert.equal(s.parts.length,44);assert(s.duration>1.05);const seen=new Set<number>();
for(let t=0;t<s.duration-.2;t+=.01){s.elapsed=t;const index=scanPartIndex(s);seen.add(s.parts[index]);assert.equal(scanHighlight(s,index),1);}
assert.equal(seen.size,44,'every live piece is scanned in turn');s.elapsed=s.duration-.1;assert.equal(scanPartIndex(s),-1,'flash locks to the core');
parts[2].alive=false;assert(!createTargetScan(parts).parts.includes(2));
console.log('Target scan highlights every live non-core component and finishes at the core');
