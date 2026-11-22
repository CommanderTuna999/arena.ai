import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const screen=readFileSync('src/components/StartScreen.tsx','utf8');
assert(screen.includes('Currently playing as a Guest. Login to save progress'));
assert(screen.includes('whitespace-nowrap border-b border-white/10'));
assert(screen.includes('href="https://wofgue-io-multiplayer-2.onrender.com/" target="_blank" rel="noopener noreferrer"'));
assert(screen.includes('MULTIPLAYER TEST'));assert(screen.includes('guest only, no saves'));
console.log('Guest notice stays on one line; multiplayer test is clearly labelled and opens separately');
