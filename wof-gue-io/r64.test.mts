import assert from 'node:assert/strict';
import { Game } from './src/game/engine';
import { newSave } from './src/game/data';
import { readFileSync } from 'node:fs';
const r=readFileSync('src/game/render.ts','utf8');
assert(!r.includes('drawDamageNumbers')); assert(!r.includes('ZONE_EDGES.forEach'));
const engine=readFileSync('src/game/engine.ts','utf8'); assert(!engine.includes('damageNumbers'));
const ui=readFileSync('src/components/GameClient.tsx','utf8'); assert(!ui.includes('bg-[#050e16]/97'));
console.log('Damage number and map tests passed');
