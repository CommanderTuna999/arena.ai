import assert from 'node:assert/strict';
import { CHANGELOG, VERSION } from './src/game/changelog';
assert.equal(VERSION, '2.29.4');
for (const entry of CHANGELOG) {
  const [major, minor, patch] = entry.version.split('.').map(Number);
  if (major !== 2 || minor < 12) continue;
  assert.equal(entry.date, minor < 15 || (minor === 15 && patch === 0) ? '21 Nov 2026' : '22 Nov 2026', entry.version);
}
assert.equal(CHANGELOG.find(e => e.version === '2.11.0')?.date, '21 Nov 2026');
console.log('Changelog dates verified');
