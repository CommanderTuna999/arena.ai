import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const s=readFileSync('src/components/Bestiary.tsx','utf8');
assert.match(s,/referenceExtent\(\) \* 0\.3/,'portraits use a tenfold magnification from the old 3x extent');
assert(!s.includes('showcase'),'no full-screen hover artwork');
assert.match(s,/place-items-center overflow-hidden rounded-sm border/,'tile clips its artwork');
assert(!s.includes('hover:scale-[1.06]'),'hover does not expand the frame');
console.log('Bestiary portraits stay clipped in enlarged frames');
